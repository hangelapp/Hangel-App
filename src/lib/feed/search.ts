/**
 * Faz 4 — ürün arama soyutlaması.
 *
 * Şimdilik Firestore tabanlı (marka/kategori filtresi + limit). 100k+ ürüne
 * çıkınca aynı `searchProducts` imzası korunarak Algolia/Typesense'e geçilecek
 * (sadece bu dosyanın gövdesi değişir, çağıranlar etkilenmez).
 *
 * Scheduled senkron (feed'lerin periyodik yeniden ingest'i) ayrı bir Cloud
 * Function olarak `functions/` altında kurulacak (deploy + zamanlama gerektirir);
 * o fonksiyon /api/feed/ingest endpoint'ini her feed için tetikler.
 */
import { collection, getDocs, query, where, limit as fbLimit, type Firestore } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from './types';

export interface ProductSearchParams {
  brandId?: string;
  brandName?: string;
  category?: string;
  text?: string;
  max?: number;
}

export async function searchProducts(db: Firestore, params: ProductSearchParams): Promise<CanonicalProduct[]> {
  const clauses = [];
  if (params.brandId) clauses.push(where('brandId', '==', params.brandId));
  else if (params.brandName) clauses.push(where('brandName', '==', params.brandName));

  const q = query(collection(db, COLLECTIONS.products), ...clauses, fbLimit(params.max ?? 60));
  const snap = await getDocs(q);
  let items = snap.docs.map((d) => d.data() as CanonicalProduct);

  const cat = params.category?.toLowerCase();
  const txt = params.text?.toLowerCase();
  if (cat) items = items.filter((p) => (p.category || '').toLowerCase().includes(cat));
  if (txt) items = items.filter((p) => (p.title || '').toLowerCase().includes(txt) || (p.brandName || '').toLowerCase().includes(txt));
  return items;
}
