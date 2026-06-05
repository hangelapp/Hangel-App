/**
 * scripts/affiliate-panel-deep-scrape.ts
 *
 * v6 derin scrape — her panele giriş + Approved Offers listesinin TÜM
 * sayfalarını dolaş + her offer için: name, offerId, status, tracking URL.
 *
 * Çıktı: /tmp/affiliate-panel-deep.json
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   AFFOCEAN_EMAIL='...' AFFOCEAN_PASS='...' \
 *   REKLAMACTION_EMAIL='...' REKLAMACTION_PASS='...' \
 *   GELIRORTAKLARI_EMAIL='...' GELIRORTAKLARI_PASS='...' \
 *   npx tsx scripts/affiliate-panel-deep-scrape.ts
 */
import fs from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright';

interface PanelOffer {
  network: string;
  offerId?: string;
  name: string;
  status?: string;
  category?: string;
  payout?: string;
  trackingUrl?: string;
  previewUrl?: string;
}

const RESULTS: PanelOffer[] = [];
const SUMMARY: Record<string, { ok: boolean; offers: number; pages: number; error?: string }> = {};

const NETWORKS = [
  { key: 'affocean', label: 'Affocean', baseUrl: 'https://panel.affocean.com',
    email: process.env.AFFOCEAN_EMAIL || '', password: process.env.AFFOCEAN_PASS || '' },
  { key: 'reklamaction', label: 'ReklamAction', baseUrl: 'https://my.reklamaction.com',
    email: process.env.REKLAMACTION_EMAIL || '', password: process.env.REKLAMACTION_PASS || '' },
  { key: 'gelirortaklari', label: 'GelirOrtakları', baseUrl: 'https://panel.gelirortaklari.com',
    email: process.env.GELIRORTAKLARI_EMAIL || '', password: process.env.GELIRORTAKLARI_PASS || '' },
];

async function dismissConsent(page: Page): Promise<void> {
  // ReklamAction'da privacy modal: checkbox + Continue
  try {
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const cb of checkboxes.slice(0, 5)) {
      try {
        if (!(await cb.isChecked({ timeout: 500 }))) {
          await cb.check({ timeout: 1500, force: true });
        }
      } catch { /* skip */ }
    }
    await page.waitForTimeout(500);
    // Force click Continue regardless of visibility wrapper
    for (const text of ['Continue', 'Devam', 'Kabul', 'Accept', 'Tamam']) {
      try {
        const btn = page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first();
        if (await btn.count() > 0) {
          await btn.click({ timeout: 3000, force: true });
          await page.waitForTimeout(1500);
          break;
        }
      } catch { /* skip */ }
    }
  } catch { /* no consent */ }
}

