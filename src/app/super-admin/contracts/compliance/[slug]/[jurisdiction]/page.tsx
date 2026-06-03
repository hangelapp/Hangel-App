'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { doc as fsDoc } from 'firebase/firestore';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, CheckCircle2, XCircle, Lightbulb, BookText, Loader2,
  FileText, ShieldCheck, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { contractsData as seedContracts } from '@/lib/contracts';

interface ContractDoc {
  id: string;
  slug: string;
  title: string;
  content?: string;
}

interface ComplianceDetail {
  id: string;
  contractSlug: string;
  jurisdiction: string;
  score: number;
  missingSections?: string[];
  suggestedSources?: string[];
  compliantSections?: string[];
  summary?: string;
}

const JURISDICTION_META: Record<string, { label: string; flag: string }> = {
  'TR':    { label: 'Türkiye',           flag: '🇹🇷' },
  'EU':    { label: 'Avrupa Birliği',    flag: '🇪🇺' },
  'UK':    { label: 'Birleşik Krallık',  flag: '🇬🇧' },
  'US-CA': { label: 'ABD (California)',  flag: '🇺🇸' },
  'DE':    { label: 'Almanya',           flag: '🇩🇪' },
  'FR':    { label: 'Fransa',            flag: '🇫🇷' },
  'ES':    { label: 'İspanya',           flag: '🇪🇸' },
  'IT':    { label: 'İtalya',            flag: '🇮🇹' },
  'CA':    { label: 'Kanada',            flag: '🇨🇦' },
  'AU':    { label: 'Avustralya',        flag: '🇦🇺' },
  'JP':    { label: 'Japonya',           flag: '🇯🇵' },
  'BR':    { label: 'Brezilya',          flag: '🇧🇷' },
};

function scoreColor(score: number) {
  if (score >= 80) return { cls: 'text-emerald-600 dark:text-emerald-400', ring: 'border-emerald-500', label: 'Yüksek Uyum', emoji: '🟢' };
  if (score >= 50) return { cls: 'text-amber-600 dark:text-amber-400',   ring: 'border-amber-500',   label: 'Kısmi Uyum',  emoji: '🟡' };
  return { cls: 'text-red-600 dark:text-red-400', ring: 'border-red-500', label: 'Düşük Uyum', emoji: '🔴' };
}

/**
 * "## Başlık" satırlarını yakalayıp paragrafları gruplar. content HTML olduğu
 * için h3/h4 etiketlerini de section başlığı olarak kabul eder.
 */
