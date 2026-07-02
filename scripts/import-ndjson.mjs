#!/usr/bin/env node
/**
 * scripts/import-ndjson.mjs — bir .ndjson yedeğini HEDEF projeye idempotent yaz.
 * ---------------------------------------------------------------------------
 * backup-huge-collection.mjs'in tersi. Her satır {path,id,data}. Doc id KORUNUR
 * (kütük no gibi), set(merge:true) → idempotent, tekrar koşmak güvenli.
 * Firestore Timestamp ({_seconds,_nanoseconds}) geri Timestamp'e çevrilir.
 * Kota vurursa checkpoint'ten devam (exit 2). --dry-run yazmadan sayar.
 *
 * KULLANIM:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.hangelorg-service-account.json \
 *     node scripts/import-ndjson.mjs backups/2026-06-30T10-08-09-491Z/registryDernekler.ndjson registryDernekler
 *   # önce dene:  DRY_RUN=1 node scripts/import-ndjson.mjs <file> <collection>
 *
 * Çıkış 0 = tamam · 2 = kotada durdu (tekrar koş, kaldığı yerden) · 1 = hata
 */
import admin from 'firebase-admin';
import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import process from 'node:process';

const KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS || './.hangelorg-service-account.json';
const DRY = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
const PACE_MS = Number(process.env.PACE_MS || 200);
const CHUNK = Number(process.env.CHUNK || 400);
const MAX_RETRY = Number(process.env.MAX_RETRY || 10);
const [FILE, COL] = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isQuota = (e) =>
  /RESOURCE_EXHAUSTED|Quota|Total timeout|DEADLINE|UNAVAILABLE/i.test(e?.message || '');

// {_seconds,_nanoseconds} → admin Timestamp (backup JSON.stringify'ı böyle üretir)
function reviveTimestamps(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveTimestamps);
  if (
    Object.prototype.hasOwnProperty.call(obj, '_seconds') &&
    Object.prototype.hasOwnProperty.call(obj, '_nanoseconds')
  ) {
    return new admin.firestore.Timestamp(obj._seconds, obj._nanoseconds);
  }
  const out = {};
  for (const k of Object.keys(obj)) out[k] = reviveTimestamps(obj[k]);
  return out;
}

async function main() {
  if (!FILE || !COL) {
    console.error('Kullanım: node scripts/import-ndjson.mjs <ndjson-file> <collection>');
    process.exit(1);
  }
  const ckFile = `${FILE}.import-offset`;
  let startOffset = 0;
  try { startOffset = Number((await readFile(ckFile, 'utf8')).trim()) || 0; } catch {}

  const sa = JSON.parse(await readFile(KEY, 'utf8'));
  if (!DRY) admin.initializeApp({ credential: admin.credential.cert(sa) });
  const db = DRY ? null : admin.firestore();

  console.log(`📤 ${FILE} → ${DRY ? '(DRY) ' : ''}${sa.project_id}/${COL}`);
  if (startOffset) console.log(`   checkpoint: ${startOffset} satır atlanacak (kaldığı yerden)`);

  const rl = readline.createInterface({ input: createReadStream(FILE), crlfDelay: Infinity });
  let line = 0, written = 0, skipped = 0, bad = 0;
  let batch = [];

  const flush = async () => {
    if (!batch.length) return;
    if (DRY) { written += batch.length; batch = []; return; }
    let retry = 0;
    while (true) {
      try {
        const bw = db.bulkWriter();
        bw.onWriteError((e) => e.failedAttempts < 4);
        for (const { id, data } of batch) bw.set(db.collection(COL).doc(id), data, { merge: true });
        await bw.close();
        written += batch.length;
        batch = [];
        return;
      } catch (e) {
        if (isQuota(e) && retry < MAX_RETRY) {
          retry++;
          process.stdout.write(`[kota ${8 * retry}s] `);
          await sleep(8000 * retry);
          continue;
        }
        await writeFile(ckFile, String(line - batch.length));
        console.log(`\n⏸️  ${written} yazıldı, kotada DURDU (satır ~${line}). Tekrar koş → devam.`);
        process.exitCode = 2;
        rl.close();
        return;
      }
    }
  };

  for await (const raw of rl) {
    line++;
    if (line <= startOffset) { skipped++; continue; }
    if (process.exitCode === 2) break;
    const t = raw.trim();
    if (!t) continue;
    let o;
    try { o = JSON.parse(t); } catch { bad++; continue; }
    const id = o.id || (o.path ? o.path.split('/').pop() : null);
    if (!id || !o.data) { bad++; continue; }
    batch.push({ id, data: reviveTimestamps(o.data) });
    if (batch.length >= CHUNK) {
      await flush();
      if (process.exitCode === 2) break;
      if (!DRY) await writeFile(ckFile, String(line));
      if (written % 5000 < CHUNK) process.stdout.write(`(${written}) `);
      await sleep(PACE_MS);
    }
  }
  if (process.exitCode !== 2) {
    await flush();
    if (!DRY) await writeFile(ckFile, String(line));
    console.log(
      `\n✅ ${DRY ? '(DRY) ' : ''}TAMAM: ${written} yazıldı · ${skipped} atlandı · ${bad} bozuk satır (toplam ${line})`
    );
  }
  process.exit(process.exitCode || 0);
}

main().catch((e) => { console.error('\n❌', e?.message || e); process.exit(1); });
