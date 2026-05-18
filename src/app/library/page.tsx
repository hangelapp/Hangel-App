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
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { Search, ChevronRight, BookOpen, X, Filter, ChevronDown, ChevronUp, Bot, Sparkles, Send, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { LibrarySection, LibraryItem } from '@/lib/library';
import { librarySections as staticSections } from '@/lib/library';

type FilterDef =
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'multi-select'; options: string[] }
  | { key: string; label: string; type: 'year-range'; min: number; max: number };

const FILM_FILTERS: FilterDef[] = [
  {
    key: 'category', label: 'Kategori', type: 'select',
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
    key: 'language', label: 'Dil', type: 'select',
    options: ['İngilizce', 'Türkçe', 'Arapça', 'Korece', 'Fransızca', 'Hintçe',
      'Japonca', 'Norveççe', 'İtalyanca', 'İşaret Dili', 'Çok Dilli'],
  },
  {
    key: 'dub', label: 'Dublaj / Ses', type: 'select',
    options: ['Türkçe', 'İngilizce'],
  },
  { key: 'year', label: 'Yıl Aralığı', type: 'year-range', min: 1962, max: 2021 },
  {
    key: 'genre', label: 'Tür', type: 'select',
    options: ['Film', 'Belgesel (Film)', 'Belgesel (Dizi)'],
  },
  {
    key: 'country', label: 'Ülke / Bölge', type: 'select',
    options: ['ABD / İngilizce Yapımlar', 'Türkiye', 'Fransa', 'Güney Kore',
      'Hindistan', 'Japonya', 'Norveç', 'İtalya', 'Çok Uluslu'],
  },
  {
    key: 'emotion', label: 'Duygu / Deneyim', type: 'multi-select',
    options: ['Vicdan', 'Cesaret', 'İnsanlık', 'Umut', 'Azim', 'Hayatta Kalma',
      'Adalet', 'Mücadele', 'Gerçeklerin Ortaya Çıkması', 'Sarsıcı', 'Yoksulluk',
      'Dayanışma', 'Empati', 'Kabul', 'Dışlanma', 'Kimlik Arayışı', 'Bağımsızlık',
      'Sevgi', 'Dostluk', 'Yalnızlık', 'Travma', 'Kayıp', 'İyilik', 'İlham',
      'Motivasyon', 'Sistem Eleştirisi', 'Toplumsal Farkındalık', 'Aktivizm', 'Özgürlük'],
  },
  {
    key: 'contentType', label: 'İçerik Türü', type: 'select',
    options: ['Gerçek Hikaye', 'Kurgu'],
  },
  {
    key: 'hangelAction', label: 'Hangel Aksiyonu', type: 'select',
    options: ['Gönüllülük', 'Bağış', 'Farkındalık', 'Eğitim'],
  },
];

