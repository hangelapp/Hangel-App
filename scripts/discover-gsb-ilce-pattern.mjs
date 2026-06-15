/**
 * GSB il sayfasında ilçe müdürlükleri menu yapısını keşfet.
 * 3 büyük il (İstanbul, Ankara, İzmir) test et.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAMPLES = [
  ['istanbul', 'İstanbul'],
  ['ankara', 'Ankara'],
  ['izmir', 'İzmir'],
  ['mugla', 'Muğla'],
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: UA,
  locale: 'tr-TR',
  viewport: { width: 1366, height: 850 },
  extraHTTPHeaders: { 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' },
});
await ctx.route('**/*', (route) => {
  const t = route.request().resourceType();
  if (['image', 'font', 'media', 'stylesheet'].includes(t)) return route.abort();
  return route.continue();
});

const output = {};

for (const [slug, name] of SAMPLES) {
  console.log(`\n▸ ${name} (https://${slug}.gsb.gov.tr)`);
  const page = await ctx.newPage();
  try {
    await page.goto(`https://${slug}.gsb.gov.tr/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // İlçe menu link'lerini ara — değişik desenler
    const links = await page.$$eval('a', (as) =>
      as
        .map((a) => ({
          href: a.getAttribute('href') || '',
          text: (a.textContent || '').trim().slice(0, 100),
        }))
        .filter((x) => x.href && x.text)
    );

    // Filtre: "ilçe", "ilce", "müdürlüğü" içerenler
    const ilceLinks = links.filter((l) => {
      const t = l.text.toLocaleLowerCase('tr');
      const h = l.href.toLocaleLowerCase('tr');
      return (
        /ilçe|ilce/.test(t) ||
        /ilce|ilçe/.test(h) ||
        /müdürlü/.test(t) ||
        (h.includes('/sayfalar/') && /ilce|ilçe/.test(h))
      );
    });

    console.log(`  Toplam link: ${links.length}, ilçe ile ilgili: ${ilceLinks.length}`);
    ilceLinks.slice(0, 30).forEach((l) => {
      console.log(`    [${l.href.slice(0, 80)}]  →  ${l.text}`);
    });

    output[slug] = {
      name,
      totalLinks: links.length,
      ilceLinks: ilceLinks.slice(0, 50),
    };
  } catch (e) {
    console.log(`  ! HATA: ${e.message}`);
    output[slug] = { name, error: e.message };
  } finally {
    await page.close();
  }
}

writeFileSync('/tmp/gsb-ilce-pattern.json', JSON.stringify(output, null, 2));
console.log('\n→ /tmp/gsb-ilce-pattern.json');
await browser.close();
