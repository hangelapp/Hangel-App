/**
 * GET /api/exam/results?id= — Sınav sonuçları (yalnız organizatör).
 * Kim geçti/kaldı, en iyi puan, deneme sayısı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { resolveOrganizer } from '@/lib/rewards-server';
import { COLLECTIONS } from '@/firebase/collections';
import { examKey } from '@/lib/exam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 });
  const { error } = await resolveOrganizer(req, 'event', id);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const db = getAdminFirestore();
  const snap = await db.collection('examConfigs').doc(examKey(id)).collection('results').get();
  const rows = snap.docs.map((d) => {
    const r = d.data() as { bestScorePct?: number; passed?: boolean; attemptCount?: number };
    return { uid: d.id, bestScorePct: r.bestScorePct ?? 0, passed: !!r.passed, attemptCount: r.attemptCount ?? 0 };
  });
  // İsimleri getir.
  const names: Record<string, string> = {};
  for (let i = 0; i < rows.length; i += 300) {
    const batch = rows.slice(i, i + 300);
    const refs = batch.map((x) => db.collection(COLLECTIONS.users).doc(x.uid));
    const snaps = await db.getAll(...refs);
    for (const s of snaps) {
      const u = (s.data() ?? {}) as { displayName?: string; name?: string };
      names[s.id] = u.displayName || u.name || 'Katılımcı';
    }
  }
  const passed = rows.filter((r) => r.passed).length;
  return NextResponse.json({
    ok: true,
    total: rows.length,
    passed,
    failed: rows.length - passed,
    rows: rows.map((r) => ({ ...r, name: names[r.uid] || 'Katılımcı' })).sort((a, b) => b.bestScorePct - a.bestScorePct),
  });
}
