/**
 * Collapses a @ManyToOne(...) decorator call that spans multiple lines
 * (its options object wrapped) into a single unwrapped line.
 *
 * Usage: node scripts/collapse-manytoone.js <file1> [file2 ...]
 */
const fs = require('fs');

const files = process.argv.slice(2);
if (files.length === 0) {
    console.error('Usage: node scripts/collapse-manytoone.js <file...>');
    process.exit(1);
}

for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\r?\n/);
    const out = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!/^@ManyToOne\(/.test(trimmed)) {
            out.push(line);
            continue;
        }

        let buf = trimmed;
        let openParens = (buf.match(/\(/g) || []).length - (buf.match(/\)/g) || []).length;
        let j = i;
        while (openParens > 0 && j + 1 < lines.length) {
            j++;
            const next = lines[j].trim();
            buf += ' ' + next;
            openParens += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
        }

        const indent = line.match(/^\s*/)[0];
        buf = buf.replace(/\s+/g, ' ').replace(/,\s*\}/g, ' }').replace(/\{\s*/g, '{ ');
        out.push(`${indent}${buf}`);
        i = j;
    }

    fs.writeFileSync(file, out.join('\n'));
    console.log(`Collapsed @ManyToOne in ${file}`);
}
