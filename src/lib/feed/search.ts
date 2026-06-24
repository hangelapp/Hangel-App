/**
 * Faz 4 — ürün arama soyutlaması.
 *
 * Firestore tabanlı tam-katalog arama: her ürün dokümanında `searchTokens`
 * dizisi (başlık + marka + kategoriden türetilmiş kelime/kod token'ları) tutulur
 * ve `array-contains-any` ile sorgulanır. Böylece 85k+ ürün içinde marka adı,
 * ürün adı veya SKU/model kodu (ör. "ih8659") ile arama yapılabilir — kullanıcı
 * hangi markada olursa olsun eşleşen ürünleri görür. 100k+'ta aynı `searchProducts`
 * imzası korunarak Algolia/Typesense'e geçilebilir (sadece bu dosya değişir).
 */
import { collection, getDocs, getCountFromServer, query, where, limit as fbLimit, type Firestore } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from './types';

/**
 * Metni arama token'larına böler: küçük harf (tr), alfasayısal olmayan ayraçlardan
 * böl, 2+ karakterli benzersiz parçalar. Marka/başlık/kategori/açıklama + SKU dahil.
 * Firestore array alanı şişmesin diye en fazla `max` token tutulur (ilk gelenler
 * korunur → başlık/marka açıklamadan önce gelir).
 */
export function tokenize(text: string, max = 40): string[] {
  if (!text) return [];
  const lower = text.toLocaleLowerCase('tr');
  const parts = lower.split(/[^a-z0-9ğüşıöç]+/i).filter((t) => t && t.length >= 2);
  return Array.from(new Set(parts)).slice(0, max);
}

/**
 * Bir ürün için searchTokens dizisi — başlık + marka + (varsa) kategori + açıklama.
 * Açıklama da dahil edildiği için kullanıcı "polo yaka" gibi yalnız açıklamada geçen
 * özellikleri de arayabilir. Başlık/marka önce gelir; açıklama token'ları cap'e
 * kadar eklenir (en fazla 80).
 */
export function searchTokensFor(p: { title?: string; brandName?: string; category?: string | null; description?: string | null }): string[] {
  return tokenize(`${p.title ?? ''} ${p.brandName ?? ''} ${p.category ?? ''} ${p.description ?? ''}`, 80);
}

export interface ProductSearchParams {
  brandId?: string;
  brandName?: string;
  category?: string;
  text?: string;
  max?: number;
}

/**
 * Ürün araması (tüm katalog). `text` verilirse `searchTokens` üzerinden eşleşen
 * TÜM token'ları içeren ürünleri döndürür (AND mantığı):
 *  - Tek token → array-contains.
 *  - Çok token → en NADİR token'ı (count ile) bulur, onunla çeker, kalan
 *    token'ları istemcide AND-filtreler. Böylece yaygın bir kelime (ör. "yaka")
 *    yüzünden gerçek eşleşmeler (ör. "polo yaka") kaçmaz.
 * Bağış oranına göre nihai sıralama çağıranda yapılır.
 */
export async function searchProducts(db: Firestore, params: ProductSearchParams): Promise<CanonicalProduct[]> {
  const txt = params.text?.trim();
  const max = params.max ?? 60;
  const col = collection(db, COLLECTIONS.products);

  if (txt) {
    const tokens = tokenize(txt);
    if (tokens.length === 0) return [];

    if (tokens.length === 1) {
      const snap = await getDocs(query(col, where('searchTokens', 'array-contains', tokens[0]), fbLimit(Math.max(max, 200))));
      return snap.docs.map((d) => d.data() as CanonicalProduct);
    }

    // En nadir token'ı seç (her token'ın eşleşme sayısını paralel say).
    const counts = await Promise.all(
      tokens.map((t) =>
        getCountFromServer(query(col, where('searchTokens', 'array-contains', t)))
          .then((s) => ({ t, c: s.data().count }))
          .catch(() => ({ t, c: Number.POSITIVE_INFINITY })),
      ),
    );
    const rarest = counts.sort((a, b) => a.c - b.c)[0].t;

    // Nadir token'la geniş çek, diğer token'ları AND-filtrele.
    const snap = await getDocs(query(col, where('searchTokens', 'array-contains', rarest), fbLimit(600)));
    const need = new Set(tokens);
    const items = snap.docs
      .map((d) => d.data() as CanonicalProduct)
      .filter((p) => {
        const s = new Set(p.searchTokens || []);
        for (const t of need) if (!s.has(t)) return false;
        return true;
      });
    return items.slice(0, Math.max(max, 200));
  }

  // Metin yoksa marka/kategori filtresi (eski davranış).
  const clauses = [];
  if (params.brandId) clauses.push(where('brandId', '==', params.brandId));
  else if (params.brandName) clauses.push(where('brandName', '==', params.brandName));
  const snap = await getDocs(query(col, ...clauses, fbLimit(max)));
  let items = snap.docs.map((d) => d.data() as CanonicalProduct);
  const cat = params.category?.toLowerCase();
  if (cat) items = items.filter((p) => (p.category || '').toLowerCase().includes(cat));
  return items;
}
