
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Database, BookOpen } from 'lucide-react';
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
        <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[var(--sat)]">
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

interface ShowcaseSectionProps {
    title: string;
    subtitle: string;
    stat?: string;
    description: string;
    image: string;
    hint: string;
    theme?: 'light' | 'dark';
    className?: string;
}

const ShowcaseSection = ({ title, subtitle, stat, description, image, hint, theme = 'light', className }: ShowcaseSectionProps) => (
    <section className={cn(
        "relative min-h-screen flex flex-col items-center pt-32 text-center border-b border-border overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-card text-foreground",
        className
    )}>
        <div className="relative z-10 space-y-6 px-6 max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {stat && <p className="text-6xl md:text-9xl font-black tracking-tighter text-primary drop-shadow-2xl">{stat}</p>}
            <p className="text-lg sm:text-xl md:text-3xl font-medium opacity-90 leading-tight">{subtitle}</p>
            <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed font-medium">{description}</p>
        </div>
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl transition-transform duration-1000 hover:scale-[1.02]">
                <Image src={image} alt={title} fill className="object-cover" data-ai-hint={hint} />
            </div>
        </div>
    </section>
);

export default function AssociationWorkshopPage() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="workshop" />

            <ShowcaseSection
                className="pt-[calc(8rem+var(--sat))]"
                title={t('associationWorkshop.heroTitle')}
                stat="54"
                subtitle={t('associationWorkshop.heroSubtitle')}
                description={t('associationWorkshop.heroDesc')}
                image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                hint="diverse group of international students"
            />

            <section className="bg-muted py-32 border-b border-border">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <Database className="h-12 w-12 text-primary" />
                            <h2 className="text-4xl font-bold tracking-tight text-foreground">{t('associationWorkshop.bigDataTitle')}</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                                {t('associationWorkshop.bigDataDesc')}
                            </p>
                        </div>
                        <div className="p-10 bg-card rounded-[2.5rem] shadow-xl border border-border text-center">
                            <p className="text-8xl font-black tracking-tighter text-primary mb-2">632</p>
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('associationWorkshop.bigDataLabel')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <ShowcaseSection
                theme="dark"
                title={t('associationWorkshop.academicTitle')}
                stat="421"
                subtitle={t('associationWorkshop.academicSubtitle')}
                description={t('associationWorkshop.academicDesc')}
                image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
                hint="academic meeting discussion"
            />

            <section className="py-32 bg-background text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-16">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-foreground">{t('associationWorkshop.curriculumTitle')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                        <div className="p-10 bg-muted rounded-[2.5rem] space-y-4 group hover:bg-primary transition-colors">
                            <BookOpen className="h-8 w-8 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white">{t('associationWorkshop.yokTitle')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-white/80">{t('associationWorkshop.yokDesc')}</p>
                        </div>
                        <div className="p-10 bg-muted rounded-[2.5rem] space-y-4 group hover:bg-primary transition-colors">
                            <Rocket className="h-8 w-8 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white">{t('associationWorkshop.scienceTitle')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-white/80">{t('associationWorkshop.scienceDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel={t('association.navWorkshop')} />
        </div>
    );
}
