/**
 * POST /api/exam/start — Sınav denemesini başlatır (katılımcı).
 * Body: { id }.  (id = eventId)
 *
 * Katılım + açık + deneme hakkı kontrolü. Sorular + şıklar KARIŞIK sırada döner
 * (doğru cevap YOK). Karışık doğru-index'ler attempt doc'unda (private) saklanır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { fetchName } from '@/lib/rewards-server';
import { COLLECTIONS } from '@/firebase/collections';
import { examKey, type ExamConfig, type ExamPresentedQuestion } from '@/lib/exam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function isAttendee(db: FirebaseFirestore.Firestore, eventId: string, uid: string): Promise<boolean> {
  const ref = db.collection(COLLECTIONS.events).doc(eventId);
  const [r, c] = await Promise.all([ref.collection('rsvps').doc(uid).get(), ref.collection('checkins').doc(uid).get()]);
  return (r.exists && (r.data() as { status?: string }).status === 'going') || c.exists;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });

  const db = getAdminFirestore();
  const key = examKey(id);
  const cfgSnap = await db.collection('examConfigs').doc(key).get();
  if (!cfgSnap.exists) return NextResponse.json({ error: 'Sınav yok.' }, { status: 404 });
  const cfg = cfgSnap.data() as ExamConfig;
  if (!cfg.enabled || !(cfg.questions?.length)) return NextResponse.json({ error: 'Sınav tanımlı değil.' }, { status: 400 });
  if (!cfg.open) return NextResponse.json({ error: 'Sınav henüz açık değil.' }, { status: 409 });

  if (!(await isAttendee(db, id, uid))) {
    return NextResponse.json({ error: 'Bu etkinliğe katılımın bulunamadı.' }, { status: 403 });
  }

  const resultRef = db.collection('examConfigs').doc(key).collection('results').doc(uid);
  const result = (await resultRef.get()).data() as { passed?: boolean; attemptCount?: number } | undefined;
  if (result?.passed) return NextResponse.json({ error: 'Bu sınavı zaten geçtin. 🎓' }, { status: 409 });
  const usedAttempts = result?.attemptCount || 0;
  if (usedAttempts >= cfg.attempts) return NextResponse.json({ error: 'Deneme hakkın doldu.' }, { status: 409 });

  // Soru sırasını + şık sırasını karıştır.
  const orderedQs = shuffle(cfg.questions);
  const total = orderedQs.length;
  const presentedClient: ExamPresentedQuestion[] = [];
  const presentedStore: { qid: string; correctShuffledIndex: number }[] = [];
  orderedQs.forEach((q, i) => {
    const perm = shuffle(q.options.map((_, oi) => oi)); // perm[newPos] = oldIndex
    const options = perm.map((oi) => q.options[oi]);
    presentedClient.push({ qid: q.id, text: q.text, options, timeLimitSec: q.timeLimitSec, index: i + 1, total });
    presentedStore.push({ qid: q.id, correctShuffledIndex: perm.indexOf(q.correctIndex) });
  });

  const attemptNo = usedAttempts + 1;
  const attemptId = `${uid}__${attemptNo}`;
  await db.collection('examConfigs').doc(key).collection('attempts').doc(attemptId).set({
    uid,
    name: await fetchName(uid),
    attemptNo,
    startedAt: FieldValue.serverTimestamp(),
    presented: presentedStore,
    submitted: false,
  });

  return NextResponse.json({ ok: true, attemptId, attemptNo, passPct: cfg.passPct, total, questions: presentedClient });
}
