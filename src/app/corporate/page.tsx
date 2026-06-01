
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
    cta1Href = "#",
    cta2, 
    cta2Href,
    theme = 'light',
    imageUrl,
    imageHint,
    id,
    className
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    cta1?: string, 
    cta1Href?: string,
    cta2?: string, 
    cta2Href?: string,
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    id?: string;
    className?: string
}) => (
    <section id={id} className={cn(
        "relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                {cta1 && (
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

export default function CorporateShowcasePage() {
    const router = useRouter();
    const cms = useWebPage('corporate');
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Header / Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <div className="flex items-center gap-6 text-[12px] font-medium text-[#1d1d1f]/80">
                        <span className="hidden sm:inline">{t('corporatePage.navLabel')}</span>
                        <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                            <Link href="/login/selection?action=register&type=corporate">{t('corporatePage.joinCta')}</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <ProductSection
                title={cms.title || t('corporatePage.heroTitle')}
                subtitle={cms.subtitle || t('corporatePage.heroSubtitle')}
                description={cms.description || t('corporatePage.heroDescription')}
                cta1={t('corporatePage.heroCta1')}
                cta1Href="/contact"
                cta2={t('corporatePage.heroCta2')}
                cta2Href="#universiteler"
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop'}
                imageHint="corporate team working"
            />

            {/* Üniversiteler için */}
            <ProductSection
                id="universiteler"
                theme="dark"
                title={t('corporatePage.uniTitle')}
                subtitle={t('corporatePage.uniSubtitle')}
                description={t('corporatePage.uniDescription')}
                cta1={t('corporatePage.uniCta1')}
                cta1Href="/campus-advantages"
                cta2={t('corporatePage.uniCta2')}
                cta2Href="/contact"
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="university students collaborating"
            />

            {/* Liseler için */}
            <ProductSection
                title={t('corporatePage.highSchoolTitle')}
                subtitle={t('corporatePage.highSchoolSubtitle')}
                description={t('corporatePage.highSchoolDescription')}
                cta1={t('corporatePage.uniCta1')}
                cta1Href="/campus-advantages"
                cta2={t('corporatePage.contactCta')}
                cta2Href="/support"
                imageUrl="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
                imageHint="high school students classroom"
            />

            {/* Belediyeler için */}
            <ProductSection
                theme="dark"
                title={t('corporatePage.muniTitle')}
                subtitle={t('corporatePage.muniSubtitle')}
                description={t('corporatePage.muniDescription')}
                cta1={t('corporatePage.muniCta1')}
                cta1Href="/contact"
                cta2={t('corporatePage.muniCta2')}
                cta2Href="/contact"
                imageUrl="https://images.unsplash.com/photo-1577086664693-894d8405334a?q=80&w=2071&auto=format&fit=crop"
                imageHint="modern city hall building architecture"
            />

            {/* Hükümetler için */}
            <ProductSection
                title={t('corporatePage.govTitle')}
                subtitle={t('corporatePage.govSubtitle')}
                description={t('corporatePage.govDescription')}
                cta1={t('corporatePage.govCta1')}
                cta1Href="/hangelassociation/projects/etki-atlasi"
                cta2={t('corporatePage.govCta2')}
                cta2Href="/support"
                imageUrl="https://images.unsplash.com/photo-1561574564-8a5f8b7a6fae?q=80&w=2070&auto=format&fit=crop"
                imageHint="government building flag"
            />

            {/* Bakanlıklar için */}
            <ProductSection
                theme="dark"
                title={t('corporatePage.ministryTitle')}
                subtitle={t('corporatePage.ministrySubtitle')}
                description={t('corporatePage.ministryDescription')}
                cta1={t('corporatePage.ministryCta1')}
                cta1Href="/hangelassociation/legislation"
                cta2={t('corporatePage.contactCta')}
                cta2Href="/support"
                imageUrl="https://images.unsplash.com/photo-1589943534882-620436d41c97?q=80&w=2070&auto=format&fit=crop"
                imageHint="official meeting government"
            />

            <PublicFooter currentPageLabel={t('corporatePage.navLabel')} />
        </div>
    );
}

