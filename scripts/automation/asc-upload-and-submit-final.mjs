/**
 * Final orchestration: upload Watch screenshot, wait for Apple processing,
 * then submit v2.0.3 for App Store Review.
 *
 * Does NOT delete in-progress screenshots — waits for them to complete.
 */
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const APP_ID = '6664058822';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';
const TR_LOCALE_ID = '8fb73023-fa27-40ca-957b-5a44f2979bb9';
const SCREENSHOT_PATH = '/tmp/hangel-watch-placeholder.png';

const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');

function makeToken() {
  return jwt.sign(
    { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
    p8,
    { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
  );
}

async function api(path, opts = {}) {
  const token = makeToken();
  const r = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j, text: t };
}

async function uploadWatchScreenshot() {
  console.log('=== Uploading Watch screenshot ===');
  const setsRes = await api(`/v1/appStoreVersionLocalizations/${TR_LOCALE_ID}/appScreenshotSets?limit=20`);
  let watchSetId = null;
  for (const s of (setsRes.body?.data || [])) {
    if (s.attributes?.screenshotDisplayType === 'APP_WATCH_SERIES_4') { watchSetId = s.id; break; }
  }
  if (!watchSetId) {
    const c = await api('/v1/appScreenshotSets', {
      method: 'POST',
      body: JSON.stringify({
        data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: 'APP_WATCH_SERIES_4' },
                relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: TR_LOCALE_ID } } } },
      }),
    });
    if (c.status >= 400) { console.log('create set failed', c.text); process.exit(1); }
    watchSetId = c.body.data.id;
  }
  console.log('  set id:', watchSetId);

  const fileBytes = fs.readFileSync(SCREENSHOT_PATH);
  const reserved = await api('/v1/appScreenshots', {
    method: 'POST',
    body: JSON.stringify({
      data: { type: 'appScreenshots', attributes: { fileSize: fileBytes.length, fileName: 'hangel-watch.png' },
              relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: watchSetId } } } },
    }),
  });
  if (reserved.status >= 400) { console.log('reserve failed', reserved.text); process.exit(1); }
  const screenshotId = reserved.body.data.id;
  const uploadOps = reserved.body.data.attributes.uploadOperations || [];

  for (const op of uploadOps) {
    const slice = fileBytes.subarray(op.offset, op.offset + op.length);
    const hdrs = {};
    for (const h of (op.requestHeaders || [])) hdrs[h.name] = h.value;
    const r = await fetch(op.url, { method: op.method, headers: hdrs, body: slice });
    if (!r.ok) { console.log('chunk upload failed', r.status); process.exit(1); }
  }

  const md5 = crypto.createHash('md5').update(fileBytes).digest('hex');
  const committed = await api(`/v1/appScreenshots/${screenshotId}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: { type: 'appScreenshots', id: screenshotId, attributes: { uploaded: true, sourceFileChecksum: md5 } } }),
  });
  if (committed.status >= 400) { console.log('commit failed', committed.text); process.exit(1); }
  console.log('  uploaded + committed:', screenshotId);
  return screenshotId;
}

async function pollUntilComplete(screenshotId, maxWaitMs = 120_000) {
  console.log('=== Polling for Apple processing complete ===');
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const r = await api(`/v1/appScreenshots/${screenshotId}`);
    const state = r.body?.data?.attributes?.assetDeliveryState?.state;
    const warnings = r.body?.data?.attributes?.assetDeliveryState?.warnings;
    const errors = r.body?.data?.attributes?.assetDeliveryState?.errors;
    console.log(`  ${Math.round((Date.now()-start)/1000)}s | state=${state}`, warnings?.length ? `warnings=${JSON.stringify(warnings)}` : '', errors?.length ? `errors=${JSON.stringify(errors)}` : '');
    if (state === 'COMPLETE') return true;
    if (state === 'FAILED' || (errors && errors.length)) return false;
    await new Promise(res => setTimeout(res, 5000));
  }
  console.log('  TIMEOUT');
  return false;
}

async function submit() {
  console.log('\n=== Cleanup old in-progress submissions ===');
  const subs = await api(`/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW`);
  for (const s of (subs.body?.data || [])) {
    const del = await api(`/v1/reviewSubmissions/${s.id}`, { method: 'DELETE' });
    console.log(`  deleted ${s.id}: ${del.status}`);
  }

  console.log('\n=== Create reviewSubmission ===');
  const created = await api('/v1/reviewSubmissions', {
    method: 'POST',
    body: JSON.stringify({
      data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' },
              relationships: { app: { data: { type: 'apps', id: APP_ID } } } },
    }),
  });
  if (created.status >= 400) { console.log('create submission failed', created.text); process.exit(1); }
  const submissionId = created.body.data.id;
  console.log('  submission:', submissionId);

  console.log('\n=== Add v2.0.3 item ===');
  const addItem = await api('/v1/reviewSubmissionItems', {
    method: 'POST',
    body: JSON.stringify({
      data: { type: 'reviewSubmissionItems',
              relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: submissionId } },
                                appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } } } },
    }),
  });
  if (addItem.status >= 400) { console.log('add item failed', addItem.text); process.exit(1); }
  console.log('  item added');

  console.log('\n=== SUBMIT ===');
  const submitR = await api(`/v1/reviewSubmissions/${submissionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: { type: 'reviewSubmissions', id: submissionId, attributes: { submitted: true } } }),
  });
  console.log('  status:', submitR.status);
  if (submitR.status >= 200 && submitR.status < 300) {
    console.log('\n🎉 SUBMITTED — Apple review queue. Track: https://appstoreconnect.apple.com/apps/6664058822/distribution/ios');
  } else {
    console.log('  body:', submitR.text.slice(0, 2000));
    process.exit(1);
  }
}

const id = await uploadWatchScreenshot();
const ok = await pollUntilComplete(id);
if (!ok) {
  console.log('\n✗ Screenshot processing did not complete. Aborting submit.');
  process.exit(1);
}
await submit();
