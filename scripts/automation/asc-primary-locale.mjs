import fs from 'fs';
import jwt from 'jsonwebtoken';
const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const APP_ID = '6664058822';
const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);
const H = { Authorization: `Bearer ${token}` };

const app = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}`, { headers: H }).then(r => r.json());
console.log('App attributes:');
console.log('  primaryLocale:', app.data?.attributes?.primaryLocale);
console.log('  bundleId:', app.data?.attributes?.bundleId);
console.log('  name:', app.data?.attributes?.name);
console.log('  contentRightsDeclaration:', app.data?.attributes?.contentRightsDeclaration);
