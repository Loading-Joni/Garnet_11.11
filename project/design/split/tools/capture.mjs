import { chromium } from 'file:///C:/Users/Жека/.qoder/tools/replica-test-env/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:8777/';
const PAGES = ['all-on-4', 'implants', 'veneers'];
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const p of PAGES) {
  const page = await browser.newPage({ viewport: { width: 2535, height: 1310 }, deviceScaleFactor: 1 });
  await page.goto(BASE + p + '.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${p}-top.png` });

  for (const [sel, name] of [['#calculator', 'calc'], ['.gallery-grid', 'gallery'], ['#prices', 'prices'], ['#faq', 'faq']]) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${OUT}/${p}-${name}.png` });
    }
  }
  await page.close();

  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.goto(BASE + p + '.html', { waitUntil: 'load' });
  await m.waitForTimeout(1000);
  await m.screenshot({ path: `${OUT}/${p}-mobile.png` });
  await m.locator('#calculator').scrollIntoViewIfNeeded();
  await m.waitForTimeout(400);
  await m.screenshot({ path: `${OUT}/${p}-mobile-calc.png` });
  await m.close();
  console.log(p, 'снято');
}

await browser.close();
console.log('готово');
