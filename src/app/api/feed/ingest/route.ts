/**
 * Ürün feed ingest — super-admin.
 *
 * GET  /api/feed/ingest                → mevcut feed'lerin listesi (GelirOrtakları Go Feed)
 * POST /api/feed/ingest
 *   GelirOrtakları: { source?: 'gelirortaklari', feedId, offerId, name, brandId?, limit?, donationRate? }
 *   Generic feed  : { source: 'generic', feedUrl, name, brandId?, limit?, donationRate? }
 *      → ürünleri canonical şemaya çevirip `products` koleksiyonuna yazar (ikas/ideasoft/tsoft/Google Merchant).
 *
 * Not (POC): /product feed'i büyük (44MB'a kadar) ve tek dosya; bu route ilk N
 * ürünü (default 300) ingest eder. Tam/sürekli senkron için scheduled Cloud
 * Function + arama index (Algolia/Typesense) gelecek fazda.
 *
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { extractProductBrand, normKey } from '@/lib/market/brand-extract';
import { COLLECTIONS } from '@/firebase/collections';
import { listGelirOrtaklariFeeds } from '@/lib/feed/gelirortaklari';
import { ingestProducts, type FeedSourceKind } from '@/lib/feed/registry';
import { searchTokensFor } from '@/lib/feed/search';

export const runtime = 'nodejs';
export const maxDuration = 120;

const PRODUCTS = 'products';

async function verifySuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  try {
    const feeds = await listGelirOrtaklariFeeds();
    return NextResponse.json({ feeds });
  } catch (err) {
    console.error('feed list error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Feed listesi alınamadı.' }, { status: 500 });
  }
}

/**
 * Firestore `undefined` değer kabul etmez (ör. donationRate verilmediğinde mapper
 * undefined üretebilir). Yazmadan önce undefined alanları derinlemesine ayıkla.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

export async function POST(req: NextRequest) {
  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as
    | { source?: string; feedId?: string; offerId?: string; feedUrl?: string; name?: string; type?: string; brandId?: string; limit?: number; donationRate?: number }
    | null;

  const kind: FeedSourceKind = body?.source === 'generic' ? 'generic' : 'gelirortaklari';
  const limit = typeof body?.limit === 'number' ? body.limit : 300;
  const donationRate = typeof body?.donationRate === 'number' ? body.donationRate : undefined;
  const brandId = typeof body?.brandId === 'string' ? body.brandId : null;
  const brandName = typeof body?.name === 'string' && body.name ? body.name : 'Marka';

  if (kind === 'generic') {
    const feedUrl = typeof body?.feedUrl === 'string' ? body.feedUrl.trim() : '';
    if (!feedUrl) {
      return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'generic kaynak için feedUrl zorunlu.' }, { status: 400 });
    }
  } else {
    const feedId = typeof body?.feedId === 'string' ? body.feedId : '';
    const offerId = typeof body?.offerId === 'string' ? body.offerId : '';
    if (!feedId || !offerId) {
      return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'feedId ve offerId zorunlu.' }, { status: 400 });
    }
  }

  try {
    const products = await ingestProducts({
      kind,
      brandId,
      brandName,
      limit,
      donationRate,
      feedId: typeof body?.feedId === 'string' ? body.feedId : undefined,
      offerId: typeof body?.offerId === 'string' ? body.offerId : undefined,
      type: typeof body?.type === 'string' ? body.type : undefined,
      feedUrl: typeof body?.feedUrl === 'string' ? body.feedUrl : undefined,
      source: kind === 'generic' ? 'generic' : undefined,
    });
    if (products.length === 0) {
      return NextResponse.json({ ok: true, ingested: 0, message: 'Feed boş veya ürün parse edilemedi.' });
    }

    const fs = getAdminFirestore();
    // Firestore batch max 500 — parçalara böl.
    let written = 0;
    for (let i = 0; i < products.length; i += 450) {
      const slice = products.slice(i, i + 450);
      const batch = fs.batch();
      for (const p of slice) {
        // Ürün MARKASI (Nike/Apple) — başlıktan/mağaza adından çıkar (Marka≠Mağaza).
        const pb = extractProductBrand(p.title || '', p.brandName || '');
        // Arama için token'la (başlık+marka+kategori) — array-contains-any sorgusu.
        const withTokens = {
          ...p,
          productBrand: pb,
          productBrandKey: pb ? normKey(pb) : null,
          searchTokens: searchTokensFor(p),
        };
        batch.set(fs.collection(PRODUCTS).doc(p.id), stripUndefined(withTokens), { merge: true });
      }
      await batch.commit();
      written += slice.length;
    }
    return NextResponse.json({ ok: true, ingested: written, brand: body?.name });
  } catch (err) {
    console.error('feed ingest error', err);
    const message = err instanceof Error ? err.message : 'Ingest başarısız.';
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message }, { status: 500 });
  }
}
