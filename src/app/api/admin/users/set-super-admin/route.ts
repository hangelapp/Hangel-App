/**
 * Süper admin rol atama / yetki güncelleme (super-admin/set-superadmin sayfası).
 *
 * POST { uid, permissions: string[] }            → kişiyi super-admin yap + sayfa yetkilerini ata
 * POST { uid, revoke: true }                      → super-admin yetkisini kaldır
 *
 * Neden server route: /super-admin/* erişimi YALNIZCA custom claim (request.auth.token.role)
 * ile açılıyor (layout claim-only gate). Client `updateDoc` sadece Firestore doc'a yazabilir,
 * custom claim set EDEMEZ → atanan kişi panele giremezdi. setCustomUserClaims yalnızca Admin SDK.
 *
 * Çağıran doğrulama: token claim'i super-admin VEYA Firestore users/{caller}.role super-admin.
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function jsonError(status: number, errorCode: string, message: string) {
  return NextResponse.json({ errorCode, message }, { status });
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) { const first = xff.split(',')[0]?.trim(); if (first) return first; }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({ bucket: 'admin-set-super-admin', key: ip, limit: 20, windowMs: 60_000 });
  if (!rl.allowed) return jsonError(429, 'rate_limited', 'Çok fazla istek. Lütfen biraz bekleyin.');

  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return jsonError(401, 'missing_token', 'Yetkilendirme tokenı eksik.');

  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();

  // Çağıranı doğrula: claim VEYA Firestore doc fallback (claim henüz senkron değilse).
  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    callerUid = decoded.uid;
    let isCallerSuperAdmin = decoded.role === 'super-admin' || !!decoded.superAdminPermissions;
    if (!isCallerSuperAdmin) {
      const callerSnap = await adminDb.collection(COLLECTIONS.users).doc(decoded.uid).get();
      const cd = callerSnap.data();
      isCallerSuperAdmin = cd?.role === 'super-admin' || (Array.isArray(cd?.superAdminPermissions) && cd.superAdminPermissions.length > 0);
    }
    if (!isCallerSuperAdmin) return jsonError(403, 'forbidden', 'Bu işlem için süper admin yetkisi gerekli.');
  } catch {
    return jsonError(401, 'invalid_token', 'Geçersiz veya süresi dolmuş token.');
  }

  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid.trim() : '';
  const revoke = body?.revoke === true;
  const permissions: string[] = Array.isArray(body?.permissions)
    ? body.permissions.filter((p: unknown): p is string => typeof p === 'string')
    : [];

  if (!uid) return jsonError(400, 'invalid_input', 'Hedef kullanıcı (uid) zorunlu.');
  if (!revoke && permissions.length === 0) return jsonError(400, 'invalid_input', 'En az bir sayfa yetkisi seçin.');

  // Hedef kullanıcının Auth kaydı var mı? (custom claim için gerçek auth uid şart)
  try {
    await adminAuth.getUser(uid);
  } catch {
    return jsonError(404, 'user_not_found', 'Bu kullanıcının Auth kaydı bulunamadı. Yalnızca giriş yapmış kullanıcılara atama yapılabilir.');
  }

  try {
    if (revoke) {
      await adminAuth.setCustomUserClaims(uid, { role: null, superAdminPermissions: null });
      await adminDb.collection(COLLECTIONS.users).doc(uid).set(
        { role: 'user', superAdminPermissions: FieldValue.delete() },
        { merge: true },
      );
      return NextResponse.json({ ok: true, action: 'revoked', uid });
    }

    // Custom claim = GERÇEK erişim kapısı (layout + rules bunu okur).
    await adminAuth.setCustomUserClaims(uid, { role: 'super-admin', superAdminPermissions: permissions });
    // Firestore doc = UI'nin gösterdiği durum.
    await adminDb.collection(COLLECTIONS.users).doc(uid).set(
      { role: 'super-admin', superAdminPermissions: permissions, superAdminGrantedBy: callerUid, superAdminGrantedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return NextResponse.json({ ok: true, action: 'granted', uid, permissionCount: permissions.length });
  } catch (err) {
    console.error('set-super-admin error', err);
    return jsonError(500, 'internal_error', 'Yetki ataması yapılamadı. Lütfen tekrar deneyin.');
  }
}
