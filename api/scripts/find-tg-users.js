const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function findUsers() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123vorn',
        database: process.env.DB_NAME || 'pms_db',
    });

    try {
        await client.connect();
        const r = await client.query('SELECT id, name_kh, name_en, telegram_id, telegram_username FROM "user"."user" WHERE telegram_id IS NOT NULL');
        console.log('Linked Telegram Users in DB:', r.rows);
        await client.end();
        return r.rows;
    } catch (e) {
        console.error('DB Error:', e.message);
    }
}
findUsers();
