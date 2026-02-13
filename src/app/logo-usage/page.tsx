
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
    Star,
    CheckCircle,
    Landmark,
    Ruler,
    Scale,
    Handshake,
    Mic,
    Newspaper,
    Tv,
    Users,
    Globe,
    BarChart3,
    TrendingUp,
    HeartHandshake,
    HandCoins,
    School,
    Building,
    Sparkles,
    Store,
    BookOpen,
    Library
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

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
  <section className={cn("py-20 md:py-28", className)} {...props}>
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

const SectionDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-lg md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mt-4", className)} {...props}>
        {children}
    </p>
);

const LogoDisplayCard = ({ title, description, children, onDownload }: { title: string, description: string, children: React.ReactNode, onDownload: () => void }) => (
    <div className="border rounded-[1.5rem] bg-white text-center flex flex-col shadow-sm hover:shadow-xl transition-shadow">
        <div className="h-40 w-full flex items-center justify-center p-8 bg-muted/20 rounded-t-[1.5rem]">
            {children}
        </div>
        <div className="p-6 flex-1 flex flex-col">
            <h4 className="font-semibold text-lg">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1 flex-1">{description}</p>
            <Button size="sm" variant="secondary" className="text-xs mt-4 w-full h-9 rounded-full font-bold" onClick={onDownload}>
                <Download className="mr-2 h-4 w-4"/> PNG İndir
            </Button>
        </div>
    </div>
);

const FontCard = ({ title, fontName, onDownload }: { title: string, fontName: string, onDownload: () => void }) => (
    <div className="border rounded-2xl p-6 text-center space-y-3 bg-white/50 shadow-inner">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-3xl", fontName.includes('Bold') ? 'font-bold' : 'font-semibold')}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary p-0 h-auto" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, onCopy }: { hex: string, name: string, onCopy: () => void }) => (
    <button className="border rounded-[1.5rem] p-4 text-center space-y-4 bg-white cursor-pointer shadow-sm hover:shadow-xl transition-all group w-full" onClick={onCopy}>
        <div className="h-24 w-full rounded-xl" style={{ backgroundColor: hex }} />
        <p className="font-bold text-lg">{name}</p>
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors">
            {hex} <Copy className="w-3.5 h-3.5" />
        </div>
    </button>
);

const RuleCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl p-8 border shadow-sm h-full">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-xl font-bold tracking-tight">{title}</h4>
        </div>
        <div className="prose prose-sm max-w-none text-muted-foreground pt-4 border-t">
            {children}
        </div>
    </div>
);

