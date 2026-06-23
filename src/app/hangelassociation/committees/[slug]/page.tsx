
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Scale, Users, Sparkles, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';

type CommitteeContent = {
    title: string;
    subtitle: string;
    desc: string;
    icon: LucideIcon;
    color: string;
    tasks: string[];
};

const committeeContents: Record<string, CommitteeContent> = {
    'mevzuat': {
        title: "Etki Mevzuatı ve Politika.",
        subtitle: "Hukuk ve sosyal faydanın kesişimi.",
        desc: "Komisyonumuz, sosyal girişimcilik alanında ihtiyaç duyulan yasal düzenlemeler üzerinde çalışır. Kanun teklifi taslakları hazırlar ve kamu otoriteleriyle istişare süreçlerini yönetir.",
        icon: Scale,
        color: "bg-primary",
        tasks: ["Yasal Tanım Çalışmaları", "Teşvik Politikaları", "Denetim Standartları", "Kamu İstişareleri"]
    },
    'akademik': {
        title: "Akademik Bilim Kurulu.",
        subtitle: "Veriye dayalı toplumsal uyanış.",
        desc: "Farklı disiplinlerden akademisyenlerin yer aldığı kurulumuz, sosyal etki projelerinin bilimsel temellerini oluşturur ve ölçümleme metodolojileri geliştirir.",
        icon: Brain,
        color: "bg-blue-500",
        tasks: ["Metodoloji Geliştirme", "Yüksek Lisans Programları", "Tez Destekleri", "Sektörel Raporlama"]
    },
    'insan-kultur': {
        title: "İnsan ve Kültür Komitesi.",
        subtitle: "Dayanışmanın sosyal mimarları.",
        desc: "Gönüllülük kültürünü yaygınlaştırmak, insan kaynağını etki odaklı hale getirmek ve toplumsal bilinci artırmak için stratejiler üretir.",
        icon: Users,
        color: "bg-orange-500",
        tasks: ["Gönüllü Deneyimi", "İstihdam Protokolleri", "Kurumsal Kültür", "Eğitim Programları"]
    },
    'inovasyon': {
        title: "Sosyal İnovasyon Komitesi.",
        subtitle: "Geleceğin çözümlerini tasarlıyoruz.",
        desc: "Teknoloji ve sosyal faydayı birleştiren yeni modeller geliştirir. Platformun dijital araçlarının etki kapasitesini artırmak için inovatif çözümler sunar.",
        icon: Sparkles,
        color: "bg-purple-500",
        tasks: ["Dijital Araç Tasarımı", "Yeni Gelir Modelleri", "Platform Geliştirme", "Trend Analizi"]
    }
};

export default function CommitteeSlugPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const slug = params.slug as string;
    const content = committeeContents[slug];

    if (!content) return <div>Komite bulunamadı.</div>;

    const Icon = content.icon;

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">KOMİTELER</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-[calc(8rem+env(safe-area-inset-top))] pb-24">
                <section className="container mx-auto px-6 max-w-4xl space-y-16">
                    <div className="text-center space-y-8">
                        <div className={cn("w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white shadow-2xl", content.color)}>
                            <Icon className="h-10 w-10" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.95]">{content.title}</h1>
                            <p className="text-xl md:text-3xl text-muted-foreground font-medium">{content.subtitle}</p>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto border-t pt-8">
                            {content.desc}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-center text-muted-foreground">Odak Alanları</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {content.tasks.map((task: string, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-6 bg-muted rounded-[2rem] border border-border hover:bg-card transition-all group">
                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                    <span className="font-bold text-foreground">{task}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-12 text-center">
                        <Button onClick={() => toast({title: "Başvuru", description: "Uzmanlık alanınızla komiteye katılma talebiniz incelenecektir."})} variant="outline" className="rounded-full px-10 h-14 font-bold border-border hover:bg-black hover:text-white">
                            Komiteye Katılın
                        </Button>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel={slug.replace(/-/g, ' ').toUpperCase()} />
        </div>
    );
}
