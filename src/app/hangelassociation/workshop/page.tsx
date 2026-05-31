
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Database, 
    BookOpen, Library, GraduationCap,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAssociationContent } from '@/hooks/use-site-content';

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
                <div className="w-20" />
            </div>
        </header>
    );
};

type MetricSectionProps = {
    title: string;
    stat: string;
    subtitle: string;
    desc: string;
    image: string;
    theme?: 'light' | 'dark';
};

const MetricSection = ({ title, stat, subtitle, desc, image, theme = 'light' }: MetricSectionProps) => (
    <section className={cn(
        "relative min-h-screen flex flex-col items-center pt-32 text-center border-b border-black/5 overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-8 px-6 max-w-5xl">
            <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">{title}</h2>
                <p className="text-7xl md:text-[10rem] font-black tracking-tighter text-primary drop-shadow-2xl">{stat}</p>
            </div>
            <div className="space-y-4">
                <p className="text-2xl md:text-4xl font-bold opacity-90 leading-tight">{subtitle}</p>
                <p className="text-lg md:text-xl opacity-70 max-w-3xl mx-auto leading-relaxed font-medium">{desc}</p>
            </div>
        </div>
        <div className="relative w-full flex-1 flex items-end justify-center mt-16 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl transition-transform duration-1000 hover:scale-[1.02]">
                <Image src={image} alt={title} fill className="object-cover" />
            </div>
        </div>
    </section>
);

export default function AssociationWorkshopPage() {
    const { toast } = useToast();
    const { get } = useAssociationContent();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="workshop" />

            <MetricSection
                title={get('workshop.title', 'Sınırları Aşan Diyalog.')}
                stat="54"
                subtitle={get('workshop.subtitle', 'Farklı ülkeden vizyoner katılımcı.')}
                desc={get('workshop.description', "Uluslararası Sosyal Girişimcilik Çalıştayı, 4 yıldır küresel sorunlara kolektif çözümler üretmek için dünyayı Türkiye'de buluşturuyor. İstanbul, Mersin, İzmir ve Tunceli'de düzenlenen oturumlarda sosyal etki modellerini tartıştık.")}
                image={get('workshop.coverImageUrl', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')}
            />

            {/* Big Data Section */}
            <section className="py-32 bg-[#f5f5f7] border-b border-black/5">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8 text-left">
                            <Database className="h-16 w-16 text-primary" />
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1d1d1f]">Sosyal Girişim Big Data.</h2>
                            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                                54 ülkeden 632 sosyal girişimi detaylıca inceledik ve raporladık. Bu verileri 'Big Data' formatında tüm sosyal girişimcilerin kullanımına sunuyoruz. Bilginin paylaşıldıkça çoğaldığına inanıyoruz.
                            </p>
                            <Button className="rounded-full px-10 h-14 font-black bg-primary hover:bg-primary/90 text-lg shadow-xl shadow-primary/20" onClick={() => toast({ title: "Veri Portalı", description: "Big Data erişim paneli yetkilendirme sonrası açılacaktır." })}>Veriye Eriş</Button>
                        </div>
                        <div className="relative p-12 bg-white rounded-[3.5rem] shadow-2xl border border-black/5 text-center group">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white font-black shadow-xl group-hover:scale-110 transition-transform">632</div>
                            <p className="text-9xl font-black tracking-tighter text-[#1d1d1f] mb-4">632</p>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">İNCELENEN SOSYAL GİRİŞİM</p>
                        </div>
                    </div>
                </div>
            </section>

            <MetricSection 
                theme="dark"
                title="Akademik Öncülük."
                stat="421"
                subtitle="Uluslararası akademik katılımcı."
                desc="Mersin Üniversitesi işbirliği ile Türkiye'nin ilk, dünyanın 27. Sosyal Girişimcilik Yüksek Lisans programına ilham verdik. Polonya Bilim ve Teknoloji Üniversitesi de çalışmalarımızı temel alarak kendi programını hayata geçirdi."
                image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
            />

            {/* Girişimcilik Kütüphanesi */}
            <section className="py-32 bg-white border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl text-center space-y-20">
                    <div className="space-y-6">
                        <Library className="h-16 w-16 text-primary mx-auto mb-6" />
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[#1d1d1f]">Girişimcilik Kütüphanesi.</h2>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                            21 girişimcilik merkezinde kurulumuna başladığımız kütüphane ağıyla, bilgi ve tecrübe temelli yol haritaları sunuyoruz.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "İTO BTM", desc: "İstanbul Ticaret Odası Bilgiyi Ticarileştirme Merkezi bünyesinde.", logo: "https://www.google.com/s2/favicons?domain=btm.istanbul&sz=128" },
                            { name: "Girişim360", desc: "Batman İl Milli Eğitim Müdürlüğü Sosyal Girişimcilik Merkezi'nde.", logo: "https://picsum.photos/seed/batman360/200/200" },
                            { name: "Denizakvaryum", desc: "Denizbank inovasyon merkezi işbirliği ile girişimcilere açık.", logo: "https://www.google.com/s2/favicons?domain=denizbank.com&sz=128" }
                        ].map((partner, i) => (
                            <button key={i} onClick={() => toast({ title: partner.name, description: "Kütüphane kayıt ve kitap paylaşım modülü yükleniyor." })} className="p-10 bg-[#f5f5f7] rounded-[3rem] text-left space-y-6 hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-black/5 group">
                                <Avatar className="h-16 w-16 bg-white p-2 border shadow-sm group-hover:scale-110 transition-transform">
                                    <AvatarImage src={partner.logo} className="object-contain" />
                                    <AvatarFallback><Library /></AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <h4 className="font-black text-2xl tracking-tight">{partner.name}</h4>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{partner.desc}</p>
                                </div>
                                <div className="pt-4 flex items-center text-primary font-bold text-xs uppercase tracking-widest">
                                    Kütüphaneyi Keşfet <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-32 bg-[#f5f5f7] text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-20">
                    <div className="space-y-6">
                        <GraduationCap className="h-16 w-16 text-primary mx-auto mb-6" />
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[#1d1d1f]">Bilimsel Destek.</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                        <div className="p-12 bg-white rounded-[3.5rem] space-y-6 shadow-xl border border-black/5 group hover:bg-primary transition-colors duration-500">
                            <BookOpen className="h-10 w-10 text-primary group-hover:text-white transition-colors" />
                            <h3 className="text-3xl font-black tracking-tight group-hover:text-white">YÖK Onaylı Müfredat</h3>
                            <p className="text-base text-muted-foreground group-hover:text-white/80 leading-relaxed font-medium transition-colors">Maltepe Üniversitesi'nde hazırladığımız 'Uygulamalı Sosyal Girişimcilik' dersi YÖK onayıyla genel müfredata girerek tüm bölümlere açıldı.</p>
                            <Button variant="link" className="p-0 text-primary font-black uppercase text-xs tracking-widest group-hover:text-white" onClick={() => toast({ title: "Müfredat Detayı", description: "Ders içeriği hazırlanıyor." })}>İçeriği Gör</Button>
                        </div>
                        <div className="p-12 bg-white rounded-[3.5rem] space-y-6 shadow-xl border border-black/5 group hover:bg-primary transition-colors duration-500">
                            <Rocket className="h-10 w-10 text-primary group-hover:text-white transition-colors" />
                            <h3 className="text-3xl font-black tracking-tight group-hover:text-white">Tez ve Kaynak Desteği</h3>
                            <p className="text-base text-muted-foreground group-hover:text-white/80 leading-relaxed font-medium transition-colors">2 Doktora, 3 Yüksek Lisans tezi ve 2 akademik makaleye veri ve kaynak desteği sağlayarak sivil toplum literatürünü güçlendirdik.</p>
                            <Button variant="link" className="p-0 text-primary font-black uppercase text-xs tracking-widest group-hover:text-white" onClick={() => toast({ title: "Akademik Destek", description: "Yayın listesi hazırlanıyor." })}>Yayınları Listele</Button>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Uluslararası Çalıştay" />
        </div>
    );
}
