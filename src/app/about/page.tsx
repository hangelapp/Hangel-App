
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, ShieldCheck, Target, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useWebContent } from '@/hooks/use-site-content';

const AppleSection = ({ 
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
    className?: string,
    children?: React.ReactNode
}) => (
    <section className={cn(
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-[0.95]">{title}</h2>
            {subtitle && <p className="text-xl md:text-3xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed font-medium">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                {cta1 && cta1Href && (
                    <Link href={cta1Href} className="text-primary hover:underline flex items-center text-lg font-bold">
                        {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
                 {cta2 && cta2Href && (
                    <Link href={cta2Href} className="text-primary hover:underline flex items-center text-lg font-bold">
                        {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
            </div>
            {children}
        </div>
        
        {imageUrl && (
            <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
                <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl transition-transform duration-1000 hover:scale-[1.02]">
                    <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        className="object-cover" 
                        data-ai-hint={imageHint}
                    />
                </div>
            </div>
        )}
    </section>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>, title: string, description: string }) => (
    <Card className="rounded-[2.5rem] p-8 border-none shadow-lg bg-white group hover:shadow-2xl transition-all duration-500 text-left">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="h-7 w-7 text-primary group-hover:text-white" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed font-medium">{description}</p>
    </Card>
);

export default function AboutPage() {
    const router = useRouter();
    const { get } = useWebContent();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <div className="flex items-center gap-2">
                        <HangelLogo className="text-base" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">BİZ KİMİZ?</span>
                    </div>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold shadow-lg shadow-primary/20">
                        <Link href="/login/selection?action=register">Aramıza Katıl</Link>
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <AppleSection
                title={get('about.title', 'İyiliği Dijitalleştirdik.')}
                subtitle={get('about.subtitle', 'Geleceğin dayanışma modelini inşa ediyoruz.')}
                description={get('about.description', 'Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, dünyanın en kapsayıcı sosyal etki platformuyuz.')}
                imageUrl={get('about.heroImageUrl', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')}
                imageHint="university students working together"
            >
                <div className="mt-4 flex justify-center">
                    <Link href="/hangelassociation" className="text-primary font-bold hover:underline flex items-center group text-[9px] tracking-tight bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 transition-all active:scale-95 shadow-sm">
                        Derneğin ana sayfasını görüntüle <ChevronRight className="ml-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </AppleSection>

            {/* Core Values Grid */}
            <section className="py-32 px-6 bg-[#f5f5f7]">
                <div className="container mx-auto max-w-6xl space-y-16">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">TEMEL DEĞERLERİMİZ</Badge>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter">İyilik, Bilgi ve Şeffaflık Üzerine Kurulu.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Target}
                            title="Sosyal Fayda"
                            description="Tüm teknolojik altyapımızı ve operasyonlarımızı toplumsal sorunların çözümüne odaklıyoruz."
                        />
                        <FeatureCard 
                            icon={ShieldCheck}
                            title="Tam Şeffaflık"
                            description="Blockchain şeffaflığında raporlama ile her bağışın ve etkinin izini sürebilirsiniz."
                        />
                        <FeatureCard 
                            icon={Globe}
                            title="Küresel Erişim"
                            description="21 ülkede aktif olan ağımızla yerel sorunlara küresel çözümler üretiyoruz."
                        />
                    </div>
                </div>
            </section>

            {/* Social Enterprise Section */}
            <AppleSection
                theme="dark"
                title={get('about.socialTitle', 'Bir Sosyal Girişim Hikayesi.')}
                description={get('about.socialDesc', 'Hangel, kârını toplumsal faydaya yatıran bir sosyal girişimdir. Amacımız ticari başarıyı, sosyal sorunlara sürdürülebilir çözümler üretmek için bir araç olarak kullanmaktır.')}
                cta1="Sosyal Girişimcilik Nedir?"
                cta1Href="/social-entrepreneurship"
                imageUrl="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
                imageHint="people discussing business strategy"
            />
            
            {/* Impact Numbers */}
            <section className="bg-white py-32 text-center border-b border-black/5">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16">
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">2.5M+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aktif Kullanıcı</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">1.2K+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kayıtlı STK</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">500+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">İş Ortağı Marka</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">12.5M ₺</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Yıllık Bağış Hacmi</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Philosophy */}
            <AppleSection
                theme="light"
                className="bg-[#fafafa]"
                title={get('about.foundationTitle', 'Kuruluş Felsefemiz.')}
                description={get('about.foundationDesc', "Yola çıkarken tek bir mottomuz vardı: 'Yok öyle yalnız başına mücadele etmek'. Toplumsal sorunların kolektif bir bilinç ve teknoloji destekli bir altyapı ile çözüleceğine inanıyoruz.")}
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students working together library"
            />
            
            <PublicFooter currentPageLabel="Biz Kimiz?" />
        </div>
    );
}
