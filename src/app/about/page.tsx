
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, TrendingUp, Users, ShieldCheck, HeartHandshake, Zap, Award, Target, Landmark, Scale, Brain } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


// Keep the AppleSection component
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
    imageUrl?: string,
    imageHint?: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                {cta1 && cta1Href && (
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
        
        {imageUrl && (
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
        )}
    </section>
);

// Add a new InfoCard component for links
const InfoCard = ({ icon: Icon, title, description, href }: { icon: any, title: string, description: string, href: string }) => (
    <Link href={href} className="block h-full">
        <Card className="h-full bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-xl">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-dashed">
                 <span className="font-bold text-primary flex items-center text-sm">
                    Daha Fazla Bilgi
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </span>
            </div>
        </Card>
    </Link>
)

// Main Page Component
export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Biz Kimiz?</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                        <Link href="/login/selection?action=register">Şimdi Katıl</Link>
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <AppleSection 
                title="İyiliği Dijitalleştirdik."
                subtitle="Geleceğin dayanışma modelini inşa ediyoruz."
                description="Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, en kapsamlı sosyal etki platformuyuz."
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="university students working together"
            />

            {/* Social Enterprise */}
            <AppleSection
                theme="dark"
                title="Bir Sosyal Girişim Hikayesi."
                description="Hangel, kârını toplumsal faydaya yatıran bir sosyal girişimdir. Amacımız ticari başarıyı, sosyal sorunlara sürdürülebilir çözümler üretmek için bir araç olarak kullanmaktır. Bu model, finansal bağımsızlık ve kalıcı etki yaratma gücü sunar."
                cta1="Sosyal Girişimcilik Nedir?"
                cta1Href="/social-entrepreneurship"
                imageUrl="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
                imageHint="people discussing business strategy"
            />
            
            {/* Rakamlarla Hangel */}
            <section className="bg-[#f5f5f7] py-24 text-center border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-[#1d1d1f]">Rakamlarla hangel</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 lg:gap-x-16">
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">2.5M+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Kullanıcı</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">1.2K+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">STK</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">500+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Marka Sayısı</p>
                        </div>
                         <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">250+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Kulüp</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">50M+ ₺</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Nakit Bağış</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">250M+ ₺</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Toplam Sosyal Etki</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">1M+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Saat Gönüllülük</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-5xl font-black tracking-tighter text-primary">1.5K+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Tamamlanan Proje</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Hangel Derneği */}
            <AppleSection 
                title="Sivil Toplumun Kalbinde: hangel Derneği."
                description="Platformun teknolojik gücünü, Social Business Global Derneği'nin (SBG) saha tecrübesi ve akademik vizyonuyla birleştiriyoruz. Derneğimiz, sosyal girişimcilik ekosistemini güçlendirmek, mevzuat çalışmaları yapmak ve uluslararası işbirlikleri kurmak için çalışır."
                cta1="Daha Fazla Bilgi"
                cta1Href="/hangelassociation"
                imageUrl="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"
                imageHint="conference meeting presentation"
            />
            
            {/* Founding Philosophy */}
            <AppleSection 
                theme="dark"
                title="Kuruluş Felsefemiz."
                description="Yola çıkarken tek bir mottomuz vardı: 'Yok öyle yalnız başına mücadele etmek'. Toplumsal sorunların bireysel çabalarla aşılamayacağına, kolektif bir bilinç ve teknoloji destekli bir altyapı ile gerçek değişimin mümkün olduğuna inanıyoruz."
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students working together library"
            />
            
            {/* Corporate Links */}
            <section className="bg-white py-24">
                <div className="container mx-auto px-6 max-w-5xl space-y-12">
                     <div className="text-center">
                        <h2 className="text-3xl font-bold">Şeffaf, Güvenilir ve Kapsayıcı</h2>
                        <p className="text-muted-foreground mt-2">Kurumsal yapımızı ve taahhütlerimizi inceleyin.</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard 
                            icon={TrendingUp}
                            title="Yatırımcı İlişkileri"
                            description="Sürdürülebilir büyüme modelimizi ve finansal şeffaflık ilkelerimizi keşfedin."
                            href="/yatirimci-iliskileri"
                        />
                         <InfoCard 
                            icon={Landmark}
                            title="Bilgi Toplumu Hizmetleri"
                            description="Ticari sicil, yönetim kurulu ve yasal yükümlülüklerimize dair tüm bilgilere erişin."
                            href="/bilgi-toplumu-hizmetleri"
                        />
                         <InfoCard 
                            icon={Users}
                            title="Erişilebilirlik"
                            description="Herkes için eşit bir dijital deneyim sunma taahhüdümüzü ve WCAG uyum standartlarımızı öğrenin."
                            href="/accessibility"
                        />
                         <InfoCard 
                            icon={Brain}
                            title="Veriye Dayalı Çözüm"
                            description="Toplumsal sorunları analiz etmek ve en etkili çözümleri üretmek için büyük veriden ve yapay zekadan güç alıyoruz."
                            href="/data-solutions"
                        />
                         <InfoCard 
                            icon={Scale}
                            title="Standartlarımız"
                            description="50'den fazla uluslararası veri koruma, güvenlik ve yönetişim standardına olan uyumumuzu şeffaflıkla beyan ediyoruz."
                            href="/standards"
                        />
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Biz Kimiz?" />
        </div>
    );
}
    