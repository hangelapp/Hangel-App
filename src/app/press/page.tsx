'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Image as ImageIcon, Palette, Mic, Rss, Users, Globe, BarChart3, TrendingUp, DownloadCloud, Type, Copy, FileDown, FileImage, FileType
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebPage } from '@/hooks/use-site-content';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { useTranslation } from '@/components/providers/language-provider';

const PRESS_EMAIL = 'turkiye@hangel.org';

const StatCard = ({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>, value: string, label: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-black/5 text-center transition-all hover:scale-105 hover:shadow-xl">
        <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-4xl font-black tracking-tighter text-[#1d1d1f]">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
);

type LogoVariant = 'primary' | 'secondary' | 'white' | 'app-icon';
type LogoFormat = 'png' | 'jpg' | 'pdf';

const LogoDisplayCard = ({
    title,
    description,
    children,
    onDownload,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    onDownload: (format: LogoFormat) => void;
}) => (
    <div className="border rounded-2xl bg-white/50 text-center flex flex-col">
        <div className="h-32 w-full flex items-center justify-center p-6 bg-muted/30 rounded-t-2xl">
            {children}
        </div>
        <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-bold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
            <div className="grid grid-cols-3 gap-1.5 mt-4">
                <Button size="sm" variant="outline" className="text-[11px] h-8 px-0" onClick={() => onDownload('png')}>
                    <FileImage className="h-3 w-3 mr-1" /> PNG
                </Button>
                <Button size="sm" variant="outline" className="text-[11px] h-8 px-0" onClick={() => onDownload('jpg')}>
                    <FileImage className="h-3 w-3 mr-1" /> JPG
                </Button>
                <Button size="sm" variant="outline" className="text-[11px] h-8 px-0" onClick={() => onDownload('pdf')}>
                    <FileType className="h-3 w-3 mr-1" /> PDF
                </Button>
            </div>
        </div>
    </div>
);

const FontCard = ({ title, fontName, onDownload }: { title: string, fontName: string, onDownload: () => void }) => (
    <div className="border rounded-2xl p-6 text-center space-y-3 bg-white/50">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-3xl", fontName.includes('Bold') && 'font-bold', fontName.includes('SemiBold') && 'font-semibold')}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, onCopy }: { hex: string, name: string, onCopy: () => void }) => (
    <div className="border rounded-2xl p-4 text-center space-y-3 bg-white/50 cursor-pointer" onClick={onCopy}>
        <div className="h-16 w-full rounded-lg" style={{ backgroundColor: hex }} />
        <p className="font-bold text-sm">{name}</p>
        <div className="flex items-center justify-center gap-1 text-xs font-mono text-muted-foreground">
            {hex} <Copy className="w-3 h-3" />
        </div>
    </div>
);

// Logo'yu canvas üzerinde render et — variant'a göre bg + text color seç.
function renderLogoToCanvas(variant: LogoVariant): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const W = 1600;
    const H = 600;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    if (variant === 'primary') {
        ctx.fillStyle = '#ffffff';
    } else if (variant === 'secondary') {
        ctx.fillStyle = '#f34723';
    } else if (variant === 'white') {
        ctx.fillStyle = '#000000';
    } else {
        // app-icon — rounded square, render later via clip
        ctx.fillStyle = '#f34723';
    }
    ctx.fillRect(0, 0, W, H);

    // Text
    const textColor = variant === 'primary' ? '#f34723' : '#ffffff';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (variant === 'app-icon') {
        // App icon: "h" harfi büyük, kare oranlı görsel
        canvas.width = H;
        const ctx2 = canvas.getContext('2d')!;
        ctx2.fillStyle = '#f34723';
        ctx2.fillRect(0, 0, H, H);
        ctx2.fillStyle = '#ffffff';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.font = 'bold 380px Poppins, Helvetica, Arial, sans-serif';
        ctx2.fillText('h', H / 2, H / 2 + 20);
    } else {
        ctx.font = 'bold 320px Poppins, Helvetica, Arial, sans-serif';
        ctx.fillText('hangel', W / 2, H / 2);
    }
    return canvas;
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpg') {
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, format === 'jpg' ? 0.95 : undefined);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function downloadCanvasAsPdf(canvas: HTMLCanvasElement, filename: string) {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const png = canvas.toDataURL('image/png');
    const aspectRatio = canvas.width / canvas.height;
    let imgW = pageW - margin * 2;
    let imgH = imgW / aspectRatio;
    if (imgH > pageH - margin * 2) {
        imgH = pageH - margin * 2;
        imgW = imgH * aspectRatio;
    }
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(png, 'PNG', x, y, imgW, imgH);
    pdf.save(filename);
}

// 3 GERÇEK basın bülteni — hangel vizyonu ve küresel bakış açısıyla.
// Promosyon dilinden (yayına başladı, ramak vermiyoruz vb.) kaçınılır.
const PRESS_RELEASES: { date: string; lang: 'TR' | 'EN'; title: string; body: string }[] = [
    {
        date: '15.04.2026',
        lang: 'TR',
        title: 'hangel\'in Vizyonu: Bireysel İyiliği Ölçülebilir Etkiye Dönüştürmek',
        body: [
            'hangel, bireylerin gönüllülük, bağış ve topluluk katılımı yoluyla ürettiği sosyal etkiyi ölçülebilir, paylaşılabilir ve doğrulanabilir hale getirme vizyonuyla kurulmuştur. Platform, kullanıcının her bir nitelikli eylemini sosyal alan bazlı puan modeline aktararak hem birey hem de işbirliği yaptığı sivil toplum kuruluşu için şeffaf bir etki haritası üretir.',
            '',
            'Vizyonumuz, yardımseverliği tek seferlik bir jest olmaktan çıkarıp sürdürülebilir, izlenebilir bir alışkanlığa dönüştürmektir. Bu doğrultuda hangel, bireylerin destekledikleri kuruluşların gerçek faaliyetlerini görebildiği, gönüllülük saatlerinin onaylanan kayıt zincirine bağlandığı ve her bağışın hedef projeye ulaşımının doğrulanabildiği bir altyapı geliştirmektedir.',
            '',
            'Platform, etki ölçümünde SROI (Social Return on Investment) ve "Theory of Change" metodolojilerini referans alır. Kullanıcı verisi minimum prensibiyle toplanır, KVKK ve GDPR çerçevesinde işlenir.',
        ].join('\n\n'),
    },
    {
        date: '02.05.2026',
        lang: 'TR',
        title: 'Küresel Bakış: Yerel STK\'lara Dijital Sosyal Etki Altyapısı',
        body: [
            'Dünya genelinde 10 milyondan fazla sivil toplum kuruluşu, dijital altyapı eksikliği nedeniyle topluma ulaşmakta ve etkilerini görünür kılmakta zorlanmaktadır. hangel, yerel STK\'lara — büyüklüklerinden bağımsız olarak — kurumsal düzeyde bir bağış, gönüllülük, raporlama ve etki ölçüm altyapısı sunma amacındadır.',
            '',
            'Platform, çok dilli içerik desteği, ülke bazlı yasal uyum modülleri (Türkiye için 5253 sayılı Dernekler Kanunu, Vakıflar Kanunu; uluslararası için GDPR, COPPA, CCPA referansları) ve yerel ödeme entegrasyonlarıyla küresel ölçekte yerel deneyim sunma hedefine yönelmiştir.',
            '',
            'hangel\'in açık veri prensibi gereği, etki verileri (kişisel bilgiler hariç) STK\'ların kendi web sitelerinde ve yıllık raporlarında kullanabileceği açık formatlarda yayınlanır. Bu yaklaşım, bağışçı güvenini ve STK\'ların hesap verebilirliğini destekler.',
        ].join('\n\n'),
    },
    {
        date: '20.05.2026',
        lang: 'TR',
        title: 'Sürdürülebilir Sosyal Etki: Verinin Yönü ve Bireyin Rolü',
        body: [
            'Sürdürülebilir sosyal etki, tek tek eylemlerin toplamından çok daha fazlasını gerektirir: tutarlı, hedeflenmiş ve doğrulanmış bir aksiyon zinciri. hangel, bireylerin sosyal hassasiyetleri ile STK kategorilerini eşleştirerek her gönüllülük saatinin ve her bağışın hangi BM Sürdürülebilir Kalkınma Amacına (SKA) katkı sağladığını ölçer.',
            '',
            'Platformun "rozet sistemi" — bireyin uzun vadeli yardımseverlik yolculuğunu görselleştiren bir mekanizma — yardımseverliği oyunlaştırma değil, bireyin kendi etki haritasını görmesine olanak tanıyan bir geri bildirim katmanıdır. Her seviye, kullanıcının belirli bir sosyal alanda gösterdiği tutarlılığı temsil eder.',
            '',
            'hangel, bu altyapıyı uluslararası gönüllülük ağları (UN Volunteers, IAVE) ve sosyal girişim ekosistemiyle uyumlu standartlarda geliştirmeye devam etmektedir.',
        ].join('\n\n'),
    },
];

async function generatePressReleasePdf(release: typeof PRESS_RELEASES[number]) {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const marginX = 25;
    let y = 30;

    // Header band
    pdf.setFillColor(243, 71, 35);
    pdf.rect(0, 0, pageW, 12, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text('hangel — Basın Bülteni', marginX, 8);

    // Date + lang
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${release.date} · ${release.lang}`, marginX, y);
    y += 8;

    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(20, 20, 20);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(release.title, pageW - marginX * 2);
    pdf.text(titleLines, marginX, y);
    y += titleLines.length * 8 + 6;

    pdf.setDrawColor(243, 71, 35);
    pdf.setLineWidth(0.8);
    pdf.line(marginX, y, marginX + 20, y);
    y += 8;

    // Body
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    const paragraphs = release.body.split('\n\n');
    for (const p of paragraphs) {
        if (!p.trim()) { y += 3; continue; }
        const lines = pdf.splitTextToSize(p.trim(), pageW - marginX * 2);
        if (y + lines.length * 5.5 > pageH - 25) {
            pdf.addPage();
            y = 30;
        }
        pdf.text(lines, marginX, y);
        y += lines.length * 5.5 + 3;
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`hangel.org · ${PRESS_EMAIL}`, pageW / 2, pageH - 12, { align: 'center' });

    const filename = `hangel-bulten-${release.date.replace(/\./g, '-')}-${release.title.slice(0, 40).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
    pdf.save(filename);
}

export default function PressPage() {
    const router = useRouter();
    const cms = useWebPage('press');
    const { toast } = useToast();
    const { t } = useTranslation();
    const [counts, setCounts] = useState<{ users: number; ngos: number; brands: number; events: number } | null>(null);

    // Stats: /api/public/stats endpoint'inden çek (server-side aggregation,
    // anonymous accessible). Önceden client-side getCountFromServer kullanılıyordu
    // ama users/events koleksiyonları unauth user'a kapalı → permission-denied.
    useEffect(() => {
        let cancelled = false;
        fetch('/api/public/stats')
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (cancelled || !data) return;
                setCounts({
                    users: data.users ?? 0,
                    ngos: data.ngos ?? 0,
                    brands: data.brands ?? 0,
                    events: 0,  // events henüz endpoint'te yok, gerekirse eklenir
                });
            })
            .catch(() => { if (!cancelled) setCounts({ users: 0, ngos: 0, brands: 0, events: 0 }); });
        return () => { cancelled = true; };
    }, []);

    const visibleStats = useMemo(() => {
        if (!counts) return [];
        const entries: { icon: typeof Globe; value: number; label: string }[] = [];
        if (counts.users > 0) entries.push({ icon: Users, value: counts.users, label: 'Kullanıcı' });
        if (counts.ngos > 0) entries.push({ icon: Globe, value: counts.ngos, label: 'STK' });
        if (counts.brands > 0) entries.push({ icon: BarChart3, value: counts.brands, label: 'Marka' });
        if (counts.events > 0) entries.push({ icon: TrendingUp, value: counts.events, label: 'Etkinlik' });
        return entries;
    }, [counts]);

    const handleLogoDownload = async (variant: LogoVariant, label: string, format: LogoFormat) => {
        try {
            const canvas = renderLogoToCanvas(variant);
            const baseName = `hangel-${variant}`;
            if (format === 'pdf') {
                await downloadCanvasAsPdf(canvas, `${baseName}.pdf`);
            } else {
                downloadCanvas(canvas, `${baseName}.${format}`, format);
            }
            toast({ title: 'İndirildi', description: `${label} (${format.toUpperCase()}) dosyanıza eklendi.` });
        } catch {
            toast({ variant: 'destructive', title: 'İndirilemedi', description: 'Logo oluşturulurken bir hata oluştu.' });
        }
    };

    const handleFontDownload = (file: string) => {
        toast({ title: 'Font İndirme', description: 'Poppins font ailesi Google Fonts üzerinden açık kaynaktır.', });
        window.open('https://fonts.google.com/specimen/Poppins', '_blank', 'noopener,noreferrer');
        void file;
    };

    const copyColor = (hex: string) => {
        navigator.clipboard.writeText(hex);
        toast({ title: 'Renk Kodu Kopyalandı', description: `${hex} panoya kopyalandı.` });
    };

    const handleReleaseDownload = async (release: typeof PRESS_RELEASES[number]) => {
        try {
            await generatePressReleasePdf(release);
            toast({ title: 'Bülten İndirildi', description: release.title });
        } catch {
            toast({ variant: 'destructive', title: 'İndirilemedi', description: 'PDF oluşturulurken bir hata oluştu.' });
        }
    };

    const photos = [
        { id: 1, src: 'https://storage.googleapis.com/project-123-bucket/image.jpg', altKey: 'alt1', hint: 'founder portrait' },
        { id: 2, src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop', altKey: 'alt2', hint: 'office team working' },
        { id: 3, src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop', altKey: 'alt3', hint: 'meeting brainstorming' },
        { id: 4, src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop', altKey: 'alt4', hint: 'volunteers meeting' },
        { id: 5, src: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop', altKey: 'alt5', hint: 'app ui design' },
        { id: 6, src: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1974&auto=format&fit=crop', altKey: 'alt6', hint: 'mobile app screen' },
        { id: 7, src: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=2070&auto=format&fit=crop', altKey: 'alt7', hint: 'phone screen' },
        { id: 8, src: 'https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop', altKey: 'alt8', hint: 'people solidarity' },
        { id: 9, src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop', altKey: 'alt9', hint: 'corporate presentation' },
        { id: 10, src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop', altKey: 'alt10', hint: 'happy diverse community' },
    ] as const;

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">{t('marketing.press.navLabel')}</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                        <a href={`mailto:${PRESS_EMAIL}`}>{t('marketing.press.contactCta')}</a>
                    </Button>
                </div>
            </header>

            <main className="pt-[calc(6rem+env(safe-area-inset-top))]">
                {/* Hero */}
                <section className="container mx-auto px-4 pt-16 pb-24 text-center space-y-6">
                    {cms.subtitle && (
                        <p className="text-sm md:text-base font-bold uppercase tracking-widest text-primary">{cms.subtitle}</p>
                    )}
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                        {cms.title || t('marketing.press.heroTitleFallback')}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        {cms.description || t('marketing.press.heroDescriptionFallback')}
                    </p>
                    {cms.heroImageUrl && (
                        <div className="relative w-full max-w-5xl mx-auto aspect-[21/9] rounded-3xl overflow-hidden mt-8 shadow-xl">
                            <Image src={cms.heroImageUrl} alt={cms.title || 'Basın Odası'} fill className="object-cover" />
                        </div>
                    )}
                </section>

                {cms.body && (
                    <section className="container mx-auto px-4 mb-16 max-w-4xl">
                        <Card className="rounded-[2.5rem] border-none shadow-lg bg-white">
                            <CardContent className="p-8 prose prose-lg max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.body) }} />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Stats — Firestore canlı sayılar; 0 olanları gösterme */}
                {visibleStats.length > 0 && (
                    <section className="container mx-auto px-4 mb-24">
                        <div className={cn(
                            'grid gap-6',
                            visibleStats.length === 1 && 'grid-cols-1 max-w-md mx-auto',
                            visibleStats.length === 2 && 'grid-cols-2',
                            visibleStats.length >= 3 && 'grid-cols-2 md:grid-cols-4',
                        )}>
                            {visibleStats.map((s, i) => (
                                <StatCard key={i} icon={s.icon} value={s.value.toLocaleString('tr-TR')} label={s.label} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Press Releases — 3 gerçek bülten, indirilebilir PDF */}
                <section className="container mx-auto px-4 mb-24">
                     <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl"><Rss className="h-6 w-6 text-primary" /> {t('marketing.press.releasesTitle')}</CardTitle>
                            <CardDescription>{t('marketing.press.releasesDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {PRESS_RELEASES.map((release, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 border rounded-2xl bg-muted/30 hover:bg-muted/70 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm sm:text-base">{release.title}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">{release.date} • <span className="font-semibold">{release.lang}</span></p>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{release.body.split('\n\n')[0]}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => handleReleaseDownload(release)}>
                                            <FileDown className="mr-2 h-4 w-4" /> {t('marketing.press.downloadAction')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                     </Card>
                </section>

                {/* Media Kit */}
                <section className="container mx-auto px-4 mb-24">
                    <Tabs defaultValue="logos" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-4xl mx-auto h-auto mb-12">
                            <TabsTrigger value="logos" className="h-12 text-sm"><Palette className="mr-2"/>{t('marketing.press.tabLogos')}</TabsTrigger>
                            <TabsTrigger value="fonts" className="h-12 text-sm"><Type className="mr-2"/>{t('marketing.press.tabFonts')}</TabsTrigger>
                            <TabsTrigger value="colors" className="h-12 text-sm"><Palette className="mr-2"/>{t('marketing.press.tabColors')}</TabsTrigger>
                            <TabsTrigger value="photos" className="h-12 text-sm"><ImageIcon className="mr-2"/>{t('marketing.press.tabPhotos')}</TabsTrigger>
                            <TabsTrigger value="guide" className="h-12 text-sm"><FileText className="mr-2"/>{t('marketing.press.tabGuide')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="logos">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <LogoDisplayCard title="Birincil Logo" description="Zeminsiz logo" onDownload={(f) => handleLogoDownload('primary', 'Birincil Logo', f)}>
                                    <HangelLogo className="text-5xl text-primary" />
                                </LogoDisplayCard>
                                 <LogoDisplayCard title="İkincil Logo" description="Zeminli logo" onDownload={(f) => handleLogoDownload('secondary', 'İkincil Logo', f)}>
                                    <div className="p-4 bg-primary rounded-2xl"><HangelLogo className="text-5xl text-white" /></div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="Üçüncül Logo" description="Beyaz logo (zorunlu hallerde)" onDownload={(f) => handleLogoDownload('white', 'Üçüncül Logo', f)}>
                                    <div className="p-4 bg-black rounded-2xl w-full h-full flex items-center justify-center">
                                       <HangelLogo className="text-5xl text-white" />
                                    </div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="App Icon" description="Uygulama simgesi" onDownload={(f) => handleLogoDownload('app-icon', 'App Icon', f)}>
                                   <div className="p-4 bg-primary rounded-2xl"><Mic className="h-10 w-10 text-white" /></div>
                                </LogoDisplayCard>
                            </div>
                        </TabsContent>

                        <TabsContent value="fonts">
                           <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>{t('marketing.press.fontGuideTitle')}</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                   <FontCard title="Logo Fontu" fontName="Poppins Bold" onDownload={() => handleFontDownload('poppins-bold.ttf')} />
                                   <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleFontDownload('poppins-semibold.ttf')} />
                                   <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleFontDownload('poppins-regular.ttf')} />
                               </CardContent>
                           </Card>
                        </TabsContent>

                        <TabsContent value="colors">
                             <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>{t('marketing.press.colorGuideTitle')}</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                                   <ColorCard hex="#f34723" name="hangel Mercan" onCopy={() => copyColor('#f34723')} />
                                   <ColorCard hex="#1f1f1f" name="Gece Siyahı" onCopy={() => copyColor('#1f1f1f')} />
                                   <ColorCard hex="#f1f1f1" name="Açık Gri" onCopy={() => copyColor('#f1f1f1')} />
                                   <ColorCard hex="#042654" name="Lacivert" onCopy={() => copyColor('#042654')} />
                               </CardContent>
                           </Card>
                        </TabsContent>

                        <TabsContent value="photos">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {photos.map((photo) => (
                                    <Card key={photo.id} className="rounded-2xl overflow-hidden group">
                                        <CardContent className="p-0">
                                            <div className="relative aspect-[4/3] w-full">
                                                <Image src={photo.src} alt={t(`marketing.press.photos.${photo.altKey}`)} fill className="object-cover" data-ai-hint={photo.hint} />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-3 bg-muted/50">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="w-full text-xs"
                                                onClick={() => {
                                                    const a = document.createElement('a');
                                                    a.href = photo.src;
                                                    a.download = `hangel-kurumsal-${photo.id}.jpg`;
                                                    a.target = '_blank';
                                                    a.rel = 'noopener noreferrer';
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                }}
                                            >
                                                <Download className="mr-2 h-4 w-4" /> {t('marketing.press.downloadHighRes')}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="guide">
                           <Card className="max-w-3xl mx-auto rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                               <DownloadCloud className="h-16 w-16 mx-auto text-primary" />
                               <div className="space-y-1">
                                   <h3 className="text-2xl font-bold">{t('marketing.press.identityGuideTitle')}</h3>
                                   <p className="text-muted-foreground max-w-md mx-auto">{t('marketing.press.identityGuideDesc')}</p>
                               </div>
                               <Button
                                   size="lg"
                                   className="rounded-full px-10 h-14 text-lg font-bold"
                                   onClick={async () => {
                                       try {
                                           const { default: jsPDF } = await import('jspdf');
                                           const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                                           const pageW = pdf.internal.pageSize.getWidth();
                                           pdf.setFillColor(243, 71, 35);
                                           pdf.rect(0, 0, pageW, 18, 'F');
                                           pdf.setFontSize(11);
                                           pdf.setTextColor(255, 255, 255);
                                           pdf.text('hangel — Marka Kimlik Kılavuzu', 25, 12);
                                           pdf.setFontSize(24); pdf.setTextColor(20, 20, 20);
                                           pdf.text('Marka Kimlik Kılavuzu', 25, 40);
                                           pdf.setFontSize(11); pdf.setTextColor(80, 80, 80);
                                           const lines = [
                                               'hangel marka kimliği — özet kılavuz',
                                               '',
                                               'Birincil renk: #f34723 (Mercan)',
                                               'Yardımcı renkler: #1f1f1f (Gece Siyahı), #f1f1f1 (Açık Gri), #042654 (Lacivert)',
                                               '',
                                               'Tipografi: Poppins (Bold / SemiBold / Regular)',
                                               '',
                                               'Logo kullanım kuralları:',
                                               '- Logo etrafında her zaman x = harf yüksekliği kadar boş alan bırakın.',
                                               '- Renkleri ve oranları değiştirmeyin.',
                                               '- Beyaz logo yalnızca koyu zeminlerde kullanılır.',
                                               '',
                                               'İletişim: ' + PRESS_EMAIL,
                                           ];
                                           pdf.text(lines, 25, 55);
                                           pdf.save('hangel-marka-kilavuz.pdf');
                                           toast({ title: 'İndirildi', description: 'Marka kılavuzu PDF.' });
                                       } catch {
                                           toast({ variant: 'destructive', title: 'İndirilemedi', description: 'Lütfen tekrar dene.' });
                                       }
                                   }}
                               >
                                    {t('marketing.press.downloadPdf')}
                               </Button>
                           </Card>
                        </TabsContent>
                    </Tabs>
                </section>

                {/* Contact */}
                <section className="container mx-auto px-4 my-24">
                     <Card className="bg-black text-white rounded-[2.5rem] p-12 text-center shadow-2xl">
                        <h3 className="text-3xl font-bold mb-2">{t('marketing.press.contactTitle')}</h3>
                        <p className="text-white/70 mb-6">{t('marketing.press.contactDescription')}</p>
                        <Button asChild variant="secondary" size="lg" className="rounded-full h-14 px-10 text-lg font-bold">
                            <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>
                        </Button>
                     </Card>
                </section>
            </main>

            <PublicFooter currentPageLabel={t('marketing.press.footerLabel')} />
        </div>
    );
}