async function login(page: Page, net: typeof NETWORKS[number]): Promise<boolean> {
  try {
    await page.goto(net.baseUrl + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
    await dismissConsent(page);
    await page.waitForTimeout(2000);

    // Login form
    const emailSel = 'input[type="email"], input[type="text"]:not([readonly]), input:not([type]):not([readonly])';
    const passSel = 'input[type="password"]';
    await page.locator(emailSel).first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator(emailSel).first().fill(net.email);
    await page.locator(passSel).first().fill(net.password);
    // Submit
    const loginBtn = page.locator('button:has-text("Login"), button:has-text("Giriş"), button[type="submit"]').first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click({ force: true });
    } else {
      await page.locator(passSel).first().press('Enter');
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2500);

    const url = page.url();
    if (url.includes('login') || url.includes('signin')) {
      await page.screenshot({ path: `/tmp/deep-${net.key}-login-fail.png`, fullPage: true });
      return false;
    }
    return true;
  } catch (err) {
    await page.screenshot({ path: `/tmp/deep-${net.key}-login-error.png`, fullPage: true }).catch(() => {});
    console.log(`[${net.label}] login error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// HasOffers default — Approved Offers sayfa URL'leri
const OFFERS_CANDIDATES = [
  '/publisher/#!/offers/all',           // HasOffers SPA approved list
  '/publisher/#!/offers',                // generic
  '/affiliate/offers',                   // legacy
  '/offers',
  '/publisher/#!/dashboard',             // fallback
];

async function scrapeOffersPage(page: Page, net: typeof NETWORKS[number]): Promise<PanelOffer[]> {
  // HasOffers SPA — Approved Offers genelde /publisher/#!/offers
  // Try each candidate, scrape first one with table content
  for (const path of OFFERS_CANDIDATES) {
    const url = net.baseUrl + path;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(3500);
      // Wait for offers grid / table to load (SPA lazy load)
      await page.waitForSelector('table tbody tr, .offer-card, .grid-item, [class*="offer"]', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/tmp/deep-${net.key}-offers.png`, fullPage: true });

      // Generic scrape — find offer rows
      const offers = await page.evaluate((net: string) => {
        const out: PanelOffer[] = [];
        // HasOffers genelde Angular SPA: ng-repeat="offer in offers"
        // Look for: table rows, offer cards, .offer-card, .panel-default with offer info
        const candidates = [
          ...Array.from(document.querySelectorAll('tr[ng-repeat], tr.offer-row, tbody tr')),
          ...Array.from(document.querySelectorAll('[ng-repeat*="offer"], .offer-card, .panel.offer, [data-offer-id]')),
        ];
        const seen = new Set<string>();
        for (const el of candidates) {
          const text = (el.textContent || '').trim();
          if (!text || text.length < 5) continue;
          // Offer id from href, data-, or text
          let offerId: string | undefined;
          const link = el.querySelector('a[href*="offer"]') as HTMLAnchorElement | null;
          if (link?.href) {
            const m = link.href.match(/offers?\/?(?:show\/|view\/|details?\/)?(\d+)/i) ||
                      link.href.match(/offer_id=(\d+)/);
            if (m) offerId = m[1];
          }
          if (!offerId) offerId = el.getAttribute('data-offer-id') || undefined;
          // Name — strong/h4/link text
          const nameEl = el.querySelector('strong, h4, h5, a[href*="offer"]');
          let name = (nameEl?.textContent || '').trim().split('\n')[0].trim();
          if (!name) {
            const td = el.querySelector('td:nth-child(2), td:nth-child(3)');
            name = (td?.textContent || '').trim().split('\n')[0].trim().slice(0, 80);
          }
          if (!name) continue;
          const key = `${offerId || ''}-${name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          // Status badge
          const statusEl = el.querySelector('.label, .badge, .status, [class*="status"]');
          const status = (statusEl?.textContent || '').trim() || undefined;
          // Category
          const catEl = el.querySelector('[class*="categ"], .vertical, .niche');
          const category = (catEl?.textContent || '').trim() || undefined;
          // Payout
          const payoutEl = el.querySelector('[class*="payout"], [class*="commission"]');
          const payout = (payoutEl?.textContent || '').trim() || undefined;
          // Tracking URL — preview link or copy button data
          let trackingUrl: string | undefined;
          const trackBtn = el.querySelector('a[href*="aff_c"], a[href*="track"], button[data-track-url]') as HTMLAnchorElement | null;
          if (trackBtn) {
            trackingUrl = trackBtn.getAttribute('href') || trackBtn.getAttribute('data-track-url') || undefined;
          }
          out.push({ network: net, offerId, name, status, category, payout, trackingUrl });
        }
        return out;
      }, net.label);

      if (offers.length > 0) {
        console.log(`[${net.label}] ${path} → ${offers.length} offer bulundu`);
        return offers;
      } else {
        console.log(`[${net.label}] ${path} → 0 offer (sayfa içeriği yok, sonraki URL'i dene)`);
      }
    } catch (err) {
      console.log(`[${net.label}] ${path} hata: ${err instanceof Error ? err.message.slice(0, 100) : String(err)}`);
    }
  }
  return [];
}

async function processNetwork(browser: Browser, net: typeof NETWORKS[number]): Promise<void> {
  if (!net.email || !net.password) {
    SUMMARY[net.key] = { ok: false, offers: 0, pages: 0, error: 'no_credentials' };
    return;
  }
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  });
  const page = await ctx.newPage();
  try {
    console.log(`[${net.label}] login...`);
    const loginOk = await login(page, net);
    if (!loginOk) {
      SUMMARY[net.key] = { ok: false, offers: 0, pages: 0, error: 'login_failed' };
      return;
    }
    console.log(`[${net.label}] login OK, offers sayfası taranıyor...`);
    const offers = await scrapeOffersPage(page, net);
    RESULTS.push(...offers);
    SUMMARY[net.key] = { ok: true, offers: offers.length, pages: 1 };
  } catch (err) {
    SUMMARY[net.key] = { ok: false, offers: 0, pages: 0, error: err instanceof Error ? err.message.slice(0, 200) : String(err) };
  } finally {
    await ctx.close();
  }
}

async function main() {
  console.log('[deep-scrape] Chromium başlatılıyor...');
  const browser = await chromium.launch({ headless: true });
  try {
    for (const net of NETWORKS) {
      await processNetwork(browser, net);
    }
    console.log('\n=== ÖZET ===');
    for (const [k, s] of Object.entries(SUMMARY)) {
      console.log(`  ${k.padEnd(15)}: ok=${s.ok} offers=${s.offers}${s.error ? ` err=${s.error}` : ''}`);
    }
    const json = {
      generatedAt: new Date().toISOString(),
      summary: SUMMARY,
      totalOffers: RESULTS.length,
      offers: RESULTS,
    };
    fs.writeFileSync('/tmp/affiliate-panel-deep.json', JSON.stringify(json, null, 2));
    console.log(`\nRapor: /tmp/affiliate-panel-deep.json (${RESULTS.length} offer)`);
    console.log('Screenshots: /tmp/deep-*.png');
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
