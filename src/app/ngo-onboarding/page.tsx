
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
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as Icons from 'lucide-react';

const AdvantageCard = ({
  category,
  title,
  description,
  imageUrl,
  imageHint,
  link
}: {
  category: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  link: { label: string, href: string };
}) => (
  <div className="bg-white rounded-2xl h-full flex flex-col text-left overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group">
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={imageHint} />
    </div>
    <div className="p-5 flex flex-col flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</p>
      <h3 className="text-lg font-bold mt-1 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground/90 mt-2 flex-1 leading-snug">{description}</p>
      <div className="mt-4 pt-4">
        <Link href={link.href} className="text-sm text-primary hover:underline flex items-center font-semibold">
          {link.label}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  </div>
);


// New component for the large feature cards
const FeatureShowcaseCard = ({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: any;
}) => (
  <div className="group relative bg-white rounded-[2.5rem] p-8 md:p-12 transition-all hover:shadow-2xl border border-black/5 overflow-hidden flex flex-col justify-between min-h-[450px]">
    <div className="relative z-10">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white border shadow-sm">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-md">{description}</p>
      </div>
    </div>
    <div className="relative z-10 pt-8">
      <span className="text-primary font-bold flex items-center text-base opacity-70 group-hover:opacity-100 transition-opacity">
        Daha Fazla Bilgi <ChevronRight className="h-4 w-4 ml-1" />
      </span>
    </div>
  </div>
);


