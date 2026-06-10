/**
 * POST /api/ngo-admin/messaging/send
 *
 * STK admin'i toplu SMS veya mail gönderir. Kota (ngoMessagingWallets.smsUsed/
 * mailUsed) atomik olarak artırılır; kalan kotadan fazlası gönderilemez. Gerçek
 * sağlayıcı (Netgsm/Twilio/SendGrid) henüz bağlı değilse mesaj "kuyruğa alındı"
 * sayılır ve kota yine de düşülür (kullanım kaydı); sağlayıcı bağlanınca dispatch
 * eklenir. Gönderim audit'i messagingTransactions'a yazılır.
 *
 * Yetki: çağıran kullanıcı users/{uid}.managedNgoId == body.ngoId olmalı (veya super-admin).
 * Body: { ngoId, channel: 'sms'|'mail', recipients: string[], message: string, subject?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeQuota, quotaRemaining } from '@/lib/messaging-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(req: NextRequest, ngoId: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string } | undefined;
    if (d?.role === 'super-admin') return true;
    return d?.managedNgoId === ngoId || d?.managedBrandId === ngoId || d?.managedClubId === ngoId;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  let body: { ngoId?: string; channel?: string; recipients?: unknown; message?: string; subject?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const ngoId = typeof body.ngoId === 'string' ? body.ngoId : '';
  const channel = body.channel === 'sms' ? 'sms' : body.channel === 'mail' ? 'mail' : '';
  const recipients = Array.isArray(body.recipients) ? body.recipients.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!ngoId || !channel || recipients.length === 0 || !message) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId, channel, recipients ve message gerekli.' }, { status: 400 });
  }
  if (!(await authorize(req, ngoId))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kurum için yetkiniz yok.' }, { status: 403 });
  }

  const count = recipients.length;
  const db = getAdminFirestore();
  const walletRef = db.collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId);

  // Kotayı atomik düş — yetersizse reddet.
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(walletRef);
    const q = normalizeQuota(snap.data() as never);
    const rem = quotaRemaining(q);
    const remaining = channel === 'sms' ? rem.sms : rem.mail;
    if (count > remaining) {
      return { error: `Yetersiz kota. Kalan ${channel === 'sms' ? 'SMS' : 'mail'}: ${remaining}, gerekli: ${count}.` };
    }
    tx.set(walletRef, {
      ngoId,
      [channel === 'sms' ? 'smsUsed' : 'mailUsed']: FieldValue.increment(count),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true, remainingAfter: remaining - count };
  });

  if ('error' in result) {
    return NextResponse.json({ errorCode: 'INSUFFICIENT_QUOTA', message: result.error }, { status: 409 });
  }

  // Audit kaydı (gerçek sağlayıcı dispatch'i bağlanınca burada tetiklenecek).
  try {
    await db.collection(COLLECTIONS.messagingTransactions).add({
      ngoId, type: 'unit-send', channel, count,
      subject: typeof body.subject === 'string' ? body.subject.slice(0, 200) : null,
      // Gerçek gönderim henüz bağlı değil → 'queued'. Sağlayıcı eklenince 'sent'.
      dispatchStatus: 'queued',
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch { /* audit best-effort */ }

  return NextResponse.json({ ok: true, sent: count, remaining: (result as { remainingAfter: number }).remainingAfter, dispatch: 'queued' });
}
