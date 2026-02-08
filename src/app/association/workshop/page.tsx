'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Globe, Users, Target, Rocket } from 'lucide-react';
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
                    <Link href="/association/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Hakkında</Link>
                    <Link href="/association/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Etkinlikler</Link>
                    <Link href="/association/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/association/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <div className="w-20" />
            </div>
        </header>
    );
};

const ShowcaseSection = ({ title, subtitle, stat, description, image, hint, theme = 'light' }: any) => (
    <section className={cn(
        "relative min-h-screen flex flex-col items-center pt-32 text-center border-b border-black/5 overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-6 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {stat && <p className="text-6xl md:text-9xl font-black tracking-tighter text-primary">{stat}</p>}
            <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>
            <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>
        </div>
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl">
                <Image src={image} alt={title} fill className="object-cover" data-ai-hint={hint} />
            </div>
        </div>
    </section>
);

export default function AssociationWorkshopPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="workshop" />

            <ShowcaseSection 
                title="Sınırları Aşan Diyalog."
                stat="54"
                subtitle="Farklı ülkeden vizyoner liderler."
                description="Uluslararası Sosyal Girişimcilik Çalıştayı, 4 yıldır küresel sorunlara kolektif çözümler üretmek için dünyayı Türkiye'de buluşturuyor."
                image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                hint="diverse group of international students"
            />

            <ShowcaseSection 
                theme="dark"
                title="Akademik Derinlik."
                stat="421"
                subtitle="Uluslararası katılımcı ve rapor."
                description="İstanbul, Mersin, İzmir ve Tunceli etaplarında disiplinler arası bilgi paylaşımı ve saha temelli öğrenme modelleri geliştirildi."
                image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
                hint="meeting room discussion"
            />

            <section className="py-32 bg-[#f5f5f7] text-center border-b border-black/5">
                <div className="container mx-auto px-6 max-w-4xl space-y-12">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Çalıştay Çıktıları.</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                        <div className="p-10 bg-white rounded-[2.5rem] shadow-sm space-y-4">
                            <Rocket className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">Akademik Öncülük</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Mersin Üniversitesi işbirliği ile Türkiye'nin ilk, dünyanın 27. Sosyal Girişimcilik Yüksek Lisans programına ilham verdik.</p>
                        </div>
                        <div className="p-10 bg-white rounded-[2.5rem] shadow-sm space-y-4">
                            <Target className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">Büyük Veri</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">54 ülkeden 632 sosyal girişim incelenerek raporlandı ve girişimcilerin kullanımına sunulan 'Big Data' altyapısı oluşturuldu.</p>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Uluslararası Çalıştay" />
        </div>
    );
}
