// Captures a screenshot of a page in the running dev server, reusing the
// logged-in session saved by login-and-save-session.mjs.
//
// Usage: node scripts/screenshot.mjs <path-or-url> <output-file.png> [--full-page]
// Example: node scripts/screenshot.mjs /task-manager/tasks/123 report/proof-1.png --full-page

import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const statePath = join(__dirname, '.auth', 'state.json');

const [, , target, outFile, ...rest] = process.argv;
const fullPage = rest.includes('--full-page');

if (!target || !outFile) {
    console.error('Usage: node scripts/screenshot.mjs <path-or-url> <output-file.png> [--full-page]');
    process.exit(1);
}

const url = /^https?:\/\//.test(target) ? target : `http://localhost:4002${target}`;

const hasSession = existsSync(statePath);
if (!hasSession) {
    console.warn(`No saved session at ${statePath} — capturing without login. Run: node scripts/login-and-save-session.mjs`);
}

mkdirSync(dirname(resolve(outFile)), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(hasSession ? { storageState: statePath } : {})
});
const page = await context.newPage();

await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: outFile, fullPage });

console.log(`Saved screenshot to ${outFile}`);

await browser.close();
