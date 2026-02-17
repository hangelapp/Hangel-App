
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
                    {link.label} <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
            ))}
        </nav>
    </div>
);

export default function SitemapPage() {
    const router = useRouter();

    const sections = [
        {
            title: "Ana Bölümler",
            links: [
                { label: "Market / Alışveriş", href: "/market" },
                { label: "Gönüllülük İlanları", href: "/volunteering" },
                { label: "Zaman Tüneli", href: "/timeline" },
                { label: "Cüzdanım", href: "/qr-payment" },
                { label: "Profilim", href: "/profile" },
                { label: "Liderlik Tablosu", href: "/leaderboard" },
                { label: "Kütüphane", href: "/library" },
                { label: "Acil Durum Merkezi", href: "/emergency" }
            ]
        },
        {
            title: "hangel derneği",
            links: [
                { label: "Dernek Ana Sayfası", href: "/hangelassociation" },
                { label: "Dernek Hakkında", href: "/hangelassociation/about" },
                { label: "Dernek Etkinlikleri", href: "/hangelassociation/events" },
                { label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop" },
                { label: "Mevzuat Taslağı", href: "/hangelassociation/legislation" }
            ]
        },
        {
            title: "Kurumsal",
            links: [
                { label: "Biz Kimiz?", href: "/about" },
                { label: "Sürdürülebilirlik", href: "/social-impact" },
                { label: "Basın Odası", href: "/press" },
                { label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri" },
                { label: "Kariyer", href: "/careers" },
                { label: "Kamu İşbirlikleri", href: "/corporate" },
                { label: "Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri" }
            ]
        },
        {
            title: "İşbirlikleri",
            links: [
                { label: "Üye İşyeri ol", href: "/merchant" },
                { label: "STK Kayıt ve Başvuru", href: "/ngo-onboarding" },
                { label: "Kampüs Temsilciliği", href: "/contact/universities" },
                { label: "Kulüp Avantajları", href: "/campus-advantages" },
                { label: "Bağış ve Yardım Politikası", href: "/settings/contracts/bagis-ve-yardim-politikasi" }
            ]
        },
        {
            title: "Destek ve Yasal",
            links: [
                { label: "Yardım Merkezi", href: "/support" },
                { label: "Geri Bildirim Gönder", href: "/feedback" },
                { label: "Erişilebilirlik Beyanı", href: "/accessibility" },
                { label: "Gizlilik Politikası", href: "/settings/contracts/gizlilik-politikasi" },
                { label: "Kullanıcı Sözleşmesi", href: "/settings/contracts/kullanici-sozlesmesi" },
                { label: "Çerez Politikası", href: "/settings/contracts/cerez-politikasi" },
                { label: "KVKK Aydınlatma Metni", href: "/settings/contracts/kvkk-aydinlatma-metni" }
            ]
        }
    ];

    const mainPagesSection = sections.find(s => s.title === "Ana Bölümler");

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
