
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
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const features = [
    { name: 'Şeffaflık Endeksi', desc: 'Kurumsal verilerinizi paylaşarak bağışçı güvenini matematiksel kesinlikle kazanın.', icon: ShieldCheck, important: true },
    { name: 'Gönüllülük Yönetimi', desc: 'İlan yayınlayın, yetkinlik bazlı filtreleme yapın ve gönüllü gücünüzü koordine edin.', icon: HeartHandshake, important: true },
    { name: 'hangel bağış', desc: 'Marka işbirlikleri üzerinden kullanıcıların cebinden ek para çıkmadan sürdürülebilir fon yaratın.', icon: HandCoins, important: true },
    { name: 'Demografi Analizi', desc: 'Destekçilerinizin yaş, şehir ve ilgi alanlarını yapay zeka ile analiz edin.', icon: BarChart3, important: true },
    { name: 'Yetkili Yönetimi', desc: 'Ekip üyelerinize farklı yetki seviyelerinde panel erişimi tanımlayın.', icon: UserCog },
    { name: 'STK Profil QR Kodu', desc: 'Fiziksel materyallerde profilinize anında erişim sağlayan akıllı kodlar.', icon: QrCode },
    { name: 'Web Sitesi Yönetimi', desc: 'hangel altyapısıyla SEO uyumlu ve bağış modüllü kurumsal sitenizi kurun.', icon: Globe },
    { name: 'SMS Gönderimi', desc: 'Topluluğunuza acil durum ve bilgilendirme mesajlarını anında ulaştırın.', icon: MessageSquare },
    { name: 'Mail Gönderimi', desc: 'Profesyonel e-bültenler hazırlayın ve bağışçılarınızı bilgilendirin.', icon: Mail },
    { name: 'Reklam Yönetimi', desc: 'Platform içi ve Google Ads Grants destekli görünürlük çalışmaları yapın.', icon: Megaphone },
    { name: 'Etkinlik Yönetimi', desc: 'Fiziksel ve dijital etkinliklerinizi planlayın, katılımı takip edin.', icon: Calendar },
    { name: 'Online Eğitim & Toplantı', desc: 'Entegre video konferans araçlarıyla ekiplerinizi ve gönüllülerinizi eğitin.', icon: Video },
    { name: 'Tasarım Programları', desc: 'Canva Pro ve Adobe araçlarına kurumsal avantajlarla erişin.', icon: Palette },
    { name: 'Pos & Ödeme Sistemleri', desc: 'Online bağış toplamak için gereken tüm POS altyapısına saniyeler içinde sahip olun.', icon: CreditCard },
    { name: 'Pazarlama İletişimi', desc: 'Bağışçı kazanımı için stratejik iletişim ve marka danışmanlığına erişin.', icon: Target },
    { name: 'Ön Muhasebe Yönetimi', desc: 'Gelir-gider dökümlerini ve bağış raporlarını anlık izleyin.', icon: Calculator },
    { name: 'CRM Yönetimi', desc: 'Bağışçı ve gönüllü ilişkilerinizi profesyonel bir altyapıyla yönetin.', icon: Database },
    { name: 'Sanal Santral Yönetimi', desc: '0850\'li numara ile kurumsal bir çağrı merkezi yapısı kurun.', icon: PhoneCall },
    { name: 'Sanal ve Fiziki Ofis', desc: 'Belediye ve iş ortağı destekli ofis ve yerleşke imkanlarından faydalanın.', icon: Building2 },
    { name: 'Üniversite Gönüllük Dersi', desc: 'Akademik kredi kapsamında üniversite öğrencilerinden gönüllü desteği alın.', icon: GraduationCap },
    { name: 'Saha Ekip Yönetimi', desc: 'Operasyonel ekiplerin konum takibini ve görev atamasını yapın.', icon: MapPin },
    { name: 'DM Mesajlaşma Merkezi', desc: 'Sosyal medya kanallarından gelen tüm mesajları tek bir panelden yanıtlayın.', icon: MessageCircle },
    { name: 'İktisadi İşletme Yönetimi', desc: 'Kendi ürünlerinizi satın, stok ve sipariş süreçlerini yönetin.', icon: ShoppingCart },
];

export default function NgoOnboardingPage() {
    const router = useRouter();

    return (
        <div className="p-4 sm:p-6 space-y-12 animate-in fade-in-0 bg-[#fafafa] min-h-screen pb-24">
            <header className="flex items-center justify-between">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="rounded-full">
                        <Link href="/login/selection?action=login&type=corporate">Giriş Yap</Link>
                    </Button>
                    <Button asChild className="rounded-full bg-[#0066cc] text-white">
                        <Link href="/login/selection?action=register&type=corporate">Şimdi Başvur</Link>
                    </Button>
                </div>
            </header>

            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">
                    Sivil Toplumun Dijital Gücü.
                </h1>
                <p className="text-xl text-[#86868b] font-medium leading-relaxed">
                    hangel Hub, STK yöneticileri için tasarlanmış dünyanın en kapsamlı sosyal etki ve yönetim platformudur.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 container mx-auto">
                {features.map((item) => (
                    <Card key={item.name} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-500 group bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                <item.icon className="h-6 w-6 text-[#1d1d1f] group-hover:text-primary transition-colors" />
                            </div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                {item.name}
                                {item.important && <Badge variant="default" className="bg-primary text-[8px] h-4 px-1 font-black uppercase tracking-tighter">Önemli</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <p className="text-sm leading-relaxed text-[#86868b] font-medium">
                                {item.desc}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <section className="bg-black rounded-[3rem] p-12 text-center text-white space-y-8 mt-24">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">İyiliğin geleceğini birlikte inşa edelim.</h2>
                <p className="text-white/60 text-lg max-w-xl mx-auto">Kuruluşunuzu hangel Hub ekosistemine dahil ederek dijital dönüşümünüzü bugün başlatın.</p>
                <div className="flex justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-12 bg-white text-black hover:bg-white/90 text-lg font-bold">
                        <Link href="/login/selection?action=register&type=corporate">Hemen Başvur</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
