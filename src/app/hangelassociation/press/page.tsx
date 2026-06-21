
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown, FileText, Smartphone, Tablet, Watch, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PublicFooter } from '@/components/layout/public-footer';
import { useAssociationContent } from '@/hooks/use-site-content';
import { useToast } from '@/hooks/use-toast';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/hangelassociation')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                    <Link href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/hangelassociation/press" className={cn("hover:text-primary transition-colors", currentPage === 'press' && "text-primary")}>Basında Biz</Link>
                    <Link href="/hangelassociation/conferences" className={cn("hover:text-primary transition-colors", currentPage === 'conferences' && "text-primary")}>Konferanslar</Link>
                    <Link href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

// Marka renkleri — şablonlarda tutarlı tipografi/renk için tek kaynak.
const CORAL = '#f34723';
const NAVY = '#042654';
const INK = '#1f1f1f';
const LIGHT = '#f1f1f1';

type PressGroup = 'app' | 'dernek';

type PressRelease = {
    id: string;
    group: PressGroup;
    date: string; // gösterim için TR formatlı (ör. "5 Haziran 2026")
    title: string;
    location: string;
    // Düz paragraflar — şablonda <p> olarak işlenir, hem ekranda hem PDF/Word'de aynı.
    body: string[];
    contact: string;
};

// hangel app tarafı basın bültenleri (turuncu aksan).
const APP_RELEASES: ReadonlyArray<PressRelease> = [
    {
        id: 'app-imece-launch',
        group: 'app',
        date: '5 Haziran 2026',
        location: 'İstanbul',
        title: 'hangel "imece" ile yetenek bazlı gönüllülüğü yeniden tanımlıyor',
        body: [
            'hangel, gönüllülerin sahip oldukları yetenekleri ihtiyaç sahibi sivil toplum kuruluşlarıyla buluşturan "imece" özelliğini kullanıma sundu. Platform, kişilerin profesyonel becerilerini saatler yerine somut etkiyle ölçülebilir hâle getiriyor.',
            'Uygulama; tasarımdan yazılıma, çeviriden hukuki danışmanlığa kadar onlarca yetenek alanında gönüllüyü doğru projeyle eşleştiriyor. Akıllı eşleştirme motoru, hem gönüllünün hem de kurumun zamanını verimli kullanmasını sağlıyor.',
            'hangel imece, lansman haftasında binlerce gönüllüyü yüzlerce sivil toplum projesiyle buluşturmayı hedefliyor.',
        ],
        contact: 'Basın İletişim: basin@hangel.org · hangel.org.tr',
    },
    {
        id: 'app-bagis-model',
        group: 'app',
        date: '20 Mayıs 2026',
        location: 'İstanbul',
        title: 'hangel "bağış" modeliyle alışverişi sosyal faydaya dönüştürüyor',
        body: [
            'hangel uygulaması, kullanıcıların günlük alışverişlerini doğrudan sosyal fayda üreten bağışlara dönüştüren yeni "bağış" modelini duyurdu. Anlaşmalı markalardan yapılan her alışveriş, kullanıcının seçtiği sosyal projeye katkıya dönüşüyor.',
            'Model, şeffaf bağış takibi sunarak kullanıcıların yarattıkları etkiyi gerçek zamanlı görmesine olanak tanıyor. Her bağışın hangi projeye, ne kadar katkı sağladığı uygulama içinde izlenebiliyor.',
        ],
        contact: 'Basın İletişim: basin@hangel.org · hangel.org.tr',
    },
];

// hangel Dernek tarafı basın bültenleri (lacivert aksan).
const DERNEK_RELEASES: ReadonlyArray<PressRelease> = [
    {
        id: 'dernek-sosyal-inovasyon',
        group: 'dernek',
        date: '1 Haziran 2026',
        location: 'Ankara',
        title: 'hangel Derneği Sosyal İnovasyon Merkezi’ni açtı',
        body: [
            'hangel Derneği, toplumsal sorunlara yenilikçi çözümler geliştirmek amacıyla Sosyal İnovasyon Merkezi’ni hizmete açtı. Merkez; sosyal girişimcileri, akademisyenleri ve gönüllüleri ortak projelerde bir araya getiriyor.',
            'Merkez bünyesinde yürütülecek programlar, fikir aşamasındaki sosyal projeleri uygulanabilir modellere dönüştürmeyi hedefliyor. İlk dönemde mentorluk, atölye ve saha desteği sağlanacak.',
        ],
        contact: 'Basın İletişim: basin@hangel.org · hangel.org.tr',
    },
    {
        id: 'dernek-etki-envanteri',
        group: 'dernek',
        date: '12 Mayıs 2026',
        location: 'Ankara',
        title: 'hangel Sosyal Etki Envanteri ilk raporunu yayımladı',
        body: [
            'hangel Derneği, sosyal etki verilerini derleyen ve envanterleyen "Sosyal Etki Envanteri" çalışmasının ilk raporunu kamuoyuyla paylaştı. Rapor, sivil toplum alanında ölçülebilir veri ihtiyacına yanıt veriyor.',
            'Çalışma; gönüllülük, bağış ve proje etkisini standart göstergelerle ortaya koyarak karar vericilere ve sivil topluma şeffaf bir referans sunuyor.',
        ],
        contact: 'Basın İletişim: basin@hangel.org · hangel.org.tr',
    },
];

// Bülteni hangel esaslarında (logo + tarih + başlık + gövde + iletişim altbilgi)
// tek tutarlı font ve marka renkleriyle şık bir HTML belgesine dönüştürür.
// Hem PDF (html2canvas yakalaması) hem Word (.doc Blob) için ortak şablon.
function buildReleaseHtml(release: PressRelease): string {
    const accent = release.group === 'app' ? CORAL : NAVY;
    const groupLabel = release.group === 'app' ? 'hangel app Basın Bülteni' : 'hangel Dernek Basın Bülteni';
    const paragraphs = release.body
        .map(
            (p) =>
                `<p style="margin:0 0 14px 0;font-size:13px;line-height:1.7;color:${INK};">${p}</p>`,
        )
        .join('');
    return `
<div style="width:720px;box-sizing:border-box;font-family:Helvetica,Arial,sans-serif;background:#ffffff;color:${INK};padding:0;">
  <div style="background:${accent};padding:26px 40px;display:flex;align-items:center;justify-content:space-between;">
    <span style="font-family:Helvetica,Arial,sans-serif;font-weight:800;font-size:28px;color:#ffffff;letter-spacing:-0.5px;">hangel</span>
    <span style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.85);">${groupLabel}</span>
  </div>
  <div style="padding:36px 40px 28px 40px;">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${accent};">Basın Bülteni</p>
    <p style="margin:0 0 18px 0;font-size:12px;color:#6b7280;">${release.location}, ${release.date}</p>
    <h1 style="margin:0 0 22px 0;font-size:24px;line-height:1.25;font-weight:800;color:${INK};letter-spacing:-0.4px;">${release.title}</h1>
    <div style="height:3px;width:64px;background:${accent};margin:0 0 22px 0;border-radius:2px;"></div>
    ${paragraphs}
  </div>
  <div style="margin:8px 40px 0 40px;border-top:1px solid ${LIGHT};padding:18px 0 32px 0;">
    <p style="margin:0;font-size:11px;color:#6b7280;line-height:1.6;">${release.contact}</p>
    <p style="margin:8px 0 0 0;font-size:10px;color:#9ca3af;">© ${new Date().getFullYear()} hangel — Tüm hakları saklıdır.</p>
  </div>
</div>`.trim();
}

