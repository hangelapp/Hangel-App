/**
 * POST /api/rewards/evaluate — Katılımcı etkinliği + konuşmacıları değerlendirir.
 * Body: { eventId, answers:number[], comment?, speakerRatings?: {[idx]: 1-5} }.
 *
 * eventEvaluations/{uid} (5 soru + yorum) + speakerRatings/{uid} yazar. İLK kez
 * değerlendirene +20 puan (areaPoints) verir → rozet/leaderboard'a işler.
 * evalPrompt sinyalini kapatır (popart bir daha açılmaz).
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { awardBadgesForUser, resolveBadgeArea } from '@/lib/award-badges';
import { fetchName } from '@/lib/rewards-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVAL_POINTS = 20;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });
  }

  let body: { eventId?: string; kind?: string; id?: string; answers?: number[]; comment?: string; speakerRatings?: Record<string, number> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }

  // Gönüllülük değerlendirmesi (yıldız + yorum) → volunteering/{id}/evaluations/{uid}.
  if (body.kind === 'volunteering') {
    const volId = String(body.id || '');
    if (!volId) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
    const vAnswers = Array.isArray(body.answers) ? body.answers.map((n) => Math.max(0, Math.min(5, Math.round(Number(n) || 0)))) : [];
    const vRated = vAnswers.filter((a) => a >= 1);
    if (vRated.length === 0) return NextResponse.json({ error: 'En az bir soruyu puanla.' }, { status: 400 });
    const vComment = String(body.comment || '').trim().slice(0, 1000);
    const db = getAdminFirestore();
    const name = await fetchName(uid);
    const avg = Math.round((vRated.reduce((a, b) => a + b, 0) / vRated.length) * 10) / 10;
    await db.collection(COLLECTIONS.volunteering).doc(volId).collection('evaluations').doc(uid)
      .set({ uid, name, answers: vAnswers, rating: avg, comment: vComment, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await db.collection(COLLECTIONS.users).doc(uid).collection('evalPrompt').doc('current').set({ active: false }, { merge: true }).catch(() => undefined);
    return NextResponse.json({ ok: true, awarded: false });
  }

  const eventId = String(body.eventId || '');
  if (!eventId) return NextResponse.json({ error: 'eventId gerekli.' }, { status: 400 });

  const answers = Array.isArray(body.answers) ? body.answers.map((n) => Math.max(0, Math.min(5, Math.round(Number(n) || 0)))) : [];
  const rated = answers.filter((a) => a >= 1);
  if (rated.length === 0) return NextResponse.json({ error: 'En az bir soruyu puanla.' }, { status: 400 });
  const comment = String(body.comment || '').trim().slice(0, 1000);

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const evSnap = await eventRef.get();
  if (!evSnap.exists) return NextResponse.json({ error: 'Etkinlik yok.' }, { status: 404 });
  const ev = evSnap.data() as { category?: string };

  // Katılım kontrolü (rsvp going veya check-in).
  const [rsvpSnap, checkinSnap] = await Promise.all([
    eventRef.collection(COLLECTIONS.eventRsvps).doc(uid).get(),
    eventRef.collection(COLLECTIONS.eventCheckins).doc(uid).get(),
  ]);
  const attended = (rsvpSnap.exists && (rsvpSnap.data() as { status?: string }).status === 'going') || checkinSnap.exists;
  if (!attended) return NextResponse.json({ error: 'Bu etkinliğe katılımın bulunamadı.' }, { status: 403 });

  const name = await fetchName(uid);
  const evalRef = eventRef.collection('eventEvaluations').doc(uid);
  const firstTime = !(await evalRef.get()).exists;
  const avg = Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10;

  await evalRef.set({ uid, name, answers, rating: avg, comment, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  // Konuşmacı/sanatçı puanları.
  const sr = body.speakerRatings && typeof body.speakerRatings === 'object' ? body.speakerRatings : null;
  if (sr) {
    const ratings: Record<string, number> = {};
    for (const [k, v] of Object.entries(sr)) {
      const n = Math.max(1, Math.min(5, Math.round(Number(v) || 0)));
      if (n >= 1) ratings[k] = n;
    }
    if (Object.keys(ratings).length) {
      await eventRef.collection('speakerRatings').doc(uid).set({ uid, ratings, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  }

  // İlk kez değerlendirene +20 puan → rozet/leaderboard'a işlensin.
  let awarded = false;
  if (firstTime) {
    const area = resolveBadgeArea(ev.category) || 'hangel Gönüllüsü';
    await db.collection(COLLECTIONS.users).doc(uid).set({ areaPoints: { [area]: FieldValue.increment(EVAL_POINTS) } }, { merge: true });
    await awardBadgesForUser(db, uid, { notify: true });
    awarded = true;
  }

  // Popart'ı kapat.
  await db.collection(COLLECTIONS.users).doc(uid).collection('evalPrompt').doc('current').set({ active: false }, { merge: true }).catch(() => undefined);

  return NextResponse.json({ ok: true, awarded, points: awarded ? EVAL_POINTS : 0 });
}
