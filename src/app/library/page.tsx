'use client';

/**
 * Kütüphane sayfası — orchestrator.
 *
 * Bölüm-özel render mantığı `_components/<section>.tsx` altında yaşar; bu dosya
 * yalnızca üst başlık, küresel arama input'u, kişisel popover'lar, AI CTA'ları ve
 * bölüm grid'ini koordine eder. Yeni bölüm eklerken: (1) `_components/`'a dosya
 * ekle, (2) aşağıdaki `SECTIONS` listesine ekle.
 *
 * Bölüm sırası (talep):
 *  1. Kütüphane AI Asistanı (AI sohbet — FAB & CTA)
 *  2. Proje Yazma AI Asistanı (STK admin — FAB & CTA)
 *  3. hangel Sosyal Etki Envanteri
 *  4. Şablonlar & Araçlar (STK admin gate)
 *  5. Kitaplar
 *  6. Akademik Makaleler
 *  7. hangel Sözlüğü
 *  8. Sivil Toplum Sözlüğü
 *  9. Filmler
 * 10. Veri Kütüphanesi
 */

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, ChevronRight, Bot, Bookmark, Compass } from 'lucide-react';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';

import { stripHtml } from './_components/_shared';
import { LibraryAssistantsFab } from './_components/assistants-fab';
import { ProjectWriterCard } from './_components/project-writer';
import { ImpactInventorySection } from './_components/impact-inventory-section';
import { TemplatesToolsSection } from './_components/templates-tools';
import { BooksSection } from './_components/books-section';
import { AcademicSection } from './_components/academic-section';
import { HangelGlossarySection } from './_components/hangel-glossary-section';
import { CivilSocietyGlossarySection } from './_components/civil-society-glossary-section';
import { FilmsSection } from './_components/films-section';
import { DataLibrarySection } from './_components/data-library-section';

import { librarySections as staticSections } from '@/lib/library';
import { templatesSection } from '@/lib/library-templates';
import type { LibraryItem } from '@/lib/library';

// Üst seviye arama, bölüm component'lerini doğrudan filtrelemek yerine tüm bölüm
// listesinde haystack-eşleşmesi olanları seçer. Her bölüm component'i kendi
// içinde ayrıca filtre & arama yapar — bu üst arama sadece "hangi bölümleri
// göster" karar verir.
type SectionEntry = {
  slug: string;
  key: string;
  /** STK admin değilse gizle. */
  ngoOnly?: boolean;
  /** Üst aramanın haystack'inde kullanılacak başlık/açıklama (i18n bekanmadan). */
  haystack: () => string;
  render: () => React.ReactElement;
};

