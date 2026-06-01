/**
 * Cloud Functions APNs secret'larını 9U82ZQY23S key'iyle güncelle.
 */
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const NEW_KEY_ID = '9U82ZQY23S';
const NEW_P8_PATH = `${process.env.HOME}/.apple-keys/AuthKey_${NEW_KEY_ID}.p8`;

const FB_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FB_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function getToken(): Promise<string> {
  const cfg = JSON.parse(readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FB_CLI_CLIENT_ID,
      client_secret: FB_CLI_CLIENT_SECRET,
      refresh_token: cfg.tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  return (await res.json() as any).access_token;
}

async function addSecretVersion(token: string, name: string, dataB64: string): Promise<string> {
  const url = `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/${name}:addVersion`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { data: dataB64 } }),
  });
  if (!r.ok) throw new Error(`addVersion ${name}: HTTP ${r.status}: ${await r.text()}`);
  const data = await r.json() as any;
  return data.name.split('/').pop();
}

(async () => {
  const token = await getToken();
  const p8 = readFileSync(NEW_P8_PATH, 'utf8');
  console.log(`.p8 read: ${p8.length} bytes`);
  console.log(`Updating APNS_KEY_ID -> ${NEW_KEY_ID}`);
  const v1 = await addSecretVersion(token, 'APNS_KEY_ID', Buffer.from(NEW_KEY_ID).toString('base64'));
  console.log(`  ✅ new version: ${v1}`);
  console.log(`Updating APNS_PRIVATE_KEY -> .p8 of ${NEW_KEY_ID}`);
  const v2 = await addSecretVersion(token, 'APNS_PRIVATE_KEY', Buffer.from(p8).toString('base64'));
  console.log(`  ✅ new version: ${v2}`);
  console.log('\nNext: redeploy Cloud Functions to pick up new secret versions.');
  console.log('  firebase deploy --only functions --project', PROJECT_ID);
})();
