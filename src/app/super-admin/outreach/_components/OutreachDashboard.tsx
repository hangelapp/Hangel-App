'use client';

/**
 * Outreach Dashboard — sayfanın üst kısmında collapsible analytics card.
 *
 * /api/super-admin/outreach/stats endpoint'inden 5 dk cache'li metrikleri çeker
 * ve aşağıdaki kartlarda gösterir:
 *   - Total kayıt (vakıf + dernek + outreach)
 *   - Email/Telefon kapsama oranı (vakıflar)
 *   - Tür dağılımı (Sivil Toplum, Federasyon, Spor Kulübü, Mail vd.)
 *   - Federasyon kategori (Spor/STK/Mesleki)
 *   - Mail/SMS send istatistikleri (toplam gönderilen, başarı oranı)
 *   - Listeden çıkanlar (unsubscribed)
 *   - Top 10 il (vakıflar)
 *   - Son gönderim aktivitesi (5 kayıt)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartBar, ChevronDown, ChevronUp, Users, Mail, Phone, Send, UserMinus,
  TrendingUp, MapPin, Activity, Loader2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryDetail {
  label: string;
  total: number;
  sample?: number;
  email?: number;
  phone?: number;
  emailPct?: number;
  phonePct?: number;
  unsubscribed: number;
  kamuYarari?: number;
  topCities?: Array<{ city: string; count: number }>;
  byCategory?: Record<string, number>;
}

type CategoryKey = 'all' | 'vakif' | 'dernek' | 'kulup' | 'ilMudurluk' | 'federasyon' | 'gencSporMudurluk';

interface StatsResp {
  generatedAt: number;
  byCollection: {
    registryVakiflar: number;
    registryDernekler: number;
    outreachContacts: number;
  };
  byType: Record<string, number>;
  federasyonByCategory: Record<string, number>;
  coverage: {
    vakiflar: {
      total: number;
      email: number;
      phone: number;
      emailPct: number;
      phonePct: number;
    };
    kamuYarariDernekler?: number;
  };
  unsubscribed: {
    vakiflar: number;
    dernekler: number;
    outreach: number;
    total: number;
  };
  sends: {
    totalSent: number;
    totalFailed: number;
    totalSkipped: number;
    successRate: number;
    channelBreakdown: Record<string, number>;
    sourceBreakdown: Record<string, number>;
    recentSends: Array<{ id: string; channel: string; source: string; sent: number; failed: number; createdAt: number | null }>;
  };
  topCities: Array<{ city: string; count: number }>;
  recentUpdates: Array<{ id: string; source: string; createdAt: number | null }>;
  categories: Record<CategoryKey, CategoryDetail>;
}

interface Props {
  user: { getIdToken: () => Promise<string> } | null;
}

function formatN(n: number): string { return n.toLocaleString('tr-TR'); }
function formatTime(ms: number | null): string {
  if (!ms) return '';
  const d = new Date(ms);
  const now = Date.now();
  const diff = (now - ms) / 1000;
  if (diff < 60) return `${Math.round(diff)} sn önce`;
  if (diff < 3600) return `${Math.round(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.round(diff / 3600)} sa önce`;
  return d.toLocaleDateString('tr-TR');
}

export function OutreachDashboard({ user }: Props) {
  const [open, setOpen] = useState(true);
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Aktif kategori sekmesi. 'all' = tüm kayıtların aggregated istatistiği (varsayılan).
  const [activeCat, setActiveCat] = useState<CategoryKey>('all');

  const fetchStats = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/outreach/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Stats yüklenemedi');
      setStats(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (open && !stats) fetchStats(); }, [open, stats, fetchStats]);

  return (
    <Card className="border-primary/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ChartBar className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">Outreach Dashboard</h2>
          {stats && (
            <Badge variant="outline" className="ml-2 text-[10px]">
              Toplam: {formatN(stats.byCollection.registryVakiflar + stats.byCollection.registryDernekler + stats.byCollection.outreachContacts)} kayıt
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setStats(null); fetchStats(); }} title="Yenile (cache 5dk)">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <CardContent className="border-t pt-4 space-y-4">
          {loading && !stats && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{error}</p>
          )}
          {stats && (
            <>
              {/* Kategori sekmeleri — her sekme aynı detay paneli formatında istatistik gösterir.
                  "Tümü" (varsayılan) tüm kayıtların aggregated istatistiğini gösterir. */}
              <div className="flex flex-wrap gap-2">
                <CatPill active={activeCat === 'all'} onClick={() => setActiveCat('all')} label="Tümü" count={stats.categories.all.total} />
                <CatPill active={activeCat === 'vakif'} onClick={() => setActiveCat('vakif')} label="Vakıf" count={stats.categories.vakif.total} />
                <CatPill active={activeCat === 'dernek'} onClick={() => setActiveCat('dernek')} label="Dernek" count={stats.categories.dernek.total} />
                <CatPill active={activeCat === 'kulup'} onClick={() => setActiveCat('kulup')} label="Kulüp" count={stats.categories.kulup.total} />
                <CatPill active={activeCat === 'ilMudurluk'} onClick={() => setActiveCat('ilMudurluk')} label="STİ İl Müdürlükleri" count={stats.categories.ilMudurluk.total} />
                <CatPill active={activeCat === 'federasyon'} onClick={() => setActiveCat('federasyon')} label="Federasyonlar" count={stats.categories.federasyon.total} />
                <CatPill active={activeCat === 'gencSporMudurluk'} onClick={() => setActiveCat('gencSporMudurluk')} label="Gençlik ve Spor İl Müdürlükleri" count={stats.categories.gencSporMudurluk.total} />
              </div>

              <CategoryDetailPanel cat={stats.categories[activeCat]} />
            </>
          )}
          {stats && activeCat === 'all' && (
            <>
              {/* Send & Unsubscribed */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-blue-700 flex items-center gap-1"><Send className="h-3 w-3" /> Email gönderildi</p>
                    <p className="text-2xl font-black tabular-nums">{formatN(stats.sends.channelBreakdown.email || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-violet-50/50 border-violet-200">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-violet-700 flex items-center gap-1"><Send className="h-3 w-3" /> SMS gönderildi</p>
                    <p className="text-2xl font-black tabular-nums">{formatN(stats.sends.channelBreakdown.sms || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-rose-50/50 border-rose-200">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-rose-700 flex items-center gap-1"><UserMinus className="h-3 w-3" /> Listeden çıkanlar</p>
                    <p className="text-2xl font-black tabular-nums">{formatN(stats.unsubscribed.total)}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Vakıf {stats.unsubscribed.vakiflar} · Dernek {stats.unsubscribed.dernekler} · Manuel {stats.unsubscribed.outreach}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top cities + recent activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="bg-muted/20">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Top 10 İl (Tüm kayıtlar)
                    </p>
                    <ol className="space-y-1 text-xs">
                      {stats.topCities.map((c, i) => (
                        <li key={c.city} className="flex justify-between">
                          <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                          <span className="flex-1 mx-2 truncate">{c.city}</span>
                          <span className="font-bold tabular-nums">{formatN(c.count)}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
                <Card className="bg-muted/20">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Son Aktivite
                    </p>
                    {stats.sends.recentSends.length === 0 && stats.recentUpdates.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Henüz aktivite yok.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs">
                        {stats.sends.recentSends.map((s) => (
                          <li key={s.id} className="flex items-center gap-2">
                            <Send className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="flex-1">
                              <strong>{s.sent}</strong> {s.channel === 'email' ? 'email' : 'SMS'} gönderildi
                              {s.failed > 0 && <span className="text-rose-600"> ({s.failed} fail)</span>}
                            </span>
                            <span className="text-muted-foreground text-[10px]">{formatTime(s.createdAt)}</span>
                          </li>
                        ))}
                        {stats.recentUpdates.map((u) => (
                          <li key={u.id} className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-blue-600 shrink-0" />
                            <span className="flex-1">{u.source} kaydı düzenlendi</span>
                            <span className="text-muted-foreground text-[10px]">{formatTime(u.createdAt)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              <p className="text-[10px] text-muted-foreground text-right">
                Son güncelleme: {formatTime(stats.generatedAt)} · 5dk cache
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn('h-7 w-7 rounded-md flex items-center justify-center', color)}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">{label}</p>
        </div>
        <p className="text-xl font-black tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function CatPill({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted/50 border-input text-foreground',
      )}
    >
      {label}
      <span className={cn('tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-primary-foreground/20' : 'bg-muted')}>
        {formatN(count)}
      </span>
    </button>
  );
}

function CoverageCard({ label, value, total, pct, color, icon: Icon }: { label: string; value: number; total: number; pct: number; color: string; icon: React.ElementType }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3">
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
          <Icon className="h-3 w-3" /> {label}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-black tabular-nums">{formatN(value)}</p>
          <p className="text-xs text-muted-foreground">%{pct} / {formatN(total)}</p>
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full', color)} style={{ width: `${pct}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryDetailPanel({ cat }: { cat: CategoryDetail }) {
  const hasContact = cat.email !== undefined || cat.phone !== undefined;
  const isSampled = cat.sample !== undefined && cat.total > cat.sample;
  return (
    <div className="space-y-4">
      {/* Kategori toplamı */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <CardContent className="p-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary/70">{cat.label} — Toplam Kayıt</p>
          <p className="text-4xl font-black tabular-nums leading-none mt-1">{formatN(cat.total)}</p>
          {isSampled && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Kapsama oranları {formatN(cat.sample!)} kayıtlık örneklemden hesaplanır.
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cat.email !== undefined && (
          <KPI label="E-posta var" value={formatN(cat.email)} icon={Mail} color="bg-emerald-600" sub={`%${cat.emailPct} kapsama`} />
        )}
        {cat.phone !== undefined && (
          <KPI label="Telefon var" value={formatN(cat.phone)} icon={Phone} color="bg-blue-500" sub={`%${cat.phonePct} kapsama`} />
        )}
        {cat.kamuYarari !== undefined && (
          <KPI label="Kamu Yararı" value={formatN(cat.kamuYarari)} icon={Users} color="bg-emerald-700" />
        )}
        <KPI label="Listeden çıkan" value={formatN(cat.unsubscribed)} icon={UserMinus} color="bg-rose-500" />
      </div>

      {/* Kapsama barları */}
      {hasContact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cat.email !== undefined && (
            <CoverageCard label="E-posta Kapsama" value={cat.email} total={cat.total} pct={cat.emailPct ?? 0} color="bg-emerald-500" icon={Mail} />
          )}
          {cat.phone !== undefined && (
            <CoverageCard label="Telefon Kapsama" value={cat.phone} total={cat.total} pct={cat.phonePct ?? 0} color="bg-blue-500" icon={Phone} />
          )}
        </div>
      )}

      {/* Alt kategoriler (federasyon: Spor/STK/Mesleki) */}
      {cat.byCategory && Object.values(cat.byCategory).some((v) => v > 0) && (
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Alt Kategoriler</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(cat.byCategory).filter(([, c]) => c > 0).map(([k, c]) => (
              <Card key={k} className="bg-emerald-50/50 border-emerald-200">
                <CardContent className="p-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">{k}</p>
                  <p className="text-2xl font-black tabular-nums">{formatN(c)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Top iller */}
      {cat.topCities && cat.topCities.length > 0 && (
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Top 10 İl{isSampled ? ` (örneklem ${formatN(cat.sample!)})` : ''}
            </p>
            <ol className="space-y-1 text-xs">
              {cat.topCities.map((c, i) => (
                <li key={c.city} className="flex justify-between">
                  <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="flex-1 mx-2 truncate">{c.city}</span>
                  <span className="font-bold tabular-nums">{formatN(c.count)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
