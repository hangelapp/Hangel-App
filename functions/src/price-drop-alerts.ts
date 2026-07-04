/**
 * Fiyat Düşüş Uyarısı Robotu (priceDropAlerts).
 *
 * Schedule: her gün 09:00 Europe/Istanbul.
 *
 * Ne yapar:
 *   Tüm kullanıcıların favorilerini (collectionGroup('favorites')) tarar. Her fav
 *   dokümanı ürünün favoriye eklendiği andaki fiyat SNAPSHOT'unu tutar
 *   ({ price, salePrice, ... }). Bu robot ürünün GÜNCEL fiyatını (products/{id})
 *   ile karşılaştırır:
 *     snapEff = fav.salePrice>0 ? fav.salePrice : fav.price   (snapshot etkin fiyat)
 *     curEff  = urun.salePrice>0 ? urun.salePrice : urun.price (güncel etkin fiyat)
 *   Eğer curEff < snapEff VE düşüş anlamlıysa (>= max(5₺, snapEff*%3)):
 *     • O kullanıcı için bir `notifications` doc yazar — mevcut onNotificationCreated
 *       trigger'ı push'u gönderir (temiz ayrışma; app-side notifyUser import edilmez).
 *     • Fav snapshot'ının price/salePrice'ını güncel değerlere çeker; böylece aynı
 *       düşüş bir sonraki çalışmada TEKRAR uyarı üretmez.
 *
 * Batch: create'ler (notification) + update'ler (fav snapshot) tek batch'te,
 * 500/batch sınırına uyarak. Ürün doc okumaları tek tek cache'lenir (aynı ürün
 * birden çok kullanıcının favorisinde olabilir).
 *
 * Dayanıklılık: her fav try/catch ile sarılır — tek bozuk doküman tüm çalışmayı
 * öldürmez. Tüm gövde ayrıca try/catch ile korunur.
 *
 * Region: europe-west1. Filtre-siz collectionGroup taraması (where/orderBy yok) →
 * özel composite index gerekmez.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import {
  getFirestore,
  FieldValue,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';

const PAGE_SIZE = 500; // collectionGroup stream sayfa boyutu
const BATCH_LIMIT = 500; // Firestore batched write üst sınırı

// Etkin fiyat: indirimli (salePrice>0) varsa onu, yoksa normal fiyatı kullan.
function effectivePrice(price: unknown, salePrice: unknown): number {
  const p = typeof price === 'number' && price > 0 ? price : 0;
  const s = typeof salePrice === 'number' && salePrice > 0 ? salePrice : 0;
  return s > 0 ? s : p;
}

// TL gösterimi için düşüşü tam sayıya yuvarla (örn. 149.9 → 150).
function roundTL(n: number): number {
  return Math.round(n);
}

export const priceDropAlerts = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: TIMEZONE,
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const db = getFirestore();

    try {
      logger.info('[price-drop-alerts] başlıyor — tüm favoriler taranıyor…');

      // Aynı ürünü birden çok kullanıcı favorilemiş olabilir; ürün doc okumasını
      // çalışma boyunca cache'le (undefined = ürün bulunamadı).
      const productCache = new Map<string, DocumentData | null>();

      let scanned = 0;
      let alerts = 0;

      let batch = db.batch();
      let inBatch = 0;

      const commit = async () => {
        if (inBatch === 0) return;
        await batch.commit();
        batch = db.batch();
        inBatch = 0;
      };

      let last: QueryDocumentSnapshot | null = null;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // Filtre-siz collectionGroup taraması: __name__ ile sayfalayarak stream et.
        let q = db
          .collectionGroup('favorites')
          .orderBy('__name__')
          .limit(PAGE_SIZE);
        if (last) q = q.startAfter(last);

        const snap = await q.get();
        if (snap.empty) break;

        for (const favDoc of snap.docs) {
          scanned += 1;
          try {
            const fav = favDoc.data();

            // uid = users/{uid}/favorites/{id} → parent.parent = users/{uid}
            const uid = favDoc.ref.parent.parent?.id;
            if (!uid) continue;

            const productId =
              (typeof fav.productId === 'string' && fav.productId) || favDoc.id;
            if (!productId) continue;

            const snapEff = effectivePrice(fav.price, fav.salePrice);
            if (snapEff <= 0) continue; // snapshot fiyatı yoksa karşılaştıramayız

            // Güncel ürünü çek (cache'li).
            let product = productCache.get(productId);
            if (product === undefined) {
              const pSnap = await db.collection('products').doc(productId).get();
              product = pSnap.exists ? pSnap.data() ?? null : null;
              productCache.set(productId, product);
            }
            if (!product) continue; // ürün silinmiş/bulunamadı

            const curEff = effectivePrice(product.price, product.salePrice);
            if (curEff <= 0) continue;

            // Anlamlı düşüş mü? (en az 5₺ VEYA %3)
            const drop = snapEff - curEff;
            if (drop <= 0) continue;
            const threshold = Math.max(5, snapEff * 0.03);
            if (drop < threshold) continue;

            const oldPrice = roundTL(snapEff);
            const newPrice = roundTL(curEff);
            const dropTL = roundTL(drop);
            const title =
              typeof fav.title === 'string' && fav.title
                ? fav.title
                : 'Favori ürünün';

            // 1) Bildirim doc'u (push'u onNotificationCreated gönderir).
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
              userId: uid,
              title: 'Fiyat düştü! 🔻',
              body: `${title} ${oldPrice}₺ → ${newPrice}₺ (−${dropTL}₺). Favorindeki ürün ucuzladı.`,
              type: 'price_drop',
              data: {
                type: 'price_drop',
                productId,
                oldPrice: String(oldPrice),
                newPrice: String(newPrice),
                link: `/products/${productId}`,
              },
              read: false,
              pushSent: false,
              createdAt: FieldValue.serverTimestamp(),
              createdBy: 'price-drop-alerts',
            });
            inBatch += 1;

            // 2) Fav snapshot'ını güncel fiyata çek (tekrar-uyarı önlemi).
            batch.update(favDoc.ref, {
              price: typeof product.price === 'number' ? product.price : null,
              salePrice:
                typeof product.salePrice === 'number' ? product.salePrice : null,
              priceDropAlertedAt: FieldValue.serverTimestamp(),
            });
            inBatch += 1;

            alerts += 1;

            // Bir fav = 2 write; sınıra yaklaşınca commit et.
            if (inBatch >= BATCH_LIMIT - 1) {
              await commit();
            }
          } catch (favErr) {
            // Best-effort: tek bozuk fav tüm çalışmayı öldürmesin.
            logger.warn(
              `[price-drop-alerts] fav atlandı (${favDoc.ref.path})`,
              favErr instanceof Error ? favErr.message : favErr,
            );
          }
        }

        last = snap.docs[snap.docs.length - 1] ?? null;
        if (snap.size < PAGE_SIZE) break;
        logger.info(
          `[price-drop-alerts]   … ${scanned} favori tarandı, ${alerts} uyarı`,
        );
      }

      await commit();

      logger.info('[price-drop-alerts] ÖZET', {
        favoritesScanned: scanned,
        alertsSent: alerts,
        productsFetched: productCache.size,
      });
    } catch (err) {
      logger.error(
        '[price-drop-alerts] HATA',
        err instanceof Error ? err.message : err,
      );
    }
  },
);
