/**
 * BUG-19 — Auth ↔ Firestore users sync.
 *
 * Lists all Firebase Auth users and compares with Firestore `users` collection.
 * For each Auth user without a Firestore doc, creates a minimal record
 * (email, displayName, createdAt) so /super-admin/users sees them.
 *
 * Returns: { authCount, firestoreCount, missingCount, created, errors }
 *
 * Charter: claim-only super-admin, rate-limited, structured errors.
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

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    bucket: 'admin-users-sync',
    key: ip,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return jsonError(429, 'rate_limited', 'Çok fazla istek. Lütfen biraz bekleyin.');
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return jsonError(401, 'missing_token', 'Yetkilendirme tokenı eksik.');

  let decoded: { uid: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return jsonError(401, 'invalid_token', 'Geçersiz veya süresi dolmuş token.');
  }
  if (decoded.role !== 'super-admin') {
    return jsonError(403, 'forbidden', 'Bu işlem için super-admin yetkisi gerekli.');
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    // 1) List all Auth users (paginated, 1000 per page)
    const authUsers: { uid: string; email?: string; displayName?: string; creationTime: string }[] = [];
    let pageToken: string | undefined;
    do {
      const page = await adminAuth.listUsers(1000, pageToken);
      for (const u of page.users) {
        authUsers.push({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          creationTime: u.metadata.creationTime,
        });
      }
      pageToken = page.pageToken;
    } while (pageToken);

    // 2) List Firestore users
    const firestoreSnap = await adminDb.collection(COLLECTIONS.users).select().get();
    const firestoreUids = new Set(firestoreSnap.docs.map(d => d.id));

    // 3) Compute missing
    const missing = authUsers.filter(u => !firestoreUids.has(u.uid));

    // 4) Create minimal docs for missing
    const created: string[] = [];
    const errors: { uid: string; message: string }[] = [];
    for (const u of missing) {
      try {
        const payload: Record<string, unknown> = {
          id: u.uid,
          avatarUrl: '',
          stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
          backfilledFromAuth: true,
          createdAt: u.creationTime ? new Date(u.creationTime) : FieldValue.serverTimestamp(),
        };
        if (u.email) payload.personalInfo = { email: u.email };
        if (u.displayName) payload.name = u.displayName;
        await adminDb.collection(COLLECTIONS.users).doc(u.uid).set(payload, { merge: true });
        created.push(u.uid);
      } catch (e) {
        // CLAUDE.md kuralı: raw error.message istemciye sızdırılmaz; sadece uid + generic code.
        console.error('[sync-firestore] backfill failed', { uid: u.uid, error: e });
        errors.push({ uid: u.uid, message: 'backfill_failed' });
      }
    }

    return NextResponse.json({
      authCount: authUsers.length,
      firestoreCount: firestoreUids.size,
      missingCount: missing.length,
      created: created.length,
      errors,
    });
  } catch (e) {
    console.error('[sync-firestore] internal failure', e);
    return jsonError(500, 'server_error', 'Sunucu hatası.');
  }
}
