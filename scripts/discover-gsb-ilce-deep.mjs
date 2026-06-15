/**
 * 8 boş il için DERIN diagnostic:
 * - Homepage'i tam yükle (5s wait)
 * - Tüm <a> tag'lerini dump et + visible/hidden
 * - Dropdown menüsünü hover et (Kurumsal)
 * - sitemap.xml, robots.txt kontrol
 * - Doğrudan /Sayfalar/ üzerinde brute force ID dene (300-1700)
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const SAMPLES = [
  ['adana', 'Adana'],
  ['bursa', 'Bursa'],
  ['antalya', 'Antalya'],
  ['kayseri', 'Kayseri'],
  ['konya', 'Konya'],
  ['sakarya', 'Sakarya'],
  ['mersin', 'Mersin'],
  ['ordu', 'Ordu'],
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

const findings = {};

for (const [slug, name] of SAMPLES) {
  console.log(`\n═════ ${name.toUpperCase()} ═════`);
  const page = await ctx.newPage();
  try {
    const base = `https://${slug}.gsb.gov.tr`;
    // 1. Homepage uzun bekle
    await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(5000);

    // 2. Tüm linkler — text+href+visible
    const allLinks = await page.$$eval('a', (as) =>
      as.map((a) => {
        const r = a.getBoundingClientRect();
        return {
          href: a.getAttribute('href') || '',
          text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
          visible: r.width > 0 && r.height > 0,
        };
      }).filter((x) => x.href)
    );
    const ilceLinks = allLinks.filter((l) => /il[çc]e/i.test(l.text) || /il[çc]e/i.test(l.href));
    console.log(`  ${allLinks.length} link, ${ilceLinks.length} ilçe ile ilgili (visible/hidden)`);
    ilceLinks.slice(0, 10).forEach((l) => console.log(`    [vis=${l.visible}] [${l.href.slice(0, 90)}] ${l.text}`));

    // 3. Sitemap.xml dene
    try {
      const sm = await page.goto(base + '/sitemap.xml', { timeout: 15000 });
      if (sm && sm.status() === 200) {
        const text = await page.content();
        const ilceMatches = text.match(/<loc>([^<]*[Iİi]l[çc]e[^<]*)<\/loc>/gi) || [];
        console.log(`  sitemap: ${ilceMatches.length} ilçe URL`);
        ilceMatches.slice(0, 5).forEach((m) => console.log(`    ${m}`));
      } else {
        console.log(`  sitemap: HTTP ${sm?.status() || 'none'}`);
      }
    } catch (e) {
      console.log(`  sitemap: HATA ${e.message}`);
    }

    findings[slug] = {
      name,
      ilceLinks: ilceLinks.slice(0, 5),
      totalLinks: allLinks.length,
    };
  } catch (e) {
    console.log(`  ! HATA: ${e.message}`);
    findings[slug] = { name, error: e.message };
  } finally {
    await page.close();
  }
}

writeFileSync('/tmp/gsb-ilce-deep-discovery.json', JSON.stringify(findings, null, 2));
console.log('\n→ /tmp/gsb-ilce-deep-discovery.json');
await browser.close();
