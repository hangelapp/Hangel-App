/**
 * Backfill: users docs'a personalInfo.phoneHash field ekle.
 *
 * Çalıştırma (lokalde, service account JSON ile):
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json npx tsx scripts/backfill-phone-hashes.ts
 *
 * Mantık:
 * - users collection'ı tara
 * - personalInfo.phone var, phoneHash yok → canonicalPhone + SHA-256 hesapla, set et
 * - 100'lük batch (Firestore batched writes)
 * - Idempotent: zaten hash'i olan dokümana dokunmaz
 *
 * Privacy: hash sadece /api/contacts/sync match'i için. Raw phone hiç
 * dışarı çıkmaz.
 */
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

function canonicalPhone(rawPhone: string, countryCode?: string): string {
  let d = (rawPhone ?? '').replace(/\D/g, '');
  const cc = (countryCode ?? '').replace(/\D/g, '');
  d = d.replace(/^0+/, '');
  if (cc && d.startsWith(cc) && d.length > cc.length + 6) {
    d = d.slice(cc.length);
  }
  return d;
}

async function backfill() {
  // Firebase Admin init
  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      initializeApp({ credential: cert(credPath) });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  const db: Firestore = getFirestore();

  console.log('[backfill-phone-hashes] Scanning users collection...');
  const snap = await db.collection('users').get();
  console.log(`[backfill-phone-hashes] Found ${snap.size} user docs.`);

  let updated = 0;
  let skipped = 0;
  let invalid = 0;

  // Batch in 100s (Firestore limit 500 but 100 is safer for reads)
  const BATCH_SIZE = 100;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as {
      personalInfo?: { phone?: string; phoneCountryCode?: string; phoneHash?: string };
    };
    const phone = data.personalInfo?.phone;
    const countryCode = data.personalInfo?.phoneCountryCode;
    const existingHash = data.personalInfo?.phoneHash;

    if (!phone) {
      invalid++;
      continue;
    }
    if (existingHash) {
      skipped++;
      continue;
    }

    const canonical = canonicalPhone(phone, countryCode);
    if (canonical.length < 7) {
      invalid++;
      continue;
    }

    const hash = crypto.createHash('sha256').update(canonical).digest('hex');
    batch.update(doc.ref, { 'personalInfo.phoneHash': hash });
    batchCount++;
    updated++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`[backfill-phone-hashes] Committed batch of ${batchCount}. Total updated: ${updated}`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`[backfill-phone-hashes] Final batch of ${batchCount}. Total updated: ${updated}`);
  }

  console.log('\n=== Summary ===');
  console.log(`Total docs:    ${snap.size}`);
  console.log(`Updated:       ${updated}`);
  console.log(`Skipped (had): ${skipped}`);
  console.log(`Invalid:       ${invalid}`);
}

backfill().then(() => process.exit(0)).catch((e) => {
  console.error('[backfill-phone-hashes] FAILED', e);
  process.exit(1);
});
