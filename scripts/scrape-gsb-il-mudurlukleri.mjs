// Scrape GSB Il Mudurlukleri iletisim bilgileri via Playwright
// Anti-bot: F5/TSPD JS challenge; Playwright cookie acquire + page.goto kullanir.

import { writeFileSync } from "node:fs";
import { parse } from "node-html-parser";
import { chromium } from "playwright";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PROVINCES = [
  ["adana", "Adana"],
  ["adiyaman", "Adıyaman"],
  ["afyon", "Afyonkarahisar"],
  ["agri", "Ağrı"],
  ["aksaray", "Aksaray"],
  ["amasya", "Amasya"],
  ["ankara", "Ankara"],
  ["antalya", "Antalya"],
  ["ardahan", "Ardahan"],
  ["artvin", "Artvin"],
  ["aydin", "Aydın"],
  ["balikesir", "Balıkesir"],
  ["bartin", "Bartın"],
  ["batman", "Batman"],
  ["bayburt", "Bayburt"],
  ["bilecik", "Bilecik"],
  ["bingol", "Bingöl"],
  ["bitlis", "Bitlis"],
  ["bolu", "Bolu"],
  ["burdur", "Burdur"],
  ["bursa", "Bursa"],
  ["canakkale", "Çanakkale"],
  ["cankiri", "Çankırı"],
  ["corum", "Çorum"],
  ["denizli", "Denizli"],
  ["diyarbakir", "Diyarbakır"],
  ["duzce", "Düzce"],
  ["edirne", "Edirne"],
  ["elazig", "Elazığ"],
  ["erzincan", "Erzincan"],
  ["erzurum", "Erzurum"],
  ["eskisehir", "Eskişehir"],
  ["gaziantep", "Gaziantep"],
  ["giresun", "Giresun"],
  ["gumushane", "Gümüşhane"],
  ["hakkari", "Hakkari"],
  ["hatay", "Hatay"],
  ["igdir", "Iğdır"],
  ["isparta", "Isparta"],
  ["istanbul", "İstanbul"],
  ["izmir", "İzmir"],
  ["kahramanmaras", "Kahramanmaraş"],
  ["karabuk", "Karabük"],
  ["karaman", "Karaman"],
  ["kars", "Kars"],
  ["kastamonu", "Kastamonu"],
  ["kayseri", "Kayseri"],
  ["kilis", "Kilis"],
  ["kirikkale", "Kırıkkale"],
  ["kirklareli", "Kırklareli"],
  ["kirsehir", "Kırşehir"],
  ["kocaeli", "Kocaeli"],
  ["konya", "Konya"],
  ["kutahya", "Kütahya"],
  ["malatya", "Malatya"],
  ["manisa", "Manisa"],
  ["mardin", "Mardin"],
  ["mersin", "Mersin"],
  ["mugla", "Muğla"],
  ["mus", "Muş"],
  ["nevsehir", "Nevşehir"],
  ["nigde", "Niğde"],
  ["ordu", "Ordu"],
  ["osmaniye", "Osmaniye"],
  ["rize", "Rize"],
  ["sakarya", "Sakarya"],
  ["samsun", "Samsun"],
  ["sanliurfa", "Şanlıurfa"],
  ["siirt", "Siirt"],
  ["sinop", "Sinop"],
  ["sirnak", "Şırnak"],
  ["sivas", "Sivas"],
  ["tekirdag", "Tekirdağ"],
  ["tokat", "Tokat"],
  ["trabzon", "Trabzon"],
  ["tunceli", "Tunceli"],
  ["usak", "Uşak"],
  ["van", "Van"],
  ["yalova", "Yalova"],
  ["yozgat", "Yozgat"],
  ["zonguldak", "Zonguldak"],
];

