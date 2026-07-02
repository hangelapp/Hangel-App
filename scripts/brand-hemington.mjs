#!/usr/bin/env node
// Brand scraper: Hemington (hangel.org / Affocean offer_id 2845)
// Source: https://www.hemington.com.tr sitemap product.xml -> JSON-LD Product per page.
// Output: scripts/out/affocean-hemington.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out", "affocean-hemington.json");

const OFFER_ID = "2845";
const AFF_ID = "7873";
const BRAND_NAME = "Hemington";
const SITEMAP = "https://www.hemington.com.tr/xml/sitemap/product.xml";
const TARGET = Number(process.argv[2] || 200);
const CONCURRENCY = 8;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const HEADERS = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
};

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
    } catch (e) {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

function abs(u) {
  if (!u) return null;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return "https://www.hemington.com.tr" + u;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

function affTrack(productPage) {
  return (
    "https://ad.afftrck.com/aff_c?offer_id=" +
    OFFER_ID +
    "&aff_id=" +
    AFF_ID +
    "&url=" +
    encodeURIComponent(productPage)
  );
}

function toNumber(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function parseSitemapLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) locs.push(m[1].trim());
  return locs;
}

function extractJsonLdProduct(html) {
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let raw = m[1].trim();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data)
      ? data
      : data["@graph"]
      ? data["@graph"]
      : [data];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const t = node["@type"];
      const isProduct =
        t === "Product" || (Array.isArray(t) && t.includes("Product"));
      if (isProduct) return node;
    }
  }
  return null;
}

function metaContent(html, attr, val) {
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${val}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${val}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function cleanText(s) {
  if (!s) return "";
  return String(s)
    .replace(/\\(['"])/g, "$1") // strip stray backslash-escaped quotes from source JSON-LD
    .replace(/\s+/g, " ")
    .trim();
}

async function buildProduct(pageUrl, sitemapImage) {
  const html = await fetchText(pageUrl);
  if (!html) return null;

  const p = extractJsonLdProduct(html);

  let title, description, price, images, externalId, availabilityRaw;

  if (p) {
    title = cleanText(p.name);
    description = cleanText(p.description);
    const offers = Array.isArray(p.offers) ? p.offers[0] : p.offers;
    price = toNumber(offers && offers.price);
    availabilityRaw = offers && offers.availability;
    images = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
    externalId =
      (p.sku && String(p.sku).replace(/[|\s]+/g, "-")) ||
      (p.productID && String(p.productID)) ||
      null;
  }

  // Fallbacks from meta tags
  if (!title) title = cleanText(metaContent(html, "property", "og:title"));
  if (!description)
    description = cleanText(metaContent(html, "name", "description"));
  if (price == null)
    price = toNumber(metaContent(html, "itemprop", "price"));
  if (!images || !images.length) {
    const og = metaContent(html, "property", "og:image");
    images = og ? [og] : [];
  }
  if ((!images || !images.length) && sitemapImage) images = [sitemapImage];

  const imageLink = abs(images && images[0]);
  if (!title || price == null || !imageLink) return null;

  // externalId from slug fallback (must be unique)
  if (!externalId) {
    externalId = pageUrl.split("/").filter(Boolean).pop();
  }

  const availability =
    availabilityRaw && /OutOfStock|SoldOut/i.test(availabilityRaw)
      ? "out of stock"
      : "in stock";

  return {
    id: "affocean-2845-" + externalId,
    source: "affocean",
    feedId: OFFER_ID,
    offerId: OFFER_ID,
    brandId: null,
    brandName: BRAND_NAME,
    externalId: String(externalId),
    title,
    description,
    price,
    salePrice: null,
    currency: "TRY",
    imageLink,
    productUrl: affTrack(pageUrl),
    availability,
  };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const cur = idx++;
      try {
        const r = await worker(items[cur], cur);
        if (r) results.push(r);
      } catch {}
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, next)
  );
  return results;
}

async function main() {
  console.log("▸ Hemington sitemap:", SITEMAP);
  const xml = await fetchText(SITEMAP);
  if (!xml) throw new Error("sitemap product.xml alınamadı");

  // Parse <url> blocks to pair loc + image
  const entries = [];
  const urlRe = /<url>([\s\S]*?)<\/url>/gi;
  let um;
  while ((um = urlRe.exec(xml))) {
    const block = um[1];
    const loc = (block.match(/<loc>\s*([^<]+?)\s*<\/loc>/i) || [])[1];
    const img = (block.match(/<image:loc>\s*([^<]+?)\s*<\/image:loc>/i) ||
      [])[1];
    if (loc) entries.push({ url: loc.trim(), image: img ? img.trim() : null });
  }
  console.log("  sitemap ürün URL:", entries.length);

  const seen = new Set();
  const uniq = [];
  for (const e of entries) {
    if (seen.has(e.url)) continue;
    seen.add(e.url);
    uniq.push(e);
  }

  // Cap work: fetch enough to reach TARGET valid, with headroom for OOS/misses
  const budget = Math.min(uniq.length, Math.ceil(TARGET * 1.8) + 40);
  const slice = uniq.slice(0, budget);
  console.log("  fetch bütçesi:", slice.length, "(hedef", TARGET + ")");

  const built = [];
  let processed = 0;
  const products = await runPool(
    slice,
    async (e) => {
      const prod = await buildProduct(e.url, e.image);
      processed++;
      if (processed % 25 === 0)
        process.stdout.write(
          "  ... " + processed + "/" + slice.length + " (ok " + built.length + ")\r"
        );
      if (prod) built.push(prod);
      return prod;
    },
    CONCURRENCY
  );

  // Prefer in-stock first, then trim to TARGET
  products.sort((a, b) => {
    const ai = a.availability === "in stock" ? 0 : 1;
    const bi = b.availability === "in stock" ? 0 : 1;
    return ai - bi;
  });
  const final = products.slice(0, TARGET);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(final, null, 2));
  console.log("\n✅ yazıldı:", OUT, "|", final.length, "ürün");
  const inStock = final.filter((x) => x.availability === "in stock").length;
  console.log("   in stock:", inStock, "| out of stock:", final.length - inStock);
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
