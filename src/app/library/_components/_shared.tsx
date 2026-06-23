'use client';

/**
 * Kütüphane bölüm component'leri için ortak tipler, helper'lar ve UI primitif'leri.
 *
 * page.tsx orchestrator artık her bölüm için ayrı component render eder; bunlar
 * benzer toolbar/accordion/filtre davranışına sahip oldukları için tekrarı buraya
 * topluyoruz. Bölüm-özel filtre tanımları kendi component dosyalarında kalır.
 */

import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Search, ChevronRight, BookOpen, X, Filter, ChevronDown, ChevronUp,
  Library, GraduationCap, BookMarked, FileText, BookA, Globe, Database, Film, HelpCircle, Star,
} from 'lucide-react';
import Link from 'next/link';
import type { LibrarySection, LibraryItem } from '@/lib/library';
import { librarySections as staticSections } from '@/lib/library';
import { useTranslation } from '@/components/providers/language-provider';

// Kütüphane bölüm icon allow-list'i. Bölüm icon'ları Firestore'dan runtime string
// olarak gelir; lucide wildcard import yerine kapalı küme map kullanıyoruz.
export const LIBRARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Library,
  GraduationCap,
  BookMarked,
  BookOpen,
  FileText,
  BookA,
  Globe,
  Database,
  Film,
};

export type FilterDef =
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'multi-select'; options: string[] }
  | { key: string; label: string; type: 'year-range'; min: number; max: number };

export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

/**
 * `LibraryItem` üzerinde henüz tip olarak tanımlı OLMAYAN ama Firestore/JSON
 * verisinde gelebilen opsiyonel alanları (imdbRating, dub, university) `as any`
 * kullanmadan, defansif bracket access ile okumak için yardımcılar.
 */
