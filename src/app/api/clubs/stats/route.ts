/**
 * GET /api/clubs/stats
 *
 * Kulüp kartlarındaki "Üye" ve "Puan" rakamlarının GERÇEK değerleri.
 *  - Üye   = joinedClubs array-contains <clubId> olan kullanıcı sayısı
 *            + managedClubId == <clubId> olan kullanıcılar
 *  - Puan  = bu kullanıcıların impactScore (veya stats.impactScore) toplamı
 *
 * Firestore count() aggregation üye sayısı için kullanılır; puan toplamı için
 * üye doküman okuması gerekir. Maliyet sınırlamak için 30s in-memory cache
 * + 20'lik batch.
 *
 * Dönüş: { ok: true, stats: { [clubId]: { members, points } } }
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

type Stats = Record<string, { members: number; points: number }>;

const TTL_MS = 30 * 1000;
const BATCH = 20;
let cache: { at: number; data: Stats } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return NextResponse.json({ ok: true, stats: cache.data, cached: true });
    }

    const db = getAdminFirestore();
    const usersCol = db.collection(COLLECTIONS.users);
    const clubsSnap = await db.collection(COLLECTIONS.clubs).select().get();
    const ids = clubsSnap.docs.map((d) => d.id);

    const stats: Stats = {};
    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (id) => {
          try {
            // Üyeler (joinedClubs array-contains) + ek olarak managedClubId == id
            const [joinedSnap, managedSnap] = await Promise.all([
              usersCol.where('joinedClubs', 'array-contains', id).select('impactScore', 'stats').get(),
              usersCol.where('managedClubId', '==', id).select('impactScore', 'stats').get(),
            ]);
            const memberIds = new Set<string>();
            let points = 0;
            const accumulate = (docs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
              docs.forEach((d) => {
                if (memberIds.has(d.id)) return;
                memberIds.add(d.id);
                const data = d.data() as { impactScore?: number; stats?: { impactScore?: number } };
                const impact = Math.max(Number(data.impactScore) || 0, Number(data.stats?.impactScore) || 0);
                points += impact;
              });
            };
            accumulate(joinedSnap.docs);
            accumulate(managedSnap.docs);
            stats[id] = { members: memberIds.size, points };
          } catch {
            stats[id] = { members: 0, points: 0 };
          }
        }),
      );
    }

    cache = { at: Date.now(), data: stats };
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    console.error('[clubs/stats] internal error', e);
    return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR', stats: {} }, { status: 200 });
  }
}
