
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

    const sections = [
        {
            title: "Ana Sayfalar",
            links: [
                { label: "Zaman Tüneli (Ana Akış)", href: "/timeline" },
                { label: "Market (Alışverişle Bağış)", href: "/market" },
                { label: "Gönüllülük (İmece)", href: "/volunteering" },
                { label: "Cüzdanım (QR Ödeme)", href: "/qr-payment" },
                { label: "Acil Durum Merkezi", href: "/emergency" },
                { label: "Liderlik Tablosu", href: "/leaderboard" },
                { label: "Etki Hikayeleri (Stories)", href: "/stories" },
                { label: "Kütüphane", href: "/library" },
            ]
        },
        {
            title: "Hesabım",
            links: [
                { label: "Profilim", href: "/profile" },
                { label: "Ayarlar", href: "/settings" },
                { label: "  Kişisel Bilgiler", href: "/settings/profile" },
                { label: "  Gönüllülük Bilgileri", href: "/settings/volunteer" },
                { label: "  Cüzdan ve Ödeme", href: "/settings/wallet" },
                { label: "  Güvenlik ve Şifre", href: "/settings/security" },
                { label: "  Bildirimler", href: "/settings/notifications" },
                { label: "  Görünüm ve Tema", href: "/settings/theme" },
                { label: "  Dil", href: "/settings/language" },
                { label: "  Erişilebilirlik", href: "/settings/accessibility" },
                { label: "  Gizlilik", href: "/settings/privacy" },
                { label: "  Bağış STK Seçimi", href: "/settings/ngo-selection" },
                { label: "  Gönüllülük STK Seçimi", href: "/settings/volunteer-ngo-selection" },
                { label: "Mesajlarım", href: "/messages" },
                { label: "Başvurularım", href: "/my-applications" },
                { label: "  Yeni Başvuru", href: "/my-applications/new" },
                { label: "Bağışlarım", href: "/my-donations" },
                { label: "Rozetler & Sertifikalar", href: "/my-badges" },
                { label: "Arkadaş Davet Et", href: "/invite" },
            ]
        },
        {
            title: "Yönetim Panelleri",
            links: [
                { label: "Marka/Kulüp Yönetim Paneli", href: "/admin" },
                { label: "  Öğrenci Kulüpleri", href: "/admin/clubs" },
                { label: "  Kulüp Etkinlikleri", href: "/admin/events" },
                { label: "STK Yönetim Paneli", href: "/ngo-admin/dashboard" },
                { label: "  Profil & Site Yönetimi", href: "/ngo-admin/manage-profile" },
                { label: "  Web Sitesi Özelleştirme", href: "/ngo-admin/website" },
                { label: "  Gönüllülük Yönetimi", href: "/ngo-admin/volunteer" },
                { label: "  Bağış Takibi", href: "/ngo-admin/donations" },
                { label: "  Gönderi Yönetimi", href: "/ngo-admin/posts" },
                { label: "  Yetkili Yönetimi", href: "/ngo-admin/users" },
                { label: "  Raporlar", href: "/ngo-admin/reports" },
                { label: "  Entegrasyonlar", href: "/ngo-admin/accounting" },
                { label: "Süper Admin Paneli", href: "/super-admin" },
                { label: "  Başvuru Yönetimi", href: "/super-admin/applications" },
                { label: "  Kullanıcı Yönetimi", href: "/super-admin/users" },
                { label: "  STK Yönetimi", href: "/super-admin/ngos" },
                { label: "  Marka Yönetimi", href: "/super-admin/brands" },
                { label: "  Kulüp Yönetimi", href: "/super-admin/clubs" },
                { label: "  Analizler", href: "/super-admin/analytics" },
                { label: "  İletişim Merkezi", href: "/super-admin/communications" },
                { label: "  Kütüphane Yönetimi", href: "/super-admin/library" },
                { label: "  Yardım Merkezi", href: "/super-admin/help" },
            ]
        },
        {
            title: "hangel derneği",
            links: [
                { label: "Dernek Ana Sayfası", href: "/hangelassociation" },
                { label: "Dernek Hakkında", href: "/hangelassociation/about" },
                { label: "Dernek Etkinlikleri", href: "/hangelassociation/events" },
                { label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop" },
                { label: "Mevzuat Taslağı", href: "/hangelassociation/legislation" },
                { label: "Projeler", href: "/hangelassociation/projects/etki-atlasi" },
                { label: "Komiteler", href: "/hangelassociation/committees/akademik" },
                { label: "Raporlar", href: "/hangelassociation/reports/5-yillik-etki" },
                { label: "İletişim", href: "/hangelassociation/contact" },
                { label: "Geri Bildirim", href: "/hangelassociation/feedback" },
            ]
        },
        {
            title: "Kurumsal",
            links: [
                { label: "Biz Kimiz?", href: "/about" },
                { label: "Sosyal Girişimcilik", href: "/social-entrepreneurship" },
                { label: "Sürdürülebilirlik", href: "/social-impact" },
                { label: "Basın Odası", href: "/press" },
                { label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri" },
                { label: "Kariyer", href: "/careers" },
                { label: "Kamu İşbirlikleri", href: "/corporate" },
                { label: "Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri" },
            ]
        },
        {
            title: "İşbirlikleri",
            links: [
                { label: "Üye İşyeri Ol", href: "/merchant" },
                { label: "STK Kaydı", href: "/ngo-onboarding" },
                { label: "Kampüs Avantajları", href: "/campus-advantages" },
                { label: "İletişim", href: "/contact" },
                { label: "  Belediyeler", href: "/contact/municipalities" },
                { label: "  Üniversiteler", href: "/contact/universities" },
                { label: "  Uluslararası Fonlar", href: "/contact/funds" },
            ]
        },
        {
            title: "Destek ve Yasal",
            links: [
                { label: "Yardım Merkezi", href: "/support" },
                { label: "Geri Bildirim Gönder", href: "/feedback" },
                { label: "Erişilebilirlik Beyanı", href: "/accessibility" },
                { label: "Kalite ve Standartlar", href: "/standards" },
                { label: "Tüm Sözleşmeler ve Politikalar", href: "/settings/contracts" },
                { label: "Logo Kullanım Kılavuzu", href: "/logo-usage" },
            ]
        }
    ];

    const mainPagesSection = sections.find(s => s.title === "Ana Sayfalar");

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

                <Tabs defaultValue="all-pages" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="main-pages">Ana Sayfalar</TabsTrigger>
                        <TabsTrigger value="all-pages">Tüm Sayfalar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="main-pages" className="mt-8">
                        <div className="grid grid-cols-1 gap-16">
                            {mainPagesSection && <SitemapGroup {...mainPagesSection} />}
                        </div>
                    </TabsContent>
                    <TabsContent value="all-pages" className="mt-8">
                        <div className="grid grid-cols-1 gap-16">
                            {sections.map((section) => (
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
