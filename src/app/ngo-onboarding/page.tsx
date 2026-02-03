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
    CheckCircle2,
    Zap,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ServiceHighlight = ({ title, subtitle, description, icon: Icon, dark = false, important = false }: any) => (
    <section className={cn(
        "relative w-full overflow-hidden flex flex-col items-center text-center py-24 px-6 border-b border-[#d2d2d7]/30",
        dark ? "bg-black text-white" : "bg-white text-[#1d1d1f]"
    )}>
        <div className="z-10 max-w-4xl space-y-6">
            <div className="flex justify-center mb-4">
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl",
                    dark ? "bg-primary text-white" : "bg-[#f5f5f7] text-primary"
                )}>
                    <Icon className="h-8 w-8" />
                </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight italic">
                {title}
                {important && <span className="text-primary not-italic text-sm align-top ml-2 uppercase font-black tracking-widest">Önemli</span>}
            </h2>
            <p className={cn("text-xl md:text-3xl font-medium", dark ? "text-white/80" : "text-[#1d1d1f]/80")}>{subtitle}</p>
            <p className={cn("text-lg md:text-xl max-w-2xl mx-auto leading-relaxed", dark ? "text-white/60" : "text-[#86868b]")}>{description}</p>
        </div>
    </section>
);

const FeatureGridItem = ({ name, desc, icon: Icon }: any) => (
    <div className="bg-white rounded-[2.5rem] p-8 border border-[#d2d2d7]/50 transition-all hover:shadow-2xl hover:scale-[1.02] flex flex-col group">
        <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
            <Icon className="h-6 w-6 text-[#1d1d1f] group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-xl font-bold mb-3">{name}</h3>
        <p className="text-sm text-[#86868b] font-medium leading-relaxed flex-1">{desc}</p>
        <div className="mt-6 flex items-center text-primary font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Detayları Gör <ChevronRight className="ml-1 h-3 w-3" />
        </div>
    </div>
);

