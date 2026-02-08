'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, 
    HeartHandshake, 
    HandCoins, 
    BarChart3, 
    Users, 
    QrCode, 
    Globe, 
    MessageSquare, 
    Mail, 
    Megaphone, 
    Calendar, 
    Video, 
    Palette, 
    CreditCard, 
    Target, 
    Calculator, 
    Database, 
    PhoneCall, 
    Building2, 
    GraduationCap, 
    MapPin, 
    MessageCircle, 
    ShoppingCart,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const FeatureCard = ({ 
    title, 
    description, 
    icon: Icon, 
    className,
    isLarge = false
}: { 
    title: string, 
    description: string, 
    icon: any, 
    className?: string,
    isLarge?: boolean
}) => (
    <div className={cn(
        "group relative flex flex-col bg-white rounded-[2.5rem] p-8 transition-all hover:shadow-2xl border border-black/5 overflow-hidden",
        isLarge ? "md:col-span-2 min-h-[400px] justify-between" : "min-h-[280px] justify-start",
        className
    )}>
        <div className={cn(
            "rounded-2xl flex items-center justify-center mb-6 transition-colors",
            isLarge ? "w-16 h-16 bg-primary/10 text-primary" : "w-12 h-12 bg-[#f5f5f7] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
            <Icon className={isLarge ? "h-8 w-8" : "h-6 w-6"} />
        </div>
        <div className="space-y-3">
            <h3 className={cn("font-bold tracking-tight", isLarge ? "text-2xl md:text-3xl" : "text-lg")}>{title}</h3>
            <p className={cn("text-muted-foreground leading-relaxed font-medium", isLarge ? "text-base md:text-lg max-w-md" : "text-sm")}>{description}</p>
        </div>
        {isLarge && (
            <div className="pt-8">
                <span className="text-primary font-bold flex items-center text-sm md:text-base">
                    Detayları Keşfet <ChevronRight className="h-4 w-4 ml-1" />
                </span>
            </div>
        )}
    </div>
);

export default function NgoOnboardingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30 pb-24">
            {/* Navigation / Header Area */}
            <div className="container mx-auto px-4 pt-8">
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full hover:bg-white">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Button>
            </div>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-16 pb-20 text-center space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#1d1d1f] max-w-4xl mx-auto">
                    Kuruluşunuzla <br className="hidden md:block" /> İyiliği Büyütün.
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                    Sivil toplumun dijital geleceğini birlikte inşa ediyoruz. Hangel Hub, operasyonlarınızı tek bir noktadan yönetmeniz için tasarlandı.
                </p>
                <div className="pt-8">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                        <Link href="/login/selection?action=register&type=corporate">Şimdi Başvur</Link>
                    </Button>
                </div>
            </section>

            {/* Core Impact Features - Large Cards */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <FeatureCard 
                    isLarge
                    icon={ShieldCheck}
                    title="Şeffaflık Endeksi"
                    description="Kurumsal güveninizi dijital ortamda tescilleyin. Şeffaflık puanınızla bağışçıların ve gönüllülerin öncelikli tercihi olun."
                />
                <FeatureCard 
                    isLarge
                    icon={HeartHandshake}
                    title="Gönüllülük Yönetimi"
                    description="Yetenek bazlı ilanlar oluşturun, binlerce hevesli gönüllüye ulaşın ve tüm başvuru süreçlerini profesyonelce koordine edin."
                />
                <FeatureCard 
                    isLarge
                    icon={HandCoins}
                    title="hangel Bağışı"
                    description="Sürdürülebilir kaynak yaratın. Destekçilerinizin anlaşmalı markalardan yaptığı alışverişleri kurumunuz için ek fona dönüştürün."
                />
                <FeatureCard 
                    isLarge
                    icon={BarChart3}
                    title="Demografi Analizi"
                    description="Topluluğunuzu verilerle tanıyın. Destekçilerinizin yaş, şehir ve ilgi alanı dağılımlarını analiz ederek stratejinizi güçlendirin."
                />
            </section>

            {/* Comprehensive Toolset - Small Cards Grid */}
            <section className="container mx-auto px-4 space-y-12">
                <div className="text-left md:text-center space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Eksiksiz Bir Yönetim Paneli.</h2>
                    <p className="text-lg text-muted-foreground font-medium">İhtiyacınız olan her araç, profesyonel standartlarda elinizin altında.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <FeatureCard icon={Users} title="Yetkili Yönetimi" description="Ekibinize farklı roller tanımlayın, panel yetkilerini güvenle dağıtın." />
                    <FeatureCard icon={QrCode} title="STK Profil QR Kodu" description="Fiziksel alanlarda kurum profilinize anında erişim sağlayın." />
                    <FeatureCard icon={Globe} title="Web Sitesi Yönetimi" description="Kurumsal kimliğinize özel web sitesi scriptlerini kolayca yönetin." />
                    <FeatureCard icon={MessageSquare} title="SMS Gönderimi" description="Önemli duyurularınızı gönüllülerinize SMS ile anında ulaştırın." />
                    <FeatureCard icon={Mail} title="Mail Gönderimi" description="E-bültenlerinizle bağışçılarınızı düzenli olarak bilgilendirin." />
                    <FeatureCard icon={Megaphone} title="Reklam Yönetimi" description="Platform içi görünürlüğünüzü artırın, hedef kitleye doğrudan ulaşın." />
                    <FeatureCard icon={Calendar} title="Etkinlik Yönetimi" description="Saha veya online etkinliklerinizi planlayın, kayıtları takip edin." />
                    <FeatureCard icon={Video} title="Online Eğitim & Toplantı" description="Gönüllülerinize uzaktan eğitimler verin, toplantılar düzenleyin." />
                    <FeatureCard icon={Palette} title="Tasarım Programları" description="Görsel materyalleriniz için profesyonel tasarım araçlarına erişin." />
                    <FeatureCard icon={CreditCard} title="Pos & Ödeme Sistemleri" description="Kurumsal ödeme altyapınızı platform ile entegre edin." />
                    <FeatureCard icon={Target} title="Pazarlama İletişimi" description="Topluluğunuzla kurduğunuz bağı profesyonel araçlarla büyütün." />
                    <FeatureCard icon={Calculator} title="Ön Muhasebe Yönetimi" description="Finansal hareketlerinizi ve hak edişlerinizi şeffafça izleyin." />
                    <FeatureCard icon={Database} title="CRM Yönetimi" description="Bağışçı ve gönüllü veri tabanınızı modern bir yapıda tutun." />
                    <FeatureCard icon={PhoneCall} title="Sanal Santral Yönetimi" description="Kurumsal iletişim numaranızı bulut tabanlı sistemle yönetin." />
                    <FeatureCard icon={Building2} title="Sanal ve Fiziki Ofis" description="İşbirliği ağımızdaki ofis ve toplantı alanlarından faydalanın." />
                    <FeatureCard icon={GraduationCap} title="Üniversite Gönüllük Dersi" description="Akademik kredi kapsamında binlerce öğrenciye kapılarınızı açın." />
                    <FeatureCard icon={MapPin} title="Saha Ekip Yönetimi" description="Saha operasyonlarınızı canlı harita ve araçlarla takip edin." />
                    <FeatureCard icon={MessageCircle} title="DM Mesajlaşma Merkezi" description="Destekçilerinizle anlık ve kurumsal bir dille mesajlaşın." />
                    <FeatureCard icon={ShoppingCart} title="İktisadi İşletme Yönetimi" description="Kurumsal ürünlerinizin satış süreçlerini dijitalleştirin." />
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="container mx-auto px-4 pt-24 pb-12">
                <div className="bg-black rounded-[3rem] p-12 text-center text-white space-y-8 shadow-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Dijital Dönüşümü Bugün Başlatın.</h2>
                    <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto">
                        Kuruluşunuzun etkisini teknolojiyle katlayın. Başvurunuzu yapın, ekibimiz sizinle iletişime geçsin.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-white text-black hover:bg-white/90">
                            <Link href="/login/selection?action=register&type=corporate">Hemen Başvur</Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="rounded-full px-10 h-14 text-lg font-bold text-white hover:bg-white/10 hover:text-white">
                            <Link href="/support">Bize Soru Sor</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="container mx-auto px-4 text-center text-[12px] text-muted-foreground font-medium pt-8">
                <p>&copy; 2024 hangel A.Ş. Sivil Toplum Çözüm Merkezi.</p>
            </footer>
        </div>
    );
}
