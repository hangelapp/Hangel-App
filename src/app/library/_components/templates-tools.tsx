'use client';

/**
 * Bölüm — Şablonlar & Araçlar (STK admin gate, "card herkese görünür" varyantı).
 *
 * Önceki `templates-section.tsx` STK admin değilse hiç render etmiyordu. Bu varyant
 * card'ı herkese gösterir, ancak içerik (indirilebilir şablon listesi) yalnızca
 * isNgoAdmin için açılır. Admin değilse accordion içinde kilitli durum + "STK
 * yöneticisi olarak giriş yap" yönlendirmesi gösterilir.
 *
 * İçerik src/lib/library-templates.ts statik kaynağından gelir; Firestore override
 * için aynı slug ile doc varsa item'lar birleştirilir (mevcut TemplatesSection ile
 * aynı davranış).
 */

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock } from 'lucide-react';
import Link from 'next/link';
import { SectionAccordion, LIBRARY_ICONS } from './_shared';
import { useSectionDoc } from './_use-section-doc';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';
import { templatesSection, TEMPLATES_SECTION_SLUG } from '@/lib/library-templates';
import { useTranslation } from '@/components/providers/language-provider';

export function TemplatesToolsSection() {
  const { t } = useTranslation();
  const { isNgoAdmin, isLoading } = useIsNgoAdmin();
  const { section } = useSectionDoc(TEMPLATES_SECTION_SLUG, templatesSection);

  // Admin → tam liste; mevcut SectionAccordion'ı yeniden kullan ve badge'i header'a
  // ekleyebilmek için altta sarmalayıcı render değil, SectionAccordion'ın kendi
  // başlık+description'ını override eden Firestore içeriği kullanıyoruz. Subtitle
  // badge'ini görsel olarak göstermek için admin pathinde card'ı kendi render
  // edelim — SectionAccordion content davranışı için item listesini tüketmek
  // gerekirdi; bunun yerine basit bir Accordion ile aynı UX'i veriyoruz.
  if (isNgoAdmin) {
    return <AdminVisibleAccordion section={section} />;
  }

  // Non-admin / loading → kilitli card. Loading durumunda da kilitli görünür;
  // claim resolve olunca admin için yeniden render.
  return <LockedTemplatesCard isLoading={isLoading} t={t} />;
}

function AdminVisibleAccordion({
  section,
}: {
  section: ReturnType<typeof useSectionDoc>['section'];
}) {
  const { t } = useTranslation();
  const Icon = LIBRARY_ICONS[section.icon] ?? FileText;
  const badgeText = t('library.templates_tools.adminBadge');

  // Mevcut SectionAccordion arama+filtre toolbar'ını ve item link'lerini hazır
  // veriyor; burada sadece üst header'a admin badge'i ekleyebilmek için kendi
  // header satırımızla bir Card sarmalayıcı oluşturuyoruz. SectionAccordion içinde
  // de aynı title gösteriliyor olduğu için duplikasyondan kaçınmak adına direkt
  // SectionAccordion render ediyoruz, badge'i title'ın yanına ek bir Card header
  // satırı yerine description'a görsel olarak ek bir banner ile gösteriyoruz.
  return (
    <div className="relative">
      <SectionAccordion section={section} />
      <span className="pointer-events-none absolute right-12 top-3 hidden max-w-[55%] sm:right-14 sm:block">
        <Badge
          variant="destructive"
          className="text-[10px] px-2 py-0 leading-4 font-semibold truncate"
          aria-label={badgeText}
        >
          {badgeText}
        </Badge>
      </span>
      {/* Icon prop'u zaten SectionAccordion içinde render ediliyor; üstteki Icon
          referansını import için tutuyoruz (gelecekte custom header'a geçişte
          kullanılacak). */}
      <span className="hidden" aria-hidden>
        <Icon />
      </span>
    </div>
  );
}

function LockedTemplatesCard({
  isLoading,
  t,
}: {
  isLoading: boolean;
  t: (key: string) => string;
}) {
  const title = t('library.templates_tools.title');
  const description = t('library.templates_tools.description');
  const badgeText = t('library.templates_tools.adminBadge');
  const lockedMessage = t('library.templates_tools.lockedMessage');
  const signInLabel = t('library.templates_tools.signInLabel');

  return (
    <Card className="overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value={TEMPLATES_SECTION_SLUG} className="border-b-0">
          <AccordionTrigger className="p-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm leading-tight">{title}</p>
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-2 py-0 leading-4 font-semibold"
                  >
                    {badgeText}
                  </Badge>
                </div>
                <p className="text-[12px] text-muted-foreground leading-snug">
                  {description}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t bg-background">
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground max-w-xs">
                {lockedMessage}
              </p>
              {!isLoading && (
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                >
                  {signInLabel}
                </Link>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
