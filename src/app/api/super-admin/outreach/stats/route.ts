/**
 * GET /api/super-admin/outreach/stats
 *
 * Outreach veritabanının özet analizleri. Dashboard kartlarını besler.
 *
 * Döndürdüğü metrikler:
 *   - byCollection: { registryVakiflar, registryDernekler, outreachContacts } count
 *   - byType (outreachContacts): SivilToplumMüdürlüğü, Federasyon, SporKulübü, ...
 *   - outreachByCategory (faaliyetAlani breakdown — Federasyon için Spor/STK/Mesleki)
 *   - coverage: email kapsama + telefon kapsama (vakıflar + dernekler — dernek 0
 *               olabilir çünkü import script ePosta/telefon1 yazmamış)
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

// Türkiye 81 il — registry `il` alanı bu proper-case formatta saklanır
// (import + backfill-dernek-il.mjs neighborhoodsData key formatı). Top-10 il
// count()-per-province için kullanılır.
const IL_LIST: readonly string[] = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
  'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];

// İl adını kanonikleştir — parantezli sonek ("İstanbul (Avrupa)") at, Türkçe
// proper-case'e çevir ki farklı yazımlar tek ile gruplansın.
function canonIl(s?: string): string {
  const t = (s || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (!t) return '';
  return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1).toLocaleLowerCase('tr');
}

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
    const TYPES = ['Vakıf', 'Dernek', 'SivilToplumMüdürlüğü', 'Federasyon', 'SporKulübü', 'GencSporMudurlugu', 'MailHizmet', 'Diğer'] as const;
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

    // ─── Email/telefon coverage (vakıflar + dernekler) ────────────────
    // registryDernekler de import'ta ePosta/telefon1 tutar (import-registry.mjs);
    // dernek istatistikleri vakıf gibi email+telefon kapsama gösterir.
    const [emailDolu, telDolu, kamuYarariCount, dernekEmail, dernekPhone] = await Promise.all([
      db.collection('registryVakiflar').where('ePosta', '!=', '').count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('registryVakiflar').where('telefon1', '!=', '').count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('registryDernekler').where('isKamuYarari', '==', true).count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('registryDernekler').where('ePosta', '!=', '').count().get().then((s) => s.data().count).catch(() => 0),
      db.collection('registryDernekler').where('telefon1', '!=', '').count().get().then((s) => s.data().count).catch(() => 0),
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

    // ─── Top 10 İl — DOĞRU sayım (örneklem değil) ─────────────────────
    // Vakıf: tüm koleksiyonu `il` projeksiyonuyla tara (~6.7K, ucuz+hızlı),
    //   kanonik il'e göre grupla (casing/parantez varyantlarına dayanıklı).
    // Dernek: `il` backfill ile proper-case → 81 il count() ile kesin sayım
    //   (100K dokümanı okumadan).
    const vakifIlCounts: Record<string, number> = {};
    const vakifIlSnap = await db.collection('registryVakiflar').select('il').get().catch(() => null);
    if (vakifIlSnap) {
      vakifIlSnap.docs.forEach((d) => {
        const il = canonIl((d.data() as { il?: string }).il);
        if (il) vakifIlCounts[il] = (vakifIlCounts[il] || 0) + 1;
      });
    }

    const dernekIlCounts: Record<string, number> = {};
    for (let i = 0; i < IL_LIST.length; i += 27) {
      const slice = IL_LIST.slice(i, i + 27);
      const res = await Promise.all(slice.map((il) =>
        db.collection('registryDernekler').where('il', '==', il).count().get()
          .then((s) => ({ il, c: s.data().count })).catch(() => ({ il, c: 0 }))));
      res.forEach((r) => { if (r.c > 0) dernekIlCounts[r.il] = r.c; });
    }

    const outreachIlCounts: Record<string, number> = {};
    const outreachIlSnap = await db.collection('outreachContacts').select('city', 'il').get().catch(() => null);
    if (outreachIlSnap) {
      outreachIlSnap.docs.forEach((d) => {
        const x = d.data() as { city?: string; il?: string };
        const il = canonIl(x.city || x.il);
        if (il) outreachIlCounts[il] = (outreachIlCounts[il] || 0) + 1;
      });
    }

    const top10 = (counts: Record<string, number>) =>
      Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count }));
    const mergeCounts = (...maps: Record<string, number>[]) => {
      const out: Record<string, number> = {};
      for (const m of maps) for (const [k, v] of Object.entries(m)) out[k] = (out[k] || 0) + v;
      return out;
    };
    const vakifTop = top10(vakifIlCounts);
    const dernekTop = top10(dernekIlCounts);
    const allTop = top10(mergeCounts(vakifIlCounts, dernekIlCounts, outreachIlCounts));
    const topCities = allTop; // top-level + 'all' kategorisi: tüm kayıtlar

    // ─── Kategori detay (outreachContacts type bazlı) ─────────────────
    // Tek equality filtre + örneklem okuması → composite index gerekmez.
    // Sample ≤2000 doc; total ≤ sample ise kapsama oranları KESİN, total > sample
    // ise ÖRNEKLEME dayalı tahmindir (UI 'sample < total' ile bunu işaretler).
    async function outreachTypeDetail(type: string, total: number) {
      const snap = await db.collection('outreachContacts')
        .where('type', '==', type).limit(2000).get().catch(() => null);
      let email = 0, phone = 0, unsub = 0;
      const cc: Record<string, number> = {};
      if (snap) {
        snap.docs.forEach((d) => {
          const x = d.data() as { email?: string; phone?: string; status?: string; city?: string; il?: string };
          if (x.email && String(x.email).trim()) email += 1;
          if (x.phone && String(x.phone).trim()) phone += 1;
          if (x.status === 'unsubscribed') unsub += 1;
          const city = (x.city || x.il || 'Bilinmiyor').trim() || 'Bilinmiyor';
          cc[city] = (cc[city] || 0) + 1;
        });
      }
      const sample = snap ? snap.size : 0;
      const topCitiesCat = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([city, count]) => ({ city, count }));
      return {
        total,
        sample,
        email,
        phone,
        emailPct: sample ? Math.round((email / sample) * 100) : 0,
        phonePct: sample ? Math.round((phone / sample) * 100) : 0,
        unsubscribed: unsub,
        topCities: topCitiesCat,
      };
    }

    const [federasyonDetail, kulupDetail, ilMudurlukDetail, gencSporMudurlukDetail] = await Promise.all([
      outreachTypeDetail('Federasyon', byType.Federasyon || 0),
      outreachTypeDetail('SporKulübü', byType.SporKulübü || 0),
      outreachTypeDetail('SivilToplumMüdürlüğü', byType.SivilToplumMüdürlüğü || 0),
      outreachTypeDetail('GencSporMudurlugu', byType.GencSporMudurlugu || 0),
    ]);

    const vakifTotalCount = vakifTotal?.data().count ?? 0;
    const dernekTotalCount = dernekTotal?.data().count ?? 0;
    const outreachTotalCount = outreachTotal?.data().count ?? 0;
    const grandTotal = vakifTotalCount + dernekTotalCount + outreachTotalCount;
    // categories.all email/phone aggregate hesabı — dernekEmail/dernekPhone
    // şu an 0 (import script atlamış); 0 olsalar bile tutarlılık için topluyoruz.
    const totalEmail = emailDolu + dernekEmail + (federasyonDetail.email || 0) + (kulupDetail.email || 0) + (ilMudurlukDetail.email || 0) + (gencSporMudurlukDetail.email || 0);
    const totalPhone = telDolu + dernekPhone + (federasyonDetail.phone || 0) + (kulupDetail.phone || 0) + (ilMudurlukDetail.phone || 0) + (gencSporMudurlukDetail.phone || 0);
    const categories = {
      all: {
        label: 'Tümü',
        total: grandTotal,
        email: totalEmail,
        phone: totalPhone,
        emailPct: grandTotal ? Math.round((totalEmail / grandTotal) * 100) : 0,
        phonePct: grandTotal ? Math.round((totalPhone / grandTotal) * 100) : 0,
        unsubscribed: unsubscribed.total,
        kamuYarari: kamuYarariCount,
        topCities,
      },
      vakif: {
        label: 'Vakıf',
        total: vakifTotalCount,
        email: emailDolu,
        phone: telDolu,
        emailPct: vakifTotalCount ? Math.round((emailDolu / vakifTotalCount) * 100) : 0,
        phonePct: vakifTotalCount ? Math.round((telDolu / vakifTotalCount) * 100) : 0,
        unsubscribed: unsubscribed.vakiflar,
        topCities: vakifTop,
      },
      // Dernek: vakıf ile aynı yapı (email/phone KPI + coverage bar). T.C. Dernekler
      // Dairesi açık veri setinde ePosta/telefon yok → şu an 0/0% gözükür.
      // Amber bilgi banner'ı CategoryDetailPanel'de kullanıcıya neden boş olduğunu
      // anlatır. Backfill yapılınca otomatik dolar.
      dernek: {
        label: 'Dernek',
        total: dernekTotalCount,
        email: dernekEmail,
        phone: dernekPhone,
        emailPct: dernekTotalCount ? Math.round((dernekEmail / dernekTotalCount) * 100) : 0,
        phonePct: dernekTotalCount ? Math.round((dernekPhone / dernekTotalCount) * 100) : 0,
        unsubscribed: unsubscribed.dernekler,
        kamuYarari: kamuYarariCount,
        topCities: dernekTop,
      },
      kulup: { label: 'Spor Kulübü', ...kulupDetail },
      ilMudurluk: { label: 'STİ İl Müdürlükleri', ...ilMudurlukDetail },
      federasyon: { label: 'Federasyon', ...federasyonDetail, byCategory: federasyonByCategory },
      gencSporMudurluk: { label: 'Gençlik ve Spor İl Müdürlükleri', ...gencSporMudurlukDetail },
    };

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
        // Dernekler için email/phone şu an 0 (import script ePosta/telefon1 yazmamış).
        // İleride backfill yapılırsa otomatik dolacak.
        dernekler: {
          total: dernekTotalCount,
          email: dernekEmail,
          phone: dernekPhone,
          emailPct: dernekTotalCount ? Math.round((dernekEmail / dernekTotalCount) * 100) : 0,
          phonePct: dernekTotalCount ? Math.round((dernekPhone / dernekTotalCount) * 100) : 0,
        },
        kamuYarariDernekler: kamuYarariCount,
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
      categories,
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
