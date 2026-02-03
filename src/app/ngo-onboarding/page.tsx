'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const services = [
    {
        title: 'Temel Sosyal Etki Araçları',
        items: [
            { icon: ShieldCheck, name: 'Şeffaflık Endeksi', desc: 'Güven inşa eden ölçülebilir şeffaflık raporları.', important: true },
            { icon: HeartHandshake, name: 'Gönüllülük Yönetimi', desc: 'İlan yayınlama ve başvuru takip sistemi.', important: true },
            { icon: HandCoins, name: 'hangel bağışı', desc: 'Alışverişlerden doğan sürdürülebilir fon kaynağı.', important: true },
            { icon: BarChart3, name: 'Demografi Analizi', desc: 'Destekçi kitlenizin derinlemesine analizi.', important: true },
        ]
    },
    {
        title: 'Yönetim ve Finans',
        items: [
            { icon: UserCog, name: 'Yetkili Yönetimi', desc: 'Ekip üyelerinize özel yetki tanımlama.' },
            { icon: Database, name: 'CRM Yönetimi', desc: 'Bağışçı ve gönüllü ilişkileri merkezi.' },
            { icon: Calculator, name: 'Ön Muhasebe Yönetimi', desc: 'Finansal kayıtların dijital takibi.' },
            { icon: ShoppingCart, name: 'İktisadi İşletme Yönetimi', desc: 'Ürün satış süreçlerinin entegrasyonu.' },
            { icon: CreditCard, name: 'Pos & Ödeme Sistemleri', desc: 'Güvenli online bağış toplama altyapısı.' },
        ]
    },
    {
        title: 'Dijital Varlık ve İletişim',
        items: [
            { icon: Globe, name: 'Web Sitesi Yönetimi', desc: 'Kurumsal kimliğinizi yansıtan dijital vitrin.' },
            { icon: QrCode, name: 'STK Profil QR Kodu', desc: 'Fiziksel alanlarda dijital erişim.' },
            { icon: MessageSquare, name: 'SMS Gönderimi', desc: 'Topluluğunuza hızlı bilgilendirme.' },
            { icon: Mail, name: 'Mail Gönderimi', desc: 'E-bülten ve resmi duyuru kanalları.' },
            { icon: MessageCircle, name: 'DM Mesajlaşma Merkezi', desc: 'Sosyal medya mesajlarının tek panelden yönetimi.' },
        ]
    },
    {
        title: 'Pazarlama ve Operasyon',
        items: [
            { icon: Megaphone, name: 'Reklam Yönetimi', desc: 'Platform içi görünürlük ve kampanya yönetimi.' },
            { icon: Target, name: 'Pazarlama İletişimi', desc: 'Bağışçı kazanımı stratejik araçları.' },
            { icon: Calendar, name: 'Etkinlik Yönetimi', desc: 'Organizasyon planlama ve biletleme.' },
            { icon: MapPin, name: 'Saha Ekip Yönetimi', desc: 'Ekiplerin anlık koordinasyon ve takibi.' },
            { icon: PhoneCall, name: 'Sanal Santral Yönetimi', desc: 'Kurumsal çağrı karşılama altyapısı.' },
        ]
    },
    {
        title: 'Eğitim ve Altyapı Desteği',
        items: [
            { icon: GraduationCap, name: 'Üniversite Gönüllük Dersi', desc: 'Akademik kredi kapsamında öğrenci desteği.' },
            { icon: Building2, name: 'Sanal ve Fiziki Ofis', desc: 'Resmi adres ve ortak çalışma alanı desteği.' },
            { icon: Video, name: 'Online Eğitim & Toplantı', desc: 'Dijital etkinlik ve seminer araçları.' },
            { icon: Palette, name: 'Tasarım Programları', desc: 'Görsel iletişim için kurumsal yazılım desteği.' },
        ]
    }
];

export default function NgoOnboardingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white text-[#1d1d1f] font-sans antialiased pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full h-12 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50 flex items-center px-4">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex justify-center pr-10">
                    <span className="font-bold text-lg text-primary">hangel STK</span>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-16 pb-12 px-6 text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                    Sivil Toplumun <br />
                    Dijital Dönüşüm Merkezi.
                </h1>
                <p className="text-lg md:text-xl text-[#86868b] max-w-2xl mx-auto font-medium">
                    Hangel ile kuruluşunuzu büyütün, kaynaklarınızı şeffafça yönetin ve gönüllülerinizle daha güçlü bağlar kurun.
                </p>
                <div className="pt-6">
                    <Button asChild size="lg" className="rounded-full px-10 h-12 bg-[#0066cc] hover:bg-[#0071e3] text-white">
                        <Link href="/login/selection?action=register&type=corporate">Hemen Başvur</Link>
                    </Button>
                </div>
            </section>

            {/* Services Grid */}
            <div className="container mx-auto max-w-6xl px-6 space-y-16">
                {services.map((group) => (
                    <div key={group.title} className="space-y-8">
                        <div className="border-b border-[#d2d2d7] pb-4">
                            <h2 className="text-2xl font-bold tracking-tight">{group.title}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {group.items.map((item) => (
                                <Card 
                                    key={item.name} 
                                    className={cn(
                                        "border-none shadow-none bg-[#f5f5f7] rounded-2xl p-6 transition-all hover:scale-[1.02] cursor-default",
                                        item.important && "bg-primary/5 ring-1 ring-primary/20"
                                    )}
                                >
                                    <div className="space-y-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            item.important ? "bg-primary text-white" : "bg-white text-[#1d1d1f] shadow-sm"
                                        )}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-base flex items-center gap-2">
                                                {item.name}
                                                {item.important && <Badge variant="default" className="bg-primary text-[8px] h-4 px-1 font-black uppercase tracking-tighter">Önemli</Badge>}
                                            </h3>
                                            <p className="text-[13px] leading-relaxed text-[#86868b] font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom CTA */}
            <section className="mt-24 px-6 py-20 bg-[#f5f5f7] text-center rounded-[3rem] mx-3 space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">İyiliği birlikte büyütelim.</h2>
                <p className="text-lg text-[#86868b] max-w-xl mx-auto">
                    Türkiye'nin en büyük sosyal etki ağına katılarak binlerce gönüllü ve bağışçıya ulaşın.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button asChild size="lg" className="rounded-full px-12 h-14 bg-[#0066cc] hover:bg-[#0071e3] text-white text-lg">
                        <Link href="/login/selection?action=register&type=corporate">Başvuru Formunu Doldur</Link>
                    </Button>
                    <Button asChild variant="link" className="text-[#0066cc] font-semibold text-lg group">
                        <Link href="/support">
                            Destek Al <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </section>

            <footer className="mt-12 text-center text-xs text-[#86868b]">
                <p>© 2026 hangel.org | Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
}
