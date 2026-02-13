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
    ChevronRight
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

const FontCard = ({ title, fontName, onDownload }: { title: string, fontName: string, onDownload: () => void }) => (
    <div className="border rounded-2xl p-6 text-center space-y-3 bg-white/50 shadow-inner h-full flex flex-col justify-center">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-3xl", fontName.includes('Bold') ? 'font-bold' : fontName.includes('SemiBold') ? 'font-semibold' : 'font-normal')}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, onCopy }: { hex: string, name: string, onCopy: () => void }) => (
    <button className="border rounded-2xl p-4 text-center space-y-3 bg-white/50 cursor-pointer shadow-sm hover:shadow-lg transition-all group w-full" onClick={onCopy}>
        <div className="h-16 w-full rounded-lg" style={{ backgroundColor: hex }} />
        <p className="font-bold text-sm">{name}</p>
        <div className="flex items-center justify-center gap-1 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
            {hex} <Copy className="w-3 h-3" />
        </div>
    </button>
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

const SubBrandCard = ({ item, iconBgClass }: { item: {href: string, icon: any, label: string, description: string}, iconBgClass: string }) => {
    const Icon = Icons[item.icon as keyof typeof Icons] || Icons.HelpCircle;
    return (
        <div className="pl-4 h-full">
            <Link href={item.href} className="block h-full">
                <Card className="h-full flex flex-col rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
                    <CardContent className="p-0 flex-1 flex flex-col">
                        <div className={cn("relative aspect-video w-full flex items-center justify-center", iconBgClass)}>
                             <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                             <Icon className="h-16 w-16 text-white opacity-90" />
                        </div>
                        <div className="p-6 space-y-2 flex-1 flex flex-col text-left">
                            <h4 className="font-bold text-lg">{item.label}</h4>
                            <p className="text-sm text-muted-foreground flex-1">{item.description}</p>
                            <div className="pt-2">
                                <span className="text-primary font-semibold text-sm flex items-center">
                                    Daha Fazla Bilgi <ChevronRight className="h-4 w-4 ml-1" />
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
};


export default function LogoUsagePage() {
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
        { icon: Ruler, title: "LOGO MİNİMUM BOYUT KURALI", content: [ "Marka görünürlüğünün ve okunabilirliğin korunması amacıyla aşağıdaki minimum ölçü standartları zorunludur:", "<strong>Dijital Ortam:</strong><br/>Minimum genişlik: 120 px<br/>App icon minimum: 32 px", "<strong>Basılı Materyal:</strong><br/>Minimum genişlik: 25 mm", "Belirtilen ölçülerin altında kullanım yapılamaz. Okunabilirliği bozacak küçültmeler marka ihlali sayılır." ] },
        { icon: Maximize, title: "BOŞLUK (CLEAR SPACE) KURALI", content: [ "Logonun etrafındaki minimum güvenli alan, “h” harfinin yüksekliği kadar veya daha fazla olmalıdır.", "Bu alan içerisine metin, görsel, grafik öğe, çerçeve veya ikon yerleştirilemez." ] },
        { icon: XCircle, title: "Değişiklik Yasağı", content: [ "Logo sabittir. Yeniden yorumlanamaz.", "Oranları bozulamaz, renkleri değiştirilemez, eğilemez, üzerine efekt, gölge veya desen eklenemez, başka grafik unsurlarla birleştirilemez." ] },
        { icon: Package, title: "ÜRÜN İKONLARI", content: [ "Eğitim ve bilgilendirme amaçlı kullanılabilir ancak resmi ortaklık algısı oluşturamaz ve ana marka kimliğinin yerine geçemez." ] },
        { icon: Share2, title: "SOSYAL MEDYA VE DİJİTAL MECRALAR", content: [ "Resmi hesap algısı yaratacak kullanım yasaktır (Yanlış: “hangel Haber”, Doğru: “hangel hakkında haberler”). Hashtag üzerinde hak iddia edilemez." ] },
        { icon: Tv, title: "TV, FİLM VE YAYINCILIK", content: [ "Yayın içeriklerinde doğru atıf esastır. Profil ekran görüntüleri kullanımı için ilgili kurumdan yazılı izin alınmalıdır." ] },
        { icon: Handshake, title: "CO-BRANDING (ORTAK MARKALAMA) KURALLARI", content: [ "Ortak kampanya, sponsorluk veya entegrasyon durumlarında aşağıdaki ilkeler uygulanır:", "• Logo eşit ölçekli kullanılmalıdır.", "• İki logo arasında minimum “h yüksekliği” kadar boşluk bırakılmalıdır.", "• Logolar yatay hizalı olmalıdır.", "• Birleşik tek bir görsel kilit (lock-up) oluşturulamaz.", "• Basılı büyük ölçekli mecralarda, açık hava reklamlarında, televizyon ve dijital yayınlarda yazılı izin zorunludur." ] },
        { icon: FileCheck, title: "MARKA KULLANIM İZNİ", content: [ "hangel varlıklarını (Yayın, Radyo, Açık hava reklamı, TV, A4’ten büyük baskı materyali) içinde kullanmak isteyen kişi ve kurumlar yazılı izin almak zorundadır.", "Talep dosyasında kullanım taslağı sunulmalıdır.", "hangel marka ekibi, uygun bulmadığı kullanımları reddetme veya iptal etme hakkını saklı tutar." ] },
        { icon: Type, title: "İSİM VE METİN KULLANIM STANDARTLARI", content: [ "“hangel” kelimesinde “h” harfi büyük yazılamaz.", "Farklı yazı tipi veya ölçekte manipüle edilemez.", "Başka dile çevrilemez.", "Kısaltılamaz.", "Alan adı, şirket adı veya ürün adına entegre edilemez.", "<strong>Yasaklı örnekler:</strong> hangelPro, hangelClubX, Bağışhangel", "<strong>İzin verilen kullanım:</strong> “hangel için geliştirilmiştir”, “hangel ile uyumludur”, “hangel platformunda yer alır”" ] },
        { icon: Shield, title: "YASAL ÇERÇEVE", content: [ "hangel, fikri mülkiyet haklarını korumak için gerekli yasal süreçleri yürütür.", "Ticari markalarımız tescil ettirilemez, benzer şekilde kullanılamaz veya zayıflatılamaz.", "Hizmet Şartları ve Topluluk Standartları ile çelişen kullanımlar yasaktır.", "hangel, marka kullanım iznini tek taraflı olarak iptal etme hakkını saklı tutar." ] }
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
                    <div className="space-y-16 mt-16">
                         <div className="text-center space-y-2">
                             <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ana Marka</h3>
                             <HangelLogo className="text-5xl" />
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center text-primary">hangel App Alt Markaları</h3>
                             <Carousel
                                opts={{ align: "start" }}
                                className="w-full max-w-6xl mx-auto"
                            >
                                <CarouselContent className="-ml-4">
                                    {appArchitecture.map((item, index) => (
                                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                            <SubBrandCard item={item} iconBgClass="bg-primary" />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="ml-[-24px] hidden lg:flex" />
                                <CarouselNext className="mr-[-24px] hidden lg:flex" />
                            </Carousel>
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center" style={{color: '#042654'}}>hangel Derneği Alt Markaları</h3>
                             <Carousel
                                opts={{ align: "start" }}
                                className="w-full max-w-6xl mx-auto"
                            >
                                <CarouselContent className="-ml-4">
                                    {associationArchitecture.map((item, index) => (
                                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                            <SubBrandCard item={item} iconBgClass="bg-[#042654]" />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="ml-[-24px] hidden lg:flex" />
                                <CarouselNext className="mr-[-24px] hidden lg:flex" />
                            </Carousel>
                        </div>
                    </div>
                     <div className="mt-16 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                        <h4 className="font-bold text-foreground mb-2">Daha fazla ürün</h4>
                        <p>Aradığınız ürünü bulamıyorsanız, ürünün özel kullanım yönergeleri olmayabilir. Bunun yerine, ürün simgelerinin kullanımıyla ilgili genel kılavuzumuza, API ve ürün entegrasyonu yönergelerimize veya ticari marka kurallarımıza başvurarak doğru kullanım hakkında bilgi edinebilirsiniz.</p>
                    </div>
                </Section>
                
                <Section id="medya-kiti">
                    <SectionTitle>Medya Kiti</SectionTitle>
                    <div className="mt-16 space-y-20">
                        
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Logolar</h3>
                            <div className="space-y-12">
                                <div className='space-y-6'>
                                    <h3 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">hangel A.Ş. Logoları</h3>
                                    <Carousel opts={{ align: "start" }} className="w-full">
                                        <CarouselContent className="-ml-6">
                                            {asLogos.map((logo, index) => (
                                                <CarouselItem key={index} className="pl-6 md:basis-1/2 lg:basis-1/3">
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
                                    <h3 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">hangel Derneği Logoları</h3>
                                     <Carousel opts={{ align: "start" }} className="w-full">
                                        <CarouselContent className="-ml-6">
                                            {dernekLogos.map((logo, index) => (
                                                <CarouselItem key={index} className="pl-6 md:basis-1/2 lg:basis-1/3">
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

                        <div className="space-y-8 pt-16 border-t">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Yazı Tipleri</h3>
                           <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center p-0">
                                   <CardTitle>Yazı Tipleri Font Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 p-0">
                                   <FontCard title="Logo Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                   <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                   <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                               </CardContent>
                           </Card>
                        </div>
                        
                        <div className="space-y-8 pt-16 border-t">
                            <h3 className="text-3xl font-bold tracking-tight text-center">Renkler</h3>
                             <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center p-0">
                                   <CardTitle>Renk Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 p-0">
                                   <ColorCard hex="#f34723" name="hangel Mercan" onCopy={() => copyColor('#f34723')} />
                                   <ColorCard hex="#1f1f1f" name="Gece Siyahı" onCopy={() => copyColor('#1f1f1f')} />
                                   <ColorCard hex="#f1f1f1" name="Açık Gri" onCopy={() => copyColor('#f1f1f1')} />
                                   <ColorCard hex="#042654" name="Lacivert" onCopy={() => copyColor('#042654')} />
                               </CardContent>
                                <p className="text-center text-xs text-muted-foreground mt-8">Renkler yalnızca belirtilen HEX değerleriyle kullanılmalıdır.
Ton değişimi, degrade, gölge, transparan müdahale veya varyasyon üretilemez. Marka renkleri yalnızca onaylı logo, ikon ve resmi rozetlerde kullanılabilir.</p>
                           </Card>
                        </div>
                        
                        <div className="space-y-8 pt-16 border-t">
                           <h3 className="text-3xl font-bold tracking-tight text-center">Kimlik Kılavuzu</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <Card className="rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                                   <DownloadCloud className="h-10 w-10 text-primary mx-auto" />
                                   <div className="space-y-1">
                                       <h3 className="text-lg font-bold">Kurumsal Kimlik Kılavuzu</h3>
                                       <p className="text-sm text-muted-foreground max-w-xs mx-auto">Marka değerlerimizi, logo kullanım standartlarımızı ve iletişim dilimizi içeren rehber.</p>
                                   </div>
                                   <Button className="rounded-full px-8 h-12 font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                        PDF İndir
                                   </Button>
                               </Card>
                               <Card className="rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                                   <Landmark className="h-10 w-10 text-primary mx-auto" />
                                   <div className="space-y-1">
                                       <h3 className="text-lg font-bold">hangel Canva Marka Kiti</h3>
                                       <p className="text-sm text-muted-foreground max-w-xs mx-auto">Logo, renk, yazı tipi ve görsellere Canva üzerinden erişin.</p>
                                   </div>
                                   <Button asChild><a href="#" target="_blank" rel="noopener noreferrer">Canva Marka Kitine Git</a></Button>
                               </Card>
                           </div>
                        </div>
                    </div>
                </Section>
                
                 <Section id="kullanim-kurallari" className="bg-white">
                    <SectionTitle>Logo Kullanım İlkeleri</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                        {rules.map((rule) => (
                            <RuleCard key={rule.title} icon={rule.icon} title={rule.title}>
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
                           hangel, fikri mülkiyet haklarının korunması amacıyla ulusal ve uluslararası düzeyde tescil süreçlerini yürütür. hangel ticari markaları tescil ettirilemez, üzerinde hak iddia edilemez, benzer şekilde kullanılamaz veya zayıflatılamaz. Hizmet Şartları ve Topluluk Standartları ile çelişen içeriklerde kullanımı yasaktır. hangel, marka kullanım iznini tek taraflı olarak iptal etme hakkını saklı tutar.
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
