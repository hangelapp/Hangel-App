
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const ProductSection = ({ 
    title, 
    subtitle, 
    description, 
    cta1 = "Daha Fazla Bilgi", 
    cta1Href = "#",
    cta2 = "Hemen Başvur", 
    cta2Href = "/login/selection?action=register",
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
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-screen flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={cta1Href} className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
                <Link href={cta2Href} className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                    {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
            </div>
        </div>
        
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
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

export default function CorporateShowcasePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Header / Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <div className="flex items-center gap-6 text-[12px] font-medium text-[#1d1d1f]/80">
                        <span className="hidden sm:inline">Kamu İşbirliği Programları</span>
                        <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register&type=corporate">Şimdi Katıl</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Belediyeler Bölümü */}
            <ProductSection 
                theme="dark"
                title="Belediyeler için."
                subtitle="Şehrinizdeki sosyal etkiyi dijitalleştirin."
                description="Vatandaş katılımını artırın, STK'ları güçlendirin ve akıllı şehir çözümlerini Hangel altyapısıyla entegre edin."
                cta1Href="/contact/municipalities"
                imageUrl="https://images.unsplash.com/photo-1577086664693-894d8405334a?q=80&w=2071&auto=format&fit=crop"
                imageHint="modern city hall building architecture"
            />

            {/* Üniversiteler Bölümü */}
            <ProductSection 
                title="Üniversiteler için."
                subtitle="Kampüsün değişim lideri olun."
                description="Öğrenci kulüplerinizi dijital yönetim araçlarıyla güçlendirin. Gönüllülüğü akademik kredi ve sertifikasyonla taçlandırın."
                cta1Href="/contact/universities"
                imageUrl="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                imageHint="university campus campus students"
            />

            {/* Fonlar Bölümü */}
            <ProductSection 
                theme="dark"
                title="Uluslararası Fonlar."
                subtitle="Ölçülebilir ve şeffaf yatırım."
                description="Türkiye'deki sivil toplum ekosistemine yatırım yapın. SROI analizi ve şeffaflık endeksi ile etkinizi verilerle takip edin."
                cta1Href="/contact/funds"
                imageUrl="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                imageHint="world map data visualization digital"
            />

            <PublicFooter currentPageLabel="Kamu İşbirlikleri" />
        </div>
    );
}
