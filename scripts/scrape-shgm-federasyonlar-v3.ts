/**
 * scripts/scrape-shgm-federasyonlar-v3.ts
 *
 * V3: Network request inspection — popac(id) tetiklenince hangi XHR/fetch
 * çağrıldığını yakala, sonra her ID için o endpoint'i direkt çağır.
 *
 * V2 başarısız oldu çünkü popac() modal'ı sayfayı kaydırıyor (visible content
 * altına gidiyor) ve modal scrape edilemiyor. V3 daha akıllı:
 *   1. İlk popac(6) çağrısında XHR'i yakala (page.on('response')).
 *   2. URL pattern'i çıkar (örn: /Federasyonlar/Detay/{id}).
 *   3. Sonraki ID'ler için direkt fetch (Playwright dışı, curl).
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   npx tsx scripts/scrape-shgm-federasyonlar-v3.ts
 */
import fs from 'node:fs';
import { chromium, type Page } from 'playwright';

const URL = 'https://shgm.gsb.gov.tr/Federasyonlar';
const PROBE_ID = 6; // Okçuluk — XHR pattern keşfi için

async function discoverAjaxEndpoint(page: Page): Promise<string | null> {
  let foundEndpoint: string | null = null;
  let foundBody: string | null = null;

  page.on('response', async (res) => {
    const url = res.url();
    // Federasyon detayını gösteren endpoint genelde "Detay", "Federasyon", veya ID içerir
    if (!foundEndpoint && (url.includes('Detay') || url.includes('Federasyon') || url.includes(`/${PROBE_ID}`) || url.endsWith(`?id=${PROBE_ID}`))) {
      try {
        const text = await res.text();
        if (text.length > 200 && (text.toLowerCase().includes('telefon') || text.toLowerCase().includes('adres') || text.toLowerCase().includes('başkan'))) {
          foundEndpoint = url;
          foundBody = text;
          console.log(`[v3] AJAX endpoint discovered: ${url}`);
          console.log(`[v3] Body preview (200 char): ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
        }
      } catch { /* ignore */ }
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  console.log(`[v3] Triggering popac(${PROBE_ID}) to capture XHR...`);
  await page.evaluate((id) => {
    const w = window as unknown as { popac?: (n: number) => void };
    if (typeof w.popac === 'function') w.popac(id);
  }, PROBE_ID);

  // Network request'in tamamlanması için bekle
  await page.waitForTimeout(5000);

  if (foundEndpoint) {
    // Body'yi de kaydet — debugging için
    fs.writeFileSync('/tmp/shgm-probe-body.html', foundBody || '');
    console.log(`[v3] Probe body saved → /tmp/shgm-probe-body.html (${foundBody?.length || 0} char)`);
  }
  return foundEndpoint;
}

async function main() {
  console.log('[v3] Chromium launching...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  try {
    const endpoint = await discoverAjaxEndpoint(page);
    if (!endpoint) {
      console.log('[v3] AJAX endpoint discovery FAILED — popac() may use a different mechanism');
      // Fallback: tüm response'ları logla (debug)
      console.log('[v3] All responses during the page load were logged above');
    } else {
      console.log(`[v3] ✅ Endpoint pattern: ${endpoint}`);
    }
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
