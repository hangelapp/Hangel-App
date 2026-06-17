/**
 * GET /api/ngo-admin/call-center/sip-credentials
 *
 * STK çağrı merkezi paneline TARAYICI WebRTC araması için santral geçidinin
 * SIP/TURN credential'larını döndürür. Bu değerler ESKİDEN `NEXT_PUBLIC_SANTRAL_*`
 * env ile CLIENT BUNDLE'a gömülüyordu (toll-fraud riski). Artık SADECE auth
 * korumalı bu endpoint'in arkasından, runtime'da server tarafında okunur.
 *
 * Auth: Bearer idToken → verifyIdToken → users/{uid}.managedNgoId + role
 * 'ngo-admin' | 'super-admin'. Yetkisizse 403.
 *
 * Yanıt: { ok, wssUrl, sipUsername, sipPassword, sipDomain, iceServers }
 *        | { errorCode, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CallerContext {
  uid: string;
  ngoId: string;
  role?: string;
  email?: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; role?: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' },
      { status: 403 },
    );
  }

  // Önce non-public, sonra NEXT_PUBLIC fallback — değerler artık client bundle'a
  // GİRMEZ; sadece server runtime'ında okunur.
  const wssUrl = process.env.SANTRAL_WSS_URL || process.env.NEXT_PUBLIC_SANTRAL_WSS_URL || '';
  const envSipUser = process.env.SANTRAL_SIP_USER || process.env.NEXT_PUBLIC_SANTRAL_SIP_USER || '';
  const sipPassword = process.env.SANTRAL_SIP_PASS || process.env.NEXT_PUBLIC_SANTRAL_SIP_PASS || '';
  const sipDomain = process.env.SANTRAL_SIP_DOMAIN || process.env.NEXT_PUBLIC_SANTRAL_SIP_DOMAIN || '';
  const turnUrl = process.env.SANTRAL_TURN_URL || process.env.NEXT_PUBLIC_SANTRAL_TURN_URL || '';
  const turnUser = process.env.SANTRAL_TURN_USER || process.env.NEXT_PUBLIC_SANTRAL_TURN_USER || '';
  const turnPass = process.env.SANTRAL_TURN_PASS || process.env.NEXT_PUBLIC_SANTRAL_TURN_PASS || '';

  if (!wssUrl) {
    return NextResponse.json(
      { errorCode: 'NOT_CONFIGURED', message: 'Santral yapılandırılmadı.' },
      { status: 503 },
    );
  }

  // Tenant-özel SIP kullanıcı adı: ngoCallCenter/{ngoId}.sipUsername doluysa
  // env'deki yerine kullanılır.
  let sipUsername = envSipUser;
  try {
    const ccSnap = await getAdminFirestore().collection('ngoCallCenter').doc(ctx.ngoId).get();
    if (ccSnap.exists) {
      const cc = ccSnap.data() as { sipUsername?: string };
      if (cc?.sipUsername) sipUsername = cc.sipUsername;
    }
  } catch {
    // ngoCallCenter okunamadıysa env fallback ile devam.
  }

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(turnUrl ? [{ urls: turnUrl, username: turnUser, credential: turnPass }] : []),
  ];

  return NextResponse.json(
    { ok: true, wssUrl, sipUsername, sipPassword, sipDomain, iceServers },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
