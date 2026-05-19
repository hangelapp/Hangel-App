
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Download,
    ArrowLeft,
    Type,
    Copy,
    DownloadCloud,
    Ruler,
    Handshake,
    Maximize,
    XCircle,
    FileCheck,
    Package,
    Share2,
    Tv,
    Shield,
    ChevronRight,
    ShieldCheck,
    MessageSquare,
    Megaphone,
    // P2-4: explicit named imports for the closed icon enum below.
    HeartHandshake,
    HandCoins,
    School,
    Store,
    Building2,
    Library,
    Sparkles,
    Palette,
    Globe,
    BookCopy,
    Users,
    HelpCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { useTranslation } from '@/components/providers/language-provider';

// P2-4: closed enum for ShowcaseCard icon lookup — replaces `Icons[item.icon]`.
type LogoIconName =
    | 'HeartHandshake'
    | 'HandCoins'
    | 'School'
    | 'Store'
    | 'Building2'
    | 'Library'
    | 'Sparkles'
    | 'Palette'
    | 'Globe'
    | 'BookCopy'
    | 'Users';

const iconMap: Record<LogoIconName, React.ComponentType<{ className?: string }>> = {
    HeartHandshake,
    HandCoins,
    School,
    Store,
    Building2,
    Library,
    Sparkles,
    Palette,
    Globe,
    BookCopy,
    Users,
};


const _XIcon = (props: React.ComponentProps<'svg'>) => (
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

const appArchitecture: ReadonlyArray<{ href: string; icon: LogoIconName; label: string; description: string }> = [
    { href: "/volunteering", icon: 'HeartHandshake', label: "hangel imece", description: "Yetenek bazlı gönüllülük platformu." },
    { href: "/market", icon: 'HandCoins', label: "hangel bağış", description: "Alışverişle sosyal fayda yaratma modeli." },
    { href: "/admin/clubs", icon: 'School', label: "hangel clubs", description: "Öğrenci kulüpleri için dijital yönetim ve etki merkezi." },
    { href: "/merchant", icon: 'Store', label: "hangel marka", description: "Sosyal fayda odaklı markalar ve işletmeler." },
    { href: "/ngo-onboarding", icon: 'Building2', label: "hangel STK", description: "Sivil toplum kuruluşları için dijital dönüşüm araçları." },
    { href: "/library", icon: 'Library', label: "hangel kütüphane", description: "Sosyal etki ve sivil toplum kaynak merkezi." },
];

const associationArchitecture: ReadonlyArray<{ href: string; icon: LogoIconName; label: string; description: string }> = [
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
  item: { href: string; icon: LogoIconName; label: string; description: string };
  themeConfig: { bg: string; subtitleColor: string; titleColor: string; linkColor: string; iconColor: string };
}) => {
  const Icon = iconMap[item.icon] || HelpCircle;
  return (
    <Link href={item.href} className="group block h-full">
      <div className={cn("rounded-[2rem] p-4 text-center flex flex-col justify-between min-h-[180px]", themeConfig.bg)}>
        <div>
          <h3 className={cn("text-xl font-black leading-tight", themeConfig.titleColor)}>{item.label}</h3>
          <p className={cn("text-xs mt-1", themeConfig.subtitleColor)}>{item.description}</p>
          <div className="mt-2">
             <span className={cn("text-xs font-semibold flex items-center justify-center", themeConfig.linkColor)}>
                Daha fazla bilgi edin <ChevronRight className="h-3 w-3 ml-0.5" />
             </span>
          </div>
        </div>
        <div className="mt-2 flex-1 flex items-end justify-center">
            <div className="w-12 h-12 relative">
                <Icon className={cn("w-full h-full", themeConfig.iconColor)} />
            </div>
        </div>
      </div>
    </Link>
  );
};

const LogoShowcaseCard = ({ title, description, children, onDownload }: { title: string, description: string, children: React.ReactNode, onDownload: () => void }) => (
    <Card className="rounded-[1.75rem] h-full flex flex-col bg-white overflow-hidden shadow-sm border border-black/5 hover:shadow-xl transition-shadow group">
        <div className="relative aspect-square w-full flex items-center justify-center p-4 bg-muted/30">
            {children}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
            <Button size="sm" variant="ghost" className="text-xs mt-2 p-0 h-auto self-start text-primary hover:text-primary group-hover:underline" onClick={onDownload}>
                PNG İndir <Download className="ml-1.5 h-3.5 w-3.5"/>
            </Button>
        </CardContent>
    </Card>
);

