
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const ProductSection = ({ 
    title, 
    subtitle, 
    description, 
    cta1 = "Daha Fazla Bilgi", 
    cta1Href = "#",
    cta2, 
    cta2Href,
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    cta1?: string, 
    cta1Href?: string,
    cta2?: string, 
    cta2Href?: string,
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative min-h-screen flex flex-col items-center pt-24 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={cta1Href} className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
                {cta2 && cta2Href && (
                    <Link href={cta2Href} className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                        {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>
        
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
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

export default function CorporateShowcasePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Header / Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <div className="flex items-center gap-6 text-[12px] font-medium text-[#1d1d1f]/80">
                        <span className="hidden sm:inline">Kamu İşbirliği Programları</span>
                        <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register&type=corporate">Şimdi Katıl</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Üniversiteler için */}
            <ProductSection 
                theme="dark"
                title="Üniversiteler için."
                subtitle="Kampüsün sosyal etki merkezi olun."
                description="Hangel Kampüs Programı ile öğrenci kulüplerinizi dijitalleştirin, gönüllülüğü akademik krediye dönüştürün ve öğrencilerinize sosyal sorumluluk alanında kariyer fırsatları sunun. Etkiyi ölçün, raporlayın ve üniversitenizin toplumsal fayda liderliğini pekiştirin."
                cta1Href="/campus-advantages"
                cta2="İşbirliği Başlat"
                cta2Href="/contact/universities"
                imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                imageHint="university students collaborating"
            />

            {/* Liseler için */}
            <ProductSection 
                title="Liseler için."
                subtitle="Geleceğin liderlerini bugünden yetiştirin."
                description="Öğrenci kulüplerinizi Hangel platformuna taşıyarak sosyal sorumluluk projelerini hayata geçirmelerini sağlayın. Öğrencilerinize erken yaşta gönüllülük bilinci kazandırın, etki puanları ve rozetlerle başarılarını ödüllendirin."
                cta1Href="/campus-advantages"
                cta2="Bize Ulaşın"
                cta2Href="/support"
                imageUrl="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
                imageHint="high school students classroom"
            />

            {/* Belediyeler için */}
            <ProductSection 
                theme="dark"
                title="Belediyeler için."
                subtitle="Akıllı şehir, duyarlı toplum."
                description="Vatandaş katılımını dijital araçlarla artırın. Şehrinizdeki STK'ları ve gönüllü ağlarını Hangel altyapısı ile güçlendirin. Sosyal yardım ve gönüllülük süreçlerini tek bir merkezden yöneterek kaynaklarınızı verimli kullanın."
                cta1="Çözümleri Keşfet"
                cta1Href="/contact/municipalities"
                cta2="Partner Olun"
                cta2Href="/contact/municipalities"
                imageUrl="https://images.unsplash.com/photo-1577086664693-894d8405334a?q=80&w=2071&auto=format&fit=crop"
                imageHint="modern city hall building architecture"
            />

            {/* Hükümetler için */}
            <ProductSection 
                title="Hükümetler için."
                subtitle="Ulusal sosyal etki stratejisi."
                description="Ülke genelindeki sivil toplum kapasitesini ölçün, sosyal ihtiyaç haritaları oluşturun ve kaynakları en doğru alanlara yönlendirin. Hangel'in sunduğu veri altyapısı ve teknolojik çözümlerle ulusal sosyal politikaları güçlendirin."
                cta1="Veri Altyapısı"
                cta1Href="/hangelassociation/projects/etki-atlasi"
                cta2="Stratejik Ortaklık"
                cta2Href="/support"
                imageUrl="https://images.unsplash.com/photo-1561574564-8a5f8b7a6fae?q=80&w=2070&auto=format&fit=crop"
                imageHint="government building flag"
            />
            
            {/* Bakanlıklar için */}
            <ProductSection 
                theme="dark"
                title="Bakanlıklar için."
                subtitle="Politika ve uygulama arasında dijital köprü."
                description="Gençlik ve Spor Bakanlığı'ndan İçişleri Bakanlığı'na, sosyal politikalarınızı sahada uygulayacak dijital araçlar sunuyoruz. Gönüllülük yasası, istihdam protokolleri ve sosyal girişimcilik mevzuatı gibi yapısal dönüşümler için veri ve teknoloji desteği sağlıyoruz."
                cta1="Mevzuat Çalışmaları"
                cta1Href="/hangelassociation/legislation"
                cta2="Bize Ulaşın"
                cta2Href="/support"
                imageUrl="https://images.unsplash.com/photo-1589943534882-620436d41c97?q=80&w=2070&auto=format&fit=crop"
                imageHint="official meeting government"
            />

            <PublicFooter currentPageLabel="Kamu İşbirlikleri" />
        </div>
    );
}
