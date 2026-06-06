/**
 * scripts/scrape-shgm-federasyonlar-v2.ts
 *
 * SHGM (Spor Hizmetleri Genel Müdürlüğü) https://shgm.gsb.gov.tr/Federasyonlar
 * V2: WebFetch ile keşfedilen ID listesini hardcoded olarak kullan,
 * her ID için window.popac(id) JavaScript çağrısı yap, popup içeriğini scrape.
 *
 * Selector keşfi v1'de başarısız olmuştu (a[href*="popac"] = 0 element).
 * Bu sefer JavaScript fonksiyonunu direkt evaluate ediyoruz.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   npx tsx scripts/scrape-shgm-federasyonlar-v2.ts
 */
import fs from 'node:fs';
import { chromium, type Page } from 'playwright';

interface ScrapedFed {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  email2?: string;
  website?: string;
  president?: string;
  generalSecretary?: string;
  rawText?: string;
  htmlSnippet?: string;
}

const URL = 'https://shgm.gsb.gov.tr/Federasyonlar';

// WebFetch ile keşfedilen 60 federasyon ID'si + isim eşlemesi.
const KNOWN_FEDERATIONS: Array<{ id: number; name: string }> = [
  { id: 6, name: 'Türkiye Okçuluk Federasyonu' },
  { id: 12, name: 'Türkiye Oryantiring Federasyonu' },
  { id: 13, name: 'Türkiye Otomobil Sporları Federasyonu' },
  { id: 14, name: 'Türkiye Özel Sporcular Spor Federasyonu' },
  { id: 15, name: 'Türkiye Satranç Federasyonu' },
  { id: 17, name: 'Türkiye Sualtı Sporları Federasyonu' },
  { id: 18, name: 'Türkiye Sutopu Federasyonu' },
  { id: 19, name: 'Türkiye Taekwondo Federasyonu' },
  { id: 20, name: 'Türkiye Tenis Federasyonu' },
  { id: 21, name: 'Türkiye Triatlon Federasyonu' },
  { id: 22, name: 'Türkiye Üniversite Sporları Federasyonu' },
  { id: 23, name: 'Türkiye Voleybol Federasyonu' },
  { id: 24, name: 'Türkiye Vücut Geliştirme Fitness Federasyonu' },
  { id: 25, name: 'Türkiye Wushu KungFu Federasyonu' },
  { id: 26, name: 'Türkiye Yelken Federasyonu' },
  { id: 27, name: 'Türkiye Yüzme Federasyonu' },
  { id: 28, name: 'Türkiye Atıcılık Federasyonu' },
  { id: 29, name: 'Türkiye Atletizm Federasyonu' },
  { id: 30, name: 'Türkiye Badminton Federasyonu' },
  { id: 31, name: 'Türkiye Basketbol Federasyonu' },
  { id: 32, name: 'Türkiye Bedensel Engelliler Spor Federasyonu' },
  { id: 33, name: 'Türkiye Ragbi Federasyonu' },
  { id: 34, name: 'Türkiye Bilardo Federasyonu' },
  { id: 35, name: 'Türkiye Binicilik Federasyonu' },
  { id: 36, name: 'Türkiye Bisiklet Federasyonu' },
  { id: 37, name: 'Türkiye Bocce Bowling Dart Federasyonu' },
  { id: 38, name: 'Türkiye Boks Federasyonu' },
  { id: 39, name: 'Türkiye Briç Federasyonu' },
  { id: 40, name: 'Türkiye Buz Hokeyi Federasyonu' },
  { id: 41, name: 'Türkiye Buz Pateni Federasyonu' },
  { id: 42, name: 'Türkiye Cimnastik Federasyonu' },
  { id: 43, name: 'Türkiye Dağcılık Federasyonu' },
  { id: 44, name: 'Türkiye Dans Sporları Federasyonu' },
  { id: 46, name: 'Türkiye Eskrim Federasyonu' },
  { id: 48, name: 'Türkiye Geleneksel Spor Dalları Federasyonu' },
  { id: 49, name: 'Türkiye Gelişmekte Olan Spor Branşları Federasyonu' },
  { id: 50, name: 'Türkiye Golf Federasyonu' },
  { id: 51, name: 'Türkiye Görme Engelliler Spor Federasyonu' },
  { id: 52, name: 'Türkiye Güreş Federasyonu' },
  { id: 53, name: 'Türkiye Halk Oyunları Federasyonu' },
  { id: 54, name: 'Türkiye Halter Federasyonu' },
  { id: 56, name: 'Türkiye Hentbol Federasyonu' },
  { id: 57, name: 'Türkiye Herkes İçin Spor Federasyonu' },
  { id: 58, name: 'Türkiye Hokey Federasyonu' },
  { id: 59, name: 'Türkiye İşitme Engelliler Spor Federasyonu' },
  { id: 60, name: 'Türkiye İzcilik Federasyonu' },
  { id: 61, name: 'Türkiye Judo Federasyonu' },
  { id: 62, name: 'Türkiye Kano Federasyonu' },
  { id: 63, name: 'Türkiye Karate Federasyonu' },
  { id: 64, name: 'Türkiye Kayak Federasyonu' },
  { id: 65, name: 'Türkiye Kick Boks Federasyonu' },
  { id: 67, name: 'Türkiye Kürek Federasyonu' },
  { id: 68, name: 'Türkiye Masa Tenisi Federasyonu' },
  { id: 69, name: 'Türkiye Modern Pentatlon Federasyonu' },
  { id: 70, name: 'Türkiye Motosiklet Federasyonu' },
  { id: 71, name: 'Türkiye Muay Thai Federasyonu' },
  { id: 74, name: 'Türkiye Curling Federasyonu' },
  { id: 78, name: 'Türkiye Hava Sporları Federasyonu' },
  { id: 79, name: 'Türkiye Kaykay Federasyonu' },
  { id: 81, name: 'Türkiye ESpor Federasyonu' },
  { id: 93, name: 'Türkiye Geleneksel Türk Okçuluk Federasyonu' },
  { id: 97, name: 'Türkiye Geleneksel Atlı Spor Dalları Federasyonu' },
  { id: 99, name: 'Türkiye Geleneksel Güreşler Federasyonu' },
];

