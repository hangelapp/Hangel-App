'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Globe, Instagram, Linkedin, MessageSquare } from 'lucide-react';
import { HangelLogo } from '@/components/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const XIcon = (props: any) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

export function PublicFooter({ currentPageLabel }: { currentPageLabel?: string }) {
    const footerGroups = [
        { 
            title: "KEŞFEDİN", 
            links: [
                {label: "Market", href: "/market"}, 
                {label: "Gönüllülük", href: "/volunteering"}, 
                {label: "STK'lar", href: "/ngos"}, 
                {label: "Kulüpler", href: "/admin/clubs"}, 
                {label: "Kütüphane", href: "/library"}
            ] 
        },
        { 
            title: "KURUMSAL", 
            links: [
                {label: "Biz Kimiz?", href: "/about"}, 
                {label: "Sosyal Etkimiz", href: "/social-impact"}, 
                {label: "Basın Odası", href: "/press"}, 
                {label: "Yatırımcılar", href: "/yatirimci-iliskileri"}, 
                {label: "Kariyer", href: "/careers"}
            ] 
        },
        { 
            title: "İŞBİRLİKLERİ", 
            links: [
                {label: "Üye İşyeri ol", href: "/merchant"}, 
                {label: "STK Kaydı", href: "/ngo-onboarding"}, 
                {label: "Temsilci Ol", href: "/contact/universities"}, 
                {label: "Kulüp Kaydı", href: "/login/selection?action=register&type=corporate"}, 
                {label: "Kamu İşbirlikleri", href: "/corporate"}
            ] 
        },
        { 
            title: "HANGEL DERNEĞİ", 
            links: [
                {label: "Hakkında", href: "/hangelassociation/about"}, 
                {label: "Etkinlikler", href: "/hangelassociation/events"}, 
                {label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop"}, 
                {label: "Mevzuat Taslağı", href: "/hangelassociation/legislation"}
            ] 
        },
        { 
            title: "HESABIM", 
            links: [
                {label: "Giriş Yap", href: "/login/selection?action=login"}, 
                {label: "Kayıt Ol", href: "/login/selection?action=register"}, 
                {label: "Destek Merkezi", href: "/support"}, 
                {label: "Geri Bildirim", href: "/feedback"}
            ] 
        },
    ];

    const storeLinks = ["App Store", "Google Play", "Huawei Store", "Chrome Store", "Opera Store"];
    const socialLinks = [
        { name: "Instagram", icon: Instagram },
        { name: "Facebook", icon: null },
        { name: "X (Twitter)", icon: XIcon },
        { name: "LinkedIn", icon: Linkedin },
        { name: "YouTube", icon: null },
    ];
    const policyLinks = [
        { label: "Politikalar", href: "/settings/contracts" },
        { label: "Çerezlerin Kullanımı", href: "/settings/contracts/cerez-politikasi" },
        { label: "Sözleşmeler", href: "/settings/contracts" },
        { label: "Site Haritası", href: "/sitemap" },
        { label: "Logo Kullanım", href: "/logo-usage" },
        { label: "Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri" },
        { label: "Erişilebilirlik", href: "/accessibility" },
    ];


    return (
        <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
            <div className="container mx-auto max-w-6xl">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-10 px-1">
                    <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">
                        <HangelLogo className="text-base" />
                    </Link>
                    {currentPageLabel && (
                        <>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-[#1d1d1f]/80">{currentPageLabel}</span>
                        </>
                    )}
                </div>

                {/* Mobile Accordion Menu */}
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

                {/* Desktop Grid Menu */}
                <div className="hidden md:grid grid-cols-5 gap-8 border-b border-black/10 pb-12">
                    {footerGroups.map((group) => (
                        <div key={group.title} className="space-y-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/80">{group.title}</h4>
                            <div className="flex flex-col gap-2.5">
                                {group.links.map(link => (
                                    <Link key={link.label} href={link.href} className="text-[12px] text-[#1d1d1f]/70 hover:text-primary transition-colors">{link.label}</Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="pt-10 space-y-6">
                    <p className="text-[12px] text-[#1d1d1f]/70">Diğer alışveriş seçenekleri: Yakınınızda bir <a href="#" className="text-primary font-bold hover:underline">hangel destek</a> bulun veya 0554 700 70 07 numaralı telefonu arayın.</p>
                     <div className="h-px bg-black/10 w-full" />
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#1d1d1f]/50 font-medium tracking-tight">
                        {policyLinks.map((link, index) => (
                            <React.Fragment key={link.label}>
                                <Link href={link.href} className="hover:underline">{link.label}</Link>
                                {index < policyLinks.length - 1 && <span className="text-black/10">|</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-black/10">
                        <div className="text-[11px] text-[#1d1d1f]/50">
                            Telif Hakkı © {new Date().getFullYear()} hangel A.Ş. Tüm hakları saklıdır.
                        </div>
                        <div className="text-[11px] font-bold text-[#1d1d1f]/70 flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            Türkiye
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
