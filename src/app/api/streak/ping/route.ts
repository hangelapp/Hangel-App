/**
 * POST /api/streak/ping — kullanıcının günlük serisini (streak) günceller.
 *
 * İki sinyal kabul eder:
 *   - 'visit'  : hangel ZIYARETİ (app/sayfa açılışı). Client hook günde 1 kez çağırır.
 *   - 'action' : KATKI (etkinlik/gönüllülük/bağış). Katkı akışları sunucudan tetikler.
 *
 * Gün sınırı Europe/Istanbul'a göre hesaplanır (bkz. src/lib/streak.ts). Aynı
 * gün ikinci çağrı no-op gibi davranır (sadece tarih damgası tazelenir, seri
 * değişmez), böylece istemci gönül rahatlığıyla her açılışta ping atabilir.
 *
 * Yazım transaction içinde yapılır → eşzamanlı ziyaret+katkı çakışmaz.
 * Hata formatı CLAUDE.md sözleşmesi: { errorCode, message }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  applyStreakSignal,
  emptyStreak,
  istanbulDayKey,
  type StreakState,
  type StreakSignal,
} from '@/lib/streak';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  signal: z.enum(['visit', 'action']).default('visit'),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { errorCode: 'NO_AUTH', message: 'Authorization gerekli.' },
      { status: 401 },
    );
  }
  const idToken = authHeader.slice('Bearer '.length).trim();

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' },
      { status: 401 },
    );
  }

  let signal: StreakSignal;
  try {
    // Body opsiyonel — gövdesiz POST = 'visit'.
    const raw = await req.json().catch(() => ({}));
    signal = BodySchema.parse(raw ?? {}).signal;
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);
  const today = istanbulDayKey();

  let result: StreakState;
  try {
    result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        // Kullanıcı dokümanı henüz yoksa streak yazmayı denemeyiz (başka akış
        // oluşturur); seriyi sessizce atla.
        return emptyStreak();
      }
      const prev = (snap.get('streak') as StreakState | undefined) ?? null;
      const { next, changed } = applyStreakSignal(prev, signal, today);
      if (changed) {
        tx.set(userRef, { streak: next }, { merge: true });
      }
      return next;
    });
  } catch (e) {
    return NextResponse.json(
      {
        errorCode: 'WRITE_FAILED',
        message: e instanceof Error ? e.message : 'Seri güncellenemedi.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    streak: {
      current: result.current,
      longest: result.longest,
      freezeCount: result.freezeCount,
    },
  });
}
