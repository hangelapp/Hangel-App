import { chromium } from 'playwright';

const subdomain = process.argv[2] || 'ankara';
const url = `https://${subdomain}.gsb.gov.tr/Sayfalar/1952/-1/iletisim`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'tr-TR',
});
const page = await ctx.newPage();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch {}
} catch (e) {
  console.error('goto err', e.message);
}
const title = await page.title();
// Try main content
let mainText = '';
const sel = ['main', '#main', '.icerik', '.content', '#content', '.iletisim', 'article', 'body'];
for (const s of sel) {
  const el = await page.$(s);
  if (el) {
    mainText = (await el.innerText()).slice(0, 4000);
    if (mainText && mainText.length > 100) break;
  }
}
console.log('URL:', page.url());
console.log('TITLE:', title);
console.log('---');
console.log(mainText);
console.log('---HTML SNIPPET---');
const html = await page.content();
// Find iletisim block
const match = html.match(/iletisim[\s\S]{0,4000}/i);
console.log((match ? match[0] : html.slice(0, 4000)).slice(0, 4000));
await browser.close();