async function scrapeOne(page: Page, id: number, name: string): Promise<ScrapedFed> {
  const result: ScrapedFed = { id, name };

  try {
    // window.popac(id) çağır
    const triggered = await page.evaluate((i) => {
      const w = window as unknown as { popac?: (n: number) => void };
      if (typeof w.popac === 'function') {
        w.popac(i);
        return true;
      }
      return false;
    }, id);

    if (!triggered) {
      result.rawText = '(popac function not available)';
      return result;
    }

    // Popup içeriğinin yüklenmesini bekle (AJAX)
    await page.waitForTimeout(2500);

    // Popup içeriğini al — birkaç olası selector dene
    const data = await page.evaluate(() => {
      // SHGM'nin popup div'i muhtemelen #popac veya benzer
      const selectors = ['#popac', '.popacBox', '.popac-content', '.modal-body', '#popup', '.popup'];
      let target: HTMLElement | null = null;
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el && el.innerText && el.innerText.trim().length > 30) {
          target = el;
          break;
        }
      }
      // Visible olan en büyük overlay
      if (!target) {
        const overlays = Array.from(document.querySelectorAll<HTMLElement>('div[style*="block"], div[style*="visible"]'));
        for (const el of overlays.reverse()) {
          if (el.innerText && el.innerText.trim().length > 50 && el.innerText.length < 5000) {
            target = el; break;
          }
        }
      }
      // Son çare: tüm body text'ten son 3000 char
      if (!target) {
        return { text: document.body.innerText.slice(-3000), html: '' };
      }
      return { text: target.innerText.slice(0, 3000), html: target.outerHTML.slice(0, 2000) };
    });

    result.rawText = data.text;
    result.htmlSnippet = data.html;

    // Parse — telefon, email, adres, web
    const text = data.text;

    const phoneMatches = Array.from(text.matchAll(/\(?\s*0?\s*[2-9]\d{2}\s*\)?\s*[-]?\s*\d{3}\s*[-]?\s*\d{2}\s*[-]?\s*\d{2}/g));
    if (phoneMatches[0]) result.phone = phoneMatches[0][0].replace(/\s+/g, ' ').trim();
    if (phoneMatches[1]) result.phone2 = phoneMatches[1][0].replace(/\s+/g, ' ').trim();

    const emailMatches = Array.from(text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g));
    if (emailMatches[0]) result.email = emailMatches[0][0].trim();
    if (emailMatches[1]) result.email2 = emailMatches[1][0].trim();

    const addrMatch = text.match(/(?:Adres|ADRES)[\s:]+([^\n]+(?:\n[^\n]+){0,3})/i);
    if (addrMatch) result.address = addrMatch[1].replace(/\s+/g, ' ').trim().slice(0, 250);

    const webMatch = text.match(/(?:Web[\s:]+)?(https?:\/\/[^\s\n)]+|www\.[a-z0-9-]+\.[a-z.]{2,15}[a-z./]*)/i);
    if (webMatch) result.website = webMatch[1].trim();

    const bskMatch = text.match(/(?:Başkan|BAŞKAN)[\s:]+([^\n]+)/);
    if (bskMatch) result.president = bskMatch[1].trim().slice(0, 100);

    const gsMatch = text.match(/(?:Genel\s+Sekreter|GENEL\s+SEKRETER)[\s:]+([^\n]+)/i);
    if (gsMatch) result.generalSecretary = gsMatch[1].trim().slice(0, 100);

    // Popup'ı kapat (Escape veya overlay click)
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  } catch (e) {
    result.rawText = `error: ${e instanceof Error ? e.message : String(e)}`;
  }
  return result;
}

