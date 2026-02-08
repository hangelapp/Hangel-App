'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';
import { HangelLogo } from '@/components/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function PublicFooter({ currentPageLabel }: { currentPageLabel?: string }) {
    const footerGroups = [
        { title: "KEŞFEDİN", links: [{label: "Market", href: "/market"}, {label: "Gönüllülük", href: "/volunteering"}, {label: "STK'lar", href: "/ngos"}, {label: "Kulüpler", href: "/admin/clubs"}, {label: "Kütüphane", href: "/library"}] },
        { title: "KURUMSAL", links: [{label: "Biz Kimiz?", href: "/about"}, {label: "Sosyal Etkimiz", href: "/social-impact"}, {label: "Basın Odası", href: "/press"}, {label: "Yatırımcılar", href: "/yatirimci-iliskileri"}, {label: "Kariyer", href: "/careers"}] },
        { title: "İŞBİRLİKLERİ", links: [{label: "Üye İşyeri ol", href: "/merchant"}, {label: "STK Kaydı", href: "/ngo-onboarding"}, {label: "Temsilci Ol", href: "/contact/universities"}, {label: "Kulüp Kaydı", href: "/login/selection?action=register&type=corporate"}, {label: "Kamu İşbirlikleri", href: "/corporate"}] },
        { title: "HANGEL DERNEĞİ", links: [{label: "Dernek Ana Sayfa", href: "/hangelassociation"}, {label: "Dernek Hakkında", href: "/hangelassociation/about"}, {label: "Dernek Etkinlikleri", href: "/hangelassociation/events"}, {label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop"}, {label: "Mevzuat Taslağı", href: "/hangelassociation/legislation"}] },
        { title: "HESABIM", links: [{label: "Giriş Yap", href: "/login/selection?action=login"}, {label: "Kayıt Ol", href: "/login/selection?action=register"}, {label: "Destek Merkezi", href: "/support"}, {label: "Geri Bildirim", href: "/feedback"}] },
    ];

    return (
        <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
            <div className="container mx-auto max-w-5xl">
                <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-6 px-1">
                    <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">
                        <HangelLogo className="text-base scale-90 grayscale opacity-70" />
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">Anasayfa</Link>
                    {currentPageLabel && (
                        <>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-[#1d1d1f]/80">{currentPageLabel}</span>
                        </>
                    )}
                </div>

                <div className="md:hidden">
                    <Accordion type="single" collapsible className="w-full">
                        {footerGroups.map((group) => (
                            <AccordionItem key={group.title} value={group.title} className="border-b border-black/10">
                                <AccordionTrigger className="text-[12px] font-bold py-3 hover:no-underline uppercase tracking-tight text-[#1d1d1f]/80">
                                    {group.title}
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-2.5 pb-4 pt-1">
                                    {group.links.map(link => (
                                        <Link key={link.label} href={link.href} className="text-[12px] text-[#1d1d1f]/70 hover:underline">{link.label}</Link>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="hidden md:grid grid-cols-5 gap-8 border-b border-black/10 pb-8">
                    {footerGroups.map((group) => (
                        <div key={group.title} className="space-y-3">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]/80">{group.title}</h4>
                            <div className="flex flex-col gap-2">
                                {group.links.map(link => (
                                    <Link key={link.label} href={link.href} className="text-[12px] text-[#1d1d1f]/70 hover:underline">{link.label}</Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 space-y-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/70 font-medium tracking-tight">
                        <Link href="#" className="hover:underline">App Store</Link>
                        <Link href="#" className="hover:underline">Google Play</Link>
                        <Link href="#" className="hover:underline">Huawei Store</Link>
                        <Link href="#" className="hover:underline">Chrome Store</Link>
                        <Link href="#" className="hover:underline">Opera Store</Link>
                    </div>
                    
                    <div className="h-px bg-black/10 w-full" />

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/70 font-medium tracking-tight">
                        <Link href="#" className="hover:underline">Instagram</Link>
                        <Link href="#" className="hover:underline">Facebook</Link>
                        <Link href="#" className="hover:underline">X (Twitter)</Link>
                        <Link href="#" className="hover:underline">LinkedIn</Link>
                        <Link href="#" className="hover:underline">YouTube</Link>
                    </div>

                    <div className="h-px bg-black/10 w-full" />

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#1d1d1f]/50 font-medium tracking-tight">
                        <Link href="/settings/contracts" className="hover:underline">Politikalar</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerezlerin Kullanımı</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/settings/contracts" className="hover:underline">Sözleşmeler</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/sitemap" className="hover:underline">Site Haritası</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/accessibility" className="hover:underline">Erişilebilirlik</Link>
                    </div>

                    <div className="h-px bg-black/10 w-full" />

                    <p className="text-[12px] text-[#1d1d1f]/50 leading-relaxed">
                        Diğer alışveriş seçenekleri: Yakınınızda bir <Link href="/market" className="text-primary hover:underline font-medium">hangel destek</Link> bulun veya <span className="whitespace-nowrap">0554 700 70 07</span> numaralı telefonu arayın.
                    </p>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-black/10 pt-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/50">
                            <span className="whitespace-nowrap">Telif Hakkı © 2024 hangel A.Ş. Tüm hakları saklıdır.</span>
                        </div>
                        <div className="text-[12px] font-medium text-[#1d1d1f]/70 hover:text-[#1d1d1f] cursor-pointer transition-colors shrink-0">
                            Türkiye
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
