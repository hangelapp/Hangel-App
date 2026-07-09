/**
 * apphosting.yaml'da verilen değişkenin REPLACE_IN_SECRET_MANAGER_LATER
 * placeholder'ını gerçek 32-byte base64 anahtarla değiştirir.
 * Kullanım: node scripts/set-env-secret.mjs OAUTH_STATE_SECRET
 * Anahtar stdout'a YAZILMAZ. Idempotent: placeholder yoksa dokunmaz.
 */
import { readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const VAR = process.argv[2];
if (!VAR || !/^[A-Z0-9_]+$/.test(VAR)) { console.log('Kullanım: node scripts/set-env-secret.mjs VAR_ADI'); process.exit(1); }

const PATH = new URL('../apphosting.yaml', import.meta.url);
const lines = readFileSync(PATH, 'utf8').split('\n');

const varIdx = lines.findIndex((l) => l.includes(`variable: ${VAR}`));
if (varIdx === -1) { console.log(`❌ ${VAR} satırı bulunamadı`); process.exit(1); }
const valIdx = varIdx + 1;
if (!lines[valIdx]?.includes('REPLACE_IN_SECRET_MANAGER_LATER')) {
  console.log(`✅ ${VAR} zaten kurulu (placeholder değil) — dokunulmadı`);
  process.exit(0);
}

const key = randomBytes(32).toString('base64');
lines[valIdx] = lines[valIdx].replace('REPLACE_IN_SECRET_MANAGER_LATER', key);
writeFileSync(PATH, lines.join('\n'));
console.log(`✅ ${VAR} yazıldı (apphosting.yaml satır ${valIdx + 1})`);
console.log('   ⚠️ Not: plaintext yaml — ileride Secret Manager\'a taşınmalı (bilinen risk).');
