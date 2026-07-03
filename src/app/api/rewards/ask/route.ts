/**
 * POST /api/rewards/ask — Canlı soruyu başlatır (yalnız organizatör).
 * Body: { kind, id, questionId }.
 *
 * Uygun katılımcıların users/{uid}/liveQuizSignal doc'una soruyu (doğru cevap
 * OLMADAN) yazar → cihazlarında tam ekran overlay açılır. Doğru cevap + kazanan
 * sayacı rewardConfigs/{key}/qstate/{qid} (private) içinde tutulur.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer, getEligibleParticipants } from '@/lib/rewards-server';
import { sendPushToUsers } from '@/lib/push-notifications';
import { COLLECTIONS } from '@/firebase/collections';
import { rewardKey, type RewardConfig, type RewardKind } from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  if (!cfgSnap.exists) return NextResponse.json({ error: 'Ödül yapılandırması yok.' }, { status: 404 });
  const cfg = cfgSnap.data() as RewardConfig;
  const q = (cfg.quiz?.questions || []).find((x) => x.id === questionId);
  if (!q) return NextResponse.json({ error: 'Soru bulunamadı.' }, { status: 404 });

  const requireCheckin = !!q.checkinOnly || !cfg.isOnline;
  const eligibleAll = await getEligibleParticipants(kind, id, { requireCheckin });
  // Organizatörün kendi cihazında overlay açılıp admin panelini kapatmasın.
  const eligible = eligibleAll.filter((p) => p.uid !== ctx!.uid);
  if (eligible.length === 0) {
    return NextResponse.json({ error: 'Uygun katılımcı yok (kayıt/check-in bekleniyor).' }, { status: 409 });
  }

  const startedAt = Date.now();
  const deadlineMs = startedAt + q.timeLimitSec * 1000;

  // Config live alanları + qstate (private: doğru cevap + kazanan sayacı).
  await db.collection('rewardConfigs').doc(key).set(
    { activeQuestionId: questionId, activeStartedAt: startedAt, activeDeadlineMs: deadlineMs },
    { merge: true },
  );
  await db.collection('rewardConfigs').doc(key).collection('qstate').doc(questionId).set({
    rule: q.winnerRule,
    winnerCount: q.winnerCount || 1,
    correctIndex: q.correctIndex,
    prizeName: q.prizeName || null,
    winners: [],
    revealed: false,
    startedAt,
    deadlineMs,
  });

  // Katılımcı sinyalleri (chunked batch; doğru cevap YOK).
  const signal = {
    active: true,
    key, kind, parentId: id,
    questionId,
    title: ctx!.title,
    text: q.text,
    options: q.options,
    timeLimitSec: q.timeLimitSec,
    startedAtMs: startedAt,
    deadlineMs,
    answered: false,
    myOptionIndex: null as number | null,
    revealed: false,
    correctIndex: null as number | null,
    won: false,
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (let i = 0; i < eligible.length; i += 400) {
    const batch = db.batch();
    for (const p of eligible.slice(i, i + 400)) {
      batch.set(db.collection(COLLECTIONS.users).doc(p.uid).collection('liveQuizSignal').doc('current'), signal);
    }
    await batch.commit();
  }

  // Hafif push — uygulaması kapalı olanlar açsın.
  void sendPushToUsers(
    eligible.map((p) => p.uid),
    {
      title: 'Canlı soru başladı! 🎯',
      body: `${ctx!.title} — hemen cevapla, ödülü kazan!`,
      clickAction: kind === 'event' ? `/events/${id}` : `/volunteering/${id}`,
    },
  );

  return NextResponse.json({ ok: true, eligibleCount: eligible.length });
}
