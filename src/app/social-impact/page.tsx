'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, 
    ArrowLeft,
    TrendingUp,
    Target,
    Award,
    Heart,
    Zap,
    Users,
    Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ImpactSection = ({ 
    title, 
    subtitle, 
    stat,
    description, 
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    stat?: string,
    description?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-[85vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {stat && <p className="text-6xl md:text-8xl font-black tracking-tighter text-primary mt-2">{stat}</p>}
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

export default function SocialImpactPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Sosyal Etkimiz</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                        <Link href="/impact-story">Etkiyi Gör</Link>
                    </Button>
                </div>
            </header>

            {/* Total Reach */}
            <ImpactSection 
                title="Milyonlara Ulaştık."
                stat="1.2M+"
                subtitle="Hayata doğrudan dokunuş."
                description="Türkiye genelinde yürüttüğümüz projeler ve desteklediğimiz sivil toplum kuruluşları ile toplumsal kalkınmanın lokomotifi oluyoruz."
                imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                imageHint="happy group people support"
            />

            {/* Donation Value */}
            <ImpactSection 
                theme="dark"
                title="Sürdürülebilir Kaynak."
                stat="12.5M ₺"
                subtitle="Aktarılan toplam bağış hacmi."
                description="Alışverişi iyiliğe dönüştüren modelimizle, sivil toplumun finansal sürdürülebilirliğini sağlıyoruz. Ek ücret yok, sadece somut fayda var."
                imageUrl="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop"
                imageHint="coins gold stack donation"
            />

            {/* Volunteer Hours */}
            <ImpactSection 
                title="İmece Gücüyle."
                stat="500K+"
                subtitle="Tamamlanan gönüllülük saati."
                description="Zamanını ve yeteneklerini toplumsal sorunların çözümü için seferber eden dev gönüllü ordumuzla her sahada varız."
                imageUrl="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                imageHint="volunteers working together collaboration"
            />

            {/* SDG Goals */}
            <ImpactSection 
                theme="dark"
                title="Küresel Hedefler."
                subtitle="BM Sürdürülebilir Kalkınma Amaçları."
                description="Yoksullukla mücadeleden iklim eylemine kadar 17 temel hedefin 12'sinde aktif olarak projeler geliştiriyor ve destekliyoruz."
                imageUrl="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                imageHint="world connection data visualization"
            />

            {/* Detailed Footer */}
            <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-20 pb-12 px-4 sm:px-6">
                <div className="container mx-auto max-w-4xl space-y-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-black/10 pt-12">
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">Kurumsal</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/about" className="hover:underline">Biz Kimiz?</Link>
                                <Link href="/social-impact" className="hover:underline">Sosyal Etkimiz</Link>
                                <Link href="/press" className="hover:underline">Basın Odası</Link>
                                <Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">İşbirlikleri</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/merchant" className="hover:underline">Üye İşyeri</Link>
                                <Link href="/ngo-onboarding" className="hover:underline">STK Başvurusu</Link>
                                <Link href="/corporate" className="hover:underline">Kamu İşbirlikleri</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">Destek</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/support" className="hover:underline">Yardım Merkezi</Link>
                                <Link href="/feedback" className="hover:underline">Geri Bildirim</Link>
                                <Link href="/accessibility" className="hover:underline">Erişilebilirlik</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight">Yasal</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/settings/contracts" className="hover:underline">Politikalar</Link>
                                <Link href="/sitemap" className="hover:underline">Site Haritası</Link>
                            </nav>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <span className="font-bold text-xl tracking-tighter text-[#1d1d1f]">hangel A.Ş.</span>
                            </div>
                            <p className="text-[11px] text-[#86868b] max-w-xs leading-relaxed">
                                © 2024 hangel A.Ş. Etki Analiz Merkezi. Tüm hakları saklıdır.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
