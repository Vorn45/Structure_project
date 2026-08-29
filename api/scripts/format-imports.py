#!/usr/bin/env python3
"""
Reformat TypeScript imports under api/src/app into the project's
3-group layout with a globally-aligned `from` keyword.

Groups:
  - Core Library         : @nestjs/*, rxjs, reflect-metadata, Node built-ins
  - Third Party Library  : any other npm package
  - Custom Library       : relative paths (./, ../) and aliases (@app/, @config/, @database/, @models/)

Usage:
    python3 scripts/format-imports.py [path]   # default: src/app
    python3 scripts/format-imports.py --dry    # parse only, no writes

The formatter is idempotent — re-running on a formatted file is a no-op.
See CLAUDE.md ("Import formatting") for the full rule.
"""
import os, re, sys

DEFAULT_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "app")

DRY = '--dry' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
ROOT = args[0] if args else DEFAULT_ROOT

CORE_RE = re.compile(r'^(@nestjs/|@nest/|rxjs(?:/|$)|reflect-metadata$)')
NODE_BUILTINS = {
    'fs', 'path', 'crypto', 'util', 'os', 'http', 'https', 'url', 'stream', 'events',
    'child_process', 'process', 'buffer', 'querystring', 'zlib', 'tls', 'net', 'dns',
    'cluster', 'assert', 'readline', 'tty', 'dgram', 'string_decoder', 'timers', 'v8',
    'vm', 'worker_threads', 'async_hooks', 'perf_hooks', 'fs/promises'
}
CUSTOM_PREFIXES = ('@app/', '@config/', '@database/', '@models/', './', '../', 'src/')

HEADER_CORE   = '// ===========================================================================>> Core Library'
HEADER_THIRD  = '// ===========================================================================>> Third Party Library'
HEADER_CUSTOM = '// ===========================================================================>> Custom Library'
CODE_START    = '// ======================================= >> Code Starts Here << ========================== //'

CUSTOM_SUB_ORDER = ['core', 'infra', 'resources', 'local']
CUSTOM_SUB_HEADER = {
    'core':      '// > Core',
    'infra':     '// > Infrastructure',
    'resources': '// > Resources',
    'local':     '// > Local',
}
CORE_ALIASES_API = {'@config', '@database', '@models'}
SUB_HEADER_RE = re.compile(r'^\s*//\s*>\s*(Core|Infrastructure|Resources|Local)\s*$', re.IGNORECASE)


def classify_custom(spec: str) -> str:
    parts = spec.split('/')
    for p in parts:
        if p == 'infrastructure':
            return 'infra'
        if p == 'resources':
            return 'resources'
        if p == 'core' or p in CORE_ALIASES_API:
            return 'core'
    return 'local'

SECTION_RE   = re.compile(r'^\s*//\s*=+>?>?\s*(Core Library|Third Party Library|Custom Library)\s*$', re.IGNORECASE)
CODESTART_RE = re.compile(r'^\s*//\s*=+\s*>>\s*Code Starts Here\b', re.IGNORECASE)
SUBHEADER_RE = re.compile(r'^\s*//\s*>\s*(Core|Infrastructure|Resources|Local)\s*$', re.IGNORECASE)


def classify(spec):
    if CORE_RE.match(spec):
        return 'core'
    head = spec.split('/')[0]
    if spec in NODE_BUILTINS or head in NODE_BUILTINS:
        return 'core'
    if spec.startswith(CUSTOM_PREFIXES):
        return 'custom'
    return 'third'


def collapse_single_line(stmt):
    if '\n' not in stmt:
        return stmt
    if any('//' in l or '/*' in l for l in stmt.split('\n')):
        return stmt
    one = ' '.join(l.strip() for l in stmt.split('\n'))
    one = re.sub(r'\{\s+', '{ ', one)
    one = re.sub(r'\s+\}', ' }', one)
    one = re.sub(r'\s*,\s*', ', ', one)
    one = re.sub(r'\s+', ' ', one).strip()
    return one if len(one) <= 200 else stmt


def _next_nonblank_noncomment_is_import(lines, start):
    k = start
    n = len(lines)
    while k < n:
        s = lines[k].strip()
        if not s or s.startswith('//') or s.startswith('/*'):
            k += 1
            continue
        return s.startswith('import ')
    return False


