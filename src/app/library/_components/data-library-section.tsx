'use client';

/**
 * Bölüm 10 — Veri Kütüphanesi.
 *
 * Veri kaynağı: Firestore `library/veri-kutuphanesi` doc'u. Resmi/akademik veri
 * setlerinin kataloğu; kaynak kurum, kapsam, yıl ve konu filtreleri haystack
 * araması ile item.content HTML metnine eşleşir.
 */

import React from 'react';
import { SectionAccordion, type FilterDef } from './_shared';
import { useSectionDoc } from './_use-section-doc';

const SLUG = 'veri-kutuphanesi';

const FILTERS: FilterDef[] = [
  {
    key: 'source', label: 'source', type: 'select',
    options: [
      // Uluslararası kurumlar
      'OECD', 'Dünya Bankası', 'Eurostat', 'UNDP', 'Avrupa Komisyonu',
      'İslam İşbirliği Teşkilatı (OIC)', 'SESRIC', 'B Lab (B Corp)',
      'Global Entrepreneurship Monitor (GEM)', 'British Council', 'Birleşik Krallık DCMS', 'Goodera',
      'Charities Aid Foundation (CAF)',
      // Türkiye kamu & akademi
      'T.C. İçişleri Bakanlığı', 'T.C. Sağlık Bakanlığı', 'T.C. Aile ve Sosyal Hizmetler',
      'T.C. Çevre, Şehircilik ve İklim Değişikliği', 'T.C. Milli Eğitim Bakanlığı',
      'T.C. Hazine ve Maliye', 'TÜİK', 'Cumhurbaşkanlığı SBB',
      'İstanbul Büyükşehir Belediyesi', 'Ankara Büyükşehir Belediyesi',
      'İzmir Büyükşehir Belediyesi', 'TÜSEV', 'TÜBİTAK', 'Üniversite Araştırması',
    ],
  },
  {
    key: 'scope', label: 'scope', type: 'select',
    options: ['Türkiye geneli', 'İstanbul', 'Ankara', 'İzmir', 'Bölgesel', 'AB', 'Uluslararası'],
  },
  { key: 'year', label: 'dataYear', type: 'year-range', min: 2000, max: 2026 },
  {
    key: 'topic', label: 'topic', type: 'select',
    options: [
      'Sosyal Fayda', 'Sosyal Etki', 'Sosyal Girişimcilik', 'Sosyal Yardım',
      'Gönüllülük', 'Bağışçılık', 'Sosyal Sorunlar',
      'Eğitim', 'Sağlık', 'Çevre', 'Afet', 'Göç', 'Yoksulluk',
      'Cinsiyet Eşitliği', 'Engellilik', 'Yaşlılık', 'Çocuk Hakları', 'STK Yönetimi',
    ],
  },
];

export function DataLibrarySection() {
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: 'Veri Kütüphanesi',
    description: 'Resmi kurumlar ve araştırma merkezlerinden veri setleri.',
    icon: 'Database',
  });
  return <SectionAccordion section={section} filterDefs={FILTERS} />;
}
