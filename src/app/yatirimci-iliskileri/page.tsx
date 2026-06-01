
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const InvestorSection = ({ 
    title, 
    subtitle, 
    description, 
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
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

export default function InvestorRelationsPage() {
    const router = useRouter();
    const cms = useWebPage('yatirimci-iliskileri');
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">{t('investorPage.navLabel')}</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                        <Link href="/press">{t('investorPage.reports')}</Link>
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <InvestorSection
                title={cms.title || t('investorPage.heroTitle')}
                subtitle={cms.subtitle || t('investorPage.heroSubtitle')}
                description={cms.description || t('investorPage.heroDescription')}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop'}
                imageHint="abstract data stock market graph"
            />

            {/* Growth */}
            <InvestorSection
                theme="dark"
                title={t('investorPage.growthTitle')}
                subtitle={t('investorPage.growthSubtitle')}
                description={t('investorPage.growthDescription')}
                imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                imageHint="clean data visualization dashboard"
            />

            {/* Ethics */}
            <InvestorSection
                title={t('investorPage.ethicsTitle')}
                subtitle={t('investorPage.ethicsSubtitle')}
                description={t('investorPage.ethicsDescription')}
                imageUrl="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                imageHint="legal documents verify concept"
            />

            <PublicFooter currentPageLabel={t('investorPage.navLabel')} />
        </div>
    );
}

