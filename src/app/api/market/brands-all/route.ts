/**
 * GET /api/market/brands-all
 *
 * "Tüm Markalar" (büyük buton) listesi — market'teki BÜTÜN ürün markaları.
 * `products` koleksiyonundaki tekil `brandName`'lerden türetilir; isim
 * normalizasyonuyla mükerrerler (JBL/Jbl, Huawei/HUAWEI, Cellular Line/
 * Cellularline) birleştirilir. Yeni taranan markalar ürün eklendikçe (cache
 * süresi dolunca) otomatik listeye girer.
 *
 * Not: ajans markaları (/api/offers) ile karıştırılmaz — o liste marka
 * şeridindeki "Tümü" bağlantısında (/market/brands) gösterilir.
 *
 * Performans: products taraması pahalı (~100k doküman) → unstable_cache ile
 * 1 saat cache'lenir; select('brandName','donationRate') ile hafif okunur.
 *
 * Yanıt: { version, count, brands: [{ id, name, donationRate }] } (ada göre sıralı)
 * Hata: { errorCode, message }
 */
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normBrandKey, betterBrandDisplay } from '@/lib/brand-normalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CACHE_TTL_SECONDS = 3600;

type AllBrand = { id: string; name: string; donationRate: number };

const getCachedAllBrands = unstable_cache(
  async (): Promise<AllBrand[]> => {
    const db = getAdminFirestore();
    // .get() 99k dokümanı tek yanıta yükleyince Firestore RESOURCE_EXHAUSTED
    // verir; .stream() sayfa sayfa okuduğu için bu limite takılmaz.
    const stream = db
      .collection('products')
      .select('brandName', 'donationRate')
      .stream() as unknown as AsyncIterable<QueryDocumentSnapshot>;

    // Her normalize anahtar için: yazım varyantlarının sıklığı (görünen adı en
    // sık geçen yazım olur — böylece marka sayfası where('brandName','==') sorgusu
    // en çok ürünü yakalar) + oran ortalaması.
    type Acc = { variants: Map<string, number>; sum: number; count: number };
    const map = new Map<string, Acc>();
    for await (const doc of stream) {
      const d = doc.data() as { brandName?: string; donationRate?: number };
      const raw = (d.brandName || '').trim();
      if (!raw) continue;
      const key = normBrandKey(raw);
      if (!key) continue;
      const rate = Number(d.donationRate);
      const hasRate = Number.isFinite(rate) && rate > 0;
      const cur = map.get(key) ?? { variants: new Map<string, number>(), sum: 0, count: 0 };
      cur.variants.set(raw, (cur.variants.get(raw) ?? 0) + 1);
      if (hasRate) {
        cur.sum += rate;
        cur.count += 1;
      }
      map.set(key, cur);
    }

    const brands: AllBrand[] = [];
    for (const [key, acc] of map) {
      // En sık geçen yazımı seç; eşitlikte gösterime daha uygun olanı yeğle.
      let name = '';
      let best = -1;
      for (const [variant, freq] of acc.variants) {
        if (freq > best) {
          best = freq;
          name = variant;
        } else if (freq === best) {
          name = betterBrandDisplay(name, variant);
        }
      }
      brands.push({
        id: key,
        name,
        donationRate: acc.count > 0 ? Math.round(acc.sum / acc.count) : 0,
      });
    }
    brands.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return brands;
  },
  ['market-brands-all-v1'],
  { revalidate: CACHE_TTL_SECONDS },
);

export async function GET() {
  try {
    const brands = await getCachedAllBrands();
    return NextResponse.json(
      { version: 1, count: brands.length, brands },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
        },
      },
    );
  } catch (err) {
    console.error('/api/market/brands-all error', err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Marka listesi alınamadı' },
      { status: 500 },
    );
  }
}
