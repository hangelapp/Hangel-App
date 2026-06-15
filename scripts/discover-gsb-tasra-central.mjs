/**
 * gsb.gov.tr merkezi taşra teşkilatı sayfasını incele:
 *  - /tr/sayfa/5037-tasra-teskilati
 *  - /spor-hizmetleri-genel-mudurlugu
 *
 * Hedef: 81 ilin GSB il müdürlüğü URL'lerini + (varsa) ilçe linkleri.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const CANDIDATES = [
  'https://gsb.gov.tr/tr/sayfa/5037-tasra-teskilati',
  'https://gsb.gov.tr/sayfa/5037-tasra-teskilati',
  'https://www.gsb.gov.tr/tr/sayfa/5037-tasra-teskilati',
  'https://gsb.gov.tr/tasra-teskilati',
  'https://shgm.gsb.gov.tr/',
  'https://gsb.gov.tr/',
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

const out = {};

for (const url of CANDIDATES) {
  console.log(`\n═══ ${url}`);
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = resp ? resp.status() : 0;
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);

    if (status >= 400) {
      console.log(`  HTTP ${status}`);
      out[url] = { status, error: 'http-error' };
      continue;
    }

    // Tüm link'leri al
    const links = await page.$$eval('a', (as) =>
      as.map((a) => ({
        href: a.href || '',
        text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
      })).filter((x) => x.href)
    );

    // İl müdürlüğü/spor müdürlüğü ile ilgili linkleri filtrele
    const ilMudur = links.filter((l) =>
      /il\s+m(üdürl|udurlu)/i.test(l.text) ||
      /\.gsb\.gov\.tr/i.test(l.href) ||
      /spor.*müdürlü|m(üdürl|udurlu).*spor/i.test(l.text)
    );

    console.log(`  Toplam: ${links.length} link, ${ilMudur.length} il müdürlüğü relevant`);
    ilMudur.slice(0, 20).forEach((l) => console.log(`    [${l.href.slice(0, 90)}] ${l.text.slice(0, 60)}`));

    // Çıktıyı kaydet (full HTML)
    const html = await page.content();
    const safe = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_');
    writeFileSync(`/tmp/gsb-central-${safe}.html`, html);
    out[url] = { status, totalLinks: links.length, ilMudurCount: ilMudur.length, samples: ilMudur.slice(0, 15), htmlSize: html.length };
  } catch (e) {
    console.log(`  ! ${e.message}`);
    out[url] = { error: e.message };
  } finally {
    await page.close();
  }
}

writeFileSync('/tmp/gsb-central-discovery.json', JSON.stringify(out, null, 2));
console.log('\n→ /tmp/gsb-central-discovery.json');
await browser.close();
