
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const AppleSection = ({ 
    title, 
    subtitle, 
    description, 
    cta1 = "Daha Fazla Bilgi", 
    cta1Href = "#",
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
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
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
                <Link href={cta1Href} className="text-primary hover:underline flex items-center text-lg font-medium">
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
            </div>
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
                subtitle="hangel a.ş. ile geleceğin dayanışma modelini inşa ediyoruz."
                description="Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, Türkiye'nin en kapsamlı sosyal etki platformuyuz."
                imageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                imageHint="modern office people collaborating"
            />

            {/* Mission */}
            <AppleSection 
                theme="dark"
                title="Misyonumuz Şeffaflık."
                subtitle="Her bir kuruşun yolculuğunu izleyin."
                description="Teknolojinin gücüyle bağışçılığı daha güvenilir, gönüllülüğü daha etkili kılıyoruz. Şeffaflık endeksimizle sivil topluma olan güveni yeniden tanımlıyoruz."
                imageUrl="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                imageHint="document verify shield icon concept"
            />

            {/* Team/Community */}
            <AppleSection 
                title="Büyük Bir Topluluğuz."
                subtitle="Milyonlarca gönüllü, yüzlerce STK."
                description="Sadece bir platform değil, iyilik hareketini bir yaşam biçimi haline getiren bilinçli bir topluluğuz. Her bir üyemiz, kampüs temsilcimiz ve iş ortağımızla daha güçlüyüz."
                imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                imageHint="happy group people outdoors"
            />

            <AppleSection
                theme="dark"
                title="Teknolojiyle Etki Yaratıyoruz."
                subtitle="Yapay zeka, QR kod ve mobil öncelikli tasarım."
                description="Platformumuz, en son teknolojileri kullanarak sosyal etkiyi en üst düzeye çıkarır. Yapay zeka destekli öneri motorlarımız doğru gönüllüyü doğru projeyle buluştururken, QR kod ile ödeme sistemi bağış yapmayı saniyeler içinde mümkün kılar."
                imageUrl="https://images.unsplash.com/photo-1556742049-02e1f6c40b12?q=80&w=2070&auto=format&fit=crop"
                imageHint="smartphone scanning QR code"
            />
            <AppleSection
                title="Sürdürülebilir Bir Model."
                subtitle="Ticaret ve sosyal faydayı birleştiren yapı."
                description="Marka işbirlikleriyle oluşturduğumuz 'alışverişle bağış' modeli sayesinde, kullanıcılarımız ek bir ücret ödemeden destekledikleri STK'lara kaynak aktarır. Bu, sivil toplum için sürdürülebilir bir gelir kapısı yaratır."
                imageUrl="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop"
                imageHint="customer paying at store"
            />
            <AppleSection
                theme="dark"
                title="İyilik Hareketine Katıl."
                subtitle="Değişimin bir parçası ol."
                description="Hemen kaydol, profilini oluştur ve toplumsal fayda yaratmaya başla. Senin de yapabileceğin bir şey mutlaka var."
                cta1="Hemen Başla"
                cta1Href="/login/selection?action=register"
                imageUrl="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop"
                imageHint="team working together"
            />


            <PublicFooter currentPageLabel="Biz Kimiz?" />
        </div>
    );
}


