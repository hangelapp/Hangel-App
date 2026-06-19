'use client';

/**
 * /super-admin/conference-deck — Konferans sunumu düzenleyici.
 *
 * Slaytları `siteSettings/conferenceDeck`.slides alanında saklar (public read +
 * super-admin write). Sunum (/gelir-modeli-konferanslari/sunum) bu veriyi okur;
 * doc yoksa DEFAULT_SLIDES kullanılır. Slayt ekle/sil/sırala/çoğalt + tüm metin
 * alanlarını düzenle + kaydet + önizle.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronUp, ChevronDown, Trash2, Copy, Save, Eye, RotateCcw, Loader2, Presentation,
} from 'lucide-react';
import {
  type Slide, type SlideKind, DEFAULT_SLIDES, DECK_COLLECTION, DECK_DOC,
  SLIDE_KIND_LABEL, normalizeSlides,
} from '@/lib/conference-deck';

const KIND_ORDER: SlideKind[] = ['title', 'section', 'body', 'stats', 'list', 'flow', 'research', 'closing', 'thanks'];

function newSlide(kind: SlideKind): Slide {
  switch (kind) {
    case 'title': return { kind, eyebrow: 'Üst başlık', title: 'Başlık', sub: 'Alt başlık' };
    case 'section': return { kind, num: '07', name: 'Yeni Bölüm' };
    case 'body': return { kind, title: 'Başlık', lines: ['Metin'] };
    case 'stats': return { kind, title: 'Başlık', stats: [{ big: '00', label: 'açıklama' }] };
    case 'list': return { kind, title: 'Başlık', items: ['Madde 1', 'Madde 2'] };
    case 'flow': return { kind, title: 'Başlık', steps: ['Adım 1', 'Adım 2', 'Adım 3'] };
    case 'research': return { kind, n: 1, paper: 'Makale başlığı', year: '2024', authors: ['Yazar'], unis: ['Üniversite'], finding: ['Çıktı'] };
    case 'closing': return { kind, title: 'Kapanış', lines: ['Metin'], qr: 'https://hangel.org.tr/gelir-modeli-konferanslari' };
    case 'thanks': return { kind, title: 'Teşekkürler', sub: 'hangel', qr: 'https://hangel.org.tr/gelir-modeli-konferanslari' };
  }
}

const cleanArr = (a: string[]) => a.map(s => s.trim()).filter(Boolean);

function cleanSlide(s: Slide): Slide {
  switch (s.kind) {
    case 'body': return { ...s, lines: cleanArr(s.lines) };
    case 'list': return { ...s, items: cleanArr(s.items) };
    case 'flow': return { ...s, steps: cleanArr(s.steps) };
    case 'closing': return { ...s, lines: cleanArr(s.lines) };
    case 'stats': return { ...s, stats: s.stats.filter(x => (x.big || '').trim() || (x.label || '').trim()) };
    case 'research': return { ...s, authors: cleanArr(s.authors), unis: cleanArr(s.unis), finding: cleanArr(s.finding) };
    default: return s;
  }
}

/** Çoklu satır alanları: yazarken boş satırı silmeyiz (kullanıcı Enter'a basabilsin). */
function ArrField({ label, value, onChange, rows = 3 }: { label: string; value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  return (
    <Field label={label}>
      <Textarea rows={rows} value={value.join('\n')} onChange={e => onChange(e.target.value.split('\n'))} className="resize-y font-medium" />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SlideEditor({ slide, onChange }: { slide: Slide; onChange: (s: Slide) => void }) {
  const u = (partial: Partial<Slide>) => onChange({ ...slide, ...partial } as Slide);

  switch (slide.kind) {
    case 'title':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Üst başlık"><Input value={slide.eyebrow} onChange={e => u({ eyebrow: e.target.value })} /></Field>
          <Field label="Alt başlık"><Input value={slide.sub} onChange={e => u({ sub: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Başlık (Enter = satır kırma)"><Textarea rows={3} value={slide.title} onChange={e => u({ title: e.target.value })} /></Field></div>
        </div>
      );
    case 'section':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Numara (örn. 07)"><Input value={slide.num} onChange={e => u({ num: e.target.value })} /></Field>
          <Field label="Bölüm adı"><Input value={slide.name} onChange={e => u({ name: e.target.value })} /></Field>
        </div>
      );
    case 'body':
      return (
        <div className="space-y-3">
          <Field label="Üst başlık (opsiyonel)"><Input value={slide.eyebrow ?? ''} onChange={e => u({ eyebrow: e.target.value })} /></Field>
          <Field label="Başlık (Enter = satır kırma)"><Textarea rows={2} value={slide.title} onChange={e => u({ title: e.target.value })} /></Field>
          <ArrField label="Paragraflar (her satır ayrı)" value={slide.lines} onChange={lines => u({ lines })} />
        </div>
      );
    case 'stats':
      return (
        <div className="space-y-3">
          <Field label="Başlık"><Input value={slide.title} onChange={e => u({ title: e.target.value })} /></Field>
          <Field label="Giriş (opsiyonel)"><Input value={slide.intro ?? ''} onChange={e => u({ intro: e.target.value })} /></Field>
          <Field label="Rakamlar — her satır: 54 | açıklama">
            <Textarea rows={3} value={slide.stats.map(s => `${s.big} | ${s.label}`).join('\n')}
              onChange={e => u({ stats: e.target.value.split('\n').map(line => { const idx = line.indexOf('|'); return idx === -1 ? { big: line.trim(), label: '' } : { big: line.slice(0, idx).trim(), label: line.slice(idx + 1).trim() }; }) })} />
          </Field>
          <Field label="Alt not (opsiyonel)"><Input value={slide.foot ?? ''} onChange={e => u({ foot: e.target.value })} /></Field>
          <label className="flex items-center gap-2 pt-1 text-sm font-medium">
            <input type="checkbox" checked={!!slide.row} onChange={e => u({ row: e.target.checked })} className="h-4 w-4 accent-[#f34723]" />
            Rakamlar tek satırda yan yana
          </label>
        </div>
      );
    case 'list':
      return (
        <div className="space-y-3">
          <Field label="Başlık"><Input value={slide.title} onChange={e => u({ title: e.target.value })} /></Field>
          <Field label="Giriş (opsiyonel)"><Input value={slide.intro ?? ''} onChange={e => u({ intro: e.target.value })} /></Field>
          <ArrField label="Maddeler (her satır ayrı; 7+ madde 2 sütun olur)" value={slide.items} onChange={items => u({ items })} rows={5} />
          <Field label="Alt not (opsiyonel)"><Input value={slide.foot ?? ''} onChange={e => u({ foot: e.target.value })} /></Field>
          <label className="flex items-center gap-2 pt-1 text-sm font-medium">
            <input type="checkbox" checked={!!slide.reveal} onChange={e => u({ reveal: e.target.checked })} className="h-4 w-4 accent-[#f34723]" />
            Maddeler tıklayınca açılsın (önce başlık görünür)
          </label>
        </div>
      );
    case 'flow':
      return (
        <div className="space-y-3">
          <Field label="Başlık"><Input value={slide.title} onChange={e => u({ title: e.target.value })} /></Field>
          <Field label="Giriş (opsiyonel)"><Input value={slide.intro ?? ''} onChange={e => u({ intro: e.target.value })} /></Field>
          <ArrField label="Adımlar (her satır ayrı; sonuncusu coral vurgulu)" value={slide.steps} onChange={steps => u({ steps })} rows={5} />
        </div>
      );
    case 'research':
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Sıra no"><Input type="number" value={String(slide.n)} onChange={e => u({ n: Number(e.target.value) || 1 })} /></Field>
            <div className="sm:col-span-2"><Field label="Yıl"><Input value={slide.year} onChange={e => u({ year: e.target.value })} /></Field></div>
          </div>
          <Field label="Makale başlığı"><Textarea rows={2} value={slide.paper} onChange={e => u({ paper: e.target.value })} /></Field>
          <ArrField label="Yazarlar (her satır ayrı)" value={slide.authors} onChange={authors => u({ authors })} />
          <ArrField label="Üniversiteler (her satır ayrı)" value={slide.unis} onChange={unis => u({ unis })} />
          <ArrField label="Çıktı (her satır ayrı)" value={slide.finding} onChange={finding => u({ finding })} />
          <Field label="En vurucu bulgu / örneklem (opsiyonel)"><Textarea rows={2} value={slide.highlight ?? ''} onChange={e => u({ highlight: e.target.value })} /></Field>
          <Field label="Kaynak linki (opsiyonel)"><Input value={slide.source ?? ''} onChange={e => u({ source: e.target.value })} placeholder="https://…" /></Field>
        </div>
      );
    case 'closing':
      return (
        <div className="space-y-3">
          <Field label="Başlık (Enter = satır kırma)"><Textarea rows={2} value={slide.title} onChange={e => u({ title: e.target.value })} /></Field>
          <ArrField label="Satırlar (her satır ayrı)" value={slide.lines} onChange={lines => u({ lines })} />
          <Field label="QR kod linki (boşsa “Kayıt Ol” butonu görünür)"><Input value={slide.qr ?? ''} onChange={e => u({ qr: e.target.value })} placeholder="https://hangel.org.tr/…" /></Field>
        </div>
      );
    case 'thanks':
      return (
        <div className="space-y-3">
          <Field label="Başlık"><Input value={slide.title} onChange={e => u({ title: e.target.value })} /></Field>
          <Field label="Alt başlık (opsiyonel)"><Input value={slide.sub ?? ''} onChange={e => u({ sub: e.target.value })} /></Field>
          <Field label="QR kod linki (opsiyonel)"><Input value={slide.qr ?? ''} onChange={e => u({ qr: e.target.value })} placeholder="https://hangel.org.tr/…" /></Field>
        </div>
      );
  }
}

export default function ConferenceDeckEditorPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const deckRef = useMemoFirebase(() => (db ? doc(db, DECK_COLLECTION, DECK_DOC) : null), [db]);
  const { data: deckDoc, isLoading } = useDoc<{ slides?: unknown }>(deckRef);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current || isLoading) return;
    setSlides(normalizeSlides(deckDoc?.slides ?? DEFAULT_SLIDES));
    inited.current = true;
  }, [isLoading, deckDoc]);

  const update = (idx: number, s: Slide) => { setSlides(prev => prev.map((p, k) => (k === idx ? s : p))); setDirty(true); };
  const move = (idx: number, d: -1 | 1) => {
    setSlides(prev => {
      const j = idx + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setDirty(true);
  };
  const remove = (idx: number) => { setSlides(prev => prev.filter((_, k) => k !== idx)); setDirty(true); };
  const duplicate = (idx: number) => { setSlides(prev => [...prev.slice(0, idx + 1), structuredClone(prev[idx]), ...prev.slice(idx + 1)]); setDirty(true); };
  const add = (kind: SlideKind) => { setSlides(prev => [...prev, newSlide(kind)]); setDirty(true); };
  const resetDefault = () => { setSlides(DEFAULT_SLIDES.map(s => structuredClone(s))); setDirty(true); toast({ title: 'Varsayılan içerik yüklendi', description: 'Kaydet’e basana kadar canlıya gitmez.' }); };

  const save = async () => {
    if (!deckRef) return;
    setSaving(true);
    try {
      const cleaned = slides.map(cleanSlide).filter(s => s && s.kind);
      await setDoc(deckRef, { slides: cleaned, updatedAt: serverTimestamp() }, { merge: true });
      setDirty(false);
      toast({ title: 'Sunum kaydedildi ✓', description: `${cleaned.length} slayt canlıya alındı.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : 'Bilinmeyen hata.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Üst bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Presentation className="h-6 w-6 text-primary" /> Konferans Sunumu</h1>
          <p className="text-sm text-muted-foreground">Gelir Modeli Konferansları · {slides.length} slayt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/gelir-modeli-konferanslari/sunum" target="_blank"><Eye className="mr-1.5 h-4 w-4" /> Önizle</Link>
          </Button>
          <Button onClick={save} disabled={saving || !dirty} size="sm">
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Kaydet
          </Button>
        </div>
      </div>

      {dirty && <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Kaydedilmemiş değişiklikler var — “Kaydet”e basınca canlıya gider.</div>}

      {isLoading && !inited.current ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Yükleniyor…</div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">{idx + 1}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{SLIDE_KIND_LABEL[slide.kind]}</Badge>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => move(idx, -1)} title="Yukarı"><ChevronUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === slides.length - 1} onClick={() => move(idx, 1)} title="Aşağı"><ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(idx)} title="Çoğalt"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(idx)} title="Sil"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <SlideEditor slide={slide} onChange={s => update(idx, s)} />
              </CardContent>
            </Card>
          ))}

          {/* Slayt ekle */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Sona slayt ekle:</p>
              <div className="flex flex-wrap gap-2">
                {KIND_ORDER.map(kind => (
                  <Button key={kind} variant="outline" size="sm" onClick={() => add(kind)}>+ {SLIDE_KIND_LABEL[kind]}</Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={resetDefault}><RotateCcw className="mr-1.5 h-4 w-4" /> Varsayılana sıfırla</Button>
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Kaydet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
