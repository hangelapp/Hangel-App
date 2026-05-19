/**
 * NGO admin: kontör paket satın al — N-Kolay payment intent yarat.
 */

import { NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getPaymentProvider } from '@/lib/payment';
import { logAudit, actorFromRequest } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

interface TopupBody {
  packageId: string;
  amount: number;
}

export async function POST(req: Request) {
  const auth = await requireNgoAdmin(req);
  if (auth.error) return auth.error;
  const actor = auth.actor;
  const { context } = actorFromRequest(req, actor.uid, actor.email);

  let body: TopupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.packageId || !body.amount || body.amount <= 0) {
    return NextResponse.json({ error: 'packageId ve amount gerekli' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const packageSnap = await db.collection(COLLECTIONS.messagingPackages).doc(body.packageId).get();
  if (!packageSnap.exists) {
    return NextResponse.json({ error: 'Paket bulunamadı' }, { status: 404 });
  }

  const pkg = packageSnap.data() as { name: string; amount: number; active?: boolean };
  if (pkg.active === false) {
    return NextResponse.json({ error: 'Paket aktif değil' }, { status: 400 });
  }
  // Cross-check: client'tan gelen amount paket fiyatıyla eşleşmeli
  if (Math.abs(pkg.amount - body.amount) > 0.01) {
    return NextResponse.json({ error: 'Tutar paketle eşleşmiyor' }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:9002').replace(/\/$/, '');
  const intent = await provider.createPaymentIntent({
    ngoId: actor.ngoId,
    amount: pkg.amount,
    packageId: body.packageId,
    packageName: pkg.name,
    successUrl: `${base}/ngo-admin/messaging/wallet?status=success`,
    failureUrl: `${base}/ngo-admin/messaging/wallet?status=fail`,
  });

  await db.collection(COLLECTIONS.paymentOrders).doc(intent.orderId).set({
    ngoId: actor.ngoId,
    amount: pkg.amount,
    packageId: body.packageId,
    packageName: pkg.name,
    status: 'pending',
    provider: provider.driver,
    providerOrderId: intent.providerOrderId ?? null,
    paymentLinkUrl: intent.redirectUrl,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
  });

  await logAudit(
    { uid: actor.uid, email: actor.email },
    'consent.imported',
    { notes: `topup intent ${pkg.amount} TRY ${pkg.name}` },
    context
  );

  return NextResponse.json({ orderId: intent.orderId, redirectUrl: intent.redirectUrl });
}
