'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection } from 'firebase/firestore';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  GitCompare, Globe, Scale, ShieldCheck, AlertTriangle, Loader2,
  Filter, ArrowLeft, Download, ArrowDownAZ, ArrowUp01,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { contractsData as seedContracts } from '@/lib/contracts';

// ---- Tipler ----
type Jurisdiction = {
  code: string;     // 'TR', 'US-CA', vb.
  label: string;    // 'Türkiye'
  flag: string;     // emoji
};

type DocKind = 'contract' | 'policy' | 'beyan';
type SortMode = 'name-asc' | 'score-asc';

interface ContractDoc {
  id: string;
  slug: string;
  title: string;
  content?: string;
  kind?: DocKind | string;
  group?: string;
}

interface ComplianceRow {
  id: string;
  contractSlug: string;
  jurisdiction: string;
  score: number;
  missingSections?: unknown[];
  suggestions?: unknown[];
}

// ---- Sabit ülke listesi ----
const JURISDICTIONS: Jurisdiction[] = [
  { code: 'TR',    label: 'Türkiye',          flag: '🇹🇷' },
  { code: 'EU',    label: 'Avrupa Birliği',   flag: '🇪🇺' },
  { code: 'UK',    label: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'US-CA', label: 'ABD (California)', flag: '🇺🇸' },
  { code: 'DE',    label: 'Almanya',          flag: '🇩🇪' },
  { code: 'FR',    label: 'Fransa',           flag: '🇫🇷' },
  { code: 'ES',    label: 'İspanya',          flag: '🇪🇸' },
  { code: 'IT',    label: 'İtalya',           flag: '🇮🇹' },
  { code: 'CA',    label: 'Kanada',           flag: '🇨🇦' },
  { code: 'AU',    label: 'Avustralya',       flag: '🇦🇺' },
  { code: 'JP',    label: 'Japonya',          flag: '🇯🇵' },
  { code: 'BR',    label: 'Brezilya',         flag: '🇧🇷' },
];

const KIND_LABEL: Record<string, string> = {
  contract: 'Sözleşme',
  policy:   'Politika',
  beyan:    'Beyan',
};

function inferKind(c: ContractDoc): DocKind {
  if (c.kind === 'policy' || c.kind === 'beyan' || c.kind === 'contract') {
    return c.kind;
  }
  const hay = `${c.title} ${c.group || ''}`.toLowerCase();
  if (/beyan|aydınlatma|aydinlatma/.test(hay)) return 'beyan';
  if (/politika|gizlilik|kvkk|çerez|cerez|topluluk|moderasyon/.test(hay)) return 'policy';
  return 'contract';
}

