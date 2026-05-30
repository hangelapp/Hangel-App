/**
 * NFC etiket sil / detay — Faz 2.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

async function verifyNgoAdmin(req: NextRequest): Promise<{ uid: string; ngoId: string } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 }) };
  }
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
  } catch {
    return { error: NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 }) };
  }
  const userDoc = await getAdminFirestore().collection(COLLECTIONS.users).doc(uid).get();
  const ngoId = (userDoc.data()?.managedNgoId as string | undefined) ?? null;
  if (!ngoId) {
    return { error: NextResponse.json({ errorCode: 'NOT_NGO_ADMIN' }, { status: 403 }) };
  }
  return { uid, ngoId };
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const auth = await verifyNgoAdmin(req);
  if ('error' in auth) return auth.error;

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.nfcTags).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND' }, { status: 404 });
  if (snap.data()?.ownerNgoId !== auth.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN' }, { status: 403 });
  }
  await ref.delete();
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const auth = await verifyNgoAdmin(req);
  if ('error' in auth) return auth.error;

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.nfcTags).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND' }, { status: 404 });
  if (snap.data()?.ownerNgoId !== auth.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN' }, { status: 403 });
  }

  // PATCH şu an sadece "writtenAt" güncellemesi için (etiket fiziksel olarak
  // yazıldığında işaretlenir). İlerideki alanlar burada eklenebilir.
  await ref.update({
    writtenAt: FieldValue.serverTimestamp(),
    writtenBy: auth.uid,
  });
  return NextResponse.json({ ok: true });
}
