/**
 * Cleanup stale state + submit v2.0.3:
 *   1) Delete stale screenshots stuck in upload-in-progress
 *   2) Delete all old READY_FOR_REVIEW submissions
 *   3) Verify remaining screenshots meet Apple minimums
 *   4) Create fresh submission + add v2.0.3 + SUBMIT
 */
import fs from 'fs';
import jwt from 'jsonwebtoken';

const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const APP_ID = '6664058822';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';  // v2.0.3
const TR_LOCALE_ID = '8fb73023-fa27-40ca-957b-5a44f2979bb9';

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

// === Step 1: Find ALL screenshots in TR locale + identify stale ones ===
console.log('Step 1: Auditing TR screenshots...');
const sets = await api(`/v1/appStoreVersionLocalizations/${TR_LOCALE_ID}/appScreenshotSets?limit=20`);
const setSummary = {};
for (const s of (sets.body?.data || [])) {
  const type = s.attributes.screenshotDisplayType;
  const screens = await api(`/v1/appScreenshotSets/${s.id}/appScreenshots?limit=20`);
  const items = screens.body?.data || [];
  const complete = items.filter(it => it.attributes.assetDeliveryState?.state === 'COMPLETE');
  const incomplete = items.filter(it => it.attributes.assetDeliveryState?.state !== 'COMPLETE');
  setSummary[type] = { complete: complete.length, incomplete: incomplete.length, incompleteIds: incomplete.map(it => it.id) };
  console.log(`  ${type}: complete=${complete.length}, incomplete=${incomplete.length}`);
}

// === Step 2: Delete stale (incomplete) screenshots ===
console.log('\nStep 2: Deleting incomplete screenshots...');
let deletedCount = 0;
for (const [type, info] of Object.entries(setSummary)) {
  for (const id of info.incompleteIds) {
    const del = await api(`/v1/appScreenshots/${id}`, { method: 'DELETE' });
    if (del.status === 204) { deletedCount++; console.log(`  ✓ deleted ${type}/${id.slice(0, 8)}...`); }
    else { console.log(`  ✗ failed ${type}/${id.slice(0, 8)}: ${del.status} ${del.text.slice(0, 150)}`); }
  }
}
console.log(`  Total deleted: ${deletedCount}`);

// === Step 3: Re-check minimums ===
console.log('\nStep 3: Verifying minimums after cleanup...');
const required = ['APP_IPHONE_67', 'APP_IPHONE_55', 'APP_WATCH_SERIES_4']; // app Watch required because Watch target exists
let allOk = true;
for (const r of required) {
  const remaining = (setSummary[r]?.complete ?? 0);
  const ok = remaining >= 1;
  if (!ok) allOk = false;
  console.log(`  ${r}: ${remaining} complete ${ok ? '✓' : '✗ MISSING'}`);
}
if (!allOk) {
  console.log('\n✗ ABORT: cannot submit, some required screenshot types empty after cleanup.');
  process.exit(1);
}

// === Step 4: Cleanup old READY_FOR_REVIEW submissions ===
console.log('\nStep 4: Cleaning old in-progress submissions...');
const subs = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW`);
for (const s of (subs.body?.data || [])) {
  console.log(`  Deleting submission ${s.id} (state=${s.attributes.state})...`);
  const del = await api(`/v1/reviewSubmissions/${s.id}`, { method: 'DELETE' });
  console.log(`    Status: ${del.status} ${del.status === 204 ? '✓' : del.text.slice(0, 200)}`);
}

// === Step 5: Create fresh submission ===
console.log('\nStep 5: Creating new reviewSubmission...');
const created = await api('/v1/reviewSubmissions', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: APP_ID } } },
    },
  }),
});
console.log('  Status:', created.status);
if (created.status >= 400) { console.log('  Body:', created.text.slice(0, 1000)); process.exit(1); }
const submissionId = created.body.data.id;
console.log('  ✓ Created submission:', submissionId);

// === Step 6: Add v2.0.3 item ===
console.log('\nStep 6: Adding v2.0.3 as item...');
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

// === Step 7: SUBMIT ===
console.log('\nStep 7: Triggering SUBMIT...');
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
  console.log('   Track: https://appstoreconnect.apple.com/apps/6664058822/distribution/ios');
} else {
  console.log('  Body:', submit.text.slice(0, 2000));
}
