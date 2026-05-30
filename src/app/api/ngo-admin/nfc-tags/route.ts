/**
 * NFC etiket yönetimi (STK admin paneli) — Faz 2.
 *
 * STK admin'leri etkinlik girişine, bağış masasına veya görev doğrulamasına
 * konulacak NFC etiketleri tanımlar. Etiketin URL'i Universal Link formatında
 * (`https://hangel.org.tr/...`) üretilir; iPhone NFC okuduğunda doğrudan app
 * açılır (Faz 0 AASA).
 *
 * Tag tipleri ve hedef URL'leri:
 *  - event-checkin → https://hangel.org.tr/checkin/{eventId}
 *  - donate        → https://hangel.org.tr/donate/{ngoId}
 *  - task-verify   → https://hangel.org.tr/task/{taskId}/verify
 *
 * Etiketin fiziksel yazımı user tarafında (NFC writer app veya HangelNfcPlugin
 * üzerinden). Bu endpoint sadece "tag tanımını" oluşturur/listeler/siler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org.tr';

const PostBodySchema = z.object({
  type: z.enum(['event-checkin', 'donate', 'task-verify']),
  referenceId: z.string().min(1).max(128),
  label: z.string().min(1).max(80).optional(),
});

async function verifyNgoAdmin(req: NextRequest): Promise<{ uid: string; ngoId: string } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ errorCode: 'NO_AUTH', message: 'Authorization gerekli.' }, { status: 401 }) };
  }
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
  } catch {
    return { error: NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 }) };
  }
  const userDoc = await getAdminFirestore().collection(COLLECTIONS.users).doc(uid).get();
  const ngoId = (userDoc.data()?.managedNgoId as string | undefined) ?? null;
  if (!ngoId) {
    return { error: NextResponse.json({ errorCode: 'NOT_NGO_ADMIN', message: 'STK yöneticisi değilsiniz.' }, { status: 403 }) };
  }
  return { uid, ngoId };
}

function urlFor(type: 'event-checkin' | 'donate' | 'task-verify', referenceId: string): string {
  switch (type) {
    case 'event-checkin': return `${PUBLIC_ORIGIN}/checkin/${encodeURIComponent(referenceId)}`;
    case 'donate':        return `${PUBLIC_ORIGIN}/donate/${encodeURIComponent(referenceId)}`;
    case 'task-verify':   return `${PUBLIC_ORIGIN}/task/${encodeURIComponent(referenceId)}/verify`;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await verifyNgoAdmin(req);
  if ('error' in auth) return auth.error;

  let body: z.infer<typeof PostBodySchema>;
  try {
    body = PostBodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTIONS.nfcTags).doc();
  await docRef.set({
    ownerNgoId: auth.ngoId,
    createdBy: auth.uid,
    type: body.type,
    referenceId: body.referenceId,
    label: body.label ?? null,
    url: urlFor(body.type, body.referenceId),
    createdAt: FieldValue.serverTimestamp(),
    writtenAt: null,
    writtenBy: null,
  });

  return NextResponse.json({ ok: true, id: docRef.id, url: urlFor(body.type, body.referenceId) });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await verifyNgoAdmin(req);
  if ('error' in auth) return auth.error;

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.nfcTags)
    .where('ownerNgoId', '==', auth.ngoId)
    .limit(200)
    .get();

  const tags = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type as string,
      referenceId: data.referenceId as string,
      label: (data.label as string | null) ?? null,
      url: data.url as string,
      writtenAt: data.writtenAt ? (data.writtenAt.toDate?.() ?? null) : null,
    };
  });
  return NextResponse.json({ ok: true, tags });
}
