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
              {/* GRAND TOTAL — Vakıf + Dernek + Kulüp + Federasyon + Manuel toplam */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Outreach Veritabanı Toplamı</p>
                    <p className="text-4xl font-black tabular-nums leading-none mt-1">
                      {formatN(stats.byCollection.registryVakiflar + stats.byCollection.registryDernekler + stats.byCollection.outreachContacts)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">tüm kayıtlar (vakıf + dernek + kulüp + federasyon + müdürlük + manuel)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Vakıf</p>
                      <p className="text-base font-black tabular-nums">{formatN(stats.byCollection.registryVakiflar)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Dernek</p>
                      <p className="text-base font-black tabular-nums">{formatN(stats.byCollection.registryDernekler)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Federasyon</p>
                      <p className="text-base font-black tabular-nums">{formatN(stats.byType.Federasyon || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Spor Kulübü</p>
                      <p className="text-base font-black tabular-nums">{formatN(stats.byType.SporKulübü || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Sivil Toplum</p>
                      <p className="text-base font-black tabular-nums">{formatN(stats.byType.SivilToplumMüdürlüğü || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4 ana KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPI label="Vakıflar" value={formatN(stats.byCollection.registryVakiflar)} icon={Users} color="bg-amber-500" />
                <KPI label="Dernekler" value={formatN(stats.byCollection.registryDernekler)} icon={Users} color="bg-rose-500" />
                <KPI label="Manuel/CSV" value={formatN(stats.byCollection.outreachContacts)} icon={Users} color="bg-blue-500" />
                <KPI label="Toplam Mail" value={formatN(stats.sends.totalSent)} icon={Send} color="bg-emerald-600" sub={`${stats.sends.successRate}% başarı`} />
              </div>

              {/* Coverage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Vakıflar Email Kapsama
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-black tabular-nums">{formatN(stats.coverage.vakiflar.email)}</p>
                      <p className="text-xs text-muted-foreground">{stats.coverage.vakiflar.emailPct}% / {formatN(stats.coverage.vakiflar.total)}</p>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${stats.coverage.vakiflar.emailPct}%` }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Vakıflar Telefon Kapsama
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-black tabular-nums">{formatN(stats.coverage.vakiflar.phone)}</p>
                      <p className="text-xs text-muted-foreground">{stats.coverage.vakiflar.phonePct}% / {formatN(stats.coverage.vakiflar.total)}</p>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${stats.coverage.vakiflar.phonePct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Type breakdown — outreachContacts */}
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Manuel/CSV Kayıtların Tür Dağılımı</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {Object.entries(stats.byType).filter(([, c]) => c > 0).map(([t, c]) => (
                    <Card key={t} className="bg-muted/20">
                      <CardContent className="p-2">
                        <p className="text-[9px] uppercase text-muted-foreground truncate">{t}</p>
                        <p className="text-lg font-black tabular-nums">{formatN(c)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Federasyon kategori */}
              {Object.values(stats.federasyonByCategory).some((v) => v > 0) && (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Federasyon Kategorileri</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(stats.federasyonByCategory).map(([cat, c]) => (
                      <Card key={cat} className="bg-emerald-50/50 border-emerald-200">
                        <CardContent className="p-3">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">{cat}</p>
                          <p className="text-2xl font-black tabular-nums">{formatN(c)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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
                      <MapPin className="h-3 w-3" /> Top 10 İl (Vakıflar — örneklem 1000)
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
