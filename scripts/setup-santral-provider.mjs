/**
 * scripts/setup-santral-provider.mjs
 *
 * Sanal santral SIP provider + numara havuzu + extension kaydı.
 * Credentials komut satırından veya .env\'den alır (hardcoded YOK).
 *
 * Kullanım:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *   SANTRAL_SIP_HOST=185.77.91.103 \
 *   SANTRAL_SIP_USERNAME=902167080216 \
 *   SANTRAL_SIP_PASSWORD=XXX \
 *   SANTRAL_MAIN_DID=+902167080216 \
 *   SANTRAL_EXTENSIONS='100:UPZzFyp86tYC,101:TuLC2bg7P9Ss,...' \
 *   node scripts/setup-santral-provider.mjs --provider-name "Hangel SIP" --dry-run
 *
 * Notlar:
 *  - Şifreler Firestore'da `_secret` prefixli alanlara yazılır (yine de
 *    Secret Manager'a taşınması gerekir — TODO).
 *  - Provider kaydı idempotent (aynı host varsa update).
 *  - Numara havuzu idempotent (aynı number varsa skip).
 */
import admin from 'firebase-admin';
import { randomUUID, createHash } from 'node:crypto';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const providerName = args[args.indexOf('--provider-name') + 1] || 'SIP Provider';

const SIP_HOST = process.env.SANTRAL_SIP_HOST;
const SIP_USERNAME = process.env.SANTRAL_SIP_USERNAME;
const SIP_PASSWORD = process.env.SANTRAL_SIP_PASSWORD;
const MAIN_DID = process.env.SANTRAL_MAIN_DID;
const EXTENSIONS_RAW = process.env.SANTRAL_EXTENSIONS || '';

if (!SIP_HOST || !SIP_USERNAME || !SIP_PASSWORD || !MAIN_DID) {
  console.error('❌ Gerekli env: SANTRAL_SIP_HOST, SANTRAL_SIP_USERNAME, SANTRAL_SIP_PASSWORD, SANTRAL_MAIN_DID');
  process.exit(1);
}

const extensions = EXTENSIONS_RAW.split(',').map((p) => {
  const [ext, pwd] = p.split(':');
  if (!ext || !pwd) return null;
  return { extension: ext.trim(), password: pwd.trim() };
}).filter(Boolean);

console.log(`Setup başlıyor${dryRun ? ' (DRY-RUN)' : ''}`);
console.log(`  Provider: ${providerName}`);
console.log(`  SIP Host: ${SIP_HOST}`);
console.log(`  SIP User: ${SIP_USERNAME}`);
console.log(`  Main DID: ${MAIN_DID}`);
console.log(`  Extensions: ${extensions.length}`);

// Provider id deterministic — aynı host'la tekrar çalıştırılırsa update
const providerId = `sip-${SIP_HOST.replace(/\./g, '-')}`;
const webhookSecret = randomUUID();

async function main() {
  // 1) santralProviders/{providerId}
  const providerRef = db.collection('santralProviders').doc(providerId);
  const providerSnap = await providerRef.get();
  const providerPayload = {
    name: providerName,
    displayName: providerName,
    type: 'sip',
    sipServer: SIP_HOST,
    sipUsername: SIP_USERNAME,
    // _secret prefix → frontend asla okumaz (security rule + custom claim guard)
    _secretSipPassword: SIP_PASSWORD,
    _secretWebhookSecret: webhookSecret,
    _secretMainDid: MAIN_DID,
    apiEndpoint: `sip:${SIP_HOST}`,
    status: 'active',
    supportEmail: 'destek@firma.example',
    capabilities: { webrtc: false, recording: true, transcription: false }, // firmadan teyit gerek
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    note: 'Şifreler chat üzerinden geldi — rotate edilmesi gerek. SecretManager geçişi TODO.',
  };

  if (dryRun) {
    console.log(`\n[DRY] santralProviders/${providerId}:`);
    console.log(JSON.stringify({ ...providerPayload, _secretSipPassword: '***', _secretWebhookSecret: '***' }, null, 2));
  } else {
    await providerRef.set(providerPayload, { merge: true });
    console.log(`✓ santralProviders/${providerId} ${providerSnap.exists ? 'updated' : 'created'}`);
  }

  // 2) santralNumberPool/{numberId} — main DID
  const numberDocId = MAIN_DID.replace(/[^0-9]/g, '');
  const numberRef = db.collection('santralNumberPool').doc(numberDocId);
  const numberSnap = await numberRef.get();
  const numberPayload = {
    providerId,
    number: MAIN_DID,
    displayNumber: MAIN_DID,
    status: 'available',
    type: 'did',
    capabilities: ['inbound', 'outbound'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (dryRun) {
    console.log(`\n[DRY] santralNumberPool/${numberDocId}:`, numberPayload);
  } else {
    if (numberSnap.exists) {
      console.log(`⚪ santralNumberPool/${numberDocId} mevcut — skip`);
    } else {
      await numberRef.set(numberPayload);
      console.log(`✓ santralNumberPool/${numberDocId} eklendi`);
    }
  }

  // 3) Provider altında extension kayıtları
  // santralProviders/{providerId}/extensions/{ext}
  console.log(`\nExtension kayıtları:`);
  for (const e of extensions) {
    const extRef = providerRef.collection('extensions').doc(e.extension);
    const payload = {
      extension: e.extension,
      _secretPassword: e.password,
      // _secretPasswordHash güvenli rotation için tutulur
      _secretPasswordHash: createHash('sha256').update(e.password).digest('hex'),
      status: 'available',
      assignedToNgoId: null,
      assignedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (dryRun) {
      console.log(`  [DRY] ext ${e.extension}: pwd=***`);
    } else {
      await extRef.set(payload, { merge: true });
      console.log(`  ✓ ext ${e.extension} kaydedildi`);
    }
  }

  console.log('\nÖZET:');
  console.log(`  Provider ID:    ${providerId}`);
  console.log(`  Webhook Secret: ${webhookSecret.slice(0, 8)}... (Firestore'da tam, prod için /api/integrations/santral/webhook signature validation kullanılacak)`);
  console.log(`  Main DID:       ${MAIN_DID}`);
  console.log(`  Extensions:     ${extensions.length} (status=available)`);
  console.log('\nSıradakiler:');
  console.log('  1. Hangel derneği /ngo-admin/call-center sayfasından onboarding wizard tamamlasın (DPA + caller ID).');
  console.log('  2. Wizardda bu providerId görünecek + main DID seçilebilir.');
  console.log('  3. Gerçek SIP arama için tarayıcı SIP.js/JsSIP entegrasyonu (Faz 2).');
  console.log('  4. KVKK + audit log şu an Stub provider üzerinden çalışıyor; gerçek SIP sonrası prod-test.');
}

main().catch((e) => { console.error(e); process.exit(1); });
