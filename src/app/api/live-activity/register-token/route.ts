/**
 * Live Activity push token kayıt endpoint'i — Faz 1.
 *
 * Native iOS uygulaması (ActivityKit) bir Live Activity başlattığında, APNs
 * push update'leri için bir push token alır (`activity.pushTokenUpdates`).
 * Bu token'ı bu endpoint'e POST edip Firestore'a kaydederiz. Backend Cloud
 * Function (veya scheduled job) ilgili `referenceId` doc'unda update olunca
 * APNs HTTP/2'ye doğrudan POST eder (FCM Live Activity desteklemiyor — Apple
 * `apns-push-type: liveactivity` özel header'ı istiyor).
 *
 * Body schema:
 * {
 *   activityId: string,           // ActivityKit Activity.id
 *   pushToken: string,            // hex-encoded APNs push token
 *   type: 'emergency-blood' | 'volunteer-task' | 'event-countdown' | 'donation-campaign',
 *   referenceId: string,          // emergencyBloodId | taskId | eventId | campaignId
 *   expiresInHours?: number       // default 8
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

const ACTIVITY_TYPES = ['emergency-blood', 'volunteer-task', 'event-countdown', 'donation-campaign'] as const;

const BodySchema = z.object({
  activityId: z.string().min(8).max(128),
  pushToken: z.string().regex(/^[0-9a-f]{32,200}$/i, 'pushToken hex-only'),
  type: z.enum(ACTIVITY_TYPES),
  referenceId: z.string().min(1).max(128),
  expiresInHours: z.number().int().positive().max(72).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH', message: 'Authorization gerekli.' }, { status: 401 });
  }
  const idToken = authHeader.slice('Bearer '.length).trim();

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const expiresAt = new Date(Date.now() + (body.expiresInHours ?? 8) * 60 * 60 * 1000);
  const docId = `${uid}_${body.activityId}`;

  try {
    await db.collection(COLLECTIONS.liveActivityTokens).doc(docId).set({
      uid,
      activityId: body.activityId,
      pushToken: body.pushToken,
      type: body.type,
      referenceId: body.referenceId,
      startedAt: FieldValue.serverTimestamp(),
      expiresAt,
    }, { merge: true });
  } catch (e) {
    return NextResponse.json({
      errorCode: 'WRITE_FAILED',
      message: e instanceof Error ? e.message : 'Yazım başarısız.',
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 });
  }
  const idToken = authHeader.slice('Bearer '.length).trim();

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get('activityId');
  if (!activityId) {
    return NextResponse.json({ errorCode: 'NO_ACTIVITY_ID' }, { status: 400 });
  }

  const db = getAdminFirestore();
  try {
    await db.collection(COLLECTIONS.liveActivityTokens).doc(`${uid}_${activityId}`).delete();
  } catch (e) {
    return NextResponse.json({
      errorCode: 'DELETE_FAILED',
      message: e instanceof Error ? e.message : 'Silme başarısız.',
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
