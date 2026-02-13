
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
    Scale,
    Sparkles,
    Building2,
    Globe,
    HeartHandshake, 
    School, 
    Store,
    Library,
    Users,
    Brain,
    BookOpen,
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
    HandCoins
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

const ArchitectureCard = ({ icon: Icon, label, description, href, iconBgClass, category }: { icon: React.ElementType, label: string, description: string, href: string, iconBgClass?: string, category: string }) => (
    <Link href={href} className="group block">
        <Card className="relative h-full text-left p-6 space-y-4 hover:shadow-xl transition-shadow rounded-2xl overflow-hidden bg-background">
             <div className={cn(
                "absolute top-3 right-3 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm",
                iconBgClass === 'bg-primary' ? 'bg-black/20' : 'bg-white/20'
            )}>
                <HangelLogo className="text-[10px] opacity-80" />
                <span>{category}</span>
            </div>
            
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgClass)}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <h4 className="font-bold text-base text-foreground">{label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </Card>
    </Link>
);


const LogoDisplayCard = ({ title, description, children, onDownload }: { title: string, description: string, children: React.ReactNode, onDownload: () => void }) => (
    <div className="border rounded-2xl bg-white/50 text-center flex flex-col shadow-sm hover:shadow-lg transition-shadow">
        <div className="h-32 w-full flex items-center justify-center p-6 bg-muted/30 rounded-t-2xl">
            {children}
        </div>
        <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
            <Button size="sm" variant="outline" className="text-xs mt-4 w-full" onClick={onDownload}>
                <Download className="mr-2 h-3.5 w-3.5"/> PNG İndir
            </Button>
        </div>
    </div>
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
    { href: "/volunteering", icon: HeartHandshake, label: "hangel imece", description: "Yetenek bazlı gönüllülük platformu." },
    { href: "/market", icon: HandCoins, label: "hangel bağış", description: "Alışverişle sosyal fayda yaratma modeli." },
    { href: "/admin/clubs", icon: School, label: "hangel clubs", description: "Öğrenci kulüpleri için dijital yönetim ve etki merkezi." },
    { href: "/merchant", icon: Store, label: "hangel marka", description: "Sosyal fayda odaklı markalar ve işletmeler." },
    { href: "/ngo-onboarding", icon: Building2, label: "hangel STK", description: "Sivil toplum kuruluşları için dijital dönüşüm araçları." },
    { href: "/library", icon: Library, label: "hangel kütüphane", description: "Sosyal etki ve sivil toplum kaynak merkezi." },
];

const associationArchitecture = [
    { href: "/hangelassociation/projects/sosyal-inovasyon", icon: Sparkles, label: "Sosyal İnovasyon Merkezi", description: "Toplumsal sorunlara yenilikçi çözümler geliştirir." },
    { href: "/hangelassociation/projects/sanat", icon: Palette, label: "hangel Sanat", description: "Sanatın birleştirici gücüyle farkındalık projeleri." },
    { href: "/hangelassociation/projects/etki-atlasi", icon: Globe, label: "Global Sosyal Girişim Atlası", description: "Dünya genelindeki sosyal girişimleri haritalar." },
    { href: "/hangelassociation/workshop", icon: BookOpen, label: "Girişimcilik Kütüphanesi", description: "Sosyal girişimciler için bilgi ve kaynak merkezi." },
    { href: "/hangelassociation/workshop", icon: Users, label: "Uluslararası Sosyal Girişimcilik Çalıştayı", description: "Küresel sorunlara kolektif çözümler üretir." },
];

const RuleCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl p-8 shadow-lg border border-black/5 text-left h-full">
        <Icon className="h-10 w-10 text-primary mb-4" />
        <h4 className="font-bold text-lg text-foreground mb-2">{title}</h4>
        <div className="text-sm text-muted-foreground space-y-2">
            {children}
        </div>
    </div>
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
                    <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed mt-8">
                       hangel logosu yalnızca bir görsel kimlik unsuru değildir. Ortak değerlerimizin, kolektif üretim anlayışımızın ve toplumsal sorunlara karşı geliştirdiğimiz dayanışma kültürünün kurumsal temsildir.
                    </p>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-4">
                        Bu logo; eşit mesafede duran, tarafsız, şeffaf ve kolektif iyiliği önceleyen bir yapının sembolüdür. Logonun doğru, tutarlı ve mevzuata uygun biçimde kullanımı; marka bütünlüğünün korunmasını, kamusal algının netliğini ve hukuki güvenliğin sürdürülmesini sağlar. Logomuzu her doğru kullanımınız, dayanışma zincirine eklenen yeni bir halkadır.
                    </p>
                </Section>
                
                <Section id="mimari" className="bg-white">
                    <SectionTitle>Marka Mimarisi</SectionTitle>
                    <div className="space-y-12 mt-16">
                        <div className="text-center space-y-2">
                             <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ana Marka</h3>
                             <HangelLogo className="text-5xl" />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold tracking-tight text-center text-primary">hangel App Alt Markaları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {appArchitecture.map(item => <ArchitectureCard key={item.label} {...item} iconBgClass="bg-primary" category="App" />)}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold tracking-tight text-center" style={{color: '#042654'}}>hangel Derneği Alt Markaları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {associationArchitecture.map(item => <ArchitectureCard key={item.label} {...item} iconBgClass="bg-[#042654]" category="Dernek" />)}
                            </div>
                        </div>
                    </div>
                     <div className="mt-16 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                        <h4 className="font-bold text-foreground mb-2">Daha fazla ürün</h4>
                        <p>Aradığınız bir alt marka veya ürün için özel bir kullanım yönergesi bulamıyorsanız, bu sayfadaki genel marka kullanım ilkelerine başvurabilir veya destek merkezimizden yardım alabilirsiniz. Doğru kullanım hakkında bilgi edinmek için genel kılavuzlarımızı, API ve ürün entegrasyonu yönergelerimizi veya ticari marka kurallarımızı inceleyebilirsiniz.</p>
                    </div>
                </Section>
                
                <Section id="medya-kiti">
                    <SectionTitle>Medya Kiti</SectionTitle>
                    <div className="mt-16 space-y-20">
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center">Logolar</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <LogoDisplayCard title="Birincil Logo" description="Zeminsiz Logo (PNG)" onDownload={() => handleDownload('birincil-logo.png')}>
                                    <HangelLogo className="text-5xl text-primary" />
                                </LogoDisplayCard>
                                <LogoDisplayCard title="İkincil Logo" description="Zeminli Logo (PNG)" onDownload={() => handleDownload('ikincil-logo.png')}>
                                    <div className="p-4 bg-primary rounded-2xl"><HangelLogo className="text-5xl text-white" /></div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="Üçüncül Logo" description="Beyaz Logo (PNG) – (Zorunlu hallerde kullanılmalıdır.)" onDownload={() => handleDownload('beyaz-logo.png')}>
                                    <div className="p-4 bg-black rounded-2xl w-full h-full flex items-center justify-center">
                                        <HangelLogo className="text-5xl text-white" />
                                    </div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="App Icon" description="(PNG)" onDownload={() => handleDownload('app-icon.png')}>
                                    <div className="p-4 bg-primary rounded-3xl"><span className="text-5xl font-black text-white">h</span></div>
                                </LogoDisplayCard>
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                             <div className="max-w-4xl mx-auto">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold tracking-tight">Yazı Tipleri</h3>
                                    <p className="text-center text-xs text-muted-foreground max-w-xs mx-auto">Tipografik bütünlük, marka algısının sürekliliği açısından zorunludur.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FontCard title="Logo & Başlık Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                    <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                                    <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                            <h3 className="text-2xl font-bold tracking-tight text-center">Marka Renkleri</h3>
                            <div className="max-w-4xl mx-auto">
                               <Card className="rounded-3xl p-10 bg-white/50">
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
                        </div>
                        
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
                                <CardContent className="p-0 mt-2"><CardDescription>Marka değerlerimizi, logo kullanım standartlarımızı ve iletişim dilimizi içeren rehber.</CardDescription></CardContent>
                                <CardFooter className="p-0 mt-6 justify-center"><Button onClick={() => handleDownload('kurumsal-kimlik.pdf')}>PDF olarak indir.</Button></CardFooter>
                            </Card>
                        </div>
                    </div>
                </Section>
                
                 <Section id="kullanim-kurallari" className="bg-white">
                    <SectionTitle>Logo Kullanım İlkeleri</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
                        <RuleCard icon={Ruler} title="BOŞLUK (CLEAR SPACE) KURALI">
                            <p>Logonun etrafındaki minimum güvenli alan, “h” harfinin yüksekliği kadar veya daha fazla olmalıdır. Bu alan içerisine metin, görsel, grafik öğe, çerçeve veya ikon yerleştirilemez.</p>
                        </RuleCard>
                        <RuleCard icon={XCircle} title="DEĞİŞİKLİK YASAĞI">
                           <p>Logo sabittir. Yeniden yorumlanamaz. Oranları bozulamaz, renkleri değiştirilemez, eğilemez, üzerine efekt, gölge veya desen eklenemez, başka grafik unsurlarla birleştirilemez.</p>
                        </RuleCard>
                        <RuleCard icon={Layers} title="HİYERARŞİ PRENSİBİ">
                            <p>hangel logosu destekleyici marka unsuru olarak konumlandırılır. Ana marka, iş birliği yapan kurumun markasıdır. hangel; platform, altyapı veya entegrasyon sağlayıcı rolünde yer alır.</p>
                        </RuleCard>
                         <RuleCard icon={Handshake} title="CO-BRANDING KURALLARI">
                             <p>Ortak kampanya, sponsorluk veya entegrasyon durumlarında aşağıdaki ilkeler uygulanır: Logo eşit ölçekli kullanılmalıdır. İki logo arasında minimum “h yüksekliği” kadar boşluk bırakılmalıdır. Logolar yatay hizalı olmalıdır. Birleşik tek bir görsel kilit (lock-up) oluşturulamaz. Basılı büyük ölçekli mecralarda, açık hava reklamlarında, televizyon ve dijital yayınlarda yazılı izin zorunludur.</p>
                        </RuleCard>
                        <RuleCard icon={FileCheck} title="MARKA KULLANIM İZNİ">
                            <p>hangel varlıklarını yayın, radyo, açık hava reklamı, TV, A4’ten büyük baskı materyali içinde kullanmak isteyenler yazılı izin almak zorundadır. Talep dosyasında kullanım taslağı sunulmalıdır.</p>
                        </RuleCard>
                        <RuleCard icon={Type} title="İSİM VE METİN STANDARTLARI">
                             <p>“hangel” kelimesi küçük harfle başlar, değiştirilemez veya başka kelimelerle birleştirilemez (Yasak: hangelPro, Doğru: “hangel için”).</p>
                        </RuleCard>
                        <RuleCard icon={Package} title="ÜRÜN İKONLARI">
                            <p>Eğitim ve bilgilendirme amaçlı kullanılabilir ancak resmi ortaklık algısı oluşturamaz ve ana marka kimliğinin yerine geçemez.</p>
                        </RuleCard>
                         <RuleCard icon={Share2} title="SOSYAL MEDYA">
                            <p>Resmi hesap algısı yaratacak kullanım yasaktır (Yanlış: “hangel Haber”, Doğru: “hangel hakkında haberler”). Hashtag üzerinde hak iddia edilemez.</p>
                        </RuleCard>
                        <RuleCard icon={Tv} title="TV, FİLM VE YAYINCILIK">
                            <p>Yayın içeriklerinde doğru atıf esastır. Profil ekran görüntüleri kullanımı için ilgili kurumdan yazılı izin alınmalıdır.</p>
                        </RuleCard>
                         <RuleCard icon={Scale} title="YASAL ÇERÇEVE">
                            <p>hangel, fikri mülkiyet haklarını korumak için gerekli yasal süreçleri yürütür. Ticari markalarımız tescil ettirilemez veya benzer şekilde kullanılamaz. hangel, marka kullanım iznini tek taraflı olarak iptal etme hakkını saklı tutar.</p>
                        </RuleCard>
                    </div>
                </Section>
                
                <Section className="text-left">
                    <div className="text-left text-sm text-muted-foreground max-w-3xl space-y-4">
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

    