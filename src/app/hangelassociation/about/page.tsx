
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, ShoppingCart,
    HeartHandshake, Briefcase, Globe, Sparkles, type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';
import { useAssociationContent } from '@/hooks/use-site-content';
import { Badge } from '@/components/ui/badge';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[var(--sat)]">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/hangelassociation')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
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

type SectionHeadingProps = {
    badge: string;
    title: string;
    desc: string;
    centered?: boolean;
};

const SectionHeading = ({ badge, title, desc, centered = true }: SectionHeadingProps) => (
    <div className={cn("space-y-6 max-w-4xl", centered ? "mx-auto text-center" : "text-left")}>
        <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary", !centered && "mb-4")}>
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{badge}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.95]">{title}</h2>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
);

const FeatureBlock = ({ icon: Icon, title, desc, onClick }: { icon: LucideIcon, title: string, desc: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-6 text-center p-10 bg-muted rounded-[3rem] border border-border hover:bg-card hover:shadow-2xl transition-all duration-500 group w-full">
        <div className="p-5 bg-card rounded-3xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="h-10 w-10 text-primary group-hover:text-white" />
        </div>
        <h4 className="text-2xl font-bold text-foreground tracking-tight">{title}</h4>
        <p className="text-base text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </button>
);

export default function AssociationAboutPage() {
    const { toast } = useToast();
    const { get } = useAssociationContent();

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="about" />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-6 text-center bg-muted overflow-hidden">
                <div className="container mx-auto max-w-5xl space-y-12 relative z-10">
                    <SectionHeading
                        badge={get('about.heroBadge', 'BİZ KİMİZ?')}
                        title={get('about.heroTitle', 'Daha İyi Bir Dünya İçin Kolektif Bir Bilinç.')}
                        desc={get('about.heroDescription', 'Biz, dünyayı daha iyi bir yer haline getirme vizyonumuzu ve ideallerimizi paylaşan insanları dünyanın dört bir yanından bir araya getiriyoruz. Zorluklardan kaçmıyor, onları fırsata dönüştürmek için harekete geçiyoruz.')}
                    />
                    <div className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl mt-12 group">
                        <Image src={get('about.coverImageUrl', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')} alt="Team" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </div>
            </section>

            {/* Misyon & Vizyon */}
            <section className="py-32 px-6 border-b border-border">
                <div className="container mx-auto max-w-5xl space-y-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div className="space-y-8">
                            <div className="p-4 bg-primary/10 rounded-2xl w-fit"><Target className="h-8 w-8 text-primary" /></div>
                            <h3 className="text-4xl font-black tracking-tighter">{get('about.missionTitle', 'Misyonumuz.')}</h3>
                            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                                {get('about.missionDescription', 'hangel ve Social Business Global olarak misyonumuz; hayatın her kesiminden, kurum ve sivil toplumdan herkesin iyilik yapmaya katılabildiği adil ve kapsayıcı bir sistem inşa etmektir. Alışveriş yoluyla bağış, yetkinlik bazlı gönüllülük ve sosyal girişimcilik gibi yenilikçi modellerle sürdürülebilir dönüşüme hayat veriyoruz.')}
                            </p>
                        </div>
                        <div className="space-y-8">
                            <div className="p-4 bg-primary/10 rounded-2xl w-fit"><Globe className="h-8 w-8 text-primary" /></div>
                            <h3 className="text-4xl font-black tracking-tighter">{get('about.visionTitle', 'Küresel Ağ Hedefimiz.')}</h3>
                            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                                {get('about.visionDescription', 'Ulusal ve uluslararası paydaşlarımız ile hayata sosyal fayda odaklı bakan sosyal girişimcileri bir araya getirerek, birbirlerinden ilham almalarını sağlayacak doğal bir ağ oluşturuyoruz. Ülke temsilcilerimizi acıları yarıştırmadan, ortak sorunlara kolektif çözümler üretmek üzere birleştiriyoruz.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureBlock 
                            icon={ShoppingCart}
                            title="Alışverişle Bağış"
                            desc="Günlük harcamaları ek ücret ödemeden toplumsal faydaya dönüştüren modeller."
                            onClick={() => toast({ title: "Alışverişle Bağış", description: "hangel a.ş. altyapısıyla entegre modeller inceleniyor." })}
                        />
                        <FeatureBlock 
                            icon={HeartHandshake}
                            title="İmece Sistemi"
                            desc="Profesyonel becerilerin sivil toplumun ihtiyaçlarıyla eşleştiği yetenek bazlı gönüllülük."
                            onClick={() => toast({ title: "İmece Modülü", description: "Yetenek bazlı eşleştirme algoritmalarımız devrede." })}
                        />
                        <FeatureBlock 
                            icon={Briefcase}
                            title="Etki İstihdamı"
                            desc="Sosyal sorumluluk projelerini resmi özgeçmiş olarak tanıyan kurumsal protokoller."
                            onClick={() => toast({ title: "İstihdam Protokolü", description: "Arçelik ve diğer partnerlerimizle süreçler yürütülüyor." })}
                        />
                    </div>
                </div>
            </section>

            {/* Founder Profile - İsmail Hilmi ADIGÜZEL */}
            <section className="py-32 px-6 bg-black text-white overflow-hidden">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                            <Image src="https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080" alt="İsmail Hilmi ADIGÜZEL" fill className="object-cover" />
                        </div>
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <Badge className="bg-primary text-white border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">KURUCU LİDER</Badge>
                                <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">İsmail Hilmi ADIGÜZEL.</h3>
                                <p className="text-xl text-white/60 font-medium">Türkiye’nin sosyal girişimcilik, sivil toplum ve sosyal inovasyon alanlarında öncü ismi.</p>
                            </div>
                            <div className="space-y-6 text-lg text-white/80 font-medium leading-relaxed">
                                <p>2009 yılından bu yana 147 üniversitede örgütlenen sosyal projelerin mimarı olan ADIGÜZEL, 300'ün üzerinde konferans ile binlerce gence "Sistemli İyilik" vizyonunu aşıladı.</p>
                                <p>hangel.org ve Social Business Global Derneği'nin kurucu liderliğini yürüterek, bireylerin günlük aktivitelerini STK'lara kaynak aktarımına dönüştüren yenilikçi modelleri hayata geçirdi.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-primary tracking-tighter">300+</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Konferans</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-primary tracking-tighter">15K+</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Genç Etkileşimi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Neden Bölümü */}
            <section className="py-32 px-6 bg-background">
                <div className="container mx-auto max-w-4xl text-center space-y-12">
                    <SectionHeading 
                        badge="neden hangel?"
                        title="Birleştirici Bir Güç."
                        desc="hangel ve Social Business Global, yalnızca sosyal fayda bilincine sahip olmakla kalmayıp, kalıcı sosyal etki için aktif olarak çalışan çocuklar, gençler, iş insanları ve sivil toplum liderleri için bir köprüdür."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                        <div className="p-8 bg-muted rounded-[2.5rem] space-y-4 hover:shadow-xl transition-all">
                            <div className="p-3 bg-card rounded-xl w-fit shadow-sm"><Users className="h-6 w-6 text-primary" /></div>
                            <h4 className="text-xl font-bold">Kolektif Bilinç</h4>
                            <p className="text-sm text-muted-foreground font-medium">Halkın kendi sorunlarını yine kendi arasında paylaşarak imece usulüyle çözmesini sağlıyoruz.</p>
                        </div>
                        <div className="p-8 bg-muted rounded-[2.5rem] space-y-4 hover:shadow-xl transition-all">
                            <div className="p-3 bg-card rounded-xl w-fit shadow-sm"><Sparkles className="h-6 w-6 text-primary" /></div>
                            <h4 className="text-xl font-bold">Sosyal İnovasyon</h4>
                            <p className="text-sm text-muted-foreground font-medium">Üniversite, sanayi ve sivil toplum kuruluşları ile yürütülen araştırmalarla sürdürülebilir modeller geliştiriyoruz.</p>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Hakkında" />
        </div>
    );
}

