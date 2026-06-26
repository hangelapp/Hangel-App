'use client';

/**
 * Detaylı Outreach İstatistikleri — /super-admin/outreach/stats
 * Dernek/Vakıf/Spor × İl × İlçe + iletişim kapsama + platform/federasyon üyelik kırılımı.
 * Apple marka kimliği: sade tipografi, bol boşluk, yumuşak kartlar, coral vurgu.
 * Veri: /api/super-admin/outreach/stats-detail (cache'li; ?il=X canlı ilçe).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, RefreshCw, Loader2, Download, ChevronRight, ChevronDown,
  Building2, Landmark, Trophy, Phone, Mail, Globe, MapPin, Layers, Network, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IlRow { il: string; dernek: number; spor: number; vakif: number; total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }
interface IlceRow { ilce: string; dernek: number; spor: number; vakif: number; total: number; phone: number; email: number }
interface TypeRow { total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }
interface MemberRow { name: string; dernek: number; spor: number; vakif: number; total: number }
interface Totals { dernek: number; spor: number; vakif: number; total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }
interface StatsResp {
  generatedAt: number;
  totals: Totals;
  byType: Record<string, TypeRow>;
  iller: IlRow[];
  platforms?: MemberRow[];
  federations?: MemberRow[];
  cached?: boolean;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (n: number) => (n ?? 0).toLocaleString('tr-TR');
type SortKey = 'total' | 'dernek' | 'vakif' | 'spor' | 'phone' | 'email' | 'ilce' | 'mahalle' | 'il';

/* ---------- Apple-stil küçük bileşenler ---------- */

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-2">
        <Icon className={cn('h-4 w-4', accent && 'text-primary')} /> {label}
      </div>
      <div className={cn('text-3xl font-semibold tracking-tight tabular-nums', accent && 'text-primary')}>{value}</div>
    </div>
  );
}

