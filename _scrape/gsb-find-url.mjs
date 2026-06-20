import { chromium } from 'playwright';

const sub = process.argv[2] || 'adana';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  locale: 'tr-TR',
});
const page = await ctx.newPage();
await page.goto(`https://${sub}.gsb.gov.tr`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}

const links = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.textContent?.trim() })).filter(x => /iletisim|İletişim|iletişim|İLETİŞİM/i.test(x.href + ' ' + x.text)));
console.log(JSON.stringify(links, null, 2));

// Also probe direct /iletisim, /tr/iletisim, etc
const probes = ['/Sayfalar/1952/-1/iletisim', '/Sayfalar/1952/313/iletisim.aspx', '/iletisim', '/tr/iletisim'];
for (const p of probes) {
  try {
    const r = await page.goto(`https://${sub}.gsb.gov.tr${p}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4500);
    const t = await page.evaluate(() => document.body?.innerText?.slice(0, 400) || '');
    console.log(`-- ${p} status=${r?.status()} len=${t.length}`);
    console.log(t.replace(/\n+/g, ' ').slice(0, 300));
  } catch (e) {
    console.log(`-- ${p} ERR ${e.message}`);
  }
}
await browser.close();
