'use client';

/**
 * Books — büyük iyileştirilmiş Kitaplar component'i.
 *
 * Mevcut `books-section.tsx` (SectionAccordion sarmalayıcısı) yerine bu component
 * doğrudan zengin bir kitap deneyimi sunar:
 *  - Üstte arama barı + sırala dropdown (puan/yıl/sayfa/yazar)
 *  - Arama barının altında multi-select filter dropdown'lar
 *    (Kategori, Konu, Dil, Yazar, Yayınevi)
 *  - 1 sütun kart grid: geniş kart + tüm metadata (yazar, yayınevi, yıl, sayfa,
 *    dil, kategori, açıklama, puan)
 *
 * Veri kaynağı: `librarySections` içindeki `kitaplar` bölümü + Firestore extras
 * (mevcut `useSectionDoc` davranışıyla birleştirilir). Metadata `parseBookMetadata`
 * helper'ı ile content HTML'inden çıkarılır; ileride Firestore item'ları açık
 * field (year/pages/rating/coverUrl/synopsis) verirse onlar kazanır.
 *
 * Detay sayfası rating UI'si `[slug]/page.tsx` içinde yaşar (bu component yalnız
 * listeleme); 10-yıldız component'i `BookRatingStars` adıyla export edilir ve
 * orada tüketilir.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, ChevronRight, ArrowUpDown, BookOpen, Star, X, Library, ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';
import { useSectionDoc } from './_use-section-doc';
import { parseBookMetadata, type LibraryItem, type BookMetadata } from '@/lib/library';

const SLUG = 'kitaplar';

type SortKey = 'rating' | 'year' | 'pages' | 'author';

type FilterGroupKey = 'category' | 'topic' | 'language' | 'author' | 'publisher';

interface EnrichedBook {
  item: LibraryItem;
  meta: BookMetadata;
}

// Bir alanın tüm distinct değerlerini, en sık görülen ilkte olacak şekilde döndür.
function distinctSorted(books: EnrichedBook[], key: keyof BookMetadata): string[] {
  const counts = new Map<string, number>();
  for (const b of books) {
    const raw = b.meta[key];
    if (typeof raw !== 'string' || !raw) continue;
    // Bazı kategoriler "Türkçe, İngilizce" gibi virgüllü gelir — ayır.
    for (const piece of raw.split(/[,;/]/).map(s => s.trim()).filter(Boolean)) {
      counts.set(piece, (counts.get(piece) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
    .map(([v]) => v);
}

function matchesPill(metaValue: string | undefined, pill: string): boolean {
  if (!metaValue) return false;
  return metaValue.split(/[,;/]/).map(s => s.trim()).includes(pill);
}

/**
 * Multi-select dropdown filter — kompakt pill butonu, açıldığında checkbox listesi.
 * `volunteering/page.tsx` içindeki FilterButton pattern'i ile aynı çizgide.
 */
