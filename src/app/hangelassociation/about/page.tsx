'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Target, Users, ShieldCheck, Heart, Globe, Rocket, BookOpen, GraduationCap, Scale, Sparkles, ShoppingCart, HeartHandshake, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';

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

const FeatureBlock = ({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-4 text-center p-8 bg-[#f5f5f7] rounded-[2.5rem] border border-black/5 hover:bg-white hover:shadow-xl transition-all group w-full">
        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="h-8 w-8 text-primary group-hover:text-white" />
        </div>
        <h4 className="text-xl font-bold text-[#1d1d1f] tracking-tight">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </button>
);

export default function AssociationAboutPage() {
    const { toast } = useToast();

    const handleModelClick = () => {
        toast({
            title: "Sosyal İnovasyon Modelleri",
            description: "Sürdürülebilir kalkınma modellerimiz hakkında detaylı bilgiye yakında buradan ulaşabileceksiniz.",
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="about" />

            {/* Hero */}
            <AppleSection 
                title="Daha İyi Bir Dünya."
                subtitle="Hayal gücü ile eylemin kesişiminde."
                description="Biz, dünyayı daha iyi bir yer haline getirme vizyonumuzu ve ideallerimizi paylaşan insanları dünyanın dört bir yanından bir araya getiriyoruz. Zorluklardan kaçmıyor, onları fırsata dönüştürmek için harekete geçiyoruz."
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students working together library"
            />

            {/* Mission Section */}
            <section className="py-32 bg-white border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Misyonumuz.</h2>
                        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                            Hangel ve Social Business Global olarak misyonumuz; hayatın her kesiminden herkesin iyilik yapmaya katılabildiği adil ve kapsayıcı bir sistem inşa etmektir. İyiliği kolaylaştırmanın, birlikte daha iyi bir geleceği şekillendirmenin ilk adımı olduğuna inanıyoruz.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureBlock 
                            icon={ShoppingCart}
                            title="Alışverişle Bağış"
                            desc="Günlük harcamaları ek ücret ödemeden toplumsal faydaya dönüştüren modeller."
                            onClick={() => toast({ title: "Alışverişle Bağış", description: "Hangel A.Ş. altyapısıyla entegre modellerimiz inceleniyor." })}
                        />
                        <FeatureBlock 
                            icon={HeartHandshake}
                            title="Yetenek Bazlı Gönüllülük"
                            desc="Profesyonel becerilerin sivil toplumun ihtiyaçlarıyla eşleştiği bir imece sistemi."
                            onClick={() => toast({ title: "İmece Modülü", description: "Yetenek bazlı eşleştirme algoritmalarımız güncelleniyor." })}
                        />
                        <FeatureBlock 
                            icon={Briefcase}
                            title="Etki Odaklı İstihdam"
                            desc="Sosyal sorumluluk projelerini resmi özgeçmiş olarak tanıyan iş birliği protokolleri."
                            onClick={() => toast({ title: "İstihdam Protokolü", description: "Arçelik ve diğer partnerlerimizle olan süreçler detaylandırılıyor." })}
                        />
                    </div>
                </div>
            </section>

            {/* Global Network Section */}
            <section className="bg-black text-white py-32 text-center overflow-hidden">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white mb-8">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Küresel Ağ Hedefimiz</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8">Acıları Yarıştırmadan.</h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-medium max-w-4xl mx-auto mb-20">
                        Ulusal ve uluslararası paydaşlarımız ile sosyal girişimcileri bir araya getirerek, birbirlerinden ilham almalarını ve birbirlerini desteklemelerini sağlayacak doğal bir ağ oluşturuyoruz. Benzer sorunlarla karşılaşan farklı kültürlerin, kolektif güçle çok daha etkili çözümler üreteceğine inanıyoruz.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">54</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ülke</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">120</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Partner</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">42</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Üniversite</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-6xl font-black tracking-tighter text-primary">17</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Belediye</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why SBG Section */}
            <AppleSection 
                title="Neden hangel?"
                subtitle="Birleştirici bir güç."
                description="SOCIAL BUSINESS GLOBAL, kolektif bilinçle toplumsal fayda bilincinin yanı sıra toplumsal etki için çalışan çocuklar, gençler, iş insanları ve sivil toplum liderleri için birleştirici bir güç olarak hizmet vermektedir."
                imageUrl="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
                imageHint="collaborative business meeting"
            />

            {/* Social Innovation Section */}
            <section className="py-32 bg-[#f5f5f7] border-b border-black/5">
                <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8 text-left">
                        <div className="p-3 bg-primary/10 rounded-2xl w-fit">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Sosyal İnovasyon.</h2>
                        <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                            Üniversite, sanayi, iş dünyası ve Sivil Toplum kuruluşları ile yürütülen araştırma projeleri ile sürdürülebilir sosyal girişim modelleri geliştiriyoruz. Sosyal girişim start-up şirketlerin desteklenmesine ve sayılarının artmasına zemin hazırlıyoruz.
                        </p>
                        <Button className="rounded-full px-8 h-12 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleModelClick}>Modelleri İncele</Button>
                    </div>
                    <div className="flex-1 relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                        <Image src="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop" alt="Innovation" fill className="object-cover" data-ai-hint="team collaborating meeting" />
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Hakkında" />
        </div>
    );
}
