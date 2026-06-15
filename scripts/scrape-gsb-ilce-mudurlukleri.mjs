/**
 * 81 ilin GSB sayfasından İlçe Müdürlükleri listesini scrape eder.
 *
 * Akış:
 *   1. Her il homepage'inde "İlçe Müdürlükleri" link'ini bul (Playwright)
 *   2. O sayfayı yükle, 3 format'tan birinde parse et:
 *      - LABEL-PAIR: İLÇE ADI / TELEFON / FAKS / E-POSTA (İstanbul tarzı)
 *      - SEQUENCE: ilçe / müdür / tel / email sırayla 4'lü blok (Muğla tarzı)
 *      - NAME-ONLY: "{ad soyad} {ilçe} Gençlik ve Spor İlçe Müdürü" (Ankara tarzı, iletişim yok)
 *   3. Eksik email'leri {ilce}.im@gsb.gov.tr pattern ile tahmin et (fallback)
 *
 * Çıktı: /tmp/scrape-gsb-ilce-mudurlukleri.json
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PROVINCES = [
  ['adana','Adana'],['adiyaman','Adıyaman'],['afyon','Afyonkarahisar'],['agri','Ağrı'],
  ['aksaray','Aksaray'],['amasya','Amasya'],['ankara','Ankara'],['antalya','Antalya'],
  ['ardahan','Ardahan'],['artvin','Artvin'],['aydin','Aydın'],['balikesir','Balıkesir'],
  ['bartin','Bartın'],['batman','Batman'],['bayburt','Bayburt'],['bilecik','Bilecik'],
  ['bingol','Bingöl'],['bitlis','Bitlis'],['bolu','Bolu'],['burdur','Burdur'],
  ['bursa','Bursa'],['canakkale','Çanakkale'],['cankiri','Çankırı'],['corum','Çorum'],
  ['denizli','Denizli'],['diyarbakir','Diyarbakır'],['duzce','Düzce'],['edirne','Edirne'],
  ['elazig','Elazığ'],['erzincan','Erzincan'],['erzurum','Erzurum'],['eskisehir','Eskişehir'],
  ['gaziantep','Gaziantep'],['giresun','Giresun'],['gumushane','Gümüşhane'],['hakkari','Hakkari'],
  ['hatay','Hatay'],['igdir','Iğdır'],['isparta','Isparta'],['istanbul','İstanbul'],
  ['izmir','İzmir'],['kahramanmaras','Kahramanmaraş'],['karabuk','Karabük'],['karaman','Karaman'],
  ['kars','Kars'],['kastamonu','Kastamonu'],['kayseri','Kayseri'],['kilis','Kilis'],
  ['kirikkale','Kırıkkale'],['kirklareli','Kırklareli'],['kirsehir','Kırşehir'],['kocaeli','Kocaeli'],
  ['konya','Konya'],['kutahya','Kütahya'],['malatya','Malatya'],['manisa','Manisa'],
  ['mardin','Mardin'],['mersin','Mersin'],['mugla','Muğla'],['mus','Muş'],
  ['nevsehir','Nevşehir'],['nigde','Niğde'],['ordu','Ordu'],['osmaniye','Osmaniye'],
  ['rize','Rize'],['sakarya','Sakarya'],['samsun','Samsun'],['sanliurfa','Şanlıurfa'],
  ['siirt','Siirt'],['sinop','Sinop'],['sirnak','Şırnak'],['sivas','Sivas'],
  ['tekirdag','Tekirdağ'],['tokat','Tokat'],['trabzon','Trabzon'],['tunceli','Tunceli'],
  ['usak','Uşak'],['van','Van'],['yalova','Yalova'],['yozgat','Yozgat'],
  ['zonguldak','Zonguldak'],
];

function slugify(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')
    .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

function cleanText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function extractPhone(s) {
  if (!s) return null;
  const m = s.match(/\(?0\s?\d{3}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/);
  return m ? m[0].replace(/\s+/g, ' ').trim() : null;
}

function extractEmail(s) {
  if (!s) return null;
  const m = s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : null;
}

// ── PARSER 1: Label-pair (İLÇE ADI / TELEFON / FAKS / E-POSTA) ────────────
function parseLabelPair(cells) {
  const items = [];
  let cur = null;
  let nextField = null;
  for (let i = 0; i < cells.length; i++) {
    const c = cleanText(cells[i]);
    if (!c) continue;
    const upper = c.toLocaleUpperCase('tr');
    if (upper === 'İLÇE ADI' || upper === 'ILCE ADI') {
      if (cur && cur.ilce) items.push(cur);
      cur = { ilce: null, mudur: null, address: null, phone: null, fax: null, email: null };
      nextField = 'ilce';
      continue;
    }
    if (!cur) continue;
    if (/^[İI]LÇE\s+MÜDÜR(?:\s*V\.?)?$|^MÜDÜR$|^KAMP\s+EĞİTİM\s+MERKEZİ$/.test(upper)) { nextField = 'mudur'; continue; }
    if (upper === 'ADRES') { nextField = 'address'; continue; }
    if (upper === 'TELEFON' || upper === 'TEL') { nextField = 'phone'; continue; }
    if (upper === 'FAKS' || upper === 'FAX') { nextField = 'fax'; continue; }
    if (/^E\s*[–\-]\s*POSTA$|^E[\-\s]*MAIL$|^EPOSTA$|^MAIL$/.test(upper)) { nextField = 'email'; continue; }
    if (nextField === 'ilce') cur.ilce = c.replace(/^İLÇE ADI\s*/i, '');
    else if (nextField === 'mudur') cur.mudur = c;
    else if (nextField === 'address') cur.address = c;
    else if (nextField === 'phone') cur.phone = extractPhone(c) || c;
    else if (nextField === 'fax') cur.fax = extractPhone(c) || (c.length > 30 ? null : c);
    else if (nextField === 'email') cur.email = extractEmail(c);
    nextField = null;
  }
  if (cur && cur.ilce) items.push(cur);
  return items.filter((x) => x.ilce && /^[A-ZÇĞİÖŞÜA-Z0-9 ]+$/.test(x.ilce));
}

