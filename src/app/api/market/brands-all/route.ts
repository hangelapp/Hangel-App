/**
 * GET /api/market/brands-all
 *
 * "Tüm Markalar" (büyük buton) listesi — market'teki BÜTÜN ürün MARKALARI
 * (Nike, Apple, Ülker...). `products.productBrand` alanından (başlıktan çıkarılan
 * kanonik marka) türetilir; her marka /market/brand/<key> profiline gider.
 *
 * ÖNEMLİ: Bu "Marka" listesidir, "Mağaza" değil. Mağazalar (3 ajanstan gelen
 * satıcılar: Media Markt, Sportive...) `brands` koleksiyonu + /api/offers'tır ve
 * "Mağazalar" şeridi / /market/brands'te gösterilir.
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
// markanın sitesi (favicon için). famous: çok bilinen (ünlü) marka mı — /market/
// brands/all bunları ÜSTTE, az bilinenleri ALTTA gösterir.
type AllBrand = { id: string; name: string; donationRate: number; logoUrl?: string; domain?: string; famous?: boolean };

// Çok bilinen (ünlü) markalar — yerel + uluslararası. Normalize edilip Set'e alınır;
// bir marka `productBrandKey` VEYA normBrandKey(ad) ile bu sette eşleşirse famous.
const FAMOUS_NAMES = [
  'A101','Acer','Alcatel','Altınyıldız','Altus','Amazfit','Amd','Anker','Apple','Arçelik','Arnica','Arzum','Asus','Avansas',
  'Babyliss','Baseus','Baymak','Beats','Beko','Belkin','Bella Maison','Benetton','Benq','Bissell','Black&decker','Bosch','Boyner','Braun',
  'Canon','Capcom','Casio','Casper','Colins','Columbia','Converse','Corsair','Crucial',
  'D&R','DAGİ','Daikin','Davidoff','Delonghi','Desa','Digiturk','Divarese','Dji','Doremusic','DS Damat','Duracell','Dyson',
  'Ea','Ebebek','Ecovacs','Electrolux','Energizer','Epson','Everest','Exper','Eyup sabri tuncer',
  'Fakir','Ferre','FLO','Flormar','Fujifilm',
  'Gant','GAP','General mobile','Goldmaster','GoPro','Grundig','Guess',
  'H&M','Haier','Harman kardon','Hatemoğlu','Hemington','Hikvision','Homend','Honor','Hoover','Hotiç','Hp','Htc Vive','HUAWEI','Hyperx',
  'Instax','Intel','Intersport','İdefix','İpekyol','JBL',
  'Karaca','Karcher','Kaspersky','Kenwood','Kingston','Kip','Kobo','Koçtaş','Kodak','Korkmaz','Koton','Krups','Kütahya Porselen',
  'Land Rover','Lee','Lenovo','Lg','Linens','Logitech',
  'Machka','Madame Coco','Marks & Spencer','Marshall','Mcafee(ue)','Microsoft','Mudo','Msi',
  'Nautica','Nespresso','Network','Next','Nikon','Ninja','Nintendo','Nokia',
  'Olympus','Oppo','Oral b','Özdilekteyim',
  'Panasonic','Philips','Polaroid','Preo','Profilo','PUMA',
  'Ramsey','Razer','Realme','Reeder','Remington','Revlon','Roborock','Rowenta',
  'Samsonite','Samsung','Sandisk','Seagate','Sega','Sennheiser','SETUR','Shark','Siemens','Sinbo','Skechers','Slazenger','Sony','SuperStep','Süvari',
  'Taç','Tatilbudur','Tchibo','TCL','Tecno','Tefal','Teknosa','Toshiba','Toyzz Shop','TP-Link','Ttec','Twist',
  'Ugreen','Varta','Vestel','Vivo',
  'Wahl','Warner bros','WD','Western digital','Wmf','Wrangler',
  'Xbox','Xiaomi','Yargıcı','Zwilling','Infinix','Nubia','Xgimi',
];
const FAMOUS_KEYS = new Set(FAMOUS_NAMES.map((n) => normBrandKey(n)));

const getCachedAllBrands = unstable_cache(
  async (): Promise<AllBrand[]> => {
    const db = getAdminFirestore();
    // .get() 99k dokümanı tek yanıta yükleyince Firestore RESOURCE_EXHAUSTED
    // verir; .stream() sayfa sayfa okuduğu için bu limite takılmaz.
    // GERÇEK ÜRÜN MARKASI (Marka) üzerinden gruplanır — `productBrand` alanı,
    // ürün başlığından/mağaza adından çıkarılmış kanonik markadır (Nike, Apple,
    // Ülker). `brandName` ise MAĞAZA'dır (satıcı) ve burada KULLANILMAZ.
    // productBrandKey = normalize anahtar (marka profili sorgusu bununla yapılır).
    const stream = db
      .collection('products')
      .select('productBrand', 'productBrandKey', 'brandName', 'donationRate')
      .stream() as unknown as AsyncIterable<QueryDocumentSnapshot>;

    type Acc = { variants: Map<string, number>; sum: number; count: number };
    const map = new Map<string, Acc>();
    for await (const doc of stream) {
      const d = doc.data() as { productBrand?: string; productBrandKey?: string; brandName?: string; donationRate?: number };
      // Kanonik ürün markası (productBrand) varsa onu kullan; yoksa mağaza/satıcı
      // adına (brandName) düş → böylece TÜM markalar (400+) listeye girer, yalnız
      // markası çıkarılmış ~141 değil.
      const raw = (d.productBrand || d.brandName || '').trim();
      const key = ((d.productBrandKey || '').trim() || normBrandKey(raw));
      if (!raw || !key) continue;
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
      const famous = FAMOUS_KEYS.has(key) || FAMOUS_KEYS.has(normBrandKey(name));
      brands.push({
        id: key,
        name,
        donationRate: acc.count > 0 ? Math.round(acc.sum / acc.count) : 0,
        ...(logoUrl ? { logoUrl } : {}),
        ...(domain ? { domain } : {}),
        ...(famous ? { famous: true } : {}),
      });
    }
    brands.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return brands;
  },
  ['market-brands-all-v7-productbrand'],
  { revalidate: CACHE_TTL_SECONDS },
);

// Ön-hesaplanmış marka listesi burada saklanır → istekler 99k ürünü TARAMADAN
// tek doküman okur. Yalnız doc yoksa/bayatsa (>6s) yeniden hesaplanır (unstable_cache
// zaten taramayı 1s'te bir ile sınırlar). Ürünler yalnız ingest'te değiştiği için
// 6s tazelik dengesi uygun; yeni çekilen ürünler en geç 6s içinde listeye yansır.
const AGG_DOC_FRESH_MS = 6 * 3600 * 1000;

const cacheHeaders = {
  'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
};

export async function GET() {
  const db = getAdminFirestore();
  const ref = db.collection('marketAggregates').doc('brandsAll');

  // 1) HIZLI YOL — önceden hesaplanmış doküman (ürün taraması YOK).
  try {
    const snap = await ref.get();
    if (snap.exists) {
      const data = snap.data() as { brands?: AllBrand[]; updatedAt?: number };
      const fresh = typeof data.updatedAt === 'number' && Date.now() - data.updatedAt < AGG_DOC_FRESH_MS;
      if (Array.isArray(data.brands) && data.brands.length > 0 && fresh) {
        return NextResponse.json(
          { version: 7, count: data.brands.length, brands: data.brands },
          { headers: cacheHeaders },
        );
      }
    }
  } catch {
    /* doc okunamadı → hesaplama yoluna düş */
  }

  // 2) YAVAŞ YOL — hesapla (unstable_cache 1s ile sınırlı) + doc'a yaz (fire-and-forget).
  try {
    const brands = await getCachedAllBrands();
    ref.set({ brands, updatedAt: Date.now() }).catch(() => { /* yazım opsiyonel */ });
    return NextResponse.json(
      { version: 7, count: brands.length, brands },
      { headers: cacheHeaders },
    );
  } catch (err) {
    console.error('/api/market/brands-all error', err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: 'Marka listesi alınamadı' },
      { status: 500 },
    );
  }
}