function FilterDropdown({
  title, options, selected, onSelectedChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onSelectedChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  if (options.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 px-3 gap-1.5 rounded-full shrink-0 bg-background',
            selected.length > 0 && 'border-primary text-primary',
          )}
        >
          <span className="text-xs font-medium whitespace-nowrap">{title}</span>
          {selected.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 overflow-y-auto w-56" align="start">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(option => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={checked => {
              onSelectedChange(checked ? [...selected, option] : selected.filter(i => i !== option));
            }}
            // shadcn DropdownMenuCheckboxItem default'da click sonrası kapanır;
            // multi-select için açık tut.
            onSelect={e => e.preventDefault()}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-1 pb-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => onSelectedChange([])}
              >
                {t('library.books.clearAll')}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BookCard({ enriched }: { enriched: EnrichedBook }) {
  const { t } = useTranslation();
  const { item, meta } = enriched;

  // Künye listede sade: kapak + detaylı künye (yayınevi/yıl/sayfa/dil/kategori)
  // DETAY sayfasında. Kartta yalnız ad, yazar, puan ve konu (kısa açıklama).
  return (
    <Card className="glass-surface rounded-2xl overflow-hidden flex flex-col gap-2 p-4 h-full">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold leading-tight line-clamp-2">{meta.title}</h3>
            {meta.author && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{meta.author}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1 px-2 py-0.5">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span className="text-xs font-bold tabular-nums">
              {meta.rating.toFixed(1)}
              <span className="text-[10px] font-normal text-muted-foreground">
                {t('library.books.ratingOutOf')}
              </span>
            </span>
          </Badge>
        </div>

        {meta.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {meta.shortDescription}
          </p>
        )}

        <div className="mt-auto pt-1 flex items-center justify-end gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link href={`/library/${item.slug}`}>
              {t('library.books.viewDetail')}
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * 10-yıldız puanlama UI'si. Detay sayfasında tüketilir.
 * Yarım yıldız desteklemez; tıklanan yıldız değeri (1-10) `onRate` ile bildirilir.
 */
export function BookRatingStars({
  value,
  average,
  onRate,
  disabled,
  label,
  hint,
}: {
  value: number | null;
  average?: number;
  onRate: (v: number) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const current = hover ?? value ?? 0;
  return (
    <div className="space-y-2">
      {label && <p className="font-medium text-sm">{label}</p>}
      <div className="flex items-center gap-1 flex-wrap" role="radiogroup" aria-label={label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const active = n <= current;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={value === n}
              aria-label={`${n}/10`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => onRate(n)}
              className={cn(
                'p-1 rounded-md transition-colors disabled:opacity-50',
                active ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-400',
              )}
            >
              <Star className={cn('h-5 w-5', active && 'fill-amber-500')} />
            </button>
          );
        })}
        <span className="ml-2 text-sm font-semibold tabular-nums">
          {current > 0 ? `${current}/10` : (hint ?? '')}
        </span>
      </div>
      {typeof average === 'number' && average > 0 && (
        <p className="text-xs text-muted-foreground">
          Ø {average.toFixed(1)}/10
        </p>
      )}
    </div>
  );
}

