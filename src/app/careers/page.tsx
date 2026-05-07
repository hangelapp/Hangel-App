
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { volunteeringOpportunities } from '@/lib/data';
import { useWebPage } from '@/hooks/use-site-content';

const CareerSection = ({ 
    title, 
    subtitle, 
    description, 
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-[80vh] flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
        </div>
        
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-2xl">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover" 
                    data-ai-hint={imageHint}
                />
            </div>
        </div>
    </section>
);

export default function CareersPage() {
    const router = useRouter();
    const cms = useWebPage('careers');

    const hangelVolunteerOps = volunteeringOpportunities.filter(
        (op) => op.organization === 'hangel Derneği'
    );

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight">Kariyer</span>
                    <div className="w-24"></div>
                </div>
            </header>

            {/* Hero */}
            <CareerSection
                title={cms.title || 'Geleceği Bizimle İnşa Edin.'}
                subtitle={cms.subtitle || 'Etki odaklı bir kariyer yolculuğuna başlayın.'}
                description={cms.description || "Hangel'de sadece kod yazmıyor veya kampanya yönetmiyoruz; toplumsal bir dönüşümün mimarları oluyoruz. Yeteneklerinizi dünya için kullanmaya hazır mısınız?"}
                imageUrl={cms.heroImageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'}
                imageHint="young professionals working happy"
            />

            {/* Values */}
            <CareerSection 
                theme="dark"
                title="Değerlerimizle Güçlüyüz."
                subtitle="Yaratıcılık, Şeffaflık ve Cesaret."
                description="Sınırları zorlamayı seviyoruz. Hiyerarşiden uzak, fikirlerin özgürce paylaşıldığı ve sosyal etkinin her şeyin önünde olduğu bir ekosistemde çalışıyoruz."
                imageUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                imageHint="collaborative meeting brainstorming"
            />

            {/* Global Impact */}
            <CareerSection 
                title="Global Bir Vizyon."
                subtitle="Türkiye'den dünyaya uzanan iyilik köprüsü."
                description="Yerel sorunlara global standartlarda çözümler üretiyoruz. Teknoloji ekibimizden saha koordinatörlerimize kadar hepimiz aynı tutkuyla çalışıyoruz."
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="students group study discussion"
            />

            <section className="py-24 bg-[#f5f5f7]">
              <div className="container mx-auto px-6 max-w-4xl space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">Açık Pozisyonlar</h2>
                    <p className="text-lg text-muted-foreground">İyilik hareketine katılın, yeteneklerinizle fark yaratın.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'Frontend Geliştirici (React/Next.js)', location: 'İstanbul / Remote', type: 'Tam Zamanlı', org: 'hangel A.Ş.' },
                    { title: 'Topluluk Yöneticisi', location: 'Ankara', type: 'Tam Zamanlı', org: 'hangel A.Ş.' },
                    { title: 'Proje Koordinatörü (Gönüllülük Programları)', location: 'İzmir', type: 'Tam Zamanlı', org: 'hangel A.Ş.' },
                    { title: 'İş Geliştirme Uzmanı (STK ve Marka Ortaklıkları)', location: 'İstanbul', type: 'Tam Zamanlı', org: 'hangel A.Ş.' },
                    { title: 'UI/UX Tasarımcısı', location: 'Remote', type: 'Proje Bazlı', org: 'hangel A.Ş.' },
                  ].map((job, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border hover:border-primary transition-all">
                      <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.org} • {job.location} • {job.type}</p>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link href="#">İncele ve Başvur <ChevronRight className="h-4 w-4 ml-2"/></Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            <section className="py-24 bg-white">
              <div className="container mx-auto px-6 max-w-4xl space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">Gönüllülük Fırsatları</h2>
                    <p className="text-lg text-muted-foreground">Zamanınızı ve yeteneklerinizi toplumsal faydaya dönüştürün.</p>
                </div>
                <div className="space-y-4">
                  {hangelVolunteerOps.map((job) => (
                    <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border hover:border-primary transition-all">
                      <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.organization} • {job.location.city} • {job.commitment}</p>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link href={`/volunteering/${job.id}`}>İncele ve Başvur <ChevronRight className="h-4 w-4 ml-2"/></Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <PublicFooter currentPageLabel="Kariyer" />
        </div>
    );
}
