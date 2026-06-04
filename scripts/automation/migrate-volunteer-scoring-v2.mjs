import { readFileSync } from 'fs';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'hangel-new-v18-87297865-9bcc3',
  });
}
const db = admin.firestore();

const professions = JSON.parse(readFileSync('/tmp/professions.json', 'utf8'));
console.log(`Loaded ${professions.length} professions`);

const existing = await db.collection('volunteerScoring').get();
const existingIds = new Set();
existing.forEach(d => existingIds.add(d.id));
console.log(`Existing docs in Firestore: ${existing.size}`);

let created = 0, updated = 0;
// Chunk to 400 per batch to be safe
for (let i = 0; i < professions.length; i += 400) {
  const chunk = professions.slice(i, i + 400);
  const batch = db.batch();
  for (let k = 0; k < chunk.length; k++) {
    const p = chunk[k];
    const idx = i + k;
    const ref = db.collection('volunteerScoring').doc(p.id);
    const data = {
      taskType: p.name,
      pointsPerHour: Math.max(10, Math.round((p.hourlyRateTRY || 150) / 3)),
      manHourCost: p.hourlyRateTRY || 150,
      description: `ISCO-08 ${p.isco} • ${p.category}${p.sourceNote ? ' • ' + p.sourceNote : ''}`,
      isActive: true,
      order: idx + 1,
      iscoCode: p.isco || '',
      category: p.category,
      nameEn: p.nameEn || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (existingIds.has(p.id)) {
      batch.set(ref, data, { merge: true });
      updated++;
    } else {
      batch.set(ref, { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      created++;
    }
  }
  await batch.commit();
}
console.log(`Migration complete: created=${created} updated=${updated}`);

const final = await db.collection('volunteerScoring').get();
console.log(`Final count: ${final.size}`);
process.exit(0);
