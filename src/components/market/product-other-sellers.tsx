'use client';

/**
 * ProductOtherSellers — ürün detayında "Diğer Satıcılar". AYNI ürünü satan diğer
 * MAĞAZALARI bulur ve bağış oranına göre (en çok bağışlayan önce) sıralar; hangel'in
 * farkı: aynı ürünü EN ÇOK BAĞIŞLAYAN mağazadan al.
 *
 * Eşleştirme (fallback): GTIN (barkod) → MPN (üretici kodu). İkisi de yoksa gizli
 * (başlık-benzerliği güvenilir sorgulanamaz). Tek-alan index yeter (composite yok).
 * Her mağazadan en ucuz varyant tutulur; mevcut ürün + aynı mağaza dışlanır.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Store as StoreIcon, ChevronRight, HeartHandshake } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';

const eff = (p: CanonicalProduct) => (typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price);
const fmt = (n: number, c?: string) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)} ${c === 'TRY' || !c ? 'TL' : c}`;

export function ProductOtherSellers({ product }: { product: CanonicalProduct }) {
  const db = useFirestore();
  const gtin = (product.gtin || '').trim();
  const mpn = (product.mpn || '').trim();

  const q = useMemoFirebase(() => {
    if (!db) return null;
    if (gtin) return query(collection(db, COLLECTIONS.products), where('gtin', '==', gtin), limit(40));
    if (mpn) return query(collection(db, COLLECTIONS.products), where('mpn', '==', mpn), limit(40));
    return null;
  }, [db, gtin, mpn]);
  const { data: matches } = useCollection<CanonicalProduct>(q);

  const others = useMemo(() => {
    const curStore = (product.brandName || '').trim().toLowerCase();
    const byStore = new Map<string, CanonicalProduct>();
    for (const p of matches ?? []) {
      if (p.id === product.id) continue;
      const store = (p.brandName || '').trim().toLowerCase();
      if (!store || store === curStore) continue;
      const ex = byStore.get(store);
      if (!ex || eff(p) < eff(ex)) byStore.set(store, p);
    }
    return Array.from(byStore.values()).sort(
      (a, b) => (Number(b.donationRate) || 0) - (Number(a.donationRate) || 0) || eff(a) - eff(b),
    );
  }, [matches, product]);

  if (others.length === 0) return null;

  return (
    <section className="space-y-2 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Diğer Satıcılar ({others.length})</h2>
        <span className="text-[11px] font-semibold text-primary">en çok bağışlayan önce</span>
      </div>
      <div className="divide-y divide-border/60">
        {others.map((p) => {
          const rate = Math.round(Number(p.donationRate) || 0);
          return (
            <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-primary/5 -mx-1 px-1 rounded-lg">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white text-primary">
                <StoreIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{p.brandName}</p>
                {rate > 0 && (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <HeartHandshake className="h-3 w-3" /> %{rate} bağış
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-foreground">{fmt(eff(p), p.currency)}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
