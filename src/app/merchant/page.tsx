
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, 
    ArrowLeft
} from 'lucide-react';
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
    cta2,
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: {
    title: string,
    subtitle?: string,
    description?: string,
    cta1?: string,
    cta2?: string,
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-screen flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href="#" className="text-primary hover:underline flex items-center text-lg font-medium">
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
                <Link href="/login/selection?action=register&type=corporate" className="text-primary hover:underline flex items-center text-lg font-medium">
                    {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
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

export default function MerchantAdvantagesPage() {
    const router = useRouter();
    const cms = useWebPage('merchant');
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
                        <span className="hidden sm:inline">{t('marketing.merchant.navLabel')}</span>
                        <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                            <Link href="/login/selection?action=register&type=corporate">{t('marketing.merchant.applyCta')}</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <ProductSection
                title={cms.title || t('marketing.merchant.heroTitle')}
                subtitle={cms.subtitle || t('marketing.merchant.heroSubtitle')}
                description={cms.description || t('marketing.merchant.heroDescription')}
                cta1={t('marketing.merchant.sectionCta1Default')}
                cta2={t('marketing.merchant.sectionCta2Default')}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop'}
                imageHint="modern minimalist retail store interior"
            />

            {/* QR Payment Section */}
            <ProductSection
                theme="dark"
                title={t('marketing.merchant.qrTitle')}
                subtitle={t('marketing.merchant.qrSubtitle')}
                description={t('marketing.merchant.qrDescription')}
                cta1={t('marketing.merchant.sectionCta1Default')}
                cta2={t('marketing.merchant.sectionCta2Default')}
                imageUrl="https://images.unsplash.com/photo-1556742049-02e1f6c40b12?q=80&w=2070&auto=format&fit=crop"
                imageHint="smartphone scanning qr code checkout"
            />

            {/* Loyalty Section */}
            <ProductSection
                title={t('marketing.merchant.loyaltyTitle')}
                subtitle={t('marketing.merchant.loyaltySubtitle')}
                description={t('marketing.merchant.loyaltyDescription')}
                cta1={t('marketing.merchant.sectionCta1Default')}
                cta2={t('marketing.merchant.sectionCta2Default')}
                imageUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                imageHint="happy customer shopping in high end store"
            />

            {/* Management Section */}
            <ProductSection
                theme="dark"
                title={t('marketing.merchant.managementTitle')}
                subtitle={t('marketing.merchant.managementSubtitle')}
                description={t('marketing.merchant.managementDescription')}
                cta1={t('marketing.merchant.sectionCta1Default')}
                cta2={t('marketing.merchant.sectionCta2Default')}
                imageUrl="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                imageHint="sleek minimalist dashboard on tablet screen"
            />

            <PublicFooter currentPageLabel={t('marketing.merchant.footerLabel')} />
        </div>
    );
}
