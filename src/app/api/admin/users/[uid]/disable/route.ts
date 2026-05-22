/**
 * PDF-28 / SEC-DISABLE-ENFORCE — Super-admin user disable/enable endpoint.
 *
 * disable (default): flips Firebase Auth `disabled: true` (blocks future signin
 * AND token refresh) AND `revokeRefreshTokens(uid)` (kills live sessions — any
 * in-flight ID token is rejected by Firestore/Storage rules within ~1s once the
 * token's `auth_time` predates the revocation), AND mirrors `disabled: true`
 * onto `users/{uid}` for the client-side sign-out guard + UI labeling.
 *
 * enable: reverses it — `disabled: false` in Auth + `disabled: false` on the
 * Firestore doc. (No revoke needed; the user simply signs in again.)
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

  // 3) Param + action + self-action guard.
  const { uid: targetUid } = await ctx.params;
  if (!targetUid || typeof targetUid !== 'string') {
    return jsonError(400, 'invalid_uid', 'Geçersiz kullanıcı kimliği.');
  }

  // Body is optional; default action is 'disable' (backward-compatible).
  let action: 'disable' | 'enable' = 'disable';
  try {
    const raw = await req.json().catch(() => null);
    const a = (raw as { action?: unknown } | null)?.action;
    if (a === 'enable' || a === 'disable') action = a;
    else if (a !== undefined) {
      return jsonError(400, 'invalid_action', "Geçersiz işlem. 'disable' veya 'enable' bekleniyor.");
    }
  } catch {
    // No/invalid body — keep default 'disable'.
  }

  if (targetUid === decoded.uid) {
    return jsonError(
      400,
      'self_action',
      action === 'disable'
        ? 'Kendi hesabınızı devre dışı bırakamazsınız.'
        : 'Kendi hesabınız üzerinde bu işlemi yapamazsınız.'
    );
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();
  const isDisabling = action === 'disable';

  // 4) Flip Firebase Auth `disabled`. For disable, this blocks future signin
  //    AND token refresh. For enable, it restores signin.
  try {
    await adminAuth.updateUser(targetUid, { disabled: isDisabling });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code ?? '';
    if (code === 'auth/user-not-found') {
      return jsonError(404, 'user_not_found', 'Kullanıcı Firebase Auth üzerinde bulunamadı.');
    }
    console.error('[admin/users/disable] updateUser failed', { targetUid, code, action });
    return jsonError(500, 'auth_update_failed', 'Firebase Auth güncellemesi başarısız.');
  }

  // 4b) On disable, revoke refresh tokens so LIVE sessions die: Firebase rules
  //     reject any ID token whose `auth_time` predates the revocation, and the
  //     client can no longer refresh. (Not needed on enable.)
  if (isDisabling) {
    try {
      await adminAuth.revokeRefreshTokens(targetUid);
    } catch (err) {
      // Auth `disabled:true` already blocks signin/refresh; revoke just makes it
      // immediate. Log and continue — best-effort tightening, not the gate.
      console.warn('[admin/users/disable] revokeRefreshTokens failed', {
        targetUid,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 4c) Mirror onto Firestore `users/{uid}` — drives the client sign-out guard
  //     (`disabled === true`) and the super-admin UI status badge.
  try {
    await db.collection(COLLECTIONS.users).doc(targetUid).set(
      isDisabling
        ? {
            disabled: true,
            disabledAt: FieldValue.serverTimestamp(),
            disabledBy: decoded.uid,
            status: 'Askıda',
          }
        : {
            disabled: false,
            disabledAt: FieldValue.delete(),
            disabledBy: FieldValue.delete(),
            status: 'Aktif',
          },
      { merge: true }
    );
  } catch (err) {
    // Auth state already flipped (signin blocked/restored). The Firestore flag
    // is best-effort: on disable it drives the client guard, but Auth disable +
    // revoke are the authoritative gate.
    console.warn('[admin/users/disable] firestore flag failed', {
      targetUid,
      action,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  // 5) Audit log (best-effort).
  try {
    await db.collection('adminAuditLogs').add({
      action: isDisabling ? 'user.disable' : 'user.enable',
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

  return NextResponse.json({ ok: true, uid: targetUid, disabled: isDisabling });
}
