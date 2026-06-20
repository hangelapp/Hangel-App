/**
 * Add anelka716@gmail.com as TestFlight tester.
 *
 * Strategy:
 *   1) Try adding to existing "Hangel Team" group (internal).
 *      Internal usually fails for non-ASC users → fall through.
 *   2) If fails, ensure "External Testers" group exists (create if not).
 *   3) Add tester (POST /betaTesters) with email + group + latest build link.
 *   4) Apple auto-emails the invite.
 */
import fs from 'fs';
import jwt from 'jsonwebtoken';

const KEY_ID = process.env.APPLE_KEY_ID;
const ISSUER = '295025c2-6ffb-4e6a-abd5-b7a51dd18ffc';
const APP_ID = '6664058822';
const EMAIL = 'anelka716@gmail.com';
const FIRST_NAME = 'Test';
const LAST_NAME = 'User';

const p8 = fs.readFileSync(`${process.env.HOME}/.apple-keys/AuthKey_${KEY_ID}.p8`, 'utf8');
const token = jwt.sign(
  { iss: ISSUER, exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' },
  p8,
  { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function api(path, opts = {}) {
  const r = await fetch(`https://api.appstoreconnect.apple.com${path}`, { headers: H, ...opts });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j, text: t };
}

// Step 1: List existing beta groups
console.log('Step 1: Listing beta groups...');
const groups = await api(`/v1/apps/${APP_ID}/betaGroups`);
let externalGroupId = null;
let internalGroupId = null;
for (const g of (groups.body?.data || [])) {
  console.log(`  ${g.id} | name=${g.attributes?.name} | isInternal=${g.attributes?.isInternalGroup}`);
  if (g.attributes?.isInternalGroup) internalGroupId = g.id;
  else externalGroupId = g.id;
}

// Step 2: Ensure external group exists
if (!externalGroupId) {
  console.log('\nStep 2: Creating "External Testers" group (no external group yet)...');
  const created = await api('/v1/betaGroups', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'betaGroups',
        attributes: { name: 'External Testers', publicLinkEnabled: false },
        relationships: { app: { data: { type: 'apps', id: APP_ID } } },
      },
    }),
  });
  if (created.status >= 400) {
    console.log('  create failed:', created.text.slice(0, 800));
    process.exit(1);
  }
  externalGroupId = created.body.data.id;
  console.log('  ✓ created:', externalGroupId);
} else {
  console.log(`\nStep 2: External group exists: ${externalGroupId}`);
}

// Step 3: Check if tester already exists for this app
console.log(`\nStep 3: Looking up existing tester ${EMAIL}...`);
const existing = await api(`/v1/betaTesters?filter[apps]=${APP_ID}&filter[email]=${encodeURIComponent(EMAIL)}`);
let testerId = null;
for (const t of (existing.body?.data || [])) {
  if ((t.attributes?.email || '').toLowerCase() === EMAIL) {
    testerId = t.id;
    console.log(`  exists: ${testerId}`);
    break;
  }
}

// Step 4: Add to external group (create or link)
if (!testerId) {
  console.log('\nStep 4: Creating betaTester + linking to external group...');
  const created = await api('/v1/betaTesters', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'betaTesters',
        attributes: { email: EMAIL, firstName: FIRST_NAME, lastName: LAST_NAME },
        relationships: {
          betaGroups: { data: [{ type: 'betaGroups', id: externalGroupId }] },
        },
      },
    }),
  });
  console.log('  status:', created.status);
  if (created.status >= 400) {
    // If already in group, this is fine
    console.log('  body:', created.text.slice(0, 1000));
    if (!created.text.includes('duplicate') && !created.text.includes('already')) process.exit(1);
  } else {
    testerId = created.body.data.id;
    console.log('  ✓ tester created:', testerId);
  }
} else {
  console.log('\nStep 4: Linking existing tester to external group...');
  const linked = await api(`/v1/betaGroups/${externalGroupId}/relationships/betaTesters`, {
    method: 'POST',
    body: JSON.stringify({ data: [{ type: 'betaTesters', id: testerId }] }),
  });
  console.log('  status:', linked.status, linked.status === 204 ? '✓' : '');
  if (linked.status >= 400 && !linked.text.includes('already')) {
    console.log('  body:', linked.text.slice(0, 800));
  }
}

// Step 5: Ensure latest beta build is available to the external group
console.log('\nStep 5: Linking latest build to external group...');
const builds = await api(`/v1/builds?filter[app]=${APP_ID}&filter[preReleaseVersion.version]=2.0.3&filter[processingState]=VALID&limit=1&sort=-uploadedDate`);
const latestBuildId = builds.body?.data?.[0]?.id;
if (latestBuildId) {
  console.log(`  Latest valid build: ${latestBuildId}`);
  const link = await api(`/v1/betaGroups/${externalGroupId}/relationships/builds`, {
    method: 'POST',
    body: JSON.stringify({ data: [{ type: 'builds', id: latestBuildId }] }),
  });
  console.log('  link status:', link.status, link.status === 204 ? '✓ linked' : '');
  if (link.status >= 400 && !link.text.includes('already')) {
    console.log('  body:', link.text.slice(0, 600));
  }
}

console.log('\n🎉 Tester eklendi. Apple invitation e-postası anelka716@gmail.com adresine gidiyor.');
console.log('   Track: https://appstoreconnect.apple.com/teams/' + ISSUER + '/apps/' + APP_ID + '/testflight');
