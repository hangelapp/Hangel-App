'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Target, Users, ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/association/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/association/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                    <Link href="/association/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/association/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

const AppleSection = ({ 
    title, 
    subtitle, 
    description, 
    theme = 'light',
    imageUrl,
    imageHint,
    className,
    children
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    theme?: 'light' | 'dark',
    imageUrl?: string,
    imageHint?: string,
    className?: string,
    children?: React.ReactNode
}) => (
    <section className={cn(
        "relative min-h-[85vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            {children}
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

export default function AssociationAboutPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="about" />

            {/* Hero */}
            <AppleSection 
                title="Bir Fikirle Başladı."
                subtitle="Şimdi bir etki hareketiyiz."
                description="Social Business Global Derneği (SBG), sosyal fayda üreten yapıların sayısını artırmayı, etkilerini derinleştirmeyi ve süreklilik temelinde uluslararası bir sosyal dönüşüm ekosistemi kurmayı amaçlar."
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students working together library"
            />

            {/* Mission */}
            <AppleSection 
                theme="dark"
                title="Misyonumuz Sosyal Kalkınma."
                description="Sosyal girişimciliği ekonomik bir modelin ötesinde, insan onurunu ve kolektif bilinci temel alan bir dönüşüm hareketi olarak görüyoruz. Halkın kendi sorunlarını imece usulüyle çözümlemesini destekliyoruz."
                imageUrl="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                imageHint="volunteers holding hands"
            />

            {/* Metrics */}
            <section className="bg-[#f5f5f7] py-32 text-center border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-20 text-[#1d1d1f]">Rakamlarla 5 Yıl.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">54</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Ülke Katılımı</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">632</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">İncelenen Girişim</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">15K+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Doğrudan Erişim</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">126</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60">Etkinlik & Konferans</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision */}
            <AppleSection 
                title="Küresel Bir Sosyal Etki Ağı."
                subtitle="Türkiye'den dünyaya yayılan bir model."
                description="Türkiye merkezli, etik değerler temelinde kurumsallaşmış ve farklı ülkelerde temsilciliklerle genişleyen bütüncül bir ekosistem kurmak için çalışıyoruz."
                imageUrl="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                imageHint="network graph global connections"
            />

            <PublicFooter currentPageLabel="Dernek Hakkında" />
        </div>
    );
}
