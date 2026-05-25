'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PlayCircle, Sparkles, Globe, FileSpreadsheet, Wand2, Wallet, ChevronDown, ChevronRight } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type OrgKind = 'ngo' | 'brand';
type Source = 'website' | 'registry' | 'ai' | 'commercial';

interface EnrichLog {
  id: string;
  name: string;
  changes: Record<string, unknown>;
  notes: string[];
}

const SOURCE_META: Record<Source, { label: string; icon: React.ComponentType<{ className?: string }>; appliesTo: OrgKind[] }> = {
  website: { label: 'Resmi web sitesi', icon: Globe, appliesTo: ['ngo', 'brand'] },
  registry: { label: 'DERBİS / VGM kütük', icon: FileSpreadsheet, appliesTo: ['ngo'] },
  ai: { label: 'AI fact-check (Gemini)', icon: Wand2, appliesTo: ['ngo', 'brand'] },
  commercial: { label: 'Wikipedia / ticari', icon: Wallet, appliesTo: ['brand'] },
};

export default function DataEnrichmentPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const [kind, setKind] = useState<OrgKind>('ngo');
  const [selectedSources, setSelectedSources] = useState<Source[]>(['website', 'registry']);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [logs, setLogs] = useState<EnrichLog[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleSource = (s: Source) => {
    setSelectedSources(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  };
  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const start = async () => {
    if (!authUser || selectedSources.length === 0) {
      toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'En az bir kaynak seçilmeli.' });
      return;
    }
    const validSources = selectedSources.filter(s => SOURCE_META[s].appliesTo.includes(kind));
    if (validSources.length === 0) {
      toast({ variant: 'destructive', title: 'Geçersiz kaynak', description: 'Seçili kaynaklar bu kuruluş tipi için uygun değil.' });
      return;
    }

    setRunning(true);
    setLogs([]);
    setProgress({ done: 0, total: 0 });
    try {
      const token = await authUser.getIdToken();
      let offset = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await fetch('/api/admin/enrich-orgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ kind, sources: validSources, offset, batchSize: 5 }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast({ variant: 'destructive', title: `HTTP ${res.status}`, description: j.error || res.statusText });
          break;
        }
        const j = (await res.json()) as { total: number; processed: EnrichLog[]; nextOffset: number | null; done: boolean };
        setLogs(prev => [...prev, ...j.processed]);
        setProgress({ done: offset + j.processed.length, total: j.total });
        if (j.done || j.nextOffset == null) break;
        offset = j.nextOffset;
      }
      toast({ title: 'Tamamlandı', description: `${kind === 'ngo' ? 'STK' : 'Marka'} zenginleştirme bitti.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Hata', description: (e as Error).message?.slice(0, 200) || 'Bilinmeyen hata' });
    } finally {
      setRunning(false);
    }
  };

  const pct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
  const updatedCount = logs.filter(l => Object.keys(l.changes).length > 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Veri Zenginleştirme</h1>
        <p className="text-muted-foreground text-sm">STK ve marka profillerini resmi web siteleri, kütük kayıtları, AI fact-check ve ticari kaynaklardan teyitli bilgilerle tamamlar. Mevcut alanlara dokunmaz, sadece boşları doldurur.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Çalıştırma</CardTitle>
          <CardDescription>Kuruluş tipi ve veri kaynaklarını seç, başlat. Her chunk 5 kuruluş işler; toplam süre ~3-5 dakikadır.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Kuruluş tipi</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['ngo', 'brand'] as const).map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  disabled={running}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-sm font-bold transition-colors',
                    kind === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent',
                  )}
                >
                  {k === 'ngo' ? 'STK\'lar' : 'Markalar'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Veri kaynakları</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.entries(SOURCE_META) as Array<[Source, typeof SOURCE_META[Source]]>).map(([src, meta]) => {
                const Icon = meta.icon;
                const supported = meta.appliesTo.includes(kind);
                return (
                  <label
                    key={src}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition-colors',
                      !supported && 'opacity-40 cursor-not-allowed',
                      supported && 'hover:bg-accent',
                    )}
                  >
                    <Checkbox
                      checked={selectedSources.includes(src)}
                      onCheckedChange={() => supported && toggleSource(src)}
                      disabled={!supported || running}
                    />
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{meta.label}</p>
                      {!supported && <p className="text-[11px] text-muted-foreground">Bu kuruluş tipinde geçerli değil</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <Button onClick={start} disabled={running || selectedSources.length === 0} size="lg" className="w-full sm:w-auto rounded-2xl font-bold">
            {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Çalışıyor...</> : <><PlayCircle className="h-4 w-4 mr-2" /> Zenginleştirmeyi Başlat</>}
          </Button>

          {(running || progress.total > 0) && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{progress.done} / {progress.total} kuruluş işlendi</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
              <p className="text-[11px] text-muted-foreground">{updatedCount} kayıt güncellendi (mevcut veriye dokunulmadı, sadece boş alanlar dolduruldu).</p>
            </div>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İşlem Kayıtları ({logs.length})</CardTitle>
            <CardDescription>Her satıra tıklayarak detay (değişen alanlar + her kaynak için not) gör.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map(l => {
                const isExp = expanded.has(l.id);
                const changedKeys = Object.keys(l.changes).filter(k => !['enrichedAt', 'enrichedBy', 'enrichedSources'].includes(k));
                return (
                  <div key={l.id}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(l.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent text-left"
                    >
                      {isExp ? <ChevronDown className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {changedKeys.length > 0 ? (
                            <>Güncellenen: <span className="font-bold">{changedKeys.join(', ')}</span></>
                          ) : (
                            <span className="opacity-60">Değişiklik yok</span>
                          )}
                        </p>
                      </div>
                    </button>
                    {isExp && (
                      <div className="px-12 pb-3 space-y-2 text-xs">
                        {l.notes.map((n, i) => (
                          <p key={i} className="text-muted-foreground font-mono whitespace-pre-wrap break-all">{n}</p>
                        ))}
                        {changedKeys.length > 0 && (
                          <pre className="bg-muted/40 rounded-lg p-2 overflow-x-auto text-[10px]">
                            {JSON.stringify(Object.fromEntries(changedKeys.map(k => [k, l.changes[k]])), null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertTitle>Güvenlik & güvenilirlik notu</AlertTitle>
        <AlertDescription className="text-xs">
          <ul className="list-disc pl-4 space-y-1 mt-1">
            <li>Hiçbir mevcut alan üzerine yazılmaz; yalnızca boş alanlar doldurulur.</li>
            <li>Web sitesi parse'ı regex tabanlıdır (e-posta, telefon, sosyal medya); spam/dummy değerler basit heuristic'lerle filtrelenir.</li>
            <li>Kütük eşleşmesi normalize edilmiş ad + Levenshtein eşiği 0.7. Tartışmalı eşleşmeler skip edilir.</li>
            <li>AI çıktısı yalnızca beneficiary/memberOf/federation/SDG gibi liste alanlarını doldurur; about/email/phone'a dokunmaz.</li>
            <li>Her yazılan kayıt <code className="font-mono text-[10px] bg-muted/40 px-1 rounded">enrichedAt</code> + <code className="font-mono text-[10px] bg-muted/40 px-1 rounded">enrichedSources</code> ile etiketlenir.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
