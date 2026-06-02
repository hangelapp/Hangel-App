'use client';

/**
 * Bölüm 5 — Kitaplar.
 *
 * Bu dosya artık ince bir wrapper. Asıl zengin UI (arama + sırala + filter pills +
 * kart grid) `books.tsx` içindeki `BooksComponent`'tedir. Burada sadece
 * page.tsx'in beklediği `BooksSection` adıyla re-export ediyoruz.
 */

import { BooksComponent } from './books';

export function BooksSection() {
  return <BooksComponent />;
}
