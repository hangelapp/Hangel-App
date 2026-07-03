'use client';

/**
 * Ürünleri Keşfet — Trendyol uygulamasının ANA SAYFASI tarzı pazar-yeri vitrini (PIM).
 *
 * hangel farkı: her ürün yüzeyinde 🧡 BAĞIŞ ORANI rozeti. Klasik pazar yerinde
 * olmayan tek şey bu — kullanıcı alışveriş yaparken hangi ürünün ne kadarının
 * bağışa gittiğini görür ve buna göre seçebilir (SIRALA → "Bağış oranı").
 *
 * Düzen (yukarıdan aşağı):
 *   1. Sabit slim üst bar: geri + arama + filtre/sırala + kategori çip şeridi
 *      (başlık YOK — premium, sade)
 *   2. Kampanya/banner carousel — sayfanın EN ÜST görseli (premium coral hero'lar)
 *   3. Hızlı kategori kutucukları (ikon + ad)
 *   4. Yatay ürün şeritleri ("fırsat" rows): En Çok Bağış, İndirimdekiler,
 *      Öne Çıkanlar + en büyük kategoriler
 *   5. "Tüm Ürünler" ana grid (mevcut 2-kolon Trendyol grid)
 *
 * BAĞIŞ ORANI: resolveProductRate ASLA null dönmez — markaya özgü oran
 * bilinmiyorsa platform ortalaması gösterilir, böylece HER kartta rozet çıkar.
 *
 * PERFORMANS: bütün bölümler ZATEN ÇEKİLEN 120 ürün üzerinden client-side
 * türetilir (sort/filter/slice). Ek Firestore okuması yok.
 *
 * Veri kaynağı: COLLECTIONS.products (kanonik ürün kütüphanesi). Ürünler
 * `random` alanına göre rastgele başlangıçla çekilir (her ziyarette farklı vitrin).
 * Arama, kategori ve sıralama çekilen küme üzerinde uygulanır.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  ArrowDownUp,
  SlidersHorizontal,
  Check,
  HeartHandshake,
  Tag,
  Sparkles,
  ChevronRight,
  Shirt,
  Home,
  Smartphone,
  Baby,
  Dumbbell,
  Gem,
  Gift,
  Package,
  Store,
  X,
  Apple,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { DonationStrips } from '@/components/market/donation-strips';
import { BrandLogo } from '@/components/market/brand-logo';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import {
  collection,
  limit,
  query,
  orderBy,
  startAt,
  getCountFromServer,
} from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';
import { searchProducts, tokenize } from '@/lib/feed/search';
import type { Brand } from '@/lib/types';

type SortOption =
  | 'recommended' // varsayılan — feed rastgele sırası (popüler vitrin)
  | 'donationDesc' // bağış oranı yüksek → düşük (hangel imzası)
  | 'priceAsc' // fiyat artan
  | 'priceDesc' // fiyat azalan
  | 'popular'; // popülerlik (en yeni ingest — taze ürün proxy'si)

const SORT_LABELS: Record<SortOption, string> = {
  recommended: 'Önerilen',
  donationDesc: 'Bağış oranı (yüksek)',
  priceAsc: 'Fiyat (artan)',
  priceDesc: 'Fiyat (azalan)',
  popular: 'Popülerlik',
};

// Bir ürünün etkin fiyatı: indirimli fiyat varsa o, yoksa ana fiyat.
function effectivePrice(p: CanonicalProduct): number {
  return typeof p.salePrice === 'number' && p.salePrice > 0
    ? p.salePrice
    : p.price;
}

// İndirim yüzdesi (salePrice < price ise) — yoksa 0.
function discountPct(p: CanonicalProduct): number {
  if (typeof p.salePrice === 'number' && p.salePrice > 0 && p.salePrice < p.price) {
    return Math.round((1 - p.salePrice / p.price) * 100);
  }
  return 0;
}

// Bir ürünün hangi gruba ait olduğu: kategori → yoksa marka adı.
// Ham feed kategorisi uzun bir YOL olabilir ("Aksesuar>Kablolar, Dönüştürücüler
// ve Prizler" / "Telefon › Telefon Aksesuarları") → en geniş (ilk) segmenti alıp
// temizliyoruz; böylece çipler/kutucuklar kısa, okunur, Trendyol-vari olur.
// Anlamlı OLMAYAN genel kova kategorileri — gerçek ürün kategorisi değil, pazarlama
// etiketi (feed'de %40+ ürün "Kampanyalar" altında). Kategori şeritlerinde atlanır.
const CATEGORY_JUNK =
  /^(kampanya|kampanyalar|koleksiyon|koleksiyonlar|yeni|yeniler|fırsat|fırsatlar|set ürünler|outlet|tüm ürünler|indirim|öne çıkan|popüler|çok satan)/i;

function groupOf(p: CanonicalProduct): string {
  return realCategoryOf(p) || p.brandName?.trim() || '';
}

// Yalnız GERÇEK kategori (marka adına DÜŞMEZ). Kategori kutucukları/filtre
// listesi için: kategorisi olmayan ürünün marka adı "kategori" gibi
// görünmesin (ör. DAGİ/Intersport/Network kategori değildir).
// Ürünün GERÇEK (anlamlı) kategorisi: kategori yolunu `> › / ,` ayraçlarına böler,
// genel kova segmentlerini (Kampanyalar/Koleksiyonlar...) atlar, ilk anlamlı segmenti
// döndürür. Hepsi çöpse '' → o ürün kategori şeridine girmez.
function realCategoryOf(p: CanonicalProduct): string {
  const raw = p.category?.trim() || '';
  if (!raw) return '';
  const segs = raw.split(/[>›/,]/).map((s) => s.trim()).filter(Boolean);
  for (const s of segs) {
    if (!CATEGORY_JUNK.test(s)) return s;
  }
  return '';
}

// Yatay kaydırma şeritleri için yinelenen "scrollbar gizli" sınıf.
const NO_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

// Reklam banner'ı yapılacak SABİT markalar (sırayla). Katalogda + çalışan
// affiliate linki olanlar banner olur; onaysız/linksiz olan (ör. Samsung onay
// bekliyorsa) otomatik atlanır, offer onaylanınca kendiliğinden banner'a girer.
const PINNED_BANNER_BRANDS = ['ebebek', 'samsung', 'teknosa', 'ikea'];

// Logo kolajında öne çıkarılacak TANINMIŞ markalar (öncelik sırası).
const FAMOUS_PRIORITY = [
  'arçelik', 'beko', 'media markt', 'mediamarkt', 'puma', 'mango', 'boyner',
  'marks & spencer', 'h&m', 'teknosa', 'columbia', 'skechers', 'xiaomi',
  'huawei', 'network', 'gant', 'koton',
];
// Banner/kolaja KOYULMAYACAK dropship/lead/junk markalar.
const JUNK_BANNER = /advert store|vidyodan|\bcod\b|landers?|e-?book|e-?kitap|coupon|attribution|promo/i;

// Kategori adı → temsili ikon (Trendyol hızlı kutucukları gibi). Türkçe/İngilizce
// anahtar kelime eşlemesi; eşleşmezse genel "paket" ikonu.
function iconForCategory(name: string): React.ComponentType<{ className?: string }> {
  const n = name.toLocaleLowerCase('tr');
  if (/giyim|moda|tekstil|elbise|ayakkab|çanta|aksesuar|erkek|kadın|kadin|unisex/.test(n)) return Shirt;
  if (/ev|mobilya|dekor|mutfak|bahçe|yaşam/.test(n)) return Home;
  if (/elektronik|telefon|bilgisayar|teknoloji|tablet/.test(n)) return Smartphone;
  if (/bebek|çocuk|anne|oyuncak/.test(n)) return Baby;
  if (/spor|fitness|outdoor|kamp/.test(n)) return Dumbbell;
  if (/kozmetik|güzellik|bakım|takı|mücevher|saat/.test(n)) return Gem;
  return Package;
}

export default function DiscoverPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [onlyDiscounted, setOnlyDiscounted] = useState(false); // "İndirimli" hızlı süzgü

  // "Tüm Ürünler" grid'ine kaydırmak için (banner tıklaması).
  const allProductsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollToAll = () => {
    allProductsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Her yüklemede farklı `random` başlangıç noktası → vitrin rastgele gelir.
  // 0.8 tavanı: imleçten sonra her zaman bolca ürün kalır (limit dolar).
  const [randSeed, setRandSeed] = useState(0);
  useEffect(() => {
    setRandSeed(Math.random() * 0.8);
  }, []);

  // Katalogun GERÇEK toplam ürün sayısı (arama barı altında gösterilir).
  const [totalCount, setTotalCount] = useState<number | null>(null);
  useEffect(() => {
    if (!db) return;
    getCountFromServer(collection(db, COLLECTIONS.products))
      .then((snap) => setTotalCount(snap.data().count))
      .catch(() => {
        /* sessiz */
      });
  }, [db]);

  const productsQuery = useMemoFirebase(
    () =>
      query(
        collection(db, COLLECTIONS.products),
        orderBy('random'),
        startAt(randSeed),
        // Hız: başlangıçta 120 ürün yeter (şeritler + başlangıç grid'i). Önceden
        // 300 yükleniyordu → ilk açılış ağırdı. Arama/scroll'da daha fazlası gelir.
        limit(120),
      ),
    [db, randSeed],
  );
  const { data: products, isLoading } =
    useCollection<CanonicalProduct>(productsQuery);

  // Markaların bağış oranı — ürünün, linkine sahip olduğu markanın oranını kartta göster.
  // firestore brands + affiliate (api) brands birleşiminden brandId/brandName ile eşlenir.
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: firestoreBrands } = useCollection<Brand>(brandsQuery);
  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  useEffect(() => {
    fetch('/api/offers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Brand[]) => setApiBrands(Array.isArray(data) ? data : []))
      .catch(() => setApiBrands([]));
  }, []);
  // Platform varsayılan bağış oranı: yüklenen markaların oranlarının yuvarlanmış
  // ORTALAMASI (firestore + api birleşik). Hiç oran yoksa sabit %5'e düşer.
  const PLATFORM_DEFAULT_RATE = 5;
  const brandRate = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    let sum = 0;
    let count = 0;
    for (const b of [...(firestoreBrands || []), ...apiBrands]) {
      const r = Number(b?.donationRate);
      if (!b || !Number.isFinite(r) || r <= 0) continue;
      if (b.id) byId.set(b.id, r);
      if (b.name) byName.set(b.name.trim().toLowerCase(), r);
      sum += r;
      count += 1;
    }
    const average = count > 0 ? Math.round(sum / count) : PLATFORM_DEFAULT_RATE;
    return { byId, byName, average };
  }, [firestoreBrands, apiBrands]);
  // hangel modelinde her alışveriş bağış üretir; markaya özgü oran bilinmiyorsa
  // platform ortalaması gösterilir. Bu yüzden zincir asla null DÖNMEZ — her ürün
  // kartı bir bağış oranı gösterir.
  const resolveProductRate = (p: CanonicalProduct): number => {
    if (typeof p.donationRate === 'number' && p.donationRate > 0) return p.donationRate;
    if (p.brandId && brandRate.byId.has(p.brandId)) {
      return brandRate.byId.get(p.brandId) ?? brandRate.average;
    }
    const n = p.brandName?.trim().toLowerCase();
    if (n && brandRate.byName.has(n)) {
      return brandRate.byName.get(n) ?? brandRate.average;
    }
    return brandRate.average;
  };

  // Banner + logo kolajında gösterilecek markalar. "En yüksek bağış oranı"
  // sıralaması dropship/junk markaları (Advert Store, Vidyodan, COD ürünleri)
  // öne çıkarıyordu; bunun yerine TANINMIŞ markaları önceliklendirip kalanını
  // bağış oranına göre dolduruyoruz. İlk 2 marka reklam banner'ı olur.
  // Tüm gösterilebilir markalar (tekil, junk hariç): önce tanınmışlar, sonra
  // bağış oranına göre. topBrands (kolaj), brandStripItems (marka şeridi) ve
  // matchedBrands (marka araması) bundan türetilir.
  const rankedBrands = useMemo(() => {
    const all = [...(firestoreBrands || []), ...apiBrands].filter(
      (b) => b && b.name && Number.isFinite(Number(b.donationRate)) && Number(b.donationRate) > 0 && !JUNK_BANNER.test(b.name),
    );
    const seen = new Set<string>();
    const uniq: Brand[] = [];
    for (const b of all) {
      const nm = (b.name || '').trim().toLowerCase();
      if (!nm || seen.has(nm)) continue;
      seen.add(nm);
      uniq.push(b);
    }
    const famous: Brand[] = [];
    for (const key of FAMOUS_PRIORITY) {
      const hit = uniq.find((b) => {
        const nm = (b.name || '').trim().toLowerCase();
        return nm === key || nm.includes(key);
      });
      if (hit && !famous.includes(hit)) famous.push(hit);
    }
    const rest = uniq.filter((b) => !famous.includes(b)).sort((a, b) => Number(b.donationRate) - Number(a.donationRate));
    return [...famous, ...rest];
  }, [firestoreBrands, apiBrands]);

  const topBrands = useMemo(() => rankedBrands.slice(0, 6), [rankedBrands]);
  const brandStripItems = useMemo(() => rankedBrands.slice(0, 20), [rankedBrands]);

  // Marka araması — arama metni bir marka adıyla eşleşirse o markayı öne çıkar
  // (önce markanın kartı/sayfası, sonra ürünler). Token bazlı esnek eşleşme.
  const matchedBrands = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return rankedBrands
      .filter((b) => {
        const nm = (b.name || '').toLowerCase();
        return nm.includes(term) || term.includes(nm);
      })
      .slice(0, 8);
  }, [rankedBrands, searchTerm]);

  // Kategori filtresi: yalnız ürünün GERÇEK `category` alanından türetilir.
  // Marka adına düşmez — marka adları kategori olarak gösterilmez (markalara
  // "Tüm Markalar" / /market/brands üzerinden erişilir).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products || []) {
      const cat = realCategoryOf(p);
      if (cat) set.add(cat);
    }
    return ['Tümü', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [products]);

  // En büyük GERÇEK kategoriler (ürün sayısına göre) — hızlı kutucuklar + şeritler.
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products || []) {
      const cat = realCategoryOf(p);
      if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [products]);

  // Sunucu-taraflı TAM KATALOG araması: kullanıcı arama yaptığında yüklenen 120
  // vitrin ürünü değil, 85k ürünün tamamı `searchTokens` üzerinden taranır — ürün
  // veya marka hangi mağazada olursa olsun bulunur (ör. "adidas superstar ih8659").
  const [serverResults, setServerResults] = useState<CanonicalProduct[] | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || !db) {
      setServerResults(null);
      setSearchBusy(false);
      return;
    }
    setSearchBusy(true);
    let cancelled = false;
    const t = setTimeout(() => {
      searchProducts(db, { text: term, max: 200 })
        .then((r) => { if (!cancelled) setServerResults(r); })
        .catch(() => { if (!cancelled) setServerResults([]); })
        .finally(() => { if (!cancelled) setSearchBusy(false); });
    }, 300); // debounce
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchTerm, db]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim();

    // Arama varsa: tüm katalogdan gelen sonuçlar (markadan/kategoriden bağımsız).
    if (term) {
      const tokens = tokenize(term);
      const tokenSet = new Set(tokens);
      const matchCount = (p: CanonicalProduct) =>
        (p.searchTokens || []).reduce((n, t) => (tokenSet.has(t) ? n + 1 : n), 0);
      const cands = serverResults || [];
      const maxScore = cands.reduce((m, p) => Math.max(m, matchCount(p)), 0);

      // Yalnız EN İYİ ALAKA katmanını göster. Çok kelimeli sorguda tek bir ortak
      // kelimeye düşen gürültüyü gizle (ör. "nike ayakkabı" → nike yoksa, sadece
      // "ayakkabı"ya eşleşen alakasız ürünler GÖSTERİLMEZ). Tek kelimelik sorgu
      // ya da 2+ token eşleşmesi geçerli sayılır.
      const relevant = maxScore === tokens.length || maxScore >= 2;
      let best = relevant ? cands.filter((p) => matchCount(p) === maxScore) : [];

      // Aynı ürün tekrarını (başlık+marka) sadeleştir; FARKLI mağaza korunur ki
      // "hangi mağazada olursa olsun" hepsi görünsün.
      const seen = new Set<string>();
      best = best.filter((p) => {
        const k = `${(p.title || '').toLowerCase().trim()}|${(p.brandName || '').toLowerCase().trim()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // "İndirimli" hızlı süzgü — yalnız indirimli ürünler.
      if (onlyDiscounted) best = best.filter((p) => discountPct(p) > 0);
      // Hızlı süzgü pill'leri arama sonuçlarında da çalışsın (sortBy'a uy);
      // varsayılan (recommended/donationDesc) → EN ÇOK BAĞIŞ YAPAN başta.
      switch (sortBy) {
        case 'priceAsc':
          best.sort((a, b) => effectivePrice(a) - effectivePrice(b));
          break;
        case 'priceDesc':
          best.sort((a, b) => effectivePrice(b) - effectivePrice(a));
          break;
        case 'popular':
          best.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
          break;
        default:
          best.sort((a, b) => resolveProductRate(b) - resolveProductRate(a));
          break;
      }
      return best;
    }

    // Arama yokken: yüklenen vitrin + kategori filtresi + seçili sıralama.
    let list = [...(products || [])];
    if (activeCategory !== 'Tümü') {
      list = list.filter((p) => groupOf(p) === activeCategory);
    }
    if (onlyDiscounted) list = list.filter((p) => discountPct(p) > 0);
    switch (sortBy) {
      case 'donationDesc':
        list.sort((a, b) => resolveProductRate(b) - resolveProductRate(a));
        break;
      case 'priceAsc':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case 'priceDesc':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case 'popular':
        // Popülerlik proxy'si: en yeni ingest edilen ürün (updatedAt) en üstte.
        list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
        break;
      default:
        // 'recommended' → feed'in rastgele `random` sırası korunur (vitrin).
        break;
    }
    return list;
    // resolveProductRate, brandRate'e bağlı; brandRate değişince yeniden hesap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, serverResults, activeCategory, searchTerm, sortBy, onlyDiscounted, brandRate]);

  const hasFilters =
    searchTerm.trim() !== '' ||
    activeCategory !== 'Tümü' ||
    sortBy !== 'recommended' ||
    onlyDiscounted;

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('Tümü');
    setSortBy('recommended');
    setOnlyDiscounted(false);
  };

  // Hızlı süzgü pill'leri — arama barı altında (Trendyol "Flaş Ürünler" tarzı).
  // Her biri toggle: aktifse kapatır. İndirimli ayrı bir filtre; diğerleri sıralama.
  const quickFilters: { key: string; label: string; active: boolean; onClick: () => void }[] = [
    {
      key: 'discount',
      label: 'İndirimli ürünler',
      active: onlyDiscounted,
      onClick: () => setOnlyDiscounted((v) => !v),
    },
    {
      key: 'donation',
      label: 'En çok bağış yapanlar',
      active: sortBy === 'donationDesc',
      onClick: () => setSortBy((s) => (s === 'donationDesc' ? 'recommended' : 'donationDesc')),
    },
    {
      key: 'price',
      label: 'Uygun fiyat',
      active: sortBy === 'priceAsc',
      onClick: () => setSortBy((s) => (s === 'priceAsc' ? 'recommended' : 'priceAsc')),
    },
    {
      key: 'new',
      label: 'Yeni gelenler',
      active: sortBy === 'popular',
      onClick: () => setSortBy((s) => (s === 'popular' ? 'recommended' : 'popular')),
    },
  ];

  // ── Vitrin şeritleri — hepsi ÇEKİLEN ürünlerden client-side türetilir ──

  // En Çok Yüzdeyle Bağış Yapanlar: çözülen bağış ORANI (%) yüksek → düşük.
  const topDonationStrip = useMemo(() => {
    return (products || [])
      .map((p) => ({ p, r: resolveProductRate(p) }))
      .sort((a, b) => b.r - a.r)
      .slice(0, 21)
      .map((x) => x.p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, brandRate]);

  // En Çok Tutarla Bağış Yapanlar: mutlak bağış TUTARI (₺) = oran × geçerli fiyat,
  // yüksek → düşük. Pahalı + oranı iyi ürünler öne çıkar (kuruşça en çok bağış).
  const topDonationAmountStrip = useMemo(() => {
    return (products || [])
      .map((p) => ({ p, amt: (resolveProductRate(p) / 100) * effectivePrice(p) }))
      .filter((x) => x.amt > 0)
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 21)
      .map((x) => x.p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, brandRate]);

  // İndirimdekiler: salePrice < price, indirim yüzdesi yüksek → düşük.
  const dealsStrip = useMemo(() => {
    return (products || [])
      .filter((p) => discountPct(p) > 0)
      .sort((a, b) => discountPct(b) - discountPct(a))
      .slice(0, 21);
  }, [products]);

  // Öne Çıkanlar / Sana Özel: rastgele başlangıç sırasından bir dilim.
  // `random` sırası zaten karışık geldiği için ortadan bir dilim alıyoruz.
  const featuredStrip = useMemo(() => {
    const list = products || [];
    const start = Math.min(20, Math.max(0, list.length - 21));
    return list.slice(start, start + 21);
  }, [products]);

  // Kategori ürün şeritleri (filtre yokken gösterilir) — En Çok Bağış/İndirim/
  // Öne Çıkanlar'dan sonra her kategori ayrı satır olur. Render ≥3 ürünlü olanları
  // gösterir; az ürünlü kategoriler atlanır.
  const categoryStrips = useMemo(() => {
    return topCategories.slice(0, 20).map((cat) => ({
      name: cat,
      items: (products || []).filter((p) => groupOf(p) === cat).slice(0, 21),
    }));
  }, [topCategories, products]);

  // Hızlı kategori kutucukları — en büyük 8 kategori (Trendyol home tiles).
  const quickTiles = useMemo(() => topCategories.slice(0, 8), [topCategories]);

  // Kampanya banner'ları — premium, Apple-kimlikli pazarlama hero'ları.
  // Tıklayınca ilgili şeride/filtreye yönlendirir (onClick korunur).
  type Banner = {
    key: string;
    eyebrow: string; // küçük üst etiket (kicker) — marka banner'ında marka adı
    title: string;
    subtitle: string;
    cta: string; // CTA chip metni
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    onClick?: () => void;
    href?: string; // verilirse banner <Link> olur (marka sayfasına gider)
    showBrandLogos?: boolean;
    coverImage?: string; // markanın kurumsal kapak görseli → arka plan
    brand?: Brand; // marka (logo + kurumsal kimlik için)
  };
  // Sabitlenen markaların (PINNED_BANNER_BRANDS) reklam banner'ı — yalnız
  // katalogda bulunan + çalışan affiliate linki olanlar. Her biri kendi kurumsal
  // kimliğinde: kapak görseli (varsa) arka plan + logosu + kampanya; markaya gider.
  const pinnedBannerBrands = useMemo(() => {
    const pool = [...apiBrands, ...(firestoreBrands || [])];
    const out: Brand[] = [];
    for (const key of PINNED_BANNER_BRANDS) {
      const hit = pool.find((b) => {
        const nm = (b?.name || '').trim().toLowerCase();
        return !!b?.link && (nm === key || nm.includes(key));
      });
      if (hit && !out.some((o) => o.id === hit.id)) out.push(hit);
    }
    return out;
  }, [apiBrands, firestoreBrands]);

  // Banner markasının ürünlerindeki EN BÜYÜK indirim oranını çek (alt satırda
  // "%X'e varan indirim" göstermek için). Marka feed'de yoksa 0 → indirim satırı atlanır.
  const [brandMaxDiscount, setBrandMaxDiscount] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!db || pinnedBannerBrands.length === 0) return;
    let cancelled = false;
    Promise.all(
      pinnedBannerBrands.map(async (b) => {
        try {
          const prods = await searchProducts(db, { brandName: b.name, max: 200 });
          const mx = prods.reduce((m, p) => Math.max(m, discountPct(p)), 0);
          return [b.id, mx] as const;
        } catch {
          return [b.id, 0] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setBrandMaxDiscount(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [db, pinnedBannerBrands]);

  // Apple banner indirimi: katalogdaki Apple ürünlerinin EN YÜKSEK indirim oranı.
  const [appleMaxDiscount, setAppleMaxDiscount] = useState(0);
  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    searchProducts(db, { brandName: 'Apple', max: 200 })
      .then((prods) => { if (!cancelled) setAppleMaxDiscount(prods.reduce((m, p) => Math.max(m, discountPct(p)), 0)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [db]);

  const brandBanners: Banner[] = pinnedBannerBrands.map((b) => {
    const rate = Math.round(Number(b.donationRate));
    const disc = brandMaxDiscount[b.id] ?? 0;
    return {
    key: `brand-${b.id}`,
    eyebrow: b.name,
    title: disc > 0 ? `%${disc} indirim · %${rate} bağış` : `%${rate} bağış`,
    subtitle: '',
    cta: 'Markaya git',
    icon: Tag,
    gradient: 'from-zinc-900 via-zinc-800 to-zinc-700',
    href: `/market/${b.id}`,
    coverImage: b.coverPhotoUrl || undefined,
    brand: b,
    };
  });
  const banners: Banner[] = [
    // İlk banner: Apple — anlaşmalı katalogdaki Apple ürünleri (karışık) → /market/apple.
    // Apple kurumsal kimliği (siyah hero) + hem indirim hem bağış.
    {
      key: 'apple',
      eyebrow: 'Apple',
      title: appleMaxDiscount > 0 ? `%${appleMaxDiscount} indirim · %5 bağış` : '%5 bağış',
      subtitle: '',
      cta: "Apple'ı keşfet",
      icon: Apple,
      gradient: 'from-zinc-900 via-neutral-800 to-black',
      href: '/market/apple',
      // GERÇEK Apple logosu — BrandLogo targetDomain'den (apple.com) çeker.
      brand: { id: 'apple', name: 'Apple', slug: 'apple', targetDomain: 'apple.com', donationRate: 5 } as Brand,
    },
    ...brandBanners,
    {
      key: 'donation',
      eyebrow: '#wearehangel',
      title: 'Her alışveriş bir bağış',
      subtitle: 'En yüksek bağış oranlı markaları keşfet, umudu birlikte büyütelim.',
      cta: 'Markaları keşfet',
      icon: HeartHandshake,
      gradient: 'from-[#f34723] via-orange-500 to-amber-500',
      onClick: () => setSortBy('donationDesc'),
      showBrandLogos: true,
    },
    {
      key: 'deals',
      eyebrow: 'Fırsatlar',
      title: 'İndirimdeki ürünler',
      subtitle: 'Hem kazan hem bağış yap — sınırlı süre.',
      cta: 'Fırsatları gör',
      icon: Tag,
      gradient: 'from-orange-500 via-[#f34723] to-rose-500',
      onClick: scrollToAll,
    },
    {
      key: 'featured',
      eyebrow: 'Sana özel',
      title: 'Öne çıkan ürünler',
      subtitle: 'Senin için seçtiğimiz, iyiliğe dokunan ürünler.',
      cta: 'Hemen keşfet',
      icon: Sparkles,
      gradient: 'from-rose-500 via-[#f34723] to-orange-500',
      onClick: scrollToAll,
    },
  ];

  const showSections = !hasFilters && !isLoading && (products?.length ?? 0) > 0;

  return (
    <div className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden bg-secondary/30">
      {/* ── 1. Üst slim bar — geri + arama + Markalar + filtre/sırala (başlık YOK).
          top-0: scroll-container'ın tepesi zaten header'ın (48px) ALTINDA başlıyor,
          dolayısıyla top-0 bar'ı header'ın hemen altına yapıştırır — boşluk bırakmaz
          + scroll'da görünür kalır. (top-12 burada 48px FAZLA boşluk yaratıyordu.) ── */}
      <div className="sticky top-0 z-20 w-full max-w-full shrink-0 space-y-2.5 overflow-x-hidden border-b border-border bg-background px-4 py-2.5">
        <div className="flex w-full items-center gap-2">
          {/* Market kök sekme — geri butonu yok (bottom-nav ile gezilir). */}
          {/* Arama — pazaryeri tarzı belirgin pill (büyüteç + temizle). */}
          <div className="relative min-w-0 flex-grow">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              inputMode="search"
              enterKeyHint="search"
              placeholder={
                rankedBrands.length > 0
                  ? `${(totalCount ?? products?.length ?? 0).toLocaleString('tr-TR')} ürün veya ${rankedBrands.length.toLocaleString('tr-TR')} markada ara`
                  : 'Ürün veya marka ara'
              }
              className="h-12 rounded-full border border-border bg-background pl-12 pr-10 text-base shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Aramayı temizle"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Kategori filtre */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-full border border-border bg-background shadow-sm"
                aria-label="Kategori filtrele"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto rounded-2xl">
              <DropdownMenuLabel>Kategori</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex items-center justify-between gap-2',
                    activeCategory === cat && 'font-bold text-primary',
                  )}
                >
                  <span className="truncate">{cat}</span>
                  {activeCategory === cat && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sırala */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-full border border-border bg-background shadow-sm"
                aria-label="Sırala"
              >
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sırala</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={cn(
                    'flex items-center justify-between gap-2',
                    sortBy === opt && 'font-bold text-primary',
                  )}
                >
                  <span>{SORT_LABELS[opt]}</span>
                  {sortBy === opt && <Check className="h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ürün sayısı — HER ZAMAN arama barının altında: aramada eşleşme sayısı,
            normal vitrinde katalogdaki toplam ürün sayısı. */}
        <p className="px-1 text-xs font-semibold text-muted-foreground">
          {searchBusy
            ? 'Aranıyor…'
            : hasFilters
              ? `${filtered.length.toLocaleString('tr-TR')} ürün listeleniyor`
              : `${(totalCount ?? products?.length ?? 0).toLocaleString('tr-TR')} ürün`}
        </p>

        {/* Hızlı süzgüler — YALNIZ arama yapıldığında, sonuçların üzerinde görünür
            (normal vitrinde gösterilmez; orada zaten "En Çok Bağış/İndirim" şeritleri var). */}
        {searchTerm.trim() !== '' && (
          <div className={cn('flex w-full min-w-0 items-center gap-2 overflow-x-auto py-0.5', NO_SCROLLBAR)}>
            {quickFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={f.onClick}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                  f.active
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-background text-foreground hover:bg-muted/60',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ── 2. Kategori çip şeridi (yatay kaydırma) — w-full min-w-0 ile
            kapsayıcıya sınırlı; negatif margin YOK ki viewport'u taşırıp
            sayfayı yatay kaydırmasın. ── */}
        {(products?.length ?? 0) > 0 && (
          <div className={cn('flex w-full min-w-0 items-center gap-2 overflow-x-auto py-0.5', NO_SCROLLBAR)}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Aktif filtre özeti + temizle */}
        {hasFilters && (
          <div className={cn('flex w-full min-w-0 items-center gap-2 overflow-x-auto', NO_SCROLLBAR)}>
            {sortBy !== 'recommended' && (
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {SORT_LABELS[sortBy]}
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* ── Kaydırılabilir gövde — w-full max-w-full + overflow-x-hidden:
          içerideki yatay şeritler kendi kayar, sayfa bloğu yatay kaymaz. ── */}
      <main ref={mainRef} className="w-full max-w-full overflow-x-hidden pb-32">
        {isLoading && (!products || products.length === 0) ? (
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(8)].map((_, i) => (
              <Card key={i} variant="glass" className="h-72 animate-pulse" />
            ))}
          </div>
        ) : (products?.length ?? 0) === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ShoppingBag}
              title="Ürün bulunamadı"
              description="Henüz listelenecek ürün yok. Yakında burada olacaklar."
            />
          </div>
        ) : (
          <>
            {showSections && (
              <>
                {/* ── 3. Kampanya / banner carousel — sayfanın EN ÜST görseli.
                    Premium Apple-kimlikli hero'lar: katmanlı derinlik (gradient +
                    blur orb'lar), büyük tipografi, CTA chip, marka logo kolajı. ── */}
                <section className="w-full max-w-full pt-2">
                  <div
                    className={cn(
                      'flex w-full min-w-0 gap-2 overflow-x-auto px-4 py-2 snap-x snap-mandatory',
                      NO_SCROLLBAR,
                    )}
                  >
                    {banners.map((b) => {
                      const Icon = b.icon;
                      const cls = cn(
                        'group relative flex h-[72px] w-[90vw] max-w-[calc(100vw-2rem)] shrink-0 snap-start overflow-hidden rounded-2xl p-2.5 text-left text-white shadow-lg shadow-primary/20 ring-1 ring-white/10 transition-transform active:scale-[0.985] sm:w-[440px] sm:max-w-none',
                        b.coverImage ? 'bg-zinc-900' : cn('bg-gradient-to-br', b.gradient),
                      );
                      const content = (
                        <>
                          {b.coverImage ? (
                            <>
                              {/* Markanın kurumsal kapak görseli + okunabilirlik için koyu overlay */}
                              <img
                                src={b.coverImage}
                                alt={b.eyebrow}
                                referrerPolicy="no-referrer"
                                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                              />
                              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
                            </>
                          ) : (
                            <>
                              <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
                            </>
                          )}

                          {/* Yatay düzen: logo + TEK SATIR kazanım (eyebrow + "%X indirim · %Y bağış"); sağda köşe ikonu. */}
                          <div className="relative flex h-full w-full items-center gap-2.5 pr-8">
                            {b.brand ? (
                              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-2 ring-white/70">
                                <BrandLogo brand={b.brand} padding="p-1" />
                              </span>
                            ) : b.showBrandLogos && topBrands.length > 0 ? (
                              <div className="flex shrink-0 items-center -space-x-2">
                                {topBrands.slice(0, 3).map((brand) => (
                                  <span
                                    key={brand.id}
                                    className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-2 ring-white"
                                  >
                                    <BrandLogo brand={brand} />
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-bold uppercase tracking-wide text-white/70">
                                {b.eyebrow}
                              </p>
                              <p className="truncate text-base font-black leading-tight drop-shadow-sm">
                                {b.title}
                              </p>
                            </div>
                          </div>
                          {/* Sağ-alt köşe ikonu */}
                          <span className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </>
                      );
                      return b.href ? (
                        <Link key={b.key} href={b.href} className={cls}>
                          {content}
                        </Link>
                      ) : (
                        <button key={b.key} type="button" onClick={b.onClick} className={cls}>
                          {content}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tüm MARKALAR — market'teki BÜTÜN ürün markalarını (Nike, Apple, Ülker...)
                      /market/brands/all açar. "Mağazalar" şeridinin "Tümü"sü ise /market/brands
                      (satıcılar). Marka ≠ Mağaza. */}
                  <div className="px-4 pt-1">
                    <Button
                      asChild
                      className="h-12 w-full rounded-2xl bg-primary text-white shadow-sm hover:bg-primary/90"
                    >
                      <Link
                        href="/market/brands/all"
                        className="flex items-center justify-center gap-2 text-sm font-bold text-white"
                      >
                        <Store className="h-5 w-5" />
                        Tüm Markalar
                      </Link>
                    </Button>
                  </div>
                </section>

                {/* ── 4. Hızlı kategori kutucukları ── */}
                {quickTiles.length > 0 && (
                  <section className="px-4 pt-5">
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                      {quickTiles.map((cat) => {
                        const Icon = iconForCategory(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                              <Icon className="h-6 w-6" />
                            </span>
                            <span className="line-clamp-2 max-w-[64px] text-center text-[11px] font-semibold leading-tight text-foreground">
                              {cat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* ── 5. Yatay ürün şeritleri ── */}
                <ProductStrip
                  title="En Çok Yüzdeyle Bağış Yapanlar"
                  emoji="🧡"
                  items={topDonationStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={() => setSortBy('donationDesc')}
                />
                <ProductStrip
                  title="En Çok Tutarla Bağış Yapanlar"
                  emoji="💰"
                  items={topDonationAmountStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={scrollToAll}
                />
                <ProductStrip
                  title="İndirimdekiler"
                  icon={Tag}
                  items={dealsStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={scrollToAll}
                />
                {/* Mağaza kartları şeridi (3 ajanstan gelen satıcılar) — Öne Çıkanlar'ın ÜZERİNDE.
                    NOT: bunlar MAĞAZA (Media Markt, Sportive...); ürün MARKALARI (Nike, Apple)
                    "Tüm Markalar" butonunda (/market/brands/all). */}
                <BrandStrip title="Mağazalar" items={brandStripItems} band />
                <ProductStrip
                  title="Öne Çıkanlar"
                  icon={Sparkles}
                  items={featuredStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={scrollToAll}
                />
                {categoryStrips.map((strip) =>
                  strip.items.length >= 3 ? (
                    <ProductStrip
                      key={strip.name}
                      title={strip.name}
                      icon={Gift}
                      items={strip.items}
                      resolveRate={resolveProductRate}
                      onSeeAll={() => setActiveCategory(strip.name)}
                    />
                  ) : null,
                )}
              </>
            )}

            {/* Mağaza araması — arama bir mağazayla (satıcı) eşleşirse o mağazanın
                kartı ürünlerin ÜSTÜNDE çıkar. */}
            {matchedBrands.length > 0 && (
              <BrandStrip title="Mağaza" items={matchedBrands} showSeeAll={false} />
            )}

            {/* ── 6. "Tüm Ürünler" ana grid ── */}
            <section ref={allProductsRef} className="px-4 pt-6 scroll-mt-4">
              {/* Kategori/filtre görünümünde de bağış şeritleri (Yüzdeyle + Tutarla),
                  o sonuç kümesine göre. Az sonuçta gösterme (grid'le mükerrer olmasın). */}
              {hasFilters && filtered.length >= 8 && (
                <DonationStrips products={filtered} resolveRate={resolveProductRate} className="mb-6" />
              )}
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-foreground">
                  {hasFilters ? 'Sonuçlar' : 'Tüm Ürünler'}
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {filtered.length.toLocaleString('tr-TR')} ürün
                </span>
              </div>

              {searchBusy && filtered.length === 0 ? (
                <div className="py-16 text-center text-sm font-semibold text-muted-foreground">
                  Tüm mağazalarda aranıyor…
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Ürün bulunamadı"
                  description="Aramana uygun ürün yok. Filtreleri temizleyip tekrar dene."
                  action={{ label: 'Filtreleri temizle', onClick: resetFilters }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      donationRate={resolveProductRate(product)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Trendyol "fırsat" satırı — başlık + yatay kaydırmalı kompakt ürün kartları.
 * Her kart bağış oranı rozetiyle (resolveRate) gelir.
 */
function ProductStrip({
  title,
  emoji,
  icon: Icon,
  items,
  resolveRate,
  onSeeAll,
}: {
  title: string;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: CanonicalProduct[];
  resolveRate: (p: CanonicalProduct) => number;
  onSeeAll?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="w-full max-w-full pt-6">
      <div className="mb-2.5 flex items-center justify-between gap-2 px-4">
        <h2 className="flex min-w-0 items-center gap-1.5 text-base font-black text-foreground">
          {emoji ? <span aria-hidden="true">{emoji}</span> : null}
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary"
          >
            Tümü <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className={cn('flex w-full min-w-0 gap-2.5 overflow-x-auto px-4 pb-1', NO_SCROLLBAR)}>
        {items.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={p} donationRate={resolveRate(p)} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Marka kartı — logo + ad + bağış oranı; markanın sayfasına gider.
function BrandCard({ brand }: { brand: Brand }) {
  const rate = Math.round(Number(brand.donationRate)) || 0;
  return (
    <Link href={`/market/${brand.slug || brand.id}`} className="block w-36 shrink-0 sm:w-40">
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white ring-1 ring-border">
          <BrandLogo brand={brand} />
        </div>
        <p className="mt-2 w-full truncate text-center text-sm font-bold text-foreground">{brand.name}</p>
        {rate > 0 && <p className="text-center text-xs font-bold text-primary">%{rate} bağış</p>}
      </div>
    </Link>
  );
}

// Marka şeridi — ürün şeritleriyle AYNI yatay format, marka kartlarıyla.
// band=true → mağaza kutucukları narçiçeği (marka) bir bandın İÇİNDE yatay kaydırılır;
// diğer ürün şeritlerinden görsel olarak ayrışır.
function BrandStrip({ title, items, showSeeAll = true, band = false }: { title: string; items: Brand[]; showSeeAll?: boolean; band?: boolean }) {
  if (items.length === 0) return null;
  const header = (
    <div className="mb-2.5 flex items-center justify-between gap-2 px-4">
      <h2 className={cn('flex min-w-0 items-center gap-1.5 text-base font-black', band ? 'text-white' : 'text-foreground')}>
        <Store className={cn('h-4 w-4 shrink-0', band ? 'text-white' : 'text-primary')} aria-hidden="true" />
        <span className="truncate">{title}</span>
      </h2>
      {showSeeAll && (
        <Link href="/market/shops" className={cn('inline-flex shrink-0 items-center gap-0.5 text-xs font-bold', band ? 'text-white/90 hover:text-white' : 'text-primary')}>
          Tümü <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
  const row = (
    <div className={cn('flex w-full min-w-0 gap-2.5 overflow-x-auto px-4 pb-1', NO_SCROLLBAR)}>
      {items.map((b) => (
        <BrandCard key={b.id} brand={b} />
      ))}
    </div>
  );
  if (band) {
    return (
      <section className="w-full max-w-full pt-6">
        <div className="mx-3 rounded-[1.75rem] bg-gradient-to-br from-[#f34723] to-[#ff7d4d] py-4 shadow-md shadow-primary/25">
          {header}
          {row}
        </div>
      </section>
    );
  }
  return (
    <section className="w-full max-w-full pt-6">
      {header}
      {row}
    </section>
  );
}
