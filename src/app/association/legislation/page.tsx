'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, ChevronRight, Briefcase, Landmark } from 'lucide-react';
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
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.1]">{title}</h2>
            <p className="text-xl md:text-3xl font-medium opacity-90">{subtitle}</p>
            <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed font-medium">{description}</p>
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
                <div className="container mx-auto px-6 max-w-5xl space-y-16">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">İstihdamda Yeni Norm.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <ShieldCheck className="h-12 w-12 text-primary" />
                            <h3 className="text-2xl font-bold">Etki Odaklı İstihdam</h3>
                            <p className="text-white/70 leading-relaxed font-medium">Gönüllülük faaliyetlerini 'Resmi Özgeçmiş' sayan işbirliği protokolünü Arçelik ile başlattık. İş dünyasında liyakati toplumsal fayda ile birleştiriyoruz.</p>
                        </div>
                        <div className="space-y-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <CheckCircle2 className="h-12 w-12 text-primary" />
                            <h3 className="text-2xl font-bold">Gönüllülük Kredisi</h3>
                            <p className="text-white/70 leading-relaxed font-medium">Toplum yararına çalışanların önceliklendirildiği bir liyakat sistemi hedefliyoruz. Gönüllülük, artık bir hobiden fazlası; bir iş tecrübesi.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-32 bg-[#f5f5f7] border-b border-black/5">
                <div className="container mx-auto px-6 max-w-4xl text-center space-y-12">
                    <div className="space-y-2">
                        <Landmark className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">Taslak Kapsamı.</h2>
                        <p className="text-lg text-muted-foreground font-medium">Meclis istişare sürecindeki 29 maddelik temel başlıklar.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { title: "Sosyal Şirket Tanımı", desc: "Sosyal fayda üreten işletmelerin yasal statüsünün belirlenmesi." },
                            { title: "Kâr Kilidi (Asset-Lock)", desc: "Elde edilen kârın misyona yeniden yatırım zorunluluğunun tescili." },
                            { title: "Sürdürülebilirlik Teşvikleri", desc: "Vergi indirimleri ve hibe kanallarının sosyal şirketlere açılması." },
                            { title: "Gönüllülük & İş Tecrübesi", desc: "Gönüllülük faaliyetlerinin yasal olarak iş deneyimi sayılması." },
                            { title: "Uluslararası Veri Transferi", desc: "Sosyal etki verilerinin sınır ötesi şeffaf paylaşım modeli." }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-8 bg-white rounded-[2rem] shadow-sm border border-black/5 hover:border-primary transition-all group text-left">
                                <div className="space-y-1">
                                    <span className="font-bold text-xl text-[#1d1d1f]">{item.title}</span>
                                    <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-32 bg-white text-center">
                <div className="container mx-auto px-6 max-w-2xl space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">Kurumsal İşbirliği.</h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                        İstihdam protokolü rehberimizi hazırladık. Kuruluşunuzun istihdam süreçlerini etki odaklı hale getirmek için bizimle iletişime geçin.
                    </p>
                    <Button asChild size="lg" className="rounded-full px-10 font-bold shadow-xl shadow-primary/20">
                        <Link href="/support">İletişime Geç <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
            </section>

            <PublicFooter currentPageLabel="Mevzuat Taslağı" />
        </div>
    );
}
