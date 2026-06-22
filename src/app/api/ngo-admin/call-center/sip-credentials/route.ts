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
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';

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

  // Rate-limit: SIP credential enumeration/abuse'ı önle (kullanıcı başına 30/dk).
  const rl = await checkRateLimit({ bucket: 'sip-credentials', key: ctx.uid, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    const retryAfter = Math.max(0, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { errorCode: 'RATE_LIMITED', message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
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
  let tenantPassword: string | undefined;
  try {
    const ccSnap = await getAdminFirestore().collection('ngoCallCenter').doc(ctx.ngoId).get();
    if (ccSnap.exists) {
      const cc = ccSnap.data() as { sipUsername?: string; sipPassword?: string };
      if (cc?.sipUsername) sipUsername = cc.sipUsername;
      if (cc?.sipPassword) tenantPassword = cc.sipPassword;
    }
  } catch {
    // ngoCallCenter okunamadıysa env fallback ile devam.
  }
  // Per-tenant izolasyon: STK'nın kendi SIP parolası provize edilmişse paylaşılan env
  // yerine onu döndür (Asterisk tenant başına kullanıcı tanımlandığında toll-fraud yüzeyi daralır).
  const effectivePassword = tenantPassword || sipPassword;

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(turnUrl ? [{ urls: turnUrl, username: turnUser, credential: turnPass }] : []),
  ];

  // Audit: kim / hangi STK / ne zaman SIP credential aldı (hesap verebilirlik + anomali tespiti).
  try {
    await getAdminFirestore().collection('callCenterCredAudit').add({
      uid: ctx.uid,
      ngoId: ctx.ngoId,
      email: ctx.email ?? null,
      perTenant: !!tenantPassword,
      at: FieldValue.serverTimestamp(),
    });
  } catch { /* audit best-effort, isteği bloklamaz */ }

  return NextResponse.json(
    { ok: true, wssUrl, sipUsername, sipPassword: effectivePassword, sipDomain, iceServers },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
