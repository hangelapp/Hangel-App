import { chromium } from 'playwright';
import fs from 'node:fs';

// Source list extracted from https://gsb.gov.tr/tr/sayfa/5037-tasra-teskilati
const ILLER = [
  { name: 'Adana', subdomain: 'adana' },
  { name: 'Adıyaman', subdomain: 'adiyaman' },
  { name: 'Afyonkarahisar', subdomain: 'afyon' },
  { name: 'Ağrı', subdomain: 'agri' },
  { name: 'Aksaray', subdomain: 'aksaray' },
  { name: 'Amasya', subdomain: 'amasya' },
  { name: 'Ankara', subdomain: 'ankara' },
  { name: 'Antalya', subdomain: 'antalya' },
  { name: 'Ardahan', subdomain: 'ardahan' },
  { name: 'Artvin', subdomain: 'artvin' },
  { name: 'Aydın', subdomain: 'aydin' },
  { name: 'Balıkesir', subdomain: 'balikesir' },
  { name: 'Bartın', subdomain: 'bartin' },
  { name: 'Batman', subdomain: 'batman' },
  { name: 'Bayburt', subdomain: 'bayburt' },
  { name: 'Bilecik', subdomain: 'bilecik' },
  { name: 'Bingöl', subdomain: 'bingol' },
  { name: 'Bitlis', subdomain: 'bitlis' },
  { name: 'Bolu', subdomain: 'bolu' },
  { name: 'Burdur', subdomain: 'burdur' },
  { name: 'Bursa', subdomain: 'bursa' },
  { name: 'Çanakkale', subdomain: 'canakkale' },
  { name: 'Çankırı', subdomain: 'cankiri' },
  { name: 'Çorum', subdomain: 'corum' },
  { name: 'Denizli', subdomain: 'denizli' },
  { name: 'Diyarbakır', subdomain: 'diyarbakir' },
  { name: 'Düzce', subdomain: 'duzce' },
  { name: 'Edirne', subdomain: 'edirne' },
  { name: 'Elazığ', subdomain: 'elazig' },
  { name: 'Erzincan', subdomain: 'erzincan' },
  { name: 'Erzurum', subdomain: 'erzurum' },
  { name: 'Eskişehir', subdomain: 'eskisehir' },
  { name: 'Gaziantep', subdomain: 'gaziantep' },
  { name: 'Giresun', subdomain: 'giresun' },
  { name: 'Gümüşhane', subdomain: 'gumushane' },
  { name: 'Hakkari', subdomain: 'hakkari' },
  { name: 'Hatay', subdomain: 'hatay' },
  { name: 'Iğdır', subdomain: 'igdir' },
  { name: 'Isparta', subdomain: 'isparta' },
  { name: 'İstanbul', subdomain: 'istanbul' },
  { name: 'İzmir', subdomain: 'izmir' },
  { name: 'Kahramanmaraş', subdomain: 'kahramanmaras' },
  { name: 'Karabük', subdomain: 'karabuk' },
  { name: 'Karaman', subdomain: 'karaman' },
  { name: 'Kars', subdomain: 'kars' },
  { name: 'Kastamonu', subdomain: 'kastamonu' },
  { name: 'Kayseri', subdomain: 'kayseri' },
  { name: 'Kilis', subdomain: 'kilis' },
  { name: 'Kırıkkale', subdomain: 'kirikkale' },
  { name: 'Kırklareli', subdomain: 'kirklareli' },
  { name: 'Kırşehir', subdomain: 'kirsehir' },
  { name: 'Kocaeli', subdomain: 'kocaeli' },
  { name: 'Konya', subdomain: 'konya' },
  { name: 'Kütahya', subdomain: 'kutahya' },
  { name: 'Malatya', subdomain: 'malatya' },
  { name: 'Manisa', subdomain: 'manisa' },
  { name: 'Mardin', subdomain: 'mardin' },
  { name: 'Mersin', subdomain: 'mersin' },
  { name: 'Muğla', subdomain: 'mugla' },
  { name: 'Muş', subdomain: 'mus' },
  { name: 'Nevşehir', subdomain: 'nevsehir' },
  { name: 'Niğde', subdomain: 'nigde' },
  { name: 'Ordu', subdomain: 'ordu' },
  { name: 'Osmaniye', subdomain: 'osmaniye' },
  { name: 'Rize', subdomain: 'rize' },
  { name: 'Sakarya', subdomain: 'sakarya' },
  { name: 'Samsun', subdomain: 'samsun' },
  { name: 'Şanlıurfa', subdomain: 'sanliurfa' },
  { name: 'Siirt', subdomain: 'siirt' },
  { name: 'Sinop', subdomain: 'sinop' },
  { name: 'Sivas', subdomain: 'sivas' },
  { name: 'Şırnak', subdomain: 'sirnak' },
  { name: 'Tekirdağ', subdomain: 'tekirdag' },
  { name: 'Tokat', subdomain: 'tokat' },
  { name: 'Trabzon', subdomain: 'trabzon' },
  { name: 'Tunceli', subdomain: 'tunceli' },
  { name: 'Uşak', subdomain: 'usak' },
  { name: 'Van', subdomain: 'van' },
  { name: 'Yalova', subdomain: 'yalova' },
  { name: 'Yozgat', subdomain: 'yozgat' },
  { name: 'Zonguldak', subdomain: 'zonguldak' },
];

