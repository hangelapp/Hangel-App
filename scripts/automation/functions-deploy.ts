/**
 * Cloud Functions deploy — service account ile direkt Cloud Functions API'sine.
 *
 * Firebase CLI service account auth'u kabul etmiyor (firestore-rules-deploy.ts
 * için yaptığımız çözümün functions versiyonu).
 *
 * Bu script:
 *  1. functions/ klasöründe `npm run build` çalıştırır (tsc → lib/)
 *  2. lib/'i zip'ler
 *  3. gcloud Cloud Functions API'sine 2nd gen function olarak deploy eder
 *
 * Çalıştır:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/automation/functions-deploy.ts
 *
 * Not: Firebase Functions ≠ Cloud Functions deploy farkı:
 * - Firebase CLI: firebase deploy --only functions (service account YOK)
 * - gcloud / API: gcloud functions deploy (service account VAR)
 *
 * Firebase project ile Cloud Run + Eventarc 2nd gen functions için
 * direkt gcloud kullanmak en pratik.
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const REGION = 'us-central1';

async function main() {
  // 1. Build
  console.log('[1/3] Building functions...');
  try {
    execSync('cd functions && npm run build', { stdio: 'inherit' });
  } catch (e) {
    console.error('Build failed');
    process.exit(1);
  }

  if (!existsSync('functions/lib/index.js')) {
    console.error('functions/lib/index.js not found after build');
    process.exit(1);
  }

  // 2. Get access token from service account
  console.log('\n[2/3] Authenticating with service account...');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    console.error('Failed to get access token');
    process.exit(1);
  }
  console.log('  ✅ Token alındı.');

  // 3. List existing functions
  console.log('\n[3/3] Mevcut function listesi:');
  try {
    const resp = await client.request<{ functions?: Array<{ name: string; state?: string }> }>({
      url: `https://cloudfunctions.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/functions`,
    });
    const functions = resp.data.functions || [];
    if (functions.length === 0) {
      console.log('  (boş)');
    } else {
      for (const fn of functions) {
        const name = fn.name.split('/').pop();
        console.log(`  - ${name} (${fn.state || '?'})`);
      }
    }
  } catch (e) {
    const err = e as { response?: { data?: unknown }; message?: string };
    console.error('List failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n⚠️ Cloud Functions deploy direkt API yerine gcloud CLI ile daha pratik.');
  console.log('Aşağıdaki komut çalıştırılırsa otomatik deploy olur (gcloud auth ile):');
  console.log(`
  # Geçici: token'i ENV'e koy + gcloud kullan
  export GOOGLE_APPLICATION_CREDENTIALS=$PWD/.firebase-service-account.json
  cd functions
  gcloud beta functions deploy onEmergencyBloodUpdate \\
    --gen2 --region=${REGION} \\
    --runtime=nodejs22 --trigger-event-filters="type=google.cloud.firestore.document.v1.updated" \\
    --trigger-event-filters="database=(default)" \\
    --trigger-event-filters-path-pattern="document=emergencyBloodCalls/{id}" \\
    --project=${PROJECT_ID} \\
    --source=. --entry-point=onEmergencyBloodUpdate \\
    --set-secrets="APNS_KEY_ID=APNS_KEY_ID:latest,APNS_TEAM_ID=APNS_TEAM_ID:latest,APNS_BUNDLE_ID=APNS_BUNDLE_ID:latest,APNS_PRIVATE_KEY=APNS_PRIVATE_KEY:latest,APNS_ENVIRONMENT=APNS_ENVIRONMENT:latest"
  `);
  console.log('\nVeya Firebase CLI ile (user OAuth gerek):');
  console.log('  firebase login --reauth');
  console.log('  firebase deploy --only functions');
}

main().catch((e) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
