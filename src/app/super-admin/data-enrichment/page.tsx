'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, PlayCircle, Sparkles, Globe, FileSpreadsheet, Wand2, Wallet, ChevronDown, ChevronRight, Download, CheckCircle2, Mail, Phone, MapPin, Hash, Users, Network, Award, FileText, Search } from 'lucide-react';
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

  const [filter, setFilter] = useState<'all' | 'changed' | 'unchanged'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const pct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  // Alan-bazlı dağılım: hangi alana kaç kuruluş için değer eklendi.
  // contact.email/phone/social.* deep field sayar; primitive alanlar tek tek.
  const fieldStats = (() => {
    const stats: Record<string, number> = {
      email: 0, phone: 0, instagram: 0, twitter: 0, facebook: 0, linkedin: 0, youtube: 0, tiktok: 0,
      address: 0, kutukNo: 0, foundationYear: 0,
      beneficiaryGroups: 0, memberOf: 0, federations: 0, supportedSDGs: 0, about: 0,
    };
    for (const l of logs) {
      const c = l.changes as Record<string, unknown>;
      const contact = (c.contact as Record<string, unknown>) || {};
      if (contact.email) stats.email++;
      if (contact.phone) stats.phone++;
      const social = (contact.social as Record<string, string>) || {};
      for (const k of ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok'] as const) {
        if (social[k]) stats[k]++;
      }
      const addr = (contact.address as Record<string, unknown>) || {};
      if (addr.fullAddress) stats.address++;
      if (c.kutukNo) stats.kutukNo++;
      if (c.foundationYear) stats.foundationYear++;
      if (c.about) stats.about++;
      const lists = ['beneficiaryGroups', 'memberOf', 'federations', 'supportedSDGs'] as const;
      for (const f of lists) {
        if (Array.isArray(c[f]) && (c[f] as unknown[]).length > 0) stats[f]++;
      }
    }
    return stats;
  })();

  const updatedCount = logs.filter(l => {
    const keys = Object.keys(l.changes).filter(k => !['enrichedAt', 'enrichedBy', 'enrichedSources'].includes(k));
    return keys.length > 0;
  }).length;
  const unchangedCount = logs.length - updatedCount;

  const filteredLogs = logs.filter(l => {
    const keys = Object.keys(l.changes).filter(k => !['enrichedAt', 'enrichedBy', 'enrichedSources'].includes(k));
    const hasChanges = keys.length > 0;
    if (filter === 'changed' && !hasChanges) return false;
    if (filter === 'unchanged' && hasChanges) return false;
    if (searchTerm && !l.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // CSV export — her satır: name, status (updated/unchanged), changed_fields, notes
  const downloadCsv = () => {
    const header = ['Ad', 'Durum', 'Güncellenen Alanlar', 'E-posta', 'Telefon', 'Sosyal Medya', 'Adres', 'KütükNo', 'Notlar'];
    const rows = logs.map(l => {
      const c = l.changes as Record<string, unknown>;
      const contact = (c.contact as Record<string, unknown>) || {};
      const social = (contact.social as Record<string, string>) || {};
      const addr = (contact.address as Record<string, unknown>) || {};
      const changedKeys = Object.keys(l.changes).filter(k => !['enrichedAt', 'enrichedBy', 'enrichedSources'].includes(k));
      return [
        l.name,
        changedKeys.length > 0 ? 'GÜNCELLENDİ' : 'değişiklik yok',
        changedKeys.join('|'),
        (contact.email as string) || '',
        (contact.phone as string) || '',
        Object.entries(social).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join('|'),
        (addr.fullAddress as string) || '',
        (c.kutukNo as string) || '',
        l.notes.join(' || ').replace(/[\r\n]+/g, ' '),
      ];
    });
    const csv = [header, ...rows].map(r =>
      r.map(cell => {
        const s = String(cell ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    ).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenginlestirme-${kind}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FIELD_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    email: { label: 'E-posta', icon: Mail },
    phone: { label: 'Telefon', icon: Phone },
    instagram: { label: 'Instagram', icon: Globe },
    twitter: { label: 'Twitter/X', icon: Globe },
    facebook: { label: 'Facebook', icon: Globe },
    linkedin: { label: 'LinkedIn', icon: Globe },
    youtube: { label: 'YouTube', icon: Globe },
    tiktok: { label: 'TikTok', icon: Globe },
    address: { label: 'Adres', icon: MapPin },
    kutukNo: { label: 'Kütük No', icon: Hash },
    foundationYear: { label: 'Kuruluş Yılı', icon: Hash },
    about: { label: 'Açıklama', icon: FileText },
    beneficiaryGroups: { label: 'Yararlanıcı Grup', icon: Users },
    memberOf: { label: 'Platform Üyelik', icon: Network },
    federations: { label: 'Federasyon', icon: Network },
    supportedSDGs: { label: 'SDG', icon: Award },
  };

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
        <>
          {/* ÖZET KART */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Zenginleştirme Raporu
              </CardTitle>
              <CardDescription>{kind === 'ngo' ? 'STK' : 'Marka'} zenginleştirme tamamlandı.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-card p-4 text-center">
                  <p className="text-3xl font-black">{logs.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Toplam İşlenen</p>
                </div>
                <div className="rounded-2xl border-2 border-green-500/40 bg-green-50/60 p-4 text-center">
                  <p className="text-3xl font-black text-green-700">{updatedCount}</p>
                  <p className="text-xs text-green-700/80 font-medium mt-1">Güncellenen</p>
                </div>
                <div className="rounded-2xl border bg-muted/40 p-4 text-center">
                  <p className="text-3xl font-black text-muted-foreground">{unchangedCount}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Değişiklik Yok</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Alan Bazlı Dağılım</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(fieldStats).filter(([, v]) => v > 0).map(([k, v]) => {
                    const meta = FIELD_LABELS[k];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <div key={k} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
                        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{meta.label}</p>
                          <p className="text-sm font-black">{v}</p>
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(fieldStats).every(v => v === 0) && (
                    <p className="text-xs text-muted-foreground col-span-full">Hiçbir alan doldurulmadı.</p>
                  )}
                </div>
              </div>

              <Button onClick={downloadCsv} variant="outline" className="w-full sm:w-auto rounded-xl font-bold gap-2">
                <Download className="h-4 w-4" /> Raporu CSV olarak indir
              </Button>
            </CardContent>
          </Card>

          {/* DETAY LİSTESİ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base">Detaylı Liste</CardTitle>
                  <CardDescription>Filtrele ve her satıra tıklayarak değişikliklerin detayını gör.</CardDescription>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'changed', 'unchanged'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border',
                        filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent',
                      )}
                    >
                      {f === 'all' ? `Tümü (${logs.length})` : f === 'changed' ? `Güncellendi (${updatedCount})` : `Değişmedi (${unchangedCount})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kuruluş adı ara..."
                  className="pl-9 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredLogs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Filtre ile eşleşen kayıt yok.</p>
                ) : filteredLogs.map(l => {
                  const isExp = expanded.has(l.id);
                  const changedKeys = Object.keys(l.changes).filter(k => !['enrichedAt', 'enrichedBy', 'enrichedSources'].includes(k));
                  const c = l.changes as Record<string, unknown>;
                  const contact = (c.contact as Record<string, unknown>) || {};
                  const social = (contact.social as Record<string, string>) || {};
                  const addr = (contact.address as Record<string, unknown>) || {};

                  // Insan-okuyabilir özet badgeler
                  const summary: string[] = [];
                  if (contact.email) summary.push(`+ E-posta`);
                  if (contact.phone) summary.push(`+ Telefon`);
                  const socialCount = Object.values(social).filter(Boolean).length;
                  if (socialCount > 0) summary.push(`+ ${socialCount} sosyal medya`);
                  if (addr.fullAddress) summary.push(`+ Adres`);
                  if (c.kutukNo) summary.push(`+ Kütük No`);
                  if (c.foundationYear) summary.push(`+ Kuruluş Yılı`);
                  if (c.about) summary.push(`+ Açıklama`);
                  for (const f of ['beneficiaryGroups', 'memberOf', 'federations', 'supportedSDGs']) {
                    if (Array.isArray(c[f]) && (c[f] as unknown[]).length > 0) {
                      const fLabel = FIELD_LABELS[f]?.label || f;
                      summary.push(`+ ${(c[f] as unknown[]).length} ${fLabel}`);
                    }
                  }

                  return (
                    <div key={l.id}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(l.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent text-left"
                      >
                        {isExp ? <ChevronDown className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{l.name}</p>
                            {changedKeys.length > 0 ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Güncellendi</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Değişiklik yok</span>
                            )}
                          </div>
                          {summary.length > 0 ? (
                            <p className="text-xs text-muted-foreground mt-1">{summary.join('  ')}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 mt-1 italic">Mevcut alanlar zaten dolu — değişiklik yapılmadı</p>
                          )}
                        </div>
                      </button>
                      {isExp && (
                        <div className="px-12 pb-3 space-y-3 text-xs">
                          {/* DEĞİŞEN ALANLAR — insan-okuyabilir */}
                          {changedKeys.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Eklenen değerler</p>
                              <div className="space-y-1">
                                {contact.email ? <p><Mail className="inline h-3 w-3 mr-1" /><span className="font-bold">E-posta:</span> {String(contact.email)}</p> : null}
                                {contact.phone ? <p><Phone className="inline h-3 w-3 mr-1" /><span className="font-bold">Telefon:</span> {String(contact.phone)}</p> : null}
                                {Object.entries(social).filter(([, v]) => v).map(([k, v]) => (
                                  <p key={k}><Globe className="inline h-3 w-3 mr-1" /><span className="font-bold">{k}:</span> @{v}</p>
                                ))}
                                {addr.fullAddress != null && <p><MapPin className="inline h-3 w-3 mr-1" /><span className="font-bold">Adres:</span> {String(addr.fullAddress)}</p>}
                                {c.kutukNo != null && <p><Hash className="inline h-3 w-3 mr-1" /><span className="font-bold">Kütük No:</span> {String(c.kutukNo)}</p>}
                                {c.foundationYear != null && <p><Hash className="inline h-3 w-3 mr-1" /><span className="font-bold">Kuruluş Yılı:</span> {String(c.foundationYear)}</p>}
                                {c.about != null && <p><FileText className="inline h-3 w-3 mr-1" /><span className="font-bold">Açıklama:</span> {String(c.about).slice(0, 200)}{String(c.about).length > 200 ? '…' : ''}</p>}
                                {['beneficiaryGroups', 'memberOf', 'federations', 'supportedSDGs'].map(f => {
                                  const arr = c[f];
                                  if (!Array.isArray(arr) || arr.length === 0) return null;
                                  const meta = FIELD_LABELS[f];
                                  return <p key={f}><Users className="inline h-3 w-3 mr-1" /><span className="font-bold">{meta?.label}:</span> {arr.join(', ')}</p>;
                                })}
                              </div>
                            </div>
                          )}
                          {/* KAYNAK NOTLARI */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Kaynak notları</p>
                            {l.notes.map((n, i) => (
                              <p key={i} className="text-muted-foreground font-mono whitespace-pre-wrap break-all text-[10px]">{n}</p>
                            ))}
                          </div>
                          {/* HAM JSON (debug için) */}
                          {changedKeys.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Ham JSON</summary>
                              <pre className="bg-muted/40 rounded-lg p-2 overflow-x-auto text-[10px] mt-1">
                                {JSON.stringify(Object.fromEntries(changedKeys.map(k => [k, l.changes[k]])), null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
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
