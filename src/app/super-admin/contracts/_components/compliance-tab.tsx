'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, GitCompare, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  Lightbulb, Scale, ShieldCheck, History,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

interface ContractLite { slug: string; title: string; content: string; kind?: string; }
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
