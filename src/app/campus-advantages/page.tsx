
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    School, 
    Users, 
    Target, 
    Award, 
    Globe, 
    ChevronRight, 
    ArrowLeft,
    ShieldCheck,
    Briefcase,
    Sparkles,
    LayoutGrid,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const AdvantageCard = ({
    title,
    description,
    icon: Icon,
    className,
    isLarge = false,
    image
}: {
    title: string,
    description: string,
    icon: React.ComponentType<{ className?: string }>,
    className?: string,
    isLarge?: boolean,
    image?: string
}) => {
    const { t: tExploreT } = useTranslation();
    const tExplore = tExploreT('marketing.campus.exploreProgram');
    return (
    <div className={cn(
        "group relative flex flex-col bg-white rounded-[2.5rem] p-8 transition-all hover:shadow-2xl border border-black/5 overflow-hidden",
        isLarge ? "md:col-span-2 min-h-[450px] justify-between" : "min-h-[300px] justify-start",
        className
    )}>
        {image && (
            <div className="absolute inset-0 z-0">
                <Image src={image} alt={title} fill className="object-cover opacity-10 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>
        )}
        <div className="relative z-10">
            <div className={cn(
                "rounded-2xl flex items-center justify-center mb-6 transition-colors",
                isLarge ? "w-16 h-16 bg-primary/10 text-primary" : "w-12 h-12 bg-[#f5f5f7] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
                <Icon className={isLarge ? "h-8 w-8" : "h-6 w-6"} />
            </div>
            <div className="space-y-3">
                <h3 className={cn("font-bold tracking-tight text-[#1d1d1f]", isLarge ? "text-3xl md:text-4xl" : "text-xl")}>{title}</h3>
                <p className={cn("text-muted-foreground leading-relaxed font-medium", isLarge ? "text-lg md:text-xl max-w-md" : "text-sm")}>{description}</p>
            </div>
        </div>
        {isLarge && (
            <div className="relative z-10 pt-8">
                <span className="text-primary font-bold flex items-center text-sm md:text-base">
                    {tExplore} <ChevronRight className="h-4 w-4 ml-1" />
                </span>
            </div>
        )}
    </div>
    );
};

export default function CampusAdvantagesPage() {
    const router = useRouter();
    const cms = useWebPage('campus-advantages');
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30 pb-24">
            {/* Navigation */}
            <div className="container mx-auto px-4 pt-8">
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full hover:bg-white text-[#1d1d1f]">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('marketing.common.back')}
                </Button>
            </div>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-16 pb-20 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('marketing.campus.badge')}</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto">
                    {cms.title || t('marketing.campus.heroTitleFallback')}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    {cms.description || t('marketing.campus.heroDescriptionFallback')}
                </p>
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                        <Link href="/login/selection?action=register&type=corporate">{t('marketing.campus.registerCta')}</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full px-10 h-14 text-lg font-bold">
                        <Link href="/support">{t('marketing.campus.infoCta')}</Link>
                    </Button>
                </div>
            </section>

            {/* Main Advantages - Large Cards */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <AdvantageCard
                    isLarge
                    icon={LayoutGrid}
                    title={t('marketing.campus.advLargeDijitalTitle')}
                    description={t('marketing.campus.advLargeDijitalDesc')}
                    image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                />
                <AdvantageCard
                    isLarge
                    icon={Award}
                    title={t('marketing.campus.advLargeKarneTitle')}
                    description={t('marketing.campus.advLargeKarneDesc')}
                    image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop"
                />
                <AdvantageCard
                    isLarge
                    icon={Users}
                    title={t('marketing.campus.advLargeNetworkTitle')}
                    description={t('marketing.campus.advLargeNetworkDesc')}
                    image="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                />
                <AdvantageCard
                    isLarge
                    icon={Briefcase}
                    title={t('marketing.campus.advLargeKariyerTitle')}
                    description={t('marketing.campus.advLargeKariyerDesc')}
                    image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop"
                />
            </section>

            {/* Detailed Benefits Grid */}
            <section className="container mx-auto px-4 space-y-12">
                <div className="text-left md:text-center space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">{t('marketing.campus.toolsTitle')}</h2>
                    <p className="text-lg text-muted-foreground font-medium">{t('marketing.campus.toolsSubtitle')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AdvantageCard
                        icon={Globe}
                        title={t('marketing.campus.advWebTitle')}
                        description={t('marketing.campus.advWebDesc')}
                    />
                    <AdvantageCard
                        icon={Zap}
                        title={t('marketing.campus.advSponsorTitle')}
                        description={t('marketing.campus.advSponsorDesc')}
                    />
                    <AdvantageCard
                        icon={Target}
                        title={t('marketing.campus.advVisibilityTitle')}
                        description={t('marketing.campus.advVisibilityDesc')}
                    />
                    <AdvantageCard
                        icon={School}
                        title={t('marketing.campus.advAkademikTitle')}
                        description={t('marketing.campus.advAkademikDesc')}
                    />
                    <AdvantageCard
                        icon={Award}
                        title={t('marketing.campus.advSertifikaTitle')}
                        description={t('marketing.campus.advSertifikaDesc')}
                    />
                    <AdvantageCard
                        icon={ShieldCheck}
                        title={t('marketing.campus.advGuvenTitle')}
                        description={t('marketing.campus.advGuvenDesc')}
                    />
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-4 pt-24 pb-12">
                <div className="bg-[#1d1d1f] rounded-[3rem] p-12 text-center text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight relative z-10">{t('marketing.campus.ctaTitle')}</h2>
                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto relative z-10">
                        {t('marketing.campus.ctaDescription')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold">
                            <Link href="/login/selection?action=register&type=corporate">{t('marketing.common.applyNow')}</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="rounded-full px-12 h-14 text-lg font-bold">
                            <Link href="/support">{t('marketing.common.getSupport')}</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel={t('marketing.campus.footerLabel')} />
        </div>
    );
}
