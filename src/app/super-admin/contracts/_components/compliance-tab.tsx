'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, GitCompare, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  Lightbulb, Scale, ShieldCheck, History, ListChecks, Search, ArrowRight,
  ArrowDownAZ, ArrowUp01,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

interface ContractLite {
  slug: string;
  title: string;
  content: string;
  kind?: string;
  jurisdictions?: string[];
  riskLevel?: string;
  status?: string;
}

// Resmi 12 jurisdiction kodu — `compliance-engine.ts` ile birebir hizalı.
const OFFICIAL_JURISDICTIONS = ['TR','EU','UK','DE','FR','IT','ES','US-CA','CA','AU','JP','BR'] as const;

const JURISDICTION_LABEL: Record<string, string> = {
  TR: '🇹🇷 Türkiye',
  EU: '🇪🇺 Avrupa Birliği',
  UK: '🇬🇧 Birleşik Krallık',
  DE: '🇩🇪 Almanya',
  FR: '🇫🇷 Fransa',
  IT: '🇮🇹 İtalya',
  ES: '🇪🇸 İspanya',
  'US-CA': '🇺🇸 ABD (California)',
  CA: '🇨🇦 Kanada',
  AU: '🇦🇺 Avustralya',
  JP: '🇯🇵 Japonya',
  BR: '🇧🇷 Brezilya',
};

const RISK_LABEL: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

const KIND_LABEL: Record<string, string> = {
  contract: 'Sözleşme',
  policy: 'Politika',
  beyan: 'Beyan',
};

const STATUS_LABEL: Record<string, string> = {
  taslak: 'Taslak',
  incelemede: 'İncelemede',
  yayinlandi: 'Yayında',
  arsivlendi: 'Arşivlendi',
};
interface LegislationLite {
  id: string; name: string; number?: string; articleText?: string;
  interpretation?: string; hangelSubject?: string;
}

interface ComplianceResult {
  id?: string;
  score: number;
  summary: string;
  compliant: string[];
  missing: string[];
  risky: string[];
  suggestions: string[];
  affectedModules: string[];
}

interface SavedAnalysis extends ComplianceResult {
  id: string;
  contractSlug: string;
  contractTitle: string;
  legislationId: string;
  legislationName: string;
  analyzedAt: string | null;
}

function scoreMeta(score: number): { cls: string; ring: string; label: string } {
  if (score >= 80) return { cls: 'text-emerald-600', ring: 'border-emerald-500', label: 'Yüksek Uyum' };
  if (score >= 50) return { cls: 'text-amber-600', ring: 'border-amber-500', label: 'Kısmi Uyum' };
  return { cls: 'text-red-600', ring: 'border-red-500', label: 'Düşük Uyum' };
}

function ScoreRing({ score }: { score: number }) {
  const m = scoreMeta(score);
  return (
    <div className={cn('h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0', m.ring)}>
      <span className={cn('text-3xl font-black leading-none', m.cls)}>%{score}</span>
      <span className="text-[9px] text-muted-foreground mt-0.5">uyum</span>
    </div>
  );
}

