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
import { fetchAllAgencyOffers } from '@/lib/api-clients';
import { normBrandKey, betterBrandDisplay } from '@/lib/brand-normalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CACHE_TTL_SECONDS = 3600;

// logoUrl: affiliate ağının GERÇEK marka logosu (isimden eşleşirse). domain:
// markanın sitesi (favicon için). İkisi de yoksa istemci ada göre favicon dener.
type AllBrand = { id: string; name: string; donationRate: number; logoUrl?: string; domain?: string };

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

    // Affiliate offers'tan gerçek logo + domain (isim normalizasyonuyla eşleşenler).
    const offerMap = new Map<string, { logoUrl: string; domain: string }>();
    try {
      const offers = await fetchAllAgencyOffers();
      for (const o of offers) {
        const k = normBrandKey(o?.name || '');
        if (!k || offerMap.has(k)) continue;
        offerMap.set(k, { logoUrl: o?.logoUrl || '', domain: o?.targetDomain || '' });
      }
    } catch {
      /* offers opsiyonel — logo yoksa istemci ada göre favicon dener */
    }

    // `brands` koleksiyonundaki küratörlü/doğrulanmış logo + gerçek domain
    // (offers'tan önceliklidir). Ölü bucket URL'leri (hangel-new-v18) atlanır.
    const brandDocMap = new Map<string, { logoUrl: string; domain: string }>();
    try {
      const bsnap = await db.collection('brands').get();
      bsnap.forEach((d) => {
        const o = d.data() as { name?: string; logoUrl?: string; targetDomain?: string };
        const k = normBrandKey(o?.name || '');
        if (!k || brandDocMap.has(k)) return;
        const logo = o?.logoUrl && !o.logoUrl.includes('hangel-new-v18') ? o.logoUrl : '';
        brandDocMap.set(k, { logoUrl: logo, domain: o?.targetDomain || '' });
      });
    } catch {
      /* brands koleksiyonu opsiyonel */
    }

    // brandDirectory: ürün-only markalar için tek tek bulunmuş gerçek domain
    // (+ opsiyonel logoUrl). Doc id = normBrandKey. En düşük öncelik (offers/
    // brands koleksiyonu yoksa devreye girer).
    const dirMap = new Map<string, { logoUrl: string; domain: string }>();
    try {
      const dsnap = await db.collection('brandDirectory').get();
      dsnap.forEach((d) => {
        const o = d.data() as { logoUrl?: string; domain?: string };
        dirMap.set(d.id, { logoUrl: o?.logoUrl || '', domain: o?.domain || '' });
      });
    } catch {
      /* brandDirectory opsiyonel */
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
      const bd = brandDocMap.get(key);
      const offer = offerMap.get(key);
      const dir = dirMap.get(key);
      const logoUrl = bd?.logoUrl || offer?.logoUrl || dir?.logoUrl || '';
      const domain = bd?.domain || offer?.domain || dir?.domain || '';
      brands.push({
        id: key,
        name,
        donationRate: acc.count > 0 ? Math.round(acc.sum / acc.count) : 0,
        ...(logoUrl ? { logoUrl } : {}),
        ...(domain ? { domain } : {}),
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
