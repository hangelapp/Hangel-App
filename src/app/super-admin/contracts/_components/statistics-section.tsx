'use client';

/**
 * hangel — /super-admin/contracts "İstatistikler" bölümü.
 *
 * Genel sekmesinde "Hızlı Erişim" kartının hemen altında yer alır. Tüm
 * okuma operasyonu in-memory aggregation üzerinden yapılır; Firestore'a
 * yazma yoktur. İki paralel sorgu açar:
 *   - contracts  (parent sayfada zaten okunuyor → prop ile geçer)
 *   - contractCompliance  (jurisdiction ortalamaları için bu component)
 *
 * Görselleştirme: recharts (PieChart + BarChart). 4 kart + 4 chart bloğu.
 * Tasarım: rounded-3xl + glass-surface mevcut design system'e uyumlu.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, ChevronDown, ChevronUp, RefreshCw, Loader2,
  AlertTriangle, Clock, FileText, Globe, Layers, Scale,
  ShieldCheck, ListOrdered, ThumbsUp, ThumbsDown, Users,
  Building2, Monitor, Smartphone, CheckCircle2, XCircle,
  TrendingUp, Eye, Percent, Calendar,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

// ---- Tipler (parent ile birebir, hafif kopya) ----
type DocStatus = 'taslak' | 'incelemede' | 'yayinlandi' | 'arsivlendi';

interface StatsContract {
  id: string;
  slug: string;
  title: string;
  content?: string;
  group?: string;
  kind?: 'contract' | 'policy';
  version?: string;
  status?: DocStatus;
  country?: string;
  jurisdictions?: string[];
  updatedAt?: unknown;
  publishedAt?: string;
  wordCount?: number;
  source?: 'firestore' | 'seed';
}

interface ComplianceDoc {
  id?: string;
  contractSlug?: string;
  jurisdiction?: string;
  score?: number;
}

// Onay kaydı şeması — /api/contracts/approve route'undan yazılır
interface ApprovalDoc {
  id?: string;
  contractSlug?: string;
  contractTitle?: string;
  decision?: 'approved' | 'rejected';
  userId?: string;
  userName?: string;
  userType?: string;      // 'user', 'ngo', 'brand', 'super-admin' vb.
  approvedAt?: unknown;   // serverTimestamp
  device?: string;        // 'desktop', 'mobile', 'tablet'
  browser?: string;
  os?: string;
  country?: string | null;
  method?: string;        // 'popup', 'inline', 'banner'
  readSeconds?: number;
  scrollCompleted?: boolean;
  version?: string;
}

type Lang = 'tr' | 'en';

interface Props {
  contracts: StatsContract[];
  isLoading?: boolean;
  language?: Lang;
}

// ---- i18n ----
const T = {
  tr: {
    title: 'İstatistikler',
    subtitle: 'hangel sözleşme & politika dokümanları üzerinden anlık özet.',
    refresh: 'Yenile',
    totalDocs: 'Toplam Doküman',
    kindDist: 'Kategori Dağılımı',
    jurisdictionDist: 'Jurisdiction Dağılımı',
    statusDist: 'Durum Dağılımı',
    avgCompliance: 'Ortalama Uyum (jurisdiction)',
    lowestScores: 'En Düşük Uyum (5 doc)',
    recentUpdates: 'Son Güncellenen (5 doc)',
    avgWords: 'Ortalama Kelime',
    versionDist: 'Versiyon Dağılımı',
    contracts: 'Sözleşme',
    policies: 'Politika',
    noData: 'Veri yok.',
    loading: 'Yükleniyor...',
    none: '—',
    open: 'Aç',
    close: 'Gizle',
    // Approval section
    approvalsTitle: 'Onay İstatistikleri',
    approvalsSubtitle: 'Sözleşme & politika onaylarının kullanıcı, kurum ve cihaz dağılımı.',
    totalApprovals: 'Toplam Onay Kaydı',
    approvedByUsers: 'Kullanıcı Onayı',
    approvedByOrgs: 'Kurum Onayı',
    approvedBySuperAdmin: 'Süper Admin Onayı',
    rejectionRate: 'Red Oranı',
    avgReadSec: 'Ort. Okuma Süresi',
    scrollCompletionRate: 'Sayfa Sonuna İnen %',
    decisionDist: 'Onay / Red Dağılımı',
    userTypeDist: 'Onaylayan Tipi',
    deviceDist: 'Cihaz Dağılımı',
    methodDist: 'Onay Yöntemi',
    countryDist: 'Ülke Dağılımı',
    topApproved: 'En Çok Onaylanan (10 doc)',
    last30days: 'Son 30 Gün Onay Aktivitesi',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    user: 'Kullanıcı',
    ngo: 'STK / Kurum',
    brand: 'Marka',
    superAdmin: 'Süper Admin',
    other: 'Diğer',
    desktop: 'Masaüstü',
    mobile: 'Mobil',
    tablet: 'Tablet',
    popup: 'Popup',
    inline: 'Inline',
    banner: 'Banner',
    seconds: 'sn',
  },
  en: {
    title: 'Statistics',
    subtitle: 'Live summary of hangel contracts & policies.',
    refresh: 'Refresh',
    totalDocs: 'Total Documents',
    kindDist: 'Kind Distribution',
    jurisdictionDist: 'Jurisdiction Distribution',
    statusDist: 'Status Distribution',
    avgCompliance: 'Avg Compliance (by jurisdiction)',
    lowestScores: 'Lowest Compliance (5 docs)',
    recentUpdates: 'Recently Updated (5 docs)',
    avgWords: 'Avg Word Count',
    versionDist: 'Version Distribution',
    contracts: 'Contract',
    policies: 'Policy',
    noData: 'No data.',
    loading: 'Loading...',
    none: '—',
    open: 'Open',
    close: 'Hide',
    approvalsTitle: 'Approval Statistics',
    approvalsSubtitle: 'User, organization and device breakdown of contract & policy approvals.',
    totalApprovals: 'Total Approval Records',
    approvedByUsers: 'User Approvals',
    approvedByOrgs: 'Organization Approvals',
    approvedBySuperAdmin: 'Super Admin Approvals',
    rejectionRate: 'Rejection Rate',
    avgReadSec: 'Avg Read Time',
    scrollCompletionRate: 'Read-to-End Rate',
    decisionDist: 'Approval / Rejection',
    userTypeDist: 'Approver Type',
    deviceDist: 'Device Distribution',
    methodDist: 'Approval Method',
    countryDist: 'Country Distribution',
    topApproved: 'Most Approved (top 10)',
    last30days: 'Last 30 Days Activity',
    approved: 'Approved',
    rejected: 'Rejected',
    user: 'User',
    ngo: 'NGO',
    brand: 'Brand',
    superAdmin: 'Super Admin',
    other: 'Other',
    desktop: 'Desktop',
    mobile: 'Mobile',
    tablet: 'Tablet',
    popup: 'Popup',
    inline: 'Inline',
    banner: 'Banner',
    seconds: 's',
  },
} as const;

const USER_TYPE_COLOR: Record<string, string> = {
  user: '#0ea5e9',
  ngo: '#16a34a',
  brand: '#f59e0b',
  'super-admin': '#a855f7',
  other: '#94a3b8',
};
const DECISION_COLOR = { approved: '#16a34a', rejected: '#dc2626' } as const;
const DEVICE_COLOR: Record<string, string> = {
  desktop: '#042654',
  mobile: '#f34723',
  tablet: '#a855f7',
  other: '#94a3b8',
};

const STATUS_LABEL: Record<DocStatus, { tr: string; en: string; color: string }> = {
  taslak: { tr: 'Taslak', en: 'Draft', color: '#94a3b8' },
  incelemede: { tr: 'İncelemede', en: 'Review', color: '#f59e0b' },
  yayinlandi: { tr: 'Yayında', en: 'Published', color: '#16a34a' },
  arsivlendi: { tr: 'Arşiv', en: 'Archived', color: '#64748b' },
};

const KIND_COLOR = { contract: '#f34723', policy: '#042654' } as const;
const PIE_COLORS = ['#f34723', '#042654', '#16a34a', '#f59e0b', '#a855f7', '#0ea5e9', '#64748b'];

const isPolicy = (c: StatsContract): boolean =>
  c.kind === 'policy' ||
  (!c.kind && /politika|gizlilik|kvkk|çerez|cerez|topluluk|moderasyon/i.test(`${c.title} ${c.group || ''}`));

function resolveCountries(c: StatsContract): string[] {
  if (c.jurisdictions && c.jurisdictions.length > 0) {
    return c.jurisdictions.map((j) => j.toUpperCase());
  }
  if (c.country) return [c.country.toUpperCase()];
  return ['TR']; // hangel — varsayılan tek-ülke fallback
}

function getUpdatedAtMs(c: StatsContract): number {
  const u = c.updatedAt;
  if (typeof u === 'string') {
    const t = Date.parse(u);
    return Number.isFinite(t) ? t : 0;
  }
  if (u && typeof u === 'object' && 'seconds' in u) {
    const sec = (u as { seconds?: number }).seconds;
    return typeof sec === 'number' ? sec * 1000 : 0;
  }
  if (c.publishedAt) {
    const t = Date.parse(c.publishedAt);
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

function countWords(c: StatsContract): number {
  if (typeof c.wordCount === 'number' && c.wordCount > 0) return c.wordCount;
  if (!c.content) return 0;
  // hangel — basit kelime sayacı: HTML tag temizle, whitespace böl.
  const stripped = c.content.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return stripped.trim().split(/\s+/).filter(Boolean).length;
}

export function StatisticsSection({ contracts, isLoading, language = 'tr' }: Props) {
  const db = useFirestore();
  const [open, setOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const t = T[language];

  // hangel — refreshKey cache invalidate için memo dependency tetikler.
  const complianceQuery = useMemoFirebase(
    () => collection(db, COLLECTIONS.contractCompliance),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, refreshKey],
  );
  const { data: complianceRows, isLoading: loadingCompliance } =
    useCollection<ComplianceDoc>(complianceQuery);

  // ---- Aggregations ----
  const agg = useMemo(() => {
    const total = contracts.length;
    const kindCounts = { contract: 0, policy: 0 };
    const statusCounts: Record<string, number> = {};
    const jurisdictionCounts: Record<string, number> = {};
    const versionCounts: Record<string, number> = {};
    let totalWords = 0;
    let withWords = 0;

    contracts.forEach((c) => {
      if (isPolicy(c)) kindCounts.policy += 1;
      else kindCounts.contract += 1;

      const s = c.status || 'taslak';
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      resolveCountries(c).forEach((cc) => {
        jurisdictionCounts[cc] = (jurisdictionCounts[cc] || 0) + 1;
      });

      const v = (c.version || '—').trim() || '—';
      versionCounts[v] = (versionCounts[v] || 0) + 1;

      const w = countWords(c);
      if (w > 0) { totalWords += w; withWords += 1; }
    });

    const avgWords = withWords > 0 ? Math.round(totalWords / withWords) : 0;

    const recent = [...contracts]
      .map((c) => ({ c, ms: getUpdatedAtMs(c) }))
      .filter((x) => x.ms > 0)
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 5);

    return {
      total,
      kindCounts,
      statusCounts,
      jurisdictionCounts,
      versionCounts,
      avgWords,
      recent,
    };
  }, [contracts]);

  // ---- Compliance aggregations ----
  const compAgg = useMemo(() => {
    const rows = complianceRows || [];
    const byJur = new Map<string, { sum: number; n: number }>();
    const byDoc = new Map<string, { sum: number; n: number }>();
    rows.forEach((r) => {
      const score = typeof r.score === 'number' ? r.score : -1;
      if (score < 0) return;
      const j = (r.jurisdiction || '').toUpperCase();
      if (j) {
        const cur = byJur.get(j) || { sum: 0, n: 0 };
        cur.sum += score; cur.n += 1;
        byJur.set(j, cur);
      }
      const slug = r.contractSlug || '';
      if (slug) {
        const cur = byDoc.get(slug) || { sum: 0, n: 0 };
        cur.sum += score; cur.n += 1;
        byDoc.set(slug, cur);
      }
    });

    const jurAvg = Array.from(byJur.entries())
      .map(([code, v]) => ({ code, avg: Math.round(v.sum / Math.max(1, v.n)) }))
      .sort((a, b) => b.avg - a.avg);

    const titleBySlug = new Map(contracts.map((c) => [c.slug, c.title] as const));
    const docAvg = Array.from(byDoc.entries())
      .map(([slug, v]) => ({
        slug,
        title: titleBySlug.get(slug) || slug,
        avg: Math.round(v.sum / Math.max(1, v.n)),
      }))
      .filter((d) => titleBySlug.has(d.slug))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);

    return { jurAvg, docAvg };
  }, [complianceRows, contracts]);

  // ---- Chart data ----
  const kindData = useMemo(() => [
    { name: t.contracts, value: agg.kindCounts.contract, color: KIND_COLOR.contract },
    { name: t.policies, value: agg.kindCounts.policy, color: KIND_COLOR.policy },
  ].filter((d) => d.value > 0), [agg.kindCounts, t]);

  const statusData = useMemo(() =>
    (Object.keys(STATUS_LABEL) as DocStatus[])
      .map((k) => ({
        name: STATUS_LABEL[k][language],
        value: agg.statusCounts[k] || 0,
        color: STATUS_LABEL[k].color,
      }))
      .filter((d) => d.value > 0),
  [agg.statusCounts, language]);

  const jurisdictionData = useMemo(() =>
    Object.entries(agg.jurisdictionCounts)
      .map(([code, value]) => ({ code, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15),
  [agg.jurisdictionCounts]);

  const versionData = useMemo(() =>
    Object.entries(agg.versionCounts)
      .map(([version, value]) => ({ version, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  [agg.versionCounts]);

  const dateLocale = language === 'tr' ? 'tr-TR' : 'en-US';
  const fmtDate = (ms: number) => {
    try {
      return new Date(ms).toLocaleDateString(dateLocale, {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return ''; }
  };

  const busy = isLoading || loadingCompliance;

  return (
    <Card className="rounded-3xl border-primary/10">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base">{t.title}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={busy}
              aria-label={t.refresh}
            >
              {busy
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">{t.refresh}</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={open ? t.close : t.open}
              >
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {busy && contracts.length === 0 ? (
              <SkeletonGrid />
            ) : (
              <>
                {/* Metrik kartları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MiniStat icon={FileText} label={t.totalDocs} value={agg.total} />
                  <MiniStat icon={ListOrdered} label={t.avgWords} value={agg.avgWords} />
                  <MiniStat
                    icon={ShieldCheck}
                    label={t.avgCompliance}
                    value={
                      compAgg.jurAvg.length > 0
                        ? `%${Math.round(
                            compAgg.jurAvg.reduce((s, j) => s + j.avg, 0) /
                              compAgg.jurAvg.length,
                          )}`
                        : t.none
                    }
                  />
                  <MiniStat
                    icon={Globe}
                    label={t.jurisdictionDist}
                    value={Object.keys(agg.jurisdictionCounts).length}
                  />
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard icon={Layers} title={t.kindDist}>
                    {kindData.length === 0 ? <Empty t={t.noData} /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={kindData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                            label={(p: { name?: string; percent?: number }) =>
                              `${p.name ?? ''} ${Math.round((p.percent ?? 0) * 100)}%`
                            }
                          >
                            {kindData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard icon={Scale} title={t.statusDist}>
                    {statusData.length === 0 ? <Empty t={t.noData} /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                          >
                            {statusData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard icon={Globe} title={t.jurisdictionDist}>
                    {jurisdictionData.length === 0 ? <Empty t={t.noData} /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={jurisdictionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f34723" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard icon={ShieldCheck} title={t.avgCompliance}>
                    {compAgg.jurAvg.length === 0 ? <Empty t={t.noData} /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={compAgg.jurAvg}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => `%${v}`} />
                          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                            {compAgg.jurAvg.map((d, i) => (
                              <Cell
                                key={i}
                                fill={d.avg >= 80 ? '#16a34a' : d.avg >= 50 ? '#f59e0b' : '#dc2626'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard icon={Layers} title={t.versionDist}>
                    {versionData.length === 0 ? <Empty t={t.noData} /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={versionData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                          <YAxis dataKey="version" type="category" width={70} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#042654" radius={[0, 4, 4, 0]}>
                            {versionData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard icon={AlertTriangle} title={t.lowestScores}>
                    {compAgg.docAvg.length === 0 ? <Empty t={t.noData} /> : (
                      <ul className="divide-y">
                        {compAgg.docAvg.map((d) => (
                          <li key={d.slug} className="py-2 flex items-center justify-between gap-3">
                            <Link
                              href={`/super-admin/contracts/compliance/${d.slug}`}
                              className="text-sm font-medium truncate hover:underline text-primary"
                            >
                              {d.title}
                            </Link>
                            <Badge
                              className={cn(
                                'text-[10px] shrink-0',
                                d.avg >= 80 ? 'bg-green-600 text-white'
                                  : d.avg >= 50 ? 'bg-amber-500 text-white'
                                  : 'bg-red-600 text-white',
                              )}
                            >
                              %{d.avg}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ChartCard>
                </div>

                {/* Recent updates — geniş */}
                <ChartCard icon={Clock} title={t.recentUpdates}>
                  {agg.recent.length === 0 ? <Empty t={t.noData} /> : (
                    <ul className="divide-y">
                      {agg.recent.map(({ c, ms }) => (
                        <li key={c.slug} className="py-2 flex items-center justify-between gap-3">
                          <Link
                            href={`/settings/contracts/${c.slug}`}
                            className="text-sm font-medium truncate hover:underline"
                          >
                            {c.title}
                          </Link>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {fmtDate(ms)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ChartCard>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ---- Yardımcı küçük bileşenler ----

function MiniStat({
  icon: Icon, label, value,
}: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-3 space-y-1">
      <Icon className="h-4 w-4 text-primary" />
      <p className="text-xl font-black leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function ChartCard({
  icon: Icon, title, children,
}: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Empty({ t }: { t: string }) {
  return (
    <p className="text-xs text-muted-foreground italic text-center py-8">{t}</p>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border bg-muted/40 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl border bg-muted/40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
