/**
 * Public unsubscribe endpoint — auth yok, sadece token-bazlı.
 * GET: token bilgisini döndür (kullanıcı kim, hangi kanallar açık)
 * POST: token + channel → ilgili kanalı kapat
 */

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logAudit } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

async function findByToken(token: string) {
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTIONS.userMarketingConsent)
    .where('unsubscribeToken', '==', token)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });

  const doc = await findByToken(token);
  if (!doc) return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş bağlantı' }, { status: 404 });

  const data = doc.data() as { email?: { enabled: boolean }; sms?: { enabled: boolean } };
  return NextResponse.json({
    userId: doc.id,
    email: { enabled: data.email?.enabled ?? false },
    sms: { enabled: data.sms?.enabled ?? false },
  });
}

export async function POST(req: Request) {
  let body: { token?: string; channel?: 'email' | 'sms'; all?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const { token, channel, all } = body;
  if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
  if (!all && channel !== 'email' && channel !== 'sms') {
    return NextResponse.json({ error: 'channel veya all gerekli' }, { status: 400 });
  }

  const doc = await findByToken(token);
  if (!doc) return NextResponse.json({ error: 'Geçersiz bağlantı' }, { status: 404 });

  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    history: FieldValue.arrayUnion({
      at: Timestamp.now(),
      action: 'opt-out',
      channel: all ? 'all' : channel,
      source: 'unsubscribe-link',
    }),
  };

  if (all || channel === 'email') {
    update['email'] = { enabled: false, source: 'unsubscribe', updatedAt: FieldValue.serverTimestamp() };
  }
  if (all || channel === 'sms') {
    update['sms'] = { enabled: false, source: 'unsubscribe', updatedAt: FieldValue.serverTimestamp() };
  }

  await doc.ref.update(update);

  // Audit (actor: anonim — token sahibi user)
  try {
    await logAudit(
      { uid: doc.id, email: null },
      'unsubscribe',
      { channel: all ? 'all' : channel, notes: 'unsubscribe link' }
    );
  } catch (err) {
    console.warn('[unsubscribe] audit log failed', err);
  }

  return NextResponse.json({ ok: true });
}
