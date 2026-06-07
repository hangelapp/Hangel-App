/**
 * scripts/scrape-tgsp.mjs
 *
 * https://tgsp.org.tr/tr/stklar — TGSP (Türkiye Gençlik STK'ları Platformu)
 * üye STK listesini scrape eder. Server-rendered HTML, fetch + regex yeterli.
 * Paginasyon: 12 STK/sayfa, page=1..N (N ~9).
 *
 * Output: /tmp/scrape-tgsp.json — { source, scrapedAt, items: [{ name, website }] }
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   node scripts/scrape-tgsp.mjs
 */
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://tgsp.org.tr/tr/stklar';

// Liste sayfasındaki h4>a sadece URL için güvenilir; STK adı anchor metni
// description'ın başı olabiliyor. Gerçek ad detay sayfasının <h1>'inde.
const URL_RE = /<h4><a href="(https:\/\/tgsp\.org\.tr\/tr\/[a-z0-9-]+)"/g;
const H1_RE = /<h1[^>]*>([^<]+)<\/h1>/;

async function fetchPage(page) {
  const url = page === 1 ? BASE : `${BASE}?page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return await res.text();
}

function extractUrls(html) {
  const urls = [];
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(html)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

async function fetchName(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
    if (!res.ok) return null;
    const html = await res.text();
    const m = H1_RE.exec(html);
    if (!m) return null;
    return m[1].replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  } catch { return null; }
}

async function main() {
  // 1. Tüm liste sayfalarından URL topla
  const urls = [];
  const seen = new Set();
  for (let page = 1; page <= 15; page++) {
    let html;
    try { html = await fetchPage(page); }
    catch (e) { console.warn(`  ! page ${page} fail: ${e.message}`); break; }
    const pageUrls = extractUrls(html);
    if (pageUrls.length === 0) { console.log(`  page ${page}: 0 → stop`); break; }
    let added = 0;
    for (const u of pageUrls) {
      if (seen.has(u)) continue;
      seen.add(u);
      urls.push(u);
      added += 1;
    }
    console.log(`  page ${page}: +${added} (total ${urls.length})`);
  }

  // 2. Her URL için detay sayfasının <h1>'inden gerçek STK adını al (paralel batch)
  console.log(`\n${urls.length} STK detay sayfasından isimler çekiliyor...`);
  const items = [];
  const BATCH = 10;
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    const names = await Promise.all(chunk.map((u) => fetchName(u)));
    for (let j = 0; j < chunk.length; j++) {
      if (names[j]) items.push({ name: names[j], website: chunk[j] });
    }
    process.stdout.write(`  ${Math.min(i + BATCH, urls.length)}/${urls.length}\r`);
  }
  console.log('');

  const out = { source: BASE, scrapedAt: new Date().toISOString(), items };
  writeFileSync('/tmp/scrape-tgsp.json', JSON.stringify(out, null, 2));
  console.log(`\n✓ ${items.length} STK → /tmp/scrape-tgsp.json`);
  console.log('İlk 5:');
  items.slice(0, 5).forEach((x) => console.log(`  - ${x.name}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
