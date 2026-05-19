/**
 * Süper admin: pending NGO sender'ları listele + approve/reject.
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin, type SuperAdminContext } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAudit } from '@/lib/messaging/audit';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;

  const db = getAdminFirestore();
  // Collection group ile tüm NGO sender'ları çek
  const snap = await db.collectionGroup('senders').get();
  const senders = snap.docs.map((d) => ({
    id: d.id,
    ngoId: d.ref.parent.parent?.id ?? null,
    ...d.data(),
  }));
  return NextResponse.json({ senders });
}

export async function POST(req: Request) {
  // { ngoId, senderId, action: 'approve' | 'reject', notes? }
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;
  const actor = (auth as { actor: SuperAdminContext }).actor;

  let body: { ngoId?: string; senderId?: string; action?: 'approve' | 'reject'; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.ngoId || !body.senderId || !body.action) {
    return NextResponse.json({ error: 'ngoId, senderId, action gerekli' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.ngoSenders).doc(body.ngoId).collection(COLLECTIONS.senders).doc(body.senderId);
  await ref.update({
    status: body.action === 'approve' ? 'approved' : 'rejected',
    approvedBy: actor.uid,
    approvedAt: FieldValue.serverTimestamp(),
    notes: body.notes ?? null,
  });

  await logAudit(actor, 'provider.updated', {
    notes: `sender ${body.action}: ${body.ngoId}/${body.senderId}`,
  });

  return NextResponse.json({ ok: true });
}