const ArchitectureCard = ({ icon: Icon, title, description, href, iconBgClass }: { icon: React.ElementType, title: string, description: string, href: string, iconBgClass?: string }) => (
    <Link href={href} className="group block">
        <Card className="h-full text-left p-6 space-y-4 hover:shadow-xl transition-shadow rounded-2xl">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgClass)}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <h4 className="font-bold text-base text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </Card>
    </Link>
);

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

    const appArchitecture = [
        { icon: HeartHandshake, title: "hangel imece", description: "Yetenek bazlı gönüllülük platformu.", href: "/volunteering" },
        { icon: HandCoins, title: "hangel bağış", description: "Alışverişle sosyal fayda yaratma modeli.", href: "/market" },
        { icon: School, title: "hangel clubs", description: "Öğrenci kulüpleri için dijital yönetim ve etki merkezi.", href: "/admin/clubs" },
        { icon: Store, title: "hangel marka", description: "Sosyal fayda odaklı markalar ve işletmeler.", href: "/merchant" },
        { icon: Building, title: "hangel STK", description: "Sivil toplum kuruluşları için dijital dönüşüm araçları.", href: "/ngo-onboarding" },
        { icon: Library, title: "hangel kütüphane", description: "Sosyal etki ve sivil toplum kaynak merkezi.", href: "/library" },
    ];

    const associationArchitecture = [
        { icon: Sparkles, title: "Sosyal İnovasyon Merkezi", description: "Toplumsal sorunlara yenilikçi çözümler geliştirir.", href: "/hangelassociation/projects/sosyal-inovasyon" },
        { icon: Palette, title: "hangel Sanat", description: "Sanatın birleştirici gücüyle farkındalık projeleri.", href: "/hangelassociation/projects/sanat" },
        { icon: Globe, title: "Global Sosyal Girişim Atlası", description: "Dünya genelindeki sosyal girişimleri haritalar.", href: "/hangelassociation/projects/etki-atlasi" },
        { icon: BookOpen, title: "Girişimcilik Kütüphanesi", description: "Sosyal girişimciler için bilgi ve kaynak merkezi.", href: "/hangelassociation/workshop" },
        { icon: Users, title: "Uluslararası Sosyal Girişimcilik Çalıştayı", description: "Küresel sorunlara kolektif çözümler üretir.", href: "/hangelassociation/workshop" },
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
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed mt-8">
                        hangel logosu yalnızca bir görsel kimlik unsuru değildir. Ortak değerlerimizin, kolektif üretim anlayışımızın ve toplumsal sorunlara karşı geliştirdiğimiz dayanışma kültürünün kurumsal temsildir.
                    </p>
                </Section>
                
                <Section id="mimari" className="bg-white">
                    <SectionTitle>Marka Mimarisi</SectionTitle>
                    <SectionDescription>
                        Tüm alt markalar, ana marka olan hangel çatısı altında konumlanır ve marka hiyerarşisine uygun olarak destekleyici rol üstlenir.
                    </SectionDescription>
                    <div className="space-y-16 mt-16">
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center text-primary">hangel App</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {appArchitecture.map(item => <ArchitectureCard key={item.title} {...item} iconBgClass="bg-primary" />)}
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center text-[#042654]">hangel Derneği</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {associationArchitecture.map(item => <ArchitectureCard key={item.title} {...item} iconBgClass="bg-[#042654]" />)}
                            </div>
                        </div>
                    </div>
                </Section>
                
                <Section id="medya-kiti">
                    <SectionTitle>Medya Kiti</SectionTitle>
                    <div className="mt-16 space-y-20">
                        {/* Logolar */}
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center">Logolar</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <LogoDisplayCard title="Birincil Logo" description="Zeminsiz Logo (PNG)" onDownload={() => handleDownload('birincil-logo.png')}>
                                    <HangelLogo className="text-5xl text-primary" />
                                </LogoDisplayCard>
                                <LogoDisplayCard title="İkincil Logo" description="Zeminli Logo (PNG)" onDownload={() => handleDownload('ikincil-logo.png')}>
                                    <div className="p-4 bg-primary rounded-2xl"><HangelLogo className="text-5xl text-white" /></div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="Üçüncül Logo" description="Beyaz logo (PNG) (Zorunlu hallerde)" onDownload={() => handleDownload('beyaz-logo.png')}>
                                    <div className="p-4 bg-black rounded-2xl w-full h-full flex items-center justify-center">
                                        <HangelLogo className="text-5xl text-white" />
                                    </div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="App Icon" description="(PNG)" onDownload={() => handleDownload('app-icon.png')}>
                                    <div className="p-4 bg-primary rounded-3xl"><span className="text-5xl font-black text-white">h</span></div>
                                </LogoDisplayCard>
                            </div>
                        </div>
                        {/* Yazı Tipleri */}
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center">Yazı Tipleri</h3>
                            <div className="max-w-4xl mx-auto">
                                <Card className="rounded-3xl p-10 bg-white">
                                    <CardHeader className="text-center p-0 mb-8">
                                        <CardTitle>Font Kullanım Yönergesi</CardTitle>
                                        <CardDescription className="mt-2">Tipografik bütünlük, marka algısının sürekliliği açısından zorunludur.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-0">
                                         <FontCard title="Logo & Başlık Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                         <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        {/* Renkler */}
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center">Renk Paleti</h3>
                            <div className="max-w-4xl mx-auto">
                               <Card className="rounded-3xl p-10 bg-white">
                                <CardHeader className="text-center p-0">
                                    <CardTitle>Renk Kullanım Yönergesi</CardTitle>
                                    <CardDescription className="mt-2">Renkler yalnızca belirtilen HEX değerleriyle kullanılmalıdır.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 p-0">
                                    <ColorCard hex="#f34723" name="hangel Mercan" onCopy={() => copyColor('#f34723')} />
                                    <ColorCard hex="#1f1f1f" name="Gece Siyahı" onCopy={() => copyColor('#1f1f1f')} />
                                    <ColorCard hex="#f1f1f1" name="Açık Gri" onCopy={() => copyColor('#f1f1f1')} />
                                    <ColorCard hex="#042654" name="Lacivert" onCopy={() => copyColor('#042654')} />
                                </CardContent>
                               </Card>
                            </div>
                        </div>
                        {/* Kılavuzlar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t">
                            <Card className="bg-white rounded-3xl p-8 text-center shadow-lg">
                                <Landmark className="h-10 w-10 text-primary mx-auto mb-4"/>
                                <CardHeader className="p-0"><CardTitle>hangel Canva Marka Kiti</CardTitle></CardHeader>
                                <CardContent className="p-0 mt-2"><CardDescription>Logo, renk, yazı tipi ve görsellere Canva üzerinden erişin.</CardDescription></CardContent>
                                <CardFooter className="p-0 mt-6 justify-center"><Button asChild><a href="#" target="_blank" rel="noopener noreferrer">Canva Marka Kitine Git</a></Button></CardFooter>
                            </Card>
                            <Card className="bg-white rounded-3xl p-8 text-center shadow-lg">
                                <DownloadCloud className="h-10 w-10 text-primary mx-auto mb-4"/>
                                <CardHeader className="p-0"><CardTitle>Kurumsal Kimlik Kılavuzu</CardTitle></CardHeader>
                                <CardContent className="p-0 mt-2"><CardDescription>Marka değerleri, logo kullanım standartları ve iletişim dili rehberi.</CardDescription></CardContent>
                                <CardFooter className="p-0 mt-6 justify-center"><Button onClick={() => handleDownload('kurumsal-kimlik.pdf')}>PDF Olarak İndir</Button></CardFooter>
                            </Card>
                        </div>
                    </div>
                </Section>
                
                <Section id="kullanim-kurallari" className="bg-white">
                    <SectionTitle>Kullanım Kuralları</SectionTitle>
                    <SectionDescription>
                        Marka bütünlüğümüzü korumak ve yasal uyumluluğu sağlamak için logo, isim ve diğer varlıklarımızın kullanımı aşağıdaki kurallara tabidir.
                    </SectionDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
                        <RuleCard title="Değişiklik Yasağı" icon={Ruler}>
                            <ul><li>Oranları bozulamaz</li><li>Renkleri değiştirilemez</li><li>Eğilemez</li><li>Üzerine efekt, gölge veya desen eklenemez</li><li>Başka grafik öğelerle birleştirilemez</li><li>Logo sabittir. Yeniden yorumlanamaz.</li></ul>
                        </RuleCard>
                        <RuleCard title="Hiyerarşi Prensibi" icon={Ruler}>
                             <h4>hangel logosu destekleyici marka unsuru olarak konumlandırılır.</h4>
                             <p>Ana marka, iş birliği yapan kurumun markasıdır. hangel; platform, altyapı veya entegrasyon sağlayıcı rolünde yer alır. Logo hiçbir koşulda en baskın görsel unsur olarak konumlandırılamaz.</p>
                        </RuleCard>
                        <RuleCard title="Ortak Markalama (Co-Branding)" icon={Handshake}>
                             <p>Ortak kampanya ve sponsorluk durumlarında logolar eşit ölçekte, yatay hizada ve aralarında minimum "h yüksekliği" kadar boşluk bırakılarak kullanılmalıdır. Birleşik tek bir görsel kilit (lock-up) oluşturulamaz.</p>
                        </RuleCard>
                        <RuleCard title="İsim ve Metin Kullanımı" icon={Type}>
                            <p>"hangel" kelimesinde "h" harfi büyük yazılamaz. Metin içinde farklı yazı tipi veya ölçekte manipüle edilemez. Şirket veya ürün adınıza eklenemez (örn: "hangelPro" yasaktır). İzin verilen kullanım: "hangel için geliştirildi".</p>
                        </RuleCard>
                        <RuleCard title="Medya ve Yayın Kullanımı" icon={Tv}>
                             <p>TV, film, radyo, açık hava reklamları ve A4 boyutundan büyük baskı materyallerinde kullanım için yazılı izin alınması zorunludur. Yayın içeriklerinde, platformdaki marka ve STK'lara doğru atıf yapılması esastır.</p>
                        </RuleCard>
                        <RuleCard title="Yasal Çerçeve" icon={Scale}>
                            <p>hangel, fikri mülkiyetinin korunması amacıyla tescil süreçlerini yürütür. Markalarımız, yalnızca bu yönergelerde belirtildiği şekilde veya yazılı izinle kullanılabilir. Hizmet Şartları ile çelişen kullanımlar yasaktır. hangel, marka kullanım iznini dilediği zaman tek taraflı olarak iptal etme hakkını saklı tutar.</p>
                        </RuleCard>
                    </div>
                </Section>
                
                <Section className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Marka, bir görselden ibaret değildir.</h2>
                    <p className="text-xl text-primary font-semibold">Marka, bir taahhüttür.</p>
                    <p className="text-muted-foreground max-w-2xl mx-auto mt-6">
                        Her doğru kullanım; kurumsal itibarı güçlendirir, kamusal güveni artırır ve dayanışmayı görünür kılar. Bu yolculukta gösterdiğiniz hassasiyet için teşekkür ederiz.
                    </p>
                </Section>
            </main>

            <PublicFooter currentPageLabel="Basın Kiti" />
        </div>
    );
}
