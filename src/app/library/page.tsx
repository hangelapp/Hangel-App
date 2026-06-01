'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Search, ChevronRight, BookOpen, X, Filter, ChevronDown, ChevronUp, Bot, Sparkles, Send, Loader2, Trash2, Download,
  Bookmark, Compass,
  // LIBRARY_ICONS allow-list — bu map'e yeni icon eklerken hem import hem `LIBRARY_ICONS` entry'si gerekir.
  Library, GraduationCap, BookMarked, FileText, BookA, Globe, Database, Film, HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { LibrarySection, LibraryItem } from '@/lib/library';
import { librarySections as staticSections } from '@/lib/library';
import { useTranslation } from '@/components/providers/language-provider';

// Kütüphane bölüm icon allow-list'i. Bölüm icon'ları Firestore'dan runtime string
// olarak gelir; lucide wildcard import yerine kapalı küme map kullanıyoruz.
// Yeni bir bölüm icon'u eklemek için: (1) named import'a ekle, (2) burayı güncelle.
// (P2-4b, decisions.md 2026-05-18.)
const LIBRARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

type FilterDef =
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'multi-select'; options: string[] }
  | { key: string; label: string; type: 'year-range'; min: number; max: number };

const FILM_FILTERS: FilterDef[] = [
  {
    key: 'category', label: 'category', type: 'select',
    options: [
      'İnsan Hakları', 'Yoksulluk & Umut', 'Etik & Hukuk', 'Dijital Toplum',
      'Kriz & Yardım', 'Gazetecilik & Adalet', 'Çocuk Hakları', 'Sosyal Eşitsizlik',
      'Eğitim & Dayanışma', 'Gönüllülük & İyilik', 'Ekonomi & Sistem', 'Eğitim & Aktivizm',
      'Çevre', 'İklim Krizi', 'Kültür & Umut', 'Otizm & Nöroçeşitlilik',
      'Nadir Hastalıklar', 'ALS & Nörodejeneratif Hastalıklar', 'ALS & Nörolojik Hastalık',
      'Serebral Palsi', 'Serebral Palsi & Bakım', 'Serebral Palsi & Yaşam',
      'Fiziksel Engellilik', 'Engellilik & Aktivizm', 'Engellilik & Sosyal Uyum',
      'Engellilik & Eğitim', 'Engellilik & Toplumsal Algı', 'Engellilik & Dayanışma',
      'Körlük (Görme Engeli)', 'Sağır & İşitme Engeli', 'Rehber Köpekler',
      'Hayvan Hakları', 'Irkçılık & İnsan Hakları', 'İyilik & Gönüllülük',
      'STK & Aktivizm', 'Sosyal Etki', 'Sosyal Girişim', 'Sosyal Adalet',
      'İşçi Hakları', 'Etik İş Dünyası', 'Sosyal Aktivizm',
      'Sosyal Tabu & Sosyal Girişim', 'Mülteci & Göç', 'Mülteci & Savaş',
      'Mülteci & Kimlik', 'Göç & Aile', 'Mülteci & Dayanışma', 'Göç & Çocuk',
      'Mülteci & Belgesel', 'Göç & Emek', 'Hak Mücadelesi', 'Hak & Sistem',
      'Ezilen Gruplar', 'Göç & Aktivizm', 'Mülteci & Kadın', 'Göç & Umut',
    ],
  },
  {
    key: 'language', label: 'language', type: 'select',
    options: ['İngilizce', 'Türkçe', 'Arapça', 'Korece', 'Fransızca', 'Hintçe',
      'Japonca', 'Norveççe', 'İtalyanca', 'İşaret Dili', 'Çok Dilli'],
  },
  {
    key: 'dub', label: 'dub', type: 'select',
    options: ['Türkçe', 'İngilizce'],
  },
  { key: 'year', label: 'yearRange', type: 'year-range', min: 1962, max: 2021 },
  {
    key: 'genre', label: 'genre', type: 'select',
    options: ['Film', 'Belgesel (Film)', 'Belgesel (Dizi)'],
  },
  {
    key: 'country', label: 'country', type: 'select',
    options: ['ABD / İngilizce Yapımlar', 'Türkiye', 'Fransa', 'Güney Kore',
      'Hindistan', 'Japonya', 'Norveç', 'İtalya', 'Çok Uluslu'],
  },
  {
    key: 'emotion', label: 'emotion', type: 'multi-select',
    options: ['Vicdan', 'Cesaret', 'İnsanlık', 'Umut', 'Azim', 'Hayatta Kalma',
      'Adalet', 'Mücadele', 'Gerçeklerin Ortaya Çıkması', 'Sarsıcı', 'Yoksulluk',
      'Dayanışma', 'Empati', 'Kabul', 'Dışlanma', 'Kimlik Arayışı', 'Bağımsızlık',
      'Sevgi', 'Dostluk', 'Yalnızlık', 'Travma', 'Kayıp', 'İyilik', 'İlham',
      'Motivasyon', 'Sistem Eleştirisi', 'Toplumsal Farkındalık', 'Aktivizm', 'Özgürlük'],
  },
  {
    key: 'contentType', label: 'contentType', type: 'select',
    options: ['Gerçek Hikaye', 'Kurgu'],
  },
  {
    key: 'hangelAction', label: 'hangelAction', type: 'select',
    options: ['Gönüllülük', 'Bağış', 'Farkındalık', 'Eğitim'],
  },
];

