
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Zap, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';

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
    const cms = useWebPage('social-impact');

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Sürdürülebilirlik</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                        <Link href="/impact-story">Etkiyi Gör</Link>
                    </Button>
                </div>
            </header>

            {/* Total Reach */}
            <ImpactSection
                title={cms.title || 'Milyonlara Ulaştık.'}
                stat="1.2M+"
                subtitle={cms.subtitle || 'Hayata doğrudan dokunuş.'}
                description={cms.description || 'Türkiye genelinde yürüttüğümüz projeler ve desteklediğimiz sivil toplum kuruluşları ile toplumsal kalkınmanın lokomotifi oluyoruz.'}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop'}
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

            <section className="py-24 bg-[#f5f5f7]">
                <div className="container mx-auto px-6 max-w-4xl space-y-12">
                    <div className="text-center space-y-3">
                        <h2 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">Raporlarımız</h2>
                        <p className="text-lg text-muted-foreground">Şeffaflık ilkemiz gereği, etkimizi düzenli olarak raporluyoruz.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { year: '2026', link: '#' },
                            { year: '2025', link: '#' },
                            { year: '2024', link: '#' },
                        ].map((report) => (
                            <div key={report.year} className="flex flex-col items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border hover:border-primary transition-all">
                                <FileText className="h-10 w-10 text-primary" />
                                <div className="text-center">
                                    <h3 className="font-bold text-lg">{report.year} Sürdürülebilirlik Raporu</h3>
                                    <p className="text-xs text-muted-foreground">PDF - 5.2MB</p>
                                </div>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={report.link}>İndir <Download className="h-4 w-4 ml-2"/></Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Sürdürülebilirlik" />
        </div>
    );
}
