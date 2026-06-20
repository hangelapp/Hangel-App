/**
 * Backfill: TÜM gönüllülük ilanlarına iş kalemine göre estimatedPoints +
 * estimatedValueTRY + workItem yazar. Eşleşmeyene "Genel Gönüllülük" (40p/150₺).
 * src/lib/volunteer/listing-impact.ts (computeListingImpact) ile BİREBİR. Idempotent.
 *
 *   node scripts/backfill-volunteer-impact.mjs --dry   (yazmadan, aday + örnek)
 *   node scripts/backfill-volunteer-impact.mjs         (uygular)
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const DRY = process.argv.includes('--dry');
const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const sa = JSON.parse(readFileSync(new URL('../.firebase-service-account.json', import.meta.url), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
const db = admin.firestore();

const GENERAL_WORK_ITEM = 'Genel Gönüllülük';
const GENERAL_POINTS_PER_HOUR = 40;
const GENERAL_MAN_HOUR_COST = 150;
const DEFAULT_HOURS = 4;

function firstNonEmpty(...vals) {
  for (const v of vals) { if (typeof v === 'string') { const t = v.trim(); if (t) return t; } }
  return null;
}
function firstFromArray(arr) {
  if (!Array.isArray(arr)) return null;
  for (const v of arr) { if (typeof v === 'string') { const t = v.trim(); if (t) return t; } }
  return null;
}
function extractNeedle(l) {
  return firstNonEmpty(l.taskTypeId, l.taskTypeName, l.profession, firstFromArray(l.professions), firstFromArray(l.skills), l.socialArea);
}
function extractHours(l) {
  const est = Number(l.estimatedHours);
  if (Number.isFinite(est) && est > 0) return est;
  const total = Number(l.hours && l.hours.total);
  if (Number.isFinite(total) && total > 0) return total;
  return DEFAULT_HOURS;
}
function findProfession(catalog, needle) {
  if (!needle) return null;
  const trimmed = String(needle).trim();
  if (!trimmed) return null;
  const lower = trimmed.toLocaleLowerCase('tr');
  for (const row of catalog) {
    if (row.id === trimmed) return row;
    if (row.taskType && row.taskType.toLocaleLowerCase('tr') === lower) return row;
  }
  return null;
}
function computeImpact(l, catalog) {
  const hours = extractHours(l);
  const matched = findProfession(catalog, extractNeedle(l));
  const pph = matched && Number.isFinite(matched.pointsPerHour) && matched.pointsPerHour > 0 ? Number(matched.pointsPerHour) : GENERAL_POINTS_PER_HOUR;
  const mhc = matched && Number.isFinite(matched.manHourCost) && matched.manHourCost > 0 ? matched.manHourCost : GENERAL_MAN_HOUR_COST;
  const workItem = (matched && matched.taskType ? matched.taskType : '').trim() || GENERAL_WORK_ITEM;
  return { workItem, estimatedPoints: Math.round(pph * hours), estimatedValueTRY: Math.round(mhc * hours) };
}

async function main() {
  const catSnap = await db.collection('volunteerScoring').get();
  const catalog = catSnap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, taskType: String(x.taskType ?? ''), manHourCost: Number(x.manHourCost) || 0, pointsPerHour: Number(x.pointsPerHour) || 0 };
  });
  console.log(`Katalog: ${catalog.length} iş kalemi yüklendi`);

  const snap = await db.collection('volunteering').get();
  let scanned = 0, updated = 0, skipped = 0, general = 0;
  let batch = db.batch(); let pending = 0;
  const samples = [];

  for (const doc of snap.docs) {
    scanned++;
    const data = doc.data();
    const has = typeof data.estimatedPoints === 'number'
      && typeof data.estimatedValueTRY === 'number'
      && typeof data.workItem === 'string' && data.workItem.trim().length > 0;
    if (has) { skipped++; continue; }

    const r = computeImpact(data, catalog);
    if (r.workItem === GENERAL_WORK_ITEM) general++;
    if (samples.length < 10) samples.push(`  • ${String(data.title || '?').slice(0, 34).padEnd(34)} → ${r.workItem.slice(0, 26).padEnd(26)} ${String(r.estimatedPoints).padStart(5)}p  ${String(r.estimatedValueTRY).padStart(6)}₺`);

    if (!DRY) {
      batch.set(doc.ref, { ...r, impactBackfilledAt: new Date().toISOString() }, { merge: true });
      pending++;
      if (pending >= 400) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
    updated++;
  }
  if (!DRY && pending > 0) await batch.commit();

  console.log('--- örnekler ---');
  samples.forEach((s) => console.log(s));
  console.log(`\n${DRY ? '[DRY-RUN] ' : '✅ '}Taranan: ${scanned} | ${DRY ? 'yazılacak' : 'YAZILDI'}: ${updated} | atlanan(zaten dolu): ${skipped} | "Genel Gönüllülük" varsayılan: ${general}`);
  process.exit(0);
}
main().catch((e) => { console.error('HATA:', e); process.exit(1); });