function readNumberField(item: LibraryItem, key: string): number | undefined {
  const v = (item as unknown as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : undefined;
}
function readStringField(item: LibraryItem, key: string): string | undefined {
  const v = (item as unknown as Record<string, unknown>)[key];
  return typeof v === 'string' && v ? v : undefined;
}

export function extractYear(item: LibraryItem): number | null {
  const text = `${item.title} ${stripHtml(item.content || '')}`;
  const match = text.match(/\b(19[6-9]\d|20[0-2]\d)\b/);
  return match ? Number(match[1]) : null;
}

export function itemContainsValue(item: LibraryItem, value: string): boolean {
  const haystack = `${item.title} ${stripHtml(item.content || '')}`.toLowerCase();
  return haystack.includes(value.toLowerCase());
}

/**
 * Statik kaynaktan bölümü slug ile bul (lib/library.ts).
 * Bulunamazsa minimal bir placeholder iskelet döner ki Firestore'dan veri gelmediği
 * durumlarda da render kırılmasın.
 */
export function getStaticSection(slug: string, fallback: Omit<LibrarySection, 'items'> & { items?: LibraryItem[] }): LibrarySection {
  const found = staticSections.find(s => s.slug === slug);
  if (found) return found;
  return { ...fallback, items: fallback.items ?? [] };
}

/**
 * Statik + Firestore item'larını birleştir. Aynı slug'a sahip item Firestore'da
 * varsa statik kazanır (item-level override yapmıyoruz); Firestore yalnızca yeni
 * item ekleyebilir.
 */
export function mergeSectionItems(staticSec: LibrarySection, firestoreSec: LibrarySection | null | undefined): LibrarySection {
  if (!firestoreSec) return staticSec;
  const staticSlugs = new Set(staticSec.items.map(i => i.slug));
  const extras = (firestoreSec.items ?? []).filter(i => !staticSlugs.has(i.slug));
  return { ...staticSec, items: [...staticSec.items, ...extras] };
}

function MultiSelectBadges({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v));
    else onChange([...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-lg border bg-background">
      {options.map(opt => {
        const isOn = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={
              isOn
                ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground'
                : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80'
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FilterControl({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { t } = useTranslation();
  const labelText = t(`library.filterLabels.${def.label}`);
  const allPrefix = t('library.toolbar.allPrefix');
  if (def.type === 'select') {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {labelText}
        </label>
        <Select value={(typeof value === 'string' && value) || '__all__'} onValueChange={v => onChange(v === '__all__' ? '' : v)}>
          <SelectTrigger className="h-9 bg-background text-xs">
            <SelectValue placeholder={`${allPrefix} ${labelText}`} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="__all__">{allPrefix} {labelText}</SelectItem>
            {def.options.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (def.type === 'multi-select') {
    const arr: string[] = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-1 md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {labelText}
          </label>
          {arr.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              {t('library.toolbar.clearMultiSelect')} ({arr.length})
            </button>
          )}
        </div>
        <MultiSelectBadges options={def.options} selected={arr} onChange={(v) => onChange(v)} />
      </div>
    );
  }

  if (def.type === 'year-range') {
    const range: [number, number] = (Array.isArray(value) && value.length === 2)
      ? [Number(value[0]), Number(value[1])]
      : [def.min, def.max];
    return (
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {labelText}: <span className="text-foreground">{range[0]}–{range[1]}</span>
        </label>
        <Slider
          min={def.min}
          max={def.max}
          step={1}
          value={range}
          onValueChange={(v) => onChange(v as [number, number])}
          className="py-2"
        />
      </div>
    );
  }

  return null;
}

function SectionToolbar({
  filterDefs,
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClearAll,
  filteredCount,
  totalCount,
  placeholder,
}: {
  filterDefs: FilterDef[];
  query: string;
  onQueryChange: (v: string) => void;
  filters: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
  onClearAll: () => void;
  filteredCount: number;
  totalCount: number;
  placeholder: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    for (const def of filterDefs) {
      const v = filters[def.key];
      if (def.type === 'multi-select') {
        if (Array.isArray(v) && v.length > 0) n++;
      } else if (def.type === 'year-range') {
        if (Array.isArray(v) && (v[0] !== def.min || v[1] !== def.max)) n++;
      } else if (typeof v === 'string' && v) {
        n++;
      }
    }
    return n;
  }, [filters, filterDefs]);

  return (
    <div className="border-b bg-muted/30">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder={placeholder}
              className="pl-9 h-9 bg-background"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                aria-label={t('library.toolbar.clearSearchAria')}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <Badge variant="secondary" className="text-[11px]">
            {filteredCount} / {totalCount}
          </Badge>
          {filterDefs.length > 0 && (
            <Button
              type="button"
              variant={activeFilterCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-9"
              onClick={() => setExpanded(e => !e)}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {t('library.toolbar.filtersButton')}
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-background/20 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
                : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
            </Button>
          )}
          {(activeFilterCount > 0 || query) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={onClearAll}>
              <X className="h-3 w-3 mr-1" /> {t('library.toolbar.clearAllButton')}
            </Button>
          )}
        </div>

        {expanded && filterDefs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t">
            {filterDefs.map(def => (
              <FilterControl
                key={def.key}
                def={def}
                value={filters[def.key]}
                onChange={v => onFilterChange(def.key, v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bir kütüphane bölümünü accordion içinde render eder. Bölüm-özel filtre setini
 * `filterDefs` ile alır; arama placeholder'ı bölüme göre özelleştirilebilir.
 *
 * Component her bölüm için ayrı instance olarak mount edildiği için query/filter
 * state'i bölüm-yerel kalır (önceki global SectionAccordion ile aynı davranış).
 */
export function SectionAccordion({
  section,
  filterDefs = [],
  searchPlaceholder,
}: {
  section: LibrarySection;
  filterDefs?: FilterDef[];
  searchPlaceholder?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const filteredItems = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return (section.items ?? []).filter((item: LibraryItem) => {
      if (lower) {
        const haystack = `${item.title} ${stripHtml(item.content || '')}`.toLowerCase();
        if (!haystack.includes(lower)) return false;
      }
      for (const def of filterDefs) {
        const v = filters[def.key];
        if (def.type === 'select') {
          if (typeof v === 'string' && v && !itemContainsValue(item, v)) return false;
        } else if (def.type === 'multi-select') {
          if (Array.isArray(v) && v.length > 0) {
            const someMatch = (v as string[]).some(val => itemContainsValue(item, val));
            if (!someMatch) return false;
          }
        } else if (def.type === 'year-range') {
          if (Array.isArray(v) && (v[0] !== def.min || v[1] !== def.max)) {
            const year = extractYear(item);
            if (year == null) return false;
            if (year < (v[0] as number) || year > (v[1] as number)) return false;
          }
        }
      }
      return true;
    });
  }, [section.items, query, filters, filterDefs]);

  const Icon = LIBRARY_ICONS[section.icon] ?? HelpCircle;
  const placeholder = searchPlaceholder ?? `${section.title} ${t('library.toolbar.defaultPlaceholderSuffix')}`;

  return (
    <Card key={section.slug} className="overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value={section.slug} className="border-b-0">
          <AccordionTrigger className="p-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-semibold text-sm leading-tight">{section.title}</p>
                <p className="text-[12px] text-muted-foreground leading-snug">{section.description}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t bg-background">
            {(section.items ?? []).length > 0 && (
              <SectionToolbar
                filterDefs={filterDefs}
                query={query}
                onQueryChange={setQuery}
                filters={filters}
                onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
                onClearAll={() => { setFilters({}); setQuery(''); }}
                filteredCount={filteredItems.length}
                totalCount={(section.items ?? []).length}
                placeholder={placeholder}
              />
            )}
            {filteredItems.length > 0 ? (
              filteredItems.map(item => {
                // Veri Kütüphanesi item'ları künye taşır (source/sourceUrl): başlığın
                // altında küçük "kaynak (yıl) · kaynağa git ↗" satırı gösterilir. Nested
                // <a> kaçınmak için satır Link değil; başlık ile kaynak linki ayrı tıklanır.
                const hasCite = !!(item.source || item.sourceUrl);
                if (hasCite) {
                  return (
                    <div key={item.slug} className="border-b last:border-b-0 hover:bg-muted/50">
                      <Link
                        href={`/library/${item.slug}`}
                        className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1"
                      >
                        <span className="text-sm font-medium min-w-0 break-words">{item.title}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                      {/* "kaynağa git" linki yalnız DETAY sayfasında; listede künye satırı
                          sade tutulur (kaynak + yıl). */}
                      {item.source && (
                        <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap px-3 pb-2 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground/70">
                            {item.source}{item.year ? ` · ${item.year}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                // Filmler: kapaksız sade künye — başlık + puan + konu (yazar yok).
                // Kapak + detaylı künye DETAY sayfasında.
                if (section.slug === 'filmler') {
                  // IMDb puanı: explicit imdbRating > genel rating.
                  const imdbScore = readNumberField(item, 'imdbRating') ?? item.rating;
                  // Türkçe dublaj: dub undefined → bilinmiyor (badge yok).
                  const dubRaw = readStringField(item, 'dub');
                  const hasDub = dubRaw !== undefined
                    ? !/^(yok|no|false|0)$/i.test(dubRaw.trim())
                    : undefined;
                  return (
                    <Link
                      href={`/library/${item.slug}`}
                      key={item.slug}
                      className="block px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium min-w-0 break-words">{item.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {typeof imdbScore === 'number' && (
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0.5">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <span className="text-[11px] font-bold tabular-nums">IMDb {imdbScore.toFixed(1)}</span>
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      {item.genre && (
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{item.genre}</p>
                      )}
                      {hasDub !== undefined && (
                        <Badge
                          variant="secondary"
                          className={
                            hasDub
                              ? 'mt-1 px-1.5 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-transparent'
                              : 'mt-1 px-1.5 py-0.5 text-[11px] bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-transparent'
                          }
                        >
                          {hasDub ? 'Türkçe dublaj var' : 'Türkçe dublaj yok'}
                        </Badge>
                      )}
                    </Link>
                  );
                }
                // Akademik makaleler: başlığın altında yazar · yıl · üniversite.
                if (section.slug === 'akademik-makaleler') {
                  const university = readStringField(item, 'university');
                  const meta = [item.author, item.year ? String(item.year) : '', university]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <Link
                      href={`/library/${item.slug}`}
                      key={item.slug}
                      className="block px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium min-w-0 break-words">{item.title}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      {meta && (
                        <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">{meta}</p>
                      )}
                    </Link>
                  );
                }
                return (
                  <Link
                    href={`/library/${item.slug}`}
                    key={item.slug}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium min-w-0 break-words">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {(section.items ?? []).length === 0
                    ? t('library.sectionNoItems')
                    : t('library.sectionNoMatches')}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
