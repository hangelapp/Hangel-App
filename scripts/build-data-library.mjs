#!/usr/bin/env node
/**
 * Veri Kütüphanesi üretici.
 *
 * Girdi : /tmp/library-entries.json — workflow'un döndürdüğü ham entries dizisi:
 *   { title, stat, institution, year, topic, scope, sourceTitle, sourceUrl, citation }
 * Çıktı : src/lib/hangel-data-library.json — LibrarySection (slug=veri-kutuphanesi),
 *   her item künyeli content HTML + filtre alanları (source/scope/year/topic) taşır.
 *
 * Filtreler item.content metnine göre eşleştiği için kurum/kapsam/konu/yıl content'e
 * de yazılır; kurum adı filtre seçenekleriyle birebir eşleşsin diye normalize edilir.
 *
 * Kullanım: node scripts/build-data-library.mjs [girdi.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INPUT = process.argv[2] || '/tmp/library-entries.json';
const OUTPUT = join(ROOT, 'src/lib/hangel-data-library.json');

// Türkçe-güvenli ASCII katlama: İ/ı/ş/ğ/ü/ö/ç + combining dot (U+0307) sorunlarını
// giderir. "TİKA".toLowerCase()="ti̇ka" tuzağını ortadan kaldırır.
function fold(raw) {
  return (raw || '')
    .replace(/[İIı]/g, 'i')
    .replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// --- Kurum adı normalizasyonu (filtre seçenekleriyle birebir eşleşmeli) ---
// Anahtarlar fold edilmiş (ASCII, Türkçe karaktersiz) yazılır; dönüş değerleri
// filtre opsiyonlarıyla AYNI (gerçek Türkçe) olmalı.
function normInstitution(raw) {
  const s = fold(raw);
  const has = (...keys) => keys.some(k => s.includes(k));
  // Uluslararası
  if (has('oecd')) return 'OECD';
  if (has('world bank', 'dunya banka', 'worldbank')) return 'Dünya Bankası';
  if (has('eurostat')) return 'Eurostat';
  if (has('undp', 'kalkinma programi', 'development programme')) return 'UNDP';
  if (has('ab komisyon', 'european commission', 'avrupa komisyon', 'avrupa birligi', 'eurofound', 'european union') || s === 'ab') return 'Avrupa Komisyonu';
  if (has('oic', 'islam isbirligi', 'islam birligi', 'organisation of islamic', 'organization of islamic')) return 'İslam İşbirliği Teşkilatı (OIC)';
  if (has('sesric')) return 'SESRIC';
  if (has('b lab', 'b corp', 'bcorp', 'b-corp')) return 'B Lab (B Corp)';
  if (s === 'gem' || has('global entrepreneurship', '(gem')) return 'Global Entrepreneurship Monitor (GEM)';
  if (has('charities aid', 'world giving index', 'caf world')) return 'Charities Aid Foundation (CAF)';
  if (has('british council')) return 'British Council';
  if (has('dcms', 'digital, culture', 'community life', 'culture, media')) return 'Birleşik Krallık DCMS';
  if (has('goodera')) return 'Goodera';
  // Türkiye istatistik & akademi
  if (has('tuik', 'turkstat', 'turkiye istatistik')) return 'TÜİK';
  if (has('tusev')) return 'TÜSEV';
  if (has('tubitak')) return 'TÜBİTAK';
  // Bağlı kurum/ajanslar — ana bakanlıktan ÖNCE eşleşmeli
  if (has('afad', 'afet ve acil')) return 'AFAD';
  if (has('goc idaresi', 'migration management')) return 'Göç İdaresi Başkanlığı';
  if (has('vakiflar genel', 'vgm', 'vakiflar gm')) return 'Vakıflar Genel Müdürlüğü';
  if (has('tika', 'turk isbirligi')) return 'TİKA';
  if (has('diyanet')) return 'Diyanet İşleri Başkanlığı';
  if (has('kizilay', 'red crescent')) return 'Türk Kızılay';
  // Ana bakanlıklar
  if (has('aile ve sosyal', 'sosyal yardimlar', 'sydv', 'butunlesik sosyal yardim', 'engelli ve yasli', 'cocuk hizmetleri', 'kadinin statusu')) return 'T.C. Aile ve Sosyal Hizmetler';
  if (has('calisma ve sosyal', 'calisma bakan', 'sosyal guvenlik kurumu', 'sgk', 'iskur')) return 'T.C. Çalışma ve Sosyal Güvenlik Bakanlığı';
  if (has('genclik ve spor', 'gsb', 'genc gonullu')) return 'T.C. Gençlik ve Spor Bakanlığı';
  if (has('kultur ve turizm')) return 'T.C. Kültür ve Turizm Bakanlığı';
  if (has('sanayi ve teknoloji', 'sanayi bakan')) return 'T.C. Sanayi ve Teknoloji Bakanlığı';
  if (has('tarim ve orman')) return 'T.C. Tarım ve Orman Bakanlığı';
  if (has('ticaret bakan')) return 'T.C. Ticaret Bakanlığı';
  if (has('disisleri')) return 'T.C. Dışişleri Bakanlığı';
  if (has('adalet bakan')) return 'T.C. Adalet Bakanlığı';
  if (has('icisleri', 'sivil toplum', 'dernekler dairesi', 'dernek istatist', 'siviltoplum.gov')) return 'T.C. İçişleri Bakanlığı';
  if (has('saglik bakan')) return 'T.C. Sağlık Bakanlığı';
  if (has('milli egitim', 'meb')) return 'T.C. Milli Eğitim Bakanlığı';
  if (has('cevre', 'sehircilik')) return 'T.C. Çevre, Şehircilik ve İklim Değişikliği';
  if (has('hazine', 'maliye')) return 'T.C. Hazine ve Maliye';
  if (has('cumhurbaskanligi', 'strateji ve butce', 'sbb')) return 'Cumhurbaşkanlığı SBB';
  // Büyükşehir belediyeleri
  if (has('istanbul buyuksehir', 'ibb')) return 'İstanbul Büyükşehir Belediyesi';
  if (has('ankara buyuksehir')) return 'Ankara Büyükşehir Belediyesi';
  if (has('izmir buyuksehir')) return 'İzmir Büyükşehir Belediyesi';
  if (has('bursa buyuksehir')) return 'Bursa Büyükşehir Belediyesi';
  if (has('antalya buyuksehir')) return 'Antalya Büyükşehir Belediyesi';
  if (has('konya buyuksehir')) return 'Konya Büyükşehir Belediyesi';
  if (has('gaziantep buyuksehir')) return 'Gaziantep Büyükşehir Belediyesi';
  if (has('kocaeli buyuksehir')) return 'Kocaeli Büyükşehir Belediyesi';
  if (has('belediye')) return (raw || '').trim();
  // Üniversite araştırmaları (spesifik üniversite/merkez adı künyede kalır)
  if (has('universite', 'university', 'arastirma merkezi', 'kusif', 'edu.tr')) return 'Üniversite Araştırması';
  return (raw || '').trim() || 'Diğer';
}

function normScope(raw, source) {
  const s = fold(raw);
  if (s.includes('turkiye') || s.includes('turkey')) return 'Türkiye geneli';
  if (s.includes('istanbul')) return 'İstanbul';
  if (s.includes('ankara')) return 'Ankara';
  if (s.includes('izmir')) return 'İzmir';
  if (s === 'ab' || s.includes('avrupa birligi') || s.includes('european union')) return 'AB';
  if (s.includes('uluslararasi') || s.includes('global') || s.includes('international') || s.includes('dunya')) return 'Uluslararası';
  if (s.includes('bolge') || s.includes('regional')) return 'Bölgesel';
  // Kurumdan çıkar: belediye → Bölgesel; TR kamu → Türkiye geneli; aksi → Uluslararası
  if (source && source.includes('Belediyesi')) return 'Bölgesel';
  if ((source && (source.startsWith('T.C.') || source.includes('Başkanlığı') || source.includes('Müdürlüğü')))
      || ['TÜİK', 'TÜSEV', 'TÜBİTAK', 'Cumhurbaşkanlığı SBB', 'AFAD', 'TİKA', 'Türk Kızılay', 'Üniversite Araştırması'].includes(source)) return 'Türkiye geneli';
  return 'Uluslararası';
}

const TOPICS = ['Sosyal Fayda', 'Sosyal Etki', 'Sosyal Girişimcilik', 'Sosyal Yardım', 'Gönüllülük', 'Bağışçılık', 'Sosyal Sorunlar', 'Sivil Toplum', 'Eğitim', 'Sağlık', 'Çevre', 'Afet', 'Göç', 'Yoksulluk', 'Cinsiyet Eşitliği', 'Engellilik', 'Yaşlılık', 'Çocuk Hakları', 'STK Yönetimi'];
function normTopic(raw) {
  const s = fold(raw);
  if (s.includes('girisim') || s.includes('entrepreneur') || s.includes('social enterprise')) return 'Sosyal Girişimcilik';
  if (s.includes('gonul') || s.includes('volunt')) return 'Gönüllülük';
  if (s.includes('bagis') || s.includes('donat') || s.includes('giving') || s.includes('philanthro') || s.includes('hayirsever')) return 'Bağışçılık';
  if (s.includes('sivil toplum') || s.includes('civil society') || s === 'stk' || (s.includes('dernek') && !s.includes('yonet')) || s.includes('vakif')) return 'Sivil Toplum';
  if (s.includes('sorun') || s.includes('problem') || s.includes('yoksul') || s.includes('poverty') || s.includes('inequal') || s.includes('esitsiz')) return 'Sosyal Sorunlar';
  if (s.includes('fayda')) return 'Sosyal Fayda';
  if (s.includes('etki') || s.includes('impact')) return 'Sosyal Etki';
  const exact = TOPICS.find(t => fold(t) === s);
  return exact || 'Sosyal Etki';
}

// --- HTML escape ---
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- slug (Türkçe transliterasyon + kebab) ---
function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };
  return (s || '')
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => map[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

// --- içerik HTML (istatistik + metadata; künye detay sayfasında başlık altında render edilir) ---
function buildContent(e, source, scope, topic) {
  return [
    `<p>${esc(e.stat)}</p>`,
    `<ul>`,
    `<li><strong>Kaynak:</strong> ${esc(source)}</li>`,
    `<li><strong>Yıl:</strong> ${esc(e.year)}</li>`,
    `<li><strong>Kapsam:</strong> ${esc(scope)}</li>`,
    `<li><strong>Konu:</strong> ${esc(topic)}</li>`,
    e.sourceTitle ? `<li><strong>Yayın:</strong> ${esc(e.sourceTitle)}</li>` : '',
    `</ul>`,
  ].filter(Boolean).join('');
}

// --- ana akış ---
const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const entries = Array.isArray(raw) ? raw : (raw.entries || []);
console.log(`Girdi: ${entries.length} ham veri`);

const seenSlugs = new Set();
const seenKey = new Set();
const items = [];

for (const e of entries) {
  if (!e || !e.title || !e.stat || !e.sourceUrl) continue;
  const source = normInstitution(e.institution);
  const scope = normScope(e.scope, source);
  const topic = normTopic(e.topic);
  const year = Number(e.year) || null;

  // dedupe: aynı url + başlık
  const k = `${e.sourceUrl}|${(e.title || '').toLowerCase()}`;
  if (seenKey.has(k)) continue;
  seenKey.add(k);

  let base = slugify(`veri-${source}-${e.title}`) || `veri-${items.length}`;
  let slug = base;
  let n = 2;
  while (seenSlugs.has(slug)) { slug = `${base}-${n++}`; }
  seenSlugs.add(slug);

  items.push({
    slug,
    title: e.title.trim(),
    content: buildContent(e, source, scope, topic),
    source,
    scope,
    topic,
    year: year || undefined,
    sourceUrl: e.sourceUrl,
    citation: (e.citation || `${source} (${year || ''}). ${e.sourceTitle || ''}`).trim(),
  });
}

// kurum & konuya göre sırala (gruplar bir arada görünsün)
items.sort((a, b) => (a.source.localeCompare(b.source, 'tr') || (a.topic || '').localeCompare(b.topic || '', 'tr') || (b.year || 0) - (a.year || 0)));

const section = {
  slug: 'veri-kutuphanesi',
  title: 'Veri Kütüphanesi',
  description: 'Resmi kurum ve araştırma merkezlerinden verileri',
  icon: 'Database',
  items,
};

writeFileSync(OUTPUT, JSON.stringify(section, null, 2) + '\n', 'utf8');
const bySource = {};
for (const it of items) bySource[it.source] = (bySource[it.source] || 0) + 1;
console.log(`Yazıldı: ${items.length} veri → ${OUTPUT}`);
console.log('Kaynağa göre:', JSON.stringify(bySource, null, 2));