def parse_top(lines):
    imports = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        s = line.strip()
        if not s:
            i += 1
            continue
        if SECTION_RE.match(line) or CODESTART_RE.match(line) or SUBHEADER_RE.match(line):
            i += 1
            continue
        if (s.startswith('//') or s.startswith('/*')) and _next_nonblank_noncomment_is_import(lines, i + 1):
            i += 1
            continue
        if s.startswith('import '):
            stmt = [line.rstrip('\n')]
            j = i
            while ';' not in stmt[-1] and j + 1 < n:
                nxt = lines[j + 1].strip()
                if not nxt:
                    break
                if nxt.startswith((
                    'import ', 'export ', '@', '//', '/*',
                    'class ', 'function ', 'const ', 'let ', 'var ',
                    'interface ', 'type ', 'enum ',
                )):
                    break
                j += 1
                stmt.append(lines[j].rstrip('\n'))
            i = j + 1
            full = '\n'.join(stmt)
            if not full.rstrip().endswith(';'):
                full = full.rstrip() + ';'
            m = re.search(r"from\s+['\"]([^'\"]+)['\"]", full)
            spec = m.group(1) if m else None
            if not spec:
                m2 = re.match(r"\s*import\s+['\"]([^'\"]+)['\"]", full)
                spec = m2.group(1) if m2 else None
            if not spec:
                return None, 0
            imports.append((full, spec))
            continue
        break
    return imports, i


def _group_width(stmts):
    widths = [
        len(s[:s.rfind(' from ')].rstrip())
        for s in stmts
        if '\n' not in s and ' from ' in s
    ]
    return max(widths) if widths else 0


def _align(stmts, max_pre):
    out = []
    for s in stmts:
        if '\n' in s or ' from ' not in s:
            out.append(s)
            continue
        idx = s.rfind(' from ')
        pre = s[:idx].rstrip()
        post = s[idx + 1:]
        out.append(pre + ' ' * (max_pre - len(pre) + 1) + post)
    return out


def emit_group(header, stmts):
    if not stmts:
        return []
    out = [header]
    out.extend(_align(stmts, _group_width(stmts)))
    out.append('')
    return out


def emit_custom_group(stmts_with_spec):
    """Emit Custom Library with sub-classification (Core/Infra/Resources/Local)."""
    if not stmts_with_spec:
        return []
    sub = {k: [] for k in CUSTOM_SUB_ORDER}
    for stmt, spec in stmts_with_spec:
        sub[classify_custom(spec)].append(stmt)
    out = [HEADER_CUSTOM]
    first = True
    for key in CUSTOM_SUB_ORDER:
        if not sub[key]:
            continue
        if not first:
            out.append('')
        first = False
        out.append(CUSTOM_SUB_HEADER[key])
        out.extend(_align(sub[key], _group_width(sub[key])))
    out.append('')
    return out


def reformat(path):
    with open(path, 'r', encoding='utf-8-sig') as f:
        text = f.read()
    if 'import ' not in text:
        return False
    lines = text.split('\n')

    pre_idx = 0
    while pre_idx < len(lines):
        ln = lines[pre_idx]
        s = ln.strip()
        if s.startswith('import ') or SECTION_RE.match(ln) or CODESTART_RE.match(ln) or not s:
            break
        pre_idx += 1
    pre_lines = lines[:pre_idx]

    rest = lines[pre_idx:]
    imports, consumed = parse_top(rest)
    if imports is None or not imports:
        return False

    after = rest[consumed:]
    while after and (not after[0].strip() or CODESTART_RE.match(after[0])):
        after.pop(0)

    groups = {'core': [], 'third': [], 'custom': []}
    custom_specs = []
    for stmt, spec in imports:
        g = classify(spec)
        collapsed = collapse_single_line(stmt)
        if g == 'custom':
            groups['custom'].append(collapsed)
            custom_specs.append(spec)
        else:
            groups[g].append(collapsed)

    has_single = any(
        '\n' not in s and ' from ' in s
        for g in groups.values()
        for s in g
    )
    if not has_single:
        return False

    out = []
    if pre_lines:
        while pre_lines and not pre_lines[-1].strip():
            pre_lines.pop()
        if pre_lines:
            out.extend(pre_lines)
            out.append('')

    out += emit_group(HEADER_CORE,   groups['core'])
    out += emit_group(HEADER_THIRD,  groups['third'])
    out += emit_custom_group(list(zip(groups['custom'], custom_specs)))

    if out and out[-1] != '':
        out.append('')
    out.append(CODE_START)
    out.extend(after)

    new_text = '\n'.join(out).rstrip('\n') + '\n'
    if new_text == text:
        return False
    if not DRY:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_text)
    return True


def main():
    changed = 0
    total = 0
    for dirpath, _, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith('.ts'):
                continue
            total += 1
            p = os.path.join(dirpath, fn)
            try:
                if reformat(p):
                    changed += 1
            except Exception as e:
                print(f"ERR {p}: {e}", file=sys.stderr)
    label = "would update" if DRY else "updated"
    print(f"{changed}/{total} files {label}")


if __name__ == '__main__':
    main()
