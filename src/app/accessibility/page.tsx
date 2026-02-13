
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const A11ySection = ({ 
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
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
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

export default function AccessibilityPublicPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Erişilebilirlik</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                        <Link href="/settings/accessibility">Ayarları Aç</Link>
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <A11ySection 
                title="Herkes İçin Tasarlandı."
                subtitle="İyilikte engel tanımaz."
                description="Teknoloji, ancak herkes tarafından kullanılabildiğinde gerçek bir değer taşır. Platformumuzu en yüksek erişilebilirlik standartlarında tutmak önceliğimiz."
                imageUrl="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                imageHint="inclusive design abstract concept"
            />

            {/* Visuals */}
            <A11ySection 
                theme="dark"
                title="Görmek Değil, Hissetmek."
                subtitle="Ekran okuyucu ve yüksek kontrast desteği."
                description="Az gören veya görme engelli kullanıcılarımız için tüm arayüz bileşenlerini ARIA standartlarında yapılandırdık. Renk körlüğü filtreleri ve ayarlanabilir metin boyutlarıyla tam kontrol sizde."
                imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                imageHint="high contrast accessibility icons"
            />

            {/* Cognitive */}
            <A11ySection 
                title="Zihin Dostu Deneyim."
                subtitle="Disleksi ve dikkat odaklı araçlar."
                description="Bilişsel zorluklar yaşayan kullanıcılarımız için sadeleştirilmiş görünüm ve özel yazı tipleri sunuyoruz. Animasyonları azaltarak daha odaklı ve sakin bir deneyim sağlıyoruz."
                imageUrl="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                imageHint="minimalist clean code logic"
            />

            <PublicFooter currentPageLabel="Erişilebilirlik" />
        </div>
    );
}
