'use client';

import { useCallback, useMemo } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { CanonicalProduct } from '@/lib/feed/types';

/**
 * Kullanıcının favori ürünleri — Firestore `users/{uid}/favorites/{productId}`.
 * Fav dokümanı ürünün SNAPSHOT'unu tutar; Favorilerim sayfası ekstra okuma
 * yapmadan render eder. Güvenlik kuralları sahibinin `users/{uid}` alt ağacını
 * okuyup yazmasına zaten izin verir (kural DÜZENLENMEZ).
 */
export interface FavoriteSnapshot {
  productId: string;
  title: string;
  imageLink: string | null;
  price: number;
  salePrice: number | null;
  brandName: string;
  donationRate: number | null;
}

export function useFavorites() {
  const db = useFirestore();
  const { user } = useUser();
  const uid = user?.uid ?? null;

  const favQuery = useMemoFirebase(
    () => (db && uid ? collection(db, 'users', uid, 'favorites') : null),
    [db, uid],
  );
  const { data: favs, isLoading } = useCollection<FavoriteSnapshot>(favQuery);

  const favIds = useMemo(() => {
    const s = new Set<string>();
    for (const f of favs || []) s.add(f.id);
    return s;
  }, [favs]);

  const isFavorite = useCallback((id: string) => favIds.has(id), [favIds]);

  const toggle = useCallback(
    (product: CanonicalProduct) => {
      // Oturum yoksa: sessizce no-op (kart `signedIn` ile giriş isteyebilir).
      if (!db || !uid) return;
      const ref = doc(db, 'users', uid, 'favorites', product.id);
      if (favIds.has(product.id)) {
        void deleteDoc(ref);
      } else {
        void setDoc(ref, {
          productId: product.id,
          title: product.title ?? '',
          imageLink: product.imageLink ?? null,
          price: typeof product.price === 'number' ? product.price : 0,
          salePrice:
            typeof product.salePrice === 'number' ? product.salePrice : null,
          brandName: product.brandName ?? '',
          donationRate:
            typeof product.donationRate === 'number' ? product.donationRate : null,
          addedAt: serverTimestamp(),
        });
      }
    },
    [db, uid, favIds],
  );

  return {
    favIds,
    favorites: favs || [],
    isFavorite,
    toggle,
    loading: isLoading,
    signedIn: !!uid,
  };
}

export default useFavorites;