const DownloadButtons = ({ release }: { release: PressRelease }) => {
    const { toast } = useToast();
    const accent = release.group === 'app' ? CORAL : NAVY;

    // PDF: marka şablonunu ekran dışı bir node'a basıp html2canvas ile yakalar,
    // jsPDF A4 portre sayfasına (gerekirse çok sayfalı) yerleştirir.
    const downloadPdf = async () => {
        toast({ title: 'PDF hazırlanıyor', description: `${release.title} indiriliyor...` });
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '0';
        container.innerHTML = buildReleaseHtml(release);
        document.body.appendChild(container);
        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);
            const node = container.firstElementChild as HTMLElement;
            const canvas = await html2canvas(node, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW;
            const imgH = (canvas.height * imgW) / canvas.width;
            let heightLeft = imgH;
            let position = 0;
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
            heightLeft -= pageH;
            while (heightLeft > 0) {
                position -= pageH;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
                heightLeft -= pageH;
            }
            pdf.save(`hangel-basin-bulteni-${release.id}.pdf`);
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'PDF oluşturulamadı', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
        } finally {
            document.body.removeChild(container);
        }
    };

    // Word: aynı marka şablonunu Word-uyumlu HTML zarfıyla application/msword
    // MIME'li bir .doc Blob olarak indirir (Word/Pages açar).
    const downloadWord = () => {
        toast({ title: 'Word hazırlanıyor', description: `${release.title} indiriliyor...` });
        const inner = buildReleaseHtml(release);
        const doc = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${release.title}</title></head><body>${inner}</body></html>`;
        const blob = new Blob(['﻿', doc], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hangel-basin-bulteni-${release.id}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mt-5 flex flex-wrap gap-2">
            <Button
                size="sm"
                onClick={downloadPdf}
                className="h-9 rounded-full px-4 text-xs font-bold text-white hover:opacity-90"
                style={{ backgroundColor: accent }}
            >
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF indir
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={downloadWord}
                className="h-9 rounded-full px-4 text-xs font-bold"
                style={{ borderColor: accent, color: accent }}
            >
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Word indir
            </Button>
        </div>
    );
};

const ReleaseCard = ({ release }: { release: PressRelease }) => {
    const accent = release.group === 'app' ? CORAL : NAVY;
    return (
        <article className="relative bg-card rounded-[1.75rem] p-7 shadow-sm border border-border overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: accent }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                Basın Bülteni
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{release.location}, {release.date}</p>
            <h3 className="mt-3 text-xl md:text-2xl font-black tracking-tight text-foreground leading-snug">
                {release.title}
            </h3>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
                {release.body.map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>
            <DownloadButtons release={release} />
        </article>
    );
};

// Gerçek ekran görüntüsü dosyası olmadığı için cihaz çerçevesi içine
// hangel marka renkli, hangel logolu temsili bir arayüz yerleştirilir.
const MockScreen = ({ accent = CORAL }: { accent?: string }) => (
    <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: accent }}>
            <span className="text-[10px] font-black text-white tracking-tight">hangel</span>
            <span className="h-2 w-2 rounded-full bg-white/70" />
        </div>
        <div className="flex-1 p-2 space-y-1.5" style={{ backgroundColor: LIGHT }}>
            <div className="h-8 rounded-lg bg-white shadow-sm flex items-center px-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <span className="ml-1.5 h-1.5 w-1/2 rounded bg-black/10" />
            </div>
            <div className="h-8 rounded-lg bg-white shadow-sm flex items-center px-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <span className="ml-1.5 h-1.5 w-2/3 rounded bg-black/10" />
            </div>
            <div className="h-8 rounded-lg bg-white shadow-sm flex items-center px-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <span className="ml-1.5 h-1.5 w-1/3 rounded bg-black/10" />
            </div>
        </div>
    </div>
);

const DeviceMockups = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-end justify-items-center max-w-4xl mx-auto">
        {/* Telefon */}
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-[260px] w-[130px] rounded-[1.75rem] bg-[#1f1f1f] p-2 shadow-xl">
                <div className="relative h-full w-full rounded-[1.25rem] overflow-hidden bg-white">
                    <MockScreen accent={CORAL} />
                </div>
                <span className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/30" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5" /> hangel app — telefon
            </span>
        </div>
        {/* Tablet */}
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-[230px] w-[180px] rounded-[1.5rem] bg-[#1f1f1f] p-2.5 shadow-xl">
                <div className="relative h-full w-full rounded-[1rem] overflow-hidden bg-white">
                    <MockScreen accent={NAVY} />
                </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Tablet className="h-3.5 w-3.5" /> hangel — tablet
            </span>
        </div>
        {/* Saat */}
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-[150px] w-[150px] flex items-center justify-center">
                <div className="relative h-[120px] w-[100px] rounded-[2rem] bg-[#1f1f1f] p-1.5 shadow-xl">
                    <div className="relative h-full w-full rounded-[1.6rem] overflow-hidden bg-white">
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: CORAL }}>
                            <span className="text-[11px] font-black text-white tracking-tight">hangel</span>
                            <span className="mt-1 h-1 w-8 rounded-full bg-white/50" />
                        </div>
                    </div>
                </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Watch className="h-3.5 w-3.5" /> hangel — saat
            </span>
        </div>
    </div>
);

export default function AssociationPressPage() {
    const { get } = useAssociationContent();
    const title = get('press.title', 'Basında Biz');
    const subtitle = get('press.subtitle', 'hangel app ve hangel Derneği basın bültenleri');

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="press" />

            <main className="container mx-auto px-4 pt-32 pb-24 max-w-5xl">
                <header className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">{title}</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">{subtitle}</p>
                </header>

                {/* Basın bültenleri — iki ayrı grup (app turuncu / dernek lacivert aksanlı). */}
                <Tabs defaultValue="app" className="w-full">
                    <div className="flex justify-center">
                        <TabsList className="h-11 rounded-full bg-card shadow-sm border border-border p-1">
                            <TabsTrigger
                                value="app"
                                className="rounded-full px-5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
                            >
                                hangel app Bültenleri
                            </TabsTrigger>
                            <TabsTrigger
                                value="dernek"
                                className="rounded-full px-5 text-sm font-bold data-[state=active]:bg-[#042654] data-[state=active]:text-white"
                            >
                                hangel Dernek Bültenleri
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="app" className="mt-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {APP_RELEASES.map((r) => (
                                <ReleaseCard key={r.id} release={r} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="dernek" className="mt-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {DERNEK_RELEASES.map((r) => (
                                <ReleaseCard key={r.id} release={r} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* App Icon + Kurumsal Fotoğraflar (cihaz mockup'ları). */}
                <section className="mt-24">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center text-foreground">
                        Kurumsal Görseller
                    </h2>
                    <p className="text-center text-muted-foreground mt-3 max-w-2xl mx-auto">
                        hangel app icon’u ve hangel arayüzüyle hazırlanmış cihaz görselleri.
                    </p>

                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* App Icon — turuncu köşeli-kare zemin, ortada beyaz "hangel" wordmark. */}
                        <div className="bg-card rounded-[1.75rem] p-8 shadow-sm border border-border flex flex-col items-center text-center">
                            <div
                                className="aspect-square w-32 rounded-[1.5rem] flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: CORAL }}
                            >
                                <span className="text-white font-black tracking-tighter text-xl leading-none">hangel</span>
                            </div>
                            <h3 className="mt-6 text-lg font-bold text-foreground">App Icon</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Mobil uygulama simgesi — turuncu (#f34723) köşeli-kare zeminde beyaz hangel wordmark.
                            </p>
                        </div>

                        {/* Cihaz mockup'ları. */}
                        <div className="lg:col-span-2 bg-card rounded-[1.75rem] p-8 shadow-sm border border-border">
                            <h3 className="text-lg font-bold text-foreground text-center mb-8">
                                Cihazlarda hangel
                            </h3>
                            <DeviceMockups />
                        </div>
                    </div>
                </section>

                {/* EN ALT — Logo Kullanımı yönlendirmesi. */}
                <section className="mt-24">
                    <div className="rounded-[2rem] p-10 md:p-14 text-center shadow-xl" style={{ backgroundColor: NAVY }}>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Marka Kimliği</p>
                        <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
                            Logo Kullanım Kılavuzu
                        </h2>
                        <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                            hangel logolarını, renklerini ve kullanım kurallarını öğrenmek; logo ve marka varlıklarını
                            indirmek için Logo Kullanımı sayfasını ziyaret edin.
                        </p>
                        <div className="mt-8">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full px-8 h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white"
                            >
                                <Link href="/logo-usage">
                                    Logo Kullanımı’na Git <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel="Basında Biz" />
        </div>
    );
}
