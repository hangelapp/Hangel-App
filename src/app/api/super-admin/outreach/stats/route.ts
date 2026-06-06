/**
 * GET /api/super-admin/outreach/stats
 *
 * Outreach veritabanının özet analizleri. Dashboard kartlarını besler.
 *
 * Döndürdüğü metrikler:
 *   - byCollection: { registryVakiflar, registryDernekler, outreachContacts } count
 *   - byType (outreachContacts): SivilToplumMüdürlüğü, Federasyon, SporKulübü, ...
 *   - outreachByCategory (faaliyetAlani breakdown — Federasyon için Spor/STK/Mesleki)
 *   - coverage: email kapsama + telefon kapsama (vakıflar)
 *   - unsubscribedCount (status='unsubscribed' tüm collection'larda)
 *   - sendsHistory: son 30 günde gönderilen mail/SMS sayısı, başarı/başarısız
 *   - topCities: en çok kayıt olan 10 il (vakıflar registry'sinden)
 *   - recentActivity: son 5 outreachSends + outreachUpdates
 *
 * Performance: count() Firestore aggregate (ucuz); büyük read'ler için
 * cache + 5dk revalidate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

const computeStats = unstable_cache(
  async () => {
    const db = getAdminFirestore();

    // ─── Collection counts ────────────────────────────────────────────
    const [vakifTotal, dernekTotal, outreachTotal] = await Promise.all([
      db.collection('registryVakiflar').count().get().catch(() => null),
      db.collection('registryDernekler').count().get().catch(() => null),
      db.collection('outreachContacts').count().get().catch(() => null),
    ]);

    // ─── outreachContacts type breakdown ──────────────────────────────
    const TYPES = ['Vakıf', 'Dernek', 'SivilToplumMüdürlüğü', 'Federasyon', 'SporKulübü', 'MailHizmet', 'Diğer'] as const;
    const byTypeArr = await Promise.all(
      TYPES.map((t) => db.collection('outreachContacts').where('type', '==', t).count().get().then((s) => ({ type: t, count: s.data().count })).catch(() => ({ type: t, count: 0 }))),
    );
    const byType: Record<string, number> = {};
    byTypeArr.forEach((x) => { byType[x.type] = x.count; });

    // ─── Federation kategori breakdown (faaliyetAlani = Spor|STK|Mesleki) ───
    const FED_CATS = ['Spor', 'STK', 'Mesleki'];
    const fedCatArr = await Promise.all(
      FED_CATS.map((c) =>
        db.collection('outreachContacts').where('type', '==', 'Federasyon').where('faaliyetAlani', '==', c).count().get()
          .then((s) => ({ category: c, count: s.data().count })).catch(() => ({ category: c, count: 0 })),
      ),
    );
    const federasyonByCategory: Record<string, number> = {};
    fedCatArr.forEach((x) => { federasyonByCategory[x.category] = x.count; });

    // ─── Email/telefon coverage (vakıflar — emaili olanlar) ────────────
    const [emailDolu, telDolu] = await Promise.all([
      db.collection('registryVakiflar').where('ePosta', '!=', '').count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('registryVakiflar').where('telefon1', '!=', '').count().get().then((s) => s.data().count).catch(() => 0),
    ]);

    // ─── Unsubscribed count (all 3 collections) ───────────────────────
    const unsubCounts = await Promise.all([
      db.collection('registryVakiflar').where('status', '==', 'unsubscribed').count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('registryDernekler').where('status', '==', 'unsubscribed').count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('outreachContacts').where('status', '==', 'unsubscribed').count().get().then((s) => s.data().count).catch(() => 0),
    ]);
    const unsubscribed = {
      vakiflar: unsubCounts[0],
      dernekler: unsubCounts[1],
      outreach: unsubCounts[2],
      total: unsubCounts[0] + unsubCounts[1] + unsubCounts[2],
    };

    // ─── Mail/SMS send history (last 30 days) ─────────────────────────
    const sendsSnap = await db.collection('outreachSends')
      .orderBy('createdAt', 'desc').limit(200).get().catch(() => null);
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    const channelBreakdown: Record<string, number> = { email: 0, sms: 0 };
    const sourceBreakdown: Record<string, number> = {};
    const recentSends: Array<{ id: string; channel: string; source: string; sent: number; failed: number; createdAt: number | null }> = [];
    if (sendsSnap) {
      sendsSnap.docs.forEach((d) => {
        const data = d.data() as { channel?: string; source?: string; sent?: number; failed?: number; skipped?: number; createdAt?: { toMillis?: () => number } };
        totalSent += data.sent || 0;
        totalFailed += data.failed || 0;
        totalSkipped += data.skipped || 0;
        if (data.channel) channelBreakdown[data.channel] = (channelBreakdown[data.channel] || 0) + (data.sent || 0);
        if (data.source) sourceBreakdown[data.source] = (sourceBreakdown[data.source] || 0) + (data.sent || 0);
        if (recentSends.length < 5) {
          recentSends.push({
            id: d.id,
            channel: data.channel || '',
            source: data.source || '',
            sent: data.sent || 0,
            failed: data.failed || 0,
            createdAt: data.createdAt?.toMillis?.() || null,
          });
        }
      });
    }

    // ─── Top 10 cities (vakıflar) ─────────────────────────────────────
    // Aggregate by `il` field; cheap approach: read top docs and count.
    // Daha doğrusu: count() per il but 81 il = 81 query. Bunun yerine cached sample.
    const sampleSnap = await db.collection('registryVakiflar').limit(1000).get().catch(() => null);
    const cityCounts: Record<string, number> = {};
    if (sampleSnap) {
      sampleSnap.docs.forEach((d) => {
        const il = (d.data() as { il?: string }).il || 'Bilinmiyor';
        cityCounts[il] = (cityCounts[il] || 0) + 1;
      });
    }
    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // ─── Recent updates ───────────────────────────────────────────────
    const updatesSnap = await db.collection('outreachUpdates')
      .orderBy('createdAt', 'desc').limit(5).get().catch(() => null);
    const recentUpdates: Array<{ id: string; source: string; createdAt: number | null }> = [];
    if (updatesSnap) {
      updatesSnap.docs.forEach((d) => {
        const data = d.data() as { source?: string; createdAt?: { toMillis?: () => number } };
        recentUpdates.push({
          id: d.id,
          source: data.source || '',
          createdAt: data.createdAt?.toMillis?.() || null,
        });
      });
    }

    return {
      generatedAt: Date.now(),
      byCollection: {
        registryVakiflar: vakifTotal?.data().count ?? 0,
        registryDernekler: dernekTotal?.data().count ?? 0,
        outreachContacts: outreachTotal?.data().count ?? 0,
      },
      byType,
      federasyonByCategory,
      coverage: {
        vakiflar: {
          total: vakifTotal?.data().count ?? 0,
          email: emailDolu,
          phone: telDolu,
          emailPct: vakifTotal?.data().count ? Math.round((emailDolu / vakifTotal.data().count) * 100) : 0,
          phonePct: vakifTotal?.data().count ? Math.round((telDolu / vakifTotal.data().count) * 100) : 0,
        },
      },
      unsubscribed,
      sends: {
        totalSent,
        totalFailed,
        totalSkipped,
        successRate: (totalSent + totalFailed) > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0,
        channelBreakdown,
        sourceBreakdown,
        recentSends,
      },
      topCities,
      recentUpdates,
    };
  },
  ['outreach-stats'],
  { revalidate: 300 }, // 5 dk cache
);

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const stats = await computeStats();
  return NextResponse.json(stats);
}
