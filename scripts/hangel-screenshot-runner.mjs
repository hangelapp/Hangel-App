/**
 * Chrome Web Store için 5 adet 1280×800 mockup screenshot üretir.
 * Mockup HTML'leri chrome-extension/store-listing/ altında kalıcı.
 * Çıktı: ~/Desktop/hangel-store-{1..5}.png
 */
import { chromium } from 'playwright';
import { homedir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const DESKTOP = resolve(homedir(), 'Desktop');
const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCKUPS = resolve(__dirname, '..', 'chrome-extension', 'store-listing');

const TASKS = [
  { name: 'hangel-store-1-balon.png',     file: 'mockup-1-balon.html' },
  { name: 'hangel-store-2-popup.png',     file: 'mockup-2-popup.html' },
  { name: 'hangel-store-3-markalar.png',  file: 'mockup-3-markalar.html' },
  { name: 'hangel-store-4-stk-secim.png', file: 'mockup-4-stk-secim.html' },
  { name: 'hangel-store-5-dashboard.png', file: 'mockup-5-dashboard.html' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});

for (const t of TASKS) {
  const page = await ctx.newPage();
  try {
    const url = `file://${resolve(MOCKUPS, t.file)}`;
    console.log(`▸ ${t.name} ← ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(400);
    const path = resolve(DESKTOP, t.name);
    await page.screenshot({ path, fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    console.log(`  ✓ ${path}`);
  } catch (e) {
    console.error(`  ✗ ${t.name}:`, e.message);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log('\nTamam. 5 screenshot ~/Desktop klasoründe.');
