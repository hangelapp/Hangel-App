/**
 * POST /api/ads/click
 *
 * Market reklam banner'ı tıklama sayacı (best-effort). Body: { id: string }.
 * `marketAdBanners/{id}` doc'unda clickCount'u +1 artırır, lastClickAt'i
 * serverTimestamp yapar. Ölçülebilir gelir raporlaması için.
 *
 * Best-effort: doc yoksa / body bozuksa client'ı 500'lemez, ok:true döner.
 * Sadece id hiç yoksa 400 { errorCode:'MISSING_ID' }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let id: unknown;
  try {
    const body = await req.json();
    id = body?.id;
  } catch {
    // Bozuk/boş JSON gövdesi — best-effort, client'ı 500'leme.
    return NextResponse.json({ ok: true });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { errorCode: 'MISSING_ID', message: 'Reklam id gerekli.' },
      { status: 400 },
    );
  }

  try {
    const docRef = getAdminFirestore()
      .collection(COLLECTIONS.marketAdBanners)
      .doc(id);
    await docRef.update({
      clickCount: FieldValue.increment(1),
      lastClickAt: FieldValue.serverTimestamp(),
    });
    // Günlük kova (daily bucket) — YYYY-MM-DD alt-koleksiyon dokümanı. Best-effort;
    // ayrı try ile ana sayaç güncellendikten sonra denenir, hatası yutulur.
    try {
      const day = new Date().toISOString().slice(0, 10);
      await docRef
        .collection('daily')
        .doc(day)
        .set({ clicks: FieldValue.increment(1) }, { merge: true });
    } catch {
      // Günlük kova yazımı başarısız — best-effort, sessizce geç.
    }
  } catch {
    // Doc yoksa (update NOT_FOUND) ya da geçici hata — best-effort, sessizce geç.
  }

  return NextResponse.json({ ok: true });
}
