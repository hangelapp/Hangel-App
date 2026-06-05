/**
 * ReklamAction Canlı Teklifler — tüm sayfaları gez.
 */
import fs from 'node:fs';
import { chromium, type Page } from 'playwright';

const EMAIL = process.env.REKLAMACTION_EMAIL || '';
const PASS = process.env.REKLAMACTION_PASS || '';
const BASE = 'https://my.reklamaction.com';

async function bypassConsent(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
      cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const btn = Array.from(document.querySelectorAll<HTMLElement>('button,a,input'))
      .find(b => /continue|devam|kabul|accept/i.test((b.textContent || (b as HTMLInputElement).value || '')));
    btn?.click();
  });
  await page.waitForTimeout(2500);
}

async function scrapeCurrentPage(page: Page) {
  await page.waitForSelector('table tr', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);
  return await page.evaluate(() => {
    const out: any[] = [];
    const rows = Array.from(document.querySelectorAll('table tr')).filter(r => r.querySelectorAll('td').length >= 3);
    for (const row of rows) {
      const tds = Array.from(row.querySelectorAll('td')).map(td => (td.textContent || '').trim());
      const offerIdMatch = (tds[0] || '').match(/^(\d+)/);
      const offerId = offerIdMatch ? offerIdMatch[1] : undefined;
      let name = '';
      for (let i = 1; i < Math.min(tds.length, 5); i++) {
        const t = tds[i];
        if (t && /[a-zA-ZçÇğĞıİöÖşŞüÜ]/.test(t) && t.length > 1 && !/^\d+\.\d+/.test(t)) {
          name = t.split('\n')[0].trim().slice(0, 100);
          break;
        }
      }
      if (!name) continue;
      out.push({ offerId, name });
    }
    return out;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    for (let i = 0; i < 3; i++) await bypassConsent(page);
    await page.locator('input[type="email"], input:not([type]):not([readonly])').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASS);
    await page.locator('button:has-text("Giriş"), button[type="submit"]').first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.goto(BASE + '/publisher/#!/offers/my', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3500);

    const allOffers: any[] = [];
    const seen = new Set<string>();
    for (let pageNum = 1; pageNum <= 10; pageNum++) {
      console.log(`[ra] sayfa ${pageNum}...`);
      const offers = await scrapeCurrentPage(page);
      const newOnes = offers.filter(o => !seen.has(String(o.offerId)));
      newOnes.forEach(o => seen.add(String(o.offerId)));
      allOffers.push(...newOnes);
      console.log(`  → ${offers.length} satır (yeni: ${newOnes.length}, toplam: ${allOffers.length})`);
      if (newOnes.length === 0 && pageNum > 1) break;
      // Sayfada "Next" / ">" / Sonraki butonu
      const nextBtn = page.locator('a[aria-label="Next"], .pagination a:has-text(">"), .pagination li:not(.disabled):not(.active) a:has-text("' + (pageNum + 1) + '"), a:has-text("Sonraki"), a[ng-click*="next"], button[ng-click*="next"]').first();
      const hasNext = await nextBtn.count() > 0 && !(await nextBtn.getAttribute('disabled'));
      if (!hasNext) { console.log('[ra] Next button yok, bitti'); break; }
      await nextBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(3000);
    }
    fs.writeFileSync('/tmp/ra-all-pages.json', JSON.stringify({ count: allOffers.length, offers: allOffers }, null, 2));
    console.log(`\n[ra] Toplam: ${allOffers.length} offer → /tmp/ra-all-pages.json`);
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
