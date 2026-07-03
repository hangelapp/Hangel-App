/**
 * POST /api/rewards/answer — Katılımcı canlı soruya cevap verir.
 * Body: { kind, id, questionId, optionIndex }.
 *
 * Adalet: doğruluk SUNUCUDA hesaplanır (correctIndex asla client'a gitmez);
 * cevap serverTimestamp ile damgalanır; kullanıcı tek kez cevaplar (transaction).
 * 'first' kuralında doğru cevaplar kazanan slotunu atomik olarak kapar.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { isEligibleUser, fetchName } from '@/lib/rewards-server';
import { COLLECTIONS } from '@/firebase/collections';
import { rewardKey, type RewardConfig, type RewardKind } from '@/lib/rewards';

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

  let body: { kind?: RewardKind; id?: string; questionId?: string; optionIndex?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const kind = body.kind === 'event' || body.kind === 'volunteering' ? body.kind : null;
  const id = String(body.id || '');
  const questionId = String(body.questionId || '');
  const optionIndex = Math.round(Number(body.optionIndex));
  if (!kind || !id || !questionId || !Number.isFinite(optionIndex)) {
    return NextResponse.json({ error: 'Eksik/geçersiz veri.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const key = rewardKey(kind, id);
  const cfgSnap = await db.collection('rewardConfigs').doc(key).get();
  if (!cfgSnap.exists) return NextResponse.json({ error: 'Yapılandırma yok.' }, { status: 404 });
  const cfg = cfgSnap.data() as RewardConfig & { activeQuestionId?: string; activeDeadlineMs?: number };
  if (cfg.activeQuestionId !== questionId) {
    return NextResponse.json({ error: 'Bu soru artık aktif değil.' }, { status: 409 });
  }
  if (typeof cfg.activeDeadlineMs === 'number' && Date.now() > cfg.activeDeadlineMs) {
    return NextResponse.json({ error: 'Süre doldu.' }, { status: 409 });
  }

  const q = (cfg.quiz?.questions || []).find((x) => x.id === questionId);
  if (!q) return NextResponse.json({ error: 'Soru yok.' }, { status: 404 });

  // Uygunluk.
  const requireCheckin = !!q.checkinOnly || !cfg.isOnline;
  if (!(await isEligibleUser(kind, id, uid, requireCheckin))) {
    return NextResponse.json({ error: requireCheckin ? 'Yalnız check-in yapanlar cevaplayabilir.' : 'Katılımın bulunamadı.' }, { status: 403 });
  }

  const name = await fetchName(uid);
  const answerRef = db.collection('rewardConfigs').doc(key).collection('answers').doc(`${questionId}__${uid}`);
  const qstateRef = db.collection('rewardConfigs').doc(key).collection('qstate').doc(questionId);

  let correct = false;
  let isWinner = false;
  try {
    await db.runTransaction(async (tx) => {
      const [aSnap, qSnap] = await Promise.all([tx.get(answerRef), tx.get(qstateRef)]);
      if (aSnap.exists) throw new Error('ALREADY_ANSWERED');
      const qs = (qSnap.data() ?? {}) as { correctIndex?: number; rule?: string; winnerCount?: number; winners?: string[]; revealed?: boolean };
      if (qs.revealed) throw new Error('CLOSED');
      correct = optionIndex === qs.correctIndex;
      tx.set(answerRef, { uid, name, questionId, optionIndex, correct, answeredAt: FieldValue.serverTimestamp() });
      // 'first' kuralı: doğruysa ve slot varsa kazananı atomik kap.
      if (correct && qs.rule === 'first') {
        const winners = Array.isArray(qs.winners) ? qs.winners : [];
        if (!winners.includes(uid) && winners.length < (qs.winnerCount || 1)) {
          tx.update(qstateRef, { winners: FieldValue.arrayUnion(uid) });
          isWinner = true;
        }
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'ALREADY_ANSWERED') return NextResponse.json({ error: 'Zaten cevapladın.' }, { status: 409 });
    if (msg === 'CLOSED') return NextResponse.json({ error: 'Soru kapandı.' }, { status: 409 });
    console.error('rewards/answer tx error', e);
    return NextResponse.json({ error: 'Cevap kaydedilemedi.' }, { status: 500 });
  }

  // Sinyali güncelle (overlay "cevabın alındı" göstersin).
  await db.collection(COLLECTIONS.users).doc(uid).collection('liveQuizSignal').doc('current')
    .set({ answered: true, myOptionIndex: optionIndex }, { merge: true })
    .catch(() => undefined);

  return NextResponse.json({ ok: true, correct, isWinner });
}
