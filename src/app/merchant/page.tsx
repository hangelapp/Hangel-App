'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    Zap, 
    TrendingUp, 
    Handshake, 
    QrCode, 
    ShieldCheck, 
    Users, 
    ArrowLeft, 
    ChevronRight, 
    LayoutGrid, 
    Sparkles, 
    Store,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const AdvantageCard = ({ 
    title, 
    description, 
    icon: Icon, 
    className,
    isLarge = false,
    image
}: { 
    title: string, 
    description: string, 
    icon: any, 
    className?: string,
    isLarge?: boolean,
    image?: string
}) => (
    <div className={cn(
        "group relative flex flex-col bg-white rounded-[2.5rem] p-8 transition-all hover:shadow-2xl border border-black/5 overflow-hidden",
        isLarge ? "md:col-span-2 min-h-[450px] justify-between" : "min-h-[300px] justify-start",
        className
    )}>
        {image && (
            <div className="absolute inset-0 z-0">
                <Image src={image} alt={title} fill className="object-cover opacity-10 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>
        )}
        <div className="relative z-10">
            <div className={cn(
                "rounded-2xl flex items-center justify-center mb-6 transition-colors",
                isLarge ? "w-16 h-16 bg-primary/10 text-primary" : "w-12 h-12 bg-[#f5f5f7] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
                <Icon className={isLarge ? "h-8 w-8" : "h-6 w-6"} />
            </div>
            <div className="space-y-3">
                <h3 className={cn("font-bold tracking-tight text-[#1d1d1f]", isLarge ? "text-3xl md:text-4xl" : "text-xl")}>{title}</h3>
                <p className={cn("text-muted-foreground leading-relaxed font-medium", isLarge ? "text-lg md:text-xl max-w-md" : "text-sm")}>{description}</p>
            </div>
        </div>
        {isLarge && (
            <div className="relative z-10 pt-8">
                <span className="text-primary font-bold flex items-center text-sm md:text-base">
                    Sistemi Keşfet <ChevronRight className="h-4 w-4 ml-1" />
                </span>
            </div>
        )}
    </div>
);

export default function MerchantAdvantagesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30 pb-24">
            {/* Navigation */}
            <div className="container mx-auto px-4 pt-8">
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full hover:bg-white text-[#1d1d1f]">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Button>
            </div>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-16 pb-20 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">hangel Üye İşyeri Programı</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto">
                    İşletmenizi <br className="hidden md:block" /> İyiliğin Merkezine Taşıyın.
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    Hangel QR Ödeme sistemine dahil olun. Müşterilerinize modern bir ödeme deneyimi sunarken, her işlemi toplumsal bir faydaya dönüştürün.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                        <Link href="/login/selection?action=register&type=corporate">Hemen Başvur</Link>
                    </Button>
                    <Button asChild variant="ghost" size="lg" className="rounded-full px-10 h-14 text-lg font-bold border border-black/10 hover:bg-white">
                        <Link href="/support">Destek Al</Link>
                    </Button>
                </div>
            </section>

            {/* Main Advantages - Large Cards */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <AdvantageCard 
                    isLarge
                    icon={QrCode}
                    title="Temassız QR Ödeme"
                    description="Kasa hızınızı artırın. Müşterileriniz saniyeler içinde sadece QR kod okutarak güvenle ödeme yapsın."
                    image="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop"
                />
                <AdvantageCard 
                    isLarge
                    icon={TrendingUp}
                    title="Marka Değeri ve Sadakat"
                    description="Bilinçli tüketiciler için tercih sebebi olun. Her alışverişin bir iyiliğe vesile olması müşteri bağlılığını %40 artırır."
                    image="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                />
                <AdvantageCard 
                    isLarge
                    icon={Users}
                    title="Yeni Müşteri Kitlesi"
                    description="Hangel ağındaki binlerce duyarlı kullanıcıya 'İyilik Noktası' olarak görünün ve fiziksel trafiğinizi artırın."
                    image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                />
                <AdvantageCard 
                    isLarge
                    icon={ShieldCheck}
                    title="Sıfır Operasyonel Yük"
                    description="Bağış süreçlerini biz yönetiyoruz. Siz sadece satışınızı yapın, sistem bağış paylarını otomatik olarak ayırır."
                    image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                />
            </section>

            {/* Detailed Benefits Grid */}
            <section className="container mx-auto px-4 space-y-12">
                <div className="text-left md:text-center space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">İşletmeniz İçin Akıllı Çözümler.</h2>
                    <p className="text-lg text-muted-foreground font-medium">Hangel Üye İşyeri olarak sahip olacağınız diğer ayrıcalıklar.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AdvantageCard 
                        icon={LayoutGrid} 
                        title="Yönetim Paneli" 
                        description="Tüm işlemleri anlık takip edin, günlük ve aylık ciro raporlarınızı tek tıkla alın." 
                    />
                    <AdvantageCard 
                        icon={CreditCard} 
                        title="Düşük Komisyon" 
                        description="Sosyal etki odaklı işletmelere özel, piyasa standartlarının altında avantajlı oranlar." 
                    />
                    <AdvantageCard 
                        icon={Sparkles} 
                        title="Görünürlük Desteği" 
                        description="Uygulama içinde 'Öne Çıkan Mekanlar' listesinde yer alarak marka bilinirliğinizi artırın." 
                    />
                    <AdvantageCard 
                        icon={Store} 
                        title="Dijital Vitrin" 
                        description="İşletme profilinizi fotoğraflar ve hikayelerle zenginleştirin, kampüs ağımıza entegre olun." 
                    />
                    <AdvantageCard 
                        icon={Handshake} 
                        title="Kurumsal İşbirliği" 
                        description="Platformdaki STK'lar ile ortak projeler geliştirme ve kurumsal sosyal sorumluluk fırsatları." 
                    />
                    <AdvantageCard 
                        icon={ShieldCheck} 
                        title="Güvenli Altyapı" 
                        description="PCI-DSS uyumlu, yüksek güvenlikli ödeme altyapısı ile hem siz hem müşteriniz güvende kalın." 
                    />
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-4 pt-24 pb-12">
                <div className="bg-[#1d1d1f] rounded-[3rem] p-12 text-center text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight relative z-10">Geleceğin Ticaretine <br /> Bugün Katılın.</h2>
                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto relative z-10">
                        Üye işyeri başvurunuzu saniyeler içinde tamamlayın, işletmenizi iyiliğin bir parçası yapın.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold bg-white text-black hover:bg-white/90">
                            <Link href="/login/selection?action=register&type=corporate">Şimdi Başvur</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="rounded-full px-12 h-14 text-lg font-bold text-white hover:bg-white/10">
                            <Link href="/support">Bilgi Al</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="container mx-auto px-4 text-center text-[12px] text-muted-foreground font-medium pt-8">
                <p>&copy; 2024 Hangel Hub Teknoloji A.Ş. Üye İşyeri Çözüm Merkezi.</p>
            </footer>
        </div>
    );
}