const BOOK_FILTERS: FilterDef[] = [
  {
    key: 'category', label: 'Kategori', type: 'select',
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
    key: 'language', label: 'Dil', type: 'select',
    options: ['Türkçe', 'İngilizce', 'Rusça', 'Almanca', 'Fransızca', 'İspanyolca'],
  },
  {
    key: 'country', label: 'Ülke / Bölge', type: 'select',
    options: ['Türkiye', 'Global / Uluslararası', 'ABD / İngiltere', 'Rusya',
      'Almanya', 'Fransa', 'İspanya', 'Avrupa', 'Latin Amerika'],
  },
  {
    key: 'contentType', label: 'İçerik Türü', type: 'select',
    options: ['Akademik Kitap', 'Araştırma / Rapor', 'Rehber / Handbook',
      'Biyografi / Otobiyografi', 'Hikaye / Vaka Analizi', 'Teorik Kitap',
      'Pratik Uygulama Kitabı', 'Politika / Analiz Kitabı'],
  },
  {
    key: 'focusArea', label: 'Odak Alanı', type: 'multi-select',
    options: ['Sosyal Etki', 'Gönüllülük', 'STK Yönetimi', 'Sosyal Girişim',
      'Kamu Politikası', 'Eğitim', 'Sağlık', 'İnsan Hakları', 'Çevre',
      'Ekonomi / Kalkınma'],
  },
  {
    key: 'level', label: 'Seviye', type: 'select',
    options: ['Başlangıç', 'Orta', 'İleri / Akademik'],
  },
  {
    key: 'publisher', label: 'Yayınevi', type: 'select',
    options: ['Oxford University Press', 'Penguin', 'Wiley', 'Routledge',
      'Springer', 'STGM Yayınları', 'Nobel Yayınları', 'İletişim Yayınları',
      'Remzi Kitabevi', 'Kamu Yayınları', 'UNDP / World Bank / OECD'],
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

function getFilterDefs(section: LibrarySection): FilterDef[] {
  if (isFilmSection(section)) return FILM_FILTERS;
  if (isBookSection(section)) return BOOK_FILTERS;
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
  if (def.type === 'select') {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {def.label}
        </label>
        <Select value={(typeof value === 'string' && value) || '__all__'} onValueChange={v => onChange(v === '__all__' ? '' : v)}>
          <SelectTrigger className="h-9 bg-background text-xs">
            <SelectValue placeholder={`Tüm ${def.label}`} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="__all__">Tüm {def.label}</SelectItem>
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
            {def.label}
          </label>
          {arr.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Temizle ({arr.length})
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
          {def.label}: <span className="text-foreground">{range[0]}–{range[1]}</span>
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
    ? 'Film, yönetmen veya tür ara...'
    : isBookSection(section)
      ? 'Kitap, yazar veya kategori ara...'
      : `${section.title} içinde ara...`;

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
                aria-label="Aramayı temizle"
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
              Filtreler
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
              <X className="h-3 w-3 mr-1" /> Temizle
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

  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[section.icon] || BookOpen;

  return (
    <Card key={section.slug} className="overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value={section.slug} className="border-b-0">
          <AccordionTrigger className="p-4 hover:no-underline">
            <div className="flex items-center gap-4">
              <Icon className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-semibold">{section.title}</p>
                <p className="text-sm text-muted-foreground">{section.description}</p>
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
                  className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50"
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
                    ? 'Bu bölümde henüz içerik bulunmuyor.'
                    : 'Aramaya uyan sonuç yok.'}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

// TODO: OpenAI/Gemini API key + library docs context'i ile entegre edilecek.
type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number };
type AssistantKind = 'library' | 'project';

const ASSISTANT_META: Record<AssistantKind, { title: string; description: string; placeholder: string; endpoint: string; storageKey: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  library: { title: 'Kütüphane Asistanı', description: 'Yalnızca kütüphanedeki dokümanları kullanarak sorularınızı yanıtlar.', placeholder: 'Kütüphane içeriği hakkında bir soru sorun...', endpoint: '/api/library/chat', storageKey: 'hangel.assistant.library.history', icon: Bot, accent: 'bg-primary text-primary-foreground' },
  project: { title: 'Proje Yazma Asistanı', description: 'Projenizi anlatın, kütüphane ve yönetim şablonlarıyla proje dokümanı oluştursun.', placeholder: 'Projenizi birkaç cümleyle anlatın...', endpoint: '/api/library/project', storageKey: 'hangel.assistant.project.history', icon: Sparkles, accent: 'bg-fuchsia-600 text-white' },
};

function AssistantDialog({ kind, open, onOpenChange }: { kind: AssistantKind; open: boolean; onOpenChange: (o: boolean) => void }) {
  const meta = ASSISTANT_META[kind];
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

  const handleSend = async () => {
    const text = input.trim();
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
      toast({ title: 'AI servisi henüz hazır değil', description: 'AI servisi yakında aktif olacak. Süper admin yapay zeka yönetiminden eğitildikten sonra cevap verecek.' });
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
            {meta.title}
          </DialogTitle>
          <DialogDescription className="text-xs">{meta.description}</DialogDescription>
        </DialogHeader>
        <div ref={listRef} className="px-5 py-4 h-[60vh] max-h-[420px] overflow-y-auto space-y-3 bg-muted/30">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Icon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{meta.placeholder}</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={`${m.ts}-${idx}`} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={m.role === 'user' ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap' : 'max-w-[80%] rounded-2xl rounded-bl-sm bg-background border px-3 py-2 text-sm whitespace-pre-wrap'}>
                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">{m.role === 'user' ? 'Siz' : meta.title}</div>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-background border px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Düşünüyor...</div>
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-background flex items-end gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }} placeholder={meta.placeholder} disabled={sending} className="flex-1" />
          <Button type="button" size="icon" onClick={() => void handleSend()} disabled={sending || !input.trim()} aria-label="Gönder">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          {messages.length > 0 && (
            <Button type="button" size="icon" variant="ghost" onClick={handleClear} aria-label="Geçmişi temizle"><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LibraryAssistantsFab() {
  const [openLibrary, setOpenLibrary] = useState(false);
  const [openProject, setOpenProject] = useState(false);
  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <Button type="button" onClick={() => setOpenProject(true)} className="rounded-full shadow-lg h-14 w-14 p-0 bg-fuchsia-600 hover:bg-fuchsia-700 text-white" aria-label="Proje Yazma Asistanı" title="Proje Yazma Asistanı"><Sparkles className="h-6 w-6" /></Button>
        <Button type="button" onClick={() => setOpenLibrary(true)} className="rounded-full shadow-lg h-14 w-14 p-0" aria-label="Kütüphane Asistanı" title="Kütüphane Asistanı"><Bot className="h-6 w-6" /></Button>
      </div>
      <AssistantDialog kind="library" open={openLibrary} onOpenChange={setOpenLibrary} />
      <AssistantDialog kind="project" open={openProject} onOpenChange={setOpenProject} />
    </>
  );
}

export default function LibraryPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const libQuery = useMemoFirebase(() => collection(db, 'library'), [db]);
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
        title: 'Hangel Sözlüğü',
        description: 'Hangel ekosistemine özel kavramların açıklamaları.',
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

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const lower = searchTerm.toLowerCase();
    return sections.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.items?.some(i => i.title.toLowerCase().includes(lower))
    );
  }, [sections, searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 bg-secondary min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Kütüphane</h1>
        <p className="mt-2 text-muted-foreground">Sosyal etki kaynaklarını veritabanından anlık keşfedin.</p>
      </div>

      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Tüm kategorilerde ara..."
          className="pl-10 h-11"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse bg-muted" />)
        ) : filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aramanızla eşleşen sonuç bulunamadı.</p>
          </div>
        ) : filteredSections.map(section => (
          <SectionAccordion key={section.slug} section={section} />
        ))}
      </div>

      <LibraryAssistantsFab />
    </div>
  );
}
