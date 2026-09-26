// Verifies raw static hosting (GitHub Pages), without Vite transforming imports.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const url = process.argv[2] || 'http://127.0.0.1:5175/';
await mkdir('output', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    assert.ok(await page.locator('[data-action="new"]').isVisible(), 'home must render');
    await page.locator('[data-action="new"]').click();
    await page.locator('[data-action="choose-yi"]').click();
    await page.locator('#plague-name').fill('静态验收');
    await page.locator('#name-form button[type="submit"]').click();
    for (let i = 0; i < 9; i++) await page.locator('[data-action="prologue-next"]').click();
    await page.locator('[data-action="first-disease"][data-id="cold_plague"]').click();
    assert.equal(await page.locator('[data-macro]').count(), 6);
    await page.locator('[data-macro="hedong"]').click();
    await page.locator('[data-action="enter-macro"]').click();
    await page.locator('[data-region="he_dong"]').click();
    assert.ok(await page.locator('[data-action="drop"]').isVisible());
    if (viewport.width < 1024) assert.ok(await page.locator('.dossier-close-label').isVisible());
    await page.screenshot({ path: `output/static-${viewport.width}.png` });
    assert.deepEqual(errors, [], 'no browser errors');
    await page.close();
  }
  console.log(`PASS static desktop/mobile startup, realm, region, dossier: ${url}`);
} finally { await browser.close(); }
