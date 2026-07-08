/**
 * GET /api/market/brand/[slug]/stores
 *
 * Bir MARKA'yı (Nike, Apple, Huawei, Land Rover — `products.productBrandKey`)
 * satan MAĞAZALARI (3 ajans satıcı: Media Markt, Sportive... — `brands` koleksiyonu)
 * ürün sayısı + bağış oranı ile listeler.
 *
 * Yanıt: { count, stores: [{ id, name, logoUrl, productCount, donationRate }] }
 * Hata:  { errorCode, message }
 */
import { NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normBrandKey } from '@/lib/brand-normalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ProductRow = {
  brandId?: string | null;
  brandName?: string | null;
  source?: string | null;
  feedId?: string | null;
  donationRate?: number | null;
  productBrandKey?: string | null;
  productBrand?: string | null;
};

type StoreOut = {
  id: string;
  name: string;
  logoUrl?: string;
  productCount: number;
  donationRate: number;
};

function srcPrefix(source?: string | null): string {
  if (source === 'affocean') return 'ao';
  if (source === 'reklamaction') return 'ra';
  if (source === 'gelirortaklari') return 'go';
  return '';
}

function resolveStoreId(p: ProductRow): string {
  if (p.brandId) return p.brandId;
  const pre = srcPrefix(p.source);
  return pre && p.feedId ? `${pre}-${p.feedId}` : '';
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const rawKey = decodeURIComponent(slug || '').trim();
    if (!rawKey) {
      return NextResponse.json(
        { errorCode: 'INVALID_SLUG', message: 'Marka anahtarı geçersiz.' },
        { status: 400 },
      );
    }
    const key = normBrandKey(rawKey);
    const db = getAdminFirestore();

    // productBrandKey doğrudan eşleşmesi (normalize anahtar, hızlı yol).
    // Ürünler ingest sırasında `productBrandKey` alanıyla stamplenir; yoksa
    // hesaplanamamış (nadir) ürün var demektir — o durumda `productBrand`
    // (case-insensitive) taramasına fallback yapmıyoruz çünkü tam koleksiyon
    // scan pahalı (~100k). Marka profili sayfası da aynı where ile çalışıyor.
    const snap = await db
      .collection('products')
      .where('productBrandKey', '==', key)
      .select('brandId', 'brandName', 'source', 'feedId', 'donationRate')
      .get();

    // Mağaza (storeId) bazında agregat: ürün sayısı + bağış oranı toplamı.
    type Acc = { name: string; productCount: number; rateSum: number; rateCount: number };
    const map = new Map<string, Acc>();
    snap.forEach((doc: QueryDocumentSnapshot) => {
      const d = doc.data() as ProductRow;
      const storeId = resolveStoreId(d);
      const name = (d.brandName || '').trim();
      if (!storeId || !name) return;
      const cur = map.get(storeId) ?? { name, productCount: 0, rateSum: 0, rateCount: 0 };
      cur.productCount += 1;
      const r = Number(d.donationRate);
      if (Number.isFinite(r) && r > 0) {
        cur.rateSum += r;
        cur.rateCount += 1;
      }
      map.set(storeId, cur);
    });

    // Mağaza doc'larından logo + gerçek oran (küratörlü) çek. Bulk get:
    // getAll (ref listesi) tek RPC — N kez tek tek okumaktan çok daha ucuz.
    const storeIds = Array.from(map.keys());
    const storeDocMap = new Map<string, { logoUrl?: string; donationRate?: number; name?: string }>();
    if (storeIds.length > 0) {
      const refs = storeIds.map((id) => db.collection('brands').doc(id));
      const docs = await db.getAll(...refs);
      for (const d of docs) {
        if (!d.exists) continue;
        const data = d.data() as { logoUrl?: string; donationRate?: number; name?: string } | undefined;
        if (!data) continue;
        // Ölü bucket URL'leri (hangel-new-v18) atlanır — brands-all ile aynı kural.
        const logoUrl = data.logoUrl && !data.logoUrl.includes('hangel-new-v18') ? data.logoUrl : undefined;
        storeDocMap.set(d.id, { logoUrl, donationRate: data.donationRate, name: data.name });
      }
    }

    const stores: StoreOut[] = [];
    for (const [id, acc] of map) {
      const doc = storeDocMap.get(id);
      const docRate = Number(doc?.donationRate);
      const donationRate = Number.isFinite(docRate) && docRate > 0
        ? Math.round(docRate)
        : (acc.rateCount > 0 ? Math.round(acc.rateSum / acc.rateCount) : 0);
      stores.push({
        id,
        name: doc?.name || acc.name,
        ...(doc?.logoUrl ? { logoUrl: doc.logoUrl } : {}),
        productCount: acc.productCount,
        donationRate,
      });
    }

    // En çok ürünü satan mağaza önde; eşitlikte oran, sonra ad.
    stores.sort((a, b) =>
      b.productCount - a.productCount
      || b.donationRate - a.donationRate
      || a.name.localeCompare(b.name, 'tr'),
    );

    return NextResponse.json(
      { count: stores.length, stores },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    );
  } catch (err) {
    console.error('/api/market/brand/[slug]/stores error', err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Mağaza listesi alınamadı' },
      { status: 500 },
    );
  }
}
