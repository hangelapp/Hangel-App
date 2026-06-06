/**
 * scripts/scrape-shgm-federasyonlar.ts
 *
 * SHGM (Spor Hizmetleri Genel Müdürlüğü) https://shgm.gsb.gov.tr/Federasyonlar
 * sayfasındaki ~59 spor federasyonunun popac(id) detaylarını Playwright ile aç,
 * her popup'un içindeki adres + telefon + email + website bilgisini çek,
 * /tmp/shgm-federasyonlar.json'a yaz.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   npx tsx scripts/scrape-shgm-federasyonlar.ts
 */
import fs from 'node:fs';
import { chromium, type Page } from 'playwright';

interface ScrapedFed {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
  president?: string;
  rawText?: string;
}

const URL = 'https://shgm.gsb.gov.tr/Federasyonlar';

async function discoverIds(page: Page): Promise<Array<{ id: string; name: string }>> {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="popac"]'));
    const out: Array<{ id: string; name: string }> = [];
    for (const a of links) {
      const m = a.getAttribute('href')?.match(/popac\((\d+)\)/);
      if (m) {
        out.push({ id: m[1], name: (a.textContent || '').trim() });
      }
    }
    return out;
  });
}

async function scrapeOne(page: Page, id: string, name: string): Promise<ScrapedFed> {
  const result: ScrapedFed = { id, name };
  try {
    // Tetikleyici link'i bul + tıkla — popup açılır
    const success = await page.evaluate((targetId: string) => {
      const popacFn = (window as unknown as { popac?: (id: number) => void }).popac;
      if (typeof popacFn === 'function') {
        popacFn(parseInt(targetId, 10));
        return true;
      }
      const link = document.querySelector<HTMLAnchorElement>(`a[href*="popac(${targetId})"]`);
      if (link) {
        link.click();
        return true;
      }
      return false;
    }, id);

    if (!success) {
      result.rawText = 'popac function not found';
      return result;
    }

    // Popup'ın açılmasını + content yüklenmesini bekle
    await page.waitForTimeout(1500);

    // Popup içindeki text'i al — yaygın selector'lar
    const text = await page.evaluate(() => {
      // Modal/popup içindeki ana içerik
      const candidates = [
        document.querySelector('.modal-body'),
        document.querySelector('.popup-content'),
        document.querySelector('#federasyonBilgi'),
        document.querySelector('[class*="federasyon"]'),
        document.querySelector('.modal.show'),
        document.querySelector('[class*="popup"]:not([hidden])'),
      ];
      for (const c of candidates) {
        if (c && (c as HTMLElement).innerText && (c as HTMLElement).innerText.trim().length > 50) {
          return (c as HTMLElement).innerText;
        }
      }
      return document.body.innerText.slice(-3000);
    });

    result.rawText = text.slice(0, 1500);

    // Regex'lerle iletişim bilgisi çıkar
    const phoneMatch = text.match(/(\+?90[\s-]?)?\(?0?\s?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g);
    if (phoneMatch) {
      result.phone = phoneMatch[0].trim();
      if (phoneMatch[1]) result.phone2 = phoneMatch[1].trim();
    }
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (emailMatch) result.email = emailMatch[0].trim();
    // Adres: "Adres:" sonrasını yakala
    const addrMatch = text.match(/Adres[\s:]+([^\n]+(?:\n[^\n]+){0,2})/i);
    if (addrMatch) result.address = addrMatch[1].trim().slice(0, 200);
    // Website: http(s):// veya www.X
    const webMatch = text.match(/(https?:\/\/[^\s\n)]+|www\.[a-z0-9-]+\.[a-z]{2,}[a-z./]*)/i);
    if (webMatch) result.website = webMatch[0].trim();
    // Başkan
    const bskMatch = text.match(/Başkan[\s:]+([^\n]+)/i);
    if (bskMatch) result.president = bskMatch[1].trim().slice(0, 80);

    // Popup'ı kapat (close button veya escape)
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  } catch (e) {
    result.rawText = `error: ${e instanceof Error ? e.message : String(e)}`;
  }
  return result;
}

async function main() {
  console.log('[scrape] Chromium launching...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  });
  const page = await ctx.newPage();
  try {
    console.log('[scrape] Navigating to ' + URL);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const ids = await discoverIds(page);
    console.log(`[scrape] ${ids.length} federation IDs found`);

    const results: ScrapedFed[] = [];
    for (let i = 0; i < ids.length; i++) {
      const { id, name } = ids[i];
      process.stdout.write(`  [${i + 1}/${ids.length}] ${id} ${name.slice(0, 50).padEnd(50)} `);
      const r = await scrapeOne(page, id, name);
      const parts = [r.phone ? '📞' : '', r.email ? '📧' : '', r.address ? '📍' : '', r.website ? '🌐' : ''].filter(Boolean);
      console.log(parts.join(' ') || '(empty)');
      results.push(r);
      // Her 10 federasyonda ara checkpoint yaz
      if ((i + 1) % 10 === 0) {
        fs.writeFileSync('/tmp/shgm-federasyonlar.json', JSON.stringify(results, null, 2));
      }
    }

    fs.writeFileSync('/tmp/shgm-federasyonlar.json', JSON.stringify(results, null, 2));
    console.log(`\n✅ ${results.length} federation scraped → /tmp/shgm-federasyonlar.json`);
    const withPhone = results.filter(r => r.phone).length;
    const withEmail = results.filter(r => r.email).length;
    const withAddr = results.filter(r => r.address).length;
    const withWeb = results.filter(r => r.website).length;
    console.log(`  📞 phone: ${withPhone} · 📧 email: ${withEmail} · 📍 address: ${withAddr} · 🌐 web: ${withWeb}`);
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
