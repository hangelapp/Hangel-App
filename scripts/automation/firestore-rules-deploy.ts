/**
 * Firestore Security Rules deploy — service account ile direkt Rules API'sine.
 *
 * Firebase CLI service account'u kabul etmiyor (user-level auth ister), ama
 * Firebase Rules REST API kabul ediyor. Bu script GOOGLE_APPLICATION_CREDENTIALS
 * üzerinden service account ile rules deploy eder.
 *
 * Çalıştır:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/automation/firestore-rules-deploy.ts
 *
 * Adımlar:
 *   1. firestore.rules dosyasını oku
 *   2. POST /v1/projects/{p}/rulesets — yeni ruleset oluştur
 *   3. PATCH /v1/projects/{p}/releases/cloud.firestore — aktif ruleset'i değiştir
 */
import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const RULES_PATH = 'firestore.rules';

async function main() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();

  const rulesContent = readFileSync(RULES_PATH, 'utf8');

  console.log(`[deploy] Firestore rules okundu (${rulesContent.length} byte).`);

  // 1. Yeni ruleset oluştur
  console.log('[deploy] Yeni ruleset oluşturuluyor...');
  const createRulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`;
  const rulesetResp = await client.request({
    url: createRulesetUrl,
    method: 'POST',
    data: {
      source: {
        files: [{ name: 'firestore.rules', content: rulesContent }],
      },
    },
  });
  const rulesetName = (rulesetResp.data as { name: string }).name;
  console.log(`[deploy]   Ruleset: ${rulesetName}`);

  // 2. Release'i yeni ruleset'e bağla
  console.log('[deploy] Aktif release güncelleniyor...');
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`;
  await client.request({
    url: releaseUrl,
    method: 'PATCH',
    data: {
      release: {
        name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
        rulesetName,
      },
    },
  });
  console.log(`[deploy] ✅ Firestore rules deploy edildi (${rulesetName.split('/').pop()})`);
}

main().catch((e) => {
  const err = e as { response?: { data?: unknown }; message?: string };
  if (err.response?.data) {
    console.error('API error:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error('Error:', err.message);
  }
  process.exit(1);
});