// ── PARSER 2: Sequence (ilçe → müdür → tel → email tekrar) ─────────────────
function parseSequence(cells) {
  const items = [];
  const isIlce = (s) => /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ \-]{2,}$/.test(s) && s.length < 35;
  const isPhone = (s) => /^\(?0\s?\d{3}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/.test(s);
  const isEmail = (s) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s);
  const isName = (s) => /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]*)*\s+[A-ZÇĞİÖŞÜ]{2,}/.test(s);

  let cur = null;
  for (const raw of cells) {
    const c = cleanText(raw);
    if (!c) continue;
    if (isIlce(c)) {
      if (cur?.ilce) items.push(cur);
      cur = { ilce: c, mudur: null, phone: null, email: null };
    } else if (cur) {
      if (!cur.mudur && isName(c)) cur.mudur = c;
      else if (!cur.phone && isPhone(c)) cur.phone = c;
      else if (!cur.email && isEmail(c)) cur.email = c;
    }
  }
  if (cur?.ilce) items.push(cur);
  return items;
}

// ── PARSER 3: Name-only (Ankara — "Burak KOCABEYOĞLU Altındağ Gençlik ve Spor İlçe Müdürü") ──
function parseNameOnly(cells) {
  const items = [];
  const re = /^(.+?)\s+([A-ZÇĞİÖŞÜ][A-Za-zçğıöşüÇĞİÖŞÜ]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)*)\s+Gençlik\s+ve\s+Spor\s+İlçe\s+Müdür/u;
  for (const raw of cells) {
    const c = cleanText(raw);
    const m = c.match(re);
    if (m) {
      items.push({ ilce: m[2].trim(), mudur: m[1].trim(), phone: null, email: null, address: null });
    }
  }
  return items;
}