// New component for smaller feature items
const ToolGridItem = ({ icon: Icon, title, description, tag }: { icon: any, title: string, description: string, tag?: string }) => (
    <div className="relative flex flex-col items-center text-center gap-4 p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all">
        {tag && (
            <Badge className="absolute -top-2 right-4">{tag}</Badge>
        )}
        <div className="p-4 bg-[#f5f5f7] rounded-2xl text-primary">
            <Icon className="h-7 w-7" />
        </div>
        <h4 className="font-bold text-lg leading-tight">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

export default function NgoOnboardingPage() {
    const router = useRouter();
    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true })
    );

    const advantageItems = [
        {
            category: "DİJİTAL DÖNÜŞÜM",
            title: "Tek Panelden Yönetim",
            description: "Kurumsal web sitenizden CRM'e, tüm dijital araçlarınızı tek yerden yönetin. Teknik bilgiye ihtiyaç duymadan profesyonel bir dijital varlığa sahip olun.",
            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'data analytics dashboard',
            link: { label: "Araçları Keşfet", href: "/ngo-admin/dashboard" }
        },
        {
            category: "SÜRDÜRÜLEBİLİR KAYNAK",
            title: "Alışverişle Bağış",
            description: "Destekçilerinizin günlük alışverişlerini, kurumunuz için düzenli bir gelir modeline dönüştürün. Ek maliyet yok, sadece etki var.",
            imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'contactless payment store',
            link: { label: "Nasıl Çalışır?", href: "/market" }
        },
        {
            category: "NİTELİKLİ GÖNÜLLÜ AĞI",
            title: "Yetenek Bazlı Gönüllülük",
            description: "Proje yönetimi, tasarım, hukuk gibi alanlarda uzmanlaşmış binlerce yetenekli gönüllüye ulaşın, projelerinizi güçlendirin.",
            imageUrl: 'https://images.unsplash.com/photo-1521737852577-6848238f5333?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'team meeting collaboration',
            link: { label: "Gönüllü İlanı Oluştur", href: "/ngo-admin/volunteer" }
        },
        {
            category: "ARTAN GÜVEN VE ŞEFFAFLIK",
            title: "Şeffaflık Endeksi",
            description: "Yasal belgelerinizi ve raporlarınızı paylaşarak şeffaflık puanınızı yükseltin, bağışçıların ve gönüllülerin güvenini kazanın.",
            imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop',
            imageHint: 'person reviewing document',
            link: { label: "Endeksi İncele", href: "/ngo-admin/transparency" }
        },
        {
            category: "VERİYE DAYALI ETKİ",
            title: "Demografi ve Analiz",
            description: "Destekçi kitlenizin demografik yapısını, ilgi alanlarını ve davranışlarını analiz ederek iletişim stratejinizi veriye dayalı olarak şekillendirin.",
            imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=2076&auto=format&fit=crop',
            imageHint: 'world map data connection',
            link: { label: "Analizleri Gör", href: "/ngo-admin/demographics" }
        }
    ];

    const mainFeatures = [
        { 
            icon: ShieldCheck,
            title: "Şeffaflık Endeksi",
            description: "Kurumsal güveninizi dijital ortamda tescilleyin. Şeffaflık puanınızla bağışçıların ve gönüllülerin öncelikli tercihi olun.",
        },
        { 
            icon: HeartHandshake,
            title: "Gönüllülük Yönetimi",
            description: "Yetenek bazlı ilanlar oluşturun, binlerce hevesli gönüllüye ulaşın ve tüm başvuru süreçlerini profesyonelce koordine edin.",
        },
        { 
            icon: HandCoins,
            title: "hangel Bağışı",
            description: "Sürdürülebilir kaynak yaratın. Destekçilerinizin anlaşmalı markalardan yaptığı alışverişleri kurumunuz için ek fona dönüştürün.",
        },
        { 
            icon: BarChart3,
            title: "Demografi Analizi",
            description: "Topluluğunuzu verilerle tanıyın. Destekçilerinizin yaş, şehir ve ilgi alanı dağılımlarını analiz ederek stratejinizi güçlendirin.",
        }
    ];

     const toolsetFeatures = [
        { icon: Users, title: "Yetkili Yönetimi", description: "Ekibinize farklı roller tanımlayın, panel yetkilerini güvenle dağıtın." },
        { icon: QrCode, title: "STK Profil QR Kodu", description: "Fiziksel alanlarda kurum profilinize anında erişim sağlayın." },
        { icon: Globe, title: "Web Sitesi Yönetimi", description: "Kurumsal kimliğinize özel web sitesi scriptlerini kolayca yönetin." },
        { icon: MessageSquare, title: "SMS Gönderimi", description: "Önemli duyurularınızı gönüllülerinize SMS ile anında ulaştırın." },
        { icon: Mail, title: "Mail Gönderimi", description: "E-bültenlerinizle bağışçılarınızı düzenli olarak bilgilendirin." },
        { icon: Megaphone, title: "Reklam Yönetimi", description: "Platform içi görünürlüğünüzü artırın, hedef kitleye doğrudan ulaşın.", tag: "Yeni" },
        { icon: Calendar, title: "Etkinlik Yönetimi", description: "Saha veya online etkinliklerinizi planlayın, kayıtları takip edin." },
        { icon: Video, title: "Online Eğitim & Toplantı", description: "Gönüllülerinize uzaktan eğitimler verin, toplantılar düzenleyin." },
        { icon: Palette, title: "Tasarım Programları", description: "Görsel materyalleriniz için profesyonel tasarım araçlarına erişin." },
        { icon: CreditCard, title: "Pos & Ödeme Sistemleri", description: "Kurumsal ödeme altyapınızı platform ile entegre edin." },
        { icon: Target, title: "Pazarlama İletişimi", description: "Topluluğunuzla kurduğunuz bağı profesyonel araçlarla büyütün." },
        { icon: Calculator, title: "Ön Muhasebe Yönetimi", description: "Finansal hareketlerinizi ve hak edişlerinizi şeffafça izleyin.", tag: "Beta" },
        { icon: Database, title: "CRM Yönetimi", description: "Bağışçı ve gönüllü veri tabanınızı modern bir yapıda tutun." },
        { icon: PhoneCall, title: "Sanal Santral Yönetimi", description: "Kurumsal telefon ve çağrı merkezi altyapınızı yönetin." },
        { icon: Building2, title: "Sanal ve Fiziki Ofis", description: "İşbirliği ağımızdaki ofis ve toplantı alanlarından faydalanın." },
        { icon: GraduationCap, title: "Üniversite Gönüllük Dersi", description: "Akademik kredi kapsamında binlerce öğrenciye kapılarınızı açın." },
        { icon: MapPin, title: "Saha Ekip Yönetimi", description: "Saha operasyonlarınızı canlı harita ve araçlarla takip edin.", tag: "Yeni" },
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
            <section className="container mx-auto px-4 pt-32 pb-16 text-center space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">hangel STK</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                    İyiliği Birlikte Yönetelim.
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    Sivil toplumun dijital geleceğini birlikte inşa ediyoruz. Hangel STK, operasyonlarınızı tek bir noktadan yönetmeniz için tasarlandı.
                </p>
                <div className="pt-8 flex flex-col items-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                        <Link href="/login/selection?action=register&type=corporate">Ücretsiz Başvur</Link>
                    </Button>
                </div>
            </section>
            
            <section className="py-20 bg-[#f5f5f7] border-y">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Neden Hangel'e Katılmalısınız?</h2>
                        <p className="text-muted-foreground">Dijital dönüşümden sürdürülebilir kaynak yaratmaya kadar, STK'nızın etkisini en üst düzeye çıkaracak araçları keşfedin.</p>
                    </div>
                    <Carousel
                        plugins={[plugin.current]}
                        opts={{ align: "start" }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-6">
                            {advantageItems.map((item, index) => (
                                <CarouselItem key={index} className="pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
                                    <div className="h-[520px] p-2">
                                        <AdvantageCard {...item} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="hidden xl:flex justify-end gap-2 mt-8">
                            <CarouselPrevious className="static translate-y-0 h-12 w-12 border-black/5 hover:bg-black/5" />
                            <CarouselNext className="static translate-y-0 h-12 w-12 border-black/5 hover:bg-black/5" />
                        </div>
                    </Carousel>
                </div>
            </section>


            {/* Main Features Grid */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 my-24 bg-white">
                {mainFeatures.map(feature => <FeatureShowcaseCard key={feature.title} {...feature} />)}
            </section>

            {/* Toolset Section */}
            <section className="container mx-auto px-4 space-y-16">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Eksiksiz Bir Yönetim Paneli.</h2>
                    <p className="text-lg text-muted-foreground font-medium">İhtiyacınız olan her araç, profesyonel standartlarda elinizin altında.</p>
                     <p className="text-base text-muted-foreground max-w-2xl mx-auto">SMS ve e-posta gibi iletişim araçlarından CRM ve muhasebe gibi profesyonel çözümlere kadar tüm operasyonel ihtiyaçlarınızı Hangel'in entegre ekosistemi üzerinden yönetin.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {toolsetFeatures.map(tool => <ToolGridItem key={tool.title} {...tool} />)}
                </div>
            </section>

             {/* Become a Partner CTA */}
            <section className="container mx-auto px-4 pt-24">
                <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] p-12 text-center space-y-8">
                    <Sparkles className="h-12 w-12 text-primary mx-auto" />
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight relative z-10">Gelin, gücü birleştirelim. Gerçek etki üretelim.</h2>
                    <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto relative z-10">
                        Sosyal sorunlar bireysel değil, çözümleri de öyle olmamalı. Sosyal sorunlarla mücadelede çözümün bir parçası olun, ürün ve hizmetlerinizi sivil toplum kuruluşlarıyla buluşturun.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 text-lg font-bold">
                            <Link href="/contact/companies">İletişime Geçin</Link>
                        </Button>
                    </div>
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
