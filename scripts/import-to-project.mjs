#!/usr/bin/env node
/**
 * scripts/import-to-project.mjs — yedek NDJSON'ları YENİ projenin Firestore'una yükler.
 * ---------------------------------------------------------------------------
 * 🔴 GÜVENLİK: SADECE yeni projeye yazar. Eski proje (hangel-new-v18-87297865-9bcc3)
 * ID'sini gördüğünde DURUR (kazara canlı/eski projeye yazmayı önler).
 * Her kayıttaki tam `path` kullanılır → alt-koleksiyonlar da doğru yere gider.
 *
 * KULLANIM (yeni projenin SA anahtarı + ID gerekir):
 *   GOOGLE_APPLICATION_CREDENTIALS=./yeni-proje-sa.json \
 *   TARGET_PROJECT=<YENI_PROJECT_ID> \
 *     node scripts/import-to-project.mjs backups/2026-06-30T10-08-09-491Z
 */
import admin from 'firebase-admin';
import { readdir, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import process from 'node:process';

const OLD_PROJECT = 'hangel-new-v18-87297865-9bcc3'; // ❌ buraya ASLA yazma
const KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const TARGET = process.env.TARGET_PROJECT;
const DIR = process.argv[2];

if (!KEY || !TARGET || !DIR) {
  console.error('❌ Eksik: GOOGLE_APPLICATION_CREDENTIALS, TARGET_PROJECT ve <backup-dir> gerekli.');
  process.exit(1);
}
if (TARGET === OLD_PROJECT) {
  console.error(`❌ GÜVENLİK: hedef ESKİ proje (${OLD_PROJECT}). İmport iptal. Sadece yeni projeye yazılır.`);
  process.exit(1);
}

const sa = JSON.parse(await readFile(KEY, 'utf8'));
if (sa.project_id !== TARGET) {
  console.error(`❌ GÜVENLİK: anahtar (${sa.project_id}) ile TARGET (${TARGET}) uyuşmuyor. İptal.`);
  process.exit(1);
}
if (sa.project_id === OLD_PROJECT) {
  console.error('❌ GÜVENLİK: anahtar ESKİ projeye ait. İptal.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: TARGET });
const db = admin.firestore();
console.log(`📥 Hedef YENİ proje: ${TARGET}  ←  ${DIR}\n`);

async function importFile(file) {
  let n = 0, batch = db.batch(), inB = 0;
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let rec; try { rec = JSON.parse(line); } catch { continue; }
    if (!rec.path) continue;
    batch.set(db.doc(rec.path), rec.data || {});
    inB++; n++;
    if (inB >= 400) { await batch.commit(); batch = db.batch(); inB = 0; }
  }
  if (inB > 0) await batch.commit();
  return n;
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.ndjson'));
let total = 0;
for (const f of files) {
  process.stdout.write(`→ ${f.replace('.ndjson', '')} ... `);
  try { const n = await importFile(path.join(DIR, f)); console.log(`${n} ✓`); total += n; }
  catch (e) { console.log(`❌ ${e.message?.slice(0, 50)}`); }
}
console.log(`\n✅ ${total} doküman YENİ projeye (${TARGET}) yüklendi.`);
