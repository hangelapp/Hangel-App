
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, 
    ArrowLeft,
    Briefcase,
    Landmark,
    School,
    DollarSign,
    ShieldCheck,
    Globe,
    Zap,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ProductSection = ({ 
    title, 
    subtitle, 
    description, 
    cta1 = "Daha Fazla Bilgi", 
    cta1Href = "#",
    cta2 = "Hemen Başvur", 
    cta2Href = "/login/selection?action=register",
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
        <div className="relative z-10 space-y-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
            {description && <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={cta1Href} className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
                <Link href={cta2Href} className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                    {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
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
                        <span className="hidden sm:inline">Kurumsal İşbirliği Programları</span>
                        <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register&type=corporate">Şimdi Katıl</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Şirketler Bölümü */}
            <ProductSection 
                title="Şirketler için hangel."
                subtitle="Kurumsal sosyal sorumlulukta yeni nesil."
                description="Marka değerinizi artırın ve çalışan bağlılığını güçlendirin. Her alışverişi şeffaf bir iyilik hikayesine dönüştürün."
                cta1Href="/contact/companies"
                imageUrl="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                imageHint="modern office meeting room glass"
            />

            {/* Belediyeler Bölümü */}
            <ProductSection 
                theme="dark"
                title="Belediyeler için."
                subtitle="Şehrinizdeki sosyal etkiyi dijitalleştirin."
                description="Vatandaş katılımını artırın, STK'ları güçlendirin ve akıllı şehir çözümlerini Hangel altyapısıyla entegre edin."
                cta1Href="/contact/municipalities"
                imageUrl="https://images.unsplash.com/photo-1577086664693-894d8405334a?q=80&w=2071&auto=format&fit=crop"
                imageHint="modern city hall building architecture"
            />

            {/* Üniversiteler Bölümü */}
            <ProductSection 
                title="Üniversiteler için."
                subtitle="Kampüsün değişim lideri olun."
                description="Öğrenci kulüplerinizi dijital yönetim araçlarıyla güçlendirin. Gönüllülüğü akademik kredi ve sertifikasyonla taçlandırın."
                cta1Href="/contact/universities"
                imageUrl="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                imageHint="university campus campus students"
            />

            {/* Fonlar Bölümü */}
            <ProductSection 
                theme="dark"
                title="Uluslararası Fonlar."
                subtitle="Ölçülebilir ve şeffaf yatırım."
                description="Türkiye'deki sivil toplum ekosistemine yatırım yapın. SROI analizi ve şeffaflık endeksi ile etkinizi verilerle takip edin."
                cta1Href="/contact/funds"
                imageUrl="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                imageHint="world map data visualization digital"
            />

            {/* Apple-style Footer Detail Area */}
            <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-20 pb-12 px-4 sm:px-6">
                <div className="container mx-auto max-w-4xl space-y-16">
                    <div className="space-y-6 text-xs text-[#86868b] leading-relaxed">
                        <p>
                            1. hangel Kurumsal İşbirliği Programı, onaylı STK'lar, markalar ve kamu kuruluşları için geçerlidir. Başvuru süreci, kuruluşun şeffaflık endeksi kriterlerini karşılamasına bağlı olarak değişkenlik gösterebilir.
                        </p>
                        <p>
                            2. "Bağış Eşleştirme" (Matching Gift) özellikleri, markaların ve şirketlerin İK sistemleri ile hangel API entegrasyonu tamamlandıktan sonra aktif hale gelir. Teknik destek için hangel Hub çözüm merkeziyle iletişime geçiniz.
                        </p>
                        <p>
                            3. Üniversite programı kapsamındaki "Akademik Kredi" desteği, ilgili üniversite senatosunun onayı ve hangel ile imzalanan kurumsal protokol çerçevesinde sunulmaktadır.
                        </p>
                        <p>
                            4. Tüm finansal hareketler ve bağış aktarımları, PCI-DSS standartlarında şifrelenmiş altyapı üzerinden ve yasal mevzuatlara uygun olarak gerçekleştirilmektedir.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-black/10 pt-12">
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]">İşbirlikleri</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/contact/companies" className="hover:underline">Şirketler</Link>
                                <Link href="/contact/municipalities" className="hover:underline">Belediyeler</Link>
                                <Link href="/contact/universities" className="hover:underline">Üniversiteler</Link>
                                <Link href="/contact/funds" className="hover:underline">Fonlar</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]">Kurumsal</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/about" className="hover:underline">Biz Kimiz?</Link>
                                <Link href="/press" className="hover:underline">Basın Odası</Link>
                                <Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link>
                                <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]">Destek</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/support" className="hover:underline">Yardım Merkezi</Link>
                                <Link href="/settings/contracts" className="hover:underline">Sözleşmeler</Link>
                                <Link href="/about" className="hover:underline">Bize Ulaşın</Link>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]">Sosyal Etki</h4>
                            <nav className="flex flex-col gap-2.5 text-[12px] text-[#1d1d1f]/70">
                                <Link href="/impact-story" className="hover:underline">Etki Story</Link>
                                <Link href="/leaderboard" className="hover:underline">Liderlik Tablosu</Link>
                                <Link href="/library" className="hover:underline">Kütüphane</Link>
                            </nav>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <span className="font-bold text-xl tracking-tighter text-[#1d1d1f]">hangel hub</span>
                            </div>
                            <p className="text-[11px] text-[#86868b] max-w-xs leading-relaxed">
                                © 2024 Hangel Hub Teknoloji A.Ş. Kurumsal Çözümler Merkezi. Tüm hakları saklıdır.
                            </p>
                        </div>
                        <div className="flex gap-6 text-[11px] font-medium text-[#1d1d1f]/60">
                            <Link href="/settings/contracts" className="hover:underline">Gizlilik Politikası</Link>
                            <Link href="/settings/contracts" className="hover:underline">Kullanım Şartları</Link>
                            <Link href="#" className="hover:underline">Site Haritası</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