function parseSections(content: string): Array<{ title: string; body: string }> {
  if (!content) return [];

  // 1) Markdown "## Başlık" desteği
  if (/^#{2,4}\s/m.test(content)) {
    const parts = content.split(/(?=^#{2,4}\s)/m).filter(Boolean);
    return parts.map(part => {
      const match = part.match(/^#{2,4}\s+(.+?)\n([\s\S]*)/);
      if (!match) return { title: 'Genel', body: part.trim() };
      return { title: match[1].trim(), body: match[2].trim() };
    });
  }

  // 2) HTML h3/h4 desteği (seed verisi bu formatta)
  if (/<h[34]>/i.test(content)) {
    const parts: Array<{ title: string; body: string }> = [];
    const regex = /<h[34]>([\s\S]*?)<\/h[34]>([\s\S]*?)(?=<h[34]>|$)/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const title = match[1].replace(/<[^>]+>/g, '').trim();
      const body = match[2].trim();
      parts.push({ title, body });
    }
    if (parts.length > 0) return parts;
  }

  return [{ title: 'İçerik', body: content }];
}

function matchesSectionList(title: string, list: string[] | undefined): string | null {
  if (!list || list.length === 0) return null;
  const tNorm = title.toLowerCase();
  for (const item of list) {
    const iNorm = item.toLowerCase();
    if (tNorm.includes(iNorm) || iNorm.includes(tNorm)) return item;
  }
  return null;
}

export default function ComplianceDetailPage() {
  const params = useParams<{ slug: string; jurisdiction: string }>();
  const slug = params.slug;
  const jurisdiction = params.jurisdiction;
  const db = useFirestore();

  // Sözleşme — Firestore'dan yoksa seed'ten
  const contractRef = useMemoFirebase(
    () => fsDoc(db, COLLECTIONS.contracts, slug),
    [db, slug],
  );
  const { data: fsContract, isLoading: loadingContract } = useDoc<ContractDoc>(contractRef);

  const contract = useMemo<ContractDoc | null>(() => {
    if (fsContract) {
      return { id: slug, slug, title: fsContract.title, content: fsContract.content };
    }
    const seed = seedContracts.find(s => s.slug === slug);
    return seed ? { id: seed.slug, slug: seed.slug, title: seed.title, content: seed.content } : null;
  }, [fsContract, slug]);

  // Compliance detayı
  const detailRef = useMemoFirebase(
    () => fsDoc(db, COLLECTIONS.contractCompliance, `${slug}-${jurisdiction}`),
    [db, slug, jurisdiction],
  );
  const { data: detail, isLoading: loadingDetail } = useDoc<ComplianceDetail>(detailRef);

  const jurMeta = JURISDICTION_META[jurisdiction] || { label: jurisdiction, flag: '🌐' };
  const score = detail?.score ?? null;
  const sc = score !== null ? scoreColor(score) : null;

  const sections = useMemo(
    () => contract?.content ? parseSections(contract.content) : [],
    [contract],
  );

  const isLoading = loadingContract || loadingDetail;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Belge bulunamadı</h2>
        <p className="text-sm text-muted-foreground">/{slug}</p>
        <Button asChild variant="outline">
          <Link href="/super-admin/contracts/compliance">
            <ArrowLeft className="h-4 w-4 mr-2" /> Matrise dön
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Başlık */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href="/super-admin/contracts/compliance">
            <ArrowLeft className="h-4 w-4" /> Uyumluluk Matrisi
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter">{contract.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-mono">/{contract.slug}</Badge>
              <Badge className="text-xs bg-primary/15 text-primary hover:bg-primary/20">
                {jurMeta.flag} {jurMeta.label} ({jurisdiction})
              </Badge>
            </div>
          </div>

          {/* Skor halkası */}
          {sc !== null && score !== null && (
            <div className={cn(
              'h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0',
              sc.ring,
            )}>
              <span className={cn('text-3xl font-black leading-none', sc.cls)}>%{score}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">{sc.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detay */}
      {!detail ? (
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center space-y-2">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold">Bu hücre için henüz analiz yok</p>
            <p className="text-xs text-muted-foreground">
              {`${contract.title} × ${jurMeta.label}`} için uyum analizi başlatılmadı.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="rounded-2xl p-1">
            <TabsTrigger value="content" className="gap-1.5 rounded-xl">
              <ScrollText className="h-4 w-4" /> Sözleşme Metni
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-1.5 rounded-xl">
              <Lightbulb className="h-4 w-4" /> Öneriler ({detail.suggestedSources?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Sözleşme metni — bölümlere göre highlight */}
          <TabsContent value="content" className="mt-4 space-y-3">
            {detail.summary && (
              <Card className="rounded-3xl bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed">{detail.summary}</p>
                </CardContent>
              </Card>
            )}

            {sections.map((sec, idx) => {
              const missing = matchesSectionList(sec.title, detail.missingSections);
              const compliant = !missing && matchesSectionList(sec.title, detail.compliantSections);
              const tone = missing
                ? { bar: 'border-l-red-500', bg: 'bg-red-500/5', badge: 'bg-red-500/15 text-red-700 dark:text-red-400', icon: XCircle, label: 'Eksik' }
                : compliant
                  ? { bar: 'border-l-emerald-500', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, label: 'Uyumlu' }
                  : { bar: 'border-l-muted', bg: '', badge: 'bg-muted text-muted-foreground', icon: FileText, label: 'Nötr' };
              const Icon = tone.icon;
              return (
                <Card key={idx} className={cn('rounded-3xl border-l-4 transition-colors', tone.bar, tone.bg)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', missing ? 'text-red-600' : compliant ? 'text-emerald-600' : 'text-muted-foreground')} />
                        {sec.title}
                      </CardTitle>
                      <Badge className={cn('text-[10px]', tone.badge)} title={missing || 'Durum'}>
                        {tone.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div
                      className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: sec.body }}
                    />
                    {missing && (
                      <div className="mt-3 text-xs flex items-start gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                        <XCircle className="h-3.5 w-3.5 mt-0.5 text-red-600 shrink-0" />
                        <span><strong>Bu eksik:</strong> {missing}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Öneriler */}
          <TabsContent value="suggestions" className="mt-4 space-y-3">
            {(detail.suggestedSources || []).length === 0 ? (
              <Card className="rounded-3xl">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground italic">
                    Bu analiz için ek mevzuat önerisi yok.
                  </p>
                </CardContent>
              </Card>
            ) : (
              (detail.suggestedSources || []).map((src, idx) => (
                <Card key={idx} className="rounded-3xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookText className="h-4 w-4 text-primary" />
                      Öneri #{idx + 1}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Bu boşluk için şu mevzuat metnine ekleme yapın:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-semibold">{src}</p>
                  </CardContent>
                </Card>
              ))
            )}

            {(detail.missingSections || []).length > 0 && (
              <Card className="rounded-3xl border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <XCircle className="h-4 w-4" />
                    Eksik Bölümler ({detail.missingSections!.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5">
                    {detail.missingSections!.map((m, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
