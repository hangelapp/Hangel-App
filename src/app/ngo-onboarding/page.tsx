'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, 
    HeartHandshake, 
    HandCoins, 
    BarChart3, 
    Users, 
    QrCode, 
    Globe, 
    MessageSquare, 
    Mail, 
    Megaphone, 
    Calendar, 
    Video, 
    Palette, 
    CreditCard, 
    Target, 
    Calculator, 
    Database, 
    PhoneCall, 
    Building2, 
    GraduationCap, 
    MapPin, 
    MessageCircle, 
    ShoppingCart,
    ChevronRight,
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

// New component for the large feature cards
const FeatureShowcaseCard = ({ 
    title, 
    description, 
    icon: Icon,
    imageUrl,
    imageHint
}: { 
    title: string, 
    description: string, 
    icon: any, 
    imageUrl: string,
    imageHint: string
}) => (
    <div className="group relative bg-[#f5f5f7] rounded-[2.5rem] p-8 md:p-12 transition-all hover:shadow-2xl border border-black/5 overflow-hidden flex flex-col justify-end min-h-[500px]">
        <div className="absolute inset-0 z-0">
            <Image src={imageUrl} alt={title} fill className="object-cover" data-ai-hint={imageHint} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>
        <div className="relative z-10 text-white">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/10 backdrop-blur-md border border-white/10 text-white">
                <Icon className="h-8 w-8" />
            </div>
            <div className="space-y-3">
                <h3 className="text-3xl font-bold tracking-tight">{title}</h3>
                <p className="text-lg text-white/80 leading-relaxed font-medium max-w-md">{description}</p>
            </div>
            <div className="pt-8">
                <span className="text-white font-bold flex items-center text-base">
                    Daha Fazla Bilgi <ChevronRight className="h-4 w-4 ml-1" />
                </span>
            </div>
        </div>
    </div>
);

// New component for smaller feature items
const ToolGridItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center gap-4 p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all">
        <div className="p-4 bg-[#f5f5f7] rounded-2xl text-primary">
            <Icon className="h-7 w-7" />
        </div>
        <h4 className="font-bold text-lg leading-tight">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

