// Opens a real browser window against the local dev server so you can log in
// by hand (including OTP / passkey flows). Once you land on a page other than
// /account/sign-in, the session (localStorage accessToken/refreshToken +
// cookies) is saved to scripts/.auth/state.json for screenshot.mjs to reuse.
//
// Usage: node scripts/login-and-save-session.mjs [baseUrl]
// Default baseUrl: http://localhost:4002

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const authDir = join(__dirname, '.auth');
const statePath = join(authDir, 'state.json');
const baseUrl = process.argv[2] ?? 'http://localhost:4002';

mkdirSync(authDir, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${baseUrl}/account/sign-in`);

console.log('A browser window opened. Log in normally, then leave the app on any page.');
console.log('Waiting for login to finish (accessToken written to localStorage) ...');

// Multi-step flows (OTP, passkey, etc.) bounce through intermediate hash
// routes that don't contain "sign-in" before the user is actually
// authenticated, so watching the URL alone fires too early. Wait for the
// real signal instead: the app writing accessToken to localStorage.
await page.waitForFunction(() => !!localStorage.getItem('accessToken'), { timeout: 0 });

// let the app finish writing refreshToken and any other session state
await page.waitForTimeout(1500);

await context.storageState({ path: statePath });
console.log(`Session saved to ${statePath}`);

await browser.close();
