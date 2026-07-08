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
import { notifyUser } from '@/lib/notify-user';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  signal: z.enum(['visit', 'action']).default('visit'),
  // Oturum (giriş/çıkış) logu için opsiyonel alanlar. Client oturum başına sabit
  // bir sessionId üretir; ilk ping → session oluşur (createdAt = giriş), sonraki
  // ping'ler → lastActiveAt günceller. Süre = lastActiveAt - createdAt.
  sessionId: z.string().min(6).max(128).optional(),
  deviceName: z.string().max(120).optional(),
  browserName: z.string().max(120).optional(),
  deviceType: z.string().max(40).optional(),
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
  let sessionMeta: { sessionId?: string; deviceName?: string; browserName?: string; deviceType?: string };
  try {
    // Body opsiyonel — gövdesiz POST = 'visit'.
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.parse(raw ?? {});
    signal = parsed.signal;
    sessionMeta = { sessionId: parsed.sessionId, deviceName: parsed.deviceName, browserName: parsed.browserName, deviceType: parsed.deviceType };
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);
  const today = istanbulDayKey();

  // Oturum (giriş/çıkış) logu — best-effort, seri yanıtını bloklamaz.
  // Aktiviteler sayfası "Giriş/Çıkış" tabı users/{uid}/sessions'tan okur.
  if (sessionMeta.sessionId) {
    try {
      const { FieldValue } = await import('firebase-admin/firestore');
      const sessRef = userRef.collection('sessions').doc(sessionMeta.sessionId);
      const sessSnap = await sessRef.get();
      if (sessSnap.exists) {
        // Var olan oturum → son aktiviteyi tazele (çıkış/online süresi için).
        await sessRef.set({ lastActiveAt: FieldValue.serverTimestamp() }, { merge: true });
      } else {
        // Yeni oturum → giriş anı (createdAt) + cihaz bilgisi.
        await sessRef.set({
          createdAt: FieldValue.serverTimestamp(),
          lastActiveAt: FieldValue.serverTimestamp(),
          deviceName: sessionMeta.deviceName || '',
          browserName: sessionMeta.browserName || '',
          deviceType: sessionMeta.deviceType || '',
        });
      }
    } catch (e) {
      console.warn('[streak/ping] session log failed', e instanceof Error ? e.message : String(e));
    }
  }

  let tr: { next: StreakState; freezeUsed: boolean };
  try {
    tr = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        // Kullanıcı dokümanı henüz yoksa streak yazmayı denemeyiz (başka akış
        // oluşturur); seriyi sessizce atla.
        return { next: emptyStreak(), freezeUsed: false };
      }
      const prev = (snap.get('streak') as StreakState | undefined) ?? null;
      const { next, changed, freezeUsed: fu } = applyStreakSignal(prev, signal, today);
      if (changed) {
        tx.set(userRef, { streak: next }, { merge: true });
      }
      return { next, freezeUsed: fu };
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
  const result = tr.next;
  const freezeUsed = tr.freezeUsed;

  // Dondurma tüketildiyse kullanıcıyı bilgilendir — bir günü kaçırdı ama serisi
  // kurtarıldı. Motive edici; best-effort (seri yanıtını bloklamaz).
  if (freezeUsed) {
    try {
      await notifyUser({
        userId: uid,
        type: 'streak_freeze_used',
        title: 'Serini kurtardık! 🧊',
        body: `Bir günü kaçırdın ama dondurma hakkın devreye girdi — ${result.current} günlük serin devam ediyor. Kalan dondurma: ${result.freezeCount}.`,
        link: '/my-badges',
      });
    } catch (e) {
      console.warn('[streak/ping] freeze notify failed', e instanceof Error ? e.message : String(e));
    }
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
