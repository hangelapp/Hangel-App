import fs from 'fs';
import jwt from 'jsonwebtoken';
const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';
const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);
const H = { Authorization: `Bearer ${token}` };

// Build relationship for v2.0.3
const buildRel = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersions/${VERSION_ID}/relationships/build`, { headers: H }).then(r => r.json());
console.log('Attached build to v2.0.3:', JSON.stringify(buildRel, null, 2));

// All builds for app
const APP_ID = '6664058822';
const builds = await fetch(`https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${APP_ID}&filter[preReleaseVersion.version]=2.0.3&limit=10&sort=-uploadedDate`, { headers: H }).then(r => r.json());
console.log('\n=== Builds for v2.0.3 ===');
for (const b of (builds.data || [])) {
  console.log(`  build ${b.attributes.version} | processing=${b.attributes.processingState} | uploaded=${b.attributes.uploadedDate} | id=${b.id}`);
}

// Submission state
const subRel = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersions/${VERSION_ID}/relationships/appStoreVersionSubmission`, { headers: H }).then(r => r.json());
console.log('\nSubmission rel:', JSON.stringify(subRel, null, 2));
