
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download, Share2 } from 'lucide-react';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type ReportStat = { label: string; value: string };
type ReportContent = {
    title: string;
    period: string;
    summary: string;
    stats: ReportStat[];
};

const reportContents: Record<string, ReportContent> = {
    '5-yillik-etki': {
        title: "5 Yıllık Sosyal Fayda Raporu.",
        period: "2020 - 2025",
        summary: "Social Business Global ve hangel'in 5 yıllık dijital dönüşüm ve sosyal etki yolculuğunun şeffaf bilançosu.",
        stats: [
            { label: "Toplam Erişim", value: "1.2M+" },
            { label: "Aktarılan Bağış", value: "12.5M ₺" },
            { label: "Gönüllü Saati", value: "500K+" }
        ]
    },
    'etkinlikler': {
        title: "Etkinlik ve Konferans Raporu.",
        period: "Güncel",
        summary: "42 üniversite, 17 belediye ve 54 ülkede gerçekleştirilen tüm vizyon buluşmalarının katılım ve sonuç analizleri.",
        stats: [
            { label: "Etkinlik Sayısı", value: "126" },
            { label: "Üniversite Katılımı", value: "42" },
            { label: "Ülke Sayısı", value: "54" }
        ]
    },
    'afet-mudahale': {
        title: "Afet Müdahale ve Dayanışma.",
        period: "2023 - 2024",
        summary: "Deprem bölgesi Örnek Köy Projesi, lojistik köprüler ve karavan gönüllü ağı operasyonel sonuçları.",
        stats: [
            { label: "Gönüllü Sayısı", value: "4000" },
            { label: "Yakıt Desteği", value: "120 Ton" },
            { label: "Konteyner/Ev", value: "10+" }
        ]
    }
};

export default function ReportsSlugPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const slug = params.slug as string;
    const content = reportContents[slug];

    if (!content) return <div>Rapor bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[var(--sat)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">RAPORLAR</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-32 pb-24">
                <section className="container mx-auto px-6 max-w-4xl space-y-12">
                    <div className="space-y-4 text-center">
                        <Badge className="bg-primary/10 text-primary border-none">{content.period}</Badge>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">{content.title}</h1>
                        <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">{content.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {content.stats.map((stat, i) => (
                            <div key={i} className="p-8 bg-muted rounded-[2.5rem] text-center border border-border">
                                <p className="text-4xl font-black text-primary tracking-tighter">{stat.value}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-12 border-2 border-dashed rounded-[3rem] bg-muted/10 flex flex-col items-center justify-center text-center space-y-6">
                        <FileText className="h-16 w-16 text-muted-foreground/30" />
                        <div>
                            <h3 className="text-xl font-bold">Tam Raporu İndirin</h3>
                            <p className="text-sm text-muted-foreground mt-1">Detaylı analizler, grafikler ve finansal tablolar.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => toast({title: "PDF Hazırlanıyor", description: "Rapor dosyası oluşturuluyor..."})} size="lg" className="rounded-full px-8 font-bold">
                                <Download className="mr-2 h-5 w-5" /> PDF Olarak İndir
                            </Button>
                            <Button variant="outline" size="lg" className="rounded-full px-8 font-bold">
                                <Share2 className="mr-2 h-5 w-5" /> Paylaş
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel={slug.replace(/-/g, ' ').toUpperCase()} />
        </div>
    );
}
