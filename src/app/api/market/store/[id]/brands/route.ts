/**
 * GET /api/market/store/[id]/brands
 *
 * Bir MAĞAZA'da (satıcı — Media Markt, Trendyol… `products.brandId` veya
 * `brandName`) satılan MARKALARI (`products.productBrand` / `productBrandKey` —
 * Nike, Apple, Ülker) ürün sayısıyla listeler. Marka→mağaza (brand/[slug]/stores)
 * endpoint'inin TERSİ.
 *
 * Query: ?name=<storeName> (brandId ile eşleşme zayıfsa ada göre fallback)
 * Yanıt: { count, brands: [{ key, name, productCount, donationRate }] }
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
  brandName?: string | null;
  productBrand?: string | null;
  productBrandKey?: string | null;
  donationRate?: number | null;
};

type BrandOut = {
  key: string;
  name: string;
  productCount: number;
  donationRate: number;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const storeName = (url.searchParams.get('name') || '').trim();
    const storeId = decodeURIComponent(id || '').trim();
    if (!storeId && !storeName) {
      return NextResponse.json(
        { errorCode: 'INVALID_STORE', message: 'Mağaza kimliği geçersiz.' },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();

    // Mağaza adını çöz (brandId → brands doc.name). Ürünler brandName ile
    // stamplendiği için ada göre sorgulamak en güvenilir yol.
    let resolvedName = storeName;
    if (!resolvedName && storeId) {
      const sdoc = await db.collection('brands').doc(storeId).get().catch(() => null);
      resolvedName = (sdoc?.data() as { name?: string } | undefined)?.name?.trim() || '';
    }
    if (!resolvedName) {
      return NextResponse.json({ count: 0, brands: [] });
    }

    // Bu mağazanın (satıcının) TÜM ürünleri — brandName eşleşmesi.
    const snap = await db
      .collection('products')
      .where('brandName', '==', resolvedName)
      .select('productBrand', 'productBrandKey', 'donationRate')
      .get();

    // Marka (productBrandKey) bazında agregat.
    type Acc = { name: string; productCount: number; rateSum: number; rateCount: number };
    const map = new Map<string, Acc>();
    snap.forEach((doc: QueryDocumentSnapshot) => {
      const d = doc.data() as ProductRow;
      const label = (d.productBrand || '').trim();
      const key = (d.productBrandKey || (label ? normBrandKey(label) : '')).trim();
      if (!key || !label) return;
      const cur = map.get(key) ?? { name: label, productCount: 0, rateSum: 0, rateCount: 0 };
      cur.productCount += 1;
      const r = Number(d.donationRate);
      if (Number.isFinite(r) && r > 0) { cur.rateSum += r; cur.rateCount += 1; }
      map.set(key, cur);
    });

    const brands: BrandOut[] = [];
    for (const [key, acc] of map) {
      brands.push({
        key,
        name: acc.name,
        productCount: acc.productCount,
        donationRate: acc.rateCount > 0 ? Math.round(acc.rateSum / acc.rateCount) : 0,
      });
    }

    // En çok ürünü olan marka önde; eşitlikte oran, sonra ad.
    brands.sort((a, b) =>
      b.productCount - a.productCount
      || b.donationRate - a.donationRate
      || a.name.localeCompare(b.name, 'tr'),
    );

    return NextResponse.json(
      { count: brands.length, brands },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    );
  } catch (err) {
    console.error('/api/market/store/[id]/brands error', err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Marka listesi alınamadı' },
      { status: 500 },
    );
  }
}
