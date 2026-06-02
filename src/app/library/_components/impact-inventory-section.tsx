'use client';

/**
 * Bölüm 3 — hangel Sosyal Etki Envanteri.
 *
 * Veri kaynağı: Firestore `library/hangel-sosyal-etki-envanteri` doc'u (içerik
 * src/lib/hangel-impact-inventory.json'dan seed edilir). Sektör/merkez ülke/yıl/skor
 * filtreleri serbest-metin haystack araması ile eşleşir.
 */

import React from 'react';
import { SectionAccordion, type FilterDef } from './_shared';
import { useSectionDoc } from './_use-section-doc';

const SLUG = 'hangel-sosyal-etki-envanteri';

const FILTERS: FilterDef[] = [
  {
    key: 'sector', label: 'sector', type: 'select',
    options: [
      'Agriculture', 'Education', 'Technology', 'Tourism', 'Hydraulic',
      'Industry', 'Culture', 'Craft', 'Construction', 'Eco-tourism',
      'Recycling', 'Environment', 'Health', 'Gender Parity',
      'Business support', 'Garment Factory', 'Women Development',
    ],
  },
  {
    key: 'country', label: 'headquartersCountry', type: 'select',
    options: [
      'Algeria', 'Austria', 'Bangladesh', 'Hong Kong', 'Morocco',
      'Turkey', 'Türkiye', 'United States', 'United Kingdom', 'France',
      'Germany', 'India', 'Brazil', 'South Africa', 'Kenya',
    ],
  },
  { key: 'year', label: 'foundingYear', type: 'year-range', min: 1970, max: 2025 },
  {
    key: 'score', label: 'impactScore', type: 'select',
    options: ['Skor: 9', 'Skor: 8', 'Skor: 7', 'Skor: 6', 'Skor: 5'],
  },
];

export function ImpactInventorySection() {
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: 'hangel Sosyal Etki Envanteri',
    description: 'Dünya genelinde sosyal etki yaratan kuruluşların envanteri.',
    icon: 'Database',
  });

  return <SectionAccordion section={section} filterDefs={FILTERS} />;
}