function scoreColor(score: number): { bg: string; text: string; ring: string; emoji: string } {
  if (score >= 80) {
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-500/40', emoji: '🟢' };
  }
  if (score >= 50) {
    return { bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-500/40', emoji: '🟡' };
  }
  return { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-500/40', emoji: '🔴' };
}

function avgBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// CSV güvenli alıntı
function csvCell(v: string | number): string {
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ---- Ana Sayfa ----
export default function ComplianceMatrixPage() {
  const router = useRouter();
  const db = useFirestore();

  // 1) Sözleşmeler (Firestore + seed birleşik)
  const contractsQuery = useMemoFirebase(
    () => collection(db, COLLECTIONS.contracts),
    [db],
  );
  const { data: firestoreContracts, isLoading: loadingContracts } =
    useCollection<ContractDoc>(contractsQuery);

  // 2) Compliance matris (1344 doc beklenir: 112 sözleşme × 12 ülke)
  const complianceQuery = useMemoFirebase(
    () => collection(db, COLLECTIONS.contractCompliance),
    [db],
  );
  const { data: complianceRows, isLoading: loadingCompliance } =
    useCollection<ComplianceRow>(complianceQuery);

  const allDocs = useMemo<ContractDoc[]>(() => {
    const map = new Map<string, ContractDoc>();
    seedContracts.forEach(s => {
      map.set(s.slug, { id: s.slug, slug: s.slug, title: s.title, content: s.content });
    });
    (firestoreContracts || []).forEach(c => {
      const slug = c.slug || c.id;
      map.set(slug, { ...map.get(slug), ...c, slug, id: slug });
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  }, [firestoreContracts]);

  // Compliance lookup — Firestore field bazlı, doc id formatından bağımsız
  const scoreMap = useMemo(() => {
    const map = new Map<string, ComplianceRow>();
    (complianceRows || []).forEach(r => {
      const slug = r.contractSlug;
      const j = r.jurisdiction;
      if (!slug || !j) return;
      map.set(`${slug}__${j}`, r);
    });
    return map;
  }, [complianceRows]);

  // ---- Filtreler ----
  const [kindFilter, setKindFilter] = useState<'all' | DocKind>('all');
  const [selectedJurs, setSelectedJurs] = useState<string[]>(
    () => JURISDICTIONS.map(j => j.code),
  );
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [onlyLow, setOnlyLow] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('name-asc');

  const visibleJurisdictions = useMemo(
    () => JURISDICTIONS.filter(j => selectedJurs.includes(j.code)),
    [selectedJurs],
  );

  const visibleDocs = useMemo(() => {
    let list = allDocs;
    if (kindFilter !== 'all') {
      list = list.filter(d => inferKind(d) === kindFilter);
    }
    if (onlyLow) {
      list = list.filter(d =>
        visibleJurisdictions.some(j => {
          const r = scoreMap.get(`${d.slug}__${j.code}`);
          return r ? r.score < 50 : false;
        }),
      );
    }
    // Score range — bir hücresi bile aralıkta ise göster
    if (scoreRange[0] > 0 || scoreRange[1] < 100) {
      list = list.filter(d =>
        visibleJurisdictions.some(j => {
          const r = scoreMap.get(`${d.slug}__${j.code}`);
          if (!r) return false;
          return r.score >= scoreRange[0] && r.score <= scoreRange[1];
        }),
      );
    }
    if (sortMode === 'score-asc') {
      // Her doc için görünen jurisdictions üzerinden ortalama
      const avg = (d: ContractDoc): number => {
        let sum = 0;
        let cnt = 0;
        visibleJurisdictions.forEach(j => {
          const r = scoreMap.get(`${d.slug}__${j.code}`);
          if (r) { sum += r.score; cnt += 1; }
        });
        return cnt > 0 ? sum / cnt : Number.POSITIVE_INFINITY;
      };
      list = [...list].sort((a, b) => avg(a) - avg(b));
    }
    return list;
  }, [allDocs, kindFilter, onlyLow, scoreRange, visibleJurisdictions, scoreMap, sortMode]);

  // ---- Özet istatistik (tüm filtreli matris) ----
  const stats = useMemo(() => {
    let sum = 0;
    let count = 0;
    visibleDocs.forEach(d => {
      visibleJurisdictions.forEach(j => {
        const r = scoreMap.get(`${d.slug}__${j.code}`);
        if (r) { sum += r.score; count += 1; }
      });
    });
    return {
      docCount: visibleDocs.length,
      jurCount: visibleJurisdictions.length,
      avgScore: count > 0 ? Math.round(sum / count) : 0,
      analyzed: count,
      totalCells: visibleDocs.length * visibleJurisdictions.length,
    };
  }, [visibleDocs, visibleJurisdictions, scoreMap]);

  // Her ülke için ortalama uyum (görünen docs üzerinden)
  const jurAverages = useMemo(() => {
    return visibleJurisdictions.map(j => {
      let sum = 0;
      let cnt = 0;
      visibleDocs.forEach(d => {
        const r = scoreMap.get(`${d.slug}__${j.code}`);
        if (r) { sum += r.score; cnt += 1; }
      });
      return { ...j, avg: cnt > 0 ? Math.round(sum / cnt) : 0, analyzed: cnt };
    });
  }, [visibleJurisdictions, visibleDocs, scoreMap]);

  // ---- CSV export ----
  const handleExportCsv = () => {
    const headers = ['slug', 'title', 'kind', ...visibleJurisdictions.map(j => j.code)];
    const lines = [headers.map(csvCell).join(',')];
    visibleDocs.forEach(d => {
      const row: (string | number)[] = [
        d.slug,
        d.title,
        KIND_LABEL[inferKind(d)] || inferKind(d),
      ];
      visibleJurisdictions.forEach(j => {
        const r = scoreMap.get(`${d.slug}__${j.code}`);
        row.push(r ? r.score : '');
      });
      lines.push(row.map(csvCell).join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hangel-uyum-matrisi-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleJur = (code: string) => {
    setSelectedJurs(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  };
  const allJursSelected = selectedJurs.length === JURISDICTIONS.length;

  const isLoading = loadingContracts || loadingCompliance;

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
              <Link href="/super-admin/contracts"><ArrowLeft className="h-4 w-4" /> Sözleşmeler</Link>
            </Button>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Uyumluluk Matrisi</h1>
          <p className="text-muted-foreground text-sm">
            hangel sözleşme ve politikalarının 12 ülke mevzuatına göre uyum yüzdesi.
            Hücreye tıkla → detay, eksik bölümler, mevzuat önerileri.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={isLoading || visibleDocs.length === 0}
          className="rounded-2xl gap-1.5"
        >
          <Download className="h-4 w-4" /> CSV indir
        </Button>
      </div>

      {/* Sekmeler */}
      <Tabs defaultValue="matris" className="w-full">
        <TabsList className="rounded-2xl p-1">
          <TabsTrigger value="matris" className="gap-1.5 rounded-xl">
            <GitCompare className="h-4 w-4" /> Uyum Matrisi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matris" className="mt-4 space-y-4">
          {/* Üst özet kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={Scale}
              label="Görünen Belge"
              value={stats.docCount}
              accent="primary"
            />
            <SummaryCard
              icon={Globe}
              label="Görünen Ülke"
              value={stats.jurCount}
              accent="primary"
            />
            <SummaryCard
              icon={ShieldCheck}
              label="Ortalama Uyum"
              value={`%${stats.avgScore}`}
              accent={stats.avgScore >= 80 ? 'green' : stats.avgScore >= 50 ? 'amber' : 'red'}
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Analiz Edilen"
              value={`${stats.analyzed} / ${stats.totalCells}`}
              accent={stats.analyzed === stats.totalCells ? 'green' : 'amber'}
            />
          </div>

          {/* Ülke ortalamaları — bar chart */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Ülke Ortalamaları
              </CardTitle>
              <CardDescription>
                Görünen belgeler üzerinden her yargı bölgesinin ortalama uyum yüzdesi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jurAverages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Filtreyle eşleşen ülke yok.
                </p>
              ) : (
                <div className="space-y-2">
                  {jurAverages.map(j => (
                    <div key={j.code} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-32 shrink-0">
                        <span className="text-base leading-none">{j.flag}</span>
                        <span className="text-xs font-semibold">{j.label}</span>
                      </div>
                      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', avgBarColor(j.avg))}
                          style={{ width: `${j.avg}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs font-mono font-bold">
                        %{j.avg}
                      </span>
                      <span className="w-20 text-right text-[10px] text-muted-foreground">
                        {j.analyzed} analiz
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filtreler */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Filtre ve Sıralama</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1.5 min-w-[160px]">
                  <Label className="text-xs">Belge Tipi</Label>
                  <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as 'all' | DocKind)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="policy">Politika</SelectItem>
                      <SelectItem value="contract">Sözleşme</SelectItem>
                      <SelectItem value="beyan">Beyan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-[180px]">
                  <Label className="text-xs">Sırala</Label>
                  <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">
                        <span className="inline-flex items-center gap-2">
                          <ArrowDownAZ className="h-3.5 w-3.5" /> İsim (A→Z)
                        </span>
                      </SelectItem>
                      <SelectItem value="score-asc">
                        <span className="inline-flex items-center gap-2">
                          <ArrowUp01 className="h-3.5 w-3.5" /> En düşük skor önce
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-2 text-xs cursor-pointer h-10 px-3 rounded-xl border bg-card">
                  <Checkbox
                    checked={onlyLow}
                    onCheckedChange={(c) => setOnlyLow(c === true)}
                  />
                  <span>Sadece &lt;%50 olanlar</span>
                </label>
              </div>

              {/* Skor aralığı */}
              <div className="space-y-2 max-w-md">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Skor aralığı (en az)</Label>
                  <span className="text-xs font-mono font-bold text-primary">
                    %{scoreRange[0]} – %{scoreRange[1]}
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[scoreRange[0]]}
                    onValueChange={(v) => setScoreRange([v[0] ?? 0, Math.max(v[0] ?? 0, scoreRange[1])])}
                    min={0}
                    max={100}
                    step={5}
                    aria-label="Minimum skor"
                  />
                  <Slider
                    value={[scoreRange[1]]}
                    onValueChange={(v) => setScoreRange([Math.min(scoreRange[0], v[0] ?? 100), v[0] ?? 100])}
                    min={0}
                    max={100}
                    step={5}
                    aria-label="Maksimum skor"
                  />
                </div>
              </div>

              {/* Jurisdiction multi-select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Yargı Bölgeleri ({selectedJurs.length}/{JURISDICTIONS.length})</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedJurs(
                      allJursSelected ? [] : JURISDICTIONS.map(j => j.code),
                    )}
                  >
                    {allJursSelected ? 'Hiçbiri' : 'Tümünü seç'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {JURISDICTIONS.map(j => {
                    const active = selectedJurs.includes(j.code);
                    return (
                      <button
                        key={j.code}
                        type="button"
                        onClick={() => toggleJur(j.code)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors',
                          active
                            ? 'bg-primary/10 text-primary border-primary/40 ring-1 ring-primary/30'
                            : 'bg-card text-muted-foreground border-border hover:bg-accent/40',
                        )}
                      >
                        <span className="text-sm leading-none">{j.flag}</span>
                        <span>{j.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matris */}
          <Card className="rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" /> Uyumluluk Matrisi
              </CardTitle>
              <CardDescription>
                Hücre rengi: 🟢 ≥80, 🟡 50-79, 🔴 &lt;50. Tıkla → detay sayfası.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : visibleDocs.length === 0 || visibleJurisdictions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground italic py-16">
                  Filtreyle eşleşen kayıt bulunamadı.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-xs border-t">
                    <thead className="bg-muted/40 sticky top-0 z-20">
                      <tr>
                        <th className="text-left p-3 font-bold sticky left-0 bg-muted/40 z-30 min-w-[220px] border-r">
                          Belge
                        </th>
                        {visibleJurisdictions.map(j => (
                          <th key={j.code} className="p-2 font-bold text-center min-w-[80px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base leading-none">{j.flag}</span>
                              <span className="text-[10px]">{j.code}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDocs.map(doc => {
                        const k = inferKind(doc);
                        return (
                          <tr key={doc.slug} className="border-b hover:bg-accent/30 transition-colors">
                            <td className="p-3 sticky left-0 bg-card hover:bg-accent/30 border-r">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold leading-tight">{doc.title}</span>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                    {KIND_LABEL[k] || k}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-mono truncate">/{doc.slug}</span>
                                </div>
                              </div>
                            </td>
                            {visibleJurisdictions.map(j => {
                              const row = scoreMap.get(`${doc.slug}__${j.code}`);
                              return (
                                <td key={j.code} className="p-1.5 text-center">
                                  <ComplianceCell
                                    row={row}
                                    onClick={() => router.push(
                                      `/super-admin/contracts/compliance/${doc.slug}/${j.code}`,
                                    )}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Alt componentler ----
function SummaryCard({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: 'primary' | 'green' | 'amber' | 'red';
}) {
  const accentCls =
    accent === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
    accent === 'amber' ? 'text-amber-600 dark:text-amber-400' :
    accent === 'red'   ? 'text-red-600 dark:text-red-400' :
                         'text-primary';
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-4 space-y-1">
        <Icon className={cn('h-5 w-5', accentCls)} />
        <p className="text-2xl font-black">{value}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

function ComplianceCell({
  row, onClick,
}: {
  row: ComplianceRow | undefined;
  onClick: () => void;
}) {
  if (!row) {
    return (
      <button
        onClick={onClick}
        className="w-full h-10 rounded-lg border border-dashed text-[10px] text-muted-foreground hover:bg-muted/60 transition-colors"
        title="Henüz analiz edilmedi — tıkla, başlat"
      >
        —
      </button>
    );
  }
  const c = scoreColor(row.score);
  const missingCount = Array.isArray(row.missingSections) ? row.missingSections.length : 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-10 rounded-lg flex flex-col items-center justify-center gap-0 font-bold transition-all hover:scale-105 hover:ring-2',
        c.bg, c.text, c.ring,
      )}
      title={`${row.score}% uyum — ${missingCount} eksik bölüm`}
    >
      <span className="text-sm leading-none">%{row.score}</span>
      {missingCount > 0 && (
        <span className="text-[8px] font-normal opacity-80 leading-none mt-0.5">
          {missingCount} eksik
        </span>
      )}
    </button>
  );
}
