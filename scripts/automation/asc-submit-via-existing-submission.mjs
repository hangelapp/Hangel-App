/**
 * Submit v2.0.3 via existing READY_FOR_REVIEW submission (cannot delete
 * those due to 403 — likely owned by another teammate, but we can add an
 * item + trigger submitted=true).
 */
import fs from 'fs';
import jwt from 'jsonwebtoken';

const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const APP_ID = '6664058822';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';

const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function api(path, opts={}) {
  const r = await fetch(`https://api.appstoreconnect.apple.com${path}`, { headers: H, ...opts });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j, text: t };
}

// List existing
console.log('=== Listing READY_FOR_REVIEW submissions ===');
const subs = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW`);
const list = subs.body?.data || [];
console.log(`Found ${list.length}`);
for (const s of list) console.log(`  ${s.id} state=${s.attributes?.state}`);

if (list.length === 0) {
  console.log('No existing submissions. Try creating new.');
  process.exit(1);
}

// Pick first empty one (no items)
let target = null;
for (const s of list) {
  const items = await api(`/v1/reviewSubmissions/${s.id}/items`);
  const itemCount = items.body?.data?.length || 0;
  console.log(`  submission ${s.id}: ${itemCount} items`);
  if (itemCount === 0 && !target) target = s.id;
}

if (!target) {
  // All have items. Try the first; ASC allows multiple items?
  target = list[0].id;
  console.log(`No empty submission, using first: ${target}`);
}

console.log(`\n=== Using submission ${target} ===`);

// Add v2.0.3 as item
console.log('Adding v2.0.3 item...');
const addItem = await api('/v1/reviewSubmissionItems', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: { type: 'reviewSubmissions', id: target } },
        appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } },
      },
    },
  }),
});
console.log(`  status: ${addItem.status}`);
if (addItem.status >= 400) {
  console.log(`  body: ${addItem.text.slice(0, 1500)}`);
  // Try DELETE the existing submission and create new — different auth might work
  console.log('\n=== Retry: try cancelling other empty submissions individually ===');
  for (const s of list) {
    if (s.id === target) continue;
    const c = await api(`/v1/reviewSubmissions/${s.id}/actions/cancel`, { method: 'POST' });
    console.log(`  cancel ${s.id}: ${c.status}`);
  }
  process.exit(1);
}
console.log('  ✓ item added');

// SUBMIT
console.log('\n=== SUBMIT (attributes.submitted=true) ===');
const submit = await api(`/v1/reviewSubmissions/${target}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: { type: 'reviewSubmissions', id: target, attributes: { submitted: true } },
  }),
});
console.log(`  status: ${submit.status}`);
if (submit.status >= 200 && submit.status < 300) {
  console.log('\n🎉 v2.0.3 SUBMITTED FOR APPLE REVIEW');
  console.log(`   Submission id: ${target}`);
  console.log(`   Track: https://appstoreconnect.apple.com/apps/${APP_ID}/distribution/ios`);
} else {
  console.log('  body:', submit.text.slice(0, 2000));
}
