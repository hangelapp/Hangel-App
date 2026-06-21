'use client';

/**
 * /super-admin/ngo-ads — STK Reklam Yönetimi (ajans / gözetim paneli).
 *
 * hangel ekibinin tüm STK'ların reklam hakkı sürecini tek ekrandan çevirdiği
 * panel. Faz 0:
 *   - Platform sekmeleri (Google aktif · Meta/TikTok yakında)
 *   - Uygun aday havuzu (vakıf + dernek; e-postası olan = ulaşılabilir)
 *   - Pipeline funnel (Aday → Başvurdu → Onaylandı → Bağlı → Aktif)
 *   - Bağlı hesaplar (Faz 1'de Google Ads API ile dolar)
 *
 * Google Ads API hesap bağlama, uyumluluk uyarıları, toplu AI yenileme = Faz 1.
 * Tasarım: Apple iOS dili + hangel renkleri.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Megaphone, Landmark, Heart, Mail, Loader2, ExternalLink, Link2,
    TrendingUp, Sparkles, ShieldAlert, RefreshCw, ChevronDown,
    Check, X, Plug, Radio, Undo2, Target, Hash, Users,
    BarChart3, Eye, MousePointerClick, Percent, Wallet,
    Building2, Pause, Play, Trash2, AlertTriangle,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StatsResp {
    byCollection: { registryVakiflar: number; registryDernekler: number; outreachContacts: number };
    categories: Record<string, { total: number; email?: number }>;
}

interface AdminPlan {
    id: string;
    ngoId: string;
    ngoName: string;
    kind: string;
    title: string;
    landing: string;
    status: string;
    createdAt: number | null;
    estReach?: number;
    keywords?: string[];
    goal?: string;
    platform?: string;
}

type PlanStatus = 'submitted' | 'approved' | 'linked' | 'active' | 'rejected';

/** /api/super-admin/ngo-ads/performance metrik satırı. */
interface PerfMetric {
    ngoId: string;
    customerId?: string;
    impressions: number;
    clicks: number;
    ctr: number;
    costMicros: number;
}

/** /api/super-admin/ngo-ads/meta-performance metrik satırı. */
interface MetaPerfMetric {
    ngoId: string;
    adAccountId?: string;
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
}

/** /api/super-admin/ngo-ads/tiktok-performance metrik satırı. */
interface TiktokPerfMetric {
    ngoId: string;
    advertiserId?: string;
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
}

/** hangel Ajans (MCC) — alt-hesap kampanyası. */
interface AgencyCampaign {
    campaignId: string;
    resourceName: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    ctr: number;
    costMicros: number;
}

/** hangel Ajans (MCC) — MCC altındaki bir alt-hesap. */
interface AgencyAccount {
    customerId: string;
    name: string;
    ngoId: string | null;
    campaigns: AgencyCampaign[];
    totals: { impressions: number; clicks: number; ctr: number; costMicros: number };
}

/** GET /api/super-admin/ngo-ads/agency yanıtı. */
interface AgencyResp {
    configured: boolean;
    connected: boolean;
    mccCustomerId?: string;
    accounts: AgencyAccount[];
}

/** Mevcut status'a göre sunulacak ilerletme aksiyonları. */
const STATUS_ACTIONS: Record<string, Array<{ to: PlanStatus; label: string; icon: React.ElementType; tone: 'primary' | 'danger' | 'neutral' }>> = {
    submitted: [
        { to: 'approved', label: 'Onayla', icon: Check, tone: 'primary' },
        { to: 'rejected', label: 'Reddet', icon: X, tone: 'danger' },
    ],
    approved: [{ to: 'linked', label: 'Bağlandı', icon: Plug, tone: 'primary' }],
    linked: [{ to: 'active', label: 'Aktif', icon: Radio, tone: 'primary' }],
    rejected: [{ to: 'submitted', label: 'Geri Al', icon: Undo2, tone: 'neutral' }],
};

/** Durum rozeti renkleri. */
const STATUS_TINT: Record<string, string> = {
    submitted: 'bg-blue-500/10 text-blue-600',
    approved: 'bg-violet-500/10 text-violet-600',
    linked: 'bg-amber-500/10 text-amber-600',
    active: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-rose-500/10 text-rose-600',
};

const PLATFORMS = [
    { key: 'google', label: 'Google Ads', active: true },
    { key: 'meta', label: 'Meta', active: true },
    { key: 'tiktok', label: 'TikTok', active: true },
] as const;

const KIND_LABEL: Record<string, string> = {
    'search-donation': 'Bağış', 'search-awareness': 'Bilinirlik', 'search-beneficiary': 'Yararlanıcı',
    'hangel-donation': 'hangel Bağış', 'hangel-volunteer': 'hangel Gönüllülük',
};
const STATUS_LABEL: Record<string, string> = {
    submitted: 'Başvurdu', approved: 'Onaylandı', linked: 'Bağlı', active: 'Aktif', rejected: 'Reddedildi',
};

function formatN(n: number): string { return n.toLocaleString('tr-TR'); }

