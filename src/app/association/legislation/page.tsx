
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, CheckCircle2, ChevronRight, Landmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTranslation } from '@/components/providers/language-provider';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    const { t } = useTranslation();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('association.back')}
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                    <Link href="/association/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>{t('association.navAbout')}</Link>
                    <Link href="/association/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>{t('association.navEvents')}</Link>
                    <Link href="/association/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>{t('association.navWorkshop')}</Link>
                    <Link href="/association/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>{t('association.navLegislation')}</Link>
                </nav>
                <div className="w-20" />
            </div>
        </header>
    );
};

interface DetailSectionProps {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    hint: string;
    theme?: 'light' | 'dark';
}

const DetailSection = ({ title, subtitle, description, image, hint, theme = 'light' }: DetailSectionProps) => (
    <section className={cn(
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center border-b border-border overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-card text-foreground"
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-7xl font-bold tracking-tight leading-[1.1]">{title}</h2>
            <p className="text-lg sm:text-xl md:text-3xl font-medium opacity-90">{subtitle}</p>
            <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed font-medium">{description}</p>
        </div>
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl">
                <Image src={image} alt={title} fill className="object-cover" data-ai-hint={hint} />
            </div>
        </div>
    </section>
);

export default function AssociationLegislationPage() {
    const { t } = useTranslation();

    const draftItems = [
        { title: t('associationLegislation.draftItem1Title'), desc: t('associationLegislation.draftItem1Desc') },
        { title: t('associationLegislation.draftItem2Title'), desc: t('associationLegislation.draftItem2Desc') },
        { title: t('associationLegislation.draftItem3Title'), desc: t('associationLegislation.draftItem3Desc') },
        { title: t('associationLegislation.draftItem4Title'), desc: t('associationLegislation.draftItem4Desc') },
        { title: t('associationLegislation.draftItem5Title'), desc: t('associationLegislation.draftItem5Desc') },
    ];

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="legislation" />

            <DetailSection
                title={t('associationLegislation.heroTitle')}
                subtitle={t('associationLegislation.heroSubtitle')}
                description={t('associationLegislation.heroDesc')}
                image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                hint="legal documents verify concept"
            />

            <section className="py-32 bg-black text-white text-center">
                <div className="container mx-auto px-6 max-w-5xl space-y-16">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">{t('associationLegislation.employmentTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <ShieldCheck className="h-12 w-12 text-primary" />
                            <h3 className="text-2xl font-bold">{t('associationLegislation.employmentCard1Title')}</h3>
                            <p className="text-white/70 leading-relaxed font-medium">{t('associationLegislation.employmentCard1Desc')}</p>
                        </div>
                        <div className="space-y-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <CheckCircle2 className="h-12 w-12 text-primary" />
                            <h3 className="text-2xl font-bold">{t('associationLegislation.employmentCard2Title')}</h3>
                            <p className="text-white/70 leading-relaxed font-medium">{t('associationLegislation.employmentCard2Desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-32 bg-muted border-b border-border">
                <div className="container mx-auto px-6 max-w-4xl text-center space-y-12">
                    <div className="space-y-2">
                        <Landmark className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{t('associationLegislation.draftTitle')}</h2>
                        <p className="text-lg text-muted-foreground font-medium">{t('associationLegislation.draftSubtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {draftItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-8 bg-card rounded-[2rem] shadow-sm border border-border hover:border-primary transition-all group text-left">
                                <div className="space-y-1 min-w-0">
                                    <span className="font-bold text-xl text-foreground">{item.title}</span>
                                    <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                                </div>
                                <ChevronRight className="h-6 w-6 shrink-0 text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-32 bg-background text-center">
                <div className="container mx-auto px-6 max-w-2xl space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">{t('associationLegislation.partnershipTitle')}</h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                        {t('associationLegislation.partnershipDesc')}
                    </p>
                    <Button asChild size="lg" className="rounded-full px-10 font-bold shadow-xl shadow-primary/20">
                        <Link href="/support">{t('associationLegislation.contactCta')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
            </section>

            <PublicFooter currentPageLabel={t('association.navLegislation')} />
        </div>
    );
}
