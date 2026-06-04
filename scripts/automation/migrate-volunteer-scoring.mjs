/**
 * Migrate 95+ ISCO meslek catalog from src/lib/volunteer/professions.ts → Firestore.
 *
 * Schema: doc id = profession.id (kebab-case)
 *   { taskType, pointsPerHour, manHourCost, description, isActive, order,
 *     iscoCode, category, createdAt, updatedAt }
 *
 * Idempotent: existing docs (matching id) get MERGE-updated; never deletes.
 * Existing manually-created docs (e.g. "bahçıvanlık") are preserved.
 */
import { readFileSync, writeFileSync } from 'fs';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'hangel-new-v18-87297865-9bcc3',
  });
}
const db = admin.firestore();

// Parse PROFESSIONS literally — eval-style extraction via regex is fragile;
// safer: import via tsx if needed, but ESM dynamic import of .ts won't work
// without loader. So parse with regex over the source.
const src = readFileSync(new URL('../../src/lib/volunteer/professions.ts', import.meta.url), 'utf8');
const startIdx = src.indexOf('export const PROFESSIONS');
const endIdx = src.indexOf('] as const', startIdx);
const body = src.slice(startIdx, endIdx + 12);

// Extract each { id: '...', isco: '...', name: '...', ..., hourlyRateTRY: N }
const re = /\{\s*id:\s*'([^']+)'\s*,\s*isco:\s*'([^']*)'\s*,\s*name:\s*'([^']+)'(?:[^}]*?nameEn:\s*'([^']*)')?[^}]*?category:\s*'([^']+)'\s*,\s*hourlyRateTRY:\s*(\d+)(?:[^}]*?sourceNote:\s*'([^']*)')?[^}]*?\}/gs;
const professions = [];
let m;
while ((m = re.exec(body)) !== null) {
  professions.push({
    id: m[1],
    isco: m[2],
    name: m[3],
    nameEn: m[4] || '',
    category: m[5],
    hourlyRateTRY: parseInt(m[6], 10),
    sourceNote: m[7] || '',
  });
}
console.log(`Parsed ${professions.length} professions from catalog`);

if (professions.length < 50) {
  console.error('ABORT: parsed fewer than expected — regex may be broken');
  process.exit(1);
}

// Map → Firestore schema. pointsPerHour heuristic: max(10, round(hourlyRateTRY / 3))
const docs = professions.map((p, idx) => ({
  id: p.id,
  data: {
    taskType: p.name,
    pointsPerHour: Math.max(10, Math.round(p.hourlyRateTRY / 3)),
    manHourCost: p.hourlyRateTRY,
    description: `ISCO-08 ${p.isco} • ${p.category}${p.sourceNote ? ' • ' + p.sourceNote : ''}`,
    isActive: true,
    order: idx + 1,
    iscoCode: p.isco,
    category: p.category,
    nameEn: p.nameEn,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
}));

// Existing docs for safety check
const existing = await db.collection('volunteerScoring').get();
const existingIds = new Set();
existing.forEach(d => existingIds.add(d.id));
console.log(`Existing docs in Firestore: ${existing.size}`);

// Batch write — 500 docs/batch limit (we have ~95)
const batch = db.batch();
let created = 0, updated = 0;
for (const { id, data } of docs) {
  const ref = db.collection('volunteerScoring').doc(id);
  if (existingIds.has(id)) {
    // Merge but don't overwrite createdAt
    const { createdAt: _omit, ...rest } = data;
    batch.set(ref, rest, { merge: true });
    updated++;
  } else {
    batch.set(ref, data);
    created++;
  }
}
await batch.commit();
console.log(`Migration complete: created=${created} updated=${updated}`);

// Final count
const final = await db.collection('volunteerScoring').get();
console.log(`Final volunteerScoring doc count: ${final.size}`);
process.exit(0);
