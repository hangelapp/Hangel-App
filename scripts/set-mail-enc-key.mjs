/**
 * MAIL_CRED_ENC_KEY placeholder'ını apphosting.yaml'da gerçek 32-byte base64
 * anahtarla değiştirir. Anahtar stdout'a YAZILMAZ (yalnız dosyaya).
 * Idempotent: placeholder yoksa (zaten kurulu) dokunmaz.
 */
import { readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const PATH = new URL('../apphosting.yaml', import.meta.url);
const src = readFileSync(PATH, 'utf8');
const lines = src.split('\n');

const varIdx = lines.findIndex((l) => l.includes('variable: MAIL_CRED_ENC_KEY'));
if (varIdx === -1) { console.log('❌ MAIL_CRED_ENC_KEY satırı bulunamadı'); process.exit(1); }
const valIdx = varIdx + 1;
if (!lines[valIdx]?.includes('REPLACE_IN_SECRET_MANAGER_LATER')) {
  console.log('✅ MAIL_CRED_ENC_KEY zaten kurulu (placeholder değil) — dokunulmadı');
  process.exit(0);
}

const key = randomBytes(32).toString('base64'); // tam 32 byte → AES-256
lines[valIdx] = lines[valIdx].replace('REPLACE_IN_SECRET_MANAGER_LATER', key);
writeFileSync(PATH, lines.join('\n'));

// Doğrulama — anahtarı BASMADAN
const check = Buffer.from(key, 'base64');
console.log('✅ MAIL_CRED_ENC_KEY yazıldı (apphosting.yaml satır ' + (valIdx + 1) + ')');
console.log('   Anahtar uzunluğu:', check.length === 32 ? '32 byte ✅ (AES-256 geçerli)' : check.length + ' byte ❌');
console.log('   ⚠️ Not: plaintext yaml — ileride Secret Manager\'a taşınmalı (bilinen risk).');
