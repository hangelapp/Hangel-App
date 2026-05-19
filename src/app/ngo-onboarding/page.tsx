

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, 
    HeartHandshake, 
    HandCoins, 
    BarChart3, 
    Users, 
    QrCode, 
    Globe, 
    MessageSquare, 
    Mail, 
    Megaphone, 
    Calendar, 
    Video, 
    Palette, 
    CreditCard, 
    Target, 
    Calculator, 
    Database, 
    PhoneCall, 
    Building2, 
    GraduationCap, 
    MapPin, 
    MessageCircle, 
    ShoppingCart,
    ChevronRight,
    ArrowLeft,
    Sparkles,
    Briefcase,
    Network,
    LineChart,
    type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Badge } from '@/components/ui/badge';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const AdvantageCard = ({
  category,
  title,
  description,
  imageUrl,
  imageHint,
  link
}: {
  category: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  link: { label: string, href: string };
}) => (
  <div className="bg-white rounded-[1.75rem] h-full flex flex-col text-left overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-black/5">
    <div className="relative aspect-[16/10] w-full overflow-hidden">
      <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={imageHint} />
    </div>
    <div className="p-6 flex flex-col flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</p>
      <h3 className="text-xl font-bold mt-1 text-foreground leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground/90 mt-2 flex-1 leading-relaxed">{description}</p>
      <div className="mt-6 pt-4 border-t border-black/5">
        <Link href={link.href} className="text-sm text-primary hover:underline flex items-center font-semibold">
          {link.label}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  </div>
);


