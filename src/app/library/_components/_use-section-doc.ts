'use client';

/**
 * Bir kütüphane bölümünün Firestore doc'unu izleyip statik veri ile birleştiren
 * hook. Doc id'si bölüm slug'ı ile aynıdır (collection: library/{slug}).
 */

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import type { LibrarySection, LibraryItem } from '@/lib/library';
import { getStaticSection, mergeSectionItems } from './_shared';

export function useSectionDoc(
  slug: string,
  fallback: Omit<LibrarySection, 'items'> & { items?: LibraryItem[] },
): { section: LibrarySection; isLoading: boolean } {
  const db = useFirestore();
  const docRef = useMemoFirebase(
    () => (db ? doc(db, COLLECTIONS.library, slug) : null),
    [db, slug],
  );
  const { data: fsDoc, isLoading } = useDoc<LibrarySection>(docRef);

  const section = useMemo(() => {
    const staticSec = getStaticSection(slug, fallback);
    const baseMerged = mergeSectionItems(staticSec, fsDoc ?? null);
    // Per-slug field override: aynı slug'a sahip Firestore item'ı statik item'ın
    // üstüne `{ ...static, ...fs }` pattern'i ile yazar (year/pages/rating/coverUrl
    // /synopsis vb. Firestore'dan gelen explicit field'lar mock'u override etsin).
    // `mergeSectionItems` Firestore'daki çakışan slug'ları yalnızca yeni item olarak
    // append etmez — burada eski item üstüne field-level merge yapıyoruz.
    const fsBySlug = new Map<string, LibraryItem>();
    for (const it of fsDoc?.items ?? []) {
      if (it?.slug) fsBySlug.set(it.slug, it);
    }
    if (fsBySlug.size === 0) return baseMerged;
    const mergedItems = baseMerged.items.map(staticItem => {
      const fsItem = fsBySlug.get(staticItem.slug);
      return fsItem ? { ...staticItem, ...fsItem } : staticItem;
    });
    return { ...baseMerged, items: mergedItems };
    // fallback nesnesinin referans değişkenliği page.tsx'de sabittir; bağımlılıkta tutuyoruz.
  }, [slug, fsDoc, fallback]);

  return { section, isLoading };
}
