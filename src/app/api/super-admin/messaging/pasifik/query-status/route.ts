/**
 * POST /api/super-admin/messaging/pasifik/query-status
 *
 * Body: { providerMessageIds: string[] }
 *
 * Pasifik'in webhook'u olmadığı için durum bilgisi polling ile alınır.
 * Her id için /sms/query/multi/id endpoint'i çağrılır; sonuçlar
 * deliveryEvents koleksiyonuna yazılır (aynı id+type kombinasyonu varsa skip).
 *
 * Yanıt: { processed, delivered, failed, pending }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { PasifikSmsProvider } from '@/lib/messaging/providers/sms/pasifik';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { providerMessageIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const ids = Array.isArray(body.providerMessageIds)
    ? body.providerMessageIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  if (ids.length === 0) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'providerMessageIds boş olamaz.' },
      { status: 400 },
    );
  }

  const username = process.env.PASIFIK_USERNAME;
  const password = process.env.PASIFIK_PASSWORD;
  const from = process.env.PASIFIK_FROM;
  if (!username || !password || !from) {
    return NextResponse.json(
      { errorCode: 'CONFIG_MISSING', message: 'PASIFIK_USERNAME / PASIFIK_PASSWORD / PASIFIK_FROM tanımlı değil.' },
      { status: 500 },
    );
  }

  const provider = new PasifikSmsProvider({ username, password, from });
  const db = getAdminFirestore();
  const eventsCol = db.collection(COLLECTIONS.deliveryEvents);

  let delivered = 0;
  let failed = 0;
  let pending = 0;

  try {
    for (const id of ids) {
      const result = await provider.queryStatus(id);
      if (!result) {
        pending += 1;
        continue;
      }

      const type: 'delivered' | 'failed' | 'queued' = result.delivered
        ? 'delivered'
        : result.failed
        ? 'failed'
        : 'queued';

      // Idempotency: aynı providerMessageId + type kombinasyonu zaten varsa atla.
      const existing = await eventsCol
        .where('providerMessageId', '==', id)
        .where('type', '==', type)
        .limit(1)
        .get();
      if (!existing.empty) {
        if (type === 'delivered') delivered += 1;
        else if (type === 'failed') failed += 1;
        else pending += 1;
        continue;
      }

      await eventsCol.add({
        providerMessageId: id,
        type,
        at: FieldValue.serverTimestamp(),
        raw: result.raw ?? null,
      });

      if (type === 'delivered') delivered += 1;
      else if (type === 'failed') failed += 1;
      else pending += 1;
    }

    return NextResponse.json({ processed: ids.length, delivered, failed, pending });
  } catch (err) {
    console.error('[super-admin/messaging/pasifik/query-status] failed', err);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Durum sorgusu başarısız.' }, { status: 500 });
  }
}
