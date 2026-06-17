/**
 * POST /api/ngo-admin/call-center/sessions/[id]/end
 *
 * Arama bittiğinde (tarayıcı SIP 'ended'/'failed') oturumu tamamlar: süre + durum yazar.
 * Böylece Görüşme Geçmişi 'ringing 0:00' yerine gerçek süre + 'completed' gösterir.
 *
 * Yetki: super-admin/sahip her STK'nın oturumunu; ngo-admin yalnız kendi managedNgoId'sini.
 * Body: { duration?: number (sn), status?: 'completed' | 'failed' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const OWNER_EMAIL = 'ismailhilmi@hangel.org';

interface Ctx { uid: string; managedNgoId?: string; role?: string; email?: string }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, managedNgoId: d.managedNgoId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Oturum kimliği eksik.' }, { status: 400 });
  }

  let body: { duration?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }
  const duration =
    typeof body.duration === 'number' && body.duration >= 0 ? Math.min(Math.round(body.duration), 86400) : 0;
  const status = body.status === 'failed' ? 'failed' : 'completed';

  try {
    const db = getAdminFirestore();
    const ref = db.collection(CALL_SESSIONS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ errorCode: 'SESSION_NOT_FOUND', message: 'Çağrı oturumu bulunamadı.' }, { status: 404 });
    }
    const data = snap.data() as { ngoId?: string; status?: string };
    const isOwner = ctx.role === 'super-admin' || ctx.email === OWNER_EMAIL;
    if (!isOwner && data.ngoId !== ctx.managedNgoId) {
      return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu oturuma erişim yetkiniz yok.' }, { status: 403 });
    }
    // Zaten sonuçlanmış oturumu (completed/failed) tekrar ezme.
    if (data.status === 'completed' || data.status === 'failed') {
      return NextResponse.json({ ok: true, alreadyEnded: true });
    }
    await ref.update({ status, duration, endedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Oturum güncellenemedi.' }, { status: 500 });
  }
}
