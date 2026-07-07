/**
 * GET /api/affiliate/go?brandId=<id>
 *
 * Conversion attribution'lı affiliate click → redirect geçidi. Kullanıcı bir
 * markaya hangel üzerinden tıkladığında bu route:
 *   1. (Opsiyonel) idToken'dan userId çözer (Authorization: Bearer <idToken>
 *      ya da `__session` / `idToken` cookie). Anonimse subId'siz devam eder —
 *      link çalışır ama conversion bir bağışa bağlanamaz.
 *   2. Kısa bir clickId üretir, `affiliateClicks/{clickId}` doc'unu Admin SDK
 *      ile yazar (status:'clicked').
 *   3. Markanın affiliate tracking template'ini bulur (fetchAffiliateLinkTemplates,
 *      extension/click ile aynı unstable_cache deseni), clickId'yi {transaction_id}
 *      subId olarak gömer (buildLinkWithSubId) ve 302 redirect eder.
 *
 * Conversion geldiğinde GelirOrtakları/HasOffers paneli /api/affiliate/postback'i
 * subId (=clickId) ile çağırır; o route affiliateClicks/{clickId}'i okuyup
 * userId+brandId çözer ve bağışı oluşturur.
 *
 * Hata formatı (CLAUDE.md): { errorCode, message }. brandId yoksa 400; marka
 * tracking link'i yoksa 404; iç hata 500.
 */
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  fetchAffiliateLinkTemplates,
  buildLinkWithSubId,
  type AffiliateLinkTemplate,
} from '@/lib/api-clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// extension/click ile aynı revalidate'li cache; index brand id → template.
// ⚠️ unstable_cache JSON serileştirir: Map cache HIT'te düz `{}`'a döner ve
// `.get()` TypeError → 500 (flapping bug, 2026-07-07). Bu yüzden Record saklanır.
// Cache key v2: eski zehirli `{}` girdileri yeniden kullanılmasın.
const getCachedTemplateIndex = unstable_cache(
  async (): Promise<Record<string, AffiliateLinkTemplate>> =>
    Object.fromEntries(await fetchAffiliateLinkTemplates()),
  ['affiliate-link-template-index-v2-record'],
  { revalidate: 3600 },
);

function errorResponse(status: number, errorCode: string, message: string) {
  return NextResponse.json({ errorCode, message }, { status });
}

/** idToken'ı Authorization header'dan ya da cookie'den çözer (opsiyonel). */
function extractIdToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const t = authHeader.slice('Bearer '.length).trim();
    if (t) return t;
  }
  const cookieToken = req.cookies.get('idToken')?.value || req.cookies.get('__session')?.value;
  return cookieToken && cookieToken.length > 0 ? cookieToken : null;
}

export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get('brandId')?.trim() ?? '';
  // format=json → client fetch akışı (affiliate-go.ts): 302 yerine {url} döner.
  // Neden: fetch'in cross-origin 302 follow'u merchant CORS'una takılıp atılıyor;
  // JSON modunda final URL'i client kendisi openExternalUrl ile açar.
  const wantsJson = req.nextUrl.searchParams.get('format') === 'json';
  if (!brandId) {
    return errorResponse(400, 'INVALID_BODY', 'brandId zorunlu');
  }

  // 1) Markanın tracking template'ini çöz.
  let brand: AffiliateLinkTemplate | undefined;
  try {
    const index = await getCachedTemplateIndex();
    brand = index[brandId];
  } catch (err) {
    console.error('[affiliate/go] template index error', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Affiliate link alınamadı');
  }
  if (!brand || !brand.template) {
    return errorResponse(404, 'NOT_FOUND', 'Marka tracking link\'i bulunamadı');
  }

  // 2) userId'yi opsiyonel olarak çöz (anonim → subId'siz devam).
  let userId: string | null = null;
  const idToken = extractIdToken(req);
  if (idToken) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      // Geçersiz/expired token → anonim akış (link yine çalışır, attribution yok).
      userId = null;
    }
  }

  // 3) Anonimse subId'siz redirect (bağış bağlanamaz ama link çalışır).
  if (!userId) {
    const anonUrl = buildLinkWithSubId(brand.template, brand.network, '');
    if (!anonUrl) {
      return errorResponse(404, 'NOT_FOUND', 'Marka tracking link\'i bulunamadı');
    }
    if (wantsJson) return NextResponse.json({ ok: true, url: anonUrl });
    return NextResponse.redirect(anonUrl, 302);
  }

  // 4) clickId üret + affiliateClicks doc yaz (Admin SDK).
  const clickId = randomUUID().replace(/-/g, '').slice(0, 16);
  const productUrl = buildLinkWithSubId(brand.template, brand.network, clickId);
  if (!productUrl) {
    return errorResponse(404, 'NOT_FOUND', 'Marka tracking link\'i bulunamadı');
  }

  try {
    const db = getAdminFirestore();
    await db.collection(COLLECTIONS.affiliateClicks).doc(clickId).set({
      clickId,
      userId,
      brandId,
      brandName: brand.brandName,
      network: brand.network,
      productUrl,
      donationRate: brand.donationRate,
      createdAt: FieldValue.serverTimestamp(),
      status: 'clicked',
    });
  } catch (err) {
    // Click kaydı yazılamadıysa bile kullanıcıyı bekletme — link'e yönlendir.
    // (Attribution kaybolur ama kullanıcı deneyimi korunur.)
    console.error('[affiliate/go] click write failed', err);
  }

  if (wantsJson) return NextResponse.json({ ok: true, url: productUrl });
  return NextResponse.redirect(productUrl, 302);
}
