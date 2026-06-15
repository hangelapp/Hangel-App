/**
 * 6 boş il için tüm /Sayfalar/* link'lerini dump et — manuel ilçe URL keşfi.
 */
import { chromium } from 'playwright';

const SAMPLES = ['adana', 'bursa', 'antalya', 'aydin', 'denizli', 'hatay'];

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

for (const slug of SAMPLES) {
  console.log(`\n═══ ${slug.toUpperCase()} ═══`);
  const page = await ctx.newPage();
  try {
    await page.goto(`https://${slug}.gsb.gov.tr/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Tüm /Sayfalar/ linklerini ilçe-relevant filter ile çek
    const links = await page.$$eval('a', (as) =>
      as.map((a) => ({
        href: a.getAttribute('href') || '',
        text: (a.textContent || '').trim().slice(0, 80),
      })).filter((x) => x.href.includes('/Sayfalar/'))
    );
    console.log(`  ${links.length} sayfa linki`);
    // Sadece ilçe-relevant'ları göster
    const rel = links.filter((l) => /ilce|ilçe|m(udur|üdür)l[uü]k/i.test(l.text) || /ilce|ilçe/i.test(l.href));
    rel.forEach((l) => console.log(`    [${l.href.slice(0, 90)}] ${l.text}`));
    if (rel.length === 0) {
      console.log('  HİÇ İLÇE LİNKİ YOK — KURUMSAL menüsünü açmayı dene');
      // KURUMSAL menüsünü hover et / dropdown'u aç
      const allTexts = links.map((l) => l.text).slice(0, 30);
      console.log('  İlk 30 link metni:', allTexts);
    }
  } catch (e) {
    console.log('  ! HATA:', e.message);
  } finally {
    await page.close();
  }
}
await browser.close();
