/**
 * GET /api/volunteering/[id]/attendees
 *
 * Bir gönüllülük ilanının ONAYLANMIŞ gönüllülerini döndürür — yaka kartı /
 * sertifika / gönüllü listesi üretimi için (event attendees route'unun gönüllülük
 * eşdeğeri, aynı response şekli).
 *
 * Gönüllüler `applications` koleksiyonunda tutulur:
 *   entityId == oppId, status == 'Onaylandı' (approve route böyle set eder),
 *   userName gömülü; e-posta users/{uid}.personalInfo.email'den çözülür.
 *
 * Yetki: super-admin VEYA ilan sahibi STK admini (opp.ngoId == actor.ngoId).
 *
 * Dönüş: { event: { name, date, location }, attendees: [{ name, email, phone, userId }] }
 * name = users/{uid}.name (isim-soyisim) → başvurudaki userName → e-posta fallback.
 * phone = users/{uid}.personalInfo.phone (STK yöneticisi iletişim kurabilsin).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { requireNgoAdminForRoute } from '@/lib/auth/require-ngo-admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ message: 'İlan kimliği gerekli' }, { status: 400 });

  const auth = await requireNgoAdminForRoute(req);
  if (auth.error) return auth.error;
  const actor = auth.actor;

  const db = getAdminFirestore();
  const oppSnap = await db.collection(COLLECTIONS.volunteering).doc(id).get();
  if (!oppSnap.exists) return NextResponse.json({ message: 'İlan bulunamadı' }, { status: 404 });
  const opp = oppSnap.data() as {
    title?: string; ngoId?: string; date?: string; startDate?: string;
    dates?: { eventStart?: string };
    location?: { address?: string; district?: string; city?: string } | string;
    city?: string;
    managerUids?: string[];
  };
  const managerSet = new Set(opp.managerUids || []);

  if (!actor.isSuperAdmin && opp.ngoId !== actor.ngoId) {
    return NextResponse.json({ message: 'Bu ilanın gönüllülerini görme yetkin yok' }, { status: 403 });
  }

  // Onaylanmış başvurular
  const appsSnap = await db
    .collection(COLLECTIONS.applications)
    .where('entityId', '==', id)
    .where('status', '==', 'Onaylandı')
    .get();
  const rows = appsSnap.docs.map((d) => d.data() as { userId?: string; userName?: string });

  // Ad-soyad + e-posta + telefonu users doc'tan çöz (getAll batched).
  // İsim önceliği: users/{uid}.name (isim-soyisim) → başvurudaki userName → e-posta.
  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean) as string[])];
  const infoByUid: Record<string, { name: string; email: string; phone: string }> = {};
  if (userIds.length > 0) {
    const refs = userIds.map((u) => db.collection(COLLECTIONS.users).doc(u));
    const docs = await db.getAll(...refs);
    for (const d of docs) {
      const u = d.data() as { name?: string; personalInfo?: { email?: string; phone?: string } } | undefined;
      infoByUid[d.id] = {
        name: (u?.name || '').trim(),
        email: (u?.personalInfo?.email || '').trim(),
        phone: (u?.personalInfo?.phone || '').trim(),
      };
    }
  }

  const seen = new Set<string>();
  const attendees = rows
    .filter((r) => r.userId && !seen.has(r.userId))
    .map((r) => {
      seen.add(r.userId as string);
      const info = infoByUid[r.userId as string] || { name: '', email: '', phone: '' };
      const name = info.name || (r.userName || '').trim() || (info.email ? info.email.split('@')[0] : 'Gönüllü');
      return {
        name,
        email: info.email,
        phone: info.phone,
        userId: r.userId as string,
        isManager: managerSet.has(r.userId as string),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const loc = opp.location;
  const locationStr =
    typeof loc === 'string'
      ? loc
      : loc
        ? [loc.address, loc.district, loc.city].map((s) => (s || '').trim()).filter(Boolean).join(', ')
        : opp.city || '';

  return NextResponse.json({
    event: {
      name: opp.title || '',
      date: opp.dates?.eventStart || opp.startDate || opp.date || '',
      location: locationStr,
    },
    attendees,
  });
}
