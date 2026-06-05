/**
 * scripts/affiliate-panel-scrape.ts
 *
 * 3 affiliate network panel'ine login + her offer/campaign'ın status'unu çek.
 * Output: /tmp/affiliate-panel-status.json
 *
 * Credentials env vars'tan okunur (KOMUT SATIRINDA INLINE):
 *   AFFOCEAN_EMAIL=ihadiguzel@gmail.com AFFOCEAN_PASS=Hangel3434 \
 *   REKLAMACTION_EMAIL=ihadiguzel@gmail.com REKLAMACTION_PASS=Kemal2134 \
 *   GELIRORTAKLARI_EMAIL=ihadiguzel@gmail.com GELIRORTAKLARI_PASS=Kemal2134 \
 *   npx tsx scripts/affiliate-panel-scrape.ts
 *
 * Headless tarayıcı + tek tarayıcı oturumu / panel.
 * Sadece offer listesini scrape eder — yazma işlemi yok, sadece okuma.
 *
 * NOT: Credentials hiçbir dosyaya yazılmaz, sadece process env üzerinden okunur.
 * Sonuç JSON içine de yazılmaz.
 */
import fs from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright';

interface OfferStatus {
  network: string;
  offerId?: string;
  brandName: string;
  status?: string;
  category?: string;
  payout?: string;
  notes?: string;
}

const NETWORKS = [
  {
    key: 'affocean',
    label: 'Affocean',
    loginUrl: 'https://panel.affocean.com/',
    offersUrl: 'https://panel.affocean.com/affiliate/offers',
    emailSel: 'input[name="email"], input[type="email"], input[id="email"], input[placeholder*="Email" i], input[placeholder*="E-posta" i]',
    passSel: 'input[name="password"], input[type="password"], input[placeholder*="Password" i], input[placeholder*="Şifre" i]',
    submitSel: 'button[type="submit"], button.btn-primary, input[type="submit"], button:has-text("Login"), button:has-text("Giriş")',
    email: process.env.AFFOCEAN_EMAIL || '',
    password: process.env.AFFOCEAN_PASS || '',
  },
  {
    key: 'reklamaction',
    label: 'ReklamAction',
    loginUrl: 'https://my.reklamaction.com/affiliate/login',
    offersUrl: 'https://my.reklamaction.com/affiliate/offers',
    emailSel: 'input[name="email"], input[type="email"], input[id="email"], input[placeholder*="Email" i], input[placeholder*="E-posta" i]',
    passSel: 'input[name="password"], input[type="password"], input[placeholder*="Password" i], input[placeholder*="Şifre" i]',
    submitSel: 'button[type="submit"], button.btn-primary, input[type="submit"], button:has-text("Login"), button:has-text("Giriş")',
    email: process.env.REKLAMACTION_EMAIL || '',
    password: process.env.REKLAMACTION_PASS || '',
  },
  {
    key: 'gelirortaklari',
    label: 'GelirOrtakları',
    loginUrl: 'https://panel.gelirortaklari.com/',
    offersUrl: 'https://panel.gelirortaklari.com/affiliate/offers',
    emailSel: 'input[name="email"], input[type="email"], input[id="email"], input[placeholder*="Email" i], input[placeholder*="E-posta" i]',
    passSel: 'input[name="password"], input[type="password"], input[placeholder*="Password" i], input[placeholder*="Şifre" i]',
    submitSel: 'button[type="submit"], button.btn-primary, input[type="submit"], button:has-text("Login"), button:has-text("Giriş")',
    email: process.env.GELIRORTAKLARI_EMAIL || '',
    password: process.env.GELIRORTAKLARI_PASS || '',
  },
];

// Privacy/cookie consent modal'larını otomatik dismiss et (özellikle ReklamAction)
async function dismissConsentModal(page: Page): Promise<void> {
  try {
    // I have read + I accept cookies checkbox'larını kontrol et
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const cb of checkboxes.slice(0, 5)) {
      try {
        const isChecked = await cb.isChecked({ timeout: 1000 });
        if (!isChecked) await cb.check({ timeout: 2000 });
      } catch { /* ignore */ }
    }
    // Continue / Devam / Kabul Et buton
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Devam"), button:has-text("Kabul"), button:has-text("Accept")').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click({ timeout: 3000 });
      await page.waitForTimeout(1500);
    }
  } catch { /* consent yoksa devam */ }
}

const RESULTS: OfferStatus[] = [];