const PHONE_RE = /(?:\+90\s*)?(?:\(?0\)?[\s\-\.]?)?(?:\(?\d{3}\)?)[\s\-\.]?\d{3}[\s\-\.]?\d{2}[\s\-\.]?\d{2}/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function clean(s) {
  return s.replace(/\s+/g, ' ').replace(/\s*([,;:])\s*/g, '$1 ').trim();
}

function extractAddress(text) {
  // Try multiple patterns; format on these sites varies:
  // - "Adres\nKıbrıs Caddesi..."
  // - "Adres\t:\tBeş Minare..."
  // - "Adres: ..."
  const patterns = [
    /Adres\s*[:\-]\s*([^\n\r]{8,400})/i,           // single line "Adres: ..." or "Adres\t:\t..."
    /Adres\s*\n+([\s\S]{8,600}?)(?:\n\s*\n|İletişim|Telefon|Tel\s*[:;]|Faks|Fax|Mesai|KEP|E-Posta|E-posta|E-mail|E-Mail|Email|@|Web\s*[:;])/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      let v = clean(m[1]);
      // Drop trailing labels
      v = v.replace(/(?:Telefon|Tel|Faks|Fax|KEP|Web|E-?mail|E-?Posta).*$/i, '').trim();
      v = v.replace(/[:\s]+$/, '').trim();
      if (v.length >= 6) return v;
    }
  }
  return null;
}

function extractPhones(text) {
  const matches = text.match(PHONE_RE) || [];
  const cleaned = matches
    .map(p => p.replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' ').trim())
    .filter(p => {
      // Must contain at least 10 digits
      const digits = p.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 13;
    });
  return [...new Set(cleaned)];
}

function extractEmails(text) {
  const matches = (text.match(EMAIL_RE) || []).filter(e => !/\.(png|jpg|jpeg|gif|svg|css|js)$/i.test(e));
  return [...new Set(matches)];
}

async function discoverContactUrls(page, subdomain) {
  // Visit homepage, wait for TSPD challenge to clear, find İletişim link(s)
  const home = `https://${subdomain}.gsb.gov.tr`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      if (attempt === 2) return [];
      continue;
    }
    // Wait for the menu to populate (real navigation appears after TSPD challenge)
    try {
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll('a')).some(a => /iletisim/i.test(a.href)),
        null,
        { timeout: 25000 }
      );
    } catch {
      // Fallback: extra wait then re-check
      await page.waitForTimeout(8000);
    }
    try {
      const links = await page.$$eval('a', as =>
        as.map(a => ({ href: a.href, text: (a.textContent || '').trim() }))
          .filter(x => /iletisim|İletişim|iletişim|İLETİŞİM/i.test(x.href + ' ' + x.text))
      );
      const own = links.filter(l => l.href.includes(`${subdomain}.gsb.gov.tr`));
      own.sort((a, b) => {
        const ai = /\/iletisim($|\?|#)/i.test(a.href) ? 0 : 1;
        const bi = /\/iletisim($|\?|#)/i.test(b.href) ? 0 : 1;
        return ai - bi;
      });
      if (own.length) return own.map(o => o.href);
    } catch (e) {
      // context destroyed; retry
    }
    await page.waitForTimeout(3000);
  }
  return [];
}

