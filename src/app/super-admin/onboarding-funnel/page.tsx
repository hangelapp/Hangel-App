'use client';

/**
 * Süper-admin Onboarding Funnel paneli.
 *
 * `onboardingEvents` koleksiyonundaki view/complete/skip olaylarını okuyup
 * her onboarding adımı için:
 *   - görüntülenme (view), tamamlama (complete), atlama (skip) sayıları
 *   - bir önceki adıma göre terk (drop-off) oranı
 * şeklinde basit bir funnel tablosu + bar görselleştirir.
 *
 * Son 7 / 30 gün / tüm zamanlar filtresi client-side `ts` üzerinden uygulanır.
 *
 * Event üretimi: src/lib/onboarding-analytics.ts → trackOnboardingStep().
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, TrendingDown, Users } from 'lucide-react';
import { collection } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import type { OnboardingStep, OnboardingAction } from '@/lib/onboarding-analytics';

interface OnboardingEventDoc {
  id?: string;
  step?: OnboardingStep | string;
  action?: OnboardingAction | string;
  uid?: string | null;
  ts?: unknown;
  [key: string]: unknown;
}

// Funnel adım sırası + Türkçe etiketler.
const STEP_ORDER: { key: OnboardingStep; label: string }[] = [
  { key: 'register', label: 'Kayıt' },
  { key: 'verify_sent', label: 'Doğrulama Gönderildi' },
  { key: 'intent', label: 'Amaç Seçimi' },
  { key: 'ngo_selection', label: 'STK Seçimi' },
  { key: 'profile', label: 'Profil' },
  { key: 'volunteer_prefs', label: 'Gönüllülük Tercihleri' },
  { key: 'completed', label: 'Tamamlandı' },
];

type RangeKey = '7' | '30' | 'all';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7', label: 'Son 7 Gün' },
  { key: '30', label: 'Son 30 Gün' },
  { key: 'all', label: 'Tüm Zamanlar' },
];

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) return value;
  return null;
}

export default function OnboardingFunnelPage() {
  const db = useFirestore();
  const [range, setRange] = React.useState<RangeKey>('30');

  const eventsQ = useMemoFirebase(
    () => (db ? collection(db, COLLECTIONS.onboardingEvents) : null),
    [db],
  );
  const { data: events, isLoading } = useCollection<OnboardingEventDoc>(eventsQ);

  // "Şimdi" referansını mount'ta bir kez sabitle (render saflığı: Date.now render
  // gövdesinde çağrılmaz). Analitik sayfası için sabit pencere yeterli.
  const [nowMs] = React.useState(() => Date.now());

  // Tarih filtresi (client-side).
  const filteredEvents = React.useMemo(() => {
    const all = events ?? [];
    if (range === 'all') return all;
    const days = range === '7' ? 7 : 30;
    const cutoff = nowMs - days * 24 * 60 * 60 * 1000;
    return all.filter((e) => {
      const d = toDate(e.ts);
      // ts henüz serverTimestamp resolve etmemiş (null) olabilir — yeni yazılan
      // dokümanları kaybetmemek için tarihsizleri dahil ediyoruz.
      if (!d) return true;
      return d.getTime() >= cutoff;
    });
  }, [events, range, nowMs]);

  // Her adım için view/complete/skip sayıları.
  const stepStats = React.useMemo(() => {
    const base: Record<string, { view: number; complete: number; skip: number }> = {};
    STEP_ORDER.forEach((s) => {
      base[s.key] = { view: 0, complete: 0, skip: 0 };
    });
    filteredEvents.forEach((e) => {
      const step = String(e.step ?? '');
      const action = String(e.action ?? '');
      if (!(step in base)) return;
      if (action === 'view') base[step].view++;
      else if (action === 'complete') base[step].complete++;
      else if (action === 'skip') base[step].skip++;
    });
    return base;
  }, [filteredEvents]);

  // Funnel satırları: drop-off bir önceki adımın view'ına göre (index ile bakılır,
  // render sırasında değişken yeniden atanmaz).
  const funnelRows = React.useMemo(() => {
    const maxView = Math.max(1, ...STEP_ORDER.map((s) => stepStats[s.key].view));
    return STEP_ORDER.map((s, i) => {
      const stat = stepStats[s.key];
      const prevView = i > 0 ? stepStats[STEP_ORDER[i - 1].key].view : null;
      // Bir önceki adıma göre terk oranı: (önceki view - bu adım view) / önceki view.
      const dropOff =
        prevView !== null && prevView > 0
          ? Math.max(0, ((prevView - stat.view) / prevView) * 100)
          : null;
      return {
        key: s.key,
        label: s.label,
        view: stat.view,
        complete: stat.complete,
        skip: stat.skip,
        dropOff,
        widthPct: (stat.view / maxView) * 100,
      };
    });
  }, [stepStats]);

  const totalEvents = filteredEvents.length;
  const uniqueUsers = React.useMemo(() => {
    const set = new Set<string>();
    filteredEvents.forEach((e) => {
      if (typeof e.uid === 'string' && e.uid) set.add(e.uid);
    });
    return set.size;
  }, [filteredEvents]);

  if (isLoading && !events) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline tracking-tight">Onboarding Funnel</h1>
        <p className="text-muted-foreground text-sm">
          Kayıt sonrası kullanıcıların onboarding adımlarındaki ilerleme ve terk (drop-off)
          analizi. Seçili dönemde {totalEvents.toLocaleString('tr-TR')} olay,{' '}
          {uniqueUsers.toLocaleString('tr-TR')} farklı kullanıcı.
        </p>
      </div>

      {/* Dönem filtresi */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
          <Filter className="h-4 w-4" /> Dönem:
        </span>
        {RANGE_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            size="sm"
            variant={range === opt.key ? 'default' : 'outline'}
            className="rounded-2xl h-8"
            onClick={() => setRange(opt.key)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueUsers.toLocaleString('tr-TR')}</p>
              <p className="text-xs text-muted-foreground">Farklı Kullanıcı</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stepStats['completed'].view.toLocaleString('tr-TR') !== '0'
                  ? stepStats['completed'].view.toLocaleString('tr-TR')
                  : stepStats['completed'].complete.toLocaleString('tr-TR')}
              </p>
              <p className="text-xs text-muted-foreground">Onboarding Tamamlayan</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(() => {
                  const first = funnelRows[0]?.view ?? 0;
                  const last = funnelRows[funnelRows.length - 1]?.view ?? 0;
                  if (first <= 0) return '—';
                  return `%${Math.max(0, ((first - last) / first) * 100).toFixed(0)}`;
                })()}
              </p>
              <p className="text-xs text-muted-foreground">Toplam Terk (ilk→son adım)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Funnel bar görselleştirme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel — Adım Bazında Görüntülenme</CardTitle>
          <CardDescription>
            Her bar, adımın görüntülenme (view) sayısını en yüksek adıma oranla gösterir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalEvents === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Seçili dönemde onboarding olayı bulunamadı.
            </p>
          ) : (
            funnelRows.map((row) => (
              <div key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.view.toLocaleString('tr-TR')} görüntülenme
                    {row.dropOff !== null && (
                      <span
                        className={
                          row.dropOff > 0 ? 'ml-2 text-red-600 font-semibold' : 'ml-2 text-green-600'
                        }
                      >
                        ↓ %{row.dropOff.toFixed(0)} terk
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${row.widthPct}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Detay tablo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adım Detayları</CardTitle>
          <CardDescription>
            Görüntülenme, tamamlama, atlama sayıları ve bir önceki adıma göre terk oranı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adım</TableHead>
                <TableHead className="text-right">Görüntülenme</TableHead>
                <TableHead className="text-right">Tamamlama</TableHead>
                <TableHead className="text-right">Atlama</TableHead>
                <TableHead className="text-right">Terk (önceki adıma göre)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right">{row.view.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-right">{row.complete.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-right">{row.skip.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-right">
                    {row.dropOff === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={row.dropOff > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        %{row.dropOff.toFixed(0)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
