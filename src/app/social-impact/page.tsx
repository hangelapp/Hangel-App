
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';
import { useFirestore } from '@/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getAggregateFromServer,
    sum,
} from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

/**
 * Compact Turkish-friendly number formatter for the marketing hero stats.
 * 1_250_000 -> "1.2M+", 500_000 -> "500K+", 980 -> "980". Returns "" for
 * empty/zero so the stat element is hidden entirely (per user request:
 * "0 sa hiç rakam olmamalı").
 */
function formatCompactCount(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K+`;
    return value.toLocaleString('tr-TR');
}

/**
 * Currency-style compact formatter for the donation volume hero stat.
 * 12_500_000 -> "12.5M ₺", 8_400 -> "8K ₺". Returns "" when value is zero
 * so the donation stat is hidden entirely until there is real volume.
 */
function formatCompactCurrency(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ₺`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K ₺`;
    return `${value.toLocaleString('tr-TR')} ₺`;
}

const ImpactSection = ({ 
    title, 
    subtitle, 
    stat,
    description, 
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    stat?: string,
    description?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-[85vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {stat && <p className="text-5xl md:text-8xl font-black tracking-tighter text-primary mt-2">{stat}</p>}
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
        </div>
        
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover" 
                    data-ai-hint={imageHint}
                />
            </div>
        </div>
    </section>
);

export default function SocialImpactPage() {
    const router = useRouter();
    const cms = useWebPage('social-impact');
    const { t } = useTranslation();
    const db = useFirestore();

    // Live aggregated impact metrics. Each starts as null (loading) and resolves
    // to a real Firestore-derived number — or 0 when the backing data is empty.
    // Sources:
    //  - peopleReached: sum of ngos[].stats.peopleReached (server sum aggregate)
    //  - volunteerHours: sum of ngos[].stats.volunteerHours (server sum aggregate)
    //  - donationVolume: sum of parsed donationAmount across donations where
    //    type != 'income'. donationAmount is stored as a string, so a server-side
    //    sum() is not possible; we read the (filtered) collection and parse client-side.
    const [metrics, setMetrics] = React.useState<{
        peopleReached: number | null;
        volunteerHours: number | null;
        donationVolume: number | null;
    }>({ peopleReached: null, volunteerHours: null, donationVolume: null });

    React.useEffect(() => {
        if (!db) return;
        let cancelled = false;

        (async () => {
            // NGO numeric stat sums via server-side aggregation (1 read each, no
            // full-collection download).
            const ngoCol = collection(db, COLLECTIONS.ngos);
            const peopleReachedPromise = getAggregateFromServer(ngoCol, {
                total: sum('stats.peopleReached'),
            })
                .then((snap) => snap.data().total ?? 0)
                .catch(() => 0);
            const volunteerHoursPromise = getAggregateFromServer(ngoCol, {
                total: sum('stats.volunteerHours'),
            })
                .then((snap) => snap.data().total ?? 0)
                .catch(() => 0);

            // Donation volume: donationAmount is a string field, so we read the
            // expense donations and parse client-side (mirrors the admin analytics
            // page). Filtered server-side to exclude 'income' rows.
            const donationVolumePromise = getDocs(
                query(collection(db, COLLECTIONS.donations), where('type', '!=', 'income')),
            )
                .then((snap) =>
                    snap.docs.reduce((acc, d) => {
                        const raw = (d.data() as { donationAmount?: unknown }).donationAmount;
                        const n = parseFloat(String(raw ?? '0'));
                        return acc + (Number.isFinite(n) ? n : 0);
                    }, 0),
                )
                // The '!=' filter excludes docs missing the `type` field; fall back
                // to an unfiltered read so legacy rows without `type` still count.
                .catch(() =>
                    getDocs(collection(db, COLLECTIONS.donations))
                        .then((snap) =>
                            snap.docs.reduce((acc, d) => {
                                const data = d.data() as { donationAmount?: unknown; type?: unknown };
                                if (data.type === 'income') return acc;
                                const n = parseFloat(String(data.donationAmount ?? '0'));
                                return acc + (Number.isFinite(n) ? n : 0);
                            }, 0),
                        )
                        .catch(() => 0),
                );

            const [peopleReached, volunteerHours, donationVolume] = await Promise.all([
                peopleReachedPromise,
                volunteerHoursPromise,
                donationVolumePromise,
            ]);

            if (cancelled) return;
            setMetrics({ peopleReached, volunteerHours, donationVolume });
        })();

        return () => {
            cancelled = true;
        };
    }, [db]);

    // While loading (null) hide the stat entirely; show only when there's a
    // real positive value. Zero or null → stat omitted, section still renders
    // with title/subtitle (no fake numbers).
    const peopleReachedStat =
        metrics.peopleReached && metrics.peopleReached > 0
            ? formatCompactCount(metrics.peopleReached)
            : undefined;
    const donationVolumeStat =
        metrics.donationVolume && metrics.donationVolume > 0
            ? formatCompactCurrency(metrics.donationVolume)
            : undefined;
    const volunteerHoursStat =
        metrics.volunteerHours && metrics.volunteerHours > 0
            ? formatCompactCount(metrics.volunteerHours)
            : undefined;

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">{t('marketing.socialImpact.navLabel')}</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                        <Link href="/impact-story">{t('marketing.socialImpact.impactCta')}</Link>
                    </Button>
                </div>
            </header>

            {/* Total Reach */}
            <ImpactSection
                title={cms.title || t('marketing.socialImpact.heroTitleFallback')}
                stat={peopleReachedStat}
                subtitle={cms.subtitle || t('marketing.socialImpact.heroSubtitleFallback')}
                description={cms.description || t('marketing.socialImpact.heroDescriptionFallback')}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop'}
                imageHint="happy group people support"
            />

            {/* Donation Value */}
            <ImpactSection
                theme="dark"
                title={t('marketing.socialImpact.donationTitle')}
                stat={donationVolumeStat}
                subtitle={t('marketing.socialImpact.donationSubtitle')}
                description={t('marketing.socialImpact.donationDescription')}
                imageUrl="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop"
                imageHint="coins gold stack donation"
            />

            {/* Volunteer Hours */}
            <ImpactSection
                title={t('marketing.socialImpact.volunteerSecTitle')}
                stat={volunteerHoursStat}
                subtitle={t('marketing.socialImpact.volunteerSecSubtitle')}
                description={t('marketing.socialImpact.volunteerSecDescription')}
                imageUrl="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                imageHint="volunteers working together collaboration"
            />

            {/* SDG Goals */}
            <ImpactSection
                theme="dark"
                title={t('marketing.socialImpact.sdgTitle')}
                subtitle={t('marketing.socialImpact.sdgSubtitle')}
                description={t('marketing.socialImpact.sdgDescription')}
                imageUrl="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                imageHint="world connection data visualization"
            />

            <section className="py-24 bg-[#f5f5f7]">
                <div className="container mx-auto px-6 max-w-4xl space-y-12">
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">{t('marketing.socialImpact.reportsTitle')}</h2>
                        <p className="text-lg text-muted-foreground">{t('marketing.socialImpact.reportsDescription')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { year: '2026', link: '#' },
                            { year: '2025', link: '#' },
                            { year: '2024', link: '#' },
                        ].map((report) => (
                            <div key={report.year} className="flex flex-col items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border hover:border-primary transition-all">
                                <FileText className="h-10 w-10 text-primary" />
                                <div className="text-center">
                                    <h3 className="font-bold text-lg">{report.year} {t('marketing.socialImpact.reportLabel')}</h3>
                                    <p className="text-xs text-muted-foreground">{t('marketing.socialImpact.reportFileMeta')}</p>
                                </div>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={report.link}>{t('marketing.socialImpact.reportDownload')} <Download className="h-4 w-4 ml-2"/></Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel={t('marketing.socialImpact.footerLabel')} />
        </div>
    );
}
