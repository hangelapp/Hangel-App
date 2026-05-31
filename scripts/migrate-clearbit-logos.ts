/**
 * Migrate: Firestore'da brands + ngos + clubs collection'larındaki
 * logo.clearbit.com URL'lerini Google favicon'a çevir.
 *
 * Clearbit logo API kapatıldı (DNS resolve etmiyor). Tüm marka/STK/kulüp
 * doc'larında saklanmış eski URL'ler runtime'da error veriyor + console
 * spam yaratıyor.
 *
 * Çalıştırma:
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json npx tsx scripts/migrate-clearbit-logos.ts
 *
 * Etki:
 *   - brands: logoUrl, avatarUrl
 *   - ngos: avatarUrl, logoUrl, files.logo
 *   - clubs: avatarUrl, logoUrl, files.logo
 *
 * Idempotent: sadece clearbit içeren URL'leri günceller.
 */
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function convertClearbitToFavicon(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('logo.clearbit.com/')) return null;
  const domain = url.split('logo.clearbit.com/')[1]?.split(/[?#]/)[0];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

async function migrateCollection(db: Firestore, collectionName: string, fields: string[]) {
  console.log(`\n[migrate] Scanning ${collectionName}...`);
  const snap = await db.collection(collectionName).get();
  console.log(`[migrate] Found ${snap.size} docs.`);

  let updated = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const updates: Record<string, string> = {};

    for (const field of fields) {
      // Nested field support: 'files.logo'
      const parts = field.split('.');
      let val: unknown = data;
      for (const p of parts) {
        val = val && typeof val === 'object' ? (val as Record<string, unknown>)[p] : undefined;
      }
      const converted = convertClearbitToFavicon(val as string | undefined);
      if (converted) {
        updates[field] = converted;
      }
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      batchCount++;
      updated++;
      if (batchCount >= 100) {
        await batch.commit();
        console.log(`[migrate]   Batch committed (${batchCount}). Total updated: ${updated}`);
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`[migrate]   Final batch (${batchCount}). Total updated: ${updated}`);
  }
  console.log(`[migrate] ${collectionName}: ${updated}/${snap.size} updated.`);
}

async function main() {
  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      initializeApp({ credential: cert(credPath) });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  const db = getFirestore();

  await migrateCollection(db, 'brands', ['logoUrl', 'avatarUrl']);
  await migrateCollection(db, 'ngos', ['avatarUrl', 'logoUrl', 'files.logo']);
  await migrateCollection(db, 'clubs', ['avatarUrl', 'logoUrl', 'files.logo']);

  console.log('\n=== Migration complete ===');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[migrate-clearbit-logos] FAILED', e);
  process.exit(1);
});