async function scrapePage(page, url) {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (!resp || !resp.ok()) return null;
  await page.waitForTimeout(5500);
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
  let text = '';
  const sels = ['#divIcerik', '.icerik', '#main', 'main', '.content', '#content', 'article', 'body'];
  for (const s of sels) {
    const el = await page.$(s);
    if (el) {
      const t = await el.innerText().catch(() => '');
      if (t && t.length > text.length) text = t;
    }
  }
  if (!text) text = await page.evaluate(() => document.body?.innerText || '');
  const cutMarks = ['Hızlı Erişim', 'Bağlı Kuruluşlar', 'Tüm Hakları Saklıdır', 'Kredi/Yurt İşlemleri', 'Genç Bilgi Sistemi'];
  for (const m of cutMarks) {
    const i = text.indexOf(m);
    if (i > 80) { text = text.slice(0, i); break; }
  }
  return text;
}

async function scrapeOne(browser, il) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'tr-TR',
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  const item = {
    name: `${il.name} Gençlik ve Spor İl Müdürlüğü`,
    city: il.name,
    website: `https://${il.subdomain}.gsb.gov.tr`,
    phone: null,
    email: null,
    address: null,
    _phones: [],
    _emails: [],
    _source: null,
    _error: null,
  };

  try {
    const candidates = await discoverContactUrls(page, il.subdomain);
    if (!candidates.length) {
      item._error = 'no iletisim link found';
      await ctx.close();
      return item;
    }
    for (const url of candidates) {
      try {
        const text = await scrapePage(page, url);
        if (!text) { item._error = `empty page ${url}`; continue; }
        const address = extractAddress(text);
        const phones = extractPhones(text);
        const emails = extractEmails(text);
        if (address || phones.length || emails.length) {
          item.address = address;
          item._phones = phones;
          item._emails = emails;
          item.phone = phones[0] || null;
          item.email = emails[0] || null;
          item._source = url;
          item._error = null;
          break;
        } else {
          item._error = `parsed empty at ${url}`;
        }
      } catch (e) {
        item._error = `err at ${url}: ${e.message}`;
      }
    }
  } catch (e) {
    item._error = `outer err: ${e.message}`;
  }

  await ctx.close();
  return item;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const items = [];
  const CONCURRENCY = 3;
  let i = 0;
  async function worker() {
    while (i < ILLER.length) {
      const idx = i++;
      const il = ILLER[idx];
      const t0 = Date.now();
      try {
        const it = await scrapeOne(browser, il);
        items[idx] = it;
        console.log(`[${idx + 1}/${ILLER.length}] ${il.name}: ph=${it.phone || '-'} em=${it.email || '-'} ad=${it.address ? 'OK' : '-'} (${Date.now() - t0}ms) ${it._error || ''}`);
      } catch (e) {
        items[idx] = { name: `${il.name} Gençlik ve Spor İl Müdürlüğü`, city: il.name, website: `https://${il.subdomain}.gsb.gov.tr`, _error: e.message };
        console.log(`[${idx + 1}/${ILLER.length}] ${il.name}: FATAL ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  await browser.close();

  const out = {
    source: 'https://gsb.gov.tr/tr/sayfa/5037-tasra-teskilati',
    scrapedAt: new Date().toISOString(),
    items: items.map(it => {
      const o = {
        name: it.name,
        city: it.city,
        phone: it.phone || undefined,
        email: it.email || undefined,
        address: it.address || undefined,
        website: it.website,
      };
      for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
      return o;
    }),
  };

  fs.writeFileSync('/tmp/scrape-gsb-il-mudurlukleri.json', JSON.stringify(out, null, 2), 'utf8');

  const okCount = out.items.filter(x => x.phone || x.address).length;
  console.log(`\nWritten /tmp/scrape-gsb-il-mudurlukleri.json | ${out.items.length} items | ${okCount} with phone/address`);
}

main().catch(e => { console.error(e); process.exit(1); });
