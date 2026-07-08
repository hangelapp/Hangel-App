
'use client';

import React, { useRef } from 'react';
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
import { useWebPage } from '@/hooks/use-site-content';
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
    <Card className="group relative bg-white rounded-[1.75rem] p-7 shadow-sm border border-black/5 text-left h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20">
        {/* Üstte ince marka aksanı */}
        <span className="absolute inset-x-0 top-0 h-1 bg-primary/80 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 transition-colors group-hover:bg-primary group-hover:text-white">
            <Icon className="h-6 w-6" />
        </div>
        <CardHeader className="p-0"><CardTitle className="text-lg font-bold tracking-tight text-foreground mb-3 leading-snug">{title}</CardTitle></CardHeader>
        <CardContent className="p-0 text-sm text-muted-foreground leading-relaxed space-y-2.5">
            {children}
        </CardContent>
    </Card>
);

// Alt marka kartları tanıtım/bilgi sayfalarına yönlendirir (işlevsel sayfalara değil).
const appArchitecture: ReadonlyArray<{ href: string; icon: LogoIconName; label: string; description: string }> = [
    { href: "/imece", icon: 'HeartHandshake', label: "hangel imece", description: "Yetenek bazlı gönüllülük platformu." },
    { href: "/social-impact", icon: 'HandCoins', label: "hangel bağış", description: "Alışverişle sosyal fayda üretme modeli." },
    { href: "/clubs", icon: 'School', label: "hangel clubs", description: "Öğrenci kulüpleri için dijital yönetim ve etki merkezi." },
    { href: "/corporate", icon: 'Store', label: "hangel marka", description: "Sosyal fayda odaklı markalar ve işletmeler." },
    { href: "/social-entrepreneurship", icon: 'Building2', label: "hangel STK", description: "Sivil toplum kuruluşları için dijital dönüşüm araçları." },
    { href: "/library", icon: 'Library', label: "hangel kütüphane", description: "Sosyal etki ve sivil toplum kaynak merkezi." },
];

const associationArchitecture: ReadonlyArray<{ href: string; icon: LogoIconName; label: string; description: string }> = [
    { href: "/hangelassociation/projects/sosyal-inovasyon", icon: 'Sparkles', label: "Sosyal İnovasyon Merkezi", description: "Toplumsal sorunlara yenilikçi çözümler geliştirir." },
    { href: "/hangelassociation/projects/sanat", icon: 'Palette', label: "hangel Sanat", description: "Sanatın birleştirici gücüyle farkındalık projeleri." },
    { href: "/hangelassociation/projects/etki-atlasi", icon: 'Globe', label: "hangel Sosyal Etki Envanteri", description: "Sosyal etki verilerini derler ve envanterler." },
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
  // Başlığa/karta tıklanınca alt markanın "daha fazla bilgi" sayfasına gider (item.href).
  return (
    <Link href={item.href} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
      {/* Kompakt: alt markalar yarı boyutta sergilenir (min-h ~90, küçük ikon/metin). */}
      <div className={cn("rounded-2xl p-3.5 text-left flex flex-col justify-between min-h-[112px] border border-black/5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-primary/20", themeConfig.bg)}>
        <div>
          <h3 className={cn("text-sm font-bold tracking-tight leading-tight", themeConfig.titleColor)}>{item.label}</h3>
          <p className={cn("text-[10px] mt-1 leading-snug line-clamp-2", themeConfig.subtitleColor)}>{item.description}</p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-1">
            <span className={cn("text-[9px] font-semibold inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", themeConfig.linkColor)}>Detay <ChevronRight className="h-2.5 w-2.5" /></span>
            <div className="w-6 h-6 relative shrink-0 ml-auto">
                <Icon className={cn("w-full h-full", themeConfig.iconColor)} />
            </div>
        </div>
      </div>
    </Link>
  );
};

// Logo görseli zeminli mi (siyah/lacivert vb.) — JPG/PDF için arka plan rengi seçimini etkiler.
type LogoExportFormat = 'png' | 'jpg' | 'pdf';