export default function NgoOnboardingPage() {
    const router = useRouter();

    const mainFeatures = [
        { 
            icon: ShieldCheck,
            title: "Şeffaflık Endeksi",
            description: "Kurumsal güveninizi dijital ortamda tescilleyin. Şeffaflık puanınızla bağışçıların ve gönüllülerin öncelikli tercihi olun.",
            imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop",
            imageHint: "person scanning secure payment"
        },
        { 
            icon: HeartHandshake,
            title: "Gönüllülük Yönetimi",
            description: "Yetenek bazlı ilanlar oluşturun, binlerce hevesli gönüllüye ulaşın ve tüm başvuru süreçlerini profesyonelce koordine edin.",
            imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop",
            imageHint: "group happy volunteers"
        },
        { 
            icon: HandCoins,
            title: "hangel Bağışı",
            description: "Sürdürülebilir kaynak yaratın. Destekçilerinizin anlaşmalı markalardan yaptığı alışverişleri kurumunuz için ek fona dönüştürün.",
            imageUrl: "https://images.unsplash.com/photo-1579621970795-87f54d5921ba?q=80&w=2070&auto=format&fit=crop",
            imageHint: "growing plant coins"
        },
        { 
            icon: BarChart3,
            title: "Demografi Analizi",
            description: "Topluluğunuzu verilerle tanıyın. Destekçilerinizin yaş, şehir ve ilgi alanı dağılımlarını analiz ederek stratejinizi güçlendirin.",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
            imageHint: "data visualization charts"
        }
    ];

     const toolsetFeatures = [
        { icon: Users, title: "Yetkili Yönetimi", description: "Ekibinize farklı roller tanımlayın, panel yetkilerini güvenle dağıtın." },
        { icon: QrCode, title: "STK Profil QR Kodu", description: "Fiziksel alanlarda kurum profilinize anında erişim sağlayın." },
        { icon: Globe, title: "Web Sitesi Yönetimi", description: "Kurumsal kimliğinize özel web sitesi scriptlerini kolayca yönetin." },
        { icon: MessageSquare, title: "SMS Gönderimi", description: "Önemli duyurularınızı gönüllülerinize SMS ile anında ulaştırın." },
        { icon: Mail, title: "Mail Gönderimi", description: "E-bültenlerinizle bağışçılarınızı düzenli olarak bilgilendirin." },
        { icon: Megaphone, title: "Reklam Yönetimi", description: "Platform içi görünürlüğünüzü artırın, hedef kitleye doğrudan ulaşın." },
        { icon: Calendar, title: "Etkinlik Yönetimi", description: "Saha veya online etkinliklerinizi planlayın, kayıtları takip edin." },
        { icon: Video, title: "Online Eğitim & Toplantı", description: "Gönüllülerinize uzaktan eğitimler verin, toplantılar düzenleyin." },
        { icon: Palette, title: "Tasarım Programları", description: "Görsel materyalleriniz için profesyonel tasarım araçlarına erişin." },
        { icon: CreditCard, title: "Pos & Ödeme Sistemleri", description: "Kurumsal ödeme altyapınızı platform ile entegre edin." },
        { icon: Target, title: "Pazarlama İletişimi", description: "Topluluğunuzla kurduğunuz bağı profesyonel araçlarla büyütün." },
        { icon: Calculator, title: "Ön Muhasebe Yönetimi", description: "Finansal hareketlerinizi ve hak edişlerinizi şeffafça izleyin." },
        { icon: Database, title: "CRM Yönetimi", description: "Bağışçı ve gönüllü veri tabanınızı modern bir yapıda tutun." },
        { icon: PhoneCall, title: "Sanal Santral Yönetimi", description: "Kurumsal iletişim numaranızı bulut tabanlı sistemle yönetin." },
        { icon: Building2, title: "Sanal ve Fiziki Ofis", description: "İşbirliği ağımızdaki ofis ve toplantı alanlarından faydalanın." },
        { icon: GraduationCap, title: "Üniversite Gönüllük Dersi", description: "Akademik kredi kapsamında binlerce öğrenciye kapılarınızı açın." },
        { icon: MapPin, title: "Saha Ekip Yönetimi", description: "Saha operasyonlarınızı canlı harita ve araçlarla takip edin." },
        { icon: MessageCircle, title: "DM Mesajlaşma Merkezi", description: "Destekçilerinizle anlık ve kurumsal bir dille mesajlaşın." },
        { icon: ShoppingCart, title: "İktisadi İşletme Yönetimi", description: "Kurumsal ürünlerinizin satış süreçlerini dijitalleştirin." },
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">STK'lar İçin</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                        <Link href="/login/selection?action=register&type=corporate">Şimdi Başvur</Link>
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-32 pb-24 text-center space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">hangel HUB</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                    İyiliği Birlikte Yönetelim.
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    Sivil toplumun dijital geleceğini birlikte inşa ediyoruz. Hangel Hub, operasyonlarınızı tek bir noktadan yönetmeniz için tasarlandı.
                </p>
                <div className="pt-8">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                        <Link href="/login/selection?action=register&type=corporate">Ücretsiz Başvur</Link>
                    </Button>
                </div>
            </section>
            
            {/* Main Features Grid */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                {mainFeatures.map(feature => <FeatureShowcaseCard key={feature.title} {...feature} />)}
            </section>

            {/* Toolset Section */}
            <section className="container mx-auto px-4 space-y-16">
                <div className="text-center space-y-2 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Eksiksiz Bir Yönetim Paneli.</h2>
                    <p className="text-lg text-muted-foreground font-medium">İhtiyacınız olan her araç, profesyonel standartlarda elinizin altında.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {toolsetFeatures.map(tool => <ToolGridItem key={tool.title} {...tool} />)}
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-4 pt-24 pb-12">
                <div className="bg-black rounded-[3rem] p-12 text-center text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight relative z-10">Dijital Dönüşümü <br/>Bugün Başlatın.</h2>
                    <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto relative z-10">
                        Kuruluşunuzun etkisini teknolojiyle katlayın. Başvurunuzu yapın, ekibimiz sizinle iletişime geçsin.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold bg-white text-black hover:bg-white/90">
                            <Link href="/login/selection?action=register&type=corporate">Şimdi Başvur</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="rounded-full px-12 h-14 text-lg font-bold text-white hover:bg-white/10 hover:text-white">
                            <Link href="/support">Destek Al</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="STK'lar İçin" />
        </div>
    );
}
