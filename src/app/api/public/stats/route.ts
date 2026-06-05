import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const dynamic = 'force-dynamic';

// 1 saatlik cache. Cron veya manuel revalidate ile yenilenebilir.
const getPublicStats = unstable_cache(
  async () => {
    const db = getAdminFirestore();
    const [ngosSnap, brandsSnap, usersSnap, donationsSnap] = await Promise.all([
      db.collection(COLLECTIONS.ngos).count().get().catch(() => null),
      db.collection(COLLECTIONS.brands).count().get().catch(() => null),
      db.collection(COLLECTIONS.users).count().get().catch(() => null),
      db.collection(COLLECTIONS.donations).get().catch(() => null),
    ]);
    let donationVolume = 0;
    if (donationsSnap) {
      for (const doc of donationsSnap.docs) {
        const data = doc.data() as { donationAmount?: unknown; type?: unknown };
        if (data.type === 'income') continue;
        const n = parseFloat(String(data.donationAmount ?? '0'));
        if (Number.isFinite(n)) donationVolume += n;
      }
    }
    return {
      ngos: ngosSnap?.data().count ?? 0,
      brands: brandsSnap?.data().count ?? 0,
      users: usersSnap?.data().count ?? 0,
      donationVolume: Math.round(donationVolume),
    };
  },
  ['public-stats'],
  { revalidate: 3600 },
);

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    return NextResponse.json(
      { errorCode: 'stats_failed', message: 'Stats fetch failed' },
      { status: 500 },
    );
  }
}
