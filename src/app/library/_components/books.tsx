'use client';

/**
 * Books — büyük iyileştirilmiş Kitaplar component'i.
 *
 * Mevcut `books-section.tsx` (SectionAccordion sarmalayıcısı) yerine bu component
 * doğrudan zengin bir kitap deneyimi sunar:
 *  - Üstte arama barı + sırala dropdown (puan/yıl/sayfa/yazar)
 *  - Yatay scroll filter pill grupları (Kategori, Konu, Dil, Yazar, Yayınevi)
 *  - Kart grid: kapak avatar + yazar + yayınevi + yıl + sayfa + 2 satır açıklama
 *    + puan badge + "Detayı Gör" butonu
 *
 * Veri kaynağı: `librarySections` içindeki `kitaplar` bölümü + Firestore extras
 * (mevcut `useSectionDoc` davranışıyla birleştirilir). Metadata `parseBookMetadata`
 * helper'ı ile content HTML'inden çıkarılır; ileride Firestore item'ları açık
 * field (year/pages/rating) verirse onlar kazanır.
 *
 * Detay sayfası rating UI'si `[slug]/page.tsx` içinde yaşar (bu component yalnız
 * listeleme); 10-yıldız component'i `BookRatingStars` adıyla export edilir ve
 * orada tüketilir.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, ChevronRight, ArrowUpDown, BookOpen, Star, X, Library,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';
import { useSectionDoc } from './_use-section-doc';
import { parseBookMetadata, type LibraryItem, type BookMetadata } from '@/lib/library';

const SLUG = 'kitaplar';

type SortKey = 'rating' | 'year' | 'pages' | 'author';

type FilterPillGroupKey = 'category' | 'topic' | 'language' | 'author' | 'publisher';

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

function FilterPillRow({
  label, options, selected, onToggle, allLabel,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  allLabel: string;
}) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
        {label}
      </p>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-1.5 pb-2">
          <button
            type="button"
            onClick={() => selected.forEach(s => onToggle(s))}
            className={cn(
              'shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              selected.length === 0
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            {allLabel}
          </button>
          {options.map(opt => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={cn(
                  'shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  on
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground hover:bg-muted',
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function BookCard({ enriched }: { enriched: EnrichedBook }) {
  const { t } = useTranslation();
  const { item, meta } = enriched;
  // Yazar baş harfleri (Avatar fallback)
  const initials = (meta.author || meta.title)
    .split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'K';

  return (
    <Card className="glass-surface rounded-2xl overflow-hidden flex flex-col p-4 gap-3 h-full">
      <div className="flex items-start gap-3">
        <Avatar className="h-14 w-14 rounded-xl shrink-0">
          {meta.cover ? <AvatarImage src={meta.cover} alt={meta.title} /> : null}
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{meta.title}</h3>
          {meta.author && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meta.author}</p>
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

      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
        {meta.publisher && (
          <Badge variant="outline" className="px-1.5 py-0 font-normal">{meta.publisher}</Badge>
        )}
        {meta.year > 0 && (
          <Badge variant="outline" className="px-1.5 py-0 font-normal">{meta.year}</Badge>
        )}
        <Badge variant="outline" className="px-1.5 py-0 font-normal">
          {meta.pages} {t('library.books.pages')}
        </Badge>
        {meta.language && (
          <Badge variant="outline" className="px-1.5 py-0 font-normal">{meta.language}</Badge>
        )}
      </div>

      {meta.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
          {meta.description}
        </p>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
        {meta.category && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
            {meta.category}
          </span>
        )}
        <Button asChild size="sm" variant="outline" className="shrink-0 h-8 text-xs ml-auto">
          <Link href={`/library/${item.slug}`}>
            {t('library.books.viewDetail')}
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </Button>
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
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
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
  const [pills, setPills] = useState<Record<FilterPillGroupKey, string[]>>({
    category: [], topic: [], language: [], author: [], publisher: [],
  });

  const items = section.items ?? [];
  const enriched: EnrichedBook[] = useMemo(
    () => items.map(it => ({ item: it, meta: parseBookMetadata(it) })),
    [items],
  );

  // Pill opsiyonları — en sık olanlar başta; ilk 12 ile sınırla (yatay scroll
  // sınırlı kalsın, gerisi yine swipe ile erişilebilir).
  const pillOptions = useMemo(() => ({
    category: distinctSorted(enriched, 'category').slice(0, 20),
    topic: distinctSorted(enriched, 'topic').slice(0, 20),
    language: distinctSorted(enriched, 'language').slice(0, 10),
    author: distinctSorted(enriched, 'author').slice(0, 24),
    publisher: distinctSorted(enriched, 'publisher').slice(0, 24),
  }), [enriched]);

  const togglePill = (group: FilterPillGroupKey, v: string) => {
    setPills(prev => ({
      ...prev,
      [group]: prev[group].includes(v) ? prev[group].filter(x => x !== v) : [...prev[group], v],
    }));
  };

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const matchPillGroup = (b: EnrichedBook, group: FilterPillGroupKey): boolean => {
      const selected = pills[group];
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
      if (!matchPillGroup(b, 'category')) return false;
      if (!matchPillGroup(b, 'topic')) return false;
      if (!matchPillGroup(b, 'language')) return false;
      if (!matchPillGroup(b, 'author')) return false;
      if (!matchPillGroup(b, 'publisher')) return false;
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
  }, [enriched, query, pills, sortKey]);

  const activePillCount = Object.values(pills).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <Card className="overflow-hidden rounded-2xl">
      <Accordion type="single" collapsible defaultValue={SLUG}>
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
                {(activePillCount > 0 || query) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => {
                      setQuery('');
                      setPills({ category: [], topic: [], language: [], author: [], publisher: [] });
                    }}
                  >
                    <X className="h-3 w-3 mr-1" /> {t('library.toolbar.clearAllButton')}
                  </Button>
                )}
              </div>

              {/* Filter pills — yatay scroll grupları */}
              <div className="space-y-2">
                <FilterPillRow
                  label={t('library.books.pillCategory')}
                  options={pillOptions.category}
                  selected={pills.category}
                  onToggle={v => togglePill('category', v)}
                  allLabel={t('library.books.allPill')}
                />
                <FilterPillRow
                  label={t('library.books.pillTopic')}
                  options={pillOptions.topic}
                  selected={pills.topic}
                  onToggle={v => togglePill('topic', v)}
                  allLabel={t('library.books.allPill')}
                />
                <FilterPillRow
                  label={t('library.books.pillLanguage')}
                  options={pillOptions.language}
                  selected={pills.language}
                  onToggle={v => togglePill('language', v)}
                  allLabel={t('library.books.allPill')}
                />
                <FilterPillRow
                  label={t('library.books.pillAuthor')}
                  options={pillOptions.author}
                  selected={pills.author}
                  onToggle={v => togglePill('author', v)}
                  allLabel={t('library.books.allPill')}
                />
                <FilterPillRow
                  label={t('library.books.pillPublisher')}
                  options={pillOptions.publisher}
                  selected={pills.publisher}
                  onToggle={v => togglePill('publisher', v)}
                  allLabel={t('library.books.allPill')}
                />
              </div>
            </div>

            {/* Kart grid */}
            {filtered.length > 0 ? (
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
