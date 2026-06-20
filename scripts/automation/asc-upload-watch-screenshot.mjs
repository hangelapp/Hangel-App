/**
 * Upload a Watch screenshot to ASC for v2.0.3 (TR locale).
 *
 * Flow:
 *  1) GET the APP_WATCH_SERIES_4 screenshotSet id for TR locale of v2.0.3
 *  2) POST appScreenshots → returns uploadOperations with upload URLs
 *  3) PUT binary to each upload URL
 *  4) PATCH appScreenshots/{id} with uploaded=true to commit
 */
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const VERSION_ID = 'a42c1fdc-1e3c-4655-b4ba-41b6bad6fbb4';
const TR_LOCALE_ID = '8fb73023-fa27-40ca-957b-5a44f2979bb9';
const SCREENSHOT_PATH = '/tmp/hangel-watch-placeholder.png';

const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);
const H = { Authorization: `Bearer ${token}` };

async function api(path, opts = {}) {
  const r = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: { ...H, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j, text: t };
}

// Step 1: Find or create the APP_WATCH_SERIES_4 screenshotSet
console.log('Step 1: Looking up APP_WATCH_SERIES_4 set for TR locale...');
const setsRes = await api(`/v1/appStoreVersionLocalizations/${TR_LOCALE_ID}/appScreenshotSets?limit=20`);
let watchSetId = null;
for (const s of (setsRes.body?.data || [])) {
  if (s.attributes?.screenshotDisplayType === 'APP_WATCH_SERIES_4') {
    watchSetId = s.id;
    console.log('  Found existing set:', watchSetId);
    break;
  }
}
if (!watchSetId) {
  console.log('  Creating new APP_WATCH_SERIES_4 set...');
  const created = await api('/v1/appScreenshotSets', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: 'APP_WATCH_SERIES_4' },
        relationships: {
          appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: TR_LOCALE_ID } },
        },
      },
    }),
  });
  if (created.status >= 400) { console.log('  Create failed:', created.text.slice(0, 500)); process.exit(1); }
  watchSetId = created.body.data.id;
  console.log('  Created:', watchSetId);
}

// Step 2: Reserve appScreenshot
console.log('\nStep 2: Reserving appScreenshot upload slot...');
const fileBytes = fs.readFileSync(SCREENSHOT_PATH);
const fileSize = fileBytes.length;
const fileName = 'hangel-watch.png';

const reserved = await api('/v1/appScreenshots', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      type: 'appScreenshots',
      attributes: { fileSize, fileName },
      relationships: {
        appScreenshotSet: { data: { type: 'appScreenshotSets', id: watchSetId } },
      },
    },
  }),
});
if (reserved.status >= 400) { console.log('Reserve failed:', reserved.text.slice(0, 800)); process.exit(1); }
const screenshotId = reserved.body.data.id;
const uploadOps = reserved.body.data.attributes.uploadOperations || [];
console.log(`  Reserved id=${screenshotId}, ${uploadOps.length} upload operations`);

// Step 3: PUT binary to upload URLs (Apple splits into chunks)
console.log('\nStep 3: Uploading binary chunks...');
for (let i = 0; i < uploadOps.length; i++) {
  const op = uploadOps[i];
  const slice = fileBytes.subarray(op.offset, op.offset + op.length);
  const reqHeaders = {};
  for (const h of (op.requestHeaders || [])) reqHeaders[h.name] = h.value;
  const r = await fetch(op.url, { method: op.method, headers: reqHeaders, body: slice });
  if (!r.ok) {
    console.log(`  Chunk ${i+1}/${uploadOps.length} FAILED: ${r.status} ${await r.text().catch(()=>'')}`);
    process.exit(1);
  }
  console.log(`  Chunk ${i+1}/${uploadOps.length} ok (offset ${op.offset}, length ${op.length})`);
}

// Step 4: Commit upload — compute MD5 of full file
console.log('\nStep 4: Committing upload...');
const md5 = crypto.createHash('md5').update(fileBytes).digest('hex');
const committed = await api(`/v1/appScreenshots/${screenshotId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: {
      type: 'appScreenshots',
      id: screenshotId,
      attributes: { uploaded: true, sourceFileChecksum: md5 },
    },
  }),
});
if (committed.status >= 400) {
  console.log('  Commit failed:', committed.text.slice(0, 800));
  process.exit(1);
}
console.log('  ✓ Committed');
console.log('  Final state:', committed.body?.data?.attributes?.assetDeliveryState?.state);

console.log('\n✓ Watch screenshot uploaded. Now retry submit pipeline.');
