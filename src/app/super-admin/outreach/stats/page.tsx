'use client';

/**
 * Detaylı Outreach İstatistikleri — /super-admin/outreach/stats
 * Dernek/Vakıf/Spor × İl × İlçe kırılımı + iletişim kapsama (telefon/e-posta/web/ilçe/mahalle).
 * Veri: /api/super-admin/outreach/stats-detail (appStats/outreachDetail cache'li; ?il=X canlı ilçe).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Loader2, Download, ChevronRight, ChevronDown, Building2, Landmark, Trophy, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IlRow { il: string; dernek: number; spor: number; vakif: number; total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }
interface IlceRow { ilce: string; dernek: number; spor: number; vakif: number; total: number; phone: number; email: number }
interface TypeRow { total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }
interface Totals { dernek: number; spor: number; vakif: number; total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }
interface StatsResp {
  generatedAt: number;
  totals: Totals;
  byType: Record<string, TypeRow>;
  iller: IlRow[];
  cached?: boolean;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (n: number) => n.toLocaleString('tr-TR');

function Pctish({ value, total }: { value: number; total: number }) {
  const p = pct(value, total);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums">{fmt(value)}</span>
      <span className={cn('text-xs px-1.5 py-0.5 rounded tabular-nums', p >= 50 ? 'bg-emerald-100 text-emerald-700' : p >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600')}>%{p}</span>
    </span>
  );
}

type SortKey = 'total' | 'dernek' | 'vakif' | 'spor' | 'phone' | 'email' | 'ilce' | 'mahalle' | 'il';

function SortTh({ k, label, className, active, onSort }: { k: SortKey; label: string; className?: string; active: SortKey; onSort: (k: SortKey) => void }) {
  return (
    <th className={cn('px-2 py-2 cursor-pointer select-none hover:text-primary whitespace-nowrap', active === k && 'text-primary font-semibold', className)} onClick={() => onSort(k)}>
      {label}{active === k ? ' ↓' : ''}
    </th>
  );
}

export default function OutreachStatsPage() {
  const { user } = useUser();
  const [data, setData] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ilceData, setIlceData] = useState<Record<string, IlceRow[]>>({});
  const [ilceLoading, setIlceLoading] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    if (!user) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/super-admin/outreach/stats-detail${refresh ? '?refresh=true' : ''}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json())?.message || 'Yükleme hatası');
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { if (user) load(false); }, [user, load]);

  const toggleIl = useCallback(async (il: string) => {
    if (expanded === il) { setExpanded(null); return; }
    setExpanded(il);
    if (!ilceData[il] && user) {
      setIlceLoading(il);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/super-admin/outreach/stats-detail?il=${encodeURIComponent(il)}`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await res.json();
        setIlceData((prev) => ({ ...prev, [il]: j.ilceler || [] }));
      } catch { /* ignore */ } finally { setIlceLoading(null); }
    }
  }, [expanded, ilceData, user]);

  const iller = useMemo(() => {
    const arr = data?.iller ? [...data.iller] : [];
    arr.sort((a, b) => sortKey === 'il' ? a.il.localeCompare(b.il, 'tr') : (b[sortKey] as number) - (a[sortKey] as number));
    return arr;
  }, [data, sortKey]);

  const exportCsv = () => {
    if (!data) return;
    const head = ['İl', 'Dernek', 'Spor', 'Vakıf', 'Toplam', 'Telefon', 'Telefon%', 'E-posta', 'E-posta%', 'Web', 'İlçe%', 'Mahalle%'];
    const rows = iller.map((r) => [r.il, r.dernek, r.spor, r.vakif, r.total, r.phone, pct(r.phone, r.total), r.email, pct(r.email, r.total), r.web, pct(r.ilce, r.total), pct(r.mahalle, r.total)]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'outreach-istatistik-il.csv'; a.click();
  };

  const t = data?.totals;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/super-admin/outreach"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Detaylı İstatistikler</h1>
            <p className="text-sm text-muted-foreground">Dernek · Vakıf · Spor — il / ilçe kırılımı ve iletişim kapsama</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.generatedAt ? <span className="text-xs text-muted-foreground hidden md:inline">Hesaplama: {new Date(data.generatedAt).toLocaleString('tr-TR')}</span> : null}
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button size="sm" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />} Yeniden Hesapla
          </Button>
        </div>
      </div>

      {error && <Card><CardContent className="p-4 text-rose-600 text-sm">{error}</CardContent></Card>}
      {loading && !data && <div className="flex items-center gap-2 text-muted-foreground p-8"><Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor…</div>}

      {t && (
        <>
          {/* Özet kartlar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Building2 className="h-4 w-4" /> Dernek</div><div className="text-2xl font-bold tabular-nums">{fmt(t.dernek)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Trophy className="h-4 w-4" /> Spor Kulübü</div><div className="text-2xl font-bold tabular-nums">{fmt(t.spor)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Landmark className="h-4 w-4" /> Vakıf</div><div className="text-2xl font-bold tabular-nums">{fmt(t.vakif)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><MapPin className="h-4 w-4" /> Toplam Kuruluş</div><div className="text-2xl font-bold tabular-nums">{fmt(t.total)}</div></CardContent></Card>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Phone className="h-4 w-4" /> Telefon</div><div className="text-xl font-bold"><Pctish value={t.phone} total={t.total} /></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Mail className="h-4 w-4" /> E-posta</div><div className="text-xl font-bold"><Pctish value={t.email} total={t.total} /></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Globe className="h-4 w-4" /> Web</div><div className="text-xl font-bold"><Pctish value={t.web} total={t.total} /></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><MapPin className="h-4 w-4" /> İlçe / Mahalle</div><div className="text-sm font-bold flex gap-2"><Pctish value={t.ilce} total={t.total} /><Pctish value={t.mahalle} total={t.total} /></div></CardContent></Card>
          </div>

          {/* Tür kırılımı */}
          {data?.byType && (
            <Card><CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-left"><tr><th className="px-3 py-2">Tür</th><th className="px-2 py-2">Toplam</th><th className="px-2 py-2">Telefon</th><th className="px-2 py-2">E-posta</th><th className="px-2 py-2">Web</th><th className="px-2 py-2">İlçe</th><th className="px-2 py-2">Mahalle</th></tr></thead>
                <tbody>
                  {Object.entries(data.byType).map(([k, v]) => (
                    <tr key={k} className="border-t"><td className="px-3 py-2 font-medium">{k}</td><td className="px-2 py-2 tabular-nums">{fmt(v.total)}</td><td className="px-2 py-2"><Pctish value={v.phone} total={v.total} /></td><td className="px-2 py-2"><Pctish value={v.email} total={v.total} /></td><td className="px-2 py-2"><Pctish value={v.web} total={v.total} /></td><td className="px-2 py-2"><Pctish value={v.ilce} total={v.total} /></td><td className="px-2 py-2"><Pctish value={v.mahalle} total={v.total} /></td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}

          {/* İl tablosu */}
          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left sticky top-0">
                <tr>
                  <th className="px-2 py-2 w-6"></th>
                  <SortTh k="il" label="İl" className="text-left" active={sortKey} onSort={setSortKey} />
                  <SortTh k="dernek" label="Dernek" active={sortKey} onSort={setSortKey} />
                  <SortTh k="spor" label="Spor" active={sortKey} onSort={setSortKey} />
                  <SortTh k="vakif" label="Vakıf" active={sortKey} onSort={setSortKey} />
                  <SortTh k="total" label="Toplam" active={sortKey} onSort={setSortKey} />
                  <SortTh k="phone" label="Telefon" active={sortKey} onSort={setSortKey} />
                  <SortTh k="email" label="E-posta" active={sortKey} onSort={setSortKey} />
                  <SortTh k="ilce" label="İlçe%" active={sortKey} onSort={setSortKey} />
                  <SortTh k="mahalle" label="Mahalle%" active={sortKey} onSort={setSortKey} />
                </tr>
              </thead>
              <tbody>
                {iller.map((r) => (
                  <React.Fragment key={r.il}>
                    <tr className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => toggleIl(r.il)}>
                      <td className="px-2 py-2">{expanded === r.il ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                      <td className="px-2 py-2 font-medium whitespace-nowrap">{r.il}</td>
                      <td className="px-2 py-2 tabular-nums">{fmt(r.dernek)}</td>
                      <td className="px-2 py-2 tabular-nums">{fmt(r.spor)}</td>
                      <td className="px-2 py-2 tabular-nums">{fmt(r.vakif)}</td>
                      <td className="px-2 py-2 tabular-nums font-semibold">{fmt(r.total)}</td>
                      <td className="px-2 py-2"><Pctish value={r.phone} total={r.total} /></td>
                      <td className="px-2 py-2"><Pctish value={r.email} total={r.total} /></td>
                      <td className="px-2 py-2 tabular-nums">%{pct(r.ilce, r.total)}</td>
                      <td className="px-2 py-2 tabular-nums">%{pct(r.mahalle, r.total)}</td>
                    </tr>
                    {expanded === r.il && (
                      <tr className="bg-muted/20"><td colSpan={10} className="px-3 py-2">
                        {ilceLoading === r.il ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs py-2"><Loader2 className="h-4 w-4 animate-spin" /> İlçeler yükleniyor…</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="text-muted-foreground text-left"><tr><th className="px-2 py-1">İlçe</th><th className="px-2 py-1">Dernek</th><th className="px-2 py-1">Spor</th><th className="px-2 py-1">Vakıf</th><th className="px-2 py-1">Toplam</th><th className="px-2 py-1">Telefon</th><th className="px-2 py-1">E-posta</th></tr></thead>
                              <tbody>
                                {(ilceData[r.il] || []).map((ic) => (
                                  <tr key={ic.ilce} className="border-t border-border/50"><td className="px-2 py-1 font-medium whitespace-nowrap">{ic.ilce}</td><td className="px-2 py-1 tabular-nums">{fmt(ic.dernek)}</td><td className="px-2 py-1 tabular-nums">{fmt(ic.spor)}</td><td className="px-2 py-1 tabular-nums">{fmt(ic.vakif)}</td><td className="px-2 py-1 tabular-nums font-semibold">{fmt(ic.total)}</td><td className="px-2 py-1"><Pctish value={ic.phone} total={ic.total} /></td><td className="px-2 py-1"><Pctish value={ic.email} total={ic.total} /></td></tr>
                                ))}
                                {(ilceData[r.il] || []).length === 0 && <tr><td colSpan={7} className="px-2 py-2 text-muted-foreground">Kayıt yok</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
          <p className="text-xs text-muted-foreground">İl satırına tıkla → ilçe kırılımı (canlı). Sütun başlığına tıkla → sırala. {data?.cached ? 'Özet cache\'li; güncel için "Yeniden Hesapla".' : 'Yeni hesaplandı.'}</p>
        </>
      )}
    </div>
  );
}
