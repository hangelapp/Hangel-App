/**
 * GET /api/volunteering/[id]/checkins
 *
 * STK yöneticisi için YOKLAMA listesi: onaylanmış gönüllüler + kimin check-in
 * yaptığı (yeşil). Yönetim panelindeki "Yoklama QR" dialog'u bunu çeker.
 *
 * ?scope=all → yalnız onaylılar değil, ilana başvuran HERKESİ döndürür
 * (Kayıt QR dialog'unun "Kayıt olan kullanıcılar" listesi). Her kişide
 * `status` (Beklemede|Onaylandı|Reddedildi) yer alır. Param yoksa davranış
 * eskisiyle birebir aynıdır (yalnız onaylılar).
 *
 * Yetki: super-admin VEYA ilan sahibi STK admini (opp.ngoId == actor.ngoId).
 *
 * Dönüş: { opp:{title}, approvedCount, checkedInCount,
 *          people:[{ uid, name, email, status, checkedIn, checkedInAt }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';

export const runtime = 'nodejs';

const CHECKINS = 'checkins';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ message: 'İlan kimliği gerekli' }, { status: 400 });

  const auth = await requireNgoAdminForRoute(req);
  if (auth.error) return auth.error;
  const actor = auth.actor;

  // scope=all → onay durumundan bağımsız TÜM başvuranlar (Kayıt QR listesi).
  const scopeAll = req.nextUrl.searchParams.get('scope') === 'all';

  const db = getAdminFirestore();
  const oppRef = db.collection(COLLECTIONS.volunteering).doc(id);
  const oppSnap = await oppRef.get();
  if (!oppSnap.exists) return NextResponse.json({ message: 'İlan bulunamadı' }, { status: 404 });
  const opp = oppSnap.data() as { title?: string; ngoId?: string };
  if (!actor.isSuperAdmin && opp.ngoId !== actor.ngoId) {
    return NextResponse.json({ message: 'Yetki yok' }, { status: 403 });
  }

  // Başvurular (scope=all → hepsi, aksi halde yalnız onaylılar) + check-in kayıtları (paralel)
  const appsQuery = scopeAll
    ? db.collection(COLLECTIONS.applications).where('entityId', '==', id)
    : db.collection(COLLECTIONS.applications).where('entityId', '==', id).where('status', '==', 'Onaylandı');
  const [appsSnap, checkinsSnap] = await Promise.all([
    appsQuery.get(),
    oppRef.collection(CHECKINS).get(),
  ]);

  const checkedInAt: Record<string, string | null> = {};
  checkinsSnap.docs.forEach((d) => {
    const ts = (d.data() as { checkedInAt?: { toDate?: () => Date } }).checkedInAt;
    checkedInAt[d.id] = ts?.toDate ? ts.toDate().toISOString() : null;
  });

  const rows = appsSnap.docs.map((d) => d.data() as { userId?: string; userName?: string; status?: string });
  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean) as string[])];

  const emailByUid: Record<string, string> = {};
  if (userIds.length > 0) {
    const refs = userIds.map((u) => db.collection(COLLECTIONS.users).doc(u));
    const docs = await db.getAll(...refs);
    for (const d of docs) {
      const u = d.data() as { personalInfo?: { email?: string } } | undefined;
      emailByUid[d.id] = (u?.personalInfo?.email || '').trim();
    }
  }

  const seen = new Set<string>();
  const people = rows
    .filter((r) => r.userId && !seen.has(r.userId))
    .map((r) => {
      const uid = r.userId as string;
      seen.add(uid);
      const email = emailByUid[uid] || '';
      const isIn = uid in checkedInAt;
      return {
        uid,
        name: (r.userName || '').trim() || (email ? email.split('@')[0] : 'Gönüllü'),
        email,
        status: (r.status || 'Beklemede') as string,
        checkedIn: isIn,
        checkedInAt: isIn ? checkedInAt[uid] : null,
      };
    })
    .sort((a, b) => Number(b.checkedIn) - Number(a.checkedIn) || a.name.localeCompare(b.name, 'tr'));

  return NextResponse.json({
    opp: { title: opp.title || '' },
    // Yoklama sayacı her zaman ONAYLI gönüllü sayısıdır (scope=all olsa da tutarlı).
    approvedCount: people.filter((p) => p.status === 'Onaylandı').length,
    registeredCount: people.length,
    checkedInCount: people.filter((p) => p.checkedIn).length,
    people,
  });
}
