
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useAssociationContent } from '@/hooks/use-site-content';

const AssociationHeader = ({ currentPage }: { currentPage?: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Platforma Dön
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                    <Link href="/hangelassociation/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/hangelassociation/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

const ShowcaseSection = ({ 
    title, 
    subtitle, 
    description, 
    cta1 = "Daha Fazla Bilgi", 
    cta1Href = "#",
    theme = 'light',
    imageUrl,
    imageHint,
    id,
    children
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    cta1?: string, 
    cta1Href?: string,
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    id?: string;
    children?: React.ReactNode;
}) => (
    <section id={id} className={cn(
        "relative min-h-[90vh] flex flex-col items-center justify-center py-20 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]",
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            {subtitle && <p className="text-xl md:text-2xl font-semibold opacity-90 tracking-tight" style={{color: theme === 'dark' ? '#00A8E8' : 'var(--primary)'}}>{subtitle}</p>}
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight">{title}</h2>
            {description && <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={cta1Href} className={cn("hover:underline flex items-center text-lg font-medium", theme === 'dark' ? 'text-[#2997ff]' : 'text-primary')}>
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
            </div>
        </div>
        
        <div className="relative w-full flex-1 flex items-end justify-center mt-16 px-4 max-w-7xl mx-auto">
            <div className="relative w-full aspect-[21/9] rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-25px_rgba(0,0,0,0.1)]">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover" 
                    data-ai-hint={imageHint}
                />
            </div>
        </div>
        {children}
    </section>
);

const GridSection = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <section className={cn("py-20 md:py-32 px-4 bg-white", className)}>
        <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children}
            </div>
        </div>
    </section>
);

type GridCardProps = {
    title: string;
    subtitle: string;
    cta: string;
    ctaHref: string;
    imageUrl: string;
    imageHint?: string;
    theme?: 'light' | 'dark';
};

const GridCard = ({ title, subtitle, cta, ctaHref, imageUrl, imageHint, theme = 'light' }: GridCardProps) => (
    <div className={cn(
        "relative rounded-[2.5rem] p-10 text-center flex flex-col overflow-hidden min-h-[550px]",
        theme === 'dark' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
    )}>
        <div className="space-y-2 z-10">
            <h3 className="text-4xl font-bold tracking-tight">{title}</h3>
            <p className="text-lg max-w-xs mx-auto opacity-80">{subtitle}</p>
        </div>
        <div className="mt-4 z-10">
            <Link href={ctaHref} className={cn("text-primary hover:underline flex items-center text-sm font-medium justify-center", theme === 'dark' && 'text-[#2997ff]')}>
                {cta} <ChevronRight className="h-4 w-4 ml-0.5" />
            </Link>
        </div>
        <div className="relative flex-1 flex items-end justify-center mt-8 z-10 -mx-10 -mb-10">
            <div className="relative w-full aspect-[4/3]">
                <Image src={imageUrl} alt={title} fill className="object-contain" data-ai-hint={imageHint} />
            </div>
        </div>
    </div>
);

const PressSection = () => (
    <section className="py-20 md:py-32 bg-white border-y border-black/5 overflow-hidden">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Basında Biz</h2>
        </div>
        <div className="relative h-20">
            <div className="absolute inset-0 flex items-center animate-scroll">
                {[...Array(2)].flatMap(() => [
                    { name: 'Anadolu Ajansı', logo: 'https://logo.clearbit.com/aa.com.tr' },
                    { name: 'TRT Haber', logo: 'https://logo.clearbit.com/trthaber.com' },
                    { name: 'Hürriyet', logo: 'https://logo.clearbit.com/hurriyet.com.tr' },
                    { name: 'NTV', logo: 'https://logo.clearbit.com/ntv.com.tr' },
                    { name: 'Sözcü', logo: 'https://logo.clearbit.com/sozcu.com.tr' },
                    { name: 'Webrazzi', logo: 'https://logo.clearbit.com/webrazzi.com' },
                    { name: 'Marketing Türkiye', logo: 'https://logo.clearbit.com/marketingturkiye.com.tr' }
                ]).map((item, index) => (
                    <div key={index} className="w-64 h-16 flex items-center justify-center flex-shrink-0 px-8">
                        <div className="relative h-full w-full">
                            <Image src={item.logo} alt={item.name} fill className="object-contain grayscale opacity-60" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);


export default function AssociationHomePage() {
    const { get } = useAssociationContent();

    return (
        <div className="min-h-screen bg-white font-sans text-center text-[#1d1d1f]">
            <style jsx global>{`
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
            `}</style>
            <AssociationHeader />

            <main>
                <section className="h-[90vh] flex flex-col justify-center items-center text-center p-6 bg-[#f5f5f7] border-b border-black/5">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none text-[#1d1d1f]">yok öyle yalnız başına mücadele etmek.</h1>
                    <h2 className="text-2xl md:text-4xl font-medium text-muted-foreground mt-6 max-w-4xl">Gelin, gücü birleştirelim. Gerçek etki üretelim.</h2>
                    <div className="mt-12">
                        <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                            <Link href="/login/selection?action=register">Hemen Katıl</Link>
                        </Button>
                    </div>
                </section>

                <ShowcaseSection
                    id="calistay"
                    subtitle={get('homepage.workshopSubtitle', 'Küresel Diyalog')}
                    title={get('homepage.workshopTitle', 'Uluslararası Sosyal Girişimcilik Çalıştayı.')}
                    description={get('homepage.workshopDescription', "54 ülkeden vizyoner liderlerle ortak sorunlara kolektif çözümler üretiyoruz. Türkiye'nin ilk, dünyanın 27. Sosyal Girişimcilik Yüksek Lisans programına ilham verdik.")}
                    cta1="Çalıştayı Keşfet"
                    cta1Href="/hangelassociation/workshop"
                    imageUrl={get('homepage.heroImageUrl', 'https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop')}
                    imageHint="international conference"
                />

                <ShowcaseSection
                    id="mevzuat"
                    theme="dark"
                    subtitle={get('homepage.legislationSubtitle', 'Hukuki Reform')}
                    title={get('homepage.legislationTitle', 'Sosyal Girişimcilik Kanunu Teklifi.')}
                    description={get('homepage.legislationDescription', '29 maddelik kanun teklifimizle, sosyal girişimciliğin yasal statüsünü, denetim standartlarını ve teşvik mekanizmalarını tanımlıyoruz.')}
                    cta1="Taslağı İncele"
                    cta1Href="/hangelassociation/legislation"
                    imageUrl="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                    imageHint="legal documents"
                />

                <GridSection>
                    <GridCard 
                        title="Etki Odaklı İstihdam"
                        subtitle="Gönüllülüğü kariyere dönüştüren ilk model."
                        cta="Protokolü İncele"
                        ctaHref="/hangelassociation/projects/istihdam-protokolu"
                        imageUrl="https://picsum.photos/seed/protocol/600/400"
                        imageHint="handshake meeting"
                    />
                     <GridCard 
                        title="Akademik Programlar"
                        subtitle="Üniversitelerde sosyal inovasyon müfredatı."
                        cta="Programları Gör"
                        ctaHref="/hangelassociation/workshop"
                        imageUrl="https://picsum.photos/seed/academy/600/400"
                        imageHint="university graduation"
                        theme="dark"
                    />
                     <GridCard 
                        title="Sosyal Etki Atlası"
                        subtitle="Türkiye'nin iyilik haritasını çiziyoruz."
                        cta="Atlası Keşfet"
                        ctaHref="/hangelassociation/projects/etki-atlasi"
                        imageUrl="https://picsum.photos/seed/atlas/600/400"
                        imageHint="digital map"
                        theme="dark"
                    />
                     <GridCard 
                        title="Girişimcilik Kütüphanesi"
                        subtitle="21 merkezde bilgi ve tecrübe temelli yol haritaları."
                        cta="Kütüphaneye Git"
                        ctaHref="/hangelassociation/workshop"
                        imageUrl="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop"
                        imageHint="modern library"
                    />
                </GridSection>

                <PressSection />

            </main>

            <PublicFooter currentPageLabel="hangel derneği" />
        </div>
    );
}

