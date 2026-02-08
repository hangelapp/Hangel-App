'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Globe, Users, Heart, ShieldCheck, Newspaper, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const AssociationHeader = ({ currentPage }: { currentPage?: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Platforma Dön
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                    <Link href="/hangelassociation/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/hangelassociation/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

const FeatureCard = ({ title, subtitle, href, image, hint, theme = 'light' }: any) => (
    <Link href={href} className="group relative block w-full aspect-square md:aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-xl border border-black/5">
        <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" data-ai-hint={hint} />
        <div className={cn(
            "absolute inset-0 p-8 md:p-12 flex flex-col justify-end",
            theme === 'dark' ? "bg-black/20" : "bg-white/10"
        )}>
            <div className="relative z-10 space-y-2">
                <h3 className={cn("text-3xl md:text-5xl font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-[#1d1d1f]")}>{title}</h3>
                <p className={cn("text-lg md:text-xl font-medium opacity-90 flex items-center", theme === 'dark' ? "text-white/80" : "text-[#1d1d1f]/80")}>
                    {subtitle} <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </p>
            </div>
        </div>
    </Link>
);

export default function AssociationHomePage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 text-center space-y-6 overflow-hidden">
                <div className="container mx-auto max-w-5xl space-y-6">
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#1d1d1f] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        5 Yıl Önce Bir Fikirle Başladık. <br /> Şimdi Bir Etki Hareketiyiz.
                    </h1>
                    <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                        Social Business Global (SBG), sosyal girişimciliği Türkiye'den dünyaya yayılan küresel bir modele dönüştürüyor.
                    </p>
                </div>
            </section>

            {/* Stats Highlight */}
            <section className="bg-[#f5f5f7] py-20 border-y border-black/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <div className="text-center">
                            <p className="text-4xl md:text-6xl font-black tracking-tighter text-primary">54</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60 mt-2">Ülke Katılımı</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl md:text-6xl font-black tracking-tighter text-primary">126</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60 mt-2">Etkinlik</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl md:text-6xl font-black tracking-tighter text-primary">632</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60 mt-2">Raporlanan Girişim</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl md:text-6xl font-black tracking-tighter text-primary">15K+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d1d1f]/60 mt-2">Doğrudan Erişim</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hub Grid */}
            <section className="container mx-auto px-6 py-24 max-w-6xl space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <FeatureCard 
                        title="Dernek Hakkında"
                        subtitle="Vizyonumuzu ve misyonumuzu keşfedin"
                        href="/hangelassociation/about"
                        image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                        hint="team working together"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FeatureCard 
                            title="Dernek Etkinlikleri"
                            subtitle="Sahadaki etkimizi izleyin"
                            href="/hangelassociation/events"
                            image="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop"
                            hint="charity event volunteer"
                            theme="dark"
                        />
                        <FeatureCard 
                            title="Uluslararası Çalıştay"
                            subtitle="Sınırları aşan diyalog"
                            href="/hangelassociation/workshop"
                            image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                            hint="international meeting"
                        />
                    </div>
                    <FeatureCard 
                        title="Mevzuat Taslağı"
                        subtitle="Geleceği yasallaştırıyoruz"
                        href="/hangelassociation/legislation"
                        image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                        hint="legal documents"
                        theme="dark"
                    />
                </div>
            </section>

            {/* Quote Section */}
            <section className="bg-black text-white py-32 text-center border-b border-white/5">
                <div className="container mx-auto px-6 max-w-4xl space-y-8">
                    <Heart className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Dayanışmayla Büyür.</h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-medium">
                        "Bir toplumun gücü, en savunmasız anlarda gösterdiği dayanışma ile ölçülür. Bir fikirle başlar, dayanışmayla büyür, vizyonla dünya değişir."
                    </p>
                    <div className="pt-8">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 text-lg shadow-2xl shadow-primary/20">
                            <Link href="/login/selection?action=register">Hemen Katıl <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="hangel Derneği" />
        </div>
    );
}
