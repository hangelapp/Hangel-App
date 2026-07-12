'use client';

/**
 * ApplicationsAnalytics — bir gönüllülük ilanının başvuru analitiği.
 *
 * TAMAMEN client-side: veriyi parent'ın zaten yüklediği `applications` dizisinden
 * türetir (ek Firestore okuması YOK, ek sunucu maliyeti YOK). İki görünüm sunar:
 *   1) Başvuru zaman-serisi (günlük yeni başvuru — AreaChart)
 *   2) Dönüşüm hunisi (Toplam → Onaylanan; oran %)
 *
 * Bir "Accordion"/Dialog içinde değil, ilan kartının başvurular bölümünün üstünde
 * küçük bir özet + genişletilebilir grafik olarak kullanılır.
 */

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Application as UserApplication } from '@/lib/types';

/** Başvuru durumunun onaylı olup olmadığını tespit et (TR + eski değerler). */
function isApproved(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return s === 'approved' || s.includes('onay');
}
function isRejected(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return s === 'rejected' || s.includes('red');
}

/** 'yyyy-MM-dd' string'ini 'dd MMM' (TR) kısa etiketine çevir. */
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function shortLabel(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateKey);
  if (!m) return dateKey;
  const month = TR_MONTHS[Number(m[2]) - 1] ?? m[2];
  return `${Number(m[3])} ${month}`;
}

export function ApplicationsAnalytics({ apps }: { apps: UserApplication[] }) {
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const total = apps.length;
    const approved = apps.filter((a) => isApproved(a.status)).length;
    const rejected = apps.filter((a) => isRejected(a.status)).length;
    const pending = total - approved - rejected;
    const conversion = total > 0 ? Math.round((approved / total) * 100) : 0;

    // Günlük yeni başvuru serisi — a.date 'yyyy-MM-dd' varsayımıyla grupla.
    const byDay = new Map<string, number>();
    for (const a of apps) {
      const key = (a.date || '').slice(0, 10);
      if (!key) continue;
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    const series = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, label: shortLabel(date), count }));

    return { total, approved, rejected, pending, conversion, series };
  }, [apps]);

  if (stats.total === 0) return null;

  return (
    <div className="rounded-lg border bg-card/50 p-3 space-y-3">
      {/* Özet satırı — her zaman görünür */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-primary" /> Başvuru Analitiği
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Toplam: <strong className="text-foreground tabular-nums">{stats.total}</strong></span>
          <span className="text-green-600">Onay: <strong className="tabular-nums">{stats.approved}</strong></span>
          <span className="text-amber-600">Bekleyen: <strong className="tabular-nums">{stats.pending}</strong></span>
          <span className="font-semibold text-primary">Dönüşüm: {stats.conversion}%</span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 pt-1">
          {/* Dönüşüm hunisi — basit yatay barlar (recharts'a gerek yok, hafif). */}
          <div className="space-y-1.5">
            <FunnelBar label="Toplam Başvuru" value={stats.total} max={stats.total} color="bg-primary/70" />
            <FunnelBar label="Onaylanan" value={stats.approved} max={stats.total} color="bg-green-500" />
            <FunnelBar label="Bekleyen" value={stats.pending} max={stats.total} color="bg-amber-500" />
            {stats.rejected > 0 && (
              <FunnelBar label="Reddedilen" value={stats.rejected} max={stats.total} color="bg-red-400" />
            )}
          </div>

          {/* Zaman serisi */}
          {stats.series.length > 1 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Günlük Yeni Başvuru
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="appFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f34723" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f34723" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid hsl(var(--border))' }}
                    labelFormatter={(l) => `${l}`}
                    formatter={(v: number) => [`${v} başvuru`, '']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#f34723" strokeWidth={2} fill="url(#appFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Zaman grafiği için en az iki farklı günde başvuru gerekir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Dönüşüm hunisi için tek yatay bar. */
function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums">
        {value} <span className="text-muted-foreground font-normal">({pct}%)</span>
      </span>
    </div>
  );
}
