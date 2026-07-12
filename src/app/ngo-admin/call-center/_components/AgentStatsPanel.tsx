'use client';

/**
 * AgentStatsPanel — temsilci performans özeti.
 * /api/ngo-admin/call-center/agent-stats'tan besleniyor. Seçilen dönem için
 * (7/30/90 gün) her temsilcinin çağrı sayısı, cevaplama oranı, ort. süre ve
 * geri arama talebi sayısını gösterir. Üstte STK geneli özet kartları.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, PhoneCall, CheckCircle2, Timer, PhoneForwarded } from 'lucide-react';

interface AgentRow {
  uid: string; name: string; total: number; answered: number;
  callbacks: number; avgDuration: number; answerRate: number;
}
interface StatsResponse {
  days: number;
  agents: AgentRow[];
  totals: { total: number; answered: number; callbacks: number; avgDuration: number; answerRate: number };
}

const RANGES = [
  { label: 'Son 7 gün', days: 7 },
  { label: 'Son 30 gün', days: 30 },
  { label: 'Son 90 gün', days: 90 },
];

function fmtDuration(sec: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${m}dk ${s}sn` : `${s}sn`;
}
function pct(v: number): string { return `%${Math.round(v * 100)}`; }

export function AgentStatsPanel() {
  const { user } = useUser();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/ngo-admin/call-center/agent-stats?days=${days}`, { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch { /* sessiz */ } finally { setLoading(false); }
  }, [user, days]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Temsilci Performansı</h2>
          <p className="text-sm text-muted-foreground">Çağrı sayısı, cevaplama oranı ve ortalama süre.</p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <Button key={r.days} size="sm" variant={days === r.days ? 'default' : 'outline'} className="rounded-xl" onClick={() => setDays(r.days)}>
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.totals.total === 0 ? (
        <Card variant="glass" className="rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Bu dönemde sonuç girilmiş çağrı yok.</CardContent>
        </Card>
      ) : (
        <>
          {/* STK geneli özet kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard icon={<PhoneCall className="h-4 w-4" />} label="Toplam çağrı" value={String(data.totals.total)} />
            <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Cevaplama oranı" value={pct(data.totals.answerRate)} />
            <SummaryCard icon={<Timer className="h-4 w-4" />} label="Ort. görüşme" value={fmtDuration(data.totals.avgDuration)} />
            <SummaryCard icon={<PhoneForwarded className="h-4 w-4" />} label="Geri arama talebi" value={String(data.totals.callbacks)} />
          </div>

          {/* Temsilci tablosu */}
          <Card variant="glass" className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Temsilciler</CardTitle>
              <CardDescription className="text-xs">En çok çağrı yapandan aza sıralı.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                      <th className="px-2 py-2 font-medium">Temsilci</th>
                      <th className="px-2 py-2 font-medium text-right">Çağrı</th>
                      <th className="px-2 py-2 font-medium text-right">Cevaplanan</th>
                      <th className="px-2 py-2 font-medium text-right">Oran</th>
                      <th className="px-2 py-2 font-medium text-right">Ort. süre</th>
                      <th className="px-2 py-2 font-medium text-right">Geri arama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agents.map((a) => (
                      <tr key={a.uid} className="border-b border-border/30 last:border-0">
                        <td className="px-2 py-2.5 font-medium truncate max-w-[160px]">{a.name}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{a.total}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{a.answered}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          <span className={a.answerRate >= 0.5 ? 'text-emerald-600' : a.answerRate >= 0.25 ? 'text-amber-600' : 'text-muted-foreground'}>{pct(a.answerRate)}</span>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{fmtDuration(a.avgDuration)}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{a.callbacks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
        <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
