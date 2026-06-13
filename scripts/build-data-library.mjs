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

// --- Kurum adı normalizasyonu (filtre seçenekleriyle birebir eşleşmeli) ---
function normInstitution(raw) {
  const s = (raw || '').toLowerCase();
  const has = (...keys) => keys.some(k => s.includes(k));
  if (has('oecd')) return 'OECD';
  if (has('world bank', 'dünya banka', 'dunya banka', 'worldbank')) return 'Dünya Bankası';
  if (has('eurostat')) return 'Eurostat';
  if (has('undp', 'kalkınma programı', 'kalkinma programi', 'development programme')) return 'UNDP';
  if (has('ab komisyon', 'european commission', 'avrupa komisyon', 'avrupa birliği', 'avrupa birligi', 'eurofound', 'european union') || s === 'ab') return 'Avrupa Komisyonu';
  if (has('oic', 'islam işbirliği', 'islam isbirligi', 'islam birliği', 'islam birligi', 'organisation of islamic', 'organization of islamic')) return 'İslam İşbirliği Teşkilatı (OIC)';
  if (has('sesric')) return 'SESRIC';
  if (has('b lab', 'b corp', 'bcorp', 'b-corp')) return 'B Lab (B Corp)';
  if (s === 'gem' || has('global entrepreneurship', 'gem ', 'gem,', 'gem)', '(gem')) return 'Global Entrepreneurship Monitor (GEM)';
  if (has('charities aid', 'world giving index', 'caf world')) return 'Charities Aid Foundation (CAF)';
  if (has('british council')) return 'British Council';
  if (has('dcms', 'digital, culture', 'community life', 'culture, media')) return 'Birleşik Krallık DCMS';
  if (has('goodera')) return 'Goodera';
  if (has('tüik', 'tuik', 'turkstat', 'türkiye istatistik')) return 'TÜİK';
  if (has('tüsev', 'tusev')) return 'TÜSEV';
  if (has('tübitak', 'tubitak')) return 'TÜBİTAK';
  if (has('aile ve sosyal')) return 'T.C. Aile ve Sosyal Hizmetler';
  if (has('içişleri', 'icisleri', 'sivil toplum', 'dernekler dairesi', 'dernek istatist')) return 'T.C. İçişleri Bakanlığı';
  if (has('sağlık bakan', 'saglik bakan')) return 'T.C. Sağlık Bakanlığı';
  if (has('milli eğitim', 'milli egitim')) return 'T.C. Milli Eğitim Bakanlığı';
  if (has('çevre', 'cevre', 'şehircilik')) return 'T.C. Çevre, Şehircilik ve İklim Değişikliği';
  if (has('hazine', 'maliye')) return 'T.C. Hazine ve Maliye';
  if (has('cumhurbaşkanlığı', 'strateji ve bütçe', 'strateji ve butce', ' sbb')) return 'Cumhurbaşkanlığı SBB';
  if (has('istanbul büyükşehir', 'istanbul buyuksehir', 'ibb')) return 'İstanbul Büyükşehir Belediyesi';
  if (has('ankara büyükşehir', 'ankara buyuksehir')) return 'Ankara Büyükşehir Belediyesi';
  if (has('izmir büyükşehir', 'izmir buyuksehir', 'i̇zmir büyükşehir')) return 'İzmir Büyükşehir Belediyesi';
  if (has('üniversite', 'universite', 'university', 'araştırma merkezi')) return 'Üniversite Araştırması';
  return (raw || '').trim() || 'Diğer';
}

