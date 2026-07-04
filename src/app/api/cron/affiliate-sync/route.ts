/**
 * POST /api/cron/affiliate-sync — Günlük affiliate onay senkronu (Cloud Scheduler, 06:00).
 *
 * fetchAllAgencyOffers() yalnız ONAYLI/açık offer'ları döndürür. STORE_BRANDS
 * içinden onaylı offer'ı OLMAYAN mağazaları hesaplar ve marketAggregates/hiddenStores
 * doküman(ın)a yazar. Onay gelen mağaza otomatik listeden ÇIKAR (geri yayına girer).
 *
 * SİLME YOK — sadece market görünürlüğü (brands-all filterHidden bunu okur).
 * Auth: checkMessagingKey (x-messaging-key: MESSAGING_WORKER_KEY) — messaging worker'larla aynı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkMessagingKey } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { fetchAllAgencyOffers } from '@/lib/api-clients';
import { normBrandKey } from '@/lib/brand-normalize';
import { STORE_BRANDS, STORE_BRAND_KEYS } from '@/lib/store-brands';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const authErr = checkMessagingKey(req);
  if (authErr) return authErr;

  let approvedKeys: Set<string>;
  try {
    const offers = await fetchAllAgencyOffers(); // yalnız onaylı/açık offer'lar
    approvedKeys = new Set(offers.map((o) => normBrandKey(o?.name || '')).filter(Boolean));
  } catch (e) {
    console.error('[affiliate-sync] offers alınamadı', e);
    return NextResponse.json({ error: 'Offer listesi alınamadı.' }, { status: 502 });
  }

  // Onaylı offer'ı OLMAYAN mağazalar → gizle.
  const hiddenKeys: string[] = [];
  const hiddenNames: string[] = [];
  STORE_BRANDS.forEach((name) => {
    const key = normBrandKey(name);
    if (key && !approvedKeys.has(key)) {
      hiddenKeys.push(key);
      hiddenNames.push(name);
    }
  });
  const reactivated = STORE_BRAND_KEYS.filter((k) => approvedKeys.has(k));

  const db = getAdminFirestore();
  await db.collection('marketAggregates').doc('hiddenStores').set({
    keys: Array.from(new Set(hiddenKeys)),
    hiddenNames,
    approvedStoreCount: reactivated.length,
    checkedStores: STORE_BRANDS.length,
    updatedAt: Date.now(),
  });

  return NextResponse.json({
    ok: true,
    hiddenCount: hiddenKeys.length,
    hidden: hiddenNames,
    approvedStores: reactivated.length,
    checkedStores: STORE_BRANDS.length,
  });
}

// Cloud Scheduler bazı kurulumlarda GET ile tetikler — aynı işi yapsın.
export async function GET(req: NextRequest) {
  return POST(req);
}
