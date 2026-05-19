/**
 * PDF-28 — Super-admin user hard-delete endpoint.
 *
 * Deletes the Firebase Auth account (irreversibly blocks signin) AND removes
 * the Firestore `users/{uid}` document. Related sub-collections (notifications,
 * fcmTokens, etc.) are NOT cascaded here — that's a separate cleanup job
 * (see PDF-29 follow-up). After this call the user can no longer sign in;
 * orphaned references in other collections remain until a sweep.
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
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    bucket: 'admin-user-delete',
    key: ip,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return jsonError(429, 'rate_limited', 'Çok fazla istek. Lütfen biraz bekleyin.');
  }

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

  const { uid: targetUid } = await ctx.params;
  if (!targetUid || typeof targetUid !== 'string') {
    return jsonError(400, 'invalid_uid', 'Geçersiz kullanıcı kimliği.');
  }
  if (targetUid === decoded.uid) {
    return jsonError(400, 'self_action', 'Kendi hesabınızı silemezsiniz.');
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  // Delete Auth account first — this is the irreversible step. If Firestore
  // deletion fails afterwards, signin is already blocked.
  try {
    await adminAuth.deleteUser(targetUid);
  } catch (err) {
    const code = (err as { code?: string } | null)?.code ?? '';
    if (code === 'auth/user-not-found') {
      // Auth account already gone — proceed to Firestore cleanup.
    } else {
      console.error('[admin/users/delete] deleteUser failed', { targetUid, code });
      return jsonError(500, 'auth_delete_failed', 'Firebase Auth silme başarısız.');
    }
  }

  try {
    await db.collection(COLLECTIONS.users).doc(targetUid).delete();
  } catch (err) {
    console.warn('[admin/users/delete] firestore delete failed', {
      targetUid,
      err: err instanceof Error ? err.message : String(err),
    });
    // Don't fail the request — Auth account is gone (signin blocked); the
    // orphaned Firestore doc is a UI annoyance, not a security gap.
  }

  try {
    await db.collection('adminAuditLogs').add({
      action: 'user.delete',
      targetUid,
      actorUid: decoded.uid,
      ip,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('[admin/users/delete] audit log failed', {
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({ ok: true, uid: targetUid, deleted: true });
}