const SCOPES = ['Türkiye geneli', 'İstanbul', 'Ankara', 'İzmir', 'Bölgesel', 'AB', 'Uluslararası'];
function normScope(raw, source) {
  const s = (raw || '').toLowerCase();
  if (s.includes('türkiye') || s.includes('turkiye') || s.includes('turkey')) return 'Türkiye geneli';
  if (s.includes('istanbul') || s.includes('i̇stanbul')) return 'İstanbul';
  if (s.includes('ankara')) return 'Ankara';
  if (s.includes('izmir') || s.includes('i̇zmir')) return 'İzmir';
  if (s === 'ab' || s.includes('avrupa birliği') || s.includes('european union') || s.includes(' eu')) return 'AB';
  if (s.includes('bölge') || s.includes('regional')) return 'Bölgesel';
  if (SCOPES.map(x => x.toLowerCase()).includes(s)) return raw;
  // Kurumdan çıkar: TR kurumları → Türkiye geneli; aksi → Uluslararası
  return source && source.startsWith('T.C.') || ['TÜİK', 'TÜSEV', 'TÜBİTAK', 'Cumhurbaşkanlığı SBB'].includes(source)
    ? 'Türkiye geneli' : 'Uluslararası';
}

const TOPICS = ['Sosyal Fayda', 'Sosyal Etki', 'Sosyal Girişimcilik', 'Sosyal Yardım', 'Gönüllülük', 'Bağışçılık', 'Sosyal Sorunlar', 'Eğitim', 'Sağlık', 'Çevre', 'Afet', 'Göç', 'Yoksulluk', 'Cinsiyet Eşitliği', 'Engellilik', 'Yaşlılık', 'Çocuk Hakları', 'STK Yönetimi'];
function normTopic(raw) {
  const s = (raw || '').toLowerCase();
  if (s.includes('girişim') || s.includes('girisim') || s.includes('entrepreneur') || s.includes('social enterprise')) return 'Sosyal Girişimcilik';
  if (s.includes('gönül') || s.includes('gonul') || s.includes('volunt')) return 'Gönüllülük';
  if (s.includes('bağış') || s.includes('bagis') || s.includes('donat') || s.includes('giving') || s.includes('philanthro')) return 'Bağışçılık';
  if (s.includes('sorun') || s.includes('problem') || s.includes('yoksul') || s.includes('poverty') || s.includes('inequal') || s.includes('eşitsiz')) return 'Sosyal Sorunlar';
  if (s.includes('fayda')) return 'Sosyal Fayda';
  if (s.includes('etki') || s.includes('impact')) return 'Sosyal Etki';
  const exact = TOPICS.find(t => t.toLowerCase() === s);
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

// --- içerik HTML (künye üstte + istatistik + filtre metni) ---
function buildContent(e, source, scope, topic) {
  const cite = e.citation && e.citation.trim()
    ? e.citation.trim()
    : `${source} (${e.year}). ${e.sourceTitle || ''}`.trim();
  const linkUrl = e.sourceUrl || '';
  return [
    `<div class="not-prose mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">`,
    `<p class="font-semibold text-foreground" style="margin:0 0 2px">📌 Künye</p>`,
    `<p class="text-muted-foreground" style="margin:0">${esc(cite)}</p>`,
    linkUrl ? `<p style="margin:6px 0 0"><a href="${esc(linkUrl)}" target="_blank" rel="noopener noreferrer">Kaynağa git ↗</a></p>` : '',
    `</div>`,
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
  description: 'Resmi kurumlar ve uluslararası araştırma merkezlerinden (OECD, Dünya Bankası, UNDP, Eurostat, AB, B Lab, GEM, SESRIC, British Council, DCMS, TÜİK...) son yılların sosyal fayda, sosyal girişimcilik, gönüllülük, bağış ve sosyal sorunlar verileri — her veri kaynak-linkli künyeyle.',
  icon: 'Database',
  items,
};

writeFileSync(OUTPUT, JSON.stringify(section, null, 2) + '\n', 'utf8');
const bySource = {};
for (const it of items) bySource[it.source] = (bySource[it.source] || 0) + 1;
console.log(`Yazıldı: ${items.length} veri → ${OUTPUT}`);
console.log('Kaynağa göre:', JSON.stringify(bySource, null, 2));
