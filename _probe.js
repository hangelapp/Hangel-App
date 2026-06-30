// Her markanın sitemap'indeki ÜRÜN sayısını sayar (ürünleri çekmeden — hafif).
// Çıktı: marka | mevcut ürün sayısı (veya kapalı). Çektiklerimizle birleştirmek için.
const fs = require('fs'); const zlib = require('zlib');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36 Chrome/120 Safari/537.36';

async function fetchText(url, ms = 12000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: c.signal });
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (url.endsWith('.gz') || (b[0] === 0x1f && b[1] === 0x8b)) { try { return zlib.gunzipSync(b).toString('utf8'); } catch { return b.toString('utf8'); } }
    return b.toString('utf8');
  } catch { return null; } finally { clearTimeout(t); }
}
const locs = (xml) => [...(xml || '').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
const isProd = (u) => /-p-\d|-p\d|\/p\/|\/p-\d|\/urun|\/product|\/dp\/|\/pd\/|\/item|-pr-\d|prd|\.html?$/i.test(u) && !/\/(category|kategori|c-\d|liste|blog|kampanya|sitemap)/i.test(u);

async function countBrand(domain) {
  // Shopify dene
  for (const host of [`https://www.${domain}`, `https://${domain}`]) {
    const t = await fetchText(`${host}/products.json?limit=1`);
    if (t) { try { const j = JSON.parse(t); if (j && Array.isArray(j.products)) return { n: 'shopify', host }; } catch {} }
  }
  // sitemap
  let sitemaps = [];
  const robots = await fetchText(`https://www.${domain}/robots.txt`);
  if (robots) sitemaps = [...robots.matchAll(/Sitemap:\s*(\S+)/gi)].map((m) => m[1]);
  if (!sitemaps.length) sitemaps = [`https://www.${domain}/sitemap.xml`, `https://www.${domain}/sitemap_index.xml`];
  let cands = [];
  for (const sm of sitemaps.slice(0, 4)) {
    const xml = await fetchText(sm); if (!xml) continue;
    let l = locs(xml);
    const subs = l.filter((x) => /\.xml/i.test(x));
    if (subs.length && !l.some(isProd)) {
      const pref = subs.filter((s) => /product|urun|catalog/i.test(s));
      for (const s of (pref.length ? pref : subs).slice(0, 8)) { cands.push(...locs(await fetchText(s))); }
    } else cands.push(...l);
    if (cands.length > 30000) break;
  }
  const prods = cands.filter(isProd);
  return { n: prods.length, host: `https://www.${domain}` };
}

// Shopify sayımı: ürün sitemap'inden say
async function shopifyCount(host) {
  let total = 0;
  for (let i = 1; i <= 20; i++) {
    const xml = await fetchText(`${host}/sitemap_products_${i}.xml`);
    if (!xml) break;
    total += locs(xml).filter((u) => /\/products\//.test(u)).length;
  }
  return total;
}

(async () => {
  const groups = JSON.parse(fs.readFileSync('/tmp/groups.json', 'utf8'));
  const CC = 8;
  const out = [];
  for (let i = 0; i < groups.length; i += CC) {
    const chunk = groups.slice(i, i + CC);
    const res = await Promise.all(chunk.map(async (b) => {
      try {
        const r = await countBrand(b.domain);
        let count = r.n;
        if (r.n === 'shopify') { count = await shopifyCount(r.host) || 'shopify(?)'; }
        return { name: b.name, short: b.short, count };
      } catch { return { name: b.name, short: b.short, count: 0 }; }
    }));
    out.push(...res);
    res.forEach((r) => console.log(`${typeof r.count === 'number' ? String(r.count).padStart(6) : r.count}  ${r.name} [${r.short}]`));
  }
  fs.writeFileSync('/tmp/probe.json', JSON.stringify(out));
})();
