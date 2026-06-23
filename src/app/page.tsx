'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Menu, ShoppingBag, HeartHandshake, MapPin, TrendingUp, Users, ShieldCheck, FileText, Siren, Globe, CalendarClock, Droplet, BookOpen, Sparkles, Watch, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { HangelLogo } from '@/components/icons';
import { allEntityLists, volunteeringOpportunities } from '@/lib/data';
import type { Brand, Volunteering } from '@/lib/types';
import { Card } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { PublicFooter } from '@/components/layout/public-footer';
import { StoreBadges } from '@/components/landing/StoreBadges';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { differenceInDays, parse } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { UserNav } from '@/components/layout/user-nav';
import { useRouter } from 'next/navigation';
import { useWebContent } from '@/hooks/use-site-content';
import { COLLECTIONS } from '@/firebase/collections';
import { BrandLogo } from '@/components/market/brand-logo';


const BrandCard = ({ brand }: { brand: Brand }) => {
    const { t } = useTranslation();
    const typeLabel = t(`landing.brandTypes.${brand.type}`) || t('landing.brandTypes.brand');
    return (
    <Link href={`/market/${brand.slug}`} className="group block h-full">
      <Card className="rounded-2xl hover:shadow-md transition-shadow bg-card border border-border h-full flex flex-col p-6 items-center text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {typeLabel}
        </p>
        <div className="relative w-24 h-24 rounded-2xl bg-muted overflow-hidden mb-4 border border-border">
          <BrandLogo brand={brand} />
        </div>
        <div className="flex-1 flex flex-col items-center">
            <h4 className="font-bold text-lg leading-tight text-card-foreground">{brand.name}</h4>
        </div>
        <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-none text-base font-bold">
          %{brand.donationRate} {t('landing.brandCard.donationSuffix')}
        </Badge>
      </Card>
    </Link>
    );
};

