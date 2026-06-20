import { chromium } from 'playwright';

const url = process.argv[2] || 'https://ankara.gsb.gov.tr';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'tr-TR',
});
const page = await ctx.newPage();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch {}
} catch (e) {
  console.error('goto err', e.message);
}
const allHrefs = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.textContent?.trim().slice(0, 80) })));
const ile = allHrefs.filter(x => /iletisim|İletişim|iletişim/i.test(x.href + ' ' + x.text));
const html = await page.content();
console.log(JSON.stringify({ url: page.url(), title: await page.title(), htmlLen: html.length, totalLinks: allHrefs.length, iletisim: ile.slice(0,30) }, null, 2));
console.log('--- sample first 60 links ---');
console.log(JSON.stringify(allHrefs.slice(0, 60), null, 2));
await browser.close();
