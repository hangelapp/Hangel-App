/**
 * Pricing config CRUD (super-admin).
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { invalidatePricingCache } from '@/lib/messaging/pricing';
import { logAudit } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.messagingPricing).doc('global').get();
  return NextResponse.json(snap.exists ? snap.data() : null);
}

export async function PUT(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const db = getAdminFirestore();
  await db.collection(COLLECTIONS.messagingPricing).doc('global').set(
    {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );
  invalidatePricingCache();
  await logAudit(actor, 'provider.updated', { notes: 'pricing config' });
  return NextResponse.json({ ok: true });
}
