// ===========================================================================
// One-off / rerunnable utility: bulk-import a starter sticker pack from
// Twemoji (CC-BY 4.0, https://github.com/jdecked/twemoji) via jsDelivr's
// GitHub CDN, through the same file-upload pipeline chat attachments use.
//
// Usage:  npx ts-node -r tsconfig-paths/register scripts/import-twemoji-stickers.ts
//
// Idempotent: skips the pack (and any sticker already present under it) if
// re-run. Applies the chat-sticker-gif.sql migration first if not already
// applied.
// ===========================================================================
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PACK_NAME = 'Twemoji';
const PACK_NAME_KH = 'ស្ទីកគ័រលំនាំដើម';

// [codepoint, alt-name] — all verified to exist at the CDN path below.
const EMOJI: [string, string][] = [
    ['1f600', 'grinning'], ['1f603', 'smiley'], ['1f604', 'smile'], ['1f601', 'grin'],
    ['1f606', 'laughing'], ['1f605', 'sweat_smile'], ['1f602', 'joy'], ['1f642', 'slightly_smiling'],
    ['1f609', 'wink'], ['1f60a', 'blush'], ['1f60d', 'heart_eyes'], ['1f618', 'kiss'],
    ['1f60b', 'yum'], ['1f917', 'hugging'], ['1f914', 'thinking'], ['1f644', 'rolling_eyes'],
    ['1f634', 'sleeping'], ['1f622', 'cry'], ['1f62d', 'sob'], ['1f631', 'scream'],
    ['1f621', 'rage'], ['1f480', 'skull'], ['1f47b', 'ghost'], ['1f973', 'partying'],
    ['1f44d', 'thumbs_up'], ['1f44e', 'thumbs_down'], ['1f44f', 'clap'], ['1f64c', 'raised_hands'],
    ['1f64f', 'pray'], ['270c', 'victory'], ['1f4aa', 'muscle'], ['2764', 'heart'],
    ['1f525', 'fire'], ['1f389', 'tada'], ['2728', 'sparkles'], ['1f4af', 'hundred'],
    ['2705', 'check'], ['1f440', 'eyes'], ['1f680', 'rocket'],
];

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72';

function getFileApiBaseUrl(): string {
    const baseUrl = (process.env.FILE_BASE_URL ?? '').trim().replace(/\/+$/, '');
    const apiHostUrl = baseUrl.replace('://file-v4.', '://file-v4-api.');
    return apiHostUrl.endsWith('/api') ? apiHostUrl : `${apiHostUrl}/api`;
}

function getAuthHeader(): string {
    const username = (process.env.FILE_USERNAME ?? '').trim();
    const password = (process.env.FILE_PASSWORD ?? '').trim();
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function uploadToFileApi(buffer: Buffer, filename: string): Promise<{ uri: string; mimetype: string; size: number }> {
    const fileBaseUrl = getFileApiBaseUrl();
    const key = (process.env.FILE_KEY ?? '').trim().replace(/^['"]|['"]$/g, '');

    const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const form = new FormData();
    form.append('folder', 'sticker');
    if (key) form.append('key', key);
    form.append('file', new Blob([bytes], { type: 'image/png' }), filename);

    const res = await fetch(`${fileBaseUrl}/file/upload-single`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader() },
        body: form,
    });
    if (!res.ok) throw new Error(`file upload failed (${res.status}): ${await res.text()}`);
    const json: any = await res.json();
    const uploaded = json?.data;
    if (!uploaded?.uri) throw new Error(`file upload response missing uri: ${JSON.stringify(json)}`);
    return { uri: uploaded.uri, mimetype: uploaded.mimetype ?? 'image/png', size: uploaded.size ?? buffer.length };
}

async function main() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    await client.connect();
    console.log('Connected to', process.env.DB_HOST, process.env.DB_DATABASE);

    try {
        const migrationSql = fs.readFileSync(
            path.resolve(__dirname, '../src/database/sql/chat-sticker-gif-2026-07-25.sql'),
            'utf8',
        );
        await client.query(migrationSql);
        console.log('Migration applied (or already up to date).');

        let packId: string;
        const existingPack = await client.query(
            `SELECT id FROM "chat"."sticker_pack" WHERE name = $1 AND deleted_at IS NULL LIMIT 1`,
            [PACK_NAME],
        );
        if (existingPack.rows.length) {
            packId = existingPack.rows[0].id;
            console.log('Pack already exists:', packId);
        } else {
            const inserted = await client.query(
                `INSERT INTO "chat"."sticker_pack" (name, name_kh, sort_order, is_active, created_at, updated_at)
                 VALUES ($1, $2, 0, true, now(), now()) RETURNING id`,
                [PACK_NAME, PACK_NAME_KH],
            );
            packId = inserted.rows[0].id;
            console.log('Created pack:', packId);
        }

        let added = 0, skipped = 0, failed = 0;
        for (let i = 0; i < EMOJI.length; i++) {
            const [codepoint, altName] = EMOJI[i];
            const filename = `${altName}.png`;

            const existing = await client.query(
                `SELECT s.id FROM "chat"."sticker" s
                 JOIN "file"."file" f ON f.id = s.file_id
                 WHERE s.pack_id = $1 AND f.title = $2 LIMIT 1`,
                [packId, filename],
            );
            if (existing.rows.length) { skipped++; continue; }

            try {
                const res = await fetch(`${CDN_BASE}/${codepoint}.png`);
                if (!res.ok) throw new Error(`CDN fetch failed (${res.status})`);
                const buffer = Buffer.from(await res.arrayBuffer());

                const uploaded = await uploadToFileApi(buffer, filename);

                const fileRow = await client.query(
                    `INSERT INTO "file"."file"
                        (title, extention, type, size, ref_table, uri, file_domain, active, created_by, created_datetime, updated_datetime)
                     VALUES ($1, 'png', $2, $3, 'sticker', $4, $5, '1', 'system-import-twemoji', now(), now())
                     RETURNING id`,
                    [filename, uploaded.mimetype, uploaded.size, uploaded.uri, process.env.FILE_BASE_URL ?? ''],
                );
                const fileId = fileRow.rows[0].id;

                await client.query(
                    `INSERT INTO "chat"."sticker" (pack_id, file_id, sort_order, is_active, created_at)
                     VALUES ($1, $2, $3, true, now())`,
                    [packId, fileId, i],
                );
                added++;
                console.log(`  + ${filename}`);
            } catch (err: any) {
                failed++;
                console.warn(`  ! ${filename} failed: ${err.message}`);
            }
        }

        console.log(`\nDone. added=${added} skipped=${skipped} failed=${failed}`);
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
