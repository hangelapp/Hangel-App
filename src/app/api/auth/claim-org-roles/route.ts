/**
 * POST /api/auth/claim-org-roles
 * Giriş yapan kullanıcının telefonuna eşleşen bekleyen kurumsal yetki taleplerini
 * (pendingOrgClaims) çözer → otomatik yetkili yapar. Kayıt/giriş sonrası çağrılır
 * (app-shell oturumda bir kez). Idempotent.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { resolvePendingClaimsForUser } from '@/lib/ngo-admin/org-manager';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return NextResponse.json({ errorCode: 'UNAUTH', message: 'Token gerekli.' }, { status: 401 });

  let decoded: { uid: string; phone_number?: string };
  try { decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded; }
  catch { return NextResponse.json({ errorCode: 'UNAUTH', message: 'Geçersiz token.' }, { status: 401 }); }

  const phones: (string | null | undefined)[] = [decoded.phone_number];
  try {
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (snap.exists) {
      const d = snap.data() as { phone?: string; phoneNumber?: string; personalInfo?: { phone?: string } };
      phones.push(d.phone, d.phoneNumber, d.personalInfo?.phone);
    }
  } catch { /* yoksa yalnız token telefonu */ }

  const claimed = await resolvePendingClaimsForUser({ uid: decoded.uid, phones });
  return NextResponse.json({ claimed });
}