// Gerçek marka varlık dosyaları (public/brand). Poppins Bold "hangel"
// glyphleri OUTLINE (vektör path) — self-contained SVG + yüksek çöz. PNG.
type BrandFiles = { svg?: string; png?: string };

const LogoShowcaseCard = ({
    title,
    description,
    children,
    baseName,
    captureBg,
    onDownload,
    files,
    previewSrc,
    previewBg,
    previewClass = 'w-40',
}: {
    title: string;
    description: string;
    children?: React.ReactNode;
    baseName: string;
    captureBg: string;
    onDownload: (node: HTMLElement, baseName: string, format: LogoExportFormat, captureBg: string) => void;
    files?: BrandFiles;
    previewSrc?: string;
    previewBg?: string;
    previewClass?: string;
}) => {
    const logoRef = useRef<HTMLDivElement>(null);
    const trigger = (format: LogoExportFormat) => {
        if (logoRef.current) {
            onDownload(logoRef.current, baseName, format, captureBg);
        }
    };
    return (
        <Card className="rounded-3xl h-full flex flex-col bg-white overflow-hidden shadow-sm border border-black/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="relative aspect-square w-full flex items-center justify-center p-6 border-b border-black/5" style={{ backgroundColor: previewBg || '#f5f5f7' }}>
                <div ref={logoRef} className="flex items-center justify-center">
                    {files && previewSrc
                        ? <img src={previewSrc} alt={title} className={previewClass} />
                        : children}
                </div>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-sm tracking-tight text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed flex-1">{description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {files ? (
                        <>
                            {files.svg && (
                                <Button asChild size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-full border-black/10 hover:border-primary/40 hover:text-primary">
                                    <a href={files.svg} download>SVG <Download className="ml-1 h-3 w-3" /></a>
                                </Button>
                            )}
                            {files.png && (
                                <Button asChild size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-full border-black/10 hover:border-primary/40 hover:text-primary">
                                    <a href={files.png} download>PNG <Download className="ml-1 h-3 w-3" /></a>
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-full border-black/10 hover:border-primary/40 hover:text-primary" onClick={() => trigger('png')}>
                                PNG <Download className="ml-1 h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-full border-black/10 hover:border-primary/40 hover:text-primary" onClick={() => trigger('jpg')}>
                                JPG <Download className="ml-1 h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-full border-black/10 hover:border-primary/40 hover:text-primary" onClick={() => trigger('pdf')}>
                                PDF <Download className="ml-1 h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Poppins, next/font/google üzerinden gelir (self-host edilmiş .ttf/.woff dosyası yok).
// Bu nedenle font, resmi Google Fonts kaynağından indirilir.
const FontCard = ({ title, fontName, downloadHref }: { title: string, fontName: string, downloadHref: string }) => (
    <div className="rounded-2xl p-6 text-center space-y-3 bg-[#f5f5f7] border border-black/5 transition-colors hover:border-primary/20">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <p className={cn("text-5xl leading-none text-foreground", fontName.includes('Bold') && 'font-bold', fontName.includes('SemiBold') && 'font-semibold')}>Aa</p>
        <p className="text-sm font-semibold text-foreground">{fontName}</p>
        <Button asChild size="sm" variant="link" className="text-primary h-auto p-0">
            <a href={downloadHref} target="_blank" rel="noopener noreferrer" download>Fontu tıkla ve indir</a>
        </Button>
    </div>
);

const ColorCard = ({ hex, name, rgb, cmyk, onCopy }: { hex: string, name: string, rgb: string, cmyk: string, onCopy: () => void }) => (
    <div
        className="group cursor-pointer bg-white rounded-3xl shadow-sm overflow-hidden border border-black/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-[240px]"
        onClick={onCopy}
    >
        <div className="relative w-full h-24" style={{ backgroundColor: hex }} />
        <div className="p-5 flex-1 flex flex-col">
            <h4 className="font-bold text-base tracking-tight text-foreground">{name}</h4>
            <div className="mt-2 text-xs text-muted-foreground space-y-1 font-mono flex-1">
                <p>HEX: {hex}</p>
                <p>RGB: {rgb}</p>
                <p>CMYK: {cmyk}</p>
            </div>
            <div className="mt-2 pt-3 border-t border-black/5">
                <span className="text-primary text-xs font-semibold flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <Copy className="w-3 h-3" /> Kodu Kopyala
                </span>
            </div>
        </div>
    </div>
);

export default function LogoUsagePage() {
    const router = useRouter();
    const { toast } = useToast();
    const cms = useWebPage('logo-usage');
    const { t } = useTranslation();

    const handleDownload = (file: string) => {
        toast({
            title: "İndirme Başlatılıyor",
            description: `${file} indiriliyor...`,
        });
    };

    // Logo görselini DOM'dan canvas'a çizip PNG / JPG / PDF olarak indirir.
    // Logo asset dosyası bulunmadığı için (HangelLogo bir metin component'i),
    // render edilmiş düğüm html2canvas ile yakalanır — repodaki mevcut desenle aynı.
    const downloadLogo = async (
        node: HTMLElement,
        baseName: string,
        format: LogoExportFormat,
        captureBg: string,
    ) => {
        toast({
            title: "İndirme Başlatılıyor",
            description: `${baseName}.${format} indiriliyor...`,
        });
        try {
            const { default: html2canvas } = await import('html2canvas');
            // JPG/PDF'de şeffaflık desteklenmediği için zemin rengi uygulanır.
            const bg = format === 'png' ? null : captureBg;
            const canvas = await html2canvas(node, {
                scale: 4,
                backgroundColor: bg,
                useCORS: true,
                logging: false,
            });

            const triggerBlob = (blob: Blob | null, filename: string) => {
                if (!blob) {
                    toast({ variant: 'destructive', title: 'İndirme başarısız', description: 'Görsel oluşturulamadı.' });
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            if (format === 'png') {
                canvas.toBlob((blob) => triggerBlob(blob, `${baseName}.png`), 'image/png');
                return;
            }
            if (format === 'jpg') {
                canvas.toBlob((blob) => triggerBlob(blob, `${baseName}.jpg`), 'image/jpeg', 0.95);
                return;
            }
            // PDF — logo, oranı korunarak A4 sayfasına ortalanır.
            const { default: jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const maxW = pageW * 0.6;
            const ratio = canvas.height / canvas.width;
            const imgW = maxW;
            const imgH = maxW * ratio;
            const x = (pageW - imgW) / 2;
            const y = (pageH - imgH) / 2;
            if (captureBg && captureBg !== '#ffffff') {
                pdf.setFillColor(captureBg);
                pdf.rect(0, 0, pageW, pageH, 'F');
            }
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgW, imgH);
            pdf.save(`${baseName}.pdf`);
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'İndirme başarısız', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
        }
    };

    const copyColor = (hex: string) => {
        navigator.clipboard.writeText(hex);
        toast({
            title: "Renk Kodu Kopyalandı",
            description: `${hex} panoya kopyalandı.`,
        });
    };
    
    // İndirilen görseller kullanıcının verdiği gibi: wordmark tam ortada (yatay+dikey),
    // doğru renk tonları (turuncu zeminde beyaz, beyaz zeminde turuncu, dernek için lacivert).
    // href={null} → indirme sırasında <a> sarmalayıcısı yok, html2canvas temiz yakalar.
    // Resmi marka varlıkları — gerçek dosyalar (public/brand). Poppins Bold
    // "hangel" vektör outline; SVG (ölçeklenir) + yüksek çözünürlüklü PNG.
    // İndirilen dosya = önizlemede görünen dosya (birebir).
    const asLogos = [
        {
            title: "Ana Logo",
            description: "Turuncu wordmark, zeminsiz — birincil kullanım (SVG / PNG)",
            baseName: 'hangel-logo',
            captureBg: '#ffffff',
            files: { svg: '/brand/hangel-wordmark.svg', png: '/brand/hangel-wordmark.png' },
            previewSrc: '/brand/hangel-wordmark.svg',
            previewBg: '#f5f5f7',
            previewClass: 'w-40',
        },
        {
            title: "Ters Logo (Narçiçeği Zemin)",
            description: "Narçiçeği (#f34723) zemin, beyaz wordmark — birincil kullanımın ters versiyonu (SVG / PNG)",
            baseName: 'hangel-logo-ters-narciceg',
            captureBg: '#f34723',
            files: { svg: '/brand/hangel-wordmark-white.svg', png: '/brand/hangel-wordmark-white.png' },
            previewSrc: '/brand/hangel-wordmark-white.svg',
            previewBg: '#f34723',
            previewClass: 'w-40',
        },
        {
            title: "Beyaz Logo",
            description: "Beyaz wordmark — koyu/renkli zeminler için (SVG / PNG)",
            baseName: 'hangel-logo-beyaz',
            captureBg: '#f34723',
            files: { svg: '/brand/hangel-wordmark-white.svg', png: '/brand/hangel-wordmark-white.png' },
            previewSrc: '/brand/hangel-wordmark-white.svg',
            previewBg: '#f34723',
            previewClass: 'w-40',
        },
        {
            title: "Siyah Logo",
            description: "Koyu wordmark — açık zeminde tek renk (SVG / PNG)",
            baseName: 'hangel-logo-siyah',
            captureBg: '#ffffff',
            files: { svg: '/brand/hangel-wordmark-black.svg', png: '/brand/hangel-wordmark-black.png' },
            previewSrc: '/brand/hangel-wordmark-black.svg',
            previewBg: '#ffffff',
            previewClass: 'w-40',
        },
        {
            title: "Kare İkon",
            description: "Turuncu kare, beyaz logo — avatar / app ikon (SVG / PNG)",
            baseName: 'hangel-ikon',
            captureBg: '#f34723',
            files: { svg: '/brand/hangel-icon.svg', png: '/brand/hangel-icon.png' },
            previewSrc: '/brand/hangel-icon.svg',
            previewBg: '#f5f5f7',
            previewClass: 'w-28',
        },
        {
            title: "Kare İkon (Beyaz)",
            description: "Beyaz kare, turuncu logo — açık zemin avatar (SVG / PNG)",
            baseName: 'hangel-ikon-beyaz',
            captureBg: '#ffffff',
            files: { svg: '/brand/hangel-icon-white.svg', png: '/brand/hangel-icon-white.png' },
            previewSrc: '/brand/hangel-icon-white.svg',
            previewBg: '#f5f5f7',
            previewClass: 'w-28',
        },
    ];

    const dernekLogos = [
        {
            title: "Birincil Logo",
            description: "Zeminsiz Logo (PNG / JPG / PDF)",
            baseName: 'hangel-dernek-birincil-logo',
            captureBg: '#ffffff',
            content: <div className="flex items-center justify-center px-6 py-4"><HangelLogo href={null} className="text-4xl" style={{ color: '#042654' }} /></div>
        },
        {
            title: "İkincil Logo",
            description: "Zeminli Logo (PNG / JPG / PDF)",
            baseName: 'hangel-dernek-ikincil-logo',
            captureBg: '#042654',
            content: <div className="flex items-center justify-center rounded-2xl px-6 py-4" style={{ backgroundColor: '#042654' }}><HangelLogo href={null} className="text-4xl text-white" /></div>
        },
        {
            title: "Üçüncül Logo",
            description: "Beyaz Logo (PNG / JPG / PDF)",
            baseName: 'hangel-dernek-beyaz-logo',
            captureBg: '#1f1f1f',
            content: <div className="flex items-center justify-center rounded-2xl px-6 py-4" style={{ backgroundColor: '#1f1f1f' }}><HangelLogo href={null} className="text-4xl text-white" /></div>
        },
        {
            title: "Kare Logo",
            description: "Lacivert kare zemin, tam logo — sosyal medya/avatar (PNG / JPG / PDF)",
            baseName: 'hangel-dernek-kare-logo',
            captureBg: '#042654',
            content: <div className="rounded-2xl aspect-square w-32 flex items-center justify-center" style={{ backgroundColor: '#042654' }}><HangelLogo href={null} className="text-3xl text-white" /></div>
        },
        {
            title: "Dernek Icon",
            description: "Mobil Uygulama Simgesi (PNG / JPG / PDF)",
            baseName: 'hangel-dernek-app-icon',
            captureBg: '#042654',
            content: <div className="rounded-[22%] aspect-square w-28 flex items-center justify-center" style={{ backgroundColor: '#042654' }}><HangelLogo href={null} className="text-3xl text-white" /></div>
        },
    ];
    
    // P2-5f: rules content i18n via translation keys; shared `marketing.logo.rules.*` schema.
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
        { bg: 'bg-white', subtitleColor: 'text-muted-foreground', titleColor: 'text-foreground', linkColor: 'text-primary', iconColor: 'text-primary/25' },
        { bg: 'bg-[#f5f5f7]', subtitleColor: 'text-muted-foreground', titleColor: 'text-foreground', linkColor: 'text-primary', iconColor: 'text-primary/25' },
        { bg: 'bg-[#1f1f1f]', subtitleColor: 'text-white/60', titleColor: 'text-white', linkColor: 'text-primary', iconColor: 'text-white/25' },
    ];
    
     const colors = [
        { hex: '#f34723', name: 'hangel Mercan', rgb: '243, 71, 35', cmyk: '0, 71, 86, 5' },
        { hex: '#1f1f1f', name: 'Gece Siyahı', rgb: '31, 31, 31', cmyk: '0, 0, 0, 88' },
        { hex: '#f1f1f1', name: 'Açık Gri', rgb: '241, 241, 241', cmyk: '0, 0, 0, 5' },
        { hex: '#042654', name: 'Lacivert', rgb: '4, 38, 84', cmyk: '95, 55, 0, 67' }
    ];


    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans">
             <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">{t('marketing.logo.navLabel')}</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-[calc(6rem+env(safe-area-inset-top))]">
                <Section className="text-center pt-24 pb-20 md:pt-32 md:pb-28">
                    {cms.subtitle && (
                        <p className="text-sm font-bold uppercase tracking-widest text-primary mb-4">{cms.subtitle}</p>
                    )}
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-none">
                        {cms.title || t('marketing.logo.heroTitle')}
                    </h1>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-4">
                        {cms.description || t('marketing.logo.heroDescription')}
                    </p>
                    {cms.body && (
                        <div className="prose prose-lg max-w-3xl mx-auto mt-8 text-left" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.body) }} />
                    )}
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-primary">{t('marketing.logo.appSubBrandsTitle')}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-primary">{t('marketing.logo.dernekSubBrandsTitle')}</h3>
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                                            <LogoShowcaseCard key={index} title={logo.title} description={logo.description} baseName={logo.baseName} captureBg={logo.captureBg} onDownload={downloadLogo}
                                                files={logo.files} previewSrc={logo.previewSrc} previewBg={logo.previewBg} previewClass={logo.previewClass} />
                                        ))}
                                    </div>
                                </div>
                                <div className='space-y-6'>
                                    <h4 className="text-2xl font-bold tracking-tight text-center text-muted-foreground">{t('marketing.logo.dernekLogolarTitle')}</h4>
                                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {dernekLogos.map((logo, index) => (
                                            <LogoShowcaseCard key={index} title={logo.title} description={logo.description} baseName={logo.baseName} captureBg={logo.captureBg} onDownload={downloadLogo}>
                                                {logo.content}
                                            </LogoShowcaseCard>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <h3 className="text-3xl font-bold tracking-tight text-center">{t('marketing.logo.fontsTitle')}</h3>
                            <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white shadow-sm border border-black/5">
                               <CardHeader className="text-center">
                                   <CardTitle>{t('marketing.logo.fontGuideTitle')}</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                   <FontCard title={t('marketing.logo.logoFontCardTitle')} fontName="Poppins Bold" downloadHref="https://fonts.google.com/download?family=Poppins" />
                                   <FontCard title={t('marketing.logo.headingFontCardTitle')} fontName="Poppins SemiBold" downloadHref="https://fonts.google.com/download?family=Poppins" />
                                   <FontCard title={t('marketing.logo.bodyFontCardTitle')} fontName="Poppins Regular" downloadHref="https://fonts.google.com/download?family=Poppins" />
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
                                 <Card className="rounded-3xl text-center p-12 space-y-6 shadow-sm border border-black/5 hover:shadow-lg transition-shadow bg-white">
                                     <DownloadCloud className="h-16 w-16 mx-auto text-primary" />
                                     <div className="space-y-1">
                                         <h3 className="text-2xl font-bold">{t('marketing.logo.kimlikKilavuzuTitle')}</h3>
                                         <p className="text-muted-foreground max-w-md mx-auto">{t('marketing.logo.kimlikKilavuzuDesc')}</p>
                                     </div>
                                     <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                         {t('marketing.logo.downloadPdf')}
                                     </Button>
                                 </Card>
                                 <Card className="rounded-3xl text-center p-12 space-y-6 shadow-sm border border-black/5 hover:shadow-lg transition-shadow bg-white">
                                     <Image src="https://www.google.com/s2/favicons?domain=canva.com&sz=128" alt="Canva Logo" width={64} height={64} className="mx-auto h-16 w-16" />
                                     <div className="space-y-1">
                                         <h3 className="text-2xl font-bold">{t('marketing.logo.canvaTitle')}</h3>
                                         <p className="text-muted-foreground max-w-md mx-auto">{t('marketing.logo.canvaDesc')}</p>
                                     </div>
                                     <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold">
                                         <a href="https://www.canva.com/brand/kAGT3dRzyOw" target="_blank" rel="noopener noreferrer">{t('marketing.logo.canvaCta')}</a>
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
                
                {/* Final bölüm: SON SÖZ + fikri mülkiyet/legal metni derli toplu, ortalı tek blok. */}
                <Section className="bg-white">
                    <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('marketing.logo.sonSozLabel')}</h3>
                        <p className="mt-4 text-xl md:text-2xl font-medium leading-relaxed text-foreground">
                            {t('marketing.logo.sonSozBody')}
                        </p>
                        <p className="mt-6 text-lg font-bold text-foreground" dangerouslySetInnerHTML={{ __html: t('marketing.logo.sonSozMotto') }} />
                        <div className="mt-10 h-px w-16 bg-black/10" />
                        <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
                            {t('marketing.logo.legalBlurb')}
                        </p>
                    </div>
                </Section>

                {/* Basın Odası yönlendirmesi — sayfanın en altı. */}
                <Section className="pt-0">
                    <div className="relative max-w-4xl mx-auto overflow-hidden rounded-[2rem] bg-[#1f1f1f] px-8 py-14 text-center md:px-16">
                        <span className="absolute inset-x-0 top-0 h-1 bg-primary" />
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary mx-auto mb-6">
                            <Megaphone className="h-7 w-7" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Basın Odası</h3>
                        <p className="mt-4 text-base leading-relaxed text-white/70 max-w-xl mx-auto">
                            Basın bültenleri, kurumsal görseller, marka varlıkları ve medya başvuruları için basın odamızı ziyaret edin.
                        </p>
                        <Button asChild size="lg" className="mt-8 rounded-full px-10 h-14 text-base font-bold">
                            <Link href="/press">
                                Basın Odası <ChevronRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Section>
            </main>

            <PublicFooter currentPageLabel={t('marketing.logo.footerLabel')} />
        </div>
    );
}