const BOOK_FILTERS: FilterDef[] = [
  {
    key: 'category', label: 'category', type: 'select',
    options: [
      'Sosyal Girişimcilik', 'Liderlik', 'Strateji', 'Davranış Bilimi',
      'Gönüllülük', 'Gönüllülük Yönetimi', 'İletişim', 'Pazarlama',
      'Etki Ölçümü', 'Sosyal Etki', 'İnovasyon', 'Sosyal İnovasyon',
      'Yönetim', 'Kurumsal Yapı & Yönetim', 'Psikoloji', 'Toplum',
      'Toplumsal Etki', 'Toplumsal Düşünce', 'Toplumsal Analiz', 'Toplumsal Dönüşüm',
      'Sosyal Politika', 'Sosyal Kalkınma', 'Sosyal Etki ve Kalkınma',
      'Kent ve Toplum', 'Sosyoloji', 'Ekonomi', 'Girişimcilik', 'İş Dünyası',
      'Motivasyon', 'Eğitim', 'Eğitim ve Öğrenme', 'Proje Yönetimi',
      'İletişim ve Savunuculuk', 'Dijital Dönüşüm', 'Dernekçilik', 'Vakıf Kültürü',
      'Sivil Toplum Yönetimi', 'STK Finans ve Kaynak Geliştirme',
      'Bağış ve Fon Yönetimi', 'Gönüllülük & Sosyal Katılım', 'İyilik / Felsefe',
      'İyilik Yapmak', 'Sosyal Sorumluluk', 'Toplumsal Katılım', 'Etki Odaklı Liderlik',
      'İnsan Hakları', 'Hasta Hakları', 'Hayvan Hakları', 'Çocuk Hakları',
      'Engelli Hakları', 'Hukuksal Mücadeleler', 'Irkçılık ve Ayrımcılık',
      'Kadın Odaklı Çalışmalar', 'Göç ve Mülteciler', 'Sağlık / Toplum',
      'Sağlık Sistemleri', 'Halk Sağlığı', 'Psikososyal Destek', 'Otizm',
      'Nadir Hastalıklar', 'Çevre ve Sürdürülebilirlik', 'İklim Krizi',
      'Doğa Koruma', 'Başarı Hikayeleri', 'Sosyal Etki Hikayeleri',
      'Biyografi / Otobiyografi', 'İlham Veren Liderler', 'Gençlik',
      'Yaşlılara Hizmet', 'Çocuklar İçin',
    ],
  },
  {
    key: 'language', label: 'language', type: 'select',
    options: ['Türkçe', 'İngilizce', 'Rusça', 'Almanca', 'Fransızca', 'İspanyolca'],
  },
  {
    key: 'country', label: 'country', type: 'select',
    options: ['Türkiye', 'Global / Uluslararası', 'ABD / İngiltere', 'Rusya',
      'Almanya', 'Fransa', 'İspanya', 'Avrupa', 'Latin Amerika'],
  },
  {
    key: 'contentType', label: 'contentType', type: 'select',
    options: ['Akademik Kitap', 'Araştırma / Rapor', 'Rehber / Handbook',
      'Biyografi / Otobiyografi', 'Hikaye / Vaka Analizi', 'Teorik Kitap',
      'Pratik Uygulama Kitabı', 'Politika / Analiz Kitabı'],
  },
  {
    key: 'focusArea', label: 'focusArea', type: 'multi-select',
    options: ['Sosyal Etki', 'Gönüllülük', 'STK Yönetimi', 'Sosyal Girişim',
      'Kamu Politikası', 'Eğitim', 'Sağlık', 'İnsan Hakları', 'Çevre',
      'Ekonomi / Kalkınma'],
  },
  {
    key: 'level', label: 'level', type: 'select',
    options: ['Başlangıç', 'Orta', 'İleri / Akademik'],
  },
  {
    key: 'publisher', label: 'publisher', type: 'select',
    options: ['Oxford University Press', 'Penguin', 'Wiley', 'Routledge',
      'Springer', 'STGM Yayınları', 'Nobel Yayınları', 'İletişim Yayınları',
      'Remzi Kitabevi', 'Kamu Yayınları', 'UNDP / World Bank / OECD'],
  },
];