function Coverage({ icon: Icon, label, value, total }: { icon: React.ElementType; label: string; value: number; total: number }) {
  const p = pct(value, total);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-[13px] text-muted-foreground mb-2">
        <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
        <span className="font-semibold text-foreground tabular-nums">%{p}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums mb-2">{fmt(value)}</div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function PctBadge({ value, total }: { value: number; total: number }) {
  const p = pct(value, total);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums">{fmt(value)}</span>
      <span className={cn('text-[11px] px-1.5 py-0.5 rounded-full tabular-nums font-medium',
        p >= 50 ? 'bg-emerald-50 text-emerald-600' : p >= 20 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500')}>%{p}</span>
    </span>
  );
}

function SortTh({ k, label, className, active, onSort }: { k: SortKey; label: string; className?: string; active: SortKey; onSort: (k: SortKey) => void }) {
  return (
    <th className={cn('px-2 py-2.5 cursor-pointer select-none whitespace-nowrap font-medium hover:text-foreground transition-colors',
      active === k ? 'text-primary' : 'text-muted-foreground', className)} onClick={() => onSort(k)}>
      {label}{active === k ? ' ↓' : ''}
    </th>
  );
}

/** Üyelik kırılımı (platform/federasyon) — yatay bar listesi, Apple-sade. */
function MembershipSection({ icon: Icon, title, subtitle, rows, emptyHint }: {
  icon: React.ElementType; title: string; subtitle: string; rows: MemberRow[]; emptyHint?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{rows.length} kayıt</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-10 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
          <Inbox className="h-7 w-7 opacity-40" />
          <p className="text-sm">{emptyHint || 'Henüz veri yok.'}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {rows.map((r) => (
            <div key={r.name} className="px-5 py-3 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-3">
                  {r.dernek > 0 && <span>{fmt(r.dernek)} dernek</span>}
                  {r.vakif > 0 && <span>{fmt(r.vakif)} vakıf</span>}
                  {r.spor > 0 && <span>{fmt(r.spor)} spor</span>}
                </div>
              </div>
              <div className="w-40 hidden sm:block">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(r.total / max) * 100}%` }} />
                </div>
              </div>
              <div className="w-14 text-right text-base font-semibold tabular-nums">{fmt(r.total)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Sayfa ---------- */

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
    <div className="max-w-7xl mx-auto px-1 py-2 space-y-8">
      {/* Başlık */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-full"><Link href="/super-admin/outreach"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">İstatistikler</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Dernek · Vakıf · Spor — il/ilçe, iletişim kapsama, platform &amp; federasyon üyelikleri</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.generatedAt ? <span className="text-xs text-muted-foreground hidden md:inline">Güncelleme: {new Date(data.generatedAt).toLocaleString('tr-TR')}</span> : null}
          <Button variant="outline" size="sm" className="rounded-full" onClick={exportCsv} disabled={!data}><Download className="h-4 w-4 mr-1.5" /> CSV</Button>
          <Button size="sm" className="rounded-full" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />} Yeniden Hesapla
          </Button>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-600 text-sm">{error}</div>}
      {loading && !data && <div className="flex items-center gap-2 text-muted-foreground p-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor…</div>}

      {t && (
        <>
          {/* Özet */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="Dernek" value={fmt(t.dernek)} />
            <StatCard icon={Trophy} label="Spor Kulübü" value={fmt(t.spor)} />
            <StatCard icon={Landmark} label="Vakıf" value={fmt(t.vakif)} />
            <StatCard icon={MapPin} label="Toplam Kuruluş" value={fmt(t.total)} accent />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Coverage icon={Phone} label="Telefon" value={t.phone} total={t.total} />
            <Coverage icon={Mail} label="E-posta" value={t.email} total={t.total} />
            <Coverage icon={Globe} label="Web" value={t.web} total={t.total} />
            <Coverage icon={MapPin} label="İlçe" value={t.ilce} total={t.total} />
          </div>

          {/* Tür kırılımı */}
          {data?.byType && (
            <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60"><h2 className="text-base font-semibold tracking-tight">Tür Kırılımı</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground text-left"><tr>
                    <th className="px-5 py-2.5 font-medium">Tür</th><th className="px-2 py-2.5 font-medium">Toplam</th><th className="px-2 py-2.5 font-medium">Telefon</th><th className="px-2 py-2.5 font-medium">E-posta</th><th className="px-2 py-2.5 font-medium">Web</th><th className="px-2 py-2.5 font-medium">İlçe</th><th className="px-2 py-2.5 font-medium">Mahalle</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(data.byType).map(([k, v]) => (
                      <tr key={k} className="border-t border-border/50"><td className="px-5 py-2.5 font-medium">{k}</td><td className="px-2 py-2.5 tabular-nums">{fmt(v.total)}</td><td className="px-2 py-2.5"><PctBadge value={v.phone} total={v.total} /></td><td className="px-2 py-2.5"><PctBadge value={v.email} total={v.total} /></td><td className="px-2 py-2.5"><PctBadge value={v.web} total={v.total} /></td><td className="px-2 py-2.5"><PctBadge value={v.ilce} total={v.total} /></td><td className="px-2 py-2.5"><PctBadge value={v.mahalle} total={v.total} /></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Platform + Federasyon kırılımı */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MembershipSection icon={Layers} title="Platform Üyelikleri" subtitle="Sivil toplum platformlarına kayıtlı kuruluşlar"
              rows={data?.platforms || []} emptyHint="Platform üyelik verisi henüz işaretlenmedi." />
            <MembershipSection icon={Network} title="Federasyon Üyelikleri" subtitle="Federasyon/konfederasyona kayıtlı kuruluşlar"
              rows={data?.federations || []} emptyHint="Federasyon verisi henüz toplanmadı — GSB/federasyon taraması sonrası dolacak." />
          </div>

          {/* İl tablosu */}
          <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">İl Kırılımı</h2>
              <span className="text-xs text-muted-foreground">satıra tıkla → ilçe kırılımı · başlığa tıkla → sırala</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left"><tr className="border-b border-border/60">
                  <th className="px-2 py-2.5 w-6"></th>
                  <SortTh k="il" label="İl" className="text-left pl-1" active={sortKey} onSort={setSortKey} />
                  <SortTh k="dernek" label="Dernek" active={sortKey} onSort={setSortKey} />
                  <SortTh k="spor" label="Spor" active={sortKey} onSort={setSortKey} />
                  <SortTh k="vakif" label="Vakıf" active={sortKey} onSort={setSortKey} />
                  <SortTh k="total" label="Toplam" active={sortKey} onSort={setSortKey} />
                  <SortTh k="phone" label="Telefon" active={sortKey} onSort={setSortKey} />
                  <SortTh k="email" label="E-posta" active={sortKey} onSort={setSortKey} />
                  <SortTh k="ilce" label="İlçe%" active={sortKey} onSort={setSortKey} />
                  <SortTh k="mahalle" label="Mahalle%" active={sortKey} onSort={setSortKey} />
                </tr></thead>
                <tbody>
                  {iller.map((r) => (
                    <React.Fragment key={r.il}>
                      <tr className="border-t border-border/40 hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => toggleIl(r.il)}>
                        <td className="px-2 py-2.5 text-muted-foreground">{expanded === r.il ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                        <td className="px-1 py-2.5 font-medium whitespace-nowrap">{r.il}</td>
                        <td className="px-2 py-2.5 tabular-nums">{fmt(r.dernek)}</td>
                        <td className="px-2 py-2.5 tabular-nums">{fmt(r.spor)}</td>
                        <td className="px-2 py-2.5 tabular-nums">{fmt(r.vakif)}</td>
                        <td className="px-2 py-2.5 tabular-nums font-semibold">{fmt(r.total)}</td>
                        <td className="px-2 py-2.5"><PctBadge value={r.phone} total={r.total} /></td>
                        <td className="px-2 py-2.5"><PctBadge value={r.email} total={r.total} /></td>
                        <td className="px-2 py-2.5 tabular-nums text-muted-foreground">%{pct(r.ilce, r.total)}</td>
                        <td className="px-2 py-2.5 tabular-nums text-muted-foreground">%{pct(r.mahalle, r.total)}</td>
                      </tr>
                      {expanded === r.il && (
                        <tr className="bg-muted/20"><td colSpan={10} className="px-4 py-2">
                          {ilceLoading === r.il ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-xs py-2"><Loader2 className="h-4 w-4 animate-spin" /> İlçeler yükleniyor…</div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/60">
                              <table className="w-full text-xs">
                                <thead className="text-muted-foreground text-left"><tr className="border-b border-border/40"><th className="px-3 py-2 font-medium">İlçe</th><th className="px-2 py-2 font-medium">Dernek</th><th className="px-2 py-2 font-medium">Spor</th><th className="px-2 py-2 font-medium">Vakıf</th><th className="px-2 py-2 font-medium">Toplam</th><th className="px-2 py-2 font-medium">Telefon</th><th className="px-2 py-2 font-medium">E-posta</th></tr></thead>
                                <tbody>
                                  {(ilceData[r.il] || []).map((ic) => (
                                    <tr key={ic.ilce} className="border-t border-border/30"><td className="px-3 py-1.5 font-medium whitespace-nowrap">{ic.ilce}</td><td className="px-2 py-1.5 tabular-nums">{fmt(ic.dernek)}</td><td className="px-2 py-1.5 tabular-nums">{fmt(ic.spor)}</td><td className="px-2 py-1.5 tabular-nums">{fmt(ic.vakif)}</td><td className="px-2 py-1.5 tabular-nums font-semibold">{fmt(ic.total)}</td><td className="px-2 py-1.5"><PctBadge value={ic.phone} total={ic.total} /></td><td className="px-2 py-1.5"><PctBadge value={ic.email} total={ic.total} /></td></tr>
                                  ))}
                                  {(ilceData[r.il] || []).length === 0 && <tr><td colSpan={7} className="px-3 py-2 text-muted-foreground">Kayıt yok</td></tr>}
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
            </div>
          </section>

          <p className="text-xs text-muted-foreground text-center pb-4">
            {data?.cached ? 'Özet önbellekli — en güncel için “Yeniden Hesapla”.' : 'Yeni hesaplandı.'} İlçe kırılımı canlı çekilir.
          </p>
        </>
      )}
    </div>
  );
}
