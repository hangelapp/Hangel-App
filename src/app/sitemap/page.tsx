
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SitemapGroup = ({ title, links }: { title: string, links: { label: string, href: string }[] }) => (
    <div className="space-y-6">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f] border-b border-black/5 pb-2">{title}</h3>
        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            {links.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm md:text-base text-[#1d1d1f]/70 hover:text-primary transition-colors flex items-center group">
                    <span dangerouslySetInnerHTML={{ __html: link.label.replace(/ /g, '&nbsp;') }} />
                    <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
            ))}
        </nav>
    </div>
);

export default function SitemapPage() {
    const router = useRouter();

    const mainPages = [
        { label: "Zaman Tüneli (Ana Akış)", href: "/timeline" },
        { label: "Market (Alışverişle Bağış)", href: "/market" },
        { label: "Gönüllülük (İmece)", href: "/volunteering" },
        { label: "Etkinlikler", href: "/events" },
        { label: "Cüzdanım (QR Ödeme)", href: "/qr-payment" },
        { label: "Acil Durum Merkezi", href: "/emergency" },
        { label: "Liderlik Tablosu", href: "/leaderboard" },
        { label: "Etki Hikayeleri (Stories)", href: "/stories" },
        { label: "Kütüphane", href: "/library" },
        { label: "Hakkımızda", href: "/about" },
        { label: "İletişim", href: "/contact" },
    ];

    const allPagesSections = [
        {
            title: "1. Ana Gezinti ve Keşfet",
            links: [
                { label: "Anasayfa / Giriş", href: "/login" },
                { label: "Zaman Tüneli", href: "/timeline" },
                { label: "Market (Markalar)", href: "/market" },
                { label: "Gönüllülük (İlanlar)", href: "/volunteering" },
                { label: "Etkinlikler Takvimi", href: "/events" },
                { label: "Cüzdanım (Ödeme & Bakiye)", href: "/qr-payment" },
                { label: "Acil Durum Merkezi", href: "/emergency" },
                { label: "Liderlik Tablosu", href: "/leaderboard" },
                { label: "Etki Story (Hikayeler)", href: "/stories" },
                { label: "Kütüphane (Kaynaklar)", href: "/library" },
            ]
        },
        {
            title: "2. Kullanıcı Hesabı ve Ayarlar",
            links: [
                { label: "Profilim", href: "/profile" },
                { label: "Mesajlarım", href: "/messages" },
                { label: "Başvurularım", href: "/my-applications" },
                { label: "Yeni Başvuru Oluştur", href: "/my-applications/new" },
                { label: "Bağışlarım (Geçmiş)", href: "/my-donations" },
                { label: "Rozetler ve Sertifikalar", href: "/my-badges" },
                { label: "Arkadaş Davet Et", href: "/invite" },
                { label: "Ayarlar Paneli", href: "/settings" },
                { label: "  - Kişisel Bilgileri Düzenle", href: "/settings/profile" },
                { label: "  - Gönüllülük Bilgileri", href: "/settings/volunteer" },
                { label: "  - Cüzdan ve Ödeme", href: "/settings/wallet" },
                { label: "  - Güvenlik ve Şifre", href: "/settings/security" },
                { label: "  - Bildirim Tercihleri", href: "/settings/notifications" },
                { label: "  - Görünüm ve Tema", href: "/settings/theme" },
                { label: "  - Dil Ayarları", href: "/settings/language" },
                { label: "  - Erişilebilirlik", href: "/settings/accessibility" },
                { label: "  - Gizlilik ve Etkileşim", href: "/settings/privacy" },
                { label: "  - Bağış Yapılan STK Seçimi", href: "/settings/ngo-selection" },
                { label: "  - Gönüllüsü Olunan STK Seçimi", href: "/settings/volunteer-ngo-selection" },
            ]
        },
        {
            title: "3. Kurumsal ve Yasal",
            links: [
                { label: "Biz Kimiz? (Detaylı)", href: "/about" },
                { label: "Sosyal Girişimcilik Nedir?", href: "/social-entrepreneurship" },
                { label: "Sürdürülebilirlik ve Etki", href: "/social-impact" },
                { label: "Basın Odası & Medya Kiti", href: "/press" },
                { label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri" },
                { label: "Kariyer Fırsatları", href: "/careers" },
                { label: "Kamu İşbirliği Programları", href: "/corporate" },
                { label: "Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri" },
                { label: "Logo Kullanım Kılavuzu", href: "/logo-usage" },
                { label: "Erişilebilirlik Beyanı", href: "/accessibility" },
                { label: "Kalite ve Standartlarımız", href: "/standards" },
            ]
        },
        {
            title: "4. İşbirliği ve Kayıt",
            links: [
                { label: "Üye İşyeri Başvurusu", href: "/merchant" },
                { label: "STK Kayıt ve Onboarding", href: "/ngo-onboarding" },
                { label: "Kampüs Avantajları (Kulüpler)", href: "/campus-advantages" },
                { label: "Kurumsal İletişim", href: "/contact" },
                { label: "  - Belediyeler için hangel", href: "/contact/municipalities" },
                { label: "  - Üniversiteler için hangel", href: "/contact/universities" },
                { label: "  - Fonlar için hangel", href: "/contact/funds" },
            ]
        },
        {
            title: "5. hangel derneği (SBG)",
            links: [
                { label: "Dernek Ana Sayfası", href: "/hangelassociation" },
                { label: "Dernek Hakkında", href: "/hangelassociation/about" },
                { label: "Dernek Etkinlikleri", href: "/hangelassociation/events" },
                { label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop" },
                { label: "Mevzuat Taslağı Çalışmaları", href: "/hangelassociation/legislation" },
                { label: "Projelerimiz", href: "/hangelassociation/projects/etki-atlasi" },
                { label: "Komitelerimiz", href: "/hangelassociation/committees/akademik" },
                { label: "Şeffaflık Raporları", href: "/hangelassociation/reports/5-yillik-etki" },
                { label: "Dernek İletişim", href: "/hangelassociation/contact" },
                { label: "Dernek Geri Bildirim", href: "/hangelassociation/feedback" },
            ]
        },
        {
            title: "6. Yönetim Panelleri (Yetkili)",
            links: [
                { label: "Kulüp Yönetim Paneli", href: "/admin/clubs" },
                { label: "Kulüp Etkinlik Yönetimi", href: "/admin/events" },
                { label: "STK Yönetim Paneli (Dashboard)", href: "/ngo-admin/dashboard" },
                { label: "  - STK Profil Yönetimi", href: "/ngo-admin/manage-profile" },
                { label: "  - STK Web Sitesi Düzenleyici", href: "/ngo-admin/website" },
                { label: "  - Gönüllü Yönetim Paneli", href: "/ngo-admin/volunteer" },
                { label: "  - Bağış ve Finans Takibi", href: "/ngo-admin/donations" },
                { label: "  - Mini Blog (Gönderi) Yönetimi", href: "/ngo-admin/posts" },
                { label: "  - Muhasebe & ERP Entegrasyonu", href: "/ngo-admin/accounting" },
                { label: "  - CRM & Veri Yönetimi", href: "/ngo-admin/crm" },
                { label: "  - Reklam & Görünürlük", href: "/ngo-admin/ads" },
                { label: "Süper Admin (Platform Kontrol)", href: "/super-admin" },
            ]
        },
        {
            title: "7. Destek ve Yardım",
            links: [
                { label: "Yardım Merkezi (Genel)", href: "/support" },
                { label: "Uygulama Kullanım Desteği", href: "/support/app-support" },
                { label: "Geri Bildirim Formu", href: "/feedback" },
                { label: "Sözleşmeler ve Politikalar", href: "/settings/contracts" },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Site Haritası</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="container mx-auto px-4 pt-32 pb-32 max-w-4xl space-y-12">
                <div className="text-left space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">Navigasyon.</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium">Tüm platformun yapısını tek bir bakışta inceleyin.</p>
                </div>

                <Tabs defaultValue="main-pages" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="main-pages">Ana Sayfalar</TabsTrigger>
                        <TabsTrigger value="all-pages">Tüm Sayfalar (Detaylı)</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="main-pages" className="mt-8">
                        <SitemapGroup title="Temel Navigasyon" links={mainPages} />
                    </TabsContent>
                    
                    <TabsContent value="all-pages" className="mt-8">
                        <div className="grid grid-cols-1 gap-16">
                            {allPagesSections.map((section) => (
                                <SitemapGroup key={section.title} {...section} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <PublicFooter currentPageLabel="Site Haritası" />
        </div>
    );
}
