/**
 * GET/PATCH /api/users/me/intents
 *
 * Kullanıcının welcome flow'unda seçtiği intent'leri oku/güncelle.
 *
 * GET → { intents: string[] }
 * PATCH body { intents: string[] } → günceller (replace).
 *
 * Auth: Bearer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const VALID_INTENTS = [
  'donate', 'volunteer', 'blood', 'follow_csr', 'discover_ngos',
  'emergency', 'student_clubs', 'library', 'browse_only',
] as const;

async function getUid(req: NextRequest): Promise<{ uid: string } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 }) };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    return { uid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 }) };
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await getUid(req);
  if ('error' in auth) return auth.error;

  try {
    const db = getAdminFirestore();
    const snap = await db.collection(COLLECTIONS.users).doc(auth.uid).get();
    const data = snap.data() as { preferences?: { intents?: string[] } } | undefined;
    return NextResponse.json({ ok: true, intents: data?.preferences?.intents ?? [] });
  } catch (e) {
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await getUid(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    const raw = Array.isArray(body?.intents) ? body.intents : null;
    if (!raw) {
      return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'intents array gerekli.' }, { status: 400 });
    }
    // Sadece valid intent key'leri kabul et — kötü niyetli payload'a karşı whitelist
    const intents = raw.filter((i: unknown): i is string => typeof i === 'string' && VALID_INTENTS.includes(i as typeof VALID_INTENTS[number]));
    // browse_only mutex: diğerleriyle birlikte gönderilmişse browse_only'i at
    const final = intents.includes('browse_only') && intents.length > 1
      ? intents.filter((i: string) => i !== 'browse_only')
      : intents;

    const db = getAdminFirestore();
    await db.collection(COLLECTIONS.users).doc(auth.uid).update({
      'preferences.intents': final,
      'preferences.intentsUpdatedAt': FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, intents: final });
  } catch (e) {
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
