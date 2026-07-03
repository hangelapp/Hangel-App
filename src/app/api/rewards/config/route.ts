/**
 * /api/rewards/config — Ödül/Çekiliş/Quiz yapılandırması (yalnız organizatör).
 *   GET  ?kind=&id=   → tam config (admin düzenleme için; doğru cevaplar dahil).
 *   POST { kind, id, isOnline, raffle, quiz } → kaydet.
 *
 * İki yere yazar:
 *   - rewardConfigs/{key}  (private, Admin SDK) → sorular + doğru cevaplar.
 *   - eventRewards/{key}   (public banner)      → doğru cevap İÇERMEZ.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer } from '@/lib/rewards-server';
import {
  rewardKey,
  toPublicSummary,
  type RewardConfig,
  type RewardKind,
  type QuizQuestion,
  type RewardPrize,
} from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseKind(v: unknown): RewardKind | null {
  return v === 'event' || v === 'volunteering' ? v : null;
}

function sanitizePrizes(raw: unknown): RewardPrize[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => ({ name: String((p as RewardPrize)?.name ?? '').trim(), count: Math.max(1, Math.round(Number((p as RewardPrize)?.count) || 1)) }))
    .filter((p) => p.name)
    .slice(0, 20);
}

function sanitizeQuestions(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const qq = q as Partial<QuizQuestion>;
      const options = Array.isArray(qq.options) ? qq.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 6) : [];
      const correctIndex = Math.max(0, Math.min(options.length - 1, Math.round(Number(qq.correctIndex) || 0)));
      return {
        id: qq.id && String(qq.id) ? String(qq.id) : `q_${randomUUID().slice(0, 8)}`,
        text: String(qq.text ?? '').trim(),
        options,
        correctIndex,
        timeLimitSec: Math.max(5, Math.min(120, Math.round(Number(qq.timeLimitSec) || 20))),
        winnerRule: qq.winnerRule === 'raffle' ? 'raffle' : 'first',
        checkinOnly: !!qq.checkinOnly,
        prizeName: qq.prizeName ? String(qq.prizeName).trim() : undefined,
        winnerCount: Math.max(1, Math.round(Number(qq.winnerCount) || 1)),
      } as QuizQuestion;
    })
    .filter((q) => q.text && q.options.length >= 2)
    .slice(0, 30);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = parseKind(searchParams.get('kind'));
  const id = searchParams.get('id') || '';
  if (!kind || !id) return NextResponse.json({ error: 'kind ve id gerekli.' }, { status: 400 });

  const { ctx, error } = await resolveOrganizer(req, kind, id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const db = getAdminFirestore();
  const snap = await db.collection('rewardConfigs').doc(rewardKey(kind, id)).get();
  const config = snap.exists ? (snap.data() as RewardConfig) : null;
  return NextResponse.json({ ok: true, config, guessOnline: ctx!.guessOnline, title: ctx!.title });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const kind = parseKind(body.kind);
  const id = String(body.id || '');
  if (!kind || !id) return NextResponse.json({ error: 'kind ve id gerekli.' }, { status: 400 });

  const { ctx, error } = await resolveOrganizer(req, kind, id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const raffle = { enabled: !!(body.raffle as { enabled?: boolean })?.enabled, prizes: sanitizePrizes((body.raffle as { prizes?: unknown })?.prizes) };
  const questions = sanitizeQuestions((body.quiz as { questions?: unknown })?.questions);
  const quiz = { enabled: !!(body.quiz as { enabled?: boolean })?.enabled, questions };

  const config: RewardConfig = {
    kind,
    parentId: id,
    ngoId: ctx!.organizerId,
    ngoName: ctx!.ngoName,
    ngoLogoUrl: ctx!.ngoLogoUrl,
    title: ctx!.title,
    isOnline: body.isOnline === true,
    raffle,
    quiz,
    activeQuestionId: null,
  };

  const db = getAdminFirestore();
  const key = rewardKey(kind, id);
  // Private tam config (Admin SDK only).
  await db.collection('rewardConfigs').doc(key).set(
    { ...config, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx!.uid },
    { merge: true },
  );
  // Public banner özeti (doğru cevap YOK).
  await db.collection('eventRewards').doc(key).set(
    { ...toPublicSummary(config), ngoName: ctx!.ngoName, ngoLogoUrl: ctx!.ngoLogoUrl ?? null, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
