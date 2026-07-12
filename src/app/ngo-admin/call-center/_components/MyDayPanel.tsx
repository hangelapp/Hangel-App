'use client';

/**
 * MyDayPanel — "Bugünkü İşim" ekranı.
 * /api/ngo-admin/call-center/my-day'den beslenir. Temsilcinin bugün yapması
 * gerekenleri üç grupta gösterir: geri aramalar, cevapsızlar, yeni kişiler.
 * Her satır tek tuşla arama sayfasına götürür.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock3, PhoneMissed, UserPlus, Phone, Sun } from 'lucide-react';

interface Task {
  contactId: string | null;
  contactName: string | null;
  number: string | null;
  at: string | null;
  reason?: string | null;
}
interface MyDayResponse {
  callbacks: Task[]; missed: Task[]; fresh: Task[];
  counts: { callbacks: number; missed: number; fresh: number };
}

function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch { return ''; }
}

export function MyDayPanel() {
  const { user } = useUser();
  const [data, setData] = useState<MyDayResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/my-day', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch { /* sessiz */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const total = data ? data.counts.callbacks + data.counts.missed + data.counts.fresh : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Sun className="h-5 w-5 text-amber-500" /> Bugünkü İşim</h2>
          <p className="text-sm text-muted-foreground">Bugün araman gereken kişiler tek listede.</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yenile'}
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : total === 0 ? (
        <Card variant="glass" className="rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Bugün için bekleyen iş yok. 🎉</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <TaskColumn
            title="Geri aramalar"
            icon={<Clock3 className="h-4 w-4 text-amber-600" />}
            tasks={data!.callbacks}
            emptyText="Bekleyen geri arama yok."
            accent="amber"
          />
          <TaskColumn
            title="Cevapsızlar"
            icon={<PhoneMissed className="h-4 w-4 text-primary" />}
            tasks={data!.missed}
            emptyText="Cevapsız çağrı yok."
            accent="primary"
          />
          <TaskColumn
            title="Yeni kişiler"
            icon={<UserPlus className="h-4 w-4 text-sky-600" />}
            tasks={data!.fresh}
            emptyText="Yeni kişi yok."
            accent="sky"
          />
        </div>
      )}
    </div>
  );

  function TaskColumn({ title, icon, tasks, emptyText }: {
    title: string; icon: React.ReactNode; tasks: Task[]; emptyText: string; accent: string;
  }) {
    return (
      <Card variant="glass" className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon} {title}
            <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">{tasks.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
          ) : (
            tasks.map((t, i) => (
              <div key={`${t.contactId}-${i}`} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.contactName || t.number || 'Bilinmeyen'}</p>
                  {(t.at || t.reason) && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t.reason ? t.reason : fmtWhen(t.at)}
                    </p>
                  )}
                </div>
                {t.contactId && (
                  <Button asChild size="sm" variant="secondary" className="h-7 rounded-lg text-xs px-2 shrink-0">
                    <Link href={`/ngo-admin/call-center/call/${t.contactId}`}><Phone className="h-3.5 w-3.5" /></Link>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }
}
