#!/usr/bin/env node
/**
 * Akademik Makaleler üretici.
 *
 * Girdi : /tmp/academic-articles.json — workflow'un döndürdüğü ham makale dizisi:
 *   { title, authors, year, journal, origin, topic, summary, sourceUrl, citation }
 * Çıktı : src/lib/hangel-academic-articles.json — LibraryItem[] dizisi (akademik-makaleler
 *   bölümüne library.ts içinde spread edilir). Künye detay sayfasında başlık altında
 *   item.citation/sourceUrl alanından render edilir; content özet + metadata taşır.
 *
 * Kullanım: node scripts/build-academic-articles.mjs [girdi.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INPUT = process.argv[2] || '/tmp/academic-articles.json';
const OUTPUT = join(ROOT, 'src/lib/hangel-academic-articles.json');

function fold(raw) {
  return (raw || '')
    .replace(/[İIı]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const TOPICS = ['Sosyal Girişimcilik', 'Gönüllülük', 'Hayırseverlik ve Bağış', 'Sosyal Etki', 'Etki Ölçümü', 'Sivil Toplum Araştırmaları', 'Sosyal Sorunlar', 'Sosyal İnovasyon', 'Kalkınma ve Sosyal Politika'];
function normTopic(raw) {
  const s = fold(raw);
  if (s.includes('girisim') || s.includes('entrepreneur')) return 'Sosyal Girişimcilik';
  if (s.includes('gonul') || s.includes('volunt')) return 'Gönüllülük';
  if (s.includes('bagis') || s.includes('hayirsever') || s.includes('philanthro') || s.includes('giving') || s.includes('donat')) return 'Hayırseverlik ve Bağış';
  if (s.includes('etki olcum') || s.includes('impact meas') || s.includes('sroi') || s.includes('degerlend')) return 'Etki Ölçümü';
  if (s.includes('sivil toplum') || s.includes('civil society') || s.includes('ngo') || s.includes('nonprofit') || s.includes('ucuncu sektor') || s.includes('stk')) return 'Sivil Toplum Araştırmaları';
  if (s.includes('inovasyon') || s.includes('innovation')) return 'Sosyal İnovasyon';
  if (s.includes('sorun') || s.includes('yoksul') || s.includes('poverty') || s.includes('esitsiz') || s.includes('inequal') || s.includes('dislan')) return 'Sosyal Sorunlar';
  if (s.includes('politika') || s.includes('kalkinma') || s.includes('policy') || s.includes('development')) return 'Kalkınma ve Sosyal Politika';
  if (s.includes('etki') || s.includes('impact') || s.includes('fayda')) return 'Sosyal Etki';
  const exact = TOPICS.find(t => fold(t) === s);
  return exact || 'Sosyal Etki';
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slugify(s) {
  return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72);
}

function buildContent(a, topic) {
  return [
    `<p>${esc(a.summary)}</p>`,
    `<ul>`,
    `<li><strong>Yazar:</strong> ${esc(a.authors)}</li>`,
    a.journal ? `<li><strong>Yayın:</strong> ${esc(a.journal)}</li>` : '',
    `<li><strong>Yıl:</strong> ${esc(a.year)}</li>`,
    `<li><strong>Konu:</strong> ${esc(topic)}</li>`,
    a.origin ? `<li><strong>Köken:</strong> ${esc(a.origin)}</li>` : '',
    `</ul>`,
  ].filter(Boolean).join('');
}

const raw = JSON.parse(readFileSync(INPUT, 'utf8'));
const articles = Array.isArray(raw) ? raw : (raw.articles || []);
console.log(`Girdi: ${articles.length} ham makale`);

const seenSlugs = new Set();
const seenKey = new Set();
const items = [];

for (const a of articles) {
  if (!a || !a.title || !a.sourceUrl) continue;
  const topic = normTopic(a.topic);
  const year = Number(a.year) || null;
  const k = `${a.sourceUrl}|${(a.title || '').toLowerCase()}`;
  if (seenKey.has(k)) continue;
  seenKey.add(k);

  let base = 'makale-' + (slugify(`${a.authors || ''}-${a.title}`) || `${items.length}`);
  let slug = base, n = 2;
  while (seenSlugs.has(slug)) { slug = `${base}-${n++}`; }
  seenSlugs.add(slug);

  items.push({
    slug,
    title: a.title.trim(),
    content: buildContent(a, topic),
    author: a.authors || undefined,
    source: a.journal || undefined,
    topic,
    year: year || undefined,
    origin: a.origin || undefined,
    sourceUrl: a.sourceUrl,
    citation: (a.citation || `${a.authors || ''} (${year || ''}). ${a.title}. ${a.journal || ''}`).trim(),
  });
}

// Konu + köken + yıla göre sırala
items.sort((x, y) => (x.topic.localeCompare(y.topic, 'tr') || (x.origin || '').localeCompare(y.origin || '', 'tr') || (y.year || 0) - (x.year || 0)));

writeFileSync(OUTPUT, JSON.stringify(items, null, 2) + '\n', 'utf8');
const byTopic = {}, byOrigin = {};
for (const it of items) { byTopic[it.topic] = (byTopic[it.topic] || 0) + 1; byOrigin[it.origin || '?'] = (byOrigin[it.origin || '?'] || 0) + 1; }
console.log(`Yazıldı: ${items.length} makale → ${OUTPUT}`);
console.log('Konuya göre:', JSON.stringify(byTopic));
console.log('Kökene göre:', JSON.stringify(byOrigin));