async function main() {
  console.log('[v2] Chromium launching...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 Safari/605.1.15',
  });
  const page = await ctx.newPage();

  try {
    console.log('[v2] GET ' + URL);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    // popac fonksiyonu var mı doğrula
    const hasPopac = await page.evaluate(() => typeof (window as unknown as { popac?: unknown }).popac === 'function');
    console.log(`[v2] popac function available: ${hasPopac}`);

    if (!hasPopac) {
      // Sayfanın daha uzun yüklenmesini bekle
      await page.waitForTimeout(5000);
      const retry = await page.evaluate(() => typeof (window as unknown as { popac?: unknown }).popac === 'function');
      console.log(`[v2] popac retry: ${retry}`);
    }

    const results: ScrapedFed[] = [];
    for (let i = 0; i < KNOWN_FEDERATIONS.length; i++) {
      const f = KNOWN_FEDERATIONS[i];
      process.stdout.write(`  [${(i + 1).toString().padStart(2, '0')}/${KNOWN_FEDERATIONS.length}] id=${f.id} ${f.name.slice(0, 55).padEnd(55)} `);
      const r = await scrapeOne(page, f.id, f.name);
      const parts = [r.phone ? '📞' : '', r.email ? '📧' : '', r.address ? '📍' : '', r.website ? '🌐' : '', r.president ? '👤' : ''].filter(Boolean);
      console.log(parts.join(' ') || `(${r.rawText?.slice(0, 30) || 'empty'})`);
      results.push(r);

      // Her 10 federasyonda checkpoint
      if ((i + 1) % 10 === 0) {
        fs.writeFileSync('/tmp/shgm-federasyonlar-v2.json', JSON.stringify(results, null, 2));
      }
    }

    fs.writeFileSync('/tmp/shgm-federasyonlar-v2.json', JSON.stringify(results, null, 2));
    const wPhone = results.filter(r => r.phone).length;
    const wEmail = results.filter(r => r.email).length;
    const wAddr = results.filter(r => r.address).length;
    const wWeb = results.filter(r => r.website).length;
    const wBsk = results.filter(r => r.president).length;
    console.log(`\n✅ ${results.length} federation scraped → /tmp/shgm-federasyonlar-v2.json`);
    console.log(`  📞 phone: ${wPhone} · 📧 email: ${wEmail} · 📍 address: ${wAddr} · 🌐 web: ${wWeb} · 👤 president: ${wBsk}`);
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
