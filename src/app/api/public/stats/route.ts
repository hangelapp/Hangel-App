import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const dynamic = 'force-dynamic';

// 1 saatlik cache. Cron veya manuel revalidate ile yenilenebilir.
const getPublicStats = unstable_cache(
  async () => {
    const db = getAdminFirestore();
    const [
      ngosSnap, brandsSnap, usersSnap, productsSnap,
      donationsSnap, eventsSnap, completionsSnap,
    ] = await Promise.all([
      db.collection(COLLECTIONS.ngos).count().get().catch(() => null),
      db.collection(COLLECTIONS.brands).count().get().catch(() => null),
      db.collection(COLLECTIONS.users).count().get().catch(() => null),
      db.collection(COLLECTIONS.products).count().get().catch(() => null),
      db.collection(COLLECTIONS.donations).get().catch(() => null),
      db.collection(COLLECTIONS.events).get().catch(() => null),
      db.collection(COLLECTIONS.volunteerCompletions).get().catch(() => null),
    ]);

    // Bağış hacmi + oluşan mali değer (bağışlar + income kayıtları toplamı).
    let donationVolume = 0;
    if (donationsSnap) {
      for (const doc of donationsSnap.docs) {
        const data = doc.data() as { donationAmount?: unknown; type?: unknown };
        if (data.type === 'income') continue;
        const n = parseFloat(String(data.donationAmount ?? '0'));
        if (Number.isFinite(n)) donationVolume += n;
      }
    }

    // Gerçekleşen etkinlik = bitiş tarihi geçmiş olan etkinlikler. Tarih yoksa
    // 'Tamamlandı'/'Bitti' statüsü de sayılır.
    let eventsHeld = 0;
    const nowMs = Date.now();
    if (eventsSnap) {
      for (const doc of eventsSnap.docs) {
        const d = doc.data() as { eventEnd?: unknown; endDate?: unknown; status?: unknown; date?: unknown };
        const endRaw = (d.eventEnd ?? d.endDate ?? d.date) as string | { toMillis?: () => number } | undefined;
        let endMs = 0;
        if (endRaw && typeof endRaw === 'object' && typeof endRaw.toMillis === 'function') endMs = endRaw.toMillis();
        else if (typeof endRaw === 'string') { const t = Date.parse(endRaw); if (Number.isFinite(t)) endMs = t; }
        const statusDone = d.status === 'Tamamlandı' || d.status === 'Bitti';
        if ((endMs && endMs < nowMs) || statusDone) eventsHeld += 1;
      }
    }

    // Tamamlanan gönüllülük saati — completion doc'larındaki saat alanları toplanır
    // (şema farklılıklarına karşı birkaç olası alan denenir).
    let volunteerHours = 0;
    if (completionsSnap) {
      for (const doc of completionsSnap.docs) {
        const d = doc.data() as Record<string, unknown>;
        // hours ya doğrudan sayı, ya { total: n } objesi olabilir; başka şema
        // varyantları (totalHours / hoursTotal) da denenir.
        const hoursObj = (d.hours && typeof d.hours === 'object') ? (d.hours as { total?: unknown }).total : undefined;
        const raw = hoursObj ?? d.hours ?? d.totalHours ?? d.hoursTotal ?? 0;
        const n = parseFloat(String(raw ?? '0'));
        if (Number.isFinite(n)) volunteerHours += n;
      }
    }

    return {
      users: usersSnap?.data().count ?? 0,
      brands: brandsSnap?.data().count ?? 0,
      ngos: ngosSnap?.data().count ?? 0,
      products: productsSnap?.data().count ?? 0,
      eventsHeld,
      volunteerHours: Math.round(volunteerHours),
      donationVolume: Math.round(donationVolume),
    };
  },
  ['public-stats'],
  // MALİYET (2026-07-08): market + social-impact + about/press bu cache'li stats'a
  // bağlı. İçindeki donations/events/volunteerCompletions limitsiz getDocs'ları
  // günde 4 kez (6 saat) hesaplansın yeter — istatistikler saatlik değişmez.
  // 1 saat → 6 saat = Firestore okuma hacmi ~6x azalır (maliyet tavanı).
  { revalidate: 21600 },
);

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, max-age=21600, s-maxage=21600' },
    });
  } catch (error) {
    return NextResponse.json(
      { errorCode: 'stats_failed', message: 'Stats fetch failed' },
      { status: 500 },
    );
  }
}