export function BooksComponent() {
  const { t } = useTranslation();
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: t('library.books.sectionTitle'),
    description: t('library.books.sectionDesc'),
    icon: 'Library',
  });

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [filters, setFilters] = useState<Record<FilterGroupKey, string[]>>({
    category: [], topic: [], language: [], author: [], publisher: [],
  });

  const items = section.items ?? [];
  const enriched: EnrichedBook[] = useMemo(
    () => items.map(it => ({ item: it, meta: parseBookMetadata(it) })),
    [items],
  );

  // Dropdown opsiyonları — en sık olanlar başta; ilk 24 ile sınırlı (uzun listede
  // dropdown içinde scroll var; daha fazlasını göstermek pratik değil).
  const filterOptions = useMemo(() => ({
    category: distinctSorted(enriched, 'category').slice(0, 30),
    topic: distinctSorted(enriched, 'topic').slice(0, 30),
    language: distinctSorted(enriched, 'language').slice(0, 20),
    author: distinctSorted(enriched, 'author').slice(0, 50),
    publisher: distinctSorted(enriched, 'publisher').slice(0, 50),
  }), [enriched]);

  const setGroup = (group: FilterGroupKey, next: string[]) => {
    setFilters(prev => ({ ...prev, [group]: next }));
  };

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const matchGroup = (b: EnrichedBook, group: FilterGroupKey): boolean => {
      const selected = filters[group];
      if (selected.length === 0) return true;
      const field = b.meta[group as keyof BookMetadata];
      const fieldStr = typeof field === 'string' ? field : '';
      return selected.some(s => matchesPill(fieldStr, s));
    };
    const list = enriched.filter(b => {
      if (lower) {
        const hay = `${b.meta.title} ${b.meta.author} ${b.meta.publisher} ${b.meta.category} ${b.meta.topic} ${b.meta.description}`.toLowerCase();
        if (!hay.includes(lower)) return false;
      }
      if (!matchGroup(b, 'category')) return false;
      if (!matchGroup(b, 'topic')) return false;
      if (!matchGroup(b, 'language')) return false;
      if (!matchGroup(b, 'author')) return false;
      if (!matchGroup(b, 'publisher')) return false;
      return true;
    });
    list.sort((a, b) => {
      switch (sortKey) {
        case 'rating': return b.meta.rating - a.meta.rating;
        case 'year': return b.meta.year - a.meta.year;
        case 'pages': return a.meta.pages - b.meta.pages;
        case 'author': return a.meta.author.localeCompare(b.meta.author, 'tr');
        default: return 0;
      }
    });
    return list;
  }, [enriched, query, filters, sortKey]);

  const activeFilterCount = Object.values(filters).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <Card className="overflow-hidden rounded-2xl">
      <Accordion type="single" collapsible>
        <AccordionItem value={SLUG} className="border-b-0">
          <AccordionTrigger className="p-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Library className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm leading-tight">{t('library.books.sectionTitle')}</p>
                <p className="text-[12px] text-muted-foreground leading-snug">
                  {t('library.books.sectionDesc')}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t bg-background">
            {/* Toolbar: arama + sırala */}
            <div className="p-3 sm:p-4 space-y-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('library.books.searchPlaceholder')}
                    className="pl-9 h-10 bg-background rounded-xl"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                      aria-label="x"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
                  <SelectTrigger className="h-10 w-[180px] bg-background rounded-xl">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t('library.books.sortLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">{t('library.books.sortByRating')}</SelectItem>
                    <SelectItem value="year">{t('library.books.sortByYear')}</SelectItem>
                    <SelectItem value="pages">{t('library.books.sortByPages')}</SelectItem>
                    <SelectItem value="author">{t('library.books.sortByAuthor')}</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="text-[11px]">
                  {filtered.length} / {enriched.length} {t('library.books.countSuffix')}
                </Badge>
                {(activeFilterCount > 0 || query) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => {
                      setQuery('');
                      setFilters({ category: [], topic: [], language: [], author: [], publisher: [] });
                    }}
                  >
                    <X className="h-3 w-3 mr-1" /> {t('library.toolbar.clearAllButton')}
                  </Button>
                )}
              </div>

              {/* Filter dropdown'ları — yatay sıra (mobilde wrap) */}
              <div className="flex items-center gap-2 flex-wrap">
                <FilterDropdown
                  title={t('library.books.pillCategory')}
                  options={filterOptions.category}
                  selected={filters.category}
                  onSelectedChange={next => setGroup('category', next)}
                />
                <FilterDropdown
                  title={t('library.books.pillTopic')}
                  options={filterOptions.topic}
                  selected={filters.topic}
                  onSelectedChange={next => setGroup('topic', next)}
                />
                <FilterDropdown
                  title={t('library.books.pillLanguage')}
                  options={filterOptions.language}
                  selected={filters.language}
                  onSelectedChange={next => setGroup('language', next)}
                />
                <FilterDropdown
                  title={t('library.books.pillAuthor')}
                  options={filterOptions.author}
                  selected={filters.author}
                  onSelectedChange={next => setGroup('author', next)}
                />
                <FilterDropdown
                  title={t('library.books.pillPublisher')}
                  options={filterOptions.publisher}
                  selected={filters.publisher}
                  onSelectedChange={next => setGroup('publisher', next)}
                />
              </div>
            </div>

            {/* Tek sütun kart grid — daha geniş kart, daha fazla bilgi */}
            {filtered.length > 0 ? (
              <div className="p-3 sm:p-4 grid grid-cols-1 gap-3">
                {filtered.map(b => (
                  <BookCard key={b.item.slug} enriched={b} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('library.books.noResults')}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
