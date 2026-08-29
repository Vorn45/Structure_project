/**
 * Expands a collapsed single-line named import (e.g. from 'typeorm') with
 * 3+ symbols back into one-symbol-per-line, matching the codebase's
 * established import style. Only rewrites lines matching
 * `import { A, B, ... } from '...';` that exceed a length threshold.
 *
 * Usage: node scripts/expand-entity-imports.js <file1> [file2 ...]
 */
const fs = require('fs');

const files = process.argv.slice(2);
if (files.length === 0) {
    console.error('Usage: node scripts/expand-entity-imports.js <file...>');
    process.exit(1);
}

const importRe = /^import \{([^}]+)\} from '([^']+)';$/;

for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\r?\n/);
    const out = [];

    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(importRe);
        const symbols = match ? match[1].split(',').map((s) => s.trim()).filter(Boolean) : [];

        if (match && symbols.length >= 3 && trimmed.length > 100) {
            out.push('import {');
            for (const sym of symbols) out.push(`    ${sym},`);
            out.push(`} from '${match[2]}';`);
        } else {
            out.push(line);
        }
    }

    fs.writeFileSync(file, out.join('\n'));
    console.log(`Expanded imports in ${file}`);
}
