/**
 * Süper admin: NGO cüzdan listesi + manuel ayarlama.
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { adminAdjust, topup } from '@/lib/messaging/wallet';
import { logAudit, actorFromRequest } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.ngoMessagingWallets).get();
  const wallets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ wallets });
}

export async function POST(req: Request) {
  // Manuel ayarlama: { ngoId, action: 'topup'|'adjust', amount, notes? }
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;
  const { context } = actorFromRequest(req, actor.uid, actor.email);

  let body: { ngoId?: string; action?: 'topup' | 'adjust'; amount?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.ngoId || !body.action || typeof body.amount !== 'number') {
    return NextResponse.json({ error: 'ngoId, action, amount gerekli' }, { status: 400 });
  }

  try {
    if (body.action === 'topup') {
      const result = await topup({
        ngoId: body.ngoId,
        amount: body.amount,
        actorUid: actor.uid,
        notes: body.notes ?? 'manuel top-up',
      });
      await logAudit(actor, 'consent.imported', { notes: `wallet topup ${body.amount} TRY for ${body.ngoId}` }, context);
      return NextResponse.json(result);
    } else {
      const result = await adminAdjust({
        ngoId: body.ngoId,
        delta: body.amount,
        actorUid: actor.uid,
        notes: body.notes,
      });
      await logAudit(actor, 'consent.imported', { notes: `wallet adjust ${body.amount} TRY for ${body.ngoId}` }, context);
      return NextResponse.json(result);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' }, { status: 500 });
  }
}
