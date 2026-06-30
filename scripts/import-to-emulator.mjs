#!/usr/bin/env node
/**
 * scripts/import-to-emulator.mjs — yedek NDJSON'ları Firestore EMULATOR'a yükler.
 * ---------------------------------------------------------------------------
 * GÜVENLİK: FIRESTORE_EMULATOR_HOST set DEĞİLSE çalışmaz (canlıya yazma kazasını önler).
 * Her kayıttaki tam `path` kullanılır → alt-koleksiyonlar da doğru yere yazılır.
 *
 * KULLANIM:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 \
 *     node scripts/import-to-emulator.mjs backups/2026-06-30T10-08-09-491Z
 */
import admin from 'firebase-admin';
import { readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import process from 'node:process';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('❌ FIRESTORE_EMULATOR_HOST yok! Canlıya yazmamak için ZORUNLU. İptal.');
  process.exit(1);
}
const DIR = process.argv[2];
if (!DIR) {
  console.error('Kullanım: node scripts/import-to-emulator.mjs <backup-dir>');
  process.exit(1);
}

admin.initializeApp({ projectId: 'hangel-new-v18-87297865-9bcc3' });
const db = admin.firestore();

async function importFile(file) {
  let n = 0;
  let batch = db.batch();
  let inBatch = 0;
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!rec.path) continue;
    batch.set(db.doc(rec.path), rec.data || {});
    inBatch++; n++;
    if (inBatch >= 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
  }
  if (inBatch > 0) await batch.commit();
  return n;
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.ndjson'));
  console.log(`📤 ${files.length} dosya → EMULATOR (${process.env.FIRESTORE_EMULATOR_HOST})\n`);
  let total = 0;
  for (const f of files) {
    process.stdout.write(`→ ${f.replace('.ndjson', '')} ... `);
    try {
      const n = await importFile(path.join(DIR, f));
      console.log(`${n} doc ✓`);
      total += n;
    } catch (e) {
      console.log(`❌ ${e.message?.slice(0, 50)}`);
    }
  }
  console.log(`\n✅ ${total} doküman emulator'a yüklendi (${files.length} dosya).`);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
