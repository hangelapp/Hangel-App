
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';

const InfoSection = ({ 
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


export default function SocialEntrepreneurshipPage() {
    const router = useRouter();
    const cms = useWebPage('social-entrepreneurship');

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Sosyal Girişimcilik</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
                        <Link href="/hangelassociation">hangel Derneği</Link>
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <InfoSection
                title={cms.title || 'Kârın Amacı: Toplumsal Fayda.'}
                subtitle={cms.subtitle || 'Sosyal Girişim Nedir?'}
                description={cms.description || 'Bir sosyal girişim, ticari faaliyetlerden elde ettiği geliri öncelikli olarak toplumsal veya çevresel bir sorunu çözmek için kullanan bir iş modelidir. Geleneksel şirketlerden farkı, kârı maksimize etmek yerine etkiyi maksimize etmesidir.'}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop'}
                imageHint="collaborative meeting brainstorming"
            />

            {/* Hangel Model */}
             <InfoSection 
                theme="dark"
                title="hangel Modeli: Etki Odaklı Ticaret."
                subtitle="Kâr Kilidi (Asset-Lock) Prensibi"
                description="hangel A.Ş. ana sözleşmesi gereği, elde edilen kârın minimum %85'ini sivil toplum ekosistemini güçlendirmek, teknolojik altyapıyı geliştirmek ve sosyal etki projelerine fon sağlamak için kullanır. Hissedarlarımıza kâr payı dağıtılmaz; tüm gelir, misyonumuzu gerçekleştirmek için yeniden yatırıma dönüşür."
                imageUrl="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop"
                imageHint="customer paying at store"
            />

            {/* Why Social Enterprise */}
            <InfoSection 
                title="Neden Sosyal Girişim?"
                subtitle="Sürdürülebilirlik ve Bağımsızlık"
                description="Sosyal girişim modeli, sadece bağışlara bağımlı kalmadan, kendi ekonomik değerini yaratarak ayakta kalmayı sağlar. Bu, uzun vadeli ve kalıcı çözümler üretebilmek için finansal bağımsızlık ve esneklik anlamına gelir."
                imageUrl="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop"
                imageHint="coins gold stack donation"
            />
            
            <PublicFooter currentPageLabel="Sosyal Girişimcilik" />
        </div>
    );
}
