/**
 * FAZ 4: nufusu.com'dan 44 boş ilin ilçe listesini al, Firestore'a yaz.
 *
 * nufusu.com authoritative public Türkiye nüfus + idari birim kaynağı.
 * URL pattern: https://www.nufusu.com/ilceleri/{il-slug}-ilceleri-nufusu
 *
 * Çıktı: outreachContacts/genc-spor-ilce-{il}-{ilce} doc'larına yaz.
 * GSB iletişim bilgisi yok (sadece ilçe adı + il bağlantısı). Faz 1+2'de
 * tel/email bulunmuşsa onlar zaten orada.
 */
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 44 boş il — Faz 1+2+3'te ilçe verisi çıkmayanlar
const EMPTY_ILLER = [
  ['adana','Adana'],['adiyaman','Adıyaman'],['afyon','Afyonkarahisar','afyonkarahisar'],
  ['agri','Ağrı'],['antalya','Antalya'],['ardahan','Ardahan'],
  ['aydin','Aydın'],['balikesir','Balıkesir'],['bayburt','Bayburt'],
  ['bitlis','Bitlis'],['bursa','Bursa'],['cankiri','Çankırı'],
  ['corum','Çorum'],['denizli','Denizli'],['diyarbakir','Diyarbakır'],
  ['edirne','Edirne'],['erzincan','Erzincan'],['gaziantep','Gaziantep'],
  ['hakkari','Hakkari'],['hatay','Hatay'],['igdir','Iğdır'],
  ['isparta','Isparta'],['kahramanmaras','Kahramanmaraş'],['karabuk','Karabük'],
  ['kars','Kars'],['kayseri','Kayseri'],['kilis','Kilis'],
  ['kirikkale','Kırıkkale'],['konya','Konya'],['kutahya','Kütahya'],
  ['malatya','Malatya'],['mardin','Mardin'],['mersin','Mersin'],
  ['mus','Muş'],['nevsehir','Nevşehir'],['nigde','Niğde'],
  ['ordu','Ordu'],['sakarya','Sakarya'],['samsun','Samsun'],
  ['sanliurfa','Şanlıurfa'],['sivas','Sivas'],['tunceli','Tunceli'],
  ['van','Van'],['zonguldak','Zonguldak'],
];

// nufusu.com slug overrides (gsb-slug ≠ nufusu-slug olan iller)
const NUFUSU_SLUG = {
  afyon: 'afyonkarahisar',
};

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&([a-z]+);/gi, ' ').trim();
}

async function fetchIlceler(slug, name) {
  const nufusuSlug = NUFUSU_SLUG[slug] || slug;
  const url = `https://www.nufusu.com/ilceleri/${nufusuSlug}-ilceleri-nufusu`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' },
    });
    if (!res.ok) return { il: name, slug, url, error: `HTTP ${res.status}`, ilceler: [] };
    const html = await res.text();
    // Anchor pattern: <a href="/ilce/{slug}_{il}-nufusu" title="X Nüfusu">X</a>
    const re = /<a\s+href="\/ilce\/([^"]+)"\s+title="([^"]+)\s+Nüfusu">([^<]+)<\/a>/g;
    const ilceler = [];
    const seen = new Set();
    let m;
    while ((m = re.exec(html))) {
      const ilceName = decodeHtml(m[3]).trim();
      const key = ilceName.toLocaleLowerCase('tr');
      if (!seen.has(key)) {
        seen.add(key);
        ilceler.push({ name: ilceName, slug: m[1] });
      }
    }
    return { il: name, slug, url, ilceler };
  } catch (e) {
    return { il: name, slug, url, error: e.message, ilceler: [] };
  }
}

async function main() {
  console.log(`Faz 4: ${EMPTY_ILLER.length} boş il için nufusu.com'dan ilçe listesi\n`);
  const results = [];
  for (const [slug, name] of EMPTY_ILLER) {
    const r = await fetchIlceler(slug, name);
    results.push(r);
    const n = r.ilceler.length;
    console.log(`  ${name.padEnd(20)} ${n > 0 ? `${n} ilçe` : `ERR ${r.error || 'no-match'}`}`);
    await new Promise((res) => setTimeout(res, 300)); // rate limit
  }

  const out = {
    source: 'https://www.nufusu.com/ilceleri/*',
    scrapedAt: new Date().toISOString(),
    total: results.reduce((a, r) => a + r.ilceler.length, 0),
    provinces: results,
  };
  writeFileSync('/tmp/scrape-nufusu-ilceler.json', JSON.stringify(out, null, 2));
  console.log(`\n✓ Toplam ${out.total} ilçe — /tmp/scrape-nufusu-ilceler.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