/** CTR fraction (clicks/impressions) → "%5,2". */
function formatCtr(ctr: number): string {
    return `%${(ctr * 100).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

/** costMicros → "1.234 ₺" (1e6 micros = 1 birim). */
function formatCost(costMicros: number): string {
    return `${(costMicros / 1e6).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;
}

/** Meta spend (hesap para biriminde, ham birim) → "1.234 ₺". */
function formatSpend(spend: number): string {
    return `${spend.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;
}

/** Agency kampanya CTR oranı (0-1) → "%5,2". */
function formatAgencyCtr(ctr: number): string {
    return `%${(ctr * 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Agency kampanya durumu → Türkçe etiket. */
function campaignStatusLabel(status: string): string {
    if (status === 'ENABLED') return 'Etkin';
    if (status === 'PAUSED') return 'Duraklatıldı';
    if (status === 'REMOVED') return 'Kaldırıldı';
    return status;
}

/** Agency kampanya durumu → rozet rengi. */
function campaignStatusTint(status: string): string {
    if (status === 'ENABLED') return 'bg-emerald-500/10 text-emerald-600';
    if (status === 'PAUSED') return 'bg-amber-500/10 text-amber-600';
    if (status === 'REMOVED') return 'bg-zinc-500/10 text-zinc-500';
    return 'bg-secondary text-muted-foreground';
}

/** Plan listesinden status sayımlarını yeniden hesapla. */
function recomputeCounts(list: AdminPlan[]): Record<string, number> {
    const next: Record<string, number> = {};
    for (const p of list) next[p.status] = (next[p.status] ?? 0) + 1;
    return next;
}

export default function NgoAdsAdminPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [stats, setStats] = useState<StatsResp | null>(null);
    const [plans, setPlans] = useState<AdminPlan[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'google' | 'meta' | 'tiktok'>('google');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [perfConfigured, setPerfConfigured] = useState(false);
    const [perf, setPerf] = useState<PerfMetric[]>([]);
    const [metaConfigured, setMetaConfigured] = useState(false);
    const [metaPerf, setMetaPerf] = useState<MetaPerfMetric[]>([]);
    const [metaLoading, setMetaLoading] = useState(false);
    const [tiktokConfigured, setTiktokConfigured] = useState(false);
    const [tiktokPerf, setTiktokPerf] = useState<TiktokPerfMetric[]>([]);
    const [tiktokLoading, setTiktokLoading] = useState(false);
    const [agency, setAgency] = useState<AgencyResp | null>(null);
    const [agencyLoading, setAgencyLoading] = useState(false);
    const [agencyConnecting, setAgencyConnecting] = useState(false);
    const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [statsRes, plansRes, perfRes] = await Promise.all([
                fetch('/api/super-admin/outreach/stats', { headers }),
                fetch('/api/super-admin/ngo-ads', { headers }),
                fetch('/api/super-admin/ngo-ads/performance', { headers }),
            ]);
            if (!statsRes.ok) throw new Error((await statsRes.json().catch(() => null))?.message || 'Veriler yüklenemedi');
            setStats(await statsRes.json());
            if (plansRes.ok) {
                const pd = (await plansRes.json()) as { plans?: AdminPlan[]; counts?: Record<string, number> };
                setPlans(pd.plans ?? []);
                setCounts(pd.counts ?? {});
            }
            if (perfRes.ok) {
                const perfData = (await perfRes.json()) as { configured?: boolean; metrics?: PerfMetric[] };
                setPerfConfigured(!!perfData.configured);
                setPerf(perfData.metrics ?? []);
            } else {
                setPerfConfigured(false);
                setPerf([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Hata');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const fetchAgency = useCallback(async () => {
        if (!user) return;
        setAgencyLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/ngo-ads/agency', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = (await res.json()) as Partial<AgencyResp>;
                setAgency({
                    configured: !!data.configured,
                    connected: !!data.connected,
                    mccCustomerId: data.mccCustomerId,
                    accounts: data.accounts ?? [],
                });
            } else {
                setAgency({ configured: false, connected: false, accounts: [] });
            }
        } catch {
            setAgency({ configured: false, connected: false, accounts: [] });
        } finally {
            setAgencyLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchAgency(); }, [fetchAgency]);

    const connectAgency = useCallback(async () => {
        if (!user || agencyConnecting) return;
        setAgencyConnecting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/ngo-ads/agency/start', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const msg = (await res.json().catch(() => null))?.message || 'Bağlantı başlatılamadı';
                throw new Error(msg);
            }
            const { authorizeUrl } = (await res.json()) as { authorizeUrl?: string };
            if (!authorizeUrl) throw new Error('Yetkilendirme adresi alınamadı');

            window.open(authorizeUrl, 'hangel-agency-oauth', 'width=520,height=680');

            const onMessage = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;
                const data = event.data as { type?: string; message?: string } | null;
                if (!data || typeof data.type !== 'string') return;
                if (data.type === 'hangel-agency-connected') {
                    window.removeEventListener('message', onMessage);
                    setAgencyConnecting(false);
                    toast({ title: 'Bağlandı', description: 'hangel MCC hesabı bağlandı.' });
                    fetchAgency();
                } else if (data.type === 'hangel-agency-error') {
                    window.removeEventListener('message', onMessage);
                    setAgencyConnecting(false);
                    toast({ variant: 'destructive', title: 'Bağlanamadı', description: data.message || 'Yetkilendirme başarısız' });
                }
            };
            window.addEventListener('message', onMessage);
        } catch (e) {
            setAgencyConnecting(false);
            toast({ variant: 'destructive', title: 'Bağlanamadı', description: e instanceof Error ? e.message : 'Hata' });
        }
    }, [user, agencyConnecting, toast, fetchAgency]);

    const changeCampaignStatus = useCallback(async (
        customerId: string,
        campaignResourceName: string,
        status: 'ENABLED' | 'PAUSED' | 'REMOVED',
    ) => {
        if (!user || pendingCampaignId) return;
        setPendingCampaignId(campaignResourceName);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/ngo-ads/agency/campaign-status', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId, campaignResourceName, status }),
            });
            const data = (await res.json().catch(() => null)) as { ok?: boolean; status?: string; errorCode?: string; message?: string } | null;
            if (!res.ok || !data?.ok) {
                throw new Error(data?.message || data?.errorCode || 'Kampanya güncellenemedi');
            }
            const nextStatus = data.status || status;
            setAgency((prev) => prev && ({
                ...prev,
                accounts: prev.accounts.map((acc) => acc.customerId !== customerId ? acc : {
                    ...acc,
                    campaigns: acc.campaigns.map((c) => c.resourceName === campaignResourceName ? { ...c, status: nextStatus } : c),
                }),
            }));
            toast({ title: 'Güncellendi', description: campaignStatusLabel(nextStatus) });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Güncellenemedi', description: e instanceof Error ? e.message : 'Hata' });
        } finally {
            setPendingCampaignId(null);
        }
    }, [user, pendingCampaignId, toast]);

    const fetchMetaPerf = useCallback(async () => {
        if (!user) return;
        setMetaLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/ngo-ads/meta-performance', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = (await res.json()) as { configured?: boolean; metrics?: MetaPerfMetric[] };
                setMetaConfigured(!!data.configured);
                setMetaPerf(data.metrics ?? []);
            } else {
                setMetaConfigured(false);
                setMetaPerf([]);
            }
        } catch {
            setMetaConfigured(false);
            setMetaPerf([]);
        } finally {
            setMetaLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (platform === 'meta') fetchMetaPerf();
    }, [platform, fetchMetaPerf]);

    const fetchTiktokPerf = useCallback(async () => {
        if (!user) return;
        setTiktokLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/ngo-ads/tiktok-performance', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = (await res.json()) as { configured?: boolean; metrics?: TiktokPerfMetric[] };
                setTiktokConfigured(!!data.configured);
                setTiktokPerf(data.metrics ?? []);
            } else {
                setTiktokConfigured(false);
                setTiktokPerf([]);
            }
        } catch {
            setTiktokConfigured(false);
            setTiktokPerf([]);
        } finally {
            setTiktokLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (platform === 'tiktok') fetchTiktokPerf();
    }, [platform, fetchTiktokPerf]);

    const changeStatus = useCallback(async (planId: string, status: PlanStatus) => {
        if (!user || pendingId) return;
        setPendingId(planId);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/ngo-ads/status', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, status }),
            });
            if (!res.ok) {
                const msg = (await res.json().catch(() => null))?.message || 'Durum güncellenemedi';
                throw new Error(msg);
            }
            setPlans((prev) => {
                const next = prev.map((p) => (p.id === planId ? { ...p, status } : p));
                setCounts(recomputeCounts(next));
                return next;
            });
            toast({ title: 'Durum güncellendi', description: STATUS_LABEL[status] || status });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Güncellenemedi', description: e instanceof Error ? e.message : 'Hata' });
        } finally {
            setPendingId(null);
        }
    }, [user, pendingId, toast]);

    const vakif = stats?.byCollection.registryVakiflar ?? 0;
    const dernek = stats?.byCollection.registryDernekler ?? 0;
    const adayTotal = vakif + dernek;
    const reachable = (stats?.categories?.vakif?.email ?? 0) + (stats?.categories?.dernek?.email ?? 0);

    const pipeline: Array<{ label: string; value: number; tint: string; status: string | null }> = [
        { label: 'Aday', value: adayTotal, tint: 'bg-primary/10 text-primary', status: null },
        { label: 'Başvurdu', value: counts.submitted ?? 0, tint: 'bg-blue-500/10 text-blue-600', status: 'submitted' },
        { label: 'Onaylandı', value: counts.approved ?? 0, tint: 'bg-violet-500/10 text-violet-600', status: 'approved' },
        { label: 'Bağlı', value: counts.linked ?? 0, tint: 'bg-amber-500/10 text-amber-600', status: 'linked' },
        { label: 'Aktif', value: counts.active ?? 0, tint: 'bg-emerald-500/10 text-emerald-600', status: 'active' },
    ];

    // Seçili platforma göre planları ayrıştır: platform alanı yoksa Google sayılır
    // (eski Google planları geriye dönük uyumlu kalsın).
    const platformPlans = plans.filter((p) => (p.platform ?? 'google') === platform);
    const visiblePlans = statusFilter ? platformPlans.filter((p) => p.status === statusFilter) : platformPlans;

    // ngoId → ngoName (mevcut plan listesinden türet) ve ngoId → performans satırı.
    const ngoNameById = new Map<string, string>();
    for (const p of plans) {
        if (p.ngoName) ngoNameById.set(p.ngoId, p.ngoName);
    }
    // PlanRow satır içi performans rozeti: seçili platforma göre kaynak değişir.
    // Meta spend'i PerfMetric.costMicros formatına çevir (formatCost 1e6'ya böler).
    const perfByNgoId = new Map<string, PerfMetric>();
    if (platform === 'meta') {
        for (const m of metaPerf) {
            perfByNgoId.set(m.ngoId, {
                ngoId: m.ngoId,
                customerId: m.adAccountId,
                impressions: m.impressions,
                clicks: m.clicks,
                ctr: m.ctr,
                costMicros: m.spend * 1e6,
            });
        }
    } else if (platform === 'tiktok') {
        for (const m of tiktokPerf) {
            perfByNgoId.set(m.ngoId, {
                ngoId: m.ngoId,
                customerId: m.advertiserId,
                impressions: m.impressions,
                clicks: m.clicks,
                ctr: m.ctr,
                costMicros: m.spend * 1e6,
            });
        }
    } else {
        for (const m of perf) perfByNgoId.set(m.ngoId, m);
    }

    return (
        <div className="min-h-dvh bg-background">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-5 py-6 space-y-6 animate-in fade-in-0 duration-300">

                {/* HERO */}
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-primary to-[#ff7a55] shadow-[0_8px_20px_-6px_rgba(243,71,35,0.5)] shrink-0">
                        <Megaphone className="h-6 w-6 text-white" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-foreground leading-tight">STK Reklam Yönetimi</h1>
                        <p className="text-[13px] text-muted-foreground">Ajans paneli — STK'ların reklam hakkı sürecini buradan çevir.</p>
                    </div>
                    <button onClick={fetchStats} disabled={loading} className="h-9 w-9 rounded-full bg-card border border-border/60 flex items-center justify-center active:scale-90 transition" title="Yenile" aria-label="Yenile">
                        <RefreshCw className={cn('h-4 w-4 text-muted-foreground', loading && 'animate-spin')} />
                    </button>
                </div>

                {/* hangel AJANS (MCC) */}
                <AgencyPanel
                    agency={agency}
                    loading={agencyLoading}
                    connecting={agencyConnecting}
                    pendingCampaignId={pendingCampaignId}
                    onConnect={connectAgency}
                    onRefresh={fetchAgency}
                    onChangeCampaignStatus={changeCampaignStatus}
                />

                {/* PLATFORM SEKMELERİ */}
                <div className="inline-flex bg-secondary rounded-full p-1 gap-1">
                    {PLATFORMS.map((p) => (
                        <button key={p.key} onClick={() => p.active && setPlatform(p.key)} disabled={!p.active}
                            className={cn('rounded-full px-4 h-9 text-[13px] font-semibold transition inline-flex items-center gap-1.5',
                                platform === p.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                                !p.active && 'opacity-60 cursor-not-allowed')}>
                            {p.label}
                            {!p.active && <span className="text-[9px] rounded-full bg-muted px-1.5 py-0.5">Yakında</span>}
                        </button>
                    ))}
                </div>

                {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-3">{error}</p>}
                {loading && !stats && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>}

                {stats && (
                    <>
                        {/* ADAY HAVUZU */}
                        <section className="space-y-2.5">
                            <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Uygun Aday Havuzu</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <StatCard icon={TrendingUp} label="Toplam Aday" value={formatN(adayTotal)} tint="bg-primary/10 text-primary" sub="vakıf + dernek" />
                                <StatCard icon={Landmark} label="Vakıf" value={formatN(vakif)} tint="bg-amber-500/10 text-amber-600" />
                                <StatCard icon={Heart} label="Dernek" value={formatN(dernek)} tint="bg-rose-500/10 text-rose-600" />
                                <StatCard icon={Mail} label="Ulaşılabilir" value={formatN(reachable)} tint="bg-emerald-500/10 text-emerald-600" sub="e-postası olan" />
                            </div>
                            <Link href="/super-admin/outreach" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary px-1">
                                Aday havuzunu aç (Outreach) <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                        </section>

                        {/* PIPELINE */}
                        <section className="space-y-2.5">
                            <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Süreç (Pipeline)</h2>
                            <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {pipeline.map((s, i) => {
                                        const filterable = s.status !== null;
                                        const isActive = filterable && statusFilter === s.status;
                                        return (
                                            <button
                                                key={s.label}
                                                type="button"
                                                disabled={!filterable}
                                                onClick={() => filterable && setStatusFilter((cur) => (cur === s.status ? null : s.status))}
                                                aria-pressed={isActive}
                                                title={filterable ? `${s.label} planlarını filtrele` : undefined}
                                                className={cn('text-center transition rounded-2xl p-0.5 -m-0.5',
                                                    filterable && 'active:scale-95',
                                                    !filterable && 'cursor-default',
                                                    isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-card')}>
                                                <div className={cn('rounded-2xl py-3', s.tint)}>
                                                    <p className="text-[18px] sm:text-[22px] font-black tabular-nums leading-none">{formatN(s.value)}</p>
                                                </div>
                                                <p className={cn('text-[10px] sm:text-[11px] mt-1.5 font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>{i + 1}. {s.label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                                    {statusFilter
                                        ? <>Filtre aktif: <span className="font-semibold text-foreground">{STATUS_LABEL[statusFilter] || statusFilter}</span> · tekrar tıkla = tümü.</>
                                        : <>Bir duruma dokun, aşağıdaki plan listesi o adıma göre filtrelensin.</>}
                                </p>
                            </div>
                        </section>

                        {/* GELEN PLANLAR */}
                        <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Gelen Reklam Planları</h2>
                                {platformPlans.length > 0 && (
                                    <span className="text-[12px] text-muted-foreground">
                                        {statusFilter ? `${visiblePlans.length} / ${platformPlans.length} plan` : `${platformPlans.length} plan`}
                                    </span>
                                )}
                            </div>
                            <div className="rounded-3xl bg-card border border-border/60 shadow-sm overflow-hidden">
                                {platformPlans.length === 0 ? (
                                    <div className="p-8 text-center space-y-2">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                            <Link2 className="h-6 w-6 text-muted-foreground" />
                                        </span>
                                        <p className="font-semibold text-[15px] text-foreground">Henüz gelen plan yok</p>
                                        <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                            STK'lar kendi panelinden &quot;Bunu Kur&quot; dedikçe planlar burada görünür; hangel ekibi (Faz 1&apos;e kadar MCC&apos;den) yayınlar.
                                        </p>
                                    </div>
                                ) : visiblePlans.length === 0 ? (
                                    <div className="p-8 text-center space-y-2">
                                        <p className="text-[13px] text-muted-foreground">
                                            <span className="font-semibold text-foreground">{STATUS_LABEL[statusFilter ?? ''] || statusFilter}</span> durumunda plan yok.
                                        </p>
                                        <button type="button" onClick={() => setStatusFilter(null)} className="text-[13px] font-semibold text-primary">Filtreyi temizle</button>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50 max-h-[28rem] overflow-y-auto">
                                        {visiblePlans.map((p) => (
                                            <PlanRow
                                                key={p.id}
                                                plan={p}
                                                expanded={expandedId === p.id}
                                                onToggle={() => setExpandedId((cur) => (cur === p.id ? null : p.id))}
                                                onChangeStatus={changeStatus}
                                                pending={pendingId === p.id}
                                                disabled={pendingId !== null}
                                                perf={p.status === 'active' ? perfByNgoId.get(p.ngoId) : undefined}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* GOOGLE REKLAM PERFORMANSI — yapılandırıldıysa aktif */}
                        {platform === 'google' && perfConfigured && (
                            <section className="space-y-2.5">
                                <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Reklam Performansı (Son 30 gün)</h2>
                                <div className="rounded-3xl bg-card border border-border/60 shadow-sm overflow-hidden">
                                    {perf.length === 0 ? (
                                        <div className="p-8 text-center space-y-2">
                                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                                            </span>
                                            <p className="font-semibold text-[15px] text-foreground">Henüz performans verisi yok</p>
                                            <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                                STK&apos;lar hesabını bağlayıp kampanya yayınladıkça gösterim/tıklama metrikleri burada görünür.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/50 max-h-[28rem] overflow-y-auto">
                                            {perf.map((m) => (
                                                <div key={m.ngoId} className="px-4 py-3 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><BarChart3 className="h-4 w-4" /></span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[14px] font-medium text-foreground truncate">{ngoNameById.get(m.ngoId) || m.ngoId}</p>
                                                            {m.customerId && <p className="text-[12px] text-muted-foreground truncate">Müşteri No: {m.customerId}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-12">
                                                        <PerfStat icon={Eye} label="Gösterim" value={formatN(m.impressions)} />
                                                        <PerfStat icon={MousePointerClick} label="Tıklama" value={formatN(m.clicks)} />
                                                        <PerfStat icon={Percent} label="CTR" value={formatCtr(m.ctr)} />
                                                        <PerfStat icon={Wallet} label="Harcama" value={formatCost(m.costMicros)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* META REKLAM PERFORMANSI — meta sekmesi seçiliyken */}
                        {platform === 'meta' && (
                            <section className="space-y-2.5">
                                <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Meta Reklam Performansı (Son 30 gün)</h2>
                                <div className="rounded-3xl bg-card border border-border/60 shadow-sm overflow-hidden">
                                    {metaLoading ? (
                                        <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
                                    ) : !metaConfigured ? (
                                        <div className="p-8 text-center space-y-2">
                                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                                <Plug className="h-6 w-6 text-muted-foreground" />
                                            </span>
                                            <p className="font-semibold text-[15px] text-foreground">Meta henüz yapılandırılmadı</p>
                                            <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                                Meta bağlantısı yapılandırılınca aktif olur; STK&apos;lar hesabını bağlayıp kampanya yayınladıkça metrikler burada görünür.
                                            </p>
                                        </div>
                                    ) : metaPerf.length === 0 ? (
                                        <div className="p-8 text-center space-y-2">
                                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                                            </span>
                                            <p className="font-semibold text-[15px] text-foreground">Henüz performans verisi yok</p>
                                            <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                                STK&apos;lar Meta hesabını bağlayıp kampanya yayınladıkça gösterim/tıklama metrikleri burada görünür.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/50 max-h-[28rem] overflow-y-auto">
                                            {metaPerf.map((m) => (
                                                <div key={m.ngoId} className="px-4 py-3 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><BarChart3 className="h-4 w-4" /></span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[14px] font-medium text-foreground truncate">{ngoNameById.get(m.ngoId) || m.ngoId}</p>
                                                            {m.adAccountId && <p className="text-[12px] text-muted-foreground truncate">Reklam Hesabı: {m.adAccountId}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-12">
                                                        <PerfStat icon={Eye} label="Gösterim" value={formatN(m.impressions)} />
                                                        <PerfStat icon={MousePointerClick} label="Tıklama" value={formatN(m.clicks)} />
                                                        <PerfStat icon={Percent} label="CTR" value={formatCtr(m.ctr)} />
                                                        <PerfStat icon={Wallet} label="Harcama" value={formatSpend(m.spend)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* TIKTOK REKLAM PERFORMANSI — tiktok sekmesi seçiliyken */}
                        {platform === 'tiktok' && (
                            <section className="space-y-2.5">
                                <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">TikTok Reklam Performansı (Son 30 gün)</h2>
                                <div className="rounded-3xl bg-card border border-border/60 shadow-sm overflow-hidden">
                                    {tiktokLoading ? (
                                        <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
                                    ) : !tiktokConfigured ? (
                                        <div className="p-8 text-center space-y-2">
                                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                                <Plug className="h-6 w-6 text-muted-foreground" />
                                            </span>
                                            <p className="font-semibold text-[15px] text-foreground">TikTok henüz yapılandırılmadı</p>
                                            <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                                TikTok bağlantısı yapılandırılınca aktif olur; STK&apos;lar hesabını bağlayıp kampanya yayınladıkça metrikler burada görünür.
                                            </p>
                                        </div>
                                    ) : tiktokPerf.length === 0 ? (
                                        <div className="p-8 text-center space-y-2">
                                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                                            </span>
                                            <p className="font-semibold text-[15px] text-foreground">Henüz performans verisi yok</p>
                                            <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                                STK&apos;lar TikTok hesabını bağlayıp kampanya yayınladıkça gösterim/tıklama metrikleri burada görünür.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/50 max-h-[28rem] overflow-y-auto">
                                            {tiktokPerf.map((m) => (
                                                <div key={m.ngoId} className="px-4 py-3 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><BarChart3 className="h-4 w-4" /></span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[14px] font-medium text-foreground truncate">{ngoNameById.get(m.ngoId) || m.ngoId}</p>
                                                            {m.advertiserId && <p className="text-[12px] text-muted-foreground truncate">Reklamveren No: {m.advertiserId}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-12">
                                                        <PerfStat icon={Eye} label="Gösterim" value={formatN(m.impressions)} />
                                                        <PerfStat icon={MousePointerClick} label="Tıklama" value={formatN(m.clicks)} />
                                                        <PerfStat icon={Percent} label="CTR" value={formatCtr(m.ctr)} />
                                                        <PerfStat icon={Wallet} label="Harcama" value={formatSpend(m.spend)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* FAZ 1 — yakında (performans yapılandırılınca yukarıdaki bölüm aktif olur) */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SoonCard icon={Sparkles} title="Toplu AI Reklam Yenileme" desc="Tüm STK'lar için kampanya metinlerini tek tıkla AI ile tazele." />
                            <SoonCard
                                icon={ShieldAlert}
                                title="Uyumluluk Uyarıları"
                                desc={perfConfigured
                                    ? 'CTR < %5 / askı riski olan hesapları otomatik işaretle.'
                                    : 'CTR < %5 / askı riski izleme — Google Ads bağlantısı yapılandırılınca aktif olur.'}
                            />
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

function AgencyPanel({ agency, loading, connecting, pendingCampaignId, onConnect, onRefresh, onChangeCampaignStatus }: {
    agency: AgencyResp | null;
    loading: boolean;
    connecting: boolean;
    pendingCampaignId: string | null;
    onConnect: () => void;
    onRefresh: () => void;
    onChangeCampaignStatus: (customerId: string, campaignResourceName: string, status: 'ENABLED' | 'PAUSED' | 'REMOVED') => void;
}) {
    return (
        <section className="rounded-3xl bg-gradient-to-br from-primary/[0.07] to-[#ff7a55]/[0.05] border border-primary/20 shadow-sm p-4 space-y-3.5">
            <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#ff7a55] shadow-[0_6px_16px_-6px_rgba(243,71,35,0.5)] shrink-0">
                    <Building2 className="h-5 w-5 text-white" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-bold text-foreground leading-tight">hangel Ajans (MCC)</h2>
                    <p className="text-[12px] text-muted-foreground">MCC altındaki tüm STK alt-hesaplarını ve kampanyalarını tek yerden yönet.</p>
                </div>
                {agency?.connected && (
                    <button onClick={onRefresh} disabled={loading} className="h-8 px-3 rounded-full bg-card border border-border/60 inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground active:scale-95 transition disabled:opacity-50" title="Yenile">
                        <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', loading && 'animate-spin')} />
                        Yenile
                    </button>
                )}
            </div>

            {loading && !agency ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !agency ? null : !agency.configured ? (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-amber-700 leading-relaxed">Google Ads yapılandırması bekleniyor.</p>
                </div>
            ) : !agency.connected ? (
                <div className="space-y-2.5">
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                        hangel MCC hesabını kendi Google OAuth&apos;u ile bağla; alt-hesaplar ve kampanyalar burada listelenir.
                    </p>
                    <button
                        type="button"
                        onClick={onConnect}
                        disabled={connecting}
                        className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 h-10 text-[13px] font-semibold shadow-sm active:scale-95 transition disabled:opacity-60 disabled:active:scale-100">
                        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                        hangel MCC hesabını bağla
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[13px] font-semibold text-foreground">
                            MCC: <span className="tabular-nums">{agency.mccCustomerId || '—'}</span>
                        </span>
                        <span className="text-[12px] text-muted-foreground">· {agency.accounts.length} alt-hesap</span>
                    </div>

                    {agency.accounts.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground text-center py-4">MCC altında alt-hesap bulunamadı.</p>
                    ) : (
                        <div className="space-y-3">
                            {agency.accounts.map((acc) => (
                                <div key={acc.customerId} className="rounded-2xl bg-card border border-border/60 shadow-sm p-3.5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[14px] font-semibold text-foreground truncate">{acc.name}</p>
                                            <p className="text-[11px] text-muted-foreground tabular-nums truncate">{acc.customerId}</p>
                                        </div>
                                        {acc.ngoId && (
                                            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold shrink-0">hangel STK</span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <PerfStat icon={Eye} label="Gösterim" value={formatN(acc.totals.impressions)} />
                                        <PerfStat icon={MousePointerClick} label="Tıklama" value={formatN(acc.totals.clicks)} />
                                        <PerfStat icon={Percent} label="CTR" value={formatAgencyCtr(acc.totals.ctr)} />
                                        <PerfStat icon={Wallet} label="Harcama" value={formatCost(acc.totals.costMicros)} />
                                    </div>

                                    {acc.campaigns.length === 0 ? (
                                        <p className="text-[12px] text-muted-foreground">Bu hesapta kampanya yok.</p>
                                    ) : (
                                        <div className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
                                            {acc.campaigns.map((c) => (
                                                <AgencyCampaignRow
                                                    key={c.resourceName}
                                                    campaign={c}
                                                    pending={pendingCampaignId === c.resourceName}
                                                    disabled={pendingCampaignId !== null}
                                                    onChangeStatus={(status) => onChangeCampaignStatus(acc.customerId, c.resourceName, status)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function AgencyCampaignRow({ campaign, pending, disabled, onChangeStatus }: {
    campaign: AgencyCampaign;
    pending: boolean;
    disabled: boolean;
    onChangeStatus: (status: 'ENABLED' | 'PAUSED' | 'REMOVED') => void;
}) {
    const removed = campaign.status === 'REMOVED';
    const tint = campaignStatusTint(campaign.status);
    return (
        <div className={cn('px-3 py-2.5 space-y-2 bg-card', removed && 'opacity-50')}>
            <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-foreground truncate min-w-0 flex-1">{campaign.name}</p>
                <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0', tint)}>{campaignStatusLabel(campaign.status)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <PerfStat icon={Eye} label="Gösterim" value={formatN(campaign.impressions)} />
                <PerfStat icon={MousePointerClick} label="Tıklama" value={formatN(campaign.clicks)} />
                <PerfStat icon={Percent} label="CTR" value={formatAgencyCtr(campaign.ctr)} />
                <PerfStat icon={Wallet} label="Harcama" value={formatCost(campaign.costMicros)} />
            </div>
            {!removed && (
                <div className="flex flex-wrap gap-2">
                    {campaign.status === 'ENABLED' ? (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onChangeStatus('PAUSED')}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-semibold bg-amber-500/10 text-amber-600 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                            Duraklat
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onChangeStatus('ENABLED')}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                            Etkinleştir
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onChangeStatus('REMOVED')}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-semibold bg-rose-500/10 text-rose-600 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Kaldır
                    </button>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, tint, sub }: { icon: React.ElementType; label: string; value: string; tint: string; sub?: string }) {
    return (
        <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-3">
            <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center', tint)}><Icon className="h-4 w-4" /></span>
                <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground truncate">{label}</p>
            </div>
            <p className="text-[22px] font-black tabular-nums leading-none">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
        </div>
    );
}

function PerfStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="rounded-xl bg-card border border-border/60 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground truncate">{label}</p>
            </div>
            <p className="text-[16px] font-black tabular-nums leading-none text-foreground">{value}</p>
        </div>
    );
}

function PlanRow({ plan, expanded, onToggle, onChangeStatus, pending, disabled, perf }: {
    plan: AdminPlan;
    expanded: boolean;
    onToggle: () => void;
    onChangeStatus: (planId: string, status: PlanStatus) => void;
    pending: boolean;
    disabled: boolean;
    perf?: PerfMetric;
}) {
    const actions = STATUS_ACTIONS[plan.status] ?? [];
    const tint = STATUS_TINT[plan.status] ?? 'bg-secondary text-muted-foreground';
    const keywords = plan.keywords?.slice(0, 5) ?? [];
    return (
        <div className="px-4 py-3">
            <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex items-center gap-3 w-full text-left active:opacity-70 transition">
                <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Megaphone className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground truncate">{plan.title}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{plan.ngoName || plan.ngoId} · {KIND_LABEL[plan.kind] || plan.kind}</p>
                </div>
                <span className={cn('text-[11px] rounded-full px-2.5 py-1 font-semibold shrink-0', tint)}>{STATUS_LABEL[plan.status] || plan.status}</span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-180')} />
            </button>

            {expanded && (
                <div className="mt-3 ml-12 space-y-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 gap-1.5 rounded-2xl bg-secondary/60 p-3">
                        <DetailItem icon={Hash} label="Tür">{KIND_LABEL[plan.kind] || plan.kind}</DetailItem>
                        {plan.goal && <DetailItem icon={Target} label="Hedef">{plan.goal}</DetailItem>}
                        {plan.landing && (
                            <DetailItem icon={ExternalLink} label="Sayfa">
                                <a href={plan.landing} target="_blank" rel="noopener noreferrer" className="text-primary font-medium break-all hover:underline">{plan.landing}</a>
                            </DetailItem>
                        )}
                        {typeof plan.estReach === 'number' && (
                            <DetailItem icon={Users} label="Tahmini Erişim">{formatN(plan.estReach)}</DetailItem>
                        )}
                        {keywords.length > 0 && (
                            <DetailItem icon={Hash} label="Anahtar Kelimeler">
                                <span className="flex flex-wrap gap-1">
                                    {keywords.map((k) => (
                                        <span key={k} className="text-[11px] rounded-full bg-card border border-border/60 px-2 py-0.5 text-foreground">{k}</span>
                                    ))}
                                </span>
                            </DetailItem>
                        )}
                    </div>

                    {perf && (
                        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 flex items-center gap-1.5">
                                <BarChart3 className="h-3.5 w-3.5" /> Performans (Son 30 gün)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <PerfStat icon={Eye} label="Gösterim" value={formatN(perf.impressions)} />
                                <PerfStat icon={MousePointerClick} label="Tıklama" value={formatN(perf.clicks)} />
                                <PerfStat icon={Percent} label="CTR" value={formatCtr(perf.ctr)} />
                                <PerfStat icon={Wallet} label="Harcama" value={formatCost(perf.costMicros)} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {actions.length > 0 && (
                <div className="mt-3 ml-12 flex flex-wrap gap-2">
                    {actions.map((a) => {
                        const Icon = a.icon;
                        return (
                            <button
                                key={a.to}
                                type="button"
                                disabled={disabled}
                                onClick={() => onChangeStatus(plan.id, a.to)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-3.5 h-8 text-[12px] font-semibold transition active:scale-95 disabled:opacity-50 disabled:active:scale-100',
                                    a.tone === 'primary' && 'bg-primary text-white shadow-sm',
                                    a.tone === 'danger' && 'bg-rose-500/10 text-rose-600',
                                    a.tone === 'neutral' && 'bg-secondary text-foreground',
                                )}>
                                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                                {a.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function DetailItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 text-[12px]">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground shrink-0 w-28">{label}</span>
            <span className="text-foreground min-w-0">{children}</span>
        </div>
    );
}

function SoonCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
    return (
        <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-4 space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></span>
                <p className="text-[14px] font-semibold text-foreground">{title}</p>
                <span className="text-[9px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground font-semibold ml-auto">Yakında</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}
