'use client';

/**
 * Bölüm 6 — Akademik Makaleler.
 *
 * Veri kaynağı: src/lib/library.ts statik + Firestore `library/akademik-makaleler`.
 * Konu/Yayınevi filtreleri haystack araması ile item.content HTML metnine eşleşir.
 */

import React from 'react';
import { SectionAccordion, type FilterDef } from './_shared';
import { useSectionDoc } from './_use-section-doc';

const SLUG = 'akademik-makaleler';

const FILTERS: FilterDef[] = [
  {
    key: 'topic', label: 'topic', type: 'select',
    options: [
      'Etki Odaklı Yardım', 'Etki Ölçümü', 'Kalkınma İktisadı',
      'Kalkınma ve Yoksulluk', 'Kalkınma ve Sosyal Politika', 'Sosyal Sermaye',
      'Katılımcı Demokrasi', 'Davranışsal Politika', 'Bilişsel Bilim',
      'Sosyal İnovasyon', 'Sosyal Etki', 'Sivil Toplum Araştırmaları',
      'Siyaset Sosyolojisi', 'STK Yönetişimi',
    ],
  },
  {
    key: 'publisher', label: 'publisher', type: 'select',
    options: [
      'Penguin', 'Wiley', 'Oxford University Press', 'PublicAffairs',
      'Simon & Schuster', 'Princeton University Press',
      'Farrar, Straus and Giroux', 'Routledge', 'Jossey-Bass',
      'Nobel Akademik', 'Metis Yayınları', 'İletişim Yayınları',
    ],
  },
];

export function AcademicSection() {
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: 'Akademik Makaleler',
    description: 'Hakemli dergilerde yayımlanmış akademik kaynaklar.',
    icon: 'GraduationCap',
  });
  return <SectionAccordion section={section} filterDefs={FILTERS} />;
}
