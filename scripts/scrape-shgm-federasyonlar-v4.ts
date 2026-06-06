/**
 * scripts/scrape-shgm-federasyonlar-v4.ts
 *
 * V4: AJAX endpoint /ajax/fedcard.aspx?id={N} bulundu. Playwright context
 * ile her ID için direkt fetch et + HTML parse.
 *
 * Çıktı: /tmp/shgm-federasyonlar-v4.json
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

interface FedDetail {
  id: number;
  name: string;
  fullName?: string;
  president?: string;
  generalSecretary?: string;
  phone?: string;
  phone2?: string;
  fax?: string;
  email?: string;
  email2?: string;
  address?: string;
  website?: string;
  rawText?: string;
}

const KNOWN_IDS: Array<{ id: number; name: string }> = [
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

function parseHtmlText(html: string): string {
  // HTML tag'lerini söküp düz text al
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|td|th|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function parseFed(text: string, html: string): Partial<FedDetail> {
  const out: Partial<FedDetail> = {};

  // Tablo satırlarını analiz et — "Label: Value" pattern
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLocaleLowerCase('tr');
    // Bir sonraki satır value olabilir
    const next = lines[i + 1] || '';
    if (/^(adres|adres bilgisi)\s*:?$/i.test(lower) && next) out.address = next.slice(0, 250);
    else if (/^adres\s*:/i.test(lower)) out.address = line.replace(/^adres\s*:\s*/i, '').slice(0, 250);
    else if (/^(telefon|tel\.?)\s*:?$/i.test(lower) && next) out.phone = next.slice(0, 60);
    else if (/^(telefon|tel\.?)\s*:/i.test(lower)) out.phone = line.replace(/^(telefon|tel\.?)\s*:\s*/i, '').slice(0, 60);
    else if (/^(fax|faks)\s*:?$/i.test(lower) && next) out.fax = next.slice(0, 60);
    else if (/^(fax|faks)\s*:/i.test(lower)) out.fax = line.replace(/^(fax|faks)\s*:\s*/i, '').slice(0, 60);
    else if (/^(e-?mail|e-?posta)\s*:?$/i.test(lower) && next) out.email = next.slice(0, 80);
    else if (/^(e-?mail|e-?posta)\s*:/i.test(lower)) out.email = line.replace(/^(e-?mail|e-?posta)\s*:\s*/i, '').slice(0, 80);
    else if (/^(web|web ?sitesi|internet)\s*:?$/i.test(lower) && next) out.website = next.slice(0, 100);
    else if (/^(web|web ?sitesi|internet)\s*:/i.test(lower)) out.website = line.replace(/^(web|web ?sitesi|internet)\s*:\s*/i, '').slice(0, 100);
    else if (/^(başkan)\s*:?$/i.test(lower) && next) out.president = next.slice(0, 100);
    else if (/^başkan\s*:/i.test(lower)) out.president = line.replace(/^başkan\s*:\s*/i, '').slice(0, 100);
    else if (/^(genel sekreter)\s*:?$/i.test(lower) && next) out.generalSecretary = next.slice(0, 100);
    else if (/^genel sekreter\s*:/i.test(lower)) out.generalSecretary = line.replace(/^genel sekreter\s*:\s*/i, '').slice(0, 100);
  }

  // Regex fallback — eğer label-based çıkmadıysa
  if (!out.phone) {
    const m = text.match(/(?:\+?90[\s-]?)?\(?\s*0?\s*[2-9]\d{2}\s*\)?\s*[-\s]?\d{3}\s*[-\s]?\d{2}\s*[-\s]?\d{2}/);
    if (m) out.phone = m[0].replace(/\s+/g, ' ').trim();
  }
  if (!out.email) {
    const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (m) out.email = m[0].trim();
  }
  if (!out.website) {
    const m = text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:gov\.tr|org\.tr|com\.tr|com|org)(?:\/[^\s)]*)?/i);
    if (m) out.website = m[0].trim();
  }

  // HTML'den img src (logo) çıkar
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+(?:fdr|logo|federasyon)[^"']*)["']/i);
  if (imgMatch) (out as Partial<FedDetail> & { logo?: string }).logo = imgMatch[1];

  return out;
}

async function main() {
  console.log('[v4] Chromium launching...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 Safari/605.1.15',
  });
  const page = await ctx.newPage();

  // Önce ana sayfayı ziyaret et — cookie set olsun
  console.log('[v4] Visiting main page to set cookies...');
  await page.goto('https://shgm.gsb.gov.tr/Federasyonlar', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  console.log('[v4] Starting AJAX fetches for ' + KNOWN_IDS.length + ' federations...');
  const results: FedDetail[] = [];

  for (let i = 0; i < KNOWN_IDS.length; i++) {
    const { id, name } = KNOWN_IDS[i];
    process.stdout.write(`  [${(i + 1).toString().padStart(2, '0')}/${KNOWN_IDS.length}] id=${id} ${name.slice(0, 50).padEnd(50)} `);
    try {
      // Page context'i kullanarak fetch et — cookie + fingerprint mevcut
      const html = await page.evaluate(async (fId: number) => {
        const res = await fetch(`/ajax/fedcard.aspx?id=${fId}`, {
          headers: { 'Accept': 'text/html, */*' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      }, id);

      const text = parseHtmlText(html);
      const parsed = parseFed(text, html);
      const r: FedDetail = { id, name, ...parsed, rawText: text.slice(0, 800) };
      results.push(r);

      const parts = [r.phone ? '📞' : '', r.email ? '📧' : '', r.address ? '📍' : '', r.website ? '🌐' : '', r.president ? '👤' : ''].filter(Boolean);
      console.log(parts.join(' ') || `(${text.length} char no match)`);

      // Polite delay (server stress)
      await page.waitForTimeout(400);
    } catch (e) {
      results.push({ id, name, rawText: `error: ${e instanceof Error ? e.message : String(e)}` });
      console.log(`❌ ${e instanceof Error ? e.message.slice(0, 40) : ''}`);
    }

    if ((i + 1) % 10 === 0) {
      fs.writeFileSync('/tmp/shgm-federasyonlar-v4.json', JSON.stringify(results, null, 2));
    }
  }

  fs.writeFileSync('/tmp/shgm-federasyonlar-v4.json', JSON.stringify(results, null, 2));
  const wPhone = results.filter(r => r.phone).length;
  const wEmail = results.filter(r => r.email).length;
  const wAddr = results.filter(r => r.address).length;
  const wWeb = results.filter(r => r.website).length;
  const wBsk = results.filter(r => r.president).length;
  console.log(`\n✅ ${results.length} federation scraped → /tmp/shgm-federasyonlar-v4.json`);
  console.log(`  📞 phone: ${wPhone} · 📧 email: ${wEmail} · 📍 address: ${wAddr} · 🌐 web: ${wWeb} · 👤 president: ${wBsk}`);

  await ctx.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