const FontCard = ({ title, fontName, onDownload }: { title: string, fontName: string, onDownload: () => void }) => (
    <div className="border rounded-2xl p-4 text-center space-y-2 bg-white/50">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-2xl", fontName.includes('Bold') && 'font-bold', fontName.includes('SemiBold') && 'font-semibold')}>Aa</p>
        <p className="text-base font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, rgb, cmyk, onCopy }: { hex: string, name: string, rgb: string, cmyk: string, onCopy: () => void }) => (
    <div 
        className="group cursor-pointer bg-white rounded-2xl shadow-sm overflow-hidden border border-black/5 hover:shadow-xl transition-all duration-300 flex flex-col h-[220px]"
        onClick={onCopy}
    >
        <div className="relative w-full h-16" style={{ backgroundColor: hex }} />
        <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-bold text-base text-foreground">{name}</h4>
            <div className="mt-2 text-xs text-muted-foreground space-y-1 font-mono flex-1">
                <p>HEX: {hex}</p>
                <p>RGB: {rgb}</p>
                <p>CMYK: {cmyk}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-black/5">
                <span className="text-primary text-xs font-semibold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Copy className="w-3 h-3" /> Kodu Kopyala
                </span>
            </div>
        </div>
    </div>
);

export default function LogoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();

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
            content: <HangelLogo className="text-4xl text-primary" />
        },
        {
            title: "İkincil Logo",
            description: "Zeminli Logo (PNG)",
            onDownload: () => handleDownload('ikincil-logo.png'),
            content: <div className="p-3 bg-primary rounded-xl"><HangelLogo className="text-4xl text-white" /></div>
        },
        {
            title: "Üçüncül Logo",
            description: "Beyaz Logo (PNG) – (Zorunlu hallerde)",
            onDownload: () => handleDownload('beyaz-logo.png'),
            content: <div className="p-3 bg-black rounded-xl w-full h-full flex items-center justify-center"><HangelLogo className="text-4xl text-white" /></div>
        },
        {
            title: "App Icon",
            description: "Mobil Uygulama Simgesi (PNG)",
            onDownload: () => handleDownload('app-icon.png'),
            content: <div className="p-3 bg-primary rounded-2xl"><span className="text-2xl font-black text-white">h</span></div>
        },
    ];

    const dernekLogos = [
        {
            title: "Birincil Logo",
            description: "Zeminsiz Logo (PNG)",
            onDownload: () => handleDownload('dernek-birincil-logo.png'),
            content: <HangelLogo className="text-4xl" style={{color: '#042654'}} />
        },
        {
            title: "İkincil Logo",
            description: "Zeminli Logo (PNG)",
            onDownload: () => handleDownload('dernek-ikincil-logo.png'),
            content: <div className="p-3 rounded-xl" style={{backgroundColor: '#042654'}}><HangelLogo className="text-4xl text-white" /></div>
        },
        {
            title: "Üçüncül Logo",
            description: "Beyaz Logo (PNG)",
            onDownload: () => handleDownload('dernek-beyaz-logo.png'),
            content: <div className="p-3 bg-black rounded-xl w-full h-full flex items-center justify-center"><HangelLogo className="text-4xl text-white" /></div>
        },
        {
            title: "Dernek Icon",
            description: "Mobil Uygulama Simgesi (PNG)",
            onDownload: () => handleDownload('dernek-app-icon.png'),
            content: <div className="p-3 bg-primary rounded-2xl" style={{backgroundColor: '#042654'}}><span className="text-2xl font-black text-white">h</span></div>
        },
    ];
    
    // P2-5f: rules content i18n via translation keys; titles + multi-paragraph content
    // resolved per id (verbatim copy lives in `marketing.logo.rules.<id>.{title,content}`).
    const rules = [
      { id: 'izin', tkey: 'izin', icon: FileCheck },
      { id: 'standart', tkey: 'standart', icon: Type },
      { id: 'bosluk', tkey: 'bosluk', icon: Maximize },
      { id: 'degisiklik', tkey: 'degisiklik', icon: XCircle },
      { id: 'boyut', tkey: 'boyut', icon: Ruler },
      { id: 'ikonlar', tkey: 'ikonlar', icon: Package },
      { id: 'sosyal-medya', tkey: 'sosyalMedya', icon: Share2 },
      { id: 'tv', tkey: 'tv', icon: Tv },
      { id: 'cobranding', tkey: 'cobranding', icon: Handshake },
      { id: 'dil-ton', tkey: 'dilTon', icon: MessageSquare },
      { id: 'slogan', tkey: 'slogan', icon: Megaphone },
      { id: 'yasal', tkey: 'yasal', icon: Shield },
    ] as const;

    const themeConfigs = [
        { bg: 'bg-[#f5f5f7]', subtitleColor: 'text-muted-foreground', titleColor: 'text-foreground', linkColor: 'text-primary', iconColor: 'text-primary/20' },
        { bg: 'bg-white', subtitleColor: 'text-muted-foreground', titleColor: 'text-foreground', linkColor: 'text-primary', iconColor: 'text-primary/20' },
        { bg: 'bg-black', subtitleColor: 'text-white/60', titleColor: 'text-white', linkColor: 'text-blue-500', iconColor: 'text-white/20' },
    ];
    
     const colors = [
        { hex: '#f34723', name: 'hangel Mercan', rgb: '243, 71, 35', cmyk: '0, 71, 86, 5' },
        { hex: '#1f1f1f', name: 'Gece Siyahı', rgb: '31, 31, 31', cmyk: '0, 0, 0, 88' },
        { hex: '#f1f1f1', name: 'Açık Gri', rgb: '241, 241, 241', cmyk: '0, 0, 0, 5' },
        { hex: '#042654', name: 'Lacivert', rgb: '4, 38, 84', cmyk: '95, 55, 0, 67' }
    ];


    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans">
             <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">{t('marketing.logo.navLabel')}</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-24">
                <Section className="text-center pt-24 pb-20 md:pt-32 md:pb-28">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-none">
                       {t('marketing.logo.heroTitle')}
                    </h1>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-4">
                        {t('marketing.logo.heroDescription')}
                    </p>
                </Section>
                
                <Section id="mimari" className="bg-white">
                    <SectionTitle>{t('marketing.logo.architectureTitle')}</SectionTitle>
                     <p className="text-center text-muted-foreground mt-4 max-w-3xl mx-auto">
                        {t('marketing.logo.archIntro')}
                    </p>
                    <div className="space-y-16 mt-16">
                         <div className="text-center space-y-2">
                             <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('marketing.logo.anaMarka')}</h3>
                             <HangelLogo className="text-5xl" />
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center text-primary">{t('marketing.logo.appSubBrandsTitle')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {appArchitecture.map((item) => (
                                    <ShowcaseCard
                                        key={item.href}
                                        item={item}
                                        themeConfig={themeConfigs[0]}
                                    />
                                ))}
                            </div>
                        </div>
                         <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center text-primary">{t('marketing.logo.dernekSubBrandsTitle')}</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {associationArchitecture.map((item, index) => (
                                    <ShowcaseCard
                                        key={`${item.href}-${index}`}
                                        item={item}
                                        themeConfig={themeConfigs[0]}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-16 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                        <h4 className="font-bold text-foreground mb-2">{t('marketing.logo.moreProductsTitle')}</h4>
                        <p>{t('marketing.logo.moreProductsDesc')}</p>
                    </div>
                </Section>
                
                 <Section id="medya-kiti">
                    <div className="space-y-20">
                        <SectionTitle>{t('marketing.logo.mediaKitTitle')}</SectionTitle>
                        
                        <div className="space-y-12">
                            <h3 className="text-3xl font-bold tracking-tight text-center">{t('marketing.logo.logolarTitle')}</h3>
                            <div className="space-y-12">
                                <div className='space-y-6'>
                                    <h4 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">{t('marketing.logo.asLogolarTitle')}</h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {asLogos.map((logo, index) => (
                                            <LogoShowcaseCard key={index} title={logo.title} description={logo.description} onDownload={logo.onDownload}>
                                                {logo.content}
                                            </LogoShowcaseCard>
                                        ))}
                                    </div>
                                </div>
                                <div className='space-y-6'>
                                    <h4 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">{t('marketing.logo.dernekLogolarTitle')}</h4>
                                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {dernekLogos.map((logo, index) => (
                                            <LogoShowcaseCard key={index} title={logo.title} description={logo.description} onDownload={logo.onDownload}>
                                                {logo.content}
                                            </LogoShowcaseCard>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <h3 className="text-3xl font-bold tracking-tight text-center">{t('marketing.logo.fontsTitle')}</h3>
                            <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>{t('marketing.logo.fontGuideTitle')}</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                   <FontCard title={t('marketing.logo.logoFontCardTitle')} fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                   <FontCard title={t('marketing.logo.headingFontCardTitle')} fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                   <FontCard title={t('marketing.logo.bodyFontCardTitle')} fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                               </CardContent>
                           </Card>
                        </div>

                        <div className="space-y-12">
                            <h3 className="text-3xl font-bold tracking-tight text-center">{t('marketing.logo.colorsTitle')}</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {colors.map((color, index) => (
                                    <ColorCard key={index} {...color} onCopy={() => copyColor(color.hex)} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="text-3xl font-bold tracking-tight text-center">{t('marketing.logo.kurumsalKimlikTitle')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                 <Card className="rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                                     <DownloadCloud className="h-16 w-16 mx-auto text-primary" />
                                     <div className="space-y-1">
                                         <h3 className="text-2xl font-bold">{t('marketing.logo.kimlikKilavuzuTitle')}</h3>
                                         <p className="text-muted-foreground max-w-md mx-auto">{t('marketing.logo.kimlikKilavuzuDesc')}</p>
                                     </div>
                                     <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                         {t('marketing.logo.downloadPdf')}
                                     </Button>
                                 </Card>
                                 <Card className="rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                                     <Image src="https://logo.clearbit.com/canva.com" alt="Canva Logo" width={64} height={64} className="mx-auto h-16 w-16" />
                                     <div className="space-y-1">
                                         <h3 className="text-2xl font-bold">{t('marketing.logo.canvaTitle')}</h3>
                                         <p className="text-muted-foreground max-w-md mx-auto">{t('marketing.logo.canvaDesc')}</p>
                                     </div>
                                     <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold">
                                         <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer">{t('marketing.logo.canvaCta')}</a>
                                     </Button>
                                 </Card>
                             </div>
                        </div>
                    </div>
                </Section>
                
                 <Section id="kullanim-kurallari" className="bg-white">
                    <SectionTitle>{t('marketing.logo.usageTitle')}</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                        {rules.map((rule) => {
                            const content = t(`marketing.logo.rules.${rule.tkey}.content`);
                            const paragraphs = content.split('\n\n');
                            return (
                                <RuleCard key={rule.id} icon={rule.icon} title={t(`marketing.logo.rules.${rule.tkey}.title`)}>
                                     <div className="space-y-3">
                                        {paragraphs.map((text, i) => <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(text.replace(/•/g, '<span class="mr-2">•</span>')) }} />)}
                                    </div>
                                </RuleCard>
                            );
                        })}
                    </div>
                </Section>
                
                <Section className="text-left">
                    <div className="text-sm text-muted-foreground max-w-3xl space-y-4">
                        <p>
                           {t('marketing.logo.legalBlurb')}
                        </p>
                    </div>
                </Section>

                <Section className="text-center">
                    <Card className="max-w-3xl mx-auto rounded-3xl p-12 space-y-6 shadow-xl bg-white">
                        <ShieldCheck className="h-16 w-16 mx-auto text-primary" />
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('marketing.logo.sonSozLabel')}</h3>
                            <p className="text-xl md:text-2xl font-medium text-foreground max-w-2xl mx-auto">
                                {t('marketing.logo.sonSozBody')}
                            </p>
                        </div>
                        <p className="text-lg font-bold text-foreground" dangerouslySetInnerHTML={{ __html: t('marketing.logo.sonSozMotto') }} />
                    </Card>
                </Section>
            </main>

            <PublicFooter currentPageLabel={t('marketing.logo.footerLabel')} />
        </div>
    );
}
