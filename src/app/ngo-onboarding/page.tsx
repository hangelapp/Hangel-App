'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldCheck, 
    HeartHandshake, 
    HandCoins, 
    UserCog, 
    BarChart3, 
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
    ArrowLeft,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const services = [
    {
        title: 'Temel Sosyal Etki Araçları',
        subtitle: 'Güven inşa edin, etkiyi büyütün.',
        items: [
            { icon: ShieldCheck, name: 'Şeffaflık Endeksi', desc: 'Kurumsal hesap verebilirliğinizi ölçülebilir kriterlerle kanıtlayın ve bağışçı güvenini artırın.', important: true },
            { icon: HeartHandshake, name: 'Gönüllülük Yönetimi', desc: 'İlanlarınızı yayınlayın, başvuruları yetkinlik bazlı filtreleyin ve tüm süreci dijitalden yönetin.', important: true },
            { icon: HandCoins, name: 'hangel bağışı', desc: 'Kullanıcıların günlük alışverişlerinden doğan sürdürülebilir ve komisyonsuz fon kaynağına erişin.', important: true },
            { icon: BarChart3, name: 'Demografi Analizi', desc: 'Destekçi kitlenizi yaş, şehir ve ilgi alanı gibi verilerle derinlemesine tanıyarak strateji geliştirin.', important: true },
        ]
    },
    {
        title: 'Yönetim ve Finans',
        subtitle: 'Operasyonel verimliliği maksimize edin.',
        items: [
            { icon: UserCog, name: 'Yetkili Yönetimi', desc: 'Ekip üyelerinize farklı roller tanımlayarak panel erişimini güvenli bir şekilde delege edin.' },
            { icon: Database, name: 'CRM Yönetimi', desc: 'Gönüllü ve bağışçı veri tabanınızı profesyonel araçlarla segmentlere ayırın ve yönetin.' },
            { icon: Calculator, name: 'Ön Muhasebe Yönetimi', desc: 'Gelir-gider kalemlerini, bağış dökümlerini ve finansal raporları anlık olarak takip edin.' },
            { icon: ShoppingCart, name: 'İktisadi İşletme Yönetimi', desc: 'Ürün satış süreçlerinizi, stok takibini ve pazar yeri entegrasyonlarını tek noktadan yürütün.' },
            { icon: CreditCard, name: 'Pos & Ödeme Sistemleri', desc: 'Online bağış toplama için gerekli tüm güvenli ödeme altyapısına ve sanal POS desteğine sahip olun.' },
        ]
    },
    {
        title: 'Dijital Varlık ve İletişim',
        subtitle: 'Dijital dünyadaki sesiniz olun.',
        items: [
            { icon: Globe, name: 'Web Sitesi Yönetimi', desc: 'Kurumsal kimliğinizi yansıtan, SEO uyumlu ve bağış modüllü profesyonel bir web sitesine sahip olun.' },
            { icon: QrCode, name: 'STK Profil QR Kodu', desc: 'Fiziksel etkinliklerde ve basılı materyallerde profilinize anında erişim sağlayan dinamik kodlar.' },
            { icon: MessageSquare, name: 'SMS Gönderimi', desc: 'Önemli duyuruları ve acil yardım çağrılarını destekçilerinizin cebine anında ulaştırın.' },
            { icon: Mail, name: 'Mail Gönderimi', desc: 'E-bültenler ve profesyonel e-posta kampanyaları ile topluluğunuzu gelişmelerden haberdar edin.' },
            { icon: MessageCircle, name: 'DM Mesajlaşma Merkezi', desc: 'Tüm sosyal medya mesajlarınızı ve WhatsApp hattınızı tek bir merkezi panelden yönetin.' },
        ]
    },
    {
        title: 'Pazarlama ve Operasyon',
        subtitle: 'Görünürlüğünüzü ve saha gücünüzü artırın.',
        items: [
            { icon: Megaphone, name: 'Reklam Yönetimi', desc: 'Platform içi reklam alanlarında öne çıkın ve daha geniş bir potansiyel destekçi kitlesine ulaşın.' },
            { icon: Target, name: 'Pazarlama İletişimi', desc: 'Bağışçı kazanımı ve kurumsal marka konumlandırması için stratejik iletişim araçlarını kullanın.' },
            { icon: Calendar, name: 'Etkinlik Yönetimi', desc: 'Fiziksel veya dijital organizasyonlarınızı planlayın, biletleme yapın ve katılımcı listelerini yönetin.' },
            { icon: MapPin, name: 'Saha Ekip Yönetimi', desc: 'Saha operasyonlarındaki ekiplerin anlık koordinasyonunu, görev atamalarını ve takibini gerçekleştirin.' },
            { icon: PhoneCall, name: 'Sanal Santral Yönetimi', desc: 'Kurumsal bir 0850\'li numara ile çağrı merkezi altyapısı kurun ve iletişim kalitenizi artırın.' },
        ]
    },
    {
        title: 'Eğitim ve Altyapı Desteği',
        subtitle: 'Kurumsal kapasitenizi geliştirin.',
        items: [
            { icon: GraduationCap, name: 'Üniversite Gönüllük Dersi', desc: 'Akademik kredi kapsamında üniversite öğrencilerinden taze bir gönüllü gücü desteği alın.' },
            { icon: Building2, name: 'Sanal ve Fiziki Ofis', desc: 'Belediye ve iş ortağı destekli paylaşımlı ofis alanlarına ve yasal adres hizmetine erişin.' },
            { icon: Video, name: 'Online Eğitim & Toplantı', desc: 'Webinarlar, online eğitimler ve kurumsal toplantılar için entegre video konferans araçlarını kullanın.' },
            { icon: Palette, name: 'Tasarım Programları', desc: 'Görsel iletişim materyalleriniz için kurumsal tasarım yazılımlarına avantajlı koşullarla sahip olun.' },
        ]
    }
];

