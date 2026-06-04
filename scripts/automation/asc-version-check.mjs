import fs from 'fs';
import jwt from 'jsonwebtoken';
const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);

const apps = await fetch('https://api.appstoreconnect.apple.com/v1/apps?limit=20', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
const hangel = (apps.data || []).find(a => (a.attributes?.bundleId || '').includes('hangel'));
if (!hangel) { console.log('No Hangel app found'); process.exit(0); }
console.log('App:', hangel.id, hangel.attributes.bundleId, hangel.attributes.name);

const versions = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${hangel.id}/appStoreVersions?limit=10`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
console.log('\n=== App Store Versions ===');
for (const v of (versions.data || [])) {
  console.log(`  v${v.attributes.versionString} | state=${v.attributes.appStoreState} | platform=${v.attributes.platform} | reviewType=${v.attributes.reviewType || '-'} | id=${v.id}`);
}
