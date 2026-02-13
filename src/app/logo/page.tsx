
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Download, 
    ArrowLeft, 
    FileText, 
    Palette, 
    Type,
    Copy,
    DownloadCloud,
    Ruler,
    Handshake,
    Sparkles,
    Building2,
    Globe,
    HeartHandshake, 
    School, 
    Store,
    Library,
    Users,
    Brain,
    BookCopy,
    Link as LinkIcon,
    Building,
    Maximize,
    XCircle,
    Layers,
    FileCheck,
    Package,
    Share2,
    Tv,
    Landmark,
    Shield,
    HandCoins,
    ChevronRight,
    UserCog
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import * as Icons from 'lucide-react';


const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const Section = ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <section className={cn("py-20 md:py-24", className)} {...props}>
    <div className="container mx-auto px-4 max-w-6xl">
      {children}
    </div>
  </section>
);

const SectionTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tight text-center", className)} {...props}>
        {children}
    </h2>
);

const RuleCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <Card className="bg-white rounded-3xl p-8 shadow-lg border border-black/5 text-left h-full">
        <Icon className="h-10 w-10 text-primary mb-4" />
        <CardHeader className="p-0"><CardTitle className="text-lg text-foreground mb-2">{title}</CardTitle></CardHeader>
        <CardContent className="p-0 text-sm text-muted-foreground space-y-2">
            {children}
        </CardContent>
    </Card>
);

const appArchitecture = [
    { href: "/volunteering", icon: 'HeartHandshake', label: "hangel imece", description: "Yetenek bazlı gönüllülük platformu." },
    { href: "/market", icon: 'HandCoins', label: "hangel bağış", description: "Alışverişle sosyal fayda yaratma modeli." },
    { href: "/admin/clubs", icon: 'School', label: "hangel clubs", description: "Öğrenci kulüpleri için dijital yönetim ve etki merkezi." },
    { href: "/merchant", icon: 'Store', label: "hangel marka", description: "Sosyal fayda odaklı markalar ve işletmeler." },
    { href: "/ngo-onboarding", icon: 'Building2', label: "hangel STK", description: "Sivil toplum kuruluşları için dijital dönüşüm araçları." },
    { href: "/library", icon: 'Library', label: "hangel kütüphane", description: "Sosyal etki ve sivil toplum kaynak merkezi." },
];

const associationArchitecture = [
    { href: "/hangelassociation/projects/sosyal-inovasyon", icon: 'Sparkles', label: "Sosyal İnovasyon Merkezi", description: "Toplumsal sorunlara yenilikçi çözümler geliştirir." },
    { href: "/hangelassociation/projects/sanat", icon: 'Palette', label: "hangel Sanat", description: "Sanatın birleştirici gücüyle farkındalık projeleri." },
    { href: "/hangelassociation/projects/etki-atlasi", icon: 'Globe', label: "Global Sosyal Girişim Atlası", description: "Dünya genelindeki sosyal girişimleri haritalar." },
    { href: "/hangelassociation/workshop", icon: 'BookCopy', label: "Girişimcilik Kütüphanesi", description: "Sosyal girişimciler için bilgi ve kaynak merkezi." },
    { href: "/hangelassociation/workshop", icon: 'Users', label: "Uluslararası Sosyal Girişimcilik Çalıştayı", description: "Küresel sorunlara kolektif çözümler üretir." },
];

const ShowcaseCard = ({
  item,
  themeConfig,
}: {
  item: { href: string; icon: keyof typeof Icons; label: string; description: string };
  themeConfig: { bg: string; subtitleColor: string; titleColor: string; linkColor: string; iconColor: string };
}) => {
  const Icon = Icons[item.icon] || Icons.HelpCircle;
  return (
    <Link href={item.href} className="group block h-full">
      <div className={cn("rounded-[2rem] p-8 text-center flex flex-col justify-between h-[450px]", themeConfig.bg)}>
        <div className="pt-8">
          <h3 className={cn("font-semibold text-base", themeConfig.subtitleColor)}>{item.label}</h3>
          <p className={cn("text-3xl font-bold leading-tight mt-2", themeConfig.titleColor)}>{item.description}</p>
          <div className="mt-4">
             <span className={cn("text-sm font-semibold flex items-center justify-center", themeConfig.linkColor)}>
                Daha fazla bilgi edin <ChevronRight className="h-4 w-4 ml-0.5" />
             </span>
          </div>
        </div>
        <div className="mt-8 flex-1 flex items-end justify-center">
            <div className="w-32 h-32 relative">
                <Icon className={cn("w-full h-full", themeConfig.iconColor)} />
            </div>
        </div>
      </div>
    </Link>
  );
};

