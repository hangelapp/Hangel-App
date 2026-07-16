/**
 * Satıcı Sayısı Stamp Robotu (stampSellerCountsDaily).
 *
 * Schedule: her PAZAR 04:00 Europe/Istanbul.
 *   (2026-07 maliyet: her gün 2M ürün taraması = ~27 TL/gün = ana Firestore
 *   gideriydi; haftada 1'e çekildi → ~115 TL/ay. Satıcı sayısı yavaş değişir,
 *   rozet en fazla 6 gün eski olur — pratikte fark etmez.)
 *
 * Ne yapar (local script `scripts/stamp-seller-counts.ts` ile BİREBİR aynı mantık,
 * ama sunucuda çalışır — böylece yerel Firestore kotasını yakmaz):
 *   Tüm `products` koleksiyonunu tarar, aynı ürünü (GTIN, yoksa MPN) satan farklı
 *   MAĞAZALARI (brandName) gruplar ve her ürüne iki alan stamp'ler:
 *     - sellerCount    : gruptaki DISTINCT brandName (mağaza) sayısı
 *     - sellerBestRate : gruptaki en yüksek donationRate (%, yuvarlanmış)
 *   Böylece ürün kartı grid'de per-card Firestore sorgusu yapmadan "3 satıcı ·
 *   en iyi %6" rozetini gösterebilir. Sadece sellerCount > 1 olan gruplar yazılır
 *   (tek satıcılı ürünler write israfı olmasın diye atlanır).
 *
 * Region: europe-west1. Tüm koleksiyonu belleğe aldığı için diğer scheduled
 * fonksiyonlardan daha cömert bellek/timeout ile çalışır.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';

const PRODUCTS_COLLECTION = 'products';
const PAGE_SIZE = 1000; // stream sayfa boyutu
const BATCH_LIMIT = 500; // Firestore batched write üst sınırı

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
  stores: Set<string>; // distinct brandName
  bestRate: number; // max donationRate
}

export const stampSellerCountsDaily = onSchedule(
  {
    schedule: 'every sunday 04:00',
    timeZone: TIMEZONE,
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const db = getFirestore();

    try {
      logger.info('[seller-count-cron] başlıyor — tüm ürünler taranıyor…');

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
        logger.info(`[seller-count-cron]   … ${scanned} ürün tarandı`);
      }

      // Çok satıcılı grupları belirle
      const multiSeller = new Map<
        string,
        { sellerCount: number; sellerBestRate: number }
      >();
      for (const [key, agg] of groups) {
        if (agg.stores.size > 1) {
          multiSeller.set(key, {
            sellerCount: agg.stores.size,
            sellerBestRate: Math.round(agg.bestRate),
          });
        }
      }

      logger.info(
        `[seller-count-cron] tarama bitti — ${scanned} ürün, ${groups.size} grup, ` +
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
          logger.info(`[seller-count-cron]   … ${stamped} ürün stamp'lendi`);
        }
      }
      await commit();

      logger.info('[seller-count-cron] ÖZET', {
        scanned,
        totalGroups: groups.size,
        multiSellerGroups: multiSeller.size,
        stamped,
      });
    } catch (err) {
      logger.error(
        '[seller-count-cron] HATA',
        err instanceof Error ? err.message : err,
      );
    }
  },
);