function decodeEnt(s) {
  if (!s) return s;
  return String(s)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&ccedil;/g, "ç")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&ouml;/g, "ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&uuml;/g, "ü")
    .replace(/&Scaron;/g, "Ş")
    .replace(/&scaron;/g, "ş")
    .replace(/&#199;/g, "Ç")
    .replace(/&#231;/g, "ç")
    .replace(/&#214;/g, "Ö")
    .replace(/&#246;/g, "ö")
    .replace(/&#220;/g, "Ü")
    .replace(/&#252;/g, "ü")
    .replace(/&#286;/g, "Ğ")
    .replace(/&#287;/g, "ğ")
    .replace(/&#304;/g, "İ")
    .replace(/&#305;/g, "ı")
    .replace(/&#350;/g, "Ş")
    .replace(/&#351;/g, "ş")
    .replace(/&#xD;/g, "")
    .replace(/&[a-z]+;/gi, " ");
}

function cleanText(s) {
  if (!s) return s;
  return decodeEnt(String(s))
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

function isChallengePage(html) {
  if (!html) return true;
  if (html.length < 4000) return true;
  const head = html.slice(0, 4000);
  return /TSPD|bobcmn|Please enable JavaScript|Your support ID/i.test(head);
}

function pickContact(html, slug, ilName) {
  const root = parse(html);
  const data = { phone: null, fax: null, email: null, address: null, kep: null };

  // Try to constrain to content area (avoid nav/footer addresses)
  const container =
    root.querySelector(".col-content") ||
    root.querySelector(".sayfaIcerik") ||
    root.querySelector("#content") ||
    root.querySelector("main") ||
    root.querySelector("article") ||
    root.querySelector(".container") ||
    root;
  const fullText = cleanText(container.text || "");

  // 1. Table cell pairs
  const tds = container.querySelectorAll("td");
  for (let i = 0; i < tds.length - 1; i++) {
    const lbl = cleanText(tds[i].text || "").toLowerCase().replace(/:$/, "").trim();
    if (!lbl || lbl.length > 35) continue;
    const nxt = cleanText(tds[i + 1].text || "");
    if (!nxt || nxt.length > 600) continue;
    if (/^adres$/i.test(lbl) && !data.address) data.address = nxt;
    else if (/^telefon$/i.test(lbl) && !data.phone) data.phone = nxt;
    else if (/^i?leti[sş]im$/i.test(lbl) && !data.phone) data.phone = nxt;
    else if (/^faks$/i.test(lbl) && !data.fax) data.fax = nxt;
    else if (/^kep( adresi)?$/i.test(lbl) && !data.kep) data.kep = nxt;
    else if (/^(e[\s-]?posta|e[\s-]?mail|mail)( adresi)?$/i.test(lbl) && !data.email) data.email = nxt;
  }

  // 2. Paragraph-pair: <p>Adres</p><p>...</p>
  if (!data.address || !data.phone) {
    const ps = container.querySelectorAll("p");
    for (let i = 0; i < ps.length - 1; i++) {
      const lbl = cleanText(ps[i].text || "").toLowerCase().replace(/:$/, "").trim();
      const nxt = cleanText(ps[i + 1].text || "");
      if (!nxt || nxt.length > 600) continue;
      if (/^adres$/i.test(lbl) && !data.address) data.address = nxt;
      else if (/^telefon$/i.test(lbl) && !data.phone) data.phone = nxt;
      else if (/^i?leti[sş]im$/i.test(lbl) && !data.phone) data.phone = nxt;
    }
  }

  // 3. Inline label-in-same-block: "Telefon: ...", "Adres: ...", "Faks: ..."
  if (!data.phone || !data.address || !data.fax) {
    const blockSel = "p, td, li, div";
    const blocks = container.querySelectorAll(blockSel);
    for (const el of blocks) {
      const txt = cleanText(el.text || "");
      if (!txt || txt.length > 800) continue;
      let m;
      if (!data.phone && (m = txt.match(/^(?:Telefon|TELEFON|Tel|TEL)\s*[:\-]\s*(.+)$/))) {
        data.phone = m[1].trim();
      }
      if (!data.fax && (m = txt.match(/^(?:Faks|FAKS|Fax|FAX)\s*[:\-]\s*(.+)$/))) {
        data.fax = m[1].trim();
      }
      if (!data.address && (m = txt.match(/^(?:Adres|ADRES|Adresimiz)\s*[:\-]\s*(.+)$/))) {
        data.address = m[1].trim();
      }
      if (!data.email && (m = txt.match(/^(?:E[\s-]?Posta|E[\s-]?Mail|EPOSTA|Mail(?:\s+Adresi)?|E-Posta\s+Adresi)\s*[:\-]\s*(.+)$/i))) {
        const cand = m[1].trim();
        const em = cand.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
        if (em) data.email = em[0];
      }
      if (!data.kep && (m = txt.match(/^(?:KEP|Kep|Kep\s+Adresi)\s*[:\-]\s*(.+)$/i))) {
        const cand = m[1].trim();
        const em = cand.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
        if (em) data.kep = em[0];
      }
    }
  }

  // 4. Email regex fallback
  if (!data.email) {
    const emails = (fullText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
      .filter((e) => !/\.(png|jpg|gif|svg|jpeg|webp)$/i.test(e))
      .filter((e) => !/kep\.tr$/i.test(e));
    const slugMail = emails.find((e) => e.toLowerCase() === `${slug}@gsb.gov.tr`);
    const gsbMail = emails.find((e) => /@gsb\.gov\.tr$/i.test(e));
    data.email = slugMail || gsbMail || emails[0] || null;
  }
  if (!data.kep) {
    const emails = (fullText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []);
    const kep = emails.find((e) => /kep\.tr$/i.test(e));
    if (kep) data.kep = kep;
  }

  // 5. Phone regex fallback
  if (!data.phone) {
    const phones =
      fullText.match(/\(?0\s?\d{3}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/g) || [];
    if (phones[0]) data.phone = phones.slice(0, 3).join(" / ");
  }

  // 6. Address heuristic: find blocks containing common TR address tokens (mah, cad, sokak)
  //    AND the il name itself, that aren't navigation/footer.
  if (!data.address) {
    const blocks = container.querySelectorAll("p, td, li, div");
    const ilUpper = ilName.toLocaleUpperCase("tr");
    const ilLower = ilName.toLocaleLowerCase("tr");
    const candidates = [];
    for (const el of blocks) {
      const txt = cleanText(el.text || "");
      if (!txt || txt.length < 15 || txt.length > 400) continue;
      // Skip if has html link to other page
      if (/^Telefon|^Faks|^Tel|^Fax|^Mail|^E-?Posta|^E-?Mail|^Web|^KEP/i.test(txt)) continue;
      const lower = txt.toLocaleLowerCase("tr");
      const hasTokens =
        /mah\.|mahallesi|mahalle|cad\.|cadde|caddesi|sok\.|sokak|sokağı|sk\.|blv\.|bulvar|no:\s*\d|no\s*:\s*\d|kat\s*:|posta\s+kodu/i.test(
          txt,
        );
      if (!hasTokens) continue;
      // Should mention il
      if (!(lower.includes(ilLower) || txt.includes(ilUpper))) continue;
      candidates.push(txt);
    }
    if (candidates.length) {
      // Pick the longest meaningful one (most descriptive address)
      candidates.sort((a, b) => b.length - a.length);
      data.address = candidates[0];
    }
  }

  // Normalize whitespace and strip stray leading colons
  for (const k of Object.keys(data)) {
    if (typeof data[k] === "string") {
      data[k] = cleanText(data[k]).replace(/^[:\s\-]+/, "").trim();
      if (!data[k]) data[k] = null;
    }
  }

  // Trim phone to first 3 numbers if too long
  if (data.phone) {
    const phones =
      data.phone.match(/\(?0\s?\d{3}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/g) || [];
    if (phones.length) data.phone = phones.slice(0, 4).join(" / ");
  }

  return data;
}

async function gotoSafe(page, url, opts = {}) {
  const { extraWait = 0 } = opts;
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    let html = await page.content();
    if (isChallengePage(html)) {
      // F5 TSPD JS challenge auto-runs and reloads. Wait + retry.
      await page.waitForTimeout(3000);
      html = await page.content();
      if (isChallengePage(html)) {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => {});
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        html = await page.content();
      }
    }
    if (extraWait) await page.waitForTimeout(extraWait);
    return { html, status: resp ? resp.status() : 0, url: page.url() };
  } catch (e) {
    return { html: null, status: 0, error: e.message };
  }
}

async function discoverIletisimHref(page, base) {
  const hrefs = await page
    .$$eval("a", (as) =>
      as
        .map((a) => ({
          href: a.getAttribute("href") || "",
          text: (a.textContent || "").trim(),
        }))
        .filter((x) => x.href && /Sayfalar\/\d+\/.+\/[Ii]leti[şs]im/.test(x.href)),
    )
    .catch(() => []);
  if (hrefs.length === 0) return null;
  const minusOne = hrefs.find((h) => /\/-1\//.test(h.href)) || hrefs[0];
  let href = minusOne.href;
  if (href.startsWith("http")) return href;
  if (!href.startsWith("/")) href = "/" + href;
  return base + href;
}

async function scrapeIl(context, slug, ilName) {
  const base = `https://${slug}.gsb.gov.tr`;
  const page = await context.newPage();
  page.setDefaultTimeout(35000);
  try {
    // 1. Visit root to acquire TSPD cookie + discover iletişim URL
    const root = await gotoSafe(page, base + "/");
    let iletisimUrl = null;
    if (root.html && !isChallengePage(root.html)) {
      iletisimUrl = await discoverIletisimHref(page, base);
    }

    const candidates = [];
    if (iletisimUrl) candidates.push(iletisimUrl);
    // Common fallback IDs (rare we'll need these if discovery worked, but safety)
    for (const id of [1946, 1985, 1947, 1948, 1949, 1950, 1951, 1952]) {
      const u = `${base}/Sayfalar/${id}/-1/iletisim`;
      if (!candidates.includes(u)) candidates.push(u);
    }

    let html = null;
    let usedUrl = null;
    for (const u of candidates) {
      const r = await gotoSafe(page, u);
      if (!r.html || isChallengePage(r.html)) continue;
      // Must contain address/phone signal
      const txtLen = r.html.length;
      if (txtLen < 8000) continue;
      const hasAdres = /Adres/.test(r.html);
      const hasPhone = /\(?0\s?\d{3}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/.test(r.html);
      const hasEmail = /@gsb\.gov\.tr/.test(r.html);
      if (hasAdres || hasPhone || hasEmail) {
        html = r.html;
        usedUrl = u;
        break;
      }
    }

    if (!html) {
      return {
        name: `${ilName} Gençlik ve Spor İl Müdürlüğü`,
        city: ilName,
        website: base,
        _error: "no-contact-page-found",
      };
    }
    const c = pickContact(html, slug, ilName);
    const out = {
      name: `${ilName} Gençlik ve Spor İl Müdürlüğü`,
      city: ilName,
      website: base,
    };
    if (c.phone) out.phone = c.phone;
    if (c.email) out.email = c.email;
    if (c.address) out.address = c.address;
    if (c.fax) out.fax = c.fax;
    if (c.kep) out.kep = c.kep;
    out.iletisimUrl = usedUrl;
    return out;
  } finally {
    await page.close().catch(() => {});
  }
}

async function processBatch(slice, results, indices) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: UA,
    locale: "tr-TR",
    viewport: { width: 1366, height: 850 },
    extraHTTPHeaders: { "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8" },
  });
  await context.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "font" || t === "media" || t === "stylesheet") {
      return route.abort();
    }
    return route.continue();
  });

  const CONCURRENCY = 3;
  let local = 0;
  async function worker(wid) {
    while (local < slice.length) {
      const li = local++;
      const my = indices[li];
      const [slug, name] = slice[li];
      try {
        const r = await scrapeIl(context, slug, name);
        results[my] = r;
        const p = r.phone ? "P" : "-";
        const e = r.email ? "E" : "-";
        const a = r.address ? "A" : "-";
        process.stdout.write(
          `[w${wid} ${(my + 1).toString().padStart(2, "0")}/${PROVINCES.length}] ${name} ${p}${e}${a}\n`,
        );
      } catch (err) {
        results[my] = {
          name: `${name} Gençlik ve Spor İl Müdürlüğü`,
          city: name,
          website: `https://${slug}.gsb.gov.tr`,
          _error: err.message,
        };
        process.stdout.write(
          `[w${wid} ${my + 1}/${PROVINCES.length}] ${name} ERR ${err.message}\n`,
        );
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

async function main() {
  const out = {
    source: "https://gsb.gov.tr/tr/sayfa/5037-tasra-teskilati",
    scrapedAt: new Date().toISOString(),
    items: [],
  };

  const results = new Array(PROVINCES.length);

  // Process in batches to avoid browser-context memory bloat / crashes
  const BATCH = 20;
  for (let i = 0; i < PROVINCES.length; i += BATCH) {
    const slice = PROVINCES.slice(i, i + BATCH);
    const indices = slice.map((_, k) => i + k);
    console.log(`>>> batch ${Math.floor(i / BATCH) + 1} (${i + 1}-${i + slice.length})`);
    await processBatch(slice, results, indices);
  }

  // Retry failed/incomplete ones once with fresh browser
  const retryIdx = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r || r._error || (!r.phone && !r.email && !r.address)) retryIdx.push(i);
  }
  if (retryIdx.length) {
    console.log(`>>> retry ${retryIdx.length}:`, retryIdx.map((i) => PROVINCES[i][1]).join(", "));
    const slice = retryIdx.map((i) => PROVINCES[i]);
    await processBatch(slice, results, retryIdx);
  }

  // Strip internal _error before publishing? Keep for transparency but mark.
  out.items = results;

  const outPath = "/tmp/scrape-gsb-il-mudurlukleri.json";
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("WROTE", outPath, "count=", out.items.length);
  const wp = out.items.filter((i) => i.phone).length;
  const we = out.items.filter((i) => i.email).length;
  const wa = out.items.filter((i) => i.address).length;
  console.log("coverage phone/email/address:", wp, we, wa);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
