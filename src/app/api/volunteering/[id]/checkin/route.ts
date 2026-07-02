/**
 * POST /api/volunteering/[id]/checkin
 *
 * Gönüllü YOKLAMA (check-in) — gönüllü, STK'nın kapıda gösterdiği QR'ı hangel app
 * ile okutunca buraya gelir ve o ilana "geldi" olarak işaretlenir.
 *
 * Kayıt yeri: volunteering/{id}/checkins/{uid}  (alt koleksiyon).
 * Şart: kullanıcının o ilana ONAYLANMIŞ başvurusu olmalı (applications:
 *       entityId==id, userId==uid, status=='Onaylandı'). Böylece yalnız kabul
 *       edilmiş gönüllüler yoklamaya girer.
 * İdempotent: bir kez yazılır; tekrar okutmada { already:true } döner.
 *
 * NOT: Bu YOKLAMA'dır (geldi/gelmedi). Saat + puan hesabı YÖNETİCİ tarafından
 * ayrıca "Tamamla" akışında girilir (complete-volunteer). Yoklama, yöneticiye
 * kimin geldiğini gösterir; otomatik puan/bildirim vermez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// Alt koleksiyon adı — events/{id}/checkins ile aynı kelime (ayrı doküman ağacı).
const CHECKINS = 'checkins';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ message: 'İlan kimliği gerekli' }, { status: 400 });

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return NextResponse.json({ message: 'Giriş gerekli' }, { status: 401 });

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ message: 'Geçersiz oturum' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const oppRef = db.collection(COLLECTIONS.volunteering).doc(id);
  const oppSnap = await oppRef.get();
  if (!oppSnap.exists) return NextResponse.json({ message: 'İlan bulunamadı' }, { status: 404 });

  // Onaylı başvuru şartı
  const appSnap = await db
    .collection(COLLECTIONS.applications)
    .where('entityId', '==', id)
    .where('userId', '==', uid)
    .where('status', '==', 'Onaylandı')
    .limit(1)
    .get();
  if (appSnap.empty) {
    return NextResponse.json(
      { message: 'Yoklamaya yalnızca onaylanmış gönüllüler girebilir. Başvurun onaylandıysa sayfayı yenile.' },
      { status: 403 },
    );
  }

  const checkinRef = oppRef.collection(CHECKINS).doc(uid);
  const existing = await checkinRef.get();
  if (existing.exists) return NextResponse.json({ ok: true, already: true });

  const raw = (await req.json().catch(() => ({}))) as { source?: string; location?: { latitude?: number; longitude?: number } };
  const loc = raw?.location;
  await checkinRef.set({
    userId: uid,
    checkedInAt: FieldValue.serverTimestamp(),
    method: raw?.source === 'qr' ? 'qr' : 'manual',
    ...(loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
      ? { location: { latitude: loc.latitude, longitude: loc.longitude } }
      : {}),
  });

  return NextResponse.json({ ok: true, already: false });
}
