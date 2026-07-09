/**
 * MESSAGING_WORKER_KEY placeholder'ını apphosting.yaml'da gerçek 32-byte base64
 * anahtarla değiştirir. Anahtar stdout'a YAZILMAZ (yalnız dosyaya).
 * Idempotent: placeholder yoksa (zaten kurulu) dokunmaz.
 *
 * Not: Cloud Function cron'u (messagingWorkerTick) ileride deploy edilirse
 * Secret Manager'daki MESSAGING_WORKER_KEY BU değerle eşleşmeli.
 */
import { readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const PATH = new URL('../apphosting.yaml', import.meta.url);
const src = readFileSync(PATH, 'utf8');
const lines = src.split('\n');

const varIdx = lines.findIndex((l) => l.includes('variable: MESSAGING_WORKER_KEY'));
if (varIdx === -1) { console.log('❌ MESSAGING_WORKER_KEY satırı bulunamadı'); process.exit(1); }
const valIdx = varIdx + 1;
if (!lines[valIdx]?.includes('REPLACE_IN_SECRET_MANAGER_LATER')) {
  console.log('✅ MESSAGING_WORKER_KEY zaten kurulu (placeholder değil) — dokunulmadı');
  process.exit(0);
}

const key = randomBytes(32).toString('base64url'); // URL-safe bearer anahtarı
lines[valIdx] = lines[valIdx].replace('REPLACE_IN_SECRET_MANAGER_LATER', key);
writeFileSync(PATH, lines.join('\n'));

console.log('✅ MESSAGING_WORKER_KEY yazıldı (apphosting.yaml satır ' + (valIdx + 1) + ')');
console.log('   ⚠️ Not: plaintext yaml — ileride Secret Manager\'a taşınmalı (bilinen risk).');