const ProductShowcaseSection = ({
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
    className,
    children
}: {
    title: string,
    subtitle?: string,
    description?: string,
    cta1?: string,
    cta1Href?: string,
    cta2?: string,
    cta2Href?: string,
    theme?: 'light' | 'dark',
    imageUrl?: string,
    imageHint?: string,
    id?: string;
    className?: string;
    children?: React.ReactNode;
}) => {
    const { t } = useTranslation();
    const cta1Text = cta1 ?? t('landing.showcase.defaultCta');
    return (
    <section id={id} className={cn(
        "relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 text-center overflow-hidden border-b border-border",
        theme === 'dark' ? "bg-black text-white" : "bg-background text-foreground",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-2xl md:max-w-4xl">
            {subtitle && <p className={cn("text-lg sm:text-xl md:text-2xl font-semibold opacity-90 tracking-tight text-balance", theme === 'dark' ? "text-[#00A8E8]" : "text-primary")}>{subtitle}</p>}
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-balance">{title}</h2>
            {description && <p className="text-base sm:text-lg md:text-xl opacity-80 max-w-xl md:max-w-3xl mx-auto leading-relaxed font-medium text-balance">{description}</p>}
            
             <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={cta1Href!} className={cn("hover:underline flex items-center text-lg font-medium", theme === 'dark' ? "text-[#2997ff]" : "text-primary")}>
                    {cta1Text} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
                {cta2 && cta2Href && (
                    <Link href={cta2Href} className={cn("hover:underline flex items-center text-lg font-medium", theme === 'dark' ? "text-[#2997ff]" : "text-primary")}>
                        {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>
        
        {children ? (
            <div className="w-full mt-16">{children}</div>
        ) : (
            imageUrl && (
                <div className="relative w-full flex-1 flex items-end justify-center mt-16 px-4 max-w-7xl mx-auto">
                    <div className="relative w-full aspect-[21/9] rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
                        <Image src={imageUrl} alt={title} fill className="object-cover" data-ai-hint={imageHint} />
                    </div>
                </div>
            )
        )}
    </section>
    );
};

const ProjectCard = ({ title, subtitle, cta, ctaHref, imageUrl, imageHint }: { title: string; subtitle?: string; cta?: string; ctaHref: string; imageUrl: string; imageHint?: string }) => (
    <Link href={ctaHref} className="group block h-full">
        <div className={cn(
            "relative rounded-3xl p-6 text-left flex flex-col overflow-hidden h-[450px] text-white",
        )}>
            <div className="absolute inset-0 z-0">
                 <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={imageHint} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                    <p className="text-sm opacity-80 max-w-xs">{subtitle}</p>
                </div>
                <div className="mt-4">
                    <span className="text-white hover:underline flex items-center text-sm font-semibold">
                        {cta} <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                </div>
            </div>
        </div>
    </Link>
);

const projectCardsStatic = [
    {
      key: 'legislation',
      ctaHref: "/hangelassociation/legislation",
      imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1974&auto=format&fit=crop",
      imageHint: "parliament legislation law social enterprise",
    },
    {
      key: 'employment',
      ctaHref: "/hangelassociation/projects/istihdam-protokolu",
      imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
      imageHint: "diverse team collaborating, impact employment",
    },
    {
      key: 'academic',
      ctaHref: "/hangelassociation/workshop",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop",
      imageHint: "university students campus social innovation",
    },
    {
      key: 'atlas',
      ctaHref: "/hangelassociation/projects/etki-atlasi",
      imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop",
      imageHint: "data map of turkey social impact atlas",
    },
    {
      key: 'conference',
      ctaHref: "/gelir-modeli-konferanslari",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
      imageHint: "ngo income model training conference seminar audience",
    },
] as const;

// Gelir Modeli Konferansı durakları — sayılar buradan türetilir (ileride şehir
// eklendikçe "N şehir / N etkinlik" başlıkları otomatik güncellenir).
const conferenceStops = [
    { city: 'Tekirdağ', date: '13 Haziran', venue: 'Tekirdağ' },
    { city: 'Antalya', date: '15 Haziran', venue: 'Muratpaşa' },
    { city: 'Ankara', date: '17 Haziran', venue: 'Kent Konseyi' },
    { city: 'İstanbul', date: '24 Haziran', venue: 'Kadıköy' },
    { city: 'İstanbul', date: '25 Haziran', venue: 'Avcılar' },
    { city: 'Bursa', date: '8 Temmuz', venue: 'Bursa' },
] as const;

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const { language, changeLanguage, t } = useTranslation();
    const { user, isUserLoading } = useUser();
    return (
        <header className="fixed top-0 inset-x-0 z-30 bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden h-11 w-11" onClick={onMenuClick} aria-label={t('a11y.openMenu')}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <HangelLogo className="text-xl" />
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="#bagis" className="hover:text-primary transition-colors flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span>{t('landing.donationLabel')}</span>
                    </Link>
                    <Link href="#gonulluluk" className="hover:text-primary transition-colors flex items-center gap-2">
                        <HeartHandshake className="h-4 w-4" />
                        <span>{t('landing.volunteeringLabel')}</span>
                    </Link>
                </nav>
                <div className="flex items-center gap-2">
                    <Select value={language} onValueChange={changeLanguage}>
                        <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-11 px-2 text-xs font-normal text-muted-foreground hover:text-primary transition-colors focus:ring-0">
                            <Globe className="h-3.5 w-3.5" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {languages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Acil ikonu — herkes (anon + auth) /emergency/about tanıtım sayfasına gider. */}
                    <Button asChild variant="ghost" size="icon" className="h-11 w-11 text-destructive/80" title={t('a11y.emergency')} aria-label={t('a11y.emergency')}>
                        <Link href="/emergency/about"><Siren className="h-5 w-5" /></Link>
                    </Button>
                    {isUserLoading ? (
                        <div className="w-11 h-11 rounded-full bg-muted animate-pulse ml-1" />
                    ) : user ? (
                        <UserNav />
                    ) : (
                        <Button asChild size="sm" className="h-11 rounded-full px-5 text-xs font-bold">
                            <Link href="/login/selection?action=login">{t('nav.login')}</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}

const VolunteeringCard = ({ opportunity }: { opportunity: Volunteering }) => {
    const { t } = useTranslation();
    // Hydration uyumu: SSR'da daysRemaining gizli kalır, mount sonrası hesaplanır.
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    useEffect(() => {
        try {
            const d = differenceInDays(parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
            setDaysRemaining(d);
        } catch { /* invalid date */ }
    }, [opportunity.dates.applicationEnd]);
    const countdownText = daysRemaining === null ? ''
        : daysRemaining > 0
            ? `${t('landing.volunteeringCard.daysLeftPrefix')} ${daysRemaining} ${t('landing.volunteeringCard.daysLeftSuffix')}`
            : (daysRemaining === 0 ? t('landing.volunteeringCard.lastDay') : t('landing.volunteeringCard.expired'));

    return (
        <Link href={`/volunteering/${opportunity.id}`} className="block h-full">
            <Card className="rounded-3xl hover:shadow-md transition-shadow bg-black/50 backdrop-blur-sm border-white/10 h-full flex flex-col p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/10 rounded-xl text-white/80">
                         <HeartHandshake className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                         <p className="font-bold text-sm leading-tight">{opportunity.points} {t('landing.volunteeringCard.points')}</p>
                         <p className="text-xs text-white/50 uppercase tracking-widest">{t('landing.volunteeringCard.impactPoints')}</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{opportunity.organization}</p>
                        <h4 className="font-bold text-lg leading-tight mt-1">{opportunity.title}</h4>
                    </div>
                    <div className="flex justify-center mt-2">
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-[0.1em]",
                            daysRemaining !== null && daysRemaining < 3 ? "text-primary" : "text-white/60"
                        )}>
                            {countdownText}
                        </span>
                    </div>
                </div>
                <div className="flex justify-between items-end pt-4 mt-2 border-t border-white/20">
                    <div className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{opportunity.location.city} ({opportunity.location.type})</span>
                    </div>
                </div>
            </Card>
        </Link>
    );
};

const DiscoveryCarouselCard = ({ title, description, href, imageUrl, imageHint, linkText, linkText2, href2 }: { title: string, description: string, href: string, imageUrl: string, imageHint: string, linkText: string, linkText2?: string, href2?: string }) => (
    <div className="h-full rounded-2xl bg-muted overflow-hidden group flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <div className="relative w-full aspect-video">
            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={imageHint} />
        </div>
        <div className="p-6 text-left flex flex-col flex-1">
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">{description}</p>
            <div className="mt-4 flex items-center gap-6">
                <Link href={href} className="text-sm font-semibold text-primary hover:underline flex items-center">
                    {linkText} <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
                {linkText2 && href2 && (
                     <Link href={href2} className="text-sm font-semibold text-muted-foreground hover:text-primary hover:underline flex items-center">
                        {linkText2} <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                )}
            </div>
        </div>
    </div>
);

const InfoCard = ({ title, description, link, linkText, icon: Icon }: { title: string, description: string, link: string, linkText: string, icon: React.ElementType }) => (
    <div className="bg-muted rounded-3xl p-8 flex flex-col h-full text-left">
        <div className="p-3 bg-card rounded-2xl w-fit shadow-sm mb-6">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-xl text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-3 flex-grow">{description}</p>
        <div className="mt-10">
            <Link href={link} className="text-sm font-semibold text-primary hover:underline flex items-center group">
                {linkText} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
    </div>
);

// Bireysel kullanıcı özellik vitrini — "neler sunuyoruz". Bağlanılan her özellik
// bugün canlı (gönüllülük, etkinlik, acil kan, ödemesiz bağış, pazar, kütüphane,
// etki hikayem, Apple Watch). Koyu tema güvenli semantik token kullanır.
const FeatureTile = ({ title, description, link, linkText, icon: Icon }: { title: string, description: string, link: string, linkText: string, icon: React.ElementType }) => (
    <Link href={link} className="group block h-full">
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col h-full text-left shadow-sm hover:shadow-md transition-shadow min-h-[44px]">
            <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">{description}</p>
            <span className="mt-4 text-sm font-semibold text-primary flex items-center">
                {linkText} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </span>
        </div>
    </Link>
);

export default function LoginPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [apiBrands, setApiBrands] = useState<Brand[]>([]);
    const [totalBrandCount, setTotalBrandCount] = useState(0);
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { get } = useWebContent();
    const { t } = useTranslation();

    // Giriş yapmış kullanıcı uygulama köküne (/) gelince varsayılan olarak
    // /market'e yönlendirilir. SideNav'daki "Website" bağlantısı (/?welcome=1)
    // tanıtım sayfasını kasıtlı açtığı için welcome=1 varken yönlendirme yapılmaz.
    useEffect(() => {
        if (isUserLoading || !user || !mounted) return;
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        if (params.get('welcome') === '1') return;
        router.replace('/market');
    }, [user, isUserLoading, mounted, router]);

    const db = useFirestore();
    const volunteeringQuery = useMemoFirebase(
        () => (db ? collection(db, COLLECTIONS.volunteering) : null),
        [db]
    );
    const { data: fsVolunteering } = useCollection<Volunteering>(volunteeringQuery);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await fetch('/api/offers');
                const brands = await response.json();
                setTotalBrandCount(brands.length);
                setApiBrands(brands.slice(0, 21));
            } catch (error) {
                console.error('Error fetching brands:', error);
            }
        };
        fetchBrands();
    }, []);
    
    const pluginBagis = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );
    const pluginImece = useRef(
        Autoplay({ delay: 5500, stopOnInteraction: true })
    );
    const pluginAssociation = useRef(
        Autoplay({ delay: 4500, stopOnInteraction: true })
    );

    const brandsInCarousel = useMemo(() => {
        const brands = allEntityLists.filter(b => b.type === 'brand');
        const cooperatives = allEntityLists.filter(b => b.type === 'cooperative');
        const economics = allEntityLists.filter(b => b.type === 'economic');
        const socials = allEntityLists.filter(b => b.type === 'social');

        const result: Brand[] = [];
        let bIdx = 0, cIdx = 0, eIdx = 0, sIdx = 0;
        
        while (result.length < 15) {
            if (brands[bIdx]) result.push(brands[bIdx++]);
            if (result.length < 15 && brands[bIdx]) result.push(brands[bIdx++]);
            if (result.length < 15 && cooperatives[cIdx]) result.push(cooperatives[cIdx++]);
            if (result.length < 15 && economics[eIdx]) result.push(economics[eIdx++]);
            if (result.length < 15 && socials[sIdx]) result.push(socials[sIdx++]);
            if (bIdx >= brands.length && cIdx >= cooperatives.length && eIdx >= economics.length && sIdx >= socials.length) break;
        }
        return result.slice(0, 15);
    }, []);

    // "mavi zemin" gönüllülük alanı: Firestore'dan aktif ilanları rastgele sıralıyoruz.
    // Yayında / Aktif olmayan ilanlar veya status alanı olmayan eski kayıtlar da gösterilir.
    // Hydration uyumu: SSR + client'ın ilk render'ında DETERMİNİSTİK sıra (Math.random
    // render içinde değil); mount sonrası useEffect içinde karıştırma yapılır.
    const activeVolunteeringSorted = useMemo<Volunteering[]>(() => {
        const source: Volunteering[] = (Array.isArray(fsVolunteering) && fsVolunteering.length > 0)
            ? fsVolunteering as Volunteering[]
            : volunteeringOpportunities;
        const active = source.filter((opp) => {
            const status = (opp as Volunteering & { status?: string }).status;
            if (!status) return true;
            const normalized = String(status).toLowerCase();
            return normalized === 'yayında' || normalized === 'yayinda' || normalized === 'aktif' || normalized === 'active';
        });
        return active.slice(0, 15);
    }, [fsVolunteering]);
    const [randomActiveVolunteering, setRandomActiveVolunteering] = useState<Volunteering[]>(activeVolunteeringSorted);
    useEffect(() => {
        const arr = [...activeVolunteeringSorted];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setRandomActiveVolunteering(arr);
    }, [activeVolunteeringSorted]);

    const publicNavItems = [
      { href: '#bagis', label: t('landing.nav.donate') },
      { href: '#gonulluluk', label: t('landing.nav.volunteer') },
      { href: '/hangelassociation', label: t('landing.nav.association') },
      { href: '/about', label: t('landing.nav.about') },
      { href: '/support', label: t('landing.nav.support') },
    ];

    const campusImg = PlaceHolderImages.find(img => img.id === 'campus-poster-1');

    const discoveryItems = [
        {
            title: t('landing.discovery.ngo.title'),
            description: t('landing.discovery.ngo.description'),
            href: "/login/selection?action=register&type=corporate&entity=NGO",
            imageUrl: "/discovery/stk.png",
            imageHint: "diverse hands stacked together in solidarity, minimal",
            linkText: t('landing.discovery.ngo.linkText'),
            linkText2: t('landing.discovery.ngo.linkText2'),
            href2: "/ngo-onboarding"
        },
        {
            title: t('landing.discovery.brand.title'),
            description: t('landing.discovery.brand.description'),
            href: "/login/selection?action=register&type=corporate&entity=BRAND",
            imageUrl: "https://picsum.photos/seed/merc-char/1080/1080",
            imageHint: "charcoal merchant store drawing",
            linkText: t('landing.discovery.brand.linkText'),
            linkText2: t('landing.discovery.brand.linkText2'),
            href2: "/merchant"
        },
        {
            title: t('landing.discovery.clubs.title'),
            description: t('landing.discovery.clubs.description'),
            href: "/login/selection?action=register&type=corporate&entity=CLUB",
            imageUrl: campusImg?.imageUrl || "https://images.unsplash.com/photo-1693700685983-08ae3fb430c7?q=80&w=1080",
            imageHint: campusImg?.imageHint || "minimalist university poster",
            linkText: t('landing.discovery.clubs.linkText'),
            linkText2: t('landing.discovery.clubs.linkText2'),
            href2: "/campus-advantages"
        },
        {
            title: t('landing.discovery.library.title'),
            description: t('landing.discovery.library.description'),
            href: "/library",
            imageUrl: "/discovery/library-pergamon.jpg",
            imageHint: "open book dissolving into coral light particles, minimal",
            linkText: t('landing.discovery.library.linkText'),
            linkText2: t('landing.discovery.library.linkText2'),
            href2: "/library/about"
        },
        {
            title: t('landing.discovery.emergency.title'),
            description: t('landing.discovery.emergency.description'),
            href: "/emergency",
            imageUrl: "/discovery/emergency.png",
            imageHint: "blood drop above cupped hands, minimal hopeful",
            linkText: t('landing.discovery.emergency.linkText'),
            linkText2: t('landing.discovery.emergency.linkText2'),
            href2: "/emergency/about"
        },
        {
            title: t('landing.features.market.title'),
            description: t('landing.features.market.description'),
            href: "/market",
            imageUrl: "https://picsum.photos/seed/hangel-market/1080/1080",
            imageHint: "minimal product grid with coral donation badge",
            linkText: t('landing.features.market.linkText'),
            linkText2: t('landing.features.library.linkText'),
            href2: "/library"
        },
        {
            title: t('landing.discovery.public.title'),
            description: t('landing.discovery.public.description'),
            href: "/corporate",
            imageUrl: "/discovery/public.png",
            imageHint: "minimal civic building with coral network arc",
            linkText: t('landing.discovery.public.linkText'),
            linkText2: t('landing.discovery.public.linkText2'),
            href2: "/corporate"
        }
    ];

    // Hidrasyon öncesi / JS'siz istemci (ve Google OAuth doğrulama denetçisi) için
    // SSR HTML'inde uygulamanın amacını NET anlatan görünür içerik. mounted=true olunca
    // aşağıdaki tam açılış sayfası bunun yerini alır. (Önceden boş div dönüyordu →
    // "ana sayfa amacı açıklanmıyor" reddine sebep oluyordu.)
    if (!mounted) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-4xl font-black tracking-tight text-foreground">hangel</h1>
            <p className="mt-4 text-lg font-semibold text-foreground/80 max-w-2xl">
                Türkiye&apos;nin sosyal etki platformu
            </p>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
                hangel; sivil toplum kuruluşlarını (STK), gönüllüleri, öğrenci kulüplerini ve
                markaları tek bir platformda buluşturur. Kullanıcılar bağış yapar ve gönüllülük
                fırsatlarına başvurur; STK&apos;lar kampanya, etkinlik ve gönüllülük ilanlarını
                yönetir; markalar satışlarından STK&apos;lara katkı sağlar. STK&apos;lar ayrıca
                kendi Google Ads / Google Ad Grants reklam hesaplarını doğrudan hangel panelinden
                bağlayıp yönetebilir.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
                <a href="/login/selection?action=register" className="underline underline-offset-2">Hemen Katıl</a>
                {' · '}
                <a href="/gizlilik-politikasi" className="underline underline-offset-2">Gizlilik Politikası</a>
                {' · '}
                <a href="/kullanici-sozlesmesi" className="underline underline-offset-2">Kullanıcı Sözleşmesi</a>
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <style jsx global>{`
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
            `}</style>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="text-left">
                            <HangelLogo className="text-2xl" />
                        </SheetTitle>
                        <SheetDescription />
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 py-6">
                         {publicNavItems.map(item => (
                            <SheetClose asChild key={item.label}>
                                <Link href={item.href} className="text-lg font-medium hover:text-primary">{item.label}</Link>
                            </SheetClose>
                         ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <Header onMenuClick={() => setIsMenuOpen(true)} />
            <main>
                <section className="min-h-screen flex flex-col px-6 pt-24 pb-[calc(4rem+env(safe-area-inset-bottom))] bg-background border-b border-border">
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-medium text-muted-foreground max-w-2xl md:max-w-4xl text-balance leading-tight">{get('home.heroSubtitle', 'Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.')}</h2>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-foreground max-w-xl md:max-w-4xl text-balance mt-3">{get('home.heroTitle', 'yok öyle yalnız başına mücadele etmek.')}</h1>
                        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-muted-foreground mt-6 max-w-2xl md:max-w-4xl text-balance">{get('home.heroTagline', '#wearehangel')}</p>
                        <div className="mt-12">
                            <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                                <Link href="/login/selection?action=register">{get('home.heroCta', 'Hemen Katıl')}</Link>
                            </Button>
                        </div>
                    </div>
                    {/* Platformlar — ilk ekranda, ince çizginin hemen üstünde (scroll gerekmez), minimal */}
                    <StoreBadges />
                </section>

                 <ProductShowcaseSection
                    id="bagis"
                    theme="light"
                    className="bg-muted"
                    title={get('home.donationTitle', 'hangel Bağış')}
                    subtitle={get('home.donationSubtitle', 'Alışverişi iyiliğe dönüştürün.')}
                    description={get('home.donationDescription', "Yüzlerce markadan yaptığınız alışverişlerle, hiçbir ek ücret ödemeden seçtiğiniz STK'ya destek olun. Bilinçli tüketiciliğin en kolay yolu.")}
                    cta1={t('landing.showcase.donationCta1')}
                    cta1Href="/market"
                    cta2={t('landing.showcase.donationCta2')}
                    cta2Href="/social-impact"
                >
                    <div className="w-full max-w-7xl mx-auto">
                        <Carousel
                            opts={{
                            align: "start",
                            loop: true,
                            }}
                            plugins={[pluginBagis.current]}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {(apiBrands.length > 0 ? apiBrands : brandsInCarousel).map((brand) => (
                                    <CarouselItem key={brand.id} className="pl-4 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                                        <div className="h-[350px] p-1">
                                            <BrandCard brand={brand} />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <div className="flex justify-end gap-2 mt-4 px-4">
                                <CarouselPrevious className="static translate-y-0 h-11 w-11 border-border" />
                                <CarouselNext className="static translate-y-0 h-11 w-11 border-border" />
                            </div>
                        </Carousel>
                        <div className="text-center mt-8">
                            <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-primary/20 text-primary hover:bg-primary/5">
                                <Link href="/market">
                                    {t('landing.viewAllBrandsPrefix')} ({totalBrandCount > 0 ? totalBrandCount : allEntityLists.length} {t('landing.brandsSuffix')})
                                </Link>
                            </Button>
                        </div>
                    </div>
                </ProductShowcaseSection>
                <ProductShowcaseSection
                    id="gonulluluk"
                    theme="dark"
                    className="bg-[#042654]"
                    title={get('home.volunteeringTitle', 'hangel İmece')}
                    subtitle={get('home.volunteeringSubtitle', 'Zamanınız en değerli bağış.')}
                    description={get('home.volunteeringDescription', 'Yetkinliklerinizi ve zamanınızı toplumsal faydaya dönüştürün. Çevreden eğitime, hayvan haklarından sanata, size en uygun gönüllülük fırsatını bulun.')}
                    cta1={t('landing.showcase.volunteeringCta1')}
                    cta1Href="/imece"
                    cta2={t('landing.showcase.volunteeringCta2')}
                    cta2Href="/login/selection?action=register"
                >
                    <div className="w-full max-w-7xl mx-auto">
                        <Carousel
                            opts={{
                            align: "start",
                            loop: true,
                            }}
                            plugins={[pluginImece.current]}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {randomActiveVolunteering.map((opp) => (
                                    <CarouselItem key={opp.id} className="pl-4 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                                        <VolunteeringCard opportunity={opp} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <div className="flex justify-end gap-2 mt-4 px-4">
                                <CarouselPrevious className="static translate-y-0 h-11 w-11 border-white/20 text-white bg-transparent hover:bg-white hover:text-black" />
                                <CarouselNext className="static translate-y-0 h-11 w-11 border-white/20 text-white bg-transparent hover:bg-white hover:text-black" />
                            </div>
                        </Carousel>
                        <div className="text-center mt-8">
                            <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-white/20 text-white bg-transparent hover:bg-white hover:text-black">
                                <Link href="/volunteering">
                                    {t('landing.viewAllListingsPrefix')} ({(fsVolunteering && fsVolunteering.length > 0 ? fsVolunteering.length : volunteeringOpportunities.length)} {t('landing.listingsSuffix')})
                                </Link>
                            </Button>
                        </div>
                    </div>
                </ProductShowcaseSection>
                
                {/* Bireysel kullanıcı özellik vitrini — "neler sunuyoruz". Tüm
                    özellikler bugün canlı; her tile ilgili sayfaya link verir. */}
                <section id="ozellikler" className="py-16 md:py-24 bg-muted border-b border-border">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-12 space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{t('landing.featuresTitle')}</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.featuresDescription')}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
                            <FeatureTile
                                icon={HeartHandshake}
                                title={t('landing.features.volunteering.title')}
                                description={t('landing.features.volunteering.description')}
                                link="/volunteering"
                                linkText={t('landing.features.volunteering.linkText')}
                            />
                            <FeatureTile
                                icon={CalendarClock}
                                title={t('landing.features.events.title')}
                                description={t('landing.features.events.description')}
                                link="/events"
                                linkText={t('landing.features.events.linkText')}
                            />
                            <FeatureTile
                                icon={Droplet}
                                title={t('landing.features.emergency.title')}
                                description={t('landing.features.emergency.description')}
                                link="/emergency"
                                linkText={t('landing.features.emergency.linkText')}
                            />
                            <FeatureTile
                                icon={ShoppingBag}
                                title={t('landing.features.donation.title')}
                                description={t('landing.features.donation.description')}
                                link="/social-impact"
                                linkText={t('landing.features.donation.linkText')}
                            />
                            <FeatureTile
                                icon={Store}
                                title={t('landing.features.market.title')}
                                description={t('landing.features.market.description')}
                                link="/market"
                                linkText={t('landing.features.market.linkText')}
                            />
                            <FeatureTile
                                icon={BookOpen}
                                title={t('landing.features.library.title')}
                                description={t('landing.features.library.description')}
                                link="/library"
                                linkText={t('landing.features.library.linkText')}
                            />
                            <FeatureTile
                                icon={Sparkles}
                                title={t('landing.features.impact.title')}
                                description={t('landing.features.impact.description')}
                                link="/social-impact"
                                linkText={t('landing.features.impact.linkText')}
                            />
                            <FeatureTile
                                icon={Watch}
                                title={t('landing.features.apple.title')}
                                description={t('landing.features.apple.description')}
                                link="/login/selection?action=register"
                                linkText={t('landing.features.apple.linkText')}
                            />
                        </div>
                        <div className="text-center mt-10">
                            <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                                <Link href="/login/selection?action=register">{t('landing.featuresCta')}</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <section id="kurumlar-grid" className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-12 space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{t('landing.discoverTitle')}</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.discoverDescription')}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {discoveryItems.map((item, index) => (
                                <DiscoveryCarouselCard key={index} {...item} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="projeler" className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto max-w-7xl">
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{t('landing.associationTitle')}</h2>
                            <p className="text-muted-foreground mt-2">{t('landing.associationDescription')}</p>
                            <Link href="/hangelassociation" className="text-primary hover:underline flex items-center justify-center text-lg font-medium group">
                                {t('landing.associationCta')} <ChevronRight className="h-5 w-5 ml-0.5" />
                            </Link>
                        </div>
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            plugins={[pluginAssociation.current]}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {projectCardsStatic.map((card, index) => (
                                    <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-[22%]">
                                        <ProjectCard
                                            title={t(`landing.projects.${card.key}.title`)}
                                            subtitle={t(`landing.projects.${card.key}.subtitle`)}
                                            cta={t(`landing.projects.${card.key}.cta`)}
                                            ctaHref={card.ctaHref}
                                            imageUrl={card.imageUrl}
                                            imageHint={card.imageHint}
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                             <div className="hidden lg:flex justify-end gap-2 mt-8 px-6">
                                <CarouselPrevious className="static translate-y-0 h-12 w-12 border-border" />
                                <CarouselNext className="static translate-y-0 h-12 w-12 border-border" />
                            </div>
                        </Carousel>
                    </div>
                </section>

                {/* STK Gelir Modeli Eğitim Konferansları — dernek etkinliği */}
                <section id="gelir-modeli-konferanslari" className="py-16 md:py-24 bg-[#0a0a0a] text-white overflow-hidden">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid lg:grid-cols-2 gap-10 items-center">
                            <div className="space-y-5">
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-xs font-bold text-primary">
                                    <TrendingUp className="h-3.5 w-3.5" /> Ücretsiz · Sertifikalı · {conferenceStops.length} Şehir · {conferenceStops.length} Etkinlik
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                                    STK Gelir Modeli Oluşturma <br className="hidden md:block" />Eğitim Konferansları
                                </h2>
                                <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-xl">
                                    Sivil toplum kuruluşunuzun yarınını bugün güvence altına alın. Sürdürülebilir ve çeşitlendirilmiş bir gelir modeli kurmanın yollarını uzmanlarla keşfedin. Dernek, vakıf ve spor kulüplerinin yönetici ve gönüllülerine özel.
                                </p>
                                <p className="text-lg font-semibold text-primary italic">&ldquo;Yok öyle yalnız başına mücadele etmek!&rdquo;</p>
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <Button asChild size="lg" className="rounded-full px-8 h-12 font-bold shadow-xl shadow-primary/20">
                                        <Link href="/gelir-modeli-konferanslari">Detaylar ve Başvuru</Link>
                                    </Button>
                                    <span className="text-xs text-white/50">İç İşleri Bakanlığı STK Genel Müdürlüğü desteğiyle</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {conferenceStops.map((e, i) => (
                                    <Link key={i} href="/gelir-modeli-konferanslari" className="group rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-colors">
                                        <p className="text-lg font-bold leading-tight">{e.city}</p>
                                        <p className="text-sm text-white/60">{e.date} · 14:30</p>
                                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                                            <MapPin className="h-3 w-3" /> {e.venue}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="degerler" className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{get('home.valuesTitle', 'Değerlerimizle Fark Oluşturuyoruz')}</h2>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">{get('home.valuesDescription', 'Şeffaflık, güvenlik ve erişilebilirlik üzerine kurulu bir sosyal etki ekosistemi tasarlıyoruz.')}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InfoCard
                                icon={TrendingUp}
                                title={t('landing.values.sustainability.title')}
                                description={t('landing.values.sustainability.description')}
                                link="/social-impact"
                                linkText={t('landing.values.sustainability.linkText')}
                            />
                            <InfoCard
                                icon={Users}
                                title={t('landing.values.accessibility.title')}
                                description={t('landing.values.accessibility.description')}
                                link="/accessibility"
                                linkText={t('landing.values.accessibility.linkText')}
                            />
                             <InfoCard
                                icon={ShieldCheck}
                                title={t('landing.values.security.title')}
                                description={t('landing.values.security.description')}
                                link="/settings/contracts/gizlilik-politikasi"
                                linkText={t('landing.values.security.linkText')}
                            />
                            <InfoCard
                                icon={FileText}
                                title={t('landing.values.legal.title')}
                                description={t('landing.values.legal.description')}
                                link="/bilgi-toplumu-hizmetleri"
                                linkText={t('landing.values.legal.linkText')}
                            />
                        </div>
                    </div>
                </section>
                {/* Uygulama amacı — Google OAuth "ana sayfa amacı" şartı + Ads scope
                    gerekçesi. Hero'dan alınıp sayfa sonuna sönük bölüm olarak indirildi
                    (içerik kaldırılmadı; OAuth doğrulaması için sayfada kalmalı). */}
                <section className="bg-background border-t border-border px-6 py-10">
                    <p className="mx-auto max-w-3xl text-center text-sm text-muted-foreground leading-relaxed">
                        hangel; sivil toplum kuruluşlarını (STK), gönüllüleri, öğrenci kulüplerini ve markaları
                        tek bir platformda buluşturan bir sosyal etki platformudur. Kullanıcılar bağış yapar ve
                        gönüllülük fırsatlarına başvurur; STK&apos;lar kampanya, etkinlik ve gönüllülük ilanlarını
                        yönetir; markalar satışlarından STK&apos;lara katkı sağlar. STK&apos;lar ayrıca kendi
                        Google Ads / Google Ad Grants reklam hesaplarını doğrudan hangel panelinden bağlayıp
                        yönetebilir.
                    </p>
                </section>
            </main>
            <PublicFooter currentPageLabel={t('landing.footerLabel')} />
        </div>
    );
}