async function scrapeOne(browser: Browser, net: typeof NETWORKS[number]): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!net.email || !net.password) {
    console.log(`[${net.label}] credentials yok, atlanıyor`);
    return { ok: false, count: 0, error: 'no_credentials' };
  }
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  try {
    console.log(`[${net.label}] login: ${net.loginUrl}`);
    await page.goto(net.loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Privacy/cookie modal varsa dismiss
    await dismissConsentModal(page);
    await page.waitForTimeout(2000);

    // Generic input bulma — selector başarısız olursa tüm input'ları al
    // HasOffers panelleri text input + password input pattern'i ile gelir.
    const allInputs = await page.locator('input:not([type="hidden"])').all();
    console.log(`[${net.label}] sayfada ${allInputs.length} input bulundu`);
    if (allInputs.length < 2) {
      // Form henüz yok — debug screenshot
      await page.screenshot({ path: `/tmp/affiliate-panel-${net.key}-no-form.png`, fullPage: true });
      throw new Error(`Login form bulunamadı (${allInputs.length} input)`);
    }
    // İlk text input email, ilk password input password
    const emailInput = page.locator('input[type="email"], input[type="text"], input:not([type])').first();
    const passInput = page.locator('input[type="password"]').first();
    await emailInput.fill(net.email);
    await passInput.fill(net.password);
    // Submit — önce specific button, sonra Enter fallback
    const loginBtn = page.locator('button:has-text("Login"), button:has-text("Giriş"), button[type="submit"], input[type="submit"]').first();
    if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginBtn.click();
    } else {
      await passInput.press('Enter');
    }

    // Wait for navigation post-login (dashboard or offers)
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const postLoginUrl = page.url();
    console.log(`[${net.label}] post-login url: ${postLoginUrl}`);

    if (postLoginUrl.includes('login')) {
      // Login başarısız
      await page.screenshot({ path: `/tmp/affiliate-panel-${net.key}-login-fail.png` });
      return { ok: false, count: 0, error: 'login_failed' };
    }

    // Offers sayfasına git
    console.log(`[${net.label}] offers: ${net.offersUrl}`);
    await page.goto(net.offersUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Sayfayı snapshot al (debug için)
    await page.screenshot({ path: `/tmp/affiliate-panel-${net.key}-offers.png`, fullPage: true });

    // Generic offer scraping — table rows içinde brand name + status text
    const offers = await scrapeOffersGeneric(page, net.label);
    RESULTS.push(...offers);
    console.log(`[${net.label}] scraped ${offers.length} offers`);

    return { ok: true, count: offers.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[${net.label}] error: ${msg.slice(0, 200)}`);
    try { await page.screenshot({ path: `/tmp/affiliate-panel-${net.key}-error.png` }); } catch { /* ignore */ }
    return { ok: false, count: 0, error: msg.slice(0, 200) };
  } finally {
    await context.close();
  }
}

async function scrapeOffersGeneric(page: Page, network: string): Promise<OfferStatus[]> {
  // HasOffers tabanlı paneller — genelde table.dataTable veya .table .offer-row var
  // Generic strategy: row'ları çek, içinde brand name + status badge ara
  return await page.evaluate((net: string) => {
    const out: OfferStatus[] = [];
    const rows = document.querySelectorAll('table tbody tr, .offer-row, .campaign-row, [data-offer-id]');
    rows.forEach((row) => {
      const text = (row.textContent || '').trim();
      if (!text || text.length < 5) return;
      // Brand name heuristic — ilk strong tag veya ilk td
      const nameEl = row.querySelector('strong, a[href*="offer"], h4, h5, td:nth-child(2)');
      const name = (nameEl?.textContent || '').trim().split('\n')[0].trim();
      if (!name) return;
      // Status heuristic — span.label, span.badge, .status
      const statusEl = row.querySelector('.label, .badge, .status, [class*="status"]');
      const status = (statusEl?.textContent || '').trim() || undefined;
      // Offer ID heuristic — data-offer-id, href contains offer_id
      const offerIdAttr = row.getAttribute('data-offer-id');
      let offerId = offerIdAttr || undefined;
      if (!offerId) {
        const link = row.querySelector('a[href*="offer_id"]') as HTMLAnchorElement | null;
        if (link?.href) {
          const m = link.href.match(/offer_id=(\d+)/);
          if (m) offerId = m[1];
        }
      }
      out.push({
        network: net,
        offerId,
        brandName: name.slice(0, 100),
        status,
      });
    });
    return out;
  }, network);
}

async function main() {
  console.log('[panel-scrape] Playwright Chromium başlatılıyor...');
  const browser = await chromium.launch({ headless: true });
  try {
    const summary: Record<string, { ok: boolean; count: number; error?: string }> = {};
    for (const net of NETWORKS) {
      summary[net.key] = await scrapeOne(browser, net);
    }
    console.log('\n=== ÖZET ===');
    for (const [k, s] of Object.entries(summary)) {
      console.log(`  ${k}: ok=${s.ok} count=${s.count}${s.error ? ` error=${s.error}` : ''}`);
    }

    // Sadece offer adı + status — credentials hiçbir yere yazılmaz
    const json = {
      generatedAt: new Date().toISOString(),
      summary,
      totalOffers: RESULTS.length,
      offers: RESULTS,
    };
    fs.writeFileSync('/tmp/affiliate-panel-status.json', JSON.stringify(json, null, 2));
    console.log(`\nFull rapor: /tmp/affiliate-panel-status.json (${RESULTS.length} offer)`);
    console.log('Screenshot debug: /tmp/affiliate-panel-*.png');
  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
