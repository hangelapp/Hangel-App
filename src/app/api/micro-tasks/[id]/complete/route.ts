/**
 * Mikro görev tamamlama — Faz 3.
 *
 * Kullanıcı görevi tamamlayıp foto/kanıt yükler. Foto storage URL'i body'de.
 * Verification: opsiyonel (STK admin manuel onaylar) veya otomatik (rozet
 * doğrudan tetiklenir, super-admin moderasyon sonradan).
 *
 * Body:
 * {
 *   proofPhotoUrl?: string,
 *   note?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

const BodySchema = z.object({
  proofPhotoUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: taskId } = await ctx.params;
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 });
  }
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const taskSnap = await db.collection(COLLECTIONS.microTasks).doc(taskId).get();
  if (!taskSnap.exists) return NextResponse.json({ errorCode: 'TASK_NOT_FOUND' }, { status: 404 });
  const task = taskSnap.data() ?? {};
  if (task.active === false) return NextResponse.json({ errorCode: 'TASK_INACTIVE' }, { status: 409 });

  // Aynı kullanıcı aynı görevi 2 kez tamamlayamaz
  const existing = await db.collection(COLLECTIONS.microTaskCompletions)
    .where('uid', '==', uid)
    .where('taskId', '==', taskId)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json({ errorCode: 'ALREADY_COMPLETED' }, { status: 409 });
  }

  await db.collection(COLLECTIONS.microTaskCompletions).add({
    uid,
    taskId,
    proofPhotoUrl: body.proofPhotoUrl ?? null,
    note: body.note ?? null,
    completedAt: FieldValue.serverTimestamp(),
    verifiedAt: null,
    verifiedBy: null,
    points: (task.reward as { points?: number } | undefined)?.points ?? 10,
  });

  // Pasaport cache'ini invalidate et (force=1 ile bir sonraki fetch yeniden hesaplar)
  await db.collection(COLLECTIONS.users).doc(uid).set({
    passportUpdatedAt: null,
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
