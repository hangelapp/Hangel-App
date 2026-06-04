import fs from 'fs';
import jwt from 'jsonwebtoken';
const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';  // v2.0.3
const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);
const H = { Authorization: `Bearer ${token}` };

// Version detail
const v = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersions/${VERSION_ID}?include=build,appStoreVersionLocalizations,appStoreVersionSubmission,ageRatingDeclaration`, { headers: H }).then(r => r.json());
console.log('=== Version v2.0.3 ===');
console.log(JSON.stringify(v.data?.attributes, null, 2));
console.log('Relationships:');
for (const [k, rel] of Object.entries(v.data?.relationships || {})) {
  const d = rel.data;
  console.log(`  ${k}: ${d ? (Array.isArray(d) ? d.length + ' items' : d.id) : 'null'}`);
}

// Locale localizations
const locs = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations`, { headers: H }).then(r => r.json());
console.log('\n=== Localizations ===');
for (const l of (locs.data || [])) {
  const a = l.attributes;
  console.log(`  ${a.locale} | id=${l.id}`);
  console.log(`    description: ${(a.description || '').slice(0, 80)}... (${(a.description || '').length} chars)`);
  console.log(`    keywords: ${a.keywords || '(empty)'}`);
  console.log(`    whatsNew: ${(a.whatsNew || '').slice(0, 60)}`);
  console.log(`    promotionalText: ${(a.promotionalText || '').slice(0, 60)}`);
  console.log(`    supportUrl: ${a.supportUrl || '(empty)'}`);
  console.log(`    marketingUrl: ${a.marketingUrl || '(empty)'}`);
}

// Screenshots — get screenshotSets per localization
console.log('\n=== Screenshots per locale ===');
for (const l of (locs.data || [])) {
  const sets = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets`, { headers: H }).then(r => r.json());
  console.log(`  ${l.attributes.locale}: ${sets.data?.length || 0} screenshotSets`);
  for (const s of (sets.data || [])) {
    const screens = await fetch(`https://api.appstoreconnect.apple.com/v1/appScreenshotSets/${s.id}/appScreenshots`, { headers: H }).then(r => r.json());
    console.log(`    └─ ${s.attributes.screenshotDisplayType}: ${screens.data?.length || 0} screenshots`);
  }
}