export default function NgoOnboardingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#1d1d1f] font-sans antialiased pb-20">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 w-full h-14 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50 flex items-center px-6">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex justify-center items-center pr-10">
                    <span className="font-bold text-lg tracking-tighter text-primary">hangel STK</span>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-16 px-6 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                    <Sparkles className="h-3 w-3" /> Dijital Dönüşüm Paketi
                </div>
                <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
                    Sivil toplumun <br className="hidden md:block" />
                    yeni nesil işletim sistemi.
                </h1>
                <p className="text-lg md:text-2xl text-[#86868b] max-w-2xl mx-auto font-medium leading-relaxed">
                    Hangel ile kuruluşunuzu dijitalleştirin, kaynaklarınızı şeffafça yönetin ve toplumsal etkinizi profesyonel araçlarla büyütün.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 bg-[#0066cc] hover:bg-[#0071e3] text-white text-lg font-semibold shadow-xl shadow-blue-500/20">
                        <Link href="/login/selection?action=register&type=corporate">Hemen Başvur</Link>
                    </Button>
                    <Button asChild variant="link" className="text-[#0066cc] text-lg font-semibold group">
                        <Link href="/support">
                            Daha fazla bilgi al <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Services Grid */}
            <div className="container mx-auto max-w-6xl px-6 space-y-24 mt-12">
                {services.map((group, groupIdx) => (
                    <div key={group.title} className="space-y-10">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{group.title}</h2>
                            <p className="text-[#86868b] text-lg font-medium">{group.subtitle}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {group.items.map((item) => (
                                <Card 
                                    key={item.name} 
                                    className={cn(
                                        "border-none shadow-none bg-white rounded-[2rem] p-8 transition-all hover:shadow-2xl hover:scale-[1.01] group relative overflow-hidden",
                                        item.important && "ring-1 ring-primary/20 bg-gradient-to-br from-white to-primary/5"
                                    )}
                                >
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                                            item.important ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-[#f5f5f7] text-[#1d1d1f]"
                                        )}>
                                            <item.icon className="h-7 w-7" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-xl md:text-2xl flex items-center gap-3">
                                                {item.name}
                                                {item.important && (
                                                    <Badge variant="default" className="bg-primary text-[9px] h-5 px-2 font-black uppercase tracking-tighter">Önemli</Badge>
                                                )}
                                            </h3>
                                            <p className="text-sm md:text-base leading-relaxed text-[#86868b] font-medium">
                                                {item.desc}
                                            </p>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-[#d2d2d7]/30 flex items-center text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Detayları İncele <ChevronRight className="ml-1 h-4 w-4" />
                                        </div>
                                    </div>
                                    {/* Subtle iOS style background pattern */}
                                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Final CTA */}
            <section className="container mx-auto max-w-5xl mt-32 px-6">
                <div className="bg-[#1d1d1f] text-white p-12 md:p-24 rounded-[3.5rem] text-center space-y-8 relative overflow-hidden shadow-2xl">
                    {/* Abstract light effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[120px] rounded-full" />
                    
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                            İyiliği dijitalle <br /> birlikte büyütelim.
                        </h2>
                        <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto font-medium">
                            Türkiye'nin en büyük sosyal etki ekosistemine kurumsal bir ortak olarak katılın, sürdürülebilir fon ve gönüllü gücüne ulaşın.
                        </p>
                        <div className="pt-6">
                            <Button asChild size="lg" className="rounded-full px-14 h-16 bg-white text-black hover:bg-white/90 text-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                                <Link href="/login/selection?action=register&type=corporate">Başvuru Formunu Doldur</Link>
                            </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 text-white/40">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Kolay Başvuru
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Uzman Desteği
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Şeffaf Raporlama
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Apple style footer */}
            <footer className="mt-20 border-t border-[#d2d2d7]/50 pt-12 pb-8 px-6 text-center">
                <div className="container mx-auto max-w-6xl">
                    <p className="text-xs text-[#86868b] font-medium">
                        Copyright © 2026 Hangel Hub Inc. Tüm hakları saklıdır. <br className="sm:hidden" />
                        <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline ml-1">Gizlilik Politikası</Link> | 
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline ml-1">Kullanım Şartları</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
}
