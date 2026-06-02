'use client';

/**
 * Bölüm 8 — Sivil Toplum Sözlüğü.
 *
 * Veri kaynağı: src/lib/library.ts statik + Firestore `library/sivil-toplum-sozlugu`.
 * Bu bölümde yapılandırılmış filtre yok; yalnızca metin araması var.
 */

import React from 'react';
import { SectionAccordion } from './_shared';
import { useSectionDoc } from './_use-section-doc';

const SLUG = 'sivil-toplum-sozlugu';

export function CivilSocietyGlossarySection() {
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: 'Sivil Toplum Sözlüğü',
    description: 'Sivil toplum alanında sık kullanılan kavramlar.',
    icon: 'Library',
  });
  return <SectionAccordion section={section} />;
}
