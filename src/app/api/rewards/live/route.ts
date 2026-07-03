/**
 * GET /api/rewards/live?kind=&id=&questionId= — Admin canlı sonuç (yalnız organizatör).
 * Şık dağılımı + toplam + doğru sayısı + kazananlar. Admin ekranı ~2sn'de bir çeker.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer } from '@/lib/rewards-server';
import { rewardKey, type RewardConfig, type RewardKind } from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get('kind') === 'event' || searchParams.get('kind') === 'volunteering'
    ? searchParams.get('kind')
    : null) as RewardKind | null;
  const id = searchParams.get('id') || '';
  const questionId = searchParams.get('questionId') || '';
  if (!kind || !id || !questionId) return NextResponse.json({ error: 'kind, id, questionId gerekli.' }, { status: 400 });

  const { error } = await resolveOrganizer(req, kind, id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const db = getAdminFirestore();
  const key = rewardKey(kind, id);
  const cfg = (await db.collection('rewardConfigs').doc(key).get()).data() as (RewardConfig & { activeQuestionId?: string }) | undefined;
  const q = (cfg?.quiz?.questions || []).find((x) => x.id === questionId);
  const optCount = q?.options.length || 0;

  const qstate = (await db.collection('rewardConfigs').doc(key).collection('qstate').doc(questionId).get()).data() as
    | { winners?: string[]; correctIndex?: number; revealed?: boolean }
    | undefined;

  const ansSnap = await db.collection('rewardConfigs').doc(key).collection('answers').where('questionId', '==', questionId).get();
  const counts = new Array(optCount).fill(0) as number[];
  const nameByUid = new Map<string, string>();
  let correctCount = 0;
  for (const d of ansSnap.docs) {
    const a = d.data() as { uid: string; name?: string; optionIndex?: number; correct?: boolean };
    if (typeof a.optionIndex === 'number' && a.optionIndex < counts.length) counts[a.optionIndex] += 1;
    if (a.correct) correctCount += 1;
    nameByUid.set(a.uid, a.name || 'hangel gönüllüsü');
  }
  const winners = (qstate?.winners || []).map((uid) => ({ uid, name: nameByUid.get(uid) || 'Katılımcı' }));

  return NextResponse.json({
    ok: true,
    active: cfg?.activeQuestionId === questionId,
    revealed: !!qstate?.revealed,
    counts,
    total: ansSnap.size,
    correctCount,
    correctIndex: qstate?.correctIndex ?? q?.correctIndex ?? null,
    winners,
  });
}
