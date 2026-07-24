'use client';

/**
 * Wallboard — süpervizör canlı panosu. /api/ngo-admin/call-center/wallboard'dan
 * beslenir, 20 sn'de bir yenilenir. Büyük rakamlar (TV'ye yansıtmaya uygun).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PhoneCall, CheckCircle2, Clock3, PhoneMissed, Users } from 'lucide-react';

interface WallboardData {
  todayTotal: number; todayAnswered: number; answerRate: number;
  pendingCallbacks: number; openMissed: number; activeAgents: number;
  byAgent: { uid: string; name: string; count: number }[];
}

export function Wallboard() {
  const { user } = useUser();
  const { withEntityHeaders } = useActiveEntity();
  const [data, setData] = useState<WallboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/wallboard', withEntityHeaders({ headers: { authorization: `Bearer ${token}` } }));
      const json = await res.json();
      if (res.ok) setData(json);
    } catch { /* sessiz */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    void load();
    const t = setInterval(() => { void load(); }, 20_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !data) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!data) {
    return <Card variant="glass" className="rounded-2xl"><CardContent className="py-10 text-center text-sm text-muted-foreground">Veri yüklenemedi.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Canlı · 20 sn'de bir yenilenir · Bugün
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <BigStat icon={<PhoneCall className="h-5 w-5" />} label="Bugünkü çağrı" value={data.todayTotal} />
        <BigStat icon={<CheckCircle2 className="h-5 w-5" />} label="Görüşülen" value={data.todayAnswered} accent="emerald" />
        <BigStat icon={<CheckCircle2 className="h-5 w-5" />} label="Cevaplama oranı" value={`%${Math.round(data.answerRate * 100)}`} accent="emerald" />
        <BigStat icon={<Clock3 className="h-5 w-5" />} label="Bekleyen geri arama" value={data.pendingCallbacks} accent="amber" />
        <BigStat icon={<PhoneMissed className="h-5 w-5" />} label="Açık cevapsız" value={data.openMissed} accent="rose" />
        <BigStat icon={<Users className="h-5 w-5" />} label="Aktif temsilci" value={data.activeAgents} />
      </div>

      {data.byAgent.length > 0 && (
        <Card variant="glass" className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-3">Bugün — temsilci sıralaması</p>
            <div className="space-y-2">
              {data.byAgent.map((a, i) => (
                <div key={a.uid} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-5 text-center text-muted-foreground">{i + 1}</span>
                  <span className="text-sm font-medium flex-1 truncate">{a.name}</span>
                  <span className="text-sm font-bold tabular-nums">{a.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BigStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: 'emerald' | 'amber' | 'rose' }) {
  const color = accent === 'emerald' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : accent === 'rose' ? 'text-rose-600' : 'text-foreground';
  return (
    <Card variant="glass" className="rounded-2xl">
      <CardContent className="p-4">
        <div className={`flex items-center gap-1.5 text-xs text-muted-foreground`}>{icon}<span>{label}</span></div>
        <p className={`text-3xl md:text-4xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
