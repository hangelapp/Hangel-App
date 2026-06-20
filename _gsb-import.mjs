// GSB il müdürlükleri taramasını (workflow çıktısı) outreachContacts'a yazar.
// Idempotent: doc id = gsb-il-{slug} → tekrar çalışınca dup olmaz (merge).
// Ayrıca gsb-mudurlukleri.csv üretir (manuel import için yedek).
import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = '/private/tmp/claude-501/-Users-apple/2efd56a0-447d-4e2b-9fc7-3e98f94d842a/tasks/who451wj4.output';
const parsed = JSON.parse(readFileSync(OUT, 'utf8'));
const data = parsed.result || parsed;
const rows = (data.rows || []).filter((r) => r && r.name);

function slug(s) {
  return (s || '')
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ş/g, 's').replace(/ş/g, 's').replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u').replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function csvCell(v) {
  const s = (v ?? '').toString().replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

// CSV
const header = ['name', 'type', 'city', 'district', 'phone', 'email', 'website', 'address'];
const csvLines = [header.join(',')];
for (const r of rows) {
  csvLines.push([r.name, 'GençlikSporMüdürlüğü', r.city, r.district || '', r.phone || '', r.email || '', r.website || '', r.address || ''].map(csvCell).join(','));
}
writeFileSync('/Users/apple/new-app/gsb-mudurlukleri.csv', csvLines.join('\n') + '\n');
console.log('CSV yazıldı: gsb-mudurlukleri.csv (' + rows.length + ' satır)');

// Firestore
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json', 'utf8'))) });
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();
let written = 0, low = 0;
const batch = db.batch();
for (const r of rows) {
  const id = r.level === 'ilce' ? `gsb-ilce-${slug(r.city)}-${slug(r.district)}` : `gsb-il-${slug(r.city)}`;
  if (r.confidence === 'low') low++;
  batch.set(db.collection('outreachContacts').doc(id), {
    name: r.name,
    type: 'GençlikSporMüdürlüğü',
    city: r.city || null,
    district: r.district || null,
    phone: r.phone || null,
    email: r.email || null,
    website: r.website || null,
    address: r.address || null,
    notes: `GSB ${r.level === 'ilce' ? 'ilçe' : 'il'} müdürlüğü — ${r.confidence || 'high'} güven (web taraması 2026-06-18)`,
    status: 'active',
    source: 'gsb-scrape',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  written++;
}
await batch.commit();
console.log(`✅ outreachContacts'a yazıldı: ${written} kayıt (${low} düşük güven). Notlar: ${(data.notes || []).join(' | ') || '-'}`);
process.exit(0);
