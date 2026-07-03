/**
 * /api/exam/config — Sınav yapılandırması (yalnız organizatör).
 *   GET ?id=   → tam config (admin; doğru cevaplar dahil).
 *   POST { id, enabled, requiredForCert, passPct, attempts, questions } → kaydet.
 * examConfigs (private) + eventExams (public banner) yazar.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer } from '@/lib/rewards-server';
import {
  examKey, examPublicSummary, DEFAULT_QUESTION_SECONDS, DEFAULT_PASS_PCT, DEFAULT_ATTEMPTS,
  type ExamConfig, type ExamQuestion,
} from '@/lib/exam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeQuestions(raw: unknown): ExamQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const qq = q as Partial<ExamQuestion>;
      const options = Array.isArray(qq.options) ? qq.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 6) : [];
      return {
        id: qq.id && String(qq.id) ? String(qq.id) : `eq_${randomUUID().slice(0, 8)}`,
        text: String(qq.text ?? '').trim(),
        options,
        correctIndex: Math.max(0, Math.min(options.length - 1, Math.round(Number(qq.correctIndex) || 0))),
        timeLimitSec: Math.max(5, Math.min(1800, Math.round(Number(qq.timeLimitSec) || DEFAULT_QUESTION_SECONDS))),
      } as ExamQuestion;
    })
    .filter((q) => q.text && q.options.length >= 2)
    .slice(0, 100);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
  const { ctx, error } = await resolveOrganizer(req, 'event', id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const snap = await getAdminFirestore().collection('examConfigs').doc(examKey(id)).get();
  return NextResponse.json({ ok: true, config: snap.exists ? snap.data() : null, title: ctx!.title });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 });
  }
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
  const { ctx, error } = await resolveOrganizer(req, 'event', id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const db = getAdminFirestore();
  const key = examKey(id);
  const prev = (await db.collection('examConfigs').doc(key).get()).data() as ExamConfig | undefined;

  const config: ExamConfig = {
    eventId: id,
    ngoId: ctx!.organizerId,
    ngoName: ctx!.ngoName,
    ngoLogoUrl: ctx!.ngoLogoUrl,
    title: ctx!.title,
    enabled: body.enabled !== false,
    requiredForCert: body.requiredForCert !== false,
    passPct: Math.max(1, Math.min(100, Math.round(Number(body.passPct) || DEFAULT_PASS_PCT))),
    attempts: Math.max(1, Math.min(20, Math.round(Number(body.attempts) || DEFAULT_ATTEMPTS))),
    questions: sanitizeQuestions(body.questions),
    open: prev?.open ?? false, // açma/kapama /api/exam/open ve Tamamla üzerinden
    openedAt: prev?.openedAt ?? null,
  };

  await db.collection('examConfigs').doc(key).set(
    { ...config, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx!.uid },
    { merge: true },
  );
  await db.collection('eventExams').doc(key).set(
    { ...examPublicSummary(config), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
