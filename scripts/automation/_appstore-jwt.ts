/**
 * App Store Connect API JWT generator.
 * Apple's ES256 signed JWT for /v1/* endpoints.
 *
 * Usage:
 *   import { getJwt } from './_appstore-jwt';
 *   const token = getJwt();
 */
import { readFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import * as crypto from 'crypto';

export const ISSUER_ID = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';

// Known APNs-only keys (cannot be used for App Store Connect API):
const APNS_ONLY_KEYS = new Set(['N24QW65MN5', '9U82ZQY23S']);

/** Pick .p8 key suitable for App Store Connect API (skip APNs-only keys). */
function findKey(): { keyId: string; p8Path: string } {
  const dir = join(homedir(), '.apple-keys');
  const files = readdirSync(dir).filter((f) => /^AuthKey_[A-Z0-9]+\.p8$/.test(f));
  if (files.length === 0) throw new Error(`No .p8 in ${dir}`);
  if (process.env.APPLE_KEY_ID) {
    const f = `AuthKey_${process.env.APPLE_KEY_ID}.p8`;
    if (!files.includes(f)) throw new Error(`Key ${process.env.APPLE_KEY_ID} not found in ${dir}`);
    return { keyId: process.env.APPLE_KEY_ID, p8Path: join(dir, f) };
  }
  // Filter out APNs-only keys for App Store Connect API
  const eligible = files.filter((f) => {
    const keyId = f.replace('AuthKey_', '').replace('.p8', '');
    return !APNS_ONLY_KEYS.has(keyId);
  });
  if (eligible.length === 0) {
    throw new Error(`No App Store Connect API key in ${dir}. Existing keys are APNs-only.`);
  }
  // Pick newest by mtime
  const sorted = eligible
    .map((f) => ({ f, stat: require('fs').statSync(join(dir, f)) }))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  const newest = sorted[0].f;
  const keyId = newest.replace('AuthKey_', '').replace('.p8', '');
  return { keyId, p8Path: join(dir, newest) };
}

export function getJwt(): { token: string; keyId: string } {
  const { keyId, p8Path } = findKey();
  const privateKey = readFileSync(p8Path, 'utf8');

  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const payload = {
    iss: ISSUER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1200, // 20 min (max recommended)
    aud: 'appstoreconnect-v1',
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign('SHA256');
  sign.update(signInput);
  sign.end();
  const rawSig = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  const sigB64 = rawSig.toString('base64url');

  return { token: `${signInput}.${sigB64}`, keyId };
}

if (require.main === module) {
  const { token, keyId } = getJwt();
  console.log(`Key: ${keyId}`);
  console.log(`JWT: ${token.substring(0, 60)}...`);
}