function uniqueByIlce(items) {
  const seen = new Set();
  return items.filter((it) => {
    const k = (it.ilce || '').toLocaleLowerCase('tr');
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function findIlceUrl(page, base) {
  return await page.$$eval('a', (as) => {
    for (const a of as) {
      const t = (a.textContent || '').trim();
      const h = a.getAttribute('href') || '';
      if (!h) continue;
      if (/^İlçe\s+Müdürlükleri$|^İlçe\s+Müdürleri$|^İLÇE\s+MÜDÜRLÜKLERİ$|^İLÇE\s+MÜDÜRLERİ$/i.test(t)) return h;
      if (/ilce[%20]+m(udur|üdür)/i.test(h)) return h;
    }
    return null;
  }).then((href) => {
    if (!href) return null;
    if (href.startsWith('http')) return href;
    if (!href.startsWith('/')) href = '/' + href;
    return base + href;
  }).catch(() => null);
}

async function scrapeIl(ctx, slug, name) {
  const base = `https://${slug}.gsb.gov.tr`;
  const page = await ctx.newPage();
  try {
    // 1. Homepage'i aç, ilçe link'i bul
    await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const url = await findIlceUrl(page, base);
    if (!url) return { il: name, slug, error: 'no-ilce-link', items: [] };

    // 2. İlçe sayfasını aç
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // 3. Cell'leri çek
    const cells = await page.$$eval(
      'main table td, main table th, main p, main li, .col-content p, .col-content td, .sayfaIcerik p, .sayfaIcerik td',
      (els) => els.map((el) => el.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean)
    );

    // 4. Hangi parser? Hibrit dene, en fazla item üreteni seç.
    const tryParsers = [parseLabelPair, parseSequence, parseNameOnly];
    let best = { items: [], parser: 'none' };
    for (const p of tryParsers) {
      try {
        const items = uniqueByIlce(p(cells));
        if (items.length > best.items.length) best = { items, parser: p.name };
      } catch { /* skip */ }
    }

    // 5. Email fallback: {ilce-slug}.im@gsb.gov.tr (Türkiye standart pattern)
    for (const it of best.items) {
      if (!it.email && it.ilce) {
        const ilceSlug = slugify(it.ilce);
        it.emailGuess = `${ilceSlug}.im@gsb.gov.tr`;
      }
    }

    return { il: name, slug, url, parser: best.parser, items: best.items };
  } catch (e) {
    return { il: name, slug, error: e.message, items: [] };
  } finally {
    await page.close().catch(() => {});
  }
}

async function processBatch(slice, results, indices) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: UA,
    locale: 'tr-TR',
    viewport: { width: 1366, height: 850 },
    extraHTTPHeaders: { 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' },
  });
  await ctx.route('**/*', (route) => {
    const t = route.request().resourceType();
    if (['image', 'font', 'media', 'stylesheet'].includes(t)) return route.abort();
    return route.continue();
  });

  const CONCURRENCY = 4;
  let i = 0;
  async function worker(wid) {
    while (i < slice.length) {
      const li = i++;
      const my = indices[li];
      const [slug, name] = slice[li];
      const r = await scrapeIl(ctx, slug, name);
      results[my] = r;
      const n = r.items.length;
      const phones = r.items.filter((x) => x.phone).length;
      const emails = r.items.filter((x) => x.email).length;
      const tag = r.error ? `ERR ${r.error}` : `${n} ilçe (tel:${phones} mail:${emails}) [${r.parser}]`;
      console.log(`[w${wid} ${String(my + 1).padStart(2, '0')}/${PROVINCES.length}] ${name.padEnd(20)} ${tag}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  await ctx.close().catch(() => {});
  await browser.close().catch(() => {});
}

async function main() {
  const results = new Array(PROVINCES.length);
  const BATCH = 20;
  for (let i = 0; i < PROVINCES.length; i += BATCH) {
    const slice = PROVINCES.slice(i, i + BATCH);
    const indices = slice.map((_, k) => i + k);
    console.log(`\n>>> batch ${Math.floor(i / BATCH) + 1} (${i + 1}-${i + slice.length})`);
    await processBatch(slice, results, indices);
  }

  // Retry empties
  const retryIdx = [];
  for (let i = 0; i < results.length; i++) {
    if (!results[i] || results[i].error || results[i].items.length === 0) retryIdx.push(i);
  }
  if (retryIdx.length) {
    console.log(`\n>>> retry ${retryIdx.length}: ${retryIdx.map((i) => PROVINCES[i][1]).join(', ')}`);
    await processBatch(retryIdx.map((i) => PROVINCES[i]), results, retryIdx);
  }

  const out = {
    source: 'https://*.gsb.gov.tr/Sayfalar/*/İlçe Müdürlükleri.aspx',
    scrapedAt: new Date().toISOString(),
    provinces: results,
  };
  const totalItems = results.reduce((a, r) => a + (r?.items?.length || 0), 0);
  out.totalIlce = totalItems;

  writeFileSync('/tmp/scrape-gsb-ilce-mudurlukleri.json', JSON.stringify(out, null, 2));
  console.log(`\n✓ ${totalItems} ilçe — /tmp/scrape-gsb-ilce-mudurlukleri.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
