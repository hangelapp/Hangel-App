/**
 * GET /api/ngos/engagement
 *
 * STK kartlarındaki "Bağışçı" / "Gönüllü" rakamlarının GERÇEK değerleri.
 * ngo.stats.{donors,volunteers} dokümanda tutulan + artırılan sayılardır ama
 * tohum verisi / artırma yapmayan katılım yolları (davet linki vb.) yüzünden
 * gerçekten sapabilir. Burada gerçek ilişkiden sayılır:
 *   - Bağışçı  = supportedNgos array-contains <ngoId> olan kullanıcı sayısı
 *   - Gönüllü  = volunteerNgos array-contains <ngoId> olan kullanıcı sayısı
 *
 * Firestore count() aggregation ile hesaplanır (tüm kullanıcı dokümanı okunmaz).
 * Admin SDK kullanır (kullanıcı oturumundan bağımsız; sayım PII değil, herkese
 * açık toplam). 5 dk in-memory cache + 20'lik batch ile yük sınırlanır.
 *
 * Dönüş: { ok: true, counts: { [ngoId]: { donors, volunteers } } }
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

type Counts = Record<string, { donors: number; volunteers: number }>;

// 30s cache: kullanıcı için "anlık" hissi, Firestore count() okuma maliyeti
// belli aralıkla rate-limit edilir.
const TTL_MS = 30 * 1000;
const BATCH = 20;
let cache: { at: number; data: Counts } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return NextResponse.json({ ok: true, counts: cache.data, cached: true });
    }

    const db = getAdminFirestore();
    const usersCol = db.collection(COLLECTIONS.users);
    // Sadece id'ler — alan getirme (select() argümansız → yalnız __name__).
    const ngosSnap = await db.collection(COLLECTIONS.ngos).select().get();
    const ids = ngosSnap.docs.map((d) => d.id);

    const counts: Counts = {};
    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (id) => {
          try {
            const [donorsAgg, volsAgg] = await Promise.all([
              usersCol.where('supportedNgos', 'array-contains', id).count().get(),
              usersCol.where('volunteerNgos', 'array-contains', id).count().get(),
            ]);
            counts[id] = {
              donors: donorsAgg.data().count,
              volunteers: volsAgg.data().count,
            };
          } catch {
            counts[id] = { donors: 0, volunteers: 0 };
          }
        }),
      );
    }

    cache = { at: Date.now(), data: counts };
    return NextResponse.json({ ok: true, counts });
  } catch (e) {
    console.error('[ngos/engagement] internal error', e);
    return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', counts: {} }, { status: 200 });
  }
}
