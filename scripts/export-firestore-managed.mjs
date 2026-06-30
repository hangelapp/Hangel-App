#!/usr/bin/env node
/**
 * scripts/export-firestore-managed.mjs — Firestore MANAGED EXPORT (kotasız)
 * ---------------------------------------------------------------------------
 * Dev collection'ları (products, registry, outreach) sunucu-taraflı toplu export
 * ile GCS'e aktarır. Tek tek OKUMADIĞI için Firestore read-quota'sına TAKILMAZ.
 * Probation'da read kısıtlıyken büyük collection'ları almanın tek yolu budur.
 *
 * KULLANIM:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/export-firestore-managed.mjs products registryDernekler outreachContacts registryVakiflar
 *   # bucket override: EXPORT_BUCKET=gs://baska-bucket node scripts/...
 *
 * SONUÇ: gs://<bucket>/firestore-export/<zaman>/  (binary; restore edilebilir)
 *        → sonra @google-cloud/storage ile indirilir.
 */
import pkg from '@google-cloud/firestore';
import process from 'node:process';
const { v1 } = pkg;

const KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS || './.firebase-service-account.json';
const PROJECT = 'hangel-new-v18-87297865-9bcc3';
const BUCKET = process.env.EXPORT_BUCKET || `gs://${PROJECT}.firebasestorage.app`;
const COLLECTIONS = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const client = new v1.FirestoreAdminClient({ keyFilename: KEY });

async function main() {
  const dbName = client.databasePath(PROJECT, '(default)');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = `${BUCKET}/firestore-export/${stamp}`;
  console.log('🚀 Managed Export başlatılıyor');
  console.log('   hedef:', prefix);
  console.log('   collections:', COLLECTIONS.length ? COLLECTIONS.join(', ') : 'TÜMÜ');

  const [op] = await client.exportDocuments({
    name: dbName,
    outputUriPrefix: prefix,
    collectionIds: COLLECTIONS, // boş dizi = tüm collection'lar
  });
  console.log('   operation:', op.name?.split('/').pop());
  console.log('⏳ Sunucu export ediyor (büyük veride birkaç-on dk)...');
  const [result] = await op.promise();
  console.log('\n✅ EXPORT TAMAM');
  console.log('   çıktı:', result.outputUriPrefix || prefix);
  console.log('   → şimdi bu GCS klasörünü indirebiliriz (scripts/download-gcs.mjs).');
}

main().catch((e) => {
  console.error('\n❌ Export hatası:', e?.message || e);
  console.error('   (bucket lokasyonu DB ile uyumsuzsa ya da probation engelliyorsa olur)');
  process.exitCode = 1;
});
