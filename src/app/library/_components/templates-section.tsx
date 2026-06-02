'use client';

/**
 * Bölüm 4 — Şablonlar & Araçlar (STK admin'e özel).
 *
 * STK admin (veya süper-admin) olmayan kullanıcılar bu bölümü göremez. İçerik
 * src/lib/library-templates.ts statik kaynağından gelir. Firestore tarafından
 * override edilebilmesi için aynı slug ile doc varsa item'lar birleştirilir.
 */

import React from 'react';
import { SectionAccordion } from './_shared';
import { useSectionDoc } from './_use-section-doc';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';
import { templatesSection, TEMPLATES_SECTION_SLUG } from '@/lib/library-templates';

export function TemplatesSection() {
  const { isNgoAdmin } = useIsNgoAdmin();

  // Statik fallback olarak library-templates.ts'i kullan; useSectionDoc
  // librarySections'da bulamayınca fallback'e düşer.
  const { section } = useSectionDoc(TEMPLATES_SECTION_SLUG, templatesSection);

  if (!isNgoAdmin) return null;
  return <SectionAccordion section={section} />;
}
