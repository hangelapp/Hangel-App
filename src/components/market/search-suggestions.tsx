'use client';

// Market ana sayfa arama çubuğu için otomatik tamamlama önerileri.
// Marka/Mağaza, Kategori ve Ürün gruplarında en fazla ~8 öneri gösterir.
// Klavye gerekmez — tıklama/dokunma yeterli.

import { Store, LayoutGrid, Package } from 'lucide-react';
import type { CanonicalProduct } from '@/lib/feed/types';
import { CURATED_ORDER } from '@/lib/market/curated-categories';

type BrandLite = { name: string; slug?: string; id: string };

type PickKind = 'brand' | 'category' | 'product' | 'term';

interface SearchSuggestionsProps {
  query: string;
  brands: BrandLite[];
  products: CanonicalProduct[];
  onPick: (kind: PickKind, value: string, href?: string) => void;
}

// Türkçe duyarlı, aksan/harf küçültme.
const norm = (s: string) => (s || '').toLocaleLowerCase('tr');

export function SearchSuggestions({ query, brands, products, onPick }: SearchSuggestionsProps) {
  const q = norm(query.trim());
  if (q.length < 2) return null;

  // Markalar/Mağazalar — ada göre eşleşen ilk 4.
  const seenBrand = new Set<string>();
  const brandHits: BrandLite[] = [];
  for (const b of brands || []) {
    if (!b || !b.name) continue;
    const key = norm(b.name);
    if (seenBrand.has(key)) continue;
    if (key.includes(q)) {
      seenBrand.add(key);
      brandHits.push(b);
      if (brandHits.length >= 4) break;
    }
  }

  // Kategoriler — CURATED_ORDER içinden eşleşen ilk 3.
  const categoryHits = (CURATED_ORDER || [])
    .filter((name) => norm(name).includes(q))
    .slice(0, 3);

  // Ürünler — başlığa göre eşleşen, başlığa göre tekilleştirilmiş ilk 4.
  const seenTitle = new Set<string>();
  const productHits: string[] = [];
  for (const p of products || []) {
    const title = (p?.title || '').trim();
    if (!title) continue;
    const key = norm(title);
    if (seenTitle.has(key)) continue;
    if (key.includes(q)) {
      seenTitle.add(key);
      productHits.push(title);
      if (productHits.length >= 4) break;
    }
  }

  if (brandHits.length === 0 && categoryHits.length === 0 && productHits.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
      {brandHits.length > 0 && (
        <div className="py-1">
          <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            Mağazalar
          </div>
          {brandHits.map((b) => (
            <button
              key={`brand-${b.id}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick('brand', b.name, `/market/${b.slug || b.id}`)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <Store className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{b.name}</span>
            </button>
          ))}
        </div>
      )}

      {categoryHits.length > 0 && (
        <div className="border-t border-border py-1">
          <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            Kategoriler
          </div>
          {categoryHits.map((name) => (
            <button
              key={`cat-${name}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick('category', name)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <LayoutGrid className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
      )}

      {productHits.length > 0 && (
        <div className="border-t border-border py-1">
          <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Ürünler
          </div>
          {productHits.map((title) => (
            <button
              key={`prod-${title}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick('product', title)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <Package className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
