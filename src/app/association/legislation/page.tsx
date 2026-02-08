'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
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

const DetailSection = ({ title, subtitle, description, image, hint, theme = 'light' }: any) => (
    <section className={cn(
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center border-b border-black/5 overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
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

export default function AssociationLegislationPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="legislation" />

            <DetailSection 
                title="Geleceği Yasallaştırdık."
                subtitle="29 Maddelik Sosyal Girişimcilik Kanun Teklifi."
                description="Sosyal fayda ve sürdürülebilirlik odaklı kanun teklifimiz; İçişleri, Hazine ve Maliye ile Ticaret Bakanlıkları nezdinde istişare sürecine girdi."
                image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                hint="legal documents verify concept"
            />

            <section className="py-32 bg-black text-white text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-16">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">İstihdamda Yeni Norm.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-4">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                            <h3 className="text-2xl font-bold">Etki Odaklı İstihdam</h3>
                            <p className="text-muted-foreground leading-relaxed">Gönüllülük faaliyetlerini 'Resmi Özgeçmiş' sayan işbirliği protokolünü hazırladık. Arçelik ile başlattığımız bu model, iş dünyasında kolektif bilinci önceliyor.</p>
                        </div>
                        <div className="space-y-4">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                            <h3 className="text-2xl font-bold">Gönüllülük Kredisi</h3>
                            <p className="text-muted-foreground leading-relaxed">Gönüllülük çalışmalarının toplum yararına çalışanların önceliklendirildiği bir liyakat sistemi haline gelmesi vizyonumuzun temelidir.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-32 bg-[#f5f5f7] border-b border-black/5">
                <div className="container mx-auto px-6 max-w-3xl text-center space-y-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">Taslak Kapsamı.</h2>
                    <div className="space-y-4">
                        {[
                            "Sosyal şirket tanımının yasal zemine oturtulması",
                            "Sürdürülebilirlik odaklı vergi teşvik modelleri",
                            "Gönüllülük faaliyetlerinin iş tecrübesi sayılması",
                            "Uluslararası temsilcilik ve sosyal veri transferi",
                            "Kâr kilitli asset-lock mekanizmasının tescili"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-black/5 hover:border-primary transition-colors">
                                <span className="font-bold text-[#1d1d1f]">{item}</span>
                                <ChevronRight className="h-5 w-5 text-primary" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Mevzuat Taslağı" />
        </div>
    );
}
