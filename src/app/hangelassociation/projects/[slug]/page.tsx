
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, ShieldCheck, Globe, Briefcase, Map, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useToast } from '@/hooks/use-toast';
import { useAssociationProject } from '@/hooks/use-site-content';

const projectContents: Record<string, any> = {
    'istihdam-protokolu': {
        title: "Etki Odaklı İstihdam.",
        subtitle: "Gönüllülüğü kariyere dönüştüren ilk model.",
        desc: "Arçelik ve diğer partnerlerimizle yürüttüğümüz bu projede, gönüllülük faaliyetlerini 'Resmi İş Deneyimi' ve 'Resmi Özgeçmiş' olarak tanıyoruz. Toplumsal fayda odaklı bireylere iş dünyasında liyakat önceliği sağlıyoruz.",
        icon: Briefcase,
        imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
        hint: "job interview corporate"
    },
    'etki-atlasi': {
        title: "Sosyal Etki Atlası.",
        subtitle: "Türkiye'nin iyilik haritasını çiziyoruz.",
        desc: "Şehir şehir, mahalle mahalle sosyal sorunları ve üretilen çözümleri veri görselleştirme ile dijital bir haritaya taşıyoruz. Kaynakların doğru yere aktarılmasını sağlıyoruz.",
        icon: Map,
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
        hint: "digital data visualization map"
    },
    'gelir-modeli': {
        title: "STK Gelir Modelleri.",
        subtitle: "Sürdürülebilir finansal bağımsızlık.",
        desc: "Sivil toplum kuruluşlarının sadece bağışlara değil, kendi yarattıkları ekonomik değerlere dayanmasını sağlayacak sürdürülebilir gelir modelleri tasarlıyoruz.",
        icon: DollarSign,
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop",
        hint: "coins money growth"
    }
};

export default function ProjectSlugPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const slug = params.slug as string;
    const cms = useAssociationProject(slug);
    const staticContent = projectContents[slug];

    // CMS varsa onu önceliklendir; yoksa statik fallback'a dön; ikisi de yoksa 404 mesajı.
    const hasCms = !!(cms.title || cms.description || cms.body);
    if (!hasCms && !staticContent) {
        if (cms.isLoading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
        return <div className="min-h-screen flex items-center justify-center">Proje bulunamadı.</div>;
    }

    const content = {
        title: cms.title || staticContent?.title || 'Proje',
        subtitle: cms.subtitle || staticContent?.subtitle || '',
        desc: cms.description || staticContent?.desc || '',
        imageUrl: cms.heroImageUrl || staticContent?.imageUrl,
        hint: staticContent?.hint || '',
        icon: staticContent?.icon || Target,
        body: cms.body,
    };
    const Icon = content.icon;

    return (
        <div className="min-h-screen bg-white font-sans">
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#1d1d1f]/40">PROJELER</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-32 pb-24">
                <section className="container mx-auto px-6 max-w-5xl space-y-16">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-left">
                            <div className="p-4 bg-primary/10 rounded-2xl w-fit">
                                <Icon className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                                {content.title}
                            </h1>
                            <p className="text-xl md:text-3xl text-muted-foreground font-medium leading-tight">
                                {content.subtitle}
                            </p>
                            <p className="text-lg text-[#1d1d1f]/70 leading-relaxed font-medium">
                                {content.desc}
                            </p>
                            <Button onClick={() => toast({title: "Talep Alındı", description: "Proje detayları ve iş birliği rehberi iletilecektir."})} size="lg" className="rounded-full px-10 h-14 font-bold shadow-xl shadow-primary/20">
                                Bilgi Al <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex-1 relative aspect-square md:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                            {content.imageUrl && (
                                <Image src={content.imageUrl} alt={content.title} fill className="object-cover" data-ai-hint={content.hint} />
                            )}
                        </div>
                    </div>

                    {content.body && (
                        <div className="prose prose-lg max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: content.body }} />
                    )}
                </section>
            </main>

            <PublicFooter currentPageLabel={slug.replace(/-/g, ' ').toUpperCase()} />
        </div>
    );
}
