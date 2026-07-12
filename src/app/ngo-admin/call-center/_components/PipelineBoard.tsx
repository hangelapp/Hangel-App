'use client';

/**
 * PipelineBoard — bağış hunisi panosu.
 * /api/ngo-admin/call-center/pipeline'dan besleniyor. Her aşamada kaç kişi ve
 * toplam söz verilen TL'yi gösterir; üstte genel özet kartları. Aşamaya
 * tıklayınca o aşamadaki kişileri liste sayfasında açar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, HandCoins, Target } from 'lucide-react';
import { STAGE_TONE_CLASS, type PipelineStage } from '@/lib/santral/pipeline';

interface StageRow {
  key: string; label: string; tone: PipelineStage['tone'];
  won: boolean; lost: boolean; count: number; pledgeTotal: number;
}
interface PipelineResponse {
  stages: StageRow[];
  totals: { contacts: number; pledgeTotal: number; donatedCount: number };
}

function fmtTL(n: number): string {
  if (!n) return '0 ₺';
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

export function PipelineBoard() {
  const { user } = useUser();
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/pipeline', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch { /* sessiz */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const maxCount = data ? Math.max(1, ...data.stages.map((s) => s.count)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Bağış Hunisi</h2>
          <p className="text-sm text-muted-foreground">Kişiler hangi aşamada, ne kadar bağış sözü var.</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yenile'}
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data ? (
        <Card variant="glass" className="rounded-2xl"><CardContent className="py-10 text-center text-sm text-muted-foreground">Veri yüklenemedi.</CardContent></Card>
      ) : (
        <>
          {/* Genel özet */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard icon={<Users className="h-4 w-4" />} label="Toplam kişi" value={String(data.totals.contacts)} />
            <SummaryCard icon={<HandCoins className="h-4 w-4" />} label="Söz verilen" value={fmtTL(data.totals.pledgeTotal)} />
            <SummaryCard icon={<Target className="h-4 w-4" />} label="Bağış yaptı" value={String(data.totals.donatedCount)} />
          </div>

          {/* Huni — aşama şeritleri (genişlik kişi sayısıyla orantılı) */}
          <Card variant="glass" className="rounded-2xl">
            <CardContent className="p-4 space-y-2.5">
              {data.stages.map((s) => (
                <Link
                  key={s.key}
                  href={`/ngo-admin/call-center/contacts?stage=${encodeURIComponent(s.key)}`}
                  className="block group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 w-28 text-center ${STAGE_TONE_CLASS[s.tone]}`}>
                      {s.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="h-7 rounded-lg bg-muted/40 overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all ${STAGE_TONE_CLASS[s.tone]} group-hover:opacity-80`}
                          style={{ width: `${Math.max(6, (s.count / maxCount) * 100)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold tabular-nums">
                          {s.count} kişi
                        </span>
                      </div>
                    </div>
                    {s.pledgeTotal > 0 && (
                      <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0 w-24 text-right">
                        {fmtTL(s.pledgeTotal)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center">Bir aşamaya tıklayınca o aşamadaki kişiler açılır.</p>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card variant="glass" className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
        <p className="text-xl font-bold mt-1 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
