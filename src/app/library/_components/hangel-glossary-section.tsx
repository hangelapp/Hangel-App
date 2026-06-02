'use client';

/**
 * Bölüm 7 — hangel Sözlüğü.
 *
 * Veri kaynağı: src/lib/library.ts statik + Firestore `library/hangel-sozlugu`.
 * Bu bölümde yapılandırılmış filtre yok; yalnızca metin araması var.
 */

import React from 'react';
import { SectionAccordion } from './_shared';
import { useSectionDoc } from './_use-section-doc';

const SLUG = 'hangel-sozlugu';

export function HangelGlossarySection() {
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: 'hangel Sözlüğü',
    description: 'hangel ekosistemine özel kavramların açıklamaları.',
    icon: 'BookA',
  });
  return <SectionAccordion section={section} />;
}
