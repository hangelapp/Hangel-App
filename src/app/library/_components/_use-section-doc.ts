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
    return mergeSectionItems(staticSec, fsDoc ?? null);
    // fallback nesnesinin referans değişkenliği page.tsx'de sabittir; bağımlılıkta tutuyoruz.
  }, [slug, fsDoc, fallback]);

  return { section, isLoading };
}
