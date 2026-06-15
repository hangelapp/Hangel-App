/**
 * "İlçe Müdürlükleri" sayfa yapısını incele. 3 il sample.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const SAMPLES = [
  { slug: 'ankara', name: 'Ankara', path: '/Sayfalar/585/313/İlçe Müdürlükleri.aspx' },
  { slug: 'istanbul', name: 'İstanbul', path: '/Sayfalar/1190/347/İlçe Müdürlükleri.aspx' },
  { slug: 'mugla', name: 'Muğla', path: '/Sayfalar/1532/366/İlçe Müdürlükleri.aspx' },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'tr-TR',
  viewport: { width: 1366, height: 850 },
});
await ctx.route('**/*', (route) => {
  const t = route.request().resourceType();
  if (['image', 'font', 'media', 'stylesheet'].includes(t)) return route.abort();
  return route.continue();
});

for (const { slug, name, path } of SAMPLES) {
  console.log(`\n═══ ${name} ═══`);
  const page = await ctx.newPage();
  try {
    const url = `https://${slug}.gsb.gov.tr${path}`;
    console.log(`URL: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const html = await page.content();
    console.log(`HTML size: ${html.length}`);

    // İçerik selector'ları
    const containers = await page.$$eval('.col-content, .sayfaIcerik, main, article, #content, .container', (els) =>
      els.map((el) => ({ tag: el.tagName.toLowerCase(), cls: el.className, len: el.textContent?.length || 0 }))
    );
    console.log('Containers:', containers);

    // İçerik metni — başlıklar + ilçe linkleri
    const text = await page.locator('.col-content, .sayfaIcerik, main').first().textContent().catch(() => null);
    if (text) {
      console.log('\n--- ICERIK METNI (ilk 2000 char) ---');
      console.log(text.slice(0, 2000).replace(/\s+/g, ' '));
    }

    // Tablo/p/li yapısı için ilk 50 elemanın text özetini al
    const cells = await page.$$eval('table td, table th, .col-content p, .col-content li, .sayfaIcerik p, .sayfaIcerik li', (els) =>
      els.map((el) => el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200)).filter(Boolean).slice(0, 80)
    );
    console.log('\n--- CELLS (top 80) ---');
    cells.forEach((c, i) => console.log(`  [${i}] ${c}`));

    // Çıktıyı dosyaya yaz
    writeFileSync(`/tmp/gsb-ilce-${slug}.html`, html);
    console.log(`→ /tmp/gsb-ilce-${slug}.html`);
  } catch (e) {
    console.log(`! HATA: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
