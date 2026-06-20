import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL = 'https://ipk.adimadim.org/stklar';
const OUT = '/tmp/scrape-adimadim.json';
const HTML_OUT = '/tmp/scrape-adimadim.html';

function cleanText(s) {
  return (s || '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'tr-TR',
  viewport: { width: 1366, height: 900 },
});
const page = await ctx.newPage();

// Suppress noisy console
page.on('pageerror', () => {});

let lastError = null;
async function loadOnce() {
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  } catch (e) {
    lastError = e.message;
    console.log('goto error:', e.message);
  }
}

// First load — triggers Sucuri cookie set
await loadOnce();
await page.waitForTimeout(3500);

// Second load — Sucuri cookie now present
await loadOnce();

// Try to wait for body content
try {
  await page.waitForSelector('body', { timeout: 20_000 });
} catch {}

// Wait until body has substantial content
try {
  await page.waitForFunction(
    () => document.body && document.body.innerText && document.body.innerText.length > 500,
    { timeout: 30_000 }
  );
} catch (e) {
  console.log('body content wait timed out');
}

await page.waitForTimeout(2000);

const html = await page.content();
writeFileSync(HTML_OUT, html, 'utf8');
console.log('HTML length:', html.length);
console.log('Title:', await page.title());

// Scroll to load any lazy items
for (let i = 0; i < 12; i++) {
  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  await page.waitForTimeout(500);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const html2 = await page.content();
writeFileSync(HTML_OUT, html2, 'utf8');
console.log('HTML length post-scroll:', html2.length);

// Extract candidate STK names. Page typically has links to STK detail pages
const raw = await page.evaluate(() => {
  const out = [];
  // Try several common patterns observed on adimadim
  // 1) Cards/links to /stk-detay/<slug> or /stk/<slug> or /charity/<id>
  const seen = new Set();
  const pushAnchor = (a, source) => {
    const href = a.getAttribute('href') || '';
    const txt = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt || txt.length < 2) return;
    if (txt.length > 200) return;
    const key = href + '|' + txt.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name: txt, href, source });
  };

  // Strategy 1: any anchor whose href contains stk
  document.querySelectorAll('a[href*="/stk"]').forEach((a) => pushAnchor(a, 'stk-href'));
  // Strategy 2: charity
  document.querySelectorAll('a[href*="charity"], a[href*="Charity"]').forEach((a) => pushAnchor(a, 'charity-href'));
  // Strategy 3: list items inside main content
  document.querySelectorAll('main a, .container a, #content a, .stk a, .organizations a').forEach((a) => pushAnchor(a, 'main-area'));
  // Strategy 4: image alt names
  document.querySelectorAll('img').forEach((img) => {
    const alt = img.getAttribute('alt') || '';
    const t = alt.trim();
    if (t.length > 3 && t.length < 200) {
      out.push({ name: t, href: img.closest('a')?.getAttribute('href') || '', source: 'img-alt' });
    }
  });
  return out;
});

console.log('raw candidates:', raw.length);

// Filter to likely STK entries
const navWords = /^(Anasayfa|Bağış Yap|Giriş|Üye Ol|Kayıt|Hakkımızda|İletişim|Etkinlikler|Koşucular|STK'lar|STKlar|Daha fazla|Devamı|Detay|Tümü|Profil|Çıkış|Logo|Facebook|Twitter|Instagram|Youtube|Linkedin|İPK|Adım Adım|Geri|İleri|Önceki|Sonraki|Ana Sayfa|Yardım|SSS|Blog|Press|Basın|Kampanyalar?|Projeler?|Bağışçılar|Login|Logout|Search|Ara|Menu|Menü|En|Tr|TR|EN)$/i;
const isNav = (s) => navWords.test(s.trim());

const filtered = [];
const seenName = new Set();
for (const r of raw) {
  let name = cleanText(r.name);
  if (!name) continue;
  if (isNav(name)) continue;
  if (name.length < 3) continue;
  // Filter out URLs
  if (/^https?:\/\//.test(name)) continue;
  const key = name.toLowerCase();
  if (seenName.has(key)) continue;
  seenName.add(key);
  const item = { name };
  if (r.href) {
    if (/^https?:\/\//.test(r.href)) item.website = r.href;
    else if (r.href.startsWith('/')) item.website = 'https://ipk.adimadim.org' + r.href;
  }
  filtered.push(item);
}

console.log('filtered items:', filtered.length);

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: URL,
      scrapedAt: new Date().toISOString(),
      items: filtered,
    },
    null,
    2
  ),
  'utf8'
);

console.log('Wrote', filtered.length, 'items to', OUT);
await browser.close();