// New component for the large feature cards
const FeatureShowcaseCard = ({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) => {
  const { t } = useTranslation();
  return (
  <div className="group relative bg-white rounded-[2.5rem] p-8 md:p-12 transition-all hover:shadow-2xl border border-black/5 overflow-hidden flex flex-col justify-between min-h-[450px]">
    <div className="relative z-10">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white border shadow-sm">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-md">{description}</p>
      </div>
    </div>
    <div className="relative z-10 pt-8">
      <span className="text-primary font-bold flex items-center text-base opacity-70 group-hover:opacity-100 transition-opacity">
        {t('marketing.ngoOnboarding.moreInfoInline')} <ChevronRight className="h-4 w-4 ml-1" />
      </span>
    </div>
  </div>
  );
};


// New component for smaller feature items
const ToolGridItem = ({ icon: Icon, title, description, tag, href }: { icon: LucideIcon, title: string, description: string, tag?: string, href: string }) => (
    <Link href={href} className="group block h-full">
        <div className="relative flex flex-col items-center text-center gap-4 p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all h-full">
            {tag && (
                <Badge className="absolute -top-2 right-4">{tag}</Badge>
            )}
            <div className="p-4 bg-[#f5f5f7] rounded-2xl text-primary">
                <Icon className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{description}</p>
        </div>
    </Link>
);

export default function NgoOnboardingPage() {
    const router = useRouter();
    const cms = useWebPage('ngo-onboarding');
    const { t } = useTranslation();
    const plugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    // P2-5f: text fields resolved via `marketing.ngoOnboarding.advantages.<key>.*` keys;
    // image/href stay in-code (structural).
    const advantageItems = [
        {
            tkey: 'dijital',
            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'data analytics dashboard',
            href: '/ngo-admin/dashboard',
        },
        {
            tkey: 'kaynak',
            imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'contactless payment store',
            href: '/market',
        },
        {
            tkey: 'gonullu',
            imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'volunteers working',
            href: '/ngo-admin/volunteer',
        },
        {
            tkey: 'seffaflik',
            imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'person reviewing document',
            href: '/ngo-admin/transparency',
        },
        {
            tkey: 'demografi',
            imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=2076&auto=format&fit=crop',
            imageHint: 'world map data connection',
            href: '/ngo-admin/demographics',
        },
    ] as const;

    const mainFeatures = [
        {
            icon: ShieldCheck,
            title: t('marketing.ngoOnboarding.mainFeatTransparencyTitle'),
            description: t('marketing.ngoOnboarding.mainFeatTransparencyDesc'),
        },
        {
            icon: HeartHandshake,
            title: t('marketing.ngoOnboarding.mainFeatVolunteerTitle'),
            description: t('marketing.ngoOnboarding.mainFeatVolunteerDesc'),
        },
        {
            icon: HandCoins,
            title: t('marketing.ngoOnboarding.mainFeatDonationTitle'),
            description: t('marketing.ngoOnboarding.mainFeatDonationDesc'),
        },
        {
            icon: BarChart3,
            title: t('marketing.ngoOnboarding.mainFeatDemoTitle'),
            description: t('marketing.ngoOnboarding.mainFeatDemoDesc'),
        }
    ];

    // P2-5f: tool list i18n via `marketing.ngoOnboarding.tools.<key>.{title,description}`.
    // `tagKey` ∈ {'new','beta'} → resolved to `marketing.ngoOnboarding.tag{New,Beta}`.
    const toolsetFeatures: ReadonlyArray<{ href: string; icon: LucideIcon; tkey: string; tagKey?: 'new' | 'beta' }> = [
        { href: '/ngo-admin/users', icon: Users, tkey: 'users' },
        { href: '/ngo-admin/qr', icon: QrCode, tkey: 'qr' },
        { href: '/ngo-admin/website', icon: Globe, tkey: 'website' },
        { href: '/ngo-admin/sms', icon: MessageSquare, tkey: 'sms' },
        { href: '/ngo-admin/mail', icon: Mail, tkey: 'mail' },
        { href: '/ngo-admin/ads', icon: Megaphone, tkey: 'ads', tagKey: 'new' },
        { href: '/ngo-admin/events', icon: Calendar, tkey: 'events' },
        { href: '/ngo-admin/online-meeting', icon: Video, tkey: 'onlineMeeting' },
        { href: '/ngo-admin/design-tools', icon: Palette, tkey: 'designTools' },
        { href: '/ngo-admin/payment-systems', icon: CreditCard, tkey: 'paymentSystems' },
        { href: '/ngo-admin/marketing', icon: Target, tkey: 'marketing' },
        { href: '/ngo-admin/accounting', icon: Calculator, tkey: 'accounting', tagKey: 'beta' },
        { href: '/ngo-admin/crm', icon: Database, tkey: 'crm' },
        { href: '/ngo-admin/virtual-pbx', icon: PhoneCall, tkey: 'virtualPbx' },
        { href: '/ngo-admin/virtual-office', icon: Building2, tkey: 'virtualOffice' },
        { href: '/ngo-admin/university-volunteering', icon: GraduationCap, tkey: 'universityVolunteering' },
        { href: '/ngo-admin/field-team', icon: MapPin, tkey: 'fieldTeam', tagKey: 'new' },
        { href: '/ngo-admin/dm', icon: MessageCircle, tkey: 'dm' },
        { href: '/ngo-admin/ecommerce', icon: ShoppingCart, tkey: 'ecommerce' },
        { href: '/ngo-admin/hr-integration', icon: Briefcase, tkey: 'hrIntegration' },
        { href: '/ngo-admin/volunteer-portal', icon: Network, tkey: 'volunteerPortal' },
        { href: '/ngo-admin/analytics-tools', icon: LineChart, tkey: 'analyticsTools' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">{t('marketing.ngoOnboarding.navLabel')}</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                        <Link href="/login/selection?action=register&type=corporate">{t('marketing.ngoOnboarding.applyCta')}</Link>
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-32 pb-16 text-center space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">{t('marketing.ngoOnboarding.heroBadge')}</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                    {cms.title || t('marketing.ngoOnboarding.heroTitleFallback')}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-4xl mx-auto leading-relaxed">
                    {cms.description || t('marketing.ngoOnboarding.heroDescriptionFallback')}
                </p>
                <div className="pt-8 flex flex-col items-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                        <Link href="/login/selection?action=register&type=corporate">{t('marketing.ngoOnboarding.freeApplyCta')}</Link>
                    </Button>
                </div>
            </section>
            
            <section className="py-20 bg-[#f5f5f7] border-y">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">{t('marketing.ngoOnboarding.whyTitle')}</h2>
                        <p className="text-muted-foreground">{t('marketing.ngoOnboarding.whyDescription')}</p>
                    </div>
                    <Carousel
                        plugins={[plugin.current]}
                        opts={{ align: "start" }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-6">
                            {advantageItems.map((item, index) => (
                                <CarouselItem key={index} className="pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
                                    <div className="h-full">
                                        <AdvantageCard
                                            category={t(`marketing.ngoOnboarding.advantages.${item.tkey}.category`)}
                                            title={t(`marketing.ngoOnboarding.advantages.${item.tkey}.title`)}
                                            description={t(`marketing.ngoOnboarding.advantages.${item.tkey}.description`)}
                                            imageUrl={item.imageUrl}
                                            imageHint={item.imageHint}
                                            link={{ label: t(`marketing.ngoOnboarding.advantages.${item.tkey}.linkLabel`), href: item.href }}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="hidden md:flex justify-end gap-2 mt-8 px-6">
                            <CarouselPrevious className="static translate-y-0 h-12 w-12 border-black/10" />
                            <CarouselNext className="static translate-y-0 h-12 w-12 border-black/10" />
                        </div>
                    </Carousel>
                </div>
            </section>


            {/* Main Features Grid */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 my-24 bg-white">
                {mainFeatures.map(feature => <FeatureShowcaseCard key={feature.title} {...feature} />)}
            </section>

            {/* Toolset Section */}
            <section className="container mx-auto px-4 space-y-16">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{t('marketing.ngoOnboarding.toolsetTitle')}</h2>
                    <p className="text-lg text-muted-foreground font-medium">{t('marketing.ngoOnboarding.toolsetSubtitle')}</p>
                     <p className="text-base text-muted-foreground max-w-2xl mx-auto">{t('marketing.ngoOnboarding.toolsetDescription')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {toolsetFeatures.map(tool => (
                        <ToolGridItem
                            key={tool.tkey}
                            href={tool.href}
                            icon={tool.icon}
                            title={t(`marketing.ngoOnboarding.tools.${tool.tkey}.title`)}
                            description={t(`marketing.ngoOnboarding.tools.${tool.tkey}.description`)}
                            tag={tool.tagKey ? t(`marketing.ngoOnboarding.tag${tool.tagKey === 'new' ? 'New' : 'Beta'}`) : undefined}
                        />
                    ))}
                </div>
            </section>

             {/* Become a Partner CTA */}
            <section className="container mx-auto px-4 pt-24">
                <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] p-12 text-center space-y-8">
                    <Sparkles className="h-12 w-12 text-primary mx-auto" />
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight relative z-10">{t('marketing.ngoOnboarding.partnerTitle')}</h2>
                    <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto relative z-10">
                        {t('marketing.ngoOnboarding.partnerDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold">
                            <Link href="/contact/companies">{t('marketing.ngoOnboarding.partnerCta')}</Link>
                        </Button>
                    </div>
                </div>
            </section>


            {/* Final CTA */}
            <section className="container mx-auto px-4 pt-24 pb-12">
                <div className="bg-black rounded-[3rem] p-12 text-center text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight relative z-10" dangerouslySetInnerHTML={{ __html: t('marketing.ngoOnboarding.finalTitle') }} />
                    <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto relative z-10">
                        {t('marketing.ngoOnboarding.finalDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold bg-white text-black hover:bg-white/90">
                            <Link href="/login/selection?action=register&type=corporate">{t('marketing.ngoOnboarding.finalApply')}</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="rounded-full px-12 h-14 text-lg font-bold text-white hover:bg-white/10 hover:text-white">
                            <Link href="/support">{t('marketing.ngoOnboarding.finalSupport')}</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel={t('marketing.ngoOnboarding.footerLabel')} />
        </div>
    );
}
