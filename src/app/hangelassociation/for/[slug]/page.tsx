'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, ShieldCheck, Heart, ShoppingCart, HeartHandshake, Briefcase, Globe, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const contents: Record<string, any> = {
    'stk': {
        title: "Sivil Toplum İçin Dijital Gelecek.",
        subtitle: "Kapasitenizi teknolojiyle katlayın.",
        desc: "Dernek ve vakıfların dijitalleşmesi, şeffaf raporlama yapabilmesi ve sürdürülebilir kaynaklara erişmesi için uçtan uca çözümler sunuyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop",
        hint: "volunteers collaboration office"
    },
    'sosyal-girisimciler': {
        title: "Sosyal Girişimcilere Tam Destek.",
        subtitle: "Fikirden etkiye giden yolculukta yanınızdayız.",
        desc: "Dünyayı iyileştiren iş modelleri kuran girişimcileri yatırımcılar, akademik ağlar ve yasal desteklerle buluşturuyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
        hint: "young entrepreneur working"
    },
    'gencler': {
        title: "Gençlik Hareketi Başlıyor.",
        subtitle: "Kampüsün değişim lideri olun.",
        desc: "Üniversite öğrencilerinin sosyal etki projelerini destekliyor, gönüllülük faaliyetlerini akademik krediye ve iş tecrübesine dönüştürüyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop",
        hint: "university students on campus"
    },
    'markalar': {
        title: "Bilinçli Markalar Ekosistemi.",
        subtitle: "Ticareti sosyal faydayla birleştirin.",
        desc: "Satışlarını toplumsal bir amaca bağlayan vizyoner markalarla, sivil toplum için ek masrafsız bağış modelleri inşa ediyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
        hint: "modern retail store interior"
    },
    'akademisyenler': {
        title: "Bilgiyle Şekillenen Etki.",
        subtitle: "Sivil toplum literatürünü güçlendiriyoruz.",
        desc: "Üniversite iş birlikleriyle sosyal girişimcilik müfredatları hazırlıyor, akademik araştırmalara veri ve kaynak desteği sağlıyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
        hint: "academic meeting discussion"
    },
    'hukukcular': {
        title: "Sosyal Hukuk Reformu.",
        subtitle: "Geleceğin mevzuatını birlikte yazıyoruz.",
        desc: "Sosyal Girişimcilik Kanun Teklifi taslağımızla, sektörün yasal statüsünü ve denetim standartlarını belirliyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop",
        hint: "legal documents gavel"
    },
    'ik-uzmanlari': {
        title: "Etki Odaklı İnsan Kaynağı.",
        subtitle: "Gönüllülüğü kurumsal kimliğe taşıyın.",
        desc: "Çalışan gönüllülüğü programlarını resmi kariyer süreçlerine entegre eden istihdam protokolleriyle sosyal faydayı kurumsallaştırıyoruz.",
        imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
        hint: "corporate office collaboration"
    }
};

export default function ForSlugPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const content = contents[slug];

    if (!content) return <div>Sayfa bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-white font-sans">
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#1d1d1f]/40">KİM İÇİN</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-32 pb-20">
                <section className="container mx-auto px-6 text-center space-y-8 max-w-4xl">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                            {content.title}
                        </h1>
                        <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-tight">
                            {content.subtitle}
                        </p>
                    </div>
                    
                    <p className="text-lg md:text-xl text-[#1d1d1f]/70 leading-relaxed font-medium pt-8 border-t max-w-2xl mx-auto">
                        {content.desc}
                    </p>

                    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl mt-16">
                        <Image src={content.imageUrl} alt={content.title} fill className="object-cover" data-ai-hint={content.hint} />
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel={slug.replace(/-/g, ' ').toUpperCase()} />
        </div>
    );
}
