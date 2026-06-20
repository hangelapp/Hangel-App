import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL = 'https://ipk.adimadim.org/stklar';
const OUT = '/tmp/scrape-adimadim.json';

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
});
const page = await ctx.newPage();

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90_000 });
} catch (e) {
  console.error('goto error', e.message);
}

// Sucuri challenge may need a reload after setting the cookie
try {
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
} catch {}

// Give time for any SPA/JS
await page.waitForTimeout(2000);

// Inspect HTML for debug
const html = await page.content();
writeFileSync('/tmp/scrape-adimadim.html', html, 'utf8');
console.log('HTML length:', html.length);

// Try several strategies to find STK list
let items = [];

// Strategy A: structured anchors/cards in main content
items = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  // Look for list items / cards inside main content area
  // Try common selectors:
  const candidateSelectors = [
    'main a',
    'article a',
    '.stk-list a',
    '.stk a',
    '.list a',
    'ul li a',
    '.card a',
    '.row a',
    '.col a',
    '#content a',
    '.content a',
    'a[href*="/stk/"]',
    'a[href*="/stklar/"]',
  ];
  const seenAnchors = new Set();
  for (const sel of candidateSelectors) {
    const nodes = document.querySelectorAll(sel);
    nodes.forEach((a) => {
      if (seenAnchors.has(a)) return;
      seenAnchors.add(a);
      const txt = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim();
      const href = a.getAttribute('href') || '';
      if (!txt) return;
      // Heuristic: NGO names usually 3-120 chars, not nav like "Anasayfa"/"Bağış Yap"
      if (txt.length < 3 || txt.length > 200) return;
      const navWords = /^(Anasayfa|Bağış Yap|Giriş|Üye Ol|Kayıt|Hakkımızda|İletişim|Etkinlikler|Koşucular|STK'lar|STKlar|Daha fazla|Devamı|Detay|Tümü|Profil|Çıkış)$/i;
      if (navWords.test(txt)) return;
      const key = txt.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ name: txt, href });
    });
  }
  return out;
});

console.log('strategy A items:', items.length);

// If too few, try to scroll/load more
if (items.length < 5) {
  console.log('trying scroll + reparse');
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(1500);
}

// Re-extract with broader strategy
const items2 = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  // Find anchors whose href contains stk identifiers
  const anchors = Array.from(document.querySelectorAll('a'));
  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    const txt = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt) continue;
    // pattern from Adim Adim: usually href like /stk/<slug> or similar
    if (/\/stk\//i.test(href) || /stk-detay/i.test(href) || /\/stklar\//i.test(href) || /communities\//i.test(href) || /charities?\//i.test(href)) {
      const key = txt.toLowerCase();
      if (seen.has(key)) continue;
      if (txt.length < 2 || txt.length > 200) continue;
      seen.add(key);
      out.push({ name: txt, href });
    }
  }
  return out;
});
console.log('strategy B items:', items2.length);

// Choose better set
let finalItems = items2.length > items.length ? items2 : items;

// Yet another strategy: read headings/titles inside cards
if (finalItems.length < 5) {
  const items3 = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const nodes = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, h5, .name, .title, .stk-name, .card-title')
    );
    for (const n of nodes) {
      const txt = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) continue;
      if (txt.length < 3 || txt.length > 200) continue;
      const key = txt.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name: txt });
    }
    return out;
  });
  console.log('strategy C items:', items3.length);
  if (items3.length > finalItems.length) finalItems = items3;
}

const cleaned = finalItems
  .map((x) => ({
    name: cleanText(x.name),
    website: x.href && /^https?:\/\//.test(x.href) ? x.href : undefined,
  }))
  .filter((x) => x.name);

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: URL,
      scrapedAt: new Date().toISOString(),
      items: cleaned,
    },
    null,
    2
  ),
  'utf8'
);

console.log('Wrote', cleaned.length, 'items to', OUT);
await browser.close();
