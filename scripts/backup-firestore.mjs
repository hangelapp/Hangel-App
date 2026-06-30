#!/usr/bin/env node
/**
 * scripts/backup-firestore.mjs — hangel Firestore TAM YEDEK (resumable + throttled)
 * ---------------------------------------------------------------------------
 * TÜM root collection'ları NDJSON'a export eder. Kota dostu: sayfalama +
 * RESOURCE_EXHAUSTED'da backoff + sayfalar arası bekleme. Kaldığı yerden DEVAM
 * eder (biten collection'ları atlar). İsteğe bağlı recursion (--sub).
 *
 * NEDEN: Kod GitHub'da yedekliydi; VERİ değildi. [[project_firestore_backup_strategy]]
 *
 * KULLANIM:
 *   # Yeni tam yedek:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/backup-firestore.mjs
 *
 *   # Var olan klasöre DEVAM (biten collection'ları atlar):
 *   BACKUP_DIR=backups/2026-06-30T10-08-09-491Z node scripts/backup-firestore.mjs
 *
 *   # Belirli collection'lar / alt-koleksiyonlar dahil:
 *   node scripts/backup-firestore.mjs users products --sub
 *
 * ÇIKTI: backups/<UTC-zaman>/<path>.ndjson + _manifest.json   (backups/ gitignore'da)
 * AYARLAR (env): PAGE=3000  PACE_MS=200  (yavaşlatmak için PACE_MS artır)
 *
 * ⚠️ Kısmen inen bir collection'ı yeniden indirmek için o .ndjson'u sil, sonra DEVAM et.
 */
import admin from 'firebase-admin';
import { readFile, mkdir, writeFile, stat, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const KEY_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || './.firebase-service-account.json';
const WITH_SUB = process.argv.includes('--sub'); // recursion varsayılan KAPALI (kota dostu)
const PAGE = Number(process.env.PAGE || 3000);
const PACE_MS = Number(process.env.PACE_MS || 200);
const MAX_RETRY = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isQuota = (e) =>
  /RESOURCE_EXHAUSTED|Quota exceeded|Total timeout|DEADLINE_EXCEEDED|UNAVAILABLE/i.test(
    e?.message || '',
  );

let totalDocs = 0;
const manifest = [];
let outDir;

async function exportCollection(colRef) {
  const safe = colRef.path.replace(/\//g, '__');
  const file = path.join(outDir, `${safe}.ndjson`);
  // DEVAM: dolu dosya varsa atla (kısmiyse önce sil)
  try {
    const st = await stat(file);
    if (st.size > 0) {
      console.log(`↩︎  ${colRef.path} zaten var (atla)`);
      return -1;
    }
  } catch {
    /* yok → indir */
  }

  const ws = createWriteStream(file, { flags: 'w' });
  let n = 0;
  let last = null;
  let retry = 0;
  const docRefs = [];
  while (true) {
    let q = colRef.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE);
    if (last) q = q.startAfter(last);
    let snap;
    try {
      snap = await q.get();
    } catch (e) {
      if (isQuota(e) && retry < MAX_RETRY) {
        retry++;
        const wait = 8000 * retry;
        process.stdout.write(`[kota: ${wait / 1000}s bekle] `);
        await sleep(wait);
        continue;
      }
      await new Promise((res) => ws.end(res));
      try { await rm(file); } catch {} // kısmi dosyayı sil → DEVAM'da yeniden indirilir
      throw e;
    }
    retry = 0;
    if (snap.empty) break;
    for (const doc of snap.docs) {
      ws.write(JSON.stringify({ path: doc.ref.path, id: doc.id, data: doc.data() }) + '\n');
      if (WITH_SUB) docRefs.push(doc.ref);
      n++;
    }
    if (n % 10000 === 0) process.stdout.write(`(${n}) `);
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
    await sleep(PACE_MS);
  }
  await new Promise((res, rej) => ws.end((err) => (err ? rej(err) : res())));
  totalDocs += n;
  if (n > 0) manifest.push({ path: colRef.path, count: n });

  if (WITH_SUB && docRefs.length) {
    for (const dref of docRefs) {
      const subs = await dref.listCollections();
      for (const sub of subs) await exportCollection(sub);
    }
  }
  return n;
}

async function main() {
  if (!admin.apps.length) {
    let sa;
    try {
      sa = JSON.parse(await readFile(KEY_PATH, 'utf8'));
    } catch {
      console.error(`❌ Service account anahtarı okunamadı: ${KEY_PATH}`);
      process.exit(1);
    }
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  const db = admin.firestore();

  if (process.env.BACKUP_DIR) {
    outDir = process.env.BACKUP_DIR;
  } else {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    outDir = path.join('backups', stamp);
  }
  await mkdir(outDir, { recursive: true });

  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const roots = args.length
    ? args.map((id) => db.collection(id))
    : await db.listCollections();

  console.log(
    `🗂️  ${roots.length} collection → ${outDir}  (sayfa ${PAGE}, pace ${PACE_MS}ms, recursion ${WITH_SUB ? 'AÇIK' : 'kapalı'})\n`,
  );
  let done = 0;
  for (const col of roots) {
    process.stdout.write(`→ ${col.id} ... `);
    try {
      const n = await exportCollection(col);
      if (n >= 0) console.log(`${n} doc ✓`);
      done++;
    } catch (e) {
      console.log(`❌ ${(e?.message || '').slice(0, 70)}`);
    }
  }

  await writeFile(
    path.join(outDir, '_manifest.json'),
    JSON.stringify({ totalDocs, collections: manifest }, null, 2),
  );
  console.log(
    `\n✅ Bu turda ${manifest.length} collection indi · ${totalDocs} doc · ${done}/${roots.length} işlendi · ${outDir}`,
  );
}

main().catch((e) => {
  console.error('\n❌ Yedek hatası:', e?.message || e);
  process.exitCode = 1;
});
