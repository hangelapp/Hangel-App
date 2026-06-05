/**
 * scripts/affiliate-panel-reklamaction-only.ts
 *
 * v7 — Sadece ReklamAction. Consent modal'ı JS evaluate ile bypass et,
 * login → offers sayfasına git, marka listesini çek.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   REKLAMACTION_EMAIL='...' REKLAMACTION_PASS='...' \
 *   npx tsx scripts/affiliate-panel-reklamaction-only.ts
 */
import fs from 'node:fs';
import { chromium, type Page } from 'playwright';

const EMAIL = process.env.REKLAMACTION_EMAIL || '';
const PASS = process.env.REKLAMACTION_PASS || '';
const BASE = 'https://my.reklamaction.com';

interface Offer {
  offerId?: string;
  name: string;
  status?: string;
}

async function bypassConsent(page: Page) {
  // Privacy modal: 2 checkbox + Continue. JS ile direkt tetikle.
  await page.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    for (const cb of cbs.slice(0, 5)) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      cb.dispatchEvent(new Event('click', { bubbles: true }));
    }
    // Continue butonunu bul ve tıkla
    const btns = Array.from(document.querySelectorAll<HTMLElement>('button, a, input[type="button"], input[type="submit"]'));
    for (const b of btns) {
      const txt = (b.textContent || (b as HTMLInputElement).value || '').trim();
      if (/^(continue|devam|kabul|accept|tamam|onayla)/i.test(txt)) {
        b.click();
        return true;
      }
    }
    return false;
  });
  await page.waitForTimeout(3000);
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error('REKLAMACTION_EMAIL ve REKLAMACTION_PASS gerekli');
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  });
  const page = await ctx.newPage();
  try {
    console.log('[ra] consent + login...');
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 3 kez consent bypass dene (modal yeniden açılabilir)
    for (let i = 0; i < 3; i++) {
      const hasConsent = await page.locator('text=privacy policy').count() > 0 ||
                         await page.locator('text=Gizlilik').count() > 0;
      if (!hasConsent) break;
      console.log(`[ra] consent attempt ${i + 1}...`);
      await bypassConsent(page);
    }

    await page.screenshot({ path: '/tmp/ra-after-consent.png', fullPage: true });

    // Login form
    const emailInput = page.locator('input[type="email"], input[type="text"]:not([readonly]), input:not([type]):not([readonly])').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASS);
    const submit = page.locator('button:has-text("Giriş"), button:has-text("Login"), button[type="submit"]').first();
    if (await submit.count() > 0) await submit.click({ force: true });
    else await page.locator('input[type="password"]').first().press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`[ra] post-login url: ${page.url()}`);
    await page.screenshot({ path: '/tmp/ra-post-login.png', fullPage: true });

    if (page.url().includes('login')) {
      console.log('[ra] LOGIN BAŞARISIZ');
      return;
    }

    // Dashboard'da menüden tüm offer link'lerini topla
    const menuLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
        .map(a => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim().slice(0, 50) }))
        .filter(l => l.href && (l.href.includes('#!') || l.href.includes('offer')) &&
                     /offer|teklif|live|canli|canlı|browse|göz|find|all|list/i.test(l.href + ' ' + l.text));
    });
    const uniqLinks = Array.from(new Map(menuLinks.map(l => [l.href, l])).values());
    console.log(`[ra] menüde ${uniqLinks.length} offer link bulundu:`);
    uniqLinks.forEach(l => console.log(`     ${l.href}  →  ${l.text}`));

    // /offers/my = "Canlı Teklifler". Pagination ile tüm sayfaları gez.
    const PATHS = ['/publisher/#!/offers/my'];
    const results: Offer[] = [];
    for (const path of PATHS) {
      try {
        const url = BASE + path;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(3500);
        const screenshotPath = `/tmp/ra-${path.replace(/[\/!#?]/g, '_').slice(0, 60)}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        // Wait for table to render (Angular lazy)
        await page.waitForSelector('table tbody tr, .ng-scope tbody tr', { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(2000);
        const offers = await page.evaluate(() => {
          const out: any[] = [];
          const seen = new Set<string>();
          // Tüm tablo satırları (header'lar atılır)
          const rows = Array.from(document.querySelectorAll('table tr')).filter(r => r.querySelectorAll('td').length >= 3);
          for (const row of rows) {
            const tds = Array.from(row.querySelectorAll('td')).map(td => (td.textContent || '').trim());
            const firstCell = tds[0] || '';
            const offerIdMatch = firstCell.match(/^(\d+)/);
            const offerId = offerIdMatch ? offerIdMatch[1] : undefined;
            // Marka adı - genellikle 2. veya 3. td (logo'dan sonra)
            let name = '';
            for (let i = 1; i < Math.min(tds.length, 5); i++) {
              const t = tds[i];
              if (t && /[a-zA-ZçÇğĞıİöÖşŞüÜ]/.test(t) && t.length > 1 && !/^\d+\.\d+/.test(t)) {
                name = t.split('\n')[0].trim().slice(0, 80);
                break;
              }
            }
            if (!name) continue;
            const key = `${offerId || ''}-${name}`;
            if (seen.has(key)) continue;
            seen.add(key);
            // Status - sondan ikinci/üçüncü cell, genelde "Aktif", "Beklemede", flag image
            const status = tds.slice(-3).find(t => /aktif|beklemede|onayl|denied|pending/i.test(t)) ||
                           tds[tds.length - 1];
            out.push({ offerId, name, status });
          }
          return out;
        });
        if (offers.length > 0) {
          console.log(`[ra] ${path} sayfa 1 → ${offers.length} offer`);
          const seen = new Set<string>(offers.map(o => String(o.offerId)));
          results.push(...offers);
          // Pagination — sayfa 2, 3, ... gez
          for (let p = 2; p <= 10; p++) {
            const nextBtn = page.locator('ul.pagination li:not(.disabled):not(.active) a, a[ng-click*="page"], a:has-text("Sonraki"), a:has-text("Next"), a[aria-label*="Next"]').filter({ hasText: new RegExp('^(' + p + '|>|»|Sonraki|Next)$', 'i') }).first();
            if (await nextBtn.count() === 0) {
              console.log(`[ra] sayfa ${p} → pagination button yok, bitti`);
              break;
            }
            await nextBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(3000);
            await page.waitForSelector('table tr', { timeout: 8000 }).catch(() => {});
            const next = await page.evaluate(() => {
              const out: any[] = [];
              const rows = Array.from(document.querySelectorAll('table tr')).filter(r => r.querySelectorAll('td').length >= 3);
              for (const row of rows) {
                const tds = Array.from(row.querySelectorAll('td')).map(td => (td.textContent || '').trim());
                const m = (tds[0] || '').match(/^(\d+)/);
                const offerId = m ? m[1] : undefined;
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
            const fresh = next.filter(o => !seen.has(String(o.offerId)));
            fresh.forEach(o => seen.add(String(o.offerId)));
            console.log(`[ra] sayfa ${p} → ${next.length} satır (yeni: ${fresh.length}, toplam: ${seen.size})`);
            if (fresh.length === 0) break;
            results.push(...fresh);
          }
          break;
        } else {
          // Sayfa içeriği özetini al
          const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
          console.log(`[ra] ${path} → 0 offer. Body preview: ${bodyText.replace(/\s+/g, ' ').slice(0, 200)}`);
        }
      } catch (e) {
        console.log(`[ra] ${path} hata: ${e instanceof Error ? e.message.slice(0, 100) : e}`);
      }
    }

    fs.writeFileSync('/tmp/ra-offers.json', JSON.stringify({ count: results.length, offers: results }, null, 2));
    console.log(`\n[ra] Toplam: ${results.length} offer → /tmp/ra-offers.json`);
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