export default function NgoOnboardingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#1d1d1f] font-sans antialiased overflow-x-hidden">
            {/* Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50 flex items-center justify-between px-6">
                <Button onClick={() => router.back()} variant="ghost" size="sm" className="rounded-full gap-2 font-medium">
                    <ArrowLeft className="h-4 w-4" /> Geri
                </Button>
                <span className="font-bold text-lg tracking-tighter">hangel <span className="font-normal text-[#86868b]">STK Pro</span></span>
                <Button asChild size="sm" className="rounded-full bg-[#0066cc] text-white font-semibold">
                    <Link href="/login/selection?action=register&type=corporate">Başvur</Link>
                </Button>
            </header>

            {/* Intro Hero */}
            <section className="pt-32 pb-20 px-6 text-center space-y-6 bg-white border-b border-[#d2d2d7]/30">
                <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.05] max-w-5xl mx-auto">
                    Dünya için çalışanlara <br />
                    en güçlü araçlar.
                </h1>
                <p className="text-xl md:text-3xl text-[#86868b] max-w-3xl mx-auto font-medium">
                    Hangel Hub, sivil toplum kuruluşları için sadece bir platform değil; bağışçı güveni, gönüllü gücü ve finansal şeffaflık üzerine kurulu dev bir işletim sistemidir.
                </p>
            </section>

            {/* Core Highlights */}
            <ServiceHighlight 
                title="Şeffaflık Endeksi."
                subtitle="Güven, en değerli bağıştır."
                description="Kurumsal verilerinizi, faaliyet raporlarınızı ve yasal belgelerinizi şeffafça sunun. Platformda listelenmek için gereken 35 puan eşiğini aşarak bağışçılarınızın güvenini matematiksel bir kesinlikle kazanın."
                icon={ShieldCheck}
                important
            />

            <ServiceHighlight 
                title="Gönüllülük Yönetimi."
                subtitle="Yeteneği etkiye dönüştürün."
                description="Sadece insan kaynağı değil, uzmanlık bulun. İlanlarınızı yayınlayın, adayları 23 farklı yetkinlik kriterine göre filtreleyin ve mülakat sürecinden oryantasyona kadar her adımı dijitalden yönetin."
                icon={HeartHandshake}
                dark
                important
            />

            <ServiceHighlight 
                title="hangel bağış."
                subtitle="Alışverişi iyiliğe bağlayın."
                description="Kullanıcıların günlük ihtiyaçlarından doğan, STK'nız için sürdürülebilir ve komisyonsuz bir fon kaynağı. Hiç kimseden ek ödeme talep etmeden, sadece bilinçli tüketimle büyüyen bir bağış havuzuna erişin."
                icon={HandCoins}
                important
            />

            <ServiceHighlight 
                title="Demografi Analizi."
                subtitle="Topluluğunuzu tanıyın."
                description="Destekçileriniz kim? Nerede yaşıyorlar? Hangi alanlara ilgi duyuyorlar? Yapay zeka destekli analizlerle kitlenizi yaş, şehir ve ilgi alanı bazlı segmentlere ayırın, stratejinizi verilere dayandırın."
                icon={BarChart3}
                important
            />

            {/* Feature Grid Section */}
            <section className="py-32 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-20 space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Eksiksiz Yönetim.</h2>
                        <p className="text-xl md:text-2xl text-[#86868b] font-medium">Operasyonlarınız için her detayı düşündük.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureGridItem 
                            name="Web Sitesi Yönetimi" 
                            desc="SEO uyumlu, mobil öncelikli ve bağış modüllü profesyonel kurumsal web sitenizi hangel üzerinde dakikalar içinde kurun."
                            icon={Globe}
                        />
                        <FeatureGridItem 
                            name="Yetkili Yönetimi" 
                            desc="Ekip üyelerinize 'Finans', 'Gönüllü' veya 'Editör' gibi roller tanımlayın. Yetkiyi paylaştırın, güvenliği koruyun."
                            icon={UserCog}
                        />
                        <FeatureGridItem 
                            name="CRM Yönetimi" 
                            desc="Bağışçı ve gönüllü veri tabanınızı segmentlere ayırın, ilişkilerinizi profesyonel bir altyapıyla bir üst seviyeye taşıın."
                            icon={Database}
                        />
                        <FeatureGridItem 
                            name="Ön Muhasebe Yönetimi" 
                            desc="Gelir-gider tablolarınızı, aylık bağış dökümlerini ve yasal finansal raporlarınızı anlık olarak izleyin."
                            icon={Calculator}
                        />
                        <FeatureGridItem 
                            name="İktisadi İşletme Yönetimi" 
                            desc="Kendi ürünlerinizi satın, stokları takip edin ve pazar yeri entegrasyonlarıyla ek fon yaratın."
                            icon={ShoppingCart}
                        />
                        <FeatureGridItem 
                            name="Pos & Ödeme Sistemleri" 
                            desc="Online bağış toplamak için gereken tüm güvenli sanal POS altyapısını ve QR ödeme sistemini anında kullanmaya başlayın."
                            icon={CreditCard}
                        />
                        <FeatureGridItem 
                            name="STK Profil QR Kodu" 
                            desc="Fiziksel etkinliklerde, afişlerde ve materyallerde profilinize anında erişim sağlayan akıllı QR kodlar."
                            icon={QrCode}
                        />
                        <FeatureGridItem 
                            name="SMS & Mail Gönderimi" 
                            desc="Acil yardım çağrılarınızı ve periyodik bültenlerinizi tüm topluluğunuza tek tıkla, entegre servislerle ulaştırın."
                            icon={MessageSquare}
                        />
                        <FeatureGridItem 
                            name="DM Mesajlaşma Merkezi" 
                            desc="Tüm sosyal medya kanallarından gelen mesajları ve WhatsApp hattınızı tek bir merkezi panelden koordine edin."
                            icon={MessageCircle}
                        />
                        <FeatureGridItem 
                            name="Reklam & Pazarlama" 
                            desc="Platform içi reklam alanlarında öne çıkın ve Google Ads Grants desteğiyle global erişiminizi artırın."
                            icon={Megaphone}
                        />
                        <FeatureGridItem 
                            name="Etkinlik Yönetimi" 
                            desc="Fiziksel veya dijital organizasyonlarınızı planlayın, kayıtları toplayın ve katılımcı listelerini yönetin."
                            icon={Calendar}
                        />
                        <FeatureGridItem 
                            name="Saha Ekip Yönetimi" 
                            desc="Operasyonel ekiplerinizin anlık konum takibini yapın, görev atamaları ile saha gücünüzü koordine edin."
                            icon={MapPin}
                        />
                        <FeatureGridItem 
                            name="Sanal Santral" 
                            desc="Kurumsal bir 0850'li numara ile profesyonel bir çağrı merkezi altyapısına sahip olun."
                            icon={PhoneCall}
                        />
                        <FeatureGridItem 
                            name="Sanal ve Fiziki Ofis" 
                            desc="Belediye ve iş ortağı destekli paylaşımlı ofis alanlarına ve yasal adres hizmetine erişim sağlayın."
                            icon={Building2}
                        />
                        <FeatureGridItem 
                            name="Üniversite Gönüllülük Dersi" 
                            desc="Akademik kredi kapsamında üniversite öğrencilerinden oluşan profesyonel bir gönüllü gücüyle çalışın."
                            icon={GraduationCap}
                        />
                        <FeatureGridItem 
                            name="Online Eğitim & Toplantı" 
                            desc="Webinarlar ve kurumsal toplantılar için entegre video konferans araçlarını indirimli kullanın."
                            icon={Video}
                        />
                        <FeatureGridItem 
                            name="Tasarım Programları" 
                            desc="Görsel iletişim materyalleriniz için Canva Pro ve Adobe gibi araçlara kurumsal avantajlarla sahip olun."
                            icon={Palette}
                        />
                        <FeatureGridItem 
                            name="Pazarlama İletişimi" 
                            desc="Marka konumlandırması ve bağışçı kazanımı için stratejik iletişim danışmanlığına erişin."
                            icon={Target}
                        />
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="bg-black text-white py-32 px-6 text-center overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[150px] rounded-full" />
                <div className="z-10 relative max-w-4xl mx-auto space-y-10">
                    <h2 className="text-5xl md:text-8xl font-bold tracking-tight leading-tight">
                        İyiliğin geleceği <br />
                        sizin ellerinizde.
                    </h2>
                    <p className="text-xl md:text-2xl text-white/60 font-medium max-w-2xl mx-auto">
                        Hemen kurumsal başvurunuzu yapın, dijitalin gücüyle toplumsal etkinizi katlayarak büyütün.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button asChild size="lg" className="rounded-full px-12 h-16 bg-white text-black hover:bg-white/90 text-xl font-bold transition-transform hover:scale-105 active:scale-95">
                            <Link href="/login/selection?action=register&type=corporate">Hemen Başvur</Link>
                        </Button>
                        <Button asChild variant="link" className="text-white text-lg font-semibold group">
                            <Link href="/support">
                                Destek Ekibiyle Görüş <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                    <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale contrast-200">
                        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"><Lock className="h-4 w-4" /> Güvenli</div>
                        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"><ShieldCheck className="h-4 w-4" /> Onaylı</div>
                        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"><Zap className="h-4 w-4" /> Hızlı</div>
                        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"><Globe className="h-4 w-4" /> Global</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#f5f5f7] py-12 px-6 border-t border-[#d2d2d7]/50 text-center">
                <div className="container mx-auto max-w-6xl">
                    <p className="text-xs text-[#86868b] font-medium">
                        Copyright © 2026 Hangel Hub Inc. Tüm hakları saklıdır.
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="text-[10px] text-[#86868b] hover:underline">Gizlilik Politikası</Link>
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="text-[10px] text-[#86868b] hover:underline">Kullanım Şartları</Link>
                        <Link href="/bilgi-toplumu-hizmetleri" className="text-[10px] text-[#86868b] hover:underline">Bilgi Toplumu Hizmetleri</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