export default function LibraryPage() {
  const { t } = useTranslation();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [openLibrary, setOpenLibrary] = useState(false);
  const [openProject, setOpenProject] = useState(false);

  const { user } = useUser();
  const { isNgoAdmin } = useIsNgoAdmin();

  // Kişiselleştirme için kullanıcının kaydet/okudu listesi (users/{uid}).
  const userRef = useMemoFirebase(() => (user ? doc(db, COLLECTIONS.users, user.uid) : null), [db, user]);
  const { data: userData } = useDoc<{
    savedLibraryItems?: string[];
    readLibraryItems?: string[];
    volunteerInfo?: { interests?: string[]; profession?: string; skills?: string[]; dailySkills?: string[] };
  }>(userRef);

  // Kişisel öneriler için tüm statik içerikten flat liste (Firestore subscribe etmiyoruz;
  // bu yalnızca statik kaynak üzerinden öneri çıkarır — bölümler kendi
  // Firestore item'larını kendileri yükler).
  type FlatItem = LibraryItem & { sectionSlug: string };
  const personal = useMemo(() => {
    if (!user) return null;
    const saved = Array.isArray(userData?.savedLibraryItems) ? userData!.savedLibraryItems! : [];
    const allItems: FlatItem[] = staticSections.flatMap(s => (s.items ?? []).map(i => ({ ...i, sectionSlug: s.slug })));
    const bySlug = new Map(allItems.map(i => [i.slug, i]));
    const savedItems = saved.map(sl => bySlug.get(sl)).filter((x): x is FlatItem => Boolean(x));

    const vi = userData?.volunteerInfo ?? {};
    const interestStrings = [
      ...(Array.isArray(vi.interests) ? vi.interests : []),
      ...(Array.isArray(vi.skills) ? vi.skills : []),
      ...(Array.isArray(vi.dailySkills) ? vi.dailySkills : []),
      ...(vi.profession ? [vi.profession] : []),
    ];
    const STOP = new Set(['ve', 'ile', 'için', 'bir', 'the', 'of', 'and', 'çalışmalar']);
    const keywords = new Set<string>();
    interestStrings.forEach(s => (s || '').toLowerCase().split(/[\s&/,()._-]+/).forEach(w => {
      const tt = w.trim();
      if (tt.length >= 3 && !STOP.has(tt)) keywords.add(tt);
    }));
    const kw = Array.from(keywords);

    const hayCache = new Map<string, string>();
    const hay = (it: FlatItem) => {
      let h = hayCache.get(it.slug);
      if (h === undefined) { h = `${it.title} ${stripHtml(it.content || '')}`.toLowerCase(); hayCache.set(it.slug, h); }
      return h;
    };
    const pickMatched = (slug: string, n: number) => {
      const items = allItems.filter(i => i.sectionSlug === slug);
      if (kw.length === 0) return items.slice(0, n);
      const scored = items.map(it => ({ it, s: kw.reduce((acc, k) => acc + (hay(it).includes(k) ? 1 : 0), 0) }))
        .sort((a, b) => b.s - a.s);
      const top = scored.filter(x => x.s > 0).slice(0, n).map(x => x.it);
      return top.length > 0 ? top : items.slice(0, n);
    };

    const hasProfile = kw.length > 0;
    const recGroups = hasProfile ? [
      { title: t('library.recGroupBooks'), items: pickMatched('kitaplar', 3) },
      { title: t('library.recGroupFilms'), items: pickMatched('filmler', 3) },
      { title: t('library.recGroupInventory'), items: pickMatched('hangel-sosyal-etki-envanteri', 3) },
    ].filter(g => g.items.length > 0) : [];
    return { savedItems, recGroups, hasProfile };
  }, [user, userData, t]);

  // Bölüm sırası — talep edilen sıralama. STK admin gate'i `ngoOnly` ile uygulanır;
  // bölüm component'i kendi içinde de aynı hook'u tüketebilir (defansif).
  const SECTIONS: SectionEntry[] = useMemo(() => {
    const lookup = (slug: string) => staticSections.find(s => s.slug === slug);
    const hay = (title: string, description?: string, items?: LibraryItem[]) => {
      const itemsText = (items ?? []).map(i => `${i.title} ${stripHtml(i.content || '')}`).join(' ');
      return `${title} ${description ?? ''} ${itemsText}`.toLowerCase();
    };
    const inventoryStatic = { title: 'hangel Sosyal Etki Envanteri', description: 'Dünya genelinde sosyal etki üreten kuruluşların envanteri.' };
    const filmsStatic = { title: 'Filmler', description: 'Sosyal etki temalı film ve belgesel seçkisi.' };
    const dataStatic = { title: 'Veri Kütüphanesi', description: 'Resmi kurumlar ve araştırma merkezlerinden veri setleri.' };

    return [
      {
        slug: 'hangel-sosyal-etki-envanteri', key: 'impact',
        haystack: () => hay(inventoryStatic.title, inventoryStatic.description),
        render: () => <ImpactInventorySection />,
      },
      {
        slug: 'kitaplar', key: 'books',
        haystack: () => {
          const s = lookup('kitaplar');
          return hay(s?.title ?? 'Kitaplar', s?.description, s?.items);
        },
        render: () => <BooksSection />,
      },
      {
        slug: 'akademik-makaleler', key: 'academic',
        haystack: () => {
          const s = lookup('akademik-makaleler');
          return hay(s?.title ?? 'Akademik Makaleler', s?.description, s?.items);
        },
        render: () => <AcademicSection />,
      },
      {
        slug: 'hangel-sozlugu', key: 'hangelGlossary',
        haystack: () => {
          const s = lookup('hangel-sozlugu');
          return hay(s?.title ?? 'hangel Sözlüğü', s?.description, s?.items);
        },
        render: () => <HangelGlossarySection />,
      },
      {
        slug: 'sivil-toplum-sozlugu', key: 'civilGlossary',
        haystack: () => {
          const s = lookup('sivil-toplum-sozlugu');
          return hay(s?.title ?? 'Sivil Toplum Sözlüğü', s?.description, s?.items);
        },
        render: () => <CivilSocietyGlossarySection />,
      },
      {
        slug: 'filmler', key: 'films',
        haystack: () => hay(filmsStatic.title, filmsStatic.description),
        render: () => <FilmsSection />,
      },
      {
        slug: 'veri-kutuphanesi', key: 'dataLibrary',
        haystack: () => hay(dataStatic.title, dataStatic.description),
        render: () => <DataLibrarySection />,
      },
      {
        slug: templatesSection.slug, key: 'templates',
        haystack: () => hay(templatesSection.title, templatesSection.description ?? '', templatesSection.items),
        render: () => <TemplatesToolsSection />,
      },
    ];
  }, []);

  const visibleSections = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return SECTIONS.filter(entry => {
      if (entry.ngoOnly && !isNgoAdmin) return false;
      if (!lower) return true;
      return entry.haystack().includes(lower);
    });
  }, [SECTIONS, searchTerm, isNgoAdmin]);

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 bg-secondary min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{t('library.pageTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('library.pageSubtitle')}</p>
      </div>

      <div className="max-w-lg mx-auto flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('library.searchAllPlaceholder')}
            className="pl-10 h-11"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {personal && personal.savedItems.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative" aria-label={t('library.ariaSaved')}>
                <Bookmark className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {personal.savedItems.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <p className="font-semibold text-sm flex items-center gap-2"><Bookmark className="h-4 w-4 text-primary" /> {t('library.savedTitle')}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {personal.savedItems.map(i => (
                  <Link key={i.slug} href={`/library/${i.slug}`} className="text-xs rounded-full border bg-background px-3 py-1.5 hover:bg-accent transition-colors">{i.title}</Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {personal && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label={t('library.ariaSuggestions')}>
                <Compass className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto space-y-3">
              <p className="font-semibold text-sm flex items-center gap-2"><Compass className="h-4 w-4 text-primary" /> {t('library.suggestionsTitle')}</p>
              {personal.hasProfile && personal.recGroups.length > 0 ? (
                <>
                  {personal.recGroups.map(g => (
                    <div key={g.title}>
                      <p className="text-xs font-semibold text-muted-foreground">{g.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {g.items.map(i => (
                          <Link key={i.slug} href={`/library/${i.slug}`} className="text-xs rounded-full border bg-background px-3 py-1.5 hover:bg-accent transition-colors">{i.title}</Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground leading-snug pt-2 border-t">
                    {t('library.suggestionsHintPrefix')} <strong>{t('library.suggestionsHintAbout')}</strong> {t('library.suggestionsHintAnd')} <strong>{t('library.suggestionsHintVolunteer')}</strong> {t('library.suggestionsHintSuffix')}
                  </p>
                </>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-sm text-muted-foreground leading-snug">
                    {t('library.suggestionsEmptyPrefix')} <strong>{t('library.suggestionsEmptyAbout')}</strong> {t('library.suggestionsEmptyAnd')} <strong>{t('library.suggestionsEmptyVolunteer')}</strong> {t('library.suggestionsEmptySuffix')}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button asChild size="sm" variant="outline" className="w-full justify-between">
                      <Link href="/settings/profile">{t('library.profileAboutLink')} <ChevronRight className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full justify-between">
                      <Link href="/settings/volunteer">{t('library.profileVolunteerLink')} <ChevronRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* AI asistanlarını öne çıkaran CTA. Proje Yazma kartı herkese görünür; STK
          admin değilse tıklama disable + tooltip ile gate. */}
      <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpenLibrary(true)}
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm hover:bg-accent transition-colors"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="block font-semibold text-sm">{t('library.ctaLibraryAssistant')}</span>
            <span className="block text-xs text-muted-foreground">{t('library.ctaLibraryAssistantDesc')}</span>
          </span>
        </button>
        <ProjectWriterCard onOpen={() => setOpenProject(true)} />
      </div>

      <div className="space-y-4">
        {visibleSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('library.noSearchResults')}</p>
          </div>
        ) : (
          visibleSections.map(entry => (
            <React.Fragment key={entry.key}>{entry.render()}</React.Fragment>
          ))
        )}
      </div>

      <LibraryAssistantsFab
        openLibrary={openLibrary}
        setOpenLibrary={setOpenLibrary}
        openProject={openProject}
        setOpenProject={setOpenProject}
      />
    </div>
  );
}