const LogoShowcaseCard = ({ title, description, children, onDownload }: { title: string, description: string, children: React.ReactNode, onDownload: () => void }) => (
    <Card className="rounded-[1.75rem] h-full flex flex-col bg-white overflow-hidden shadow-sm border border-black/5 hover:shadow-xl transition-shadow group">
        <div className="relative aspect-video w-full flex items-center justify-center p-6 bg-muted/30">
            {children}
        </div>
        <CardContent className="p-6 flex-1 flex flex-col">
            <h4 className="font-semibold text-base">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
            <Button size="sm" variant="ghost" className="text-xs mt-4 p-0 h-auto self-start text-primary hover:text-primary group-hover:underline" onClick={onDownload}>
                PNG İndir <Download className="ml-1.5 h-3.5 w-3.5"/>
            </Button>
        </CardContent>
    </Card>
);

const FontCard = ({ title, fontName, onDownload }: { title: string, fontName: string, onDownload: () => void }) => (
    <div className="border rounded-2xl p-6 text-center space-y-3 bg-white/50">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-3xl", fontName.includes('Bold') && 'font-bold', fontName.includes('SemiBold') && 'font-semibold')}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, rgb, cmyk, onCopy }: { hex: string, name: string, rgb: string, cmyk: string, onCopy: () => void }) => (
    <div className="border rounded-2xl p-4 text-center space-y-3 bg-white/50 cursor-pointer group" onClick={onCopy}>
        <div className="h-16 w-full rounded-lg" style={{ backgroundColor: hex }} />
        <p className="font-bold text-sm">{name}</p>
        <div className="text-xs font-mono text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-1">HEX: {hex} <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" /></p>
            <p>RGB: {rgb}</p>
            <p>CMYK: {cmyk}</p>
        </div>
    </div>
);

