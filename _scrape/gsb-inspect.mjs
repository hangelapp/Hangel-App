import { chromium } from 'playwright';

const url = process.argv[2];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  locale: 'tr-TR',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(10000);
try { await page.waitForLoadState('networkidle', { timeout: 25000 }); } catch {}

const text = await page.evaluate(() => document.body?.innerText || '');
console.log('LEN', text.length);
console.log(text);
console.log('---');
const html = await page.content();
console.log('HTMLLEN', html.length);
// Try to find Adres/iletisim hints
const idx = html.search(/Adres|adres|Telefon|telefon|İletişim|Tel\s*:/i);
console.log('first hint idx', idx);
if (idx >= 0) console.log(html.slice(Math.max(0,idx-100), idx+1500));
await browser.close();
