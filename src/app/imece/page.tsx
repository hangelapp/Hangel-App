'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, HeartHandshake, Award, Clock, Users, Sparkles, ShieldCheck, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

const ImpactSection = ({ title, subtitle, description, theme = 'light', className, children, id }: { title: string; subtitle?: string; description?: string; theme?: 'light' | 'dark'; className?: string; children?: React.ReactNode; id?: string }) => (
  <section id={id} className={cn(
    'relative min-h-[80vh] flex flex-col items-center justify-center pt-[calc(6rem+env(safe-area-inset-top))] pb-16 text-center overflow-hidden border-b border-black/5',
    theme === 'dark' ? 'bg-[#042654] text-white' : 'bg-white text-[#1d1d1f]',
    className,
  )}>
    <div className="relative z-10 space-y-4 px-6 max-w-4xl">
      {subtitle && <p className={cn('text-xl md:text-2xl font-semibold opacity-90 tracking-tight', theme === 'dark' ? 'text-[#00A8E8]' : 'text-primary')}>{subtitle}</p>}
      <h2 className="text-3xl md:text-6xl font-bold tracking-tight leading-tight">{title}</h2>
      {description && <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>}
    </div>
    {children && <div className="w-full mt-10">{children}</div>}
  </section>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) => (
  <div className="bg-white rounded-3xl p-8 flex flex-col gap-3 text-left shadow-sm border border-black/5 h-full">
    <div className="p-3 bg-primary/10 rounded-2xl w-fit">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ step, title, description }: { step: number | string; title: string; description: string }) => (
  <div className="relative bg-[#0c3168] rounded-3xl p-8 text-left">
    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg">
      {step}
    </div>
    <h3 className="font-bold text-xl text-white mt-2">{title}</h3>
    <p className="text-sm text-white/70 mt-3 leading-relaxed">{description}</p>
  </div>
);

export default function ImecePage() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label={t('marketing.imece.headerBack')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="font-black text-primary">hangel</p>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/volunteering">{t('marketing.imece.headerCta')} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main>
        <ImpactSection
          theme="dark"
          subtitle={t('marketing.imece.heroSubtitle')}
          title={t('marketing.imece.heroTitle')}
          description={t('marketing.imece.heroDescription')}
        />

        <section className="bg-[#f5f5f7] py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('marketing.imece.howTitle')}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('marketing.imece.howDescription')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StepCard step="1" title={t('marketing.imece.step1Title')} description={t('marketing.imece.step1Desc')} />
              <StepCard step="2" title={t('marketing.imece.step2Title')} description={t('marketing.imece.step2Desc')} />
              <StepCard step="3" title={t('marketing.imece.step3Title')} description={t('marketing.imece.step3Desc')} />
              <StepCard step="4" title={t('marketing.imece.step4Title')} description={t('marketing.imece.step4Desc')} />
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('marketing.imece.differenceTitle')}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('marketing.imece.differenceDescription')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Sparkles}
                title={t('marketing.imece.featMatchTitle')}
                description={t('marketing.imece.featMatchDesc')}
              />
              <FeatureCard
                icon={Award}
                title={t('marketing.imece.featPointsTitle')}
                description={t('marketing.imece.featPointsDesc')}
              />
              <FeatureCard
                icon={Clock}
                title={t('marketing.imece.featFlexTitle')}
                description={t('marketing.imece.featFlexDesc')}
              />
              <FeatureCard
                icon={Users}
                title={t('marketing.imece.featCommunityTitle')}
                description={t('marketing.imece.featCommunityDesc')}
              />
              <FeatureCard
                icon={ShieldCheck}
                title={t('marketing.imece.featTransparencyTitle')}
                description={t('marketing.imece.featTransparencyDesc')}
              />
              <FeatureCard
                icon={Briefcase}
                title={t('marketing.imece.featCvTitle')}
                description={t('marketing.imece.featCvDesc')}
              />
            </div>
          </div>
        </section>

        <section className="bg-[#042654] text-white py-20 md:py-32">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
            <HeartHandshake className="h-12 w-12 mx-auto text-[#00A8E8]" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{t('marketing.imece.ctaTitle')}</h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              {t('marketing.imece.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg" className="rounded-full px-8 h-14 font-bold text-lg shadow-2xl shadow-primary/30">
                <Link href="/login/selection?action=register">{t('marketing.imece.ctaVolunteer')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-lg bg-transparent border-white/30 text-white hover:bg-white hover:text-[#042654]">
                <Link href="/volunteering">{t('marketing.imece.ctaExplore')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter currentPageLabel={t('marketing.imece.footerLabel')} />
    </div>
  );
}
