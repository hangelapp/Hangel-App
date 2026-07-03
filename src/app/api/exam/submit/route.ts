/**
 * POST /api/exam/submit — Sınavı gönderir, SUNUCUDA puanlar (katılımcı).
 * Body: { id, attemptId, answers: { [qid]: optionIndex } }.
 *
 * Geçerse (>= passPct) sonucu 'passed' işaretler, sertifikayı verir (+konfeti+bildirim).
 * Kalırsa kalan deneme ile tekrar denenebilir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { issueEventCertificate } from '@/lib/issue-certificate';
import { notifyUser } from '@/lib/notify-user';
import { COLLECTIONS } from '@/firebase/collections';
import { examKey, type ExamConfig } from '@/lib/exam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });
  }

  let body: { id?: string; attemptId?: string; answers?: Record<string, number> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const id = String(body.id || '');
  const attemptId = String(body.attemptId || '');
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  if (!id || !attemptId) return NextResponse.json({ error: 'id ve attemptId gerekli.' }, { status: 400 });

  const db = getAdminFirestore();
  const key = examKey(id);
  const cfg = (await db.collection('examConfigs').doc(key).get()).data() as ExamConfig | undefined;
  if (!cfg) return NextResponse.json({ error: 'Sınav yok.' }, { status: 404 });

  const attemptRef = db.collection('examConfigs').doc(key).collection('attempts').doc(attemptId);
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) return NextResponse.json({ error: 'Deneme bulunamadı.' }, { status: 404 });
  const attempt = attemptSnap.data() as { uid: string; attemptNo: number; submitted?: boolean; presented?: { qid: string; correctShuffledIndex: number }[] };
  if (attempt.uid !== uid) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  if (attempt.submitted) return NextResponse.json({ error: 'Bu deneme zaten gönderildi.' }, { status: 409 });

  const presented = attempt.presented || [];
  const total = presented.length || 1;
  let correct = 0;
  for (const p of presented) {
    if (Math.round(Number(answers[p.qid])) === p.correctShuffledIndex) correct += 1;
  }
  const scorePct = Math.round((correct / total) * 100);
  const passed = scorePct >= cfg.passPct;

  await attemptRef.set({ submitted: true, submittedAt: FieldValue.serverTimestamp(), scorePct, correctCount: correct }, { merge: true });

  const resultRef = db.collection('examConfigs').doc(key).collection('results').doc(uid);
  const prev = (await resultRef.get()).data() as { bestScorePct?: number; passed?: boolean; name?: string } | undefined;
  await resultRef.set(
    {
      uid,
      attemptCount: attempt.attemptNo,
      lastScorePct: scorePct,
      bestScorePct: Math.max(prev?.bestScorePct ?? 0, scorePct),
      passed: !!prev?.passed || passed,
      lastSubmittedAt: FieldValue.serverTimestamp(),
      ...(passed && !prev?.passed ? { passedAt: FieldValue.serverTimestamp() } : {}),
    },
    { merge: true },
  );

  let certIssued = false;
  if (passed && !prev?.passed) {
    const r = await issueEventCertificate(db, { eventId: id, uid, issuedBy: cfg.ngoId || 'exam-system' });
    certIssued = r.issued;
    // Konfeti sinyali + sertifika bildirimi.
    await db.collection(COLLECTIONS.users).doc(uid).collection('celebrations').doc().set({
      type: 'exam', title: 'Sınavı geçtin! 🎓', message: `${cfg.title || 'Etkinlik'} — %${scorePct}`, createdAt: FieldValue.serverTimestamp(),
    }).catch(() => undefined);
    void notifyUser({
      userId: uid,
      type: 'certificate_ready',
      title: 'Sınavı geçtin — sertifikan hazır 🎓',
      body: `${cfg.title || 'Etkinlik'} sınavını %${scorePct} ile geçtin. Sertifikan profiline eklendi.`,
      link: '/my-badges',
      data: { eventId: id, kind: 'exam-pass', scorePct },
      sender: { id: cfg.ngoId || '', name: cfg.ngoName || 'hangel', avatarUrl: cfg.ngoLogoUrl },
    });
  }

  const attemptsLeft = Math.max(0, cfg.attempts - attempt.attemptNo);
  return NextResponse.json({ ok: true, passed, scorePct, correctCount: correct, total, attemptsLeft, certIssued, passPct: cfg.passPct });
}
