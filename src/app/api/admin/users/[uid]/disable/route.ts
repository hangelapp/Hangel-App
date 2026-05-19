/**
 * PDF-28 — Super-admin user disable endpoint.
 *
 * Soft-disable: flips Firebase Auth `disabled: true` (block signin) and stamps
 * `users/{uid}.disabled = true` for UI labeling. Reversible by an admin route
 * later if needed (`enable` is intentionally not implemented yet — out of MVP
 * scope; super-admin can flip via Firebase Console).
 *
 * Charter: claim-only super-admin, rate-limited (10/min/IP), structured
 * `{ errorCode, message }` errors, audit-logged.
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function jsonError(status: number, errorCode: string, message: string) {
  return NextResponse.json({ errorCode, message }, { status });
}

function getClientIp(req: Request): string {
  const xfwd = req.headers.get('x-forwarded-for') ?? '';
  if (xfwd) return xfwd.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ uid: string }> }
) {
  // 1) Rate-limit (per IP) — fail-open contract in checkRateLimit.
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    bucket: 'admin-user-disable',
    key: ip,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return jsonError(429, 'rate_limited', 'Çok fazla istek. Lütfen biraz bekleyin.');
  }

  // 2) Auth gate — Bearer ID token + claim-only super-admin.
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return jsonError(401, 'missing_token', 'Yetkilendirme tokenı eksik.');
  }

  let decoded: { uid: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return jsonError(401, 'invalid_token', 'Geçersiz veya süresi dolmuş token.');
  }
  if (decoded.role !== 'super-admin') {
    return jsonError(403, 'forbidden', 'Bu işlem için super-admin yetkisi gerekli.');
  }

  // 3) Param + self-action guard.
  const { uid: targetUid } = await ctx.params;
  if (!targetUid || typeof targetUid !== 'string') {
    return jsonError(400, 'invalid_uid', 'Geçersiz kullanıcı kimliği.');
  }
  if (targetUid === decoded.uid) {
    return jsonError(400, 'self_action', 'Kendi hesabınızı devre dışı bırakamazsınız.');
  }

  // 4) Disable in Firebase Auth (blocks future signin) + Firestore flag.
  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  try {
    await adminAuth.updateUser(targetUid, { disabled: true });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code ?? '';
    if (code === 'auth/user-not-found') {
      return jsonError(404, 'user_not_found', 'Kullanıcı Firebase Auth üzerinde bulunamadı.');
    }
    console.error('[admin/users/disable] updateUser failed', { targetUid, code });
    return jsonError(500, 'auth_update_failed', 'Firebase Auth güncellemesi başarısız.');
  }

  try {
    await db.collection(COLLECTIONS.users).doc(targetUid).set(
      {
        disabled: true,
        disabledAt: FieldValue.serverTimestamp(),
        disabledBy: decoded.uid,
        status: 'Askıda',
      },
      { merge: true }
    );
  } catch (err) {
    // Auth disable already succeeded; signin is blocked. Log and continue —
    // the Firestore flag is best-effort UI hint, not the source of truth.
    console.warn('[admin/users/disable] firestore flag failed', {
      targetUid,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  // 5) Audit log (best-effort).
  try {
    await db.collection('adminAuditLogs').add({
      action: 'user.disable',
      targetUid,
      actorUid: decoded.uid,
      ip,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('[admin/users/disable] audit log failed', {
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({ ok: true, uid: targetUid, disabled: true });
}
