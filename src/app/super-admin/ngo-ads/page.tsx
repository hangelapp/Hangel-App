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
    TrendingUp, Sparkles, ShieldAlert, RefreshCw,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

interface StatsResp {
    byCollection: { registryVakiflar: number; registryDernekler: number; outreachContacts: number };
    categories: Record<string, { total: number; email?: number }>;
}

const PLATFORMS = [
    { key: 'google', label: 'Google Ads', active: true },
    { key: 'meta', label: 'Meta', active: false },
    { key: 'tiktok', label: 'TikTok', active: false },
] as const;

function formatN(n: number): string { return n.toLocaleString('tr-TR'); }

export default function NgoAdsAdminPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<StatsResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'google' | 'meta' | 'tiktok'>('google');

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/super-admin/outreach/stats', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || 'Veriler yüklenemedi');
            setStats(await res.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Hata');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const vakif = stats?.byCollection.registryVakiflar ?? 0;
    const dernek = stats?.byCollection.registryDernekler ?? 0;
    const adayTotal = vakif + dernek;
    const reachable = (stats?.categories?.vakif?.email ?? 0) + (stats?.categories?.dernek?.email ?? 0);

    const pipeline = [
        { label: 'Aday', value: adayTotal, tint: 'bg-primary/10 text-primary' },
        { label: 'Başvurdu', value: 0, tint: 'bg-blue-500/10 text-blue-600' },
        { label: 'Onaylandı', value: 0, tint: 'bg-violet-500/10 text-violet-600' },
        { label: 'Bağlı', value: 0, tint: 'bg-amber-500/10 text-amber-600' },
        { label: 'Aktif', value: 0, tint: 'bg-emerald-500/10 text-emerald-600' },
    ];

    return (
        <div className="min-h-dvh bg-[#f5f5f7]">
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
                                    {pipeline.map((s, i) => (
                                        <div key={s.label} className="text-center">
                                            <div className={cn('rounded-2xl py-3', s.tint)}>
                                                <p className="text-[18px] sm:text-[22px] font-black tabular-nums leading-none">{formatN(s.value)}</p>
                                            </div>
                                            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1.5 font-medium">{i + 1}. {s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                                    Başvuru ve bağlama adımları, STK'lar panelden ilerledikçe ve Google Ads API bağlandıkça (Faz 1) dolar.
                                </p>
                            </div>
                        </section>

                        {/* BAĞLI HESAPLAR */}
                        <section className="space-y-2.5">
                            <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Bağlı Reklam Hesapları</h2>
                            <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-8 text-center space-y-2">
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary mx-auto">
                                    <Link2 className="h-6 w-6 text-muted-foreground" />
                                </span>
                                <p className="font-semibold text-[15px] text-foreground">Henüz bağlı hesap yok</p>
                                <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                                    STK'lar kendi panelinden Google reklam hakkına başvurup hesaplarını bağladıkça (Faz 1) burada listelenecek; uyumluluk durumları ve aylık kullanım buradan izlenecek.
                                </p>
                            </div>
                        </section>

                        {/* FAZ 1 — yakında */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SoonCard icon={Sparkles} title="Toplu AI Reklam Yenileme" desc="Tüm STK'lar için kampanya metinlerini tek tıkla AI ile tazele." />
                            <SoonCard icon={ShieldAlert} title="Uyumluluk Uyarıları" desc="CTR < %5 / askı riski olan hesapları otomatik işaretle." />
                        </section>
                    </>
                )}
            </div>
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