export default function LogoPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleDownload = (file: string) => {
        toast({
            title: "İndirme Başlatılıyor",
            description: `${file} indiriliyor...`,
        });
    };
    
    const copyColor = (hex: string) => {
        navigator.clipboard.writeText(hex);
        toast({
            title: "Renk Kodu Kopyalandı",
            description: `${hex} panoya kopyalandı.`,
        });
    };
    
    const asLogos = [
        {
            title: "Birincil Logo",
            description: "Zeminsiz Logo (PNG)",
            onDownload: () => handleDownload('birincil-logo.png'),
            content: <HangelLogo className="text-5xl text-primary" />
        },
        {
            title: "İkincil Logo",
            description: "Zeminli Logo (PNG)",
            onDownload: () => handleDownload('ikincil-logo.png'),
            content: <div className="p-4 bg-primary rounded-2xl"><HangelLogo className="text-5xl text-white" /></div>
        },
        {
            title: "Üçüncül Logo",
            description: "Beyaz Logo (PNG) – (Zorunlu hallerde)",
            onDownload: () => handleDownload('beyaz-logo.png'),
            content: <div className="p-4 bg-black rounded-2xl w-full h-full flex items-center justify-center"><HangelLogo className="text-5xl text-white" /></div>
        },
        {
            title: "App Icon",
            description: "Mobil Uygulama Simgesi (PNG)",
            onDownload: () => handleDownload('app-icon.png'),
            content: <div className="p-4 bg-primary rounded-3xl"><span className="text-5xl font-black text-white">h</span></div>
        },
    ];

    const dernekLogos = [
        {
            title: "Birincil Logo",
            description: "Zeminsiz Logo (PNG)",
            onDownload: () => handleDownload('dernek-birincil-logo.png'),
            content: <HangelLogo className="text-5xl" style={{color: '#042654'}} />
        },
        {
            title: "İkincil Logo",
            description: "Zeminli Logo (PNG)",
            onDownload: () => handleDownload('dernek-ikincil-logo.png'),
            content: <div className="p-4 rounded-2xl" style={{backgroundColor: '#042654'}}><HangelLogo className="text-5xl text-white" /></div>
        },
        {
            title: "Üçüncül Logo",
            description: "Beyaz Logo (PNG)",
            onDownload: () => handleDownload('dernek-beyaz-logo.png'),
            content: <div className="p-4 bg-black rounded-2xl w-full h-full flex items-center justify-center"><HangelLogo className="text-5xl text-white" /></div>
        },
        {
            title: "Dernek Icon",
            description: "Mobil Uygulama Simgesi (PNG)",
            onDownload: () => handleDownload('dernek-app-icon.png'),
            content: <div className="p-4 rounded-3xl" style={{backgroundColor: '#042654'}}><span className="text-5xl font-black text-white">h</span></div>
        },
    ];
    
    const rules = [
      { id: 'izin', icon: FileCheck, title: "MARKA KULLANIM İZNİ", content: ["hangel varlıklarını (Yayın, Radyo, Açık hava reklamı, TV, A4’ten büyük baskı materyali) içinde kullanmak isteyen kişi ve kurumlar yazılı izin almak zorundadır.", "Talep dosyasında kullanım taslağı sunulmalıdır.", "hangel marka ekibi, uygun bulmadığı kullanımları reddetme veya iptal etme hakkını saklı tutar."] },
      { id: 'standart', icon: Type, title: "İSİM VE METİN KULLANIM STANDARTLARI", content: ["“hangel” kelimesinde “h” harfi büyük yazılamaz.", "Farklı yazı tipi veya ölçekte manipüle edilemez.", "Başka dile çevrilemez.", "Kısaltılamaz.", "Alan adı, şirket adı veya ürün adına entegre edilemez. <br/><br/> <strong>Yasaklı örnekler:</strong> hangelPro, hangelClubX, Bağışhangel <br/> <strong>İzin verilen kullanım:</strong> “hangel için geliştirilmiştir”, “hangel ile uyumludur”, “hangel platformunda yer alır”"] },
      { id: 'bosluk', icon: Maximize, title: "BOŞLUK (CLEAR SPACE) KURALI", content: ["Logonun etrafındaki minimum güvenli alan, “h” harfinin yüksekliği kadar veya daha fazla olmalıdır. Bu alan içerisine metin, görsel, grafik öğe, çerçeve veya ikon yerleştirilemez."] },
      { id: 'degisiklik', icon: XCircle, title: "Değişiklik Yasağı", content: ["Logo sabittir. Yeniden yorumlanamaz.", "Oranları bozulamaz, renkleri değiştirilemez, eğilemez, üzerine efekt, gölge veya desen eklenemez, başka grafik unsurlarla birleştirilemez."] },
      { id: 'boyut', icon: Ruler, title: "LOGO MİNİMUM BOYUT KURALI", content: ["Marka görünürlüğünün ve okunabilirliğin korunması amacıyla aşağıdaki minimum ölçü standartları zorunludur:", "<strong>Dijital Ortam:</strong><br/>Minimum genişlik: 120 px<br/>App icon minimum: 32 px", "<strong>Basılı Materyal:</strong><br/>Minimum genişlik: 25 mm", "Belirtilen ölçülerin altında kullanım yapılamaz. Okunabilirliği bozacak küçültmeler marka ihlali sayılır."] },
      { id: 'ikonlar', icon: Package, title: "ÜRÜN İKONLARI", content: ["Eğitim ve bilgilendirme amaçlı kullanılabilir ancak resmi ortaklık algısı oluşturamaz ve ana marka kimliğinin yerine geçemez.", "Ancak:", "Resmi ortaklık algısı oluşturamaz.", "Ana marka kimliğinin yerine geçemez.", "Tekil görsel kilit oluşturamaz."] },
      { id: 'sosyal-medya', icon: Share2, title: "SOSYAL MEDYA VE DİJİTAL MECRALAR", content: ["Resmi hesap algısı yaratacak kullanım yasaktır (Yanlış: “hangel Haber”, Doğru: “hangel hakkında haberler”). Hashtag üzerinde hak iddia edilemez."] },
      { id: 'tv', icon: Tv, title: "TV, FİLM VE YAYINCILIK", content: ["Yayın içeriklerinde doğru atıf esastır. Profil ekran görüntüleri kullanımı için ilgili kurumdan yazılı izin alınmalıdır."] },
      { id: 'cobranding', icon: Handshake, title: "CO-BRANDING (ORTAK MARKALAMA) KURALLARI", content: ["Ortak kampanya, sponsorluk veya entegrasyon durumlarında aşağıdaki ilkeler uygulanır:", "• Logo eşit ölçekli kullanılmalıdır.", "• İki logo arasında minimum “h yüksekliği” kadar boşluk bırakılmalıdır.", "• Logolar yatay hizalı olmalıdır.", "• Birleşik tek bir görsel kilit (lock-up) oluşturulamaz.", "• Basılı büyük ölçekli mecralarda, açık hava reklamlarında, televizyon ve dijital yayınlarda yazılı izin zorunludur."] },
      { id: 'yasal', icon: Shield, title: "YASAL ÇERÇEVE", content: ["hangel, fikri mülkiyet haklarını korumak için gerekli yasal süreçleri yürütür.", "Ticari markalarımız tescil ettirilemez, benzer şekilde kullanılamaz veya zayıflatılamaz.", "Hizmet Şartları ve Topluluk Standartları ile çelişen kullanımlar yasaktır.", "hangel, marka kullanım iznini tek taraflı olarak iptal etme hakkını saklı tutar."] }
    ];

    const themeConfigs = [
        { bg: 'bg-[#f5f5f7]', subtitleColor: 'text-muted-foreground', titleColor: 'text-foreground', linkColor: 'text-primary', iconColor: 'text-primary/20' },
        { bg: 'bg-white', subtitleColor: 'text-muted-foreground', titleColor: 'text-foreground', linkColor: 'text-primary', iconColor: 'text-primary/20' },
        { bg: 'bg-black', subtitleColor: 'text-white/60', titleColor: 'text-white', linkColor: 'text-blue-500', iconColor: 'text-white/20' },
    ];


    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans">
             <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Basın Kiti & Marka Yönergesi</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                        <a href="mailto:press@hangel.org">İletişime Geç</a>
                    </Button>
                </div>
            </header>

            <main className="pt-24">
                <Section className="text-center pt-24 pb-20 md:pt-32 md:pb-28">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-none">
                       Dayanışmayı Görünür Kılalım.
                    </h1>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-4">
                        Bu logo; eşit mesafede duran, tarafsız, şeffaf ve kolektif iyiliği önceleyen bir yapının sembolüdür. Logonun doğru, tutarlı ve mevzuata uygun biçimde kullanımı; marka bütünlüğünün korunmasını, kamusal algının netliğini ve hukuki güvenliğin sürdürülmesini sağlar. Logomuzu her doğru kullanımınız, dayanışma zincirine eklenen yeni bir halkadır.
                    </p>
                </Section>
                
                <Section id="mimari" className="bg-white">
                    <SectionTitle>Marka Mimarisi</SectionTitle>
                     <p className="text-center text-muted-foreground mt-4 max-w-3xl mx-auto">
                        hangel, farklı kitlelere ve amaçlara hizmet eden çeşitli alt markalardan oluşan bir ekosistemdir. Her bir alt marka, ana markamızın değerlerini taşırken kendi özel misyonuna odaklanır.
                    </p>
                    <div className="space-y-16 mt-16">
                         <div className="text-center space-y-2">
                             <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ana Marka</h3>
                             <HangelLogo className="text-5xl" />
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center text-primary">hangel App Alt Markaları</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {appArchitecture.map((item, index) => (
                                    <ShowcaseCard 
                                        key={item.href} 
                                        item={item} 
                                        themeConfig={themeConfigs[0]}
                                    />
                                ))}
                            </div>
                        </div>
                         <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center text-primary">hangel Derneği Alt Markaları</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {associationArchitecture.map((item, index) => (
                                    <ShowcaseCard 
                                        key={index} 
                                        item={item} 
                                        themeConfig={themeConfigs[0]}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-16 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                        <h4 className="font-bold text-foreground mb-2">Daha fazla ürün</h4>
                        <p>Aradığınız ürünü bulamıyorsanız, ürünün özel kullanım yönergeleri olmayabilir. Bunun yerine, ürün simgelerinin kullanımıyla ilgili genel kılavuzumuza, API ve ürün entegrasyonu yönergelerimize veya ticari marka kurallarımıza başvurarak doğru kullanım hakkında bilgi edinebilirsiniz.</p>
                    </div>
                </Section>
                
                 <Section id="medya-kiti">
                    <div className="space-y-20">
                        <SectionTitle>Medya Kiti</SectionTitle>
                        
                        <div className="space-y-12">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Logolar</h3>
                            <div className="space-y-12">
                                <div className='space-y-6'>
                                    <h4 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">hangel A.Ş. Logoları</h4>
                                    <Carousel opts={{ align: "start" }} className="w-full">
                                        <CarouselContent className="-ml-6">
                                            {asLogos.map((logo, index) => (
                                                <CarouselItem key={index} className="pl-6 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/4">
                                                    <LogoShowcaseCard title={logo.title} description={logo.description} onDownload={logo.onDownload}>
                                                        {logo.content}
                                                    </LogoShowcaseCard>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious className="left-[-50px] hidden xl:flex" />
                                        <CarouselNext className="right-[-50px] hidden xl:flex" />
                                    </Carousel>
                                </div>
                                <div className='space-y-6'>
                                    <h4 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">hangel Derneği Logoları</h4>
                                     <Carousel opts={{ align: "start" }} className="w-full">
                                        <CarouselContent className="-ml-6">
                                            {dernekLogos.map((logo, index) => (
                                                <CarouselItem key={index} className="pl-6 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/4">
                                                    <LogoShowcaseCard title={logo.title} description={logo.description} onDownload={logo.onDownload}>
                                                        {logo.content}
                                                    </LogoShowcaseCard>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious className="left-[-50px] hidden xl:flex" />
                                        <CarouselNext className="right-[-50px] hidden xl:flex" />
                                    </Carousel>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Yazı Tipleri</h3>
                            <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>Font Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                   <FontCard title="Logo Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                   <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                   <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                               </CardContent>
                           </Card>
                        </div>
                        
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Renkler</h3>
                             <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>Renk Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                                   <ColorCard hex="#f34723" name="hangel Mercan" rgb="243, 71, 35" cmyk="0, 71, 86, 5" onCopy={() => copyColor('#f34723')} />
                                   <ColorCard hex="#1f1f1f" name="Gece Siyahı" rgb="31, 31, 31" cmyk="0, 0, 0, 88" onCopy={() => copyColor('#1f1f1f')} />
                                   <ColorCard hex="#f1f1f1" name="Açık Gri" rgb="241, 241, 241" cmyk="0, 0, 0, 5" onCopy={() => copyColor('#f1f1f1')} />
                                   <ColorCard hex="#042654" name="Lacivert" rgb="4, 38, 84" cmyk="95, 55, 0, 67" onCopy={() => copyColor('#042654')} />
                               </CardContent>
                           </Card>
                        </div>
                        
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Kurumsal Kimlik</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                 <Card className="rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                                     <DownloadCloud className="h-16 w-16 mx-auto text-primary" />
                                     <div className="space-y-1">
                                         <h3 className="text-2xl font-bold">Kimlik Kılavuzu</h3>
                                         <p className="text-muted-foreground max-w-md mx-auto">Marka değerlerimizi, logo kullanım standartlarımızı ve iletişim dilimizi içeren rehber.</p>
                                     </div>
                                     <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                         PDF Olarak İndir
                                     </Button>
                                 </Card>
                                 <Card className="rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                                     <Image src="https://logo.clearbit.com/canva.com" alt="Canva Logo" width={64} height={64} className="mx-auto h-16 w-16" />
                                     <div className="space-y-1">
                                         <h3 className="text-2xl font-bold">hangel Canva Marka Kiti</h3>
                                         <p className="text-muted-foreground max-w-md mx-auto">Logo kullanımları, renk paletleri, yazı fontları ve görseller için tasarımlarınızda kullanın.</p>
                                     </div>
                                     <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold">
                                         <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer">Canva Marka Kiti için tıklayınız</a>
                                     </Button>
                                 </Card>
                             </div>
                        </div>
                    </div>
                </Section>
                
                 <Section id="kullanim-kurallari" className="bg-white">
                    <SectionTitle>Logo Kullanım İlkeleri</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                        {rules.map((rule) => (
                            <RuleCard key={rule.id} icon={rule.icon} title={rule.title}>
                                 <div className="space-y-3">
                                    {rule.content.map((text, i) => <p key={i} dangerouslySetInnerHTML={{ __html: text.replace(/•/g, '<span class="mr-2">•</span>') }} />)}
                                </div>
                            </RuleCard>
                        ))}
                    </div>
                </Section>
                
                <Section className="text-left">
                    <div className="text-sm text-muted-foreground max-w-3xl space-y-4">
                        <p>
                           hangel, fikri mülkiyet haklarını korumak için gerekli yasal süreçleri yürütür. hangel ticari markaları tescil ettirilemez, üzerinde hak iddia edilemez, benzer şekilde kullanılamaz veya zayıflatılamaz. Hizmet Şartları ve Topluluk Standartları ile çelişen kullanımlar yasaktır. hangel, marka kullanım iznini tek taraflı olarak iptal etme hakkını saklı tutar.
                        </p>
                         <p>
                            <strong>hangel logosu; tarafsızlığın, kolektif üretimin ve eşit mesafede durmanın sembolüdür. Her doğru kullanım; kurumsal itibarı güçlendirir, kamusal güveni artırır ve dayanışmayı görünür kılar. Marka, bir görselden ibaret değildir. Marka, bir taahhüttür.</strong>
                        </p>
                    </div>
                </Section>
            </main>

            <PublicFooter currentPageLabel="Basın Kiti & Marka Yönergesi" />
        </div>
    );
}