function PointList({ icon: Icon, title, items, cls }: { icon: React.ElementType; title: string; items: string[]; cls: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className={cn('text-xs font-bold flex items-center gap-1.5', cls)}><Icon className="h-3.5 w-3.5" /> {title} ({items.length})</p>
      <ul className="space-y-1 pl-1">
        {items.map((it, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className={cn('mt-1 h-1 w-1 rounded-full shrink-0', cls.replace('text-', 'bg-'))} /> {it}</li>)}
      </ul>
    </div>
  );
}

type ActiveResult = ComplianceResult & { contractTitle: string; legislationName: string };

function ResultView({ result }: { result: ActiveResult }) {
  const { contractTitle, legislationName } = result;
  const m = scoreMeta(result.score);
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 flex-wrap">
        <ScoreRing score={result.score} />
        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-[10px]', m.cls.replace('text-', 'bg-').replace('-600', '-100'), m.cls)}>{m.label}</Badge>
            <span className="text-xs text-muted-foreground">{contractTitle} ↔ {legislationName}</span>
          </div>
          <p className="text-sm leading-snug">{result.summary}</p>
          {result.affectedModules.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {result.affectedModules.map(mod => <Badge key={mod} variant="outline" className="text-[9px]">{mod}</Badge>)}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <PointList icon={CheckCircle2} title="Uyumlu" items={result.compliant} cls="text-emerald-600" />
        <PointList icon={XCircle} title="Eksik" items={result.missing} cls="text-amber-600" />
        <PointList icon={AlertTriangle} title="Riskli / Çelişen" items={result.risky} cls="text-red-600" />
        <PointList icon={Lightbulb} title="Önerilen Güncellemeler" items={result.suggestions} cls="text-blue-600" />
      </div>
    </div>
  );
}

// =====================================================================
// Rule-based Compliance Overview — Tüm contractların `contractCompliance`
// koleksiyonundaki kural-tabanlı skorlarını topluca listeler.
//   - Headline % = sadece declared jurisdiction'lar üzerinden ortalama.
//   - Hiç declared resmi jurisdiction yoksa "—" gösterilir (kapsam dışı).
//   - Detay ve filtreleme için /super-admin/contracts/compliance matris
//     sayfasına link verilir.
// =====================================================================

interface ComplianceRowLite {
  id?: string;
  contractSlug?: string;
  jurisdiction?: string;
  score?: number;
}

type OverviewSort = 'score-asc' | 'score-desc' | 'title-asc';

function pctRing(pct: number): { ring: string; text: string; bar: string } {
  if (pct >= 90) return { ring: 'border-emerald-500', text: 'text-emerald-600', bar: 'bg-emerald-500' };
  if (pct >= 60) return { ring: 'border-amber-500',   text: 'text-amber-600',   bar: 'bg-amber-500' };
  return { ring: 'border-red-500', text: 'text-red-600', bar: 'bg-red-500' };
}

function ContractsComplianceOverview({ contracts }: { contracts: ContractLite[] }) {
  const db = useFirestore();
  const ccQuery = useMemoFirebase(() => collection(db, COLLECTIONS.contractCompliance), [db]);
  const { data: ccRows, isLoading } = useCollection<ComplianceRowLite>(ccQuery);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<OverviewSort>('score-desc');
  const [countryFilter, setCountryFilter] = useState<string[]>([]); // çoklu
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreBucket, setScoreBucket] = useState<string>('all'); // green / yellow / red / nodata

  // slug__jurisdiction → score lookup
  const scoreMap = useMemo(() => {
    const m = new Map<string, number>();
    (ccRows || []).forEach(r => {
      if (!r?.contractSlug || !r.jurisdiction || typeof r.score !== 'number') return;
      m.set(`${r.contractSlug}__${r.jurisdiction}`, r.score);
    });
    return m;
  }, [ccRows]);

  // Her contract için declared (resmi 12 ülke) jurisdiction ortalaması
  const rows = useMemo(() => {
    return contracts.map(c => {
      const declared = (Array.isArray(c.jurisdictions) ? c.jurisdictions : [])
        .filter((j): j is string => typeof j === 'string')
        .filter(j => (OFFICIAL_JURISDICTIONS as readonly string[]).includes(j));
      const scores: number[] = [];
      for (const j of declared) {
        const s = scoreMap.get(`${c.slug}__${j}`);
        if (typeof s === 'number') scores.push(s);
      }
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return {
        slug: c.slug,
        title: c.title,
        declared,
        scores,
        avg,
        kind: c.kind || 'contract',
        riskLevel: c.riskLevel || '',
        status: c.status || '',
      };
    });
  }, [contracts, scoreMap]);

  // Filtre + sıralama
  const visible = useMemo(() => {
    const lower = query.trim().toLowerCase();
    let list = rows.filter(r => {
      if (lower !== '' && !(r.title.toLowerCase().includes(lower) || r.slug.toLowerCase().includes(lower))) {
        return false;
      }
      if (countryFilter.length > 0 && !r.declared.some(j => countryFilter.includes(j))) {
        return false;
      }
      if (riskFilter !== 'all' && r.riskLevel !== riskFilter) {
        return false;
      }
      if (kindFilter !== 'all' && r.kind !== kindFilter) {
        return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      if (scoreBucket !== 'all') {
        const a = r.avg;
        if (scoreBucket === 'nodata' && a !== null) return false;
        if (scoreBucket === 'green' && (a === null || a < 90)) return false;
        if (scoreBucket === 'yellow' && (a === null || a < 60 || a >= 90)) return false;
        if (scoreBucket === 'red' && (a === null || a >= 60)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'title-asc') return a.title.localeCompare(b.title, 'tr');
      const av = a.avg ?? -1;
      const bv = b.avg ?? -1;
      if (sort === 'score-asc') return av - bv;
      return bv - av;
    });
    return list;
  }, [rows, query, sort, countryFilter, riskFilter, kindFilter, statusFilter, scoreBucket]);

  const activeFilterCount =
    (query ? 1 : 0) +
    (countryFilter.length > 0 ? 1 : 0) +
    (riskFilter !== 'all' ? 1 : 0) +
    (kindFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (scoreBucket !== 'all' ? 1 : 0);

  const clearAll = () => {
    setQuery('');
    setCountryFilter([]);
    setRiskFilter('all');
    setKindFilter('all');
    setStatusFilter('all');
    setScoreBucket('all');
  };

  // Headline istatistikleri — tüm contractlar üzerinden
  const stats = useMemo(() => {
    const scored = rows.filter(r => r.avg !== null);
    const totalAvg = scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + (r.avg as number), 0) / scored.length)
      : 0;
    const green = scored.filter(r => (r.avg as number) >= 90).length;
    const yellow = scored.filter(r => (r.avg as number) >= 60 && (r.avg as number) < 90).length;
    const red = scored.filter(r => (r.avg as number) < 60).length;
    const noScope = rows.length - scored.length;
    return { total: rows.length, scored: scored.length, totalAvg, green, yellow, red, noScope };
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Tüm Sözleşmelerin Mevzuat Uyum Durumu
            </CardTitle>
            <CardDescription>
              Kural-tabanlı motor her sözleşmeyi declared jurisdiction'larının zorunlu maddelerine karşı puanlar.
              Bir sözleşmenin yüzdesi, sadece declared jurisdictionları üzerinden ortalamasıdır.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
            <Link href="/super-admin/contracts/compliance">
              Tam Matris Görünümü <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="border rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Toplam Sözleşme</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ortalama Uyum</p>
            <p className={cn('text-2xl font-black', pctRing(stats.totalAvg).text)}>%{stats.totalAvg}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Yüksek (≥90)</p>
            <p className="text-2xl font-black text-emerald-600">{stats.green}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Kısmi (60-89)</p>
            <p className="text-2xl font-black text-amber-600">{stats.yellow}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Düşük (&lt;60)</p>
            <p className="text-2xl font-black text-red-600">{stats.red}</p>
          </div>
        </div>
        {stats.noScope > 0 && (
          <p className="text-[11px] text-muted-foreground">
            <strong>{stats.noScope}</strong> sözleşme henüz resmi 12 ülke jurisdiction'undan birine bağlanmamış — kapsam dışı olarak işaretlendi.
          </p>
        )}

        {/* Toolbar: arama + sıralama */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sözleşme ara..."
              className="h-9 pl-8 text-sm"
            />
          </div>
          <Select value={sort} onValueChange={v => setSort(v as OverviewSort)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score-desc">Uyum %: Yüksek → Düşük</SelectItem>
              <SelectItem value="score-asc">Uyum %: Düşük → Yüksek</SelectItem>
              <SelectItem value="title-asc">Başlık (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-[11px]">{visible.length}/{stats.total}</Badge>
        </div>

        {/* Filtre satırı: Ülke / Risk / Tür / Durum / Skor */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {/* Ülke (jurisdiction) — multi-select dropdown */}
          <Select
            value={countryFilter.length === 0 ? '__all__' : countryFilter.join(',')}
            onValueChange={v => {
              if (v === '__all__') setCountryFilter([]);
              else setCountryFilter([v]);
            }}
          >
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="Ülke / Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tüm ülkeler</SelectItem>
              {OFFICIAL_JURISDICTIONS.map(j => (
                <SelectItem key={j} value={j}>{JURISDICTION_LABEL[j]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Risk */}
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm risk</SelectItem>
              <SelectItem value="critical">Kritik</SelectItem>
              <SelectItem value="high">Yüksek</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="low">Düşük</SelectItem>
            </SelectContent>
          </Select>

          {/* Tür */}
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm tür</SelectItem>
              <SelectItem value="contract">Sözleşme</SelectItem>
              <SelectItem value="policy">Politika</SelectItem>
              <SelectItem value="beyan">Beyan</SelectItem>
            </SelectContent>
          </Select>

          {/* Durum (status) */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durum</SelectItem>
              <SelectItem value="yayinlandi">Yayında</SelectItem>
              <SelectItem value="taslak">Taslak</SelectItem>
              <SelectItem value="incelemede">İncelemede</SelectItem>
              <SelectItem value="arsivlendi">Arşivlendi</SelectItem>
            </SelectContent>
          </Select>

          {/* Skor bucket */}
          <Select value={scoreBucket} onValueChange={setScoreBucket}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Uyum seviyesi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm uyum</SelectItem>
              <SelectItem value="green">🟢 Yüksek (≥90)</SelectItem>
              <SelectItem value="yellow">🟡 Kısmi (60-89)</SelectItem>
              <SelectItem value="red">🔴 Düşük (&lt;60)</SelectItem>
              <SelectItem value="nodata">— Kapsam Dışı</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearAll}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Filtreleri Temizle ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Liste — 144 contract, scrollable */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
            {visible.map(r => {
              const meta = r.avg !== null ? pctRing(r.avg) : { ring: 'border-muted', text: 'text-muted-foreground', bar: 'bg-muted' };
              return (
                <div key={r.slug} className="flex items-center gap-3 p-3 hover:bg-accent/50">
                  <div className={cn('h-12 w-12 rounded-full border-[3px] flex items-center justify-center shrink-0', meta.ring)}>
                    <span className={cn('text-xs font-black', meta.text)}>
                      {r.avg !== null ? `%${r.avg}` : '—'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{r.title}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {r.declared.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic">Resmi jurisdiction tanımlı değil</span>
                      ) : r.declared.map(j => (
                        <Badge key={j} variant="outline" className="text-[9px] py-0 px-1.5 font-normal">{j}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/super-admin/contracts/compliance?slug=${r.slug}`}>
                      Detay <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              );
            })}
            {visible.length === 0 && (
              <p className="text-center text-sm text-muted-foreground italic py-10">Eşleşen sözleşme yok.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ComplianceTab({ contracts }: { contracts: ContractLite[] }) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const legQuery = useMemoFirebase(() => collection(db, COLLECTIONS.legislations), [db]);
  const { data: legislations } = useCollection<LegislationLite>(legQuery);

  const [contractSlug, setContractSlug] = useState('');
  const [legislationId, setLegislationId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ActiveResult | null>(null);
  const [saved, setSaved] = useState<SavedAnalysis[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const contract = useMemo(() => contracts.find(c => c.slug === contractSlug), [contracts, contractSlug]);
  const legislation = useMemo(() => (legislations || []).find(l => l.id === legislationId), [legislations, legislationId]);

  const loadSaved = async () => {
    if (!user) { setLoadingSaved(false); return; }
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/legal/compliance', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setSaved(Array.isArray(json.items) ? json.items : []);
      }
    } catch { /* sessiz */ } finally {
      setLoadingSaved(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSaved(); }, [user]);

  const handleAnalyze = async () => {
    if (!contract || !legislation || !user) {
      toast({ variant: 'destructive', title: 'Seçim eksik', description: 'Sözleşme ve mevzuat seçin.' });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const legislationText = [legislation.hangelSubject, legislation.articleText, legislation.interpretation].filter(Boolean).join('\n\n');
      const res = await fetch('/api/legal/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contractSlug: contract.slug, contractTitle: contract.title, contractText: contract.content,
          legislationId: legislation.id, legislationName: `${legislation.name}${legislation.number ? ` (No: ${legislation.number})` : ''}`,
          legislationText,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Analiz yapılamadı', description: json?.message || 'AI servisi yanıt vermedi.' });
        return;
      }
      setResult({ ...(json as ComplianceResult), contractTitle: contract.title, legislationName: legislation.name });
      toast({ title: '✅ Analiz tamamlandı', description: `%${json.score} uyum oranı hesaplandı.` });
      loadSaved();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <ContractsComplianceOverview contracts={contracts} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5 text-primary" /> Sözleşme ↔ Mevzuat Uyum Analizi</CardTitle>
          <CardDescription>Bir sözleşme/politikayı seç, ilgili mevzuatla karşılaştır. Yapay zeka uyum oranı, eksik ve riskli maddeleri çıkarır.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><Scale className="h-3.5 w-3.5" /> Sözleşme / Politika</Label>
              <Select value={contractSlug} onValueChange={setContractSlug}>
                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {contracts.map(c => <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Mevzuat / Kanun</Label>
              <Select value={legislationId} onValueChange={setLegislationId}>
                <SelectTrigger><SelectValue placeholder={(legislations || []).length === 0 ? 'Önce Mevzuatlar sekmesinden ekleyin' : 'Seçiniz'} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {(legislations || []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}{l.number ? ` (${l.number})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing || !contractSlug || !legislationId} className="gap-2">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? 'Yapay zeka analiz ediyor…' : 'Uyum Analizi Yap'}
          </Button>

          {result && (
            <div className="border rounded-xl p-4 bg-muted/20 animate-in fade-in-0">
              <ResultView result={result} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-muted-foreground" /> Önceki Analizler</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSaved ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : saved.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground italic py-10">Henüz analiz yapılmadı.</p>
          ) : (
            <div className="divide-y border-t">
              {saved.map(s => {
                const m = scoreMeta(s.score);
                return (
                  <button key={s.id} onClick={() => setResult({ ...s, contractTitle: s.contractTitle, legislationName: s.legislationName })} className="w-full text-left p-3 flex items-center gap-3 hover:bg-accent transition-colors">
                    <div className={cn('h-12 w-12 rounded-full border-[3px] flex items-center justify-center shrink-0', m.ring)}>
                      <span className={cn('text-sm font-black', m.cls)}>%{s.score}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{s.contractTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">↔ {s.legislationName}</p>
                    </div>
                    {s.analyzedAt && <span className="text-[10px] text-muted-foreground shrink-0">{new Date(s.analyzedAt).toLocaleDateString('tr-TR')}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
