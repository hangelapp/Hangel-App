/**
 * POST /api/rewards/reveal — Canlı soruyu bitirir, sonucu açar (yalnız organizatör).
 * Body: { kind, id, questionId }.
 *
 * - Kazananları belirler ('first' → önceden kapılan slotlar; 'raffle' → doğrular
 *   arasından kripto rastgele N).
 * - Doğru cevaplayan HERKESE konfeti sinyali (aynı anda patlar).
 * - Kazananlara kurumdan yanıtlanabilir DM + public winners kaydı.
 * - Katılımcı sinyallerini "revealed + correctIndex" ile günceller (overlay sonucu gösterir).
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer, getEligibleParticipants } from '@/lib/rewards-server';
import { notifyUser } from '@/lib/notify-user';
import { COLLECTIONS } from '@/firebase/collections';
import { rewardKey, type RewardConfig, type RewardKind } from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickN<T>(pool: T[], n: number): T[] {
  const a = [...pool];
  const out: T[] = [];
  const k = Math.min(Math.max(0, n), a.length);
  for (let i = 0; i < k; i++) out.push(a.splice(randomInt(a.length), 1)[0]);
  return out;
}

export async function POST(req: NextRequest) {
  let body: { kind?: RewardKind; id?: string; questionId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const kind = body.kind === 'event' || body.kind === 'volunteering' ? body.kind : null;
  const id = String(body.id || '');
  const questionId = String(body.questionId || '');
  if (!kind || !id || !questionId) return NextResponse.json({ error: 'kind, id, questionId gerekli.' }, { status: 400 });

  const { ctx, error } = await resolveOrganizer(req, kind, id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const db = getAdminFirestore();
  const key = rewardKey(kind, id);
  const cfgSnap = await db.collection('rewardConfigs').doc(key).get();
  if (!cfgSnap.exists) return NextResponse.json({ error: 'Yapılandırma yok.' }, { status: 404 });
  const cfg = cfgSnap.data() as RewardConfig;
  const q = (cfg.quiz?.questions || []).find((x) => x.id === questionId);
  if (!q) return NextResponse.json({ error: 'Soru yok.' }, { status: 404 });

  const qstateRef = db.collection('rewardConfigs').doc(key).collection('qstate').doc(questionId);
  const qstate = (await qstateRef.get()).data() as { winners?: string[]; correctIndex?: number } | undefined;
  const correctIndex = qstate?.correctIndex ?? q.correctIndex;

  // Cevapları oku (bu soru için).
  const ansSnap = await db.collection('rewardConfigs').doc(key).collection('answers').where('questionId', '==', questionId).get();
  const counts = new Array(q.options.length).fill(0) as number[];
  const correctAnswerers: { uid: string; name: string }[] = [];
  for (const d of ansSnap.docs) {
    const a = d.data() as { uid: string; name?: string; optionIndex?: number; correct?: boolean };
    if (typeof a.optionIndex === 'number' && a.optionIndex >= 0 && a.optionIndex < counts.length) counts[a.optionIndex] += 1;
    if (a.correct) correctAnswerers.push({ uid: a.uid, name: a.name || 'hangel gönüllüsü' });
  }

  // Kazananlar.
  let winnerUids: string[];
  if (q.winnerRule === 'raffle') {
    winnerUids = pickN(correctAnswerers, q.winnerCount || 1).map((w) => w.uid);
  } else {
    winnerUids = (qstate?.winners || []).slice(0, q.winnerCount || 1);
  }
  const nameByUid = new Map(correctAnswerers.map((w) => [w.uid, w.name]));
  const winners = winnerUids.map((uid) => ({ uid, name: nameByUid.get(uid) || 'hangel gönüllüsü' }));

  // Yazımlar: public winners + konfeti (doğru cevaplayan HERKES) + sinyal reveal.
  const winnerSet = new Set(winnerUids);
  for (let i = 0; i < correctAnswerers.length; i += 300) {
    const batch = db.batch();
    for (const w of correctAnswerers.slice(i, i + 300)) {
      const cref = db.collection(COLLECTIONS.users).doc(w.uid).collection('celebrations').doc();
      batch.set(cref, {
        type: 'quiz',
        title: winnerSet.has(w.uid) ? 'Kazandın! 🏆' : 'Doğru cevap! 🎉',
        message: winnerSet.has(w.uid) && q.prizeName ? `${q.prizeName} — ${ctx!.title}` : `${ctx!.title}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  // Public winners.
  if (winners.length) {
    const batch = db.batch();
    for (const w of winners) {
      const wref = db.collection('eventRewards').doc(key).collection('winners').doc();
      batch.set(wref, { source: 'quiz', uid: w.uid, name: w.name.split(' ')[0], prizeName: q.prizeName || 'Ödül', wonAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
  }

  // Sinyalleri reveal ile güncelle (uygun katılımcılar) → overlay doğru cevabı gösterir.
  const requireCheckin = !!q.checkinOnly || !cfg.isOnline;
  const eligible = (await getEligibleParticipants(kind, id, { requireCheckin })).filter((p) => p.uid !== ctx!.uid);
  for (let i = 0; i < eligible.length; i += 400) {
    const batch = db.batch();
    for (const p of eligible.slice(i, i + 400)) {
      batch.set(
        db.collection(COLLECTIONS.users).doc(p.uid).collection('liveQuizSignal').doc('current'),
        { revealed: true, correctIndex, won: winnerSet.has(p.uid), active: true },
        { merge: true },
      );
    }
    await batch.commit();
  }

  // Aktif soruyu kapat.
  await db.collection('rewardConfigs').doc(key).set({ activeQuestionId: null }, { merge: true });
  await qstateRef.set({ revealed: true }, { merge: true });

  // Kazananlara kurumdan yanıtlanabilir DM (ödül varsa).
  if (q.prizeName && winners.length) {
    void Promise.allSettled(
      winners.map((w) =>
        notifyUser({
          userId: w.uid,
          type: 'reward_win',
          title: `Tebrikler! ${q.prizeName} kazandın 🏆`,
          body: `"${ctx!.title}" soru-yarışmasında ${q.prizeName} kazandın. Ödülünü iletebilmemiz için bu mesajı yanıtlayıp adres/iletişim bilgini paylaş.`,
          link: '/messages',
          data: { rewardKey: key, questionId, prizeName: q.prizeName },
          sender: { id: ctx!.organizerId, name: ctx!.ngoName, avatarUrl: ctx!.ngoLogoUrl },
          storeAsMessage: true,
          messageSubject: `🏆 ${q.prizeName} — Ödül Teslimi`,
          messageContent: `Tebrikler! "${ctx!.title}" soru-yarışmasında ${q.prizeName} kazandın.\n\nÖdülünü ulaştırabilmemiz için bu mesajı yanıtlayıp ad-soyad, telefon ve adres bilgini paylaşır mısın? 🧡`,
        }),
      ),
    );
  }

  return NextResponse.json({ ok: true, counts, correctIndex, total: ansSnap.size, correctCount: correctAnswerers.length, winners });
}
