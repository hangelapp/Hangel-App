'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const ProductSection = ({
    title,
    subtitle,
    description,
    cta1,
    cta1Href,
    cta2,
    cta2Href,
    theme = 'light',
    imageUrl,
    imageHint,
    className,
}: {
    title: string;
    subtitle?: string;
    description?: string;
    cta1?: string;
    cta1Href?: string;
    cta2?: string;
    cta2Href?: string;
    theme?: 'light' | 'dark';
    imageUrl: string;
    imageHint: string;
    className?: string;
}) => (
    <section className={cn(
        'relative min-h-screen flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5',
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-[#1d1d1f]',
        className,
    )}>
        <div className="relative z-10 space-y-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}

            <div className="flex items-center justify-center gap-6 pt-4">
                {cta1 && cta1Href && (
                    <Link href={cta1Href} className="text-primary hover:underline flex items-center text-lg font-medium">
                        {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
                {cta2 && cta2Href && (
                    <Link href={cta2Href} className="text-primary hover:underline flex items-center text-lg font-medium">
                        {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>

        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
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

export default function LibraryAboutPage() {
    const router = useRouter();
    const cms = useWebPage('library');
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <div className="flex items-center gap-6 text-[12px] font-medium text-[#1d1d1f]/80">
                        <span className="hidden sm:inline">{t('marketing.library.navLabel')}</span>
                        <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                            <Link href="/library">{t('marketing.library.exploreCta')}</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero — dijital + geleneksel kütüphanenin birleşimi */}
            <ProductSection
                title={cms.title || t('marketing.library.heroTitle')}
                subtitle={cms.subtitle || t('marketing.library.heroSubtitle')}
                description={cms.description || t('marketing.library.heroDescription')}
                cta1={t('marketing.library.sectionCta1')}
                cta1Href="/library"
                cta2={t('marketing.library.sectionCta2')}
                cta2Href="/library"
                imageUrl={cms.heroImageUrl || '/discovery/library.png'}
                imageHint="digital and traditional library merging, glowing screens among classic bookshelves"
            />

            {/* AI assistants */}
            <ProductSection
                theme="dark"
                title={t('marketing.library.aiTitle')}
                subtitle={t('marketing.library.aiSubtitle')}
                description={t('marketing.library.aiDescription')}
                cta1={t('marketing.library.sectionCta1')}
                cta1Href="/library"
                imageUrl="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop"
                imageHint="person reading with tablet and books, warm light"
            />

            {/* Open data */}
            <ProductSection
                title={t('marketing.library.dataTitle')}
                subtitle={t('marketing.library.dataSubtitle')}
                description={t('marketing.library.dataDescription')}
                cta1={t('marketing.library.sectionCta1')}
                cta1Href="/library"
                imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                imageHint="data dashboards and analytics on screen"
            />

            {/* Yakında */}
            <ProductSection
                theme="dark"
                title={t('marketing.library.soonTitle')}
                subtitle={t('marketing.library.soonSubtitle')}
                description={t('marketing.library.soonDescription')}
                cta1={t('marketing.library.sectionCta2')}
                cta1Href="/library"
                imageUrl="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2076&auto=format&fit=crop"
                imageHint="cozy modern library with people learning"
            />

            <PublicFooter currentPageLabel={t('marketing.library.footerLabel')} />
        </div>
    );
}
