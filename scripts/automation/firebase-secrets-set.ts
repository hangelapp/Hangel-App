/**
 * Firebase Functions secrets — Google Cloud Secret Manager üzerinden set.
 *
 * Firebase CLI `firebase functions:secrets:set` user OAuth gerektiriyor.
 * Bu script service account ile direkt GCP Secret Manager API kullanır.
 *
 * Çalıştır:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/automation/firebase-secrets-set.ts
 *
 * Setup edilen secrets:
 *   APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT
 */
import { GoogleAuth } from 'google-auth-library';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';

const APNS_KEY_ID = 'N24QW65MN5';
const APNS_TEAM_ID = 'NKZNY8NU8S';
const APNS_BUNDLE_ID = 'com.hangel.ios.app';
const APNS_PRIVATE_KEY_PATH = join(homedir(), '.apple-keys', `AuthKey_${APNS_KEY_ID}.p8`);
const APNS_ENVIRONMENT = 'production';

async function main() {
  if (!existsSync(APNS_PRIVATE_KEY_PATH)) {
    console.error(`❌ ${APNS_PRIVATE_KEY_PATH} bulunamadı`);
    process.exit(1);
  }
  const apnsPrivateKey = readFileSync(APNS_PRIVATE_KEY_PATH, 'utf8');

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();

  const secrets: Array<[string, string]> = [
    ['APNS_KEY_ID', APNS_KEY_ID],
    ['APNS_TEAM_ID', APNS_TEAM_ID],
    ['APNS_BUNDLE_ID', APNS_BUNDLE_ID],
    ['APNS_PRIVATE_KEY', apnsPrivateKey],
    ['APNS_ENVIRONMENT', APNS_ENVIRONMENT],
  ];

  for (const [name, value] of secrets) {
    console.log(`\n[${name}] setting...`);
    // 1. Create secret if missing
    try {
      await client.request({
        url: `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets?secretId=${name}`,
        method: 'POST',
        data: { replication: { automatic: {} } },
      });
      console.log(`  ✅ Secret oluşturuldu`);
    } catch (e) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 409) {
        console.log(`  ℹ️ Zaten var (409)`);
      } else {
        console.warn(`  ⚠️ Create error: ${err.response?.status}`);
      }
    }
    // 2. Add version
    try {
      const payloadData = Buffer.from(value).toString('base64');
      await client.request({
        url: `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/${name}:addVersion`,
        method: 'POST',
        data: { payload: { data: payloadData } },
      });
      const preview = name === 'APNS_PRIVATE_KEY' ? `<${value.length} bytes>` : value;
      console.log(`  ✅ Version eklendi: ${preview.slice(0, 40)}${preview.length > 40 ? '…' : ''}`);
    } catch (e) {
      const err = e as { response?: { data?: unknown }; message?: string };
      console.error(`  ❌ AddVersion error:`, err.response?.data || err.message);
    }
  }

  console.log('\n✅ Tüm secrets set edildi. Functions deploy edildiğinde bu değerleri okuyacak.');
  console.log('Verify: gcloud secrets list --project=' + PROJECT_ID);
}

main().catch((e) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
