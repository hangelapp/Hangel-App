#!/usr/bin/env node
/**
 * scripts/backup-huge-collection.mjs — TEK dev collection'ı YARIDA-DEVAM ile indir.
 * ---------------------------------------------------------------------------
 * Kota fried olsa bile her çalıştırmada KALDIĞI YERDEN devam eder (append +
 * son-doküman cursor). Quota'da backoff bekler. Tamamlanana dek tekrar tekrar koş.
 *
 * KULLANIM:
 *   BACKUP_DIR=backups/2026-06-30T10-08-09-491Z \
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/backup-huge-collection.mjs outreachContacts
 *
 * Çıkış kodu 2 = kotada durdu, henüz tamam değil → tekrar koş (kaldığı yerden).
 * Çıkış kodu 0 = TAMAM.
 */
import admin from 'firebase-admin';
import { readFile, open, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS || './.firebase-service-account.json';
const DIR = process.env.BACKUP_DIR || 'backups/manual';
const PAGE = Number(process.env.PAGE || 500);
const PACE_MS = Number(process.env.PACE_MS || 700);
const MAX_RETRY = Number(process.env.MAX_RETRY || 12);
const COL = process.argv.slice(2).filter((a) => !a.startsWith('-'))[0];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isQuota = (e) =>
  /RESOURCE_EXHAUSTED|Quota|Total timeout|DEADLINE|UNAVAILABLE/i.test(e?.message || '');

// Partial .ndjson'un son satırından son doküman id'sini oku (büyük dosyada tail-read)
async function lastDocId(file) {
  try {
    const fh = await open(file, 'r');
    try {
      const { size } = await fh.stat();
      if (!size) return { id: null, count: 0 };
      const len = Math.min(65536, size);
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, size - len);
      const lines = buf.toString('utf8').split('\n').filter(Boolean);
      const last = lines[lines.length - 1];
      return { id: last ? JSON.parse(last).id : null, count: -1 };
    } finally {
      await fh.close();
    }
  } catch {
    return { id: null, count: 0 };
  }
}

async function countLines(file) {
  try {
    const t = await readFile(file, 'utf8');
    return t ? t.split('\n').filter(Boolean).length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  if (!COL) {
    console.error('Kullanım: node scripts/backup-huge-collection.mjs <collection>');
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(await readFile(KEY, 'utf8'))),
  });
  const db = admin.firestore();
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, `${COL}.ndjson`);
  const col = db.collection(COL);

  let n = await countLines(file);
  const { id: lastId } = await lastDocId(file);
  console.log(`📥 ${COL} → ${file}`);
  console.log(`   başlangıç: ${n} kayıt var${lastId ? ` (son id: ${lastId})` : ''}\n`);

  const ws = createWriteStream(file, { flags: 'a' }); // APPEND — birikir
  // cursor (kaldığı doküman) — fetch'i de kotaya karşı korumalı; başarısızsa graceful dur
  let last = null;
  if (lastId) {
    let cr = 0;
    while (true) {
      try { last = await col.doc(lastId).get(); break; }
      catch (e) {
        if (isQuota(e) && cr < MAX_RETRY) { cr++; process.stdout.write(`[cursor ${8 * cr}s] `); await sleep(8000 * cr); continue; }
        await new Promise((r) => ws.end(r));
        console.log(`\n⏸️  cursor alınamadı (${n} kayıtta, kota). Tekrar koş → devam.`);
        process.exitCode = 2; return;
      }
    }
  }
  let retry = 0;
  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE);
    if (last) q = q.startAfter(last);
    let snap;
    try {
      snap = await q.get();
    } catch (e) {
      if (isQuota(e) && retry < MAX_RETRY) {
        retry++;
        const w = 8000 * retry;
        process.stdout.write(`[kota ${w / 1000}s] `);
        await sleep(w);
        continue;
      }
      await new Promise((r) => ws.end(r));
      console.log(`\n⏸️  ${n} kayıtta DURDU (kota). Tekrar koş → kaldığı yerden devam eder.`);
      process.exitCode = 2;
      return;
    }
    retry = 0;
    if (snap.empty) break;
    for (const d of snap.docs) {
      ws.write(JSON.stringify({ path: d.ref.path, id: d.id, data: d.data() }) + '\n');
      n++;
    }
    last = snap.docs[snap.docs.length - 1];
    if (n % 5000 === 0) process.stdout.write(`(${n}) `);
    if (snap.size < PAGE) break;
    await sleep(PACE_MS);
  }
  await new Promise((r) => ws.end(r));
  console.log(`\n✅ ${COL} TAMAM: ${n} kayıt indi`);
}

main().catch((e) => {
  console.error('\n❌', e?.message || e);
  process.exitCode = 1;
});
