
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { volunteeringOpportunities } from '@/lib/data';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const CareerSection = ({ 
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
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-border",
        theme === 'dark' ? "bg-black text-white" : "bg-card text-foreground",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight">{title}</h2>
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

export default function CareersPage() {
    const router = useRouter();
    const cms = useWebPage('careers');
    const { t } = useTranslation();

    const hangelVolunteerOps = volunteeringOpportunities.filter(
        (op) => op.organization === 'hangel Derneği'
    );

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[var(--sat)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">{t('marketing.careers.navLabel')}</span>
                    <div className="w-24"></div>
                </div>
            </header>

            {/* Hero */}
            <CareerSection
                className="pt-[calc(6rem+var(--sat))]"
                title={cms.title || t('marketing.careers.heroTitle')}
                subtitle={cms.subtitle || t('marketing.careers.heroSubtitle')}
                description={cms.description || t('marketing.careers.heroDescription')}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'}
                imageHint="young professionals working happy"
            />

            {/* Values */}
            <CareerSection
                theme="dark"
                title={t('marketing.careers.valuesTitle')}
                subtitle={t('marketing.careers.valuesSubtitle')}
                description={t('marketing.careers.valuesDescription')}
                imageUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                imageHint="collaborative meeting brainstorming"
            />

            {/* Global Impact */}
            <CareerSection
                title={t('marketing.careers.globalTitle')}
                subtitle={t('marketing.careers.globalSubtitle')}
                description={t('marketing.careers.globalDescription')}
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students group study discussion"
            />

            <section className="py-24 bg-muted">
              <div className="container mx-auto px-6 max-w-4xl space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{t('marketing.careers.openPositionsTitle')}</h2>
                    <p className="text-lg text-muted-foreground">{t('marketing.careers.openPositionsDescription')}</p>
                </div>
                <div className="space-y-4">
                  {([
                    { tkey: 'frontend', locKey: 'locIstRemote', typeKey: 'typeFullTime' },
                    { tkey: 'community', locKey: 'locAnkara', typeKey: 'typeFullTime' },
                    { tkey: 'projectCoord', locKey: 'locIzmir', typeKey: 'typeFullTime' },
                    { tkey: 'businessDev', locKey: 'locIstanbul', typeKey: 'typeFullTime' },
                    { tkey: 'uiux', locKey: 'locRemote', typeKey: 'typeProject' },
                  ] as const).map((job) => {
                    const title = t(`marketing.careers.jobs.${job.tkey}`);
                    return (
                      <div key={job.tkey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card rounded-2xl shadow-sm border hover:border-primary transition-all">
                        <div>
                          <h3 className="font-bold text-lg">{title}</h3>
                          <p className="text-sm text-muted-foreground">{t('marketing.careers.jobOrg')} • {t(`marketing.careers.${job.locKey}`)} • {t(`marketing.careers.${job.typeKey}`)}</p>
                        </div>
                        <Button asChild className="shrink-0">
                          <a href={`mailto:kariyer@hangel.org?subject=${encodeURIComponent(t('marketing.careers.applySubjectPrefix') + title)}`}>{t('marketing.careers.applyCta')} <ChevronRight className="h-4 w-4 ml-2"/></a>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            
            <section className="py-24 bg-background">
              <div className="container mx-auto px-6 max-w-4xl space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{t('marketing.careers.volunteerTitle')}</h2>
                    <p className="text-lg text-muted-foreground">{t('marketing.careers.volunteerDescription')}</p>
                </div>
                <div className="space-y-4">
                  {hangelVolunteerOps.map((job) => (
                    <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card rounded-2xl shadow-sm border hover:border-primary transition-all">
                      <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.organization} • {job.location.city} • {job.commitment}</p>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link href={`/volunteering/${job.id}`}>{t('marketing.careers.applyCta')} <ChevronRight className="h-4 w-4 ml-2"/></Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <PublicFooter currentPageLabel={t('marketing.careers.footerLabel')} />
        </div>
    );
}
