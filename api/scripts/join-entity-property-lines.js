/**
 * Joins a decorator call (e.g. `@Column({...})`) that TypeORM entities
 * wrap onto multiple lines back with its property declaration, so each
 * property ends up on a single line. Skips decorators whose body itself
 * spans multiple statements (e.g. relation decorators with a callback +
 * options object) — those are left untouched.
 *
 * Usage: node scripts/join-entity-property-lines.js <file1> [file2 ...]
 */
const fs = require('fs');

const files = process.argv.slice(2);
if (files.length === 0) {
    console.error('Usage: node scripts/join-entity-property-lines.js <file...>');
    process.exit(1);
}

for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\r?\n/);
    const out = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const decoratorStart = /^@\w+\(/.test(trimmed);

        if (!decoratorStart) {
            out.push(line);
            continue;
        }

        // Collect lines until parens are balanced (end of decorator call).
        let buf = trimmed;
        let openParens = (buf.match(/\(/g) || []).length - (buf.match(/\)/g) || []).length;
        let j = i;
        while (openParens > 0 && j + 1 < lines.length) {
            j++;
            const next = lines[j].trim();
            buf += ' ' + next;
            openParens += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
        }

        // Only fold when the very next line is a simple `name: Type;` /
        // `name?: Type;` field declaration (not another decorator, not a
        // multi-line relation body already followed by its own field on
        // a separate line pattern we can't safely fold).
        const fieldLineIdx = j + 1;
        const fieldLine = lines[fieldLineIdx] ? lines[fieldLineIdx].trim() : '';
        const isSimpleField = /^\w+\??:\s*[^;]+;$/.test(fieldLine);

        if (isSimpleField) {
            const indent = line.match(/^\s*/)[0];
            buf = buf.replace(/\s+/g, ' ');
            out.push(`${indent}${buf} ${fieldLine}`);
            i = fieldLineIdx;
        } else {
            // Push the collected decorator lines unchanged.
            for (let k = i; k <= j; k++) out.push(lines[k]);
            i = j;
        }
    }

    fs.writeFileSync(file, out.join('\n'));
    console.log(`Joined property lines in ${file}`);
}
