/**
 * Submit v2.0.3 for App Store Review (uses new reviewSubmissions API):
 *   1) Ensure build linked → build 38
 *   2) Create reviewSubmission for the app
 *   3) Add v2.0.3 as a reviewSubmissionItem
 *   4) Trigger SUBMIT action
 *
 * IDEMPOTENT: skips already-completed steps.
 */
import fs from 'fs';
import jwt from 'jsonwebtoken';

const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const APP_ID = '6664058822';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';  // v2.0.3
const TARGET_BUILD_ID = '993b50f7-3e96-49c7-baaf-6d51a55096b5'; // build 38

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

// === Step 1: Build link ===
console.log('Step 1: Ensuring v2.0.3 → build 38 linked...');
const linkRes = await api(`/v1/appStoreVersions/${VERSION_ID}/relationships/build`, {
  method: 'PATCH',
  body: JSON.stringify({ data: { type: 'builds', id: TARGET_BUILD_ID } }),
});
console.log('  Status:', linkRes.status, linkRes.status === 204 ? '✓ linked' : '');
if (linkRes.status >= 400) { console.log('  Body:', linkRes.text.slice(0, 400)); process.exit(1); }

// === Step 2: Check existing reviewSubmissions for this app, platform IOS ===
console.log('\nStep 2: Checking existing reviewSubmissions...');
const existing = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW`);
console.log('  Existing in-progress:', existing.body?.data?.length || 0);
let submissionId = null;
for (const s of (existing.body?.data || [])) {
  console.log(`    state=${s.attributes?.state} id=${s.id}`);
  if (!submissionId) submissionId = s.id;
}

// === Step 3: Create reviewSubmission if needed ===
if (!submissionId) {
  console.log('\nStep 3: Creating new reviewSubmission...');
  const created = await api('/v1/reviewSubmissions', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        attributes: { platform: 'IOS' },
        relationships: {
          app: { data: { type: 'apps', id: APP_ID } },
        },
      },
    }),
  });
  console.log('  Status:', created.status);
  if (created.status >= 400) { console.log('  Body:', created.text.slice(0, 1000)); process.exit(1); }
  submissionId = created.body.data.id;
  console.log('  ✓ Created submission:', submissionId);
}

// === Step 4: Check items in submission ===
console.log('\nStep 4: Checking submission items...');
const items = await api(`/v1/reviewSubmissions/${submissionId}/items`);
console.log('  Items:', items.body?.data?.length || 0);
let hasVersionItem = false;
for (const it of (items.body?.data || [])) {
  const verRel = it.relationships?.appStoreVersion?.data;
  if (verRel?.id === VERSION_ID) { hasVersionItem = true; console.log('    ✓ v2.0.3 already added'); }
}

// === Step 5: Add version as item if not there ===
if (!hasVersionItem) {
  console.log('\nStep 5: Adding v2.0.3 as submission item...');
  const addItem = await api('/v1/reviewSubmissionItems', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: submissionId } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } },
        },
      },
    }),
  });
  console.log('  Status:', addItem.status);
  if (addItem.status >= 400) { console.log('  Body:', addItem.text.slice(0, 1500)); process.exit(1); }
  console.log('  ✓ Item added');
}

// === Step 6: SUBMIT ===
console.log('\nStep 6: Triggering SUBMIT action...');
const submit = await api(`/v1/reviewSubmissions/${submissionId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: {
      type: 'reviewSubmissions',
      id: submissionId,
      attributes: { submitted: true },
    },
  }),
});
console.log('  Status:', submit.status);
if (submit.status >= 200 && submit.status < 300) {
  console.log('\n🎉 ✓ V2.0.3 SUBMITTED FOR APPLE REVIEW');
  console.log('   Submission id:', submissionId);
  console.log('   Track: https://appstoreconnect.apple.com/apps/6664058822/distribution');
} else {
  console.log('  Body:', submit.text.slice(0, 2000));
}
