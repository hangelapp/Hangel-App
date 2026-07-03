// Ürün kategori yardımcıları — marka/mağaza profillerinde kategori satırları için.
// Ham feed kategorisi uzun bir YOL olabilir ("Telefon>Cep Telefonları>...") → ilk
// ANLAMLI segmenti alır (pazarlama kovalarını atlar): Telefon, Bilgisayar, Tablet…

import type { CanonicalProduct } from '@/lib/feed/types';

const CATEGORY_JUNK =
  /^(kampanya|kampanyalar|koleksiyon|koleksiyonlar|yeni|yeniler|fırsat|fırsatlar|set ürünler|outlet|tüm ürünler|indirim|öne çıkan|popüler|çok satan|tümü|anasayfa|ana sayfa|markalar)/i;

export function realCategoryOf(category?: string | null): string {
  const raw = (category || '').trim();
  if (!raw) return '';
  const segs = raw.split(/[>›/,|]/).map((s) => s.trim()).filter(Boolean);
  for (const s of segs) {
    if (!CATEGORY_JUNK.test(s) && s.length >= 2) return s;
  }
  return '';
}

/** Ürünleri gerçek kategoriye göre gruplar; ürün sayısına göre çoktan aza sıralar. */
export function groupByRealCategory(
  products: CanonicalProduct[],
  minItems = 4,
): { name: string; items: CanonicalProduct[] }[] {
  const groups = new Map<string, CanonicalProduct[]>();
  for (const p of products) {
    const c = realCategoryOf(p.category);
    if (!c) continue;
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(p);
  }
  return Array.from(groups.entries())
    .map(([name, items]) => ({ name, items }))
    .filter((g) => g.items.length >= minItems)
    .sort((a, b) => b.items.length - a.items.length);
}
