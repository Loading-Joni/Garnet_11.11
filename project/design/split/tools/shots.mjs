import { chromium } from 'file:///C:/Users/Жека/.qoder/tools/replica-test-env/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:8777/';
const PAGES = ['all-on-4', 'implants', 'veneers'];
const browser = await chromium.launch();

for (const p of PAGES) {
  const page = await browser.newPage({ viewport: { width: 2535, height: 1310 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(BASE + p + '.html', { waitUntil: 'load' });
  await page.waitForTimeout(900);

  const atLoad = await page.locator('#request-calculation').inputValue();
  const amount0 = (await page.locator('.amount').first().textContent())?.trim();
  const lines = await page.locator('.result .result-line').allTextContents();

  const mats = page.locator('.material');
  const n = await mats.count();
  if (n > 1) { await mats.nth(n - 1).click(); await page.waitForTimeout(250); }
  const amount1 = (await page.locator('.amount').first().textContent())?.trim();
  const after = await page.locator('#request-calculation').inputValue();

  console.log(`\n=== ${p}`);
  console.log('ошибки:', errors.length ? errors.join(' | ') : 'нет');
  console.log('при загрузке ->', amount0, '| поле:', JSON.stringify(atLoad));
  console.log('после клика ->', amount1, '| поле:', JSON.stringify(after));
  console.log('строки:', JSON.stringify(lines));
  await page.close();
}
await browser.close();
