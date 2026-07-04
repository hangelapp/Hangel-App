/**
 * scripts/stamp-seller-counts.ts
 *
 * Tüm `products` koleksiyonunu tarar, aynı ürünü (GTIN, yoksa MPN) satan farklı
 * MAĞAZALARI (brandName) gruplar ve her ürüne iki alan stamp'ler:
 *   - sellerCount    : gruptaki DISTINCT brandName (mağaza) sayısı
 *   - sellerBestRate : gruptaki en yüksek donationRate (%, yuvarlanmış)
 *
 * Böylece ürün kartı, grid'de per-card Firestore sorgusu yapmadan "3 satıcı ·
 * en iyi %6" rozetini gösterebilir. Sadece sellerCount > 1 olan gruplar yazılır
 * (tek satıcılı ürünler write israfı olmasın diye atlanır).
 *
 * Usage:
 *   npx tsx scripts/stamp-seller-counts.ts
 *
 * Admin SDK init (seed-market-ads.ts ile aynı):
 *   - GOOGLE_APPLICATION_CREDENTIALS env varsa onu kullanır;
 *   - yoksa repo kökündeki .firebase-service-account.json;
 *   - o da yoksa applicationDefault().
 *
 * Exit codes:
 *   0 success
 *   1 herhangi bir hata
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import {
  getFirestore,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

const PRODUCTS_COLLECTION = 'products';
const PAGE_SIZE = 1000;   // stream sayfa boyutu
const BATCH_LIMIT = 500;  // Firestore batched write üst sınırı

function initAdmin(): void {
  if (getApps().length > 0) return;
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath && fs.existsSync(credsPath)) {
    const sa = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  const local = path.join(process.cwd(), '.firebase-service-account.json');
  if (fs.existsSync(local)) {
    const sa = JSON.parse(fs.readFileSync(local, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  initializeApp({ credential: applicationDefault() });
}

// Bir ürün için grup anahtarı: gtin (yoksa mpn). İkisi de yoksa null (atlanır).
function groupKeyOf(data: FirebaseFirestore.DocumentData): string | null {
  const gtin = typeof data.gtin === 'string' ? data.gtin.trim() : '';
  if (gtin) return `g:${gtin}`;
  const mpn = typeof data.mpn === 'string' ? data.mpn.trim() : '';
  if (mpn) return `m:${mpn}`;
  return null;
}

interface DocInfo {
  id: string;
  key: string;
  brandName: string;
  donationRate: number;
}

interface GroupAgg {
  stores: Set<string>;       // distinct brandName
  bestRate: number;          // max donationRate
}

async function main(): Promise<void> {
  console.log('[stamp-seller-counts] başlıyor — tüm ürünler taranıyor…');
  initAdmin();
  const db: Firestore = getFirestore();

  // --- 1. geçiş: tüm ürünleri stream et, grupları topla ------------------
  const docs: DocInfo[] = [];
  const groups = new Map<string, GroupAgg>();

  let scanned = 0;
  let last: QueryDocumentSnapshot | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = db
      .collection(PRODUCTS_COLLECTION)
      .orderBy('__name__')
      .limit(PAGE_SIZE);
    if (last) q = q.startAfter(last);

    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const data = doc.data();
      const key = groupKeyOf(data);
      scanned += 1;
      if (!key) continue;

      const brandName =
        typeof data.brandName === 'string' ? data.brandName.trim() : '';
      if (!brandName) continue;

      const donationRate =
        typeof data.donationRate === 'number' && data.donationRate > 0
          ? data.donationRate
          : 0;

      docs.push({ id: doc.id, key, brandName, donationRate });

      let agg = groups.get(key);
      if (!agg) {
        agg = { stores: new Set<string>(), bestRate: 0 };
        groups.set(key, agg);
      }
      agg.stores.add(brandName);
      if (donationRate > agg.bestRate) agg.bestRate = donationRate;
    }

    last = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < PAGE_SIZE) break;
    console.log(`[stamp-seller-counts]   … ${scanned} ürün tarandı`);
  }

  // Çok satıcılı grupları belirle
  const multiSeller = new Map<string, { sellerCount: number; sellerBestRate: number }>();
  for (const [key, agg] of groups) {
    if (agg.stores.size > 1) {
      multiSeller.set(key, {
        sellerCount: agg.stores.size,
        sellerBestRate: Math.round(agg.bestRate),
      });
    }
  }

  console.log(
    `[stamp-seller-counts] tarama bitti — ${scanned} ürün, ${groups.size} grup, ` +
      `${multiSeller.size} grupta >1 satıcı.`,
  );

  // --- 2. geçiş: çok satıcılı gruplardaki ürünleri batch ile stamp'le ----
  let stamped = 0;
  let batch = db.batch();
  let inBatch = 0;

  const commit = async () => {
    if (inBatch === 0) return;
    await batch.commit();
    batch = db.batch();
    inBatch = 0;
  };

  for (const d of docs) {
    const info = multiSeller.get(d.key);
    if (!info) continue; // singleton grup — atla (write israfı yok)

    batch.update(db.collection(PRODUCTS_COLLECTION).doc(d.id), {
      sellerCount: info.sellerCount,
      sellerBestRate: info.sellerBestRate,
    });
    inBatch += 1;
    stamped += 1;

    if (inBatch >= BATCH_LIMIT) {
      await commit();
      console.log(`[stamp-seller-counts]   … ${stamped} ürün stamp'lendi`);
    }
  }
  await commit();

  console.log('[stamp-seller-counts] ÖZET:');
  console.log(`  taranan ürün        : ${scanned}`);
  console.log(`  toplam grup         : ${groups.size}`);
  console.log(`  >1 satıcılı grup    : ${multiSeller.size}`);
  console.log(`  stamp'lenen ürün    : ${stamped}`);
  console.log('[stamp-seller-counts] OK');
  process.exit(0);
}

main().catch((err) => {
  console.error(
    '[stamp-seller-counts] HATA:',
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
