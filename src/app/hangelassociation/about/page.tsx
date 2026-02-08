'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Target, Users, ShieldCheck, Heart, Globe, Rocket, BookOpen, GraduationCap, Scale } from 'lucide-react';
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
                <Button onClick={() => router.push('/hangelassociation')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
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
            {description && <p className="text-sm md:text-lg opacity-70 max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>}
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

const FeatureBlock = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex flex-col items-center gap-4 text-center p-8 bg-[#f5f5f7] rounded-[2.5rem] border border-black/5 hover:bg-white hover:shadow-xl transition-all group">
        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="h-8 w-8 text-primary group-hover:text-white" />
        </div>
        <h4 className="text-xl font-bold text-[#1d1d1f] tracking-tight">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </div>
);

export default function AssociationAboutPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="about" />

            {/* Hero */}
            <AppleSection 
                title="Bir Toplumsal Uyanış."
                subtitle="Sosyal girişimcilik, ekonomik modelin ötesindedir."
                description="Social Business Global Derneği (SBG), yerel girişimleri uluslararası bir ağa taşıyan, sosyal fayda üreten yapıların etkisini derinleştiren bir sosyal dönüşüm ekosistemidir."
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students working together library"
            />

            {/* Misyonumuz Detay */}
            <section className="py-32 bg-white border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Misyonumuz Sosyal Kalkınma.</h2>
                        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                            Ekonomik kalkınmadan ziyade sosyal kalkınmanın daha önemli olduğuna inanıyoruz. Halkın kendi sorunlarını kolektif bir bilinç ve imece usulüyle çözümlemesini destekliyoruz.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureBlock 
                            icon={Rocket}
                            title="Etki Kapasitesi"
                            desc="Mevcut sosyal girişimlerin sosyal fayda üretim gücünü artırıyor ve ölçümlüyoruz."
                        />
                        <FeatureBlock 
                            icon={Users}
                            title="Kolektif Bilinç"
                            desc="Gençleri, akademiyi ve sivil toplumu aynı masa etrafında buluşturan katılımcı modeller kuruyoruz."
                        />
                        <FeatureBlock 
                            icon={Scale}
                            title="Etik Standartlar"
                            desc="Sosyal şirket farkındalığını toplumun her kesimine yayarak şeffaf bir ticaret ekosistemi hedefliyoruz."
                        />
                    </div>
                </div>
            </section>

            {/* Rakamlarla 5 Yıl */}
            <section className="bg-black text-white py-32 text-center overflow-hidden">
                <div className="container mx-auto px-6 max-w-6xl">
                    <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-20">Etkimizin Kanıtı Rakamlar.</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                        <div className="space-y-2">
                            <p className="text-6xl md:text-8xl font-black tracking-tighter text-primary">54</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ülke Katılımı</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl md:text-8xl font-black tracking-tighter text-primary">632</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Raporlanan Girişim</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl md:text-8xl font-black tracking-tighter text-primary">421</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Uluslararası Lider</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl md:text-8xl font-black tracking-tighter text-primary">15K+</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Doğrudan Erişim</p>
                        </div>
                    </div>
                    <p className="text-white/40 text-sm font-medium italic">"Sadece geçmişi anlatmıyor, geleceğe bir sosyal miras bırakıyoruz."</p>
                </div>
            </section>

            {/* Gönüllüler ve Akademi */}
            <section className="py-32 bg-[#f5f5f7] border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8 text-left">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">İyilik, Bilgiyle Büyür.</h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <GraduationCap className="h-6 w-6 text-primary mt-1" />
                                <div>
                                    <p className="font-bold text-xl">12 Akademisyen</p>
                                    <p className="text-muted-foreground text-sm font-medium">Stratejik danışmanlık ve bilimsel veri desteği sağlayan akademik kurulumuz.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Users className="h-6 w-6 text-primary mt-1" />
                                <div>
                                    <p className="font-bold text-xl">21 Üniversite Temsilcisi</p>
                                    <p className="text-muted-foreground text-sm font-medium">Kampüslerde sosyal etkiyi örgütleyen genç liderler ağımız.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <ShieldCheck className="h-6 w-6 text-primary mt-1" />
                                <div>
                                    <p className="font-bold text-xl">13 Farklı Branş</p>
                                    <p className="text-muted-foreground text-sm font-medium">Hukuktan lojistiğe, tasarımdan mühendisliğe saha desteği veren profesyonel gönüllü ekibimiz.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                        <Image src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" alt="Team" fill className="object-cover" data-ai-hint="team collaborating meeting" />
                    </div>
                </div>
            </section>

            {/* Bilimsel Destek ve Kaynaklar */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-6 max-w-4xl text-center space-y-12">
                    <BookOpen className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">Literatüre Katkı Sağlıyoruz.</h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                        Akademik ve bilimsel araştırmalara aracılık ediyoruz. Sosyal girişimcilik kaynaklarımız ve veri setlerimizle; <strong>2 Doktora</strong>, <strong>3 Yüksek Lisans</strong> tezi ve <strong>2 Akademik makalenin</strong> yazımına doğrudan kaynak desteği sağladık.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div className="p-6 bg-[#f5f5f7] rounded-3xl text-left border border-black/5">
                            <p className="text-primary font-black text-xs uppercase tracking-widest mb-2">Mersin Üniversitesi</p>
                            <p className="text-sm font-bold">Dünyanın 27., Türkiye'nin ilk Sosyal Girişimcilik Yüksek Lisans programı.</p>
                        </div>
                        <div className="p-6 bg-[#f5f5f7] rounded-3xl text-left border border-black/5">
                            <p className="text-primary font-black text-xs uppercase tracking-widest mb-2">Maltepe Üniversitesi</p>
                            <p className="text-sm font-bold">YÖK onaylı 'Uygulamalı Sosyal Girişimcilik' dersinin genel müfredata girişi.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Finansal Şeffaflık */}
            <AppleSection 
                theme="dark"
                title="Şeffaf Kaynak Yönetimi."
                subtitle="Her bir kuruşun toplumsal faydaya yolculuğu."
                description="Kethüda Hamamı sergi geliri olan 2.000.000 TL ve Uluslararası Kitipto Network Derneği'nden gelen 480.000 TL bağışın tamamı, Hatay Örnek Köy Projesi'ne aktarılarak şeffaf bir şekilde raporlanmıştır."
                imageUrl="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop"
                imageHint="coins gold stack donation"
            />

            <PublicFooter currentPageLabel="Dernek Hakkında" />
        </div>
    );
}