// Akademik Makaleler bölümü için filtre seti. Veri kaynağı: src/lib/library.ts
// `akademik-makaleler` item'ları — her item.content HTML içinde "Konu" ve "Yayınevi"
// alanları geçer. `itemContainsValue` haystack araması bu serbest-metin alanlarını yakalar.
const ACADEMIC_FILTERS: FilterDef[] = [
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

function isFilmSection(section: LibrarySection): boolean {
  const t = `${section.slug ?? ''} ${section.title ?? ''}`.toLowerCase();
  return t.includes('film') || t.includes('sinema') || t.includes('movie');
}

function isBookSection(section: LibrarySection): boolean {
  const t = `${section.slug ?? ''} ${section.title ?? ''}`.toLowerCase();
  return t.includes('kitap') || t.includes('book');
}

function isInventorySection(section: LibrarySection): boolean {
  const t = `${section.slug ?? ''} ${section.title ?? ''}`.toLowerCase();
  return t.includes('envanter') || t.includes('inventory') || t.includes('sosyal etki envanteri');
}

function isDataLibrarySection(section: LibrarySection): boolean {
  const t = `${section.slug ?? ''} ${section.title ?? ''}`.toLowerCase();
  return t.includes('veri kütüphanesi') || t.includes('veri kutuphanesi') || t.includes('veri-kutuphanesi');
}

function isAcademicSection(section: LibrarySection): boolean {
  const t = `${section.slug ?? ''} ${section.title ?? ''}`.toLowerCase();
  return t.includes('akademik') || t.includes('academic') || t.includes('makale');
}

// Envanter (hangel Sosyal Etki Envanteri) için filtre seti.
// Veri kaynağı: src/lib/hangel-impact-inventory.json — her item.content HTML içinde
// "Sektör", "Merkez Ülke", "Kuruluş Yılı", "Skor" alanları geçer. `itemContainsValue`
// haystack araması bu serbest-metin alanlarını yakalar.
// Veri Kütüphanesi (resmi/akademik veri setleri) için filtre seti.
// Item içeriklerinde kaynak kurum, yıl ve konu metinleri haystack araması ile
// eşleşir (itemContainsValue serbest-metin tarayıcı).
const DATA_LIBRARY_FILTERS: FilterDef[] = [
  {
    key: 'source', label: 'source', type: 'select',
    options: [
      'T.C. İçişleri Bakanlığı', 'T.C. Sağlık Bakanlığı', 'T.C. Aile ve Sosyal Hizmetler',
      'T.C. Çevre, Şehircilik ve İklim Değişikliği', 'T.C. Milli Eğitim Bakanlığı',
      'T.C. Hazine ve Maliye', 'TÜİK', 'Cumhurbaşkanlığı SBB',
      'İstanbul Büyükşehir Belediyesi', 'Ankara Büyükşehir Belediyesi',
      'İzmir Büyükşehir Belediyesi', 'TÜSEV', 'TÜBİTAK', 'Üniversite Araştırması',
    ],
  },
  {
    key: 'scope', label: 'scope', type: 'select',
    options: ['Türkiye geneli', 'İstanbul', 'Ankara', 'İzmir', 'Bölgesel', 'AB', 'Uluslararası'],
  },
  { key: 'year', label: 'dataYear', type: 'year-range', min: 2000, max: 2025 },
  {
    key: 'topic', label: 'topic', type: 'select',
    options: [
      'Sosyal Etki', 'Sosyal Yardım', 'Gönüllülük', 'Eğitim', 'Sağlık', 'Çevre',
      'Afet', 'Göç', 'Yoksulluk', 'Cinsiyet Eşitliği', 'Engellilik',
      'Yaşlılık', 'Çocuk Hakları', 'STK Yönetimi', 'Bağışçılık',
    ],
  },
];

const INVENTORY_FILTERS: FilterDef[] = [
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

function getFilterDefs(section: LibrarySection): FilterDef[] {
  if (isFilmSection(section)) return FILM_FILTERS;
  if (isBookSection(section)) return BOOK_FILTERS;
  if (isInventorySection(section)) return INVENTORY_FILTERS;
  if (isDataLibrarySection(section)) return DATA_LIBRARY_FILTERS;
  if (isAcademicSection(section)) return ACADEMIC_FILTERS;
  return [];
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

function extractYear(item: LibraryItem): number | null {
  const text = `${item.title} ${stripHtml(item.content || '')}`;
  const match = text.match(/\b(19[6-9]\d|20[0-2]\d)\b/);
  return match ? Number(match[1]) : null;
}

function itemContainsValue(item: LibraryItem, value: string): boolean {
  const haystack = `${item.title} ${stripHtml(item.content || '')}`.toLowerCase();
  return haystack.includes(value.toLowerCase());
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
  section,
  filterDefs,
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClearAll,
  filteredCount,
  totalCount,
}: {
  section: LibrarySection;
  filterDefs: FilterDef[];
  query: string;
  onQueryChange: (v: string) => void;
  filters: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
  onClearAll: () => void;
  filteredCount: number;
  totalCount: number;
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

  const placeholder = isFilmSection(section)
    ? t('library.toolbar.filmPlaceholder')
    : isBookSection(section)
      ? t('library.toolbar.bookPlaceholder')
      : `${section.title} ${t('library.toolbar.defaultPlaceholderSuffix')}`;

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

function SectionAccordion({ section }: { section: LibrarySection }) {
  const { t } = useTranslation();
  const filterDefs = useMemo(() => getFilterDefs(section), [section]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const filteredItems = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return (section.items ?? []).filter((item: LibraryItem) => {
      // Metin araması
      if (lower) {
        const haystack = `${item.title} ${stripHtml(item.content || '')}`.toLowerCase();
        if (!haystack.includes(lower)) return false;
      }
      // Yapılandırılmış filtreler
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
            if (year == null) return false; // yıl bulunamayan eşleşmez
            if (year < (v[0] as number) || year > (v[1] as number)) return false;
          }
        }
      }
      return true;
    });
  }, [section.items, query, filters, filterDefs]);

  const Icon = LIBRARY_ICONS[section.icon] ?? HelpCircle;

  return (
    <Card key={section.slug} className="overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value={section.slug} className="border-b-0">
          <AccordionTrigger className="p-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm leading-tight">{section.title}</p>
                <p className="text-[12px] text-muted-foreground leading-snug">{section.description}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t bg-background">
            {(section.items ?? []).length > 0 && (
              <SectionToolbar
                section={section}
                filterDefs={filterDefs}
                query={query}
                onQueryChange={setQuery}
                filters={filters}
                onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
                onClearAll={() => { setFilters({}); setQuery(''); }}
                filteredCount={filteredItems.length}
                totalCount={(section.items ?? []).length}
              />
            )}
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <Link
                  href={`/library/${item.slug}`}
                  key={item.slug}
                  className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
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

// Asistan API endpoint'leri: backend-lead `src/app/api/library/{chat,project}/route.ts`
// route'ları sağlar; route yoksa client toast'ı kullanıcıya bilgi verir (graceful degrade).
type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number };
type AssistantKind = 'library' | 'project';

const ASSISTANT_META: Record<AssistantKind, { titleKey: string; descriptionKey: string; placeholderKey: string; endpoint: string; storageKey: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  library: { titleKey: 'library.assistant.libraryTitle', descriptionKey: 'library.assistant.libraryDescription', placeholderKey: 'library.assistant.libraryPlaceholder', endpoint: '/api/library/chat', storageKey: 'hangel.assistant.library.history', icon: Bot, accent: 'bg-primary text-primary-foreground' },
  project: { titleKey: 'library.assistant.projectTitle', descriptionKey: 'library.assistant.projectDescription', placeholderKey: 'library.assistant.projectPlaceholder', endpoint: '/api/library/project', storageKey: 'hangel.assistant.project.history', icon: Sparkles, accent: 'bg-fuchsia-600 text-white' },
};

// Boş sohbet ekranında gösterilen tıklanabilir örnek sorular (kullanıcıyı başlatır).
const SUGGESTED_QUESTION_KEYS: Record<AssistantKind, string[]> = {
  library: [
    'library.suggestedQuestions.library1',
    'library.suggestedQuestions.library2',
    'library.suggestedQuestions.library3',
    'library.suggestedQuestions.library4',
  ],
  project: [
    'library.suggestedQuestions.project1',
    'library.suggestedQuestions.project2',
    'library.suggestedQuestions.project3',
  ],
};

// PDF #3: kullanıcı projesini hangi kuruma sunacağını seçer, AI o kurumun esaslarına
// uygun proje üretir. Liste süper-admin tarafında genişletilebilir; client tarafında
// sabit tutuyoruz (Firestore'da `aiAssistantConfig/project.institutions` opsiyonel).
const PROJECT_INSTITUTIONS = [
  'Marka (Kurumsal Sponsor)',
  'STK / Dernek',
  'Vakıf',
  'Üniversite',
  'Belediye',
  'Bakanlık',
  'AB (Avrupa Birliği) Fonları',
  'UNDP',
  'TÜBİTAK',
  'KOSGEB',
  'Diğer',
] as const;

function AssistantDialog({ kind, open, onOpenChange }: { kind: AssistantKind; open: boolean; onOpenChange: (o: boolean) => void }) {
  const meta = ASSISTANT_META[kind];
  const { t } = useTranslation();
  const metaTitle = t(meta.titleKey);
  const metaDescription = t(meta.descriptionKey);
  const metaPlaceholder = t(meta.placeholderKey);
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(meta.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch { /* ignore */ }
  }, [meta.storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(meta.storageKey, JSON.stringify(messages)); } catch { /* ignore */ }
  }, [messages, meta.storageKey]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const handleSend = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    setMessages(prev => [...prev, { role: 'user', content: text, ts: Date.now() }]);
    setInput('');
    setSending(true);
    try {
      const res = await fetch(meta.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: messages.slice(-10) }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      const reply = (data?.reply ?? '').toString().trim();
      if (!reply) throw new Error('Empty reply');
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      toast({ title: t('library.assistant.unavailableTitle'), description: t('library.assistant.unavailableDesc') });
    } finally { setSending(false); }
  };

  const handleClear = () => {
    setMessages([]);
    try { if (typeof window !== 'undefined') window.localStorage.removeItem(meta.storageKey); } catch { /* ignore */ }
  };

  const Icon = meta.icon;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${meta.accent}`}><Icon className="h-4 w-4" /></span>
            {metaTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">{metaDescription}</DialogDescription>
        </DialogHeader>
        <div ref={listRef} className="px-5 py-4 h-[60vh] max-h-[420px] overflow-y-auto space-y-3 bg-muted/30">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
              <Icon className="h-8 w-8 opacity-50" />
              <p className="text-sm">{metaPlaceholder}</p>
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {SUGGESTED_QUESTION_KEYS[kind].map(qKey => {
                  const q = t(qKey);
                  return (
                    <button
                      key={qKey}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="text-xs rounded-full border bg-background px-3 py-1.5 text-foreground hover:bg-accent transition-colors"
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={`${m.ts}-${idx}`} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={m.role === 'user' ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap' : 'max-w-[80%] rounded-2xl rounded-bl-sm bg-background border px-3 py-2 text-sm whitespace-pre-wrap'}>
                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">{m.role === 'user' ? t('library.assistant.userLabel') : metaTitle}</div>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-background border px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t('library.assistant.thinking')}</div>
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-background flex items-end gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }} placeholder={metaPlaceholder} disabled={sending} className="flex-1" />
          <Button type="button" size="icon" onClick={() => void handleSend()} disabled={sending || !input.trim()} aria-label={t('library.assistant.sendAria')}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          {messages.length > 0 && (
            <Button type="button" size="icon" variant="ghost" onClick={handleClear} aria-label={t('library.assistant.clearHistoryAria')}><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// PDF #3: çok-adımlı proje yazma formu. Kullanıcı kurum + konu + hedef-kitle/bütçe/süre
// girer; backend `/api/library/project` route'u `writeProjectProposal` flow'unu çağırır
// (ProjectWriterInput.sections schema'sıyla birebir uyumlu: summary/goals/audience/...).
function ProjectWriterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const meta = ASSISTANT_META.project;
  const { t } = useTranslation();
  const metaTitle = t(meta.titleKey);
  const { toast } = useToast();
  const db = useFirestore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [institution, setInstitution] = useState<string>('');

  // Süper-admin'in yayınladığı hibe/fon programları — dialog açıldığında lazy yüklenir
  const fundsRef = useMemoFirebase(() => (open && db ? collection(db, COLLECTIONS.funds) : null), [open, db]);
  const { data: funds } = useCollection<{ id: string; name?: string; provider?: string; status?: string }>(fundsRef);

  const fundInstitutions = useMemo(() => {
    const list = (funds || [])
      .filter(f => f.name && (!f.status || f.status === 'Açık'))
      .map(f => `${f.name}${f.provider ? ` — ${f.provider}` : ''}`);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [funds]);
  const [summary, setSummary] = useState('');
  const [goals, setGoals] = useState('');
  const [audience, setAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [activities, setActivities] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [proposal, setProposal] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setInstitution('');
    setSummary('');
    setGoals('');
    setAudience('');
    setBudget('');
    setActivities('');
    setProposal(null);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(meta.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution,
          sections: { summary, goals, audience, activities, budget },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { fullProposal?: string; reply?: string };
      const text = (data?.fullProposal ?? data?.reply ?? '').toString().trim();
      if (!text) throw new Error('Empty proposal');
      setProposal(text);
      setStep(4);
    } catch {
      toast({
        title: t('library.projectWriter.unavailableTitle'),
        description: t('library.projectWriter.unavailableDesc'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadWord = () => {
    if (!proposal) return;
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const bodyHtml = proposal
      .split(/\n{2,}/)
      .map(para => `<p>${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
      .join('');
    const htmlString =
      `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Proje</title></head><body style="font-family:Calibri,Arial,sans-serif;line-height:1.5;">` +
      bodyHtml +
      `</body></html>`;
    const slug =
      (institution || 'proje-onerisi')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'proje-onerisi';
    const blob = new Blob([htmlString], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canAdvance =
    (step === 1 && institution.length > 0) ||
    (step === 2 && summary.trim().length >= 10) ||
    (step === 3 && (goals.trim().length > 0 || audience.trim().length > 0 || budget.trim().length > 0));

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="rounded-3xl max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${meta.accent}`}>
              <Sparkles className="h-4 w-4" />
            </span>
            {metaTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step < 4
              ? `${t('library.projectWriter.stepLabel')} ${step} ${t('library.projectWriter.stepOfThree')} ${
                  step === 1
                    ? t('library.projectWriter.step1Desc')
                    : step === 2
                      ? t('library.projectWriter.step2Desc')
                      : t('library.projectWriter.step3Desc')
                }`
              : t('library.projectWriter.step4Desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto bg-muted/20">
          {step === 1 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('library.projectWriter.institutionLabel')}
              </label>
              <Select value={institution} onValueChange={setInstitution}>
                <SelectTrigger>
                  <SelectValue placeholder={t('library.projectWriter.institutionPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {fundInstitutions.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t('library.projectWriter.openFundsHeader')}
                      </div>
                      {fundInstitutions.map(inst => (
                        <SelectItem key={`fund:${inst}`} value={inst}>{inst}</SelectItem>
                      ))}
                      <div className="px-2 py-1.5 mt-1 border-t text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t('library.projectWriter.generalInstitutionsHeader')}
                      </div>
                    </>
                  )}
                  {PROJECT_INSTITUTIONS.map(inst => (
                    <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {t('library.projectWriter.institutionHint')}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('library.projectWriter.summaryLabel')}
              </label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={6}
                maxLength={2000}
                className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('library.projectWriter.summaryPlaceholder')}
              />
              <p className="text-[11px] text-muted-foreground text-right">{summary.length}/2000</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.goalsLabel')}
                </label>
                <textarea
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.goalsPlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.audienceLabel')}
                </label>
                <textarea
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.audiencePlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.activitiesLabel')}
                </label>
                <textarea
                  value={activities}
                  onChange={e => setActivities(e.target.value)}
                  rows={2}
                  maxLength={1500}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.activitiesPlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.budgetLabel')}
                </label>
                <textarea
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.budgetPlaceholder')}
                />
              </div>
            </div>
          )}

          {step === 4 && proposal && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t('library.projectWriter.proposalReadyText')} <strong>{institution}</strong>
              </p>
              <textarea
                readOnly
                value={proposal}
                rows={16}
                className="w-full rounded-lg border bg-background p-3 text-sm font-mono"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleDownloadWord}>
                <Download className="h-4 w-4 mr-2" /> {t('library.projectWriter.downloadWord')}
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-background flex items-center justify-between gap-2">
          {step > 1 && step < 4 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
              {t('library.projectWriter.back')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {step < 3 && (
              <Button
                type="button"
                size="sm"
                disabled={!canAdvance}
                onClick={() => setStep(s => (s + 1) as 2 | 3)}
              >
                {t('library.projectWriter.next')}
              </Button>
            )}
            {step === 3 && (
              <Button
                type="button"
                size="sm"
                disabled={submitting || !canAdvance}
                onClick={() => void handleSubmit()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('library.projectWriter.preparing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> {t('library.projectWriter.generate')}
                  </>
                )}
              </Button>
            )}
            {step === 4 && (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                <Trash2 className="h-4 w-4 mr-2" /> {t('library.projectWriter.newProject')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LibraryAssistantsFab({ openLibrary, setOpenLibrary, openProject, setOpenProject }: {
  openLibrary: boolean; setOpenLibrary: (o: boolean) => void;
  openProject: boolean; setOpenProject: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const libAria = t('library.fab.libraryAria');
  const projAria = t('library.fab.projectAria');
  return (
    <>
      {/* PDF #1: sağ kenarın ortasında 2 yapay zeka ikonu (sticky vertical-center). */}
      <div className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-3">
        <Button
          type="button"
          onClick={() => setOpenLibrary(true)}
          className="rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-14 p-0"
          aria-label={libAria}
          title={libAria}
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        <Button
          type="button"
          onClick={() => setOpenProject(true)}
          className="rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-14 p-0 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          aria-label={projAria}
          title={projAria}
        >
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
      <AssistantDialog kind="library" open={openLibrary} onOpenChange={setOpenLibrary} />
      <ProjectWriterDialog open={openProject} onOpenChange={setOpenProject} />
    </>
  );
}

export default function LibraryPage() {
  const { t } = useTranslation();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [openLibrary, setOpenLibrary] = useState(false);
  const [openProject, setOpenProject] = useState(false);

  // Kişiselleştirme için kullanıcının kaydet/okudu listesi (users/{uid}).
  const { user } = useUser();
  const userRef = useMemoFirebase(() => (user ? doc(db, COLLECTIONS.users, user.uid) : null), [db, user]);
  const { data: userData } = useDoc<{
    savedLibraryItems?: string[];
    readLibraryItems?: string[];
    volunteerInfo?: { interests?: string[]; profession?: string; skills?: string[]; dailySkills?: string[] };
  }>(userRef);

  const libQuery = useMemoFirebase(() => collection(db, COLLECTIONS.library), [db]);
  const { data: libData, isLoading } = useCollection<LibrarySection>(libQuery);

  const sections = useMemo(() => {
    const firestoreMap = new Map((libData ?? []).map(s => [s.slug, s]));
    const merged = staticSections.map(staticSec => {
      const fsSec = firestoreMap.get(staticSec.slug);
      if (!fsSec) return staticSec;
      const staticSlugs = new Set(staticSec.items.map(i => i.slug));
      const extraItems = (fsSec.items ?? []).filter(i => !staticSlugs.has(i.slug));
      return { ...staticSec, items: [...staticSec.items, ...extraItems] };
    });
    const staticSlugs = new Set(staticSections.map(s => s.slug));
    const extraSections = (libData ?? []).filter(s => !staticSlugs.has(s.slug));

    // Yeni statik bölüm başlıkları (içerik Firestore'dan beslenecek; yoksa boş durum gösterilir)
    const placeholderSections: LibrarySection[] = [
      {
        slug: 'akademik-makaleler',
        title: 'Akademik Makaleler',
        description: 'Hakemli dergilerde yayımlanmış akademik kaynaklar.',
        icon: 'FileText',
        items: [],
      },
      {
        slug: 'hangel-sozlugu',
        title: 'hangel Sözlüğü',
        description: 'hangel ekosistemine özel kavramların açıklamaları.',
        icon: 'BookA',
        items: [],
      },
      {
        slug: 'sivil-toplum-sozlugu',
        title: 'Sivil Toplum Sözlüğü',
        description: 'Sivil toplum alanında sık kullanılan kavramlar.',
        icon: 'Library',
        items: [],
      },
    ];

    // Firestore'da aynı slug ile veri varsa onu kullan, yoksa placeholder göster
    const combinedFromPlaceholders = placeholderSections.map(ph => {
      const fs = firestoreMap.get(ph.slug);
      if (fs) return { ...ph, items: fs.items ?? [] };
      return ph;
    });

    // Henüz herhangi bir listede yoksa ekle
    const allKnownSlugs = new Set([
      ...merged.map(m => m.slug),
      ...extraSections.map(e => e.slug),
    ]);
    const toAppend = combinedFromPlaceholders.filter(p => !allKnownSlugs.has(p.slug));

    return [...merged, ...extraSections, ...toAppend];
  }, [libData]);

  // Tam metin arama için bölüm bazında haystack'i bir kez hesapla (her tuş
  // vuruşunda tüm içeriği yeniden stripHtml etmemek için memoize).
  const sectionHaystacks = useMemo(() => {
    const m = new Map<string, string>();
    sections.forEach(s => {
      const itemsText = (s.items ?? []).map(i => `${i.title} ${stripHtml(i.content || '')}`).join(' ');
      m.set(s.slug, `${s.title} ${s.description ?? ''} ${itemsText}`.toLowerCase());
    });
    return m;
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const lower = searchTerm.toLowerCase();
    // Başlık + açıklama + içerik (tam metin) içinde ara.
    return sections.filter(s => (sectionHaystacks.get(s.slug) ?? '').includes(lower));
  }, [sections, searchTerm, sectionHaystacks]);

  // Kişisel: kaydettiklerin + profilin için öneriler.
  // Öneriler kullanıcının Gönüllülük profilini (hassasiyet=interests, meslek,
  // yetkinlik) baz alır; her bölümden (kitap/film/envanter) en uyumlu 3 içerik.
  type FlatItem = LibraryItem & { sectionSlug: string };
  const personal = useMemo(() => {
    if (!user) return null;
    const saved = Array.isArray(userData?.savedLibraryItems) ? userData!.savedLibraryItems! : [];
    const allItems: FlatItem[] = sections.flatMap(s => (s.items ?? []).map(i => ({ ...i, sectionSlug: s.slug })));
    const bySlug = new Map(allItems.map(i => [i.slug, i]));
    const savedItems = saved.map(sl => bySlug.get(sl)).filter((x): x is FlatItem => Boolean(x));

    // Profil ilgi anahtar kelimeleri (hassasiyet + meslek + yetkinlik).
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
      const t = w.trim();
      if (t.length >= 3 && !STOP.has(t)) keywords.add(t);
    }));
    const kw = Array.from(keywords);

    // İçeriğin başlık+metnini bir kez hesapla, anahtar kelime kesişimine göre puanla.
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
      return top.length > 0 ? top : items.slice(0, n); // eşleşme yoksa ilk n'e düş
    };

    const hasProfile = kw.length > 0; // Hakkında/Gönüllülük bilgisi doldurulmuş mu
    const recGroups = hasProfile ? [
      { title: t('library.recGroupBooks'), items: pickMatched('kitaplar', 3) },
      { title: t('library.recGroupFilms'), items: pickMatched('filmler', 3) },
      { title: t('library.recGroupInventory'), items: pickMatched('hangel-sosyal-etki-envanteri', 3) },
    ].filter(g => g.items.length > 0) : [];
    return { savedItems, recGroups, hasProfile };
  }, [user, userData, sections, t]);

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

      {/* AI asistanlarını öne çıkaran CTA */}
      <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpenLibrary(true)}
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm hover:bg-accent transition-colors"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></span>
          <span>
            <span className="block font-semibold text-sm">{t('library.ctaLibraryAssistant')}</span>
            <span className="block text-xs text-muted-foreground">{t('library.ctaLibraryAssistantDesc')}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpenProject(true)}
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm hover:bg-accent transition-colors"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-white"><Sparkles className="h-5 w-5" /></span>
          <span>
            <span className="block font-semibold text-sm">{t('library.ctaProjectWriter')}</span>
            <span className="block text-xs text-muted-foreground">{t('library.ctaProjectWriterDesc')}</span>
          </span>
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse bg-muted" />)
        ) : filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('library.noSearchResults')}</p>
          </div>
        ) : filteredSections.map(section => (
          <SectionAccordion key={section.slug} section={section} />
        ))}
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
