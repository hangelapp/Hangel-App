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
import { collection, getDocs, query, where, limit as fbLimit, type Firestore } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from './types';

/**
 * Metni arama token'larına böler: küçük harf (tr), alfasayısal olmayan ayraçlardan
 * böl, 2+ karakterli benzersiz parçalar. Marka/başlık/kategori + SKU kodları dahil.
 * Firestore array alanı şişmesin diye en fazla 40 token tutulur.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const lower = text.toLocaleLowerCase('tr');
  const parts = lower.split(/[^a-z0-9ğüşıöç]+/i).filter((t) => t && t.length >= 2);
  return Array.from(new Set(parts)).slice(0, 40);
}

/** Bir ürün için searchTokens dizisi — başlık + marka + (varsa) kategori. */
export function searchTokensFor(p: { title?: string; brandName?: string; category?: string | null }): string[] {
  return tokenize(`${p.title ?? ''} ${p.brandName ?? ''} ${p.category ?? ''}`);
}

export interface ProductSearchParams {
  brandId?: string;
  brandName?: string;
  category?: string;
  text?: string;
  max?: number;
}

/**
 * Ürün araması. `text` verilirse tüm katalogda `searchTokens` üzerinden
 * (array-contains-any, en fazla 10 token) eşleşenleri çeker ve istemcide
 * ALAKAYA (eşleşen token sayısı) göre sıralar. Bağış oranına göre nihai sıralama
 * çağıran tarafta yapılır (markaların oranı orada çözülür).
 */
export async function searchProducts(db: Firestore, params: ProductSearchParams): Promise<CanonicalProduct[]> {
  const txt = params.text?.trim();
  const max = params.max ?? 60;

  if (txt) {
    const tokens = tokenize(txt);
    if (tokens.length === 0) return [];
    // array-contains-any en fazla 10 değer kabul eder.
    const q = query(
      collection(db, COLLECTIONS.products),
      where('searchTokens', 'array-contains-any', tokens.slice(0, 10)),
      fbLimit(Math.max(max, 200)),
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as CanonicalProduct);
    // Alaka: eşleşen token sayısı (çok eşleşen = aranan ürün). Nihai bağış
    // sıralaması çağıranda yapılır; burada yalnız alakaya göre dizilir.
    const tokenSet = new Set(tokens);
    const score = (p: CanonicalProduct) => (p.searchTokens || []).reduce((n, t) => (tokenSet.has(t) ? n + 1 : n), 0);
    return items.sort((a, b) => score(b) - score(a)).slice(0, max);
  }

  // Metin yoksa marka/kategori filtresi (eski davranış).
  const clauses = [];
  if (params.brandId) clauses.push(where('brandId', '==', params.brandId));
  else if (params.brandName) clauses.push(where('brandName', '==', params.brandName));
  const q = query(collection(db, COLLECTIONS.products), ...clauses, fbLimit(max));
  const snap = await getDocs(q);
  let items = snap.docs.map((d) => d.data() as CanonicalProduct);
  const cat = params.category?.toLowerCase();
  if (cat) items = items.filter((p) => (p.category || '').toLowerCase().includes(cat));
  return items;
}
