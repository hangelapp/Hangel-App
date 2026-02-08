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
            title: "KİM İÇİN", 
            links: [
                {label: "Sivil Toplum Kuruluşları", href: "/hangelassociation/for/stk"}, 
                {label: "Sosyal Girişimciler", href: "/hangelassociation/for/sosyal-girisimciler"}, 
                {label: "Gençler", href: "/hangelassociation/for/gencler"}, 
                {label: "Markalar", href: "/hangelassociation/for/markalar"}, 
                {label: "Akademisyenler", href: "/hangelassociation/for/akademisyenler"}, 
                {label: "Hukukçular", href: "/hangelassociation/for/hukukcular"}, 
                {label: "İK Uzmanları", href: "/hangelassociation/for/ik-uzmanlari"}
            ] 
        },
        { 
            title: "RAPORLAR", 
            links: [
                {label: "5 Yıllık Sosyal Fayda Raporu", href: "/hangelassociation/reports/5-yillik-etki"}, 
                {label: "Etkinlik Raporumuz", href: "/hangelassociation/reports/etkinlikler"}, 
                {label: "Afetler Öncesi ve Sonrası Müdaheleler", href: "/hangelassociation/reports/afet-mudahale"}
            ] 
        },
        { 
            title: "PROJELER", 
            links: [
                {label: "Sosyal Girişimcilik Kanun Teklifi", href: "/hangelassociation/legislation"}, 
                {label: "Girişimcilik Kütüphanesi", href: "/hangelassociation/workshop"}, 
                {label: "Etki Odaklı İstihdam Protokolü", href: "/hangelassociation/projects/istihdam-protokolu"}, 
                {label: "Sosyal Etki Atlası", href: "/hangelassociation/projects/etki-atlasi"}, 
                {label: "Sivil Toplumda Gelir Modeli Oluşturma", href: "/hangelassociation/projects/gelir-modeli"}
            ] 
        },
        { 
            title: "KOMİTELER", 
            links: [
                {label: "Etki Mevzuatı ve Politika Komisyonu", href: "/hangelassociation/committees/mevzuat"}, 
                {label: "Sosyal İnovasyon Akademik Bilim Kurulu", href: "/hangelassociation/committees/akademik"}, 
                {label: "Etki Odaklı İnsan ve Kültür Komitesi", href: "/hangelassociation/committees/insan-kultur"}, 
                {label: "hangel Sosyal İnovasyon Komitesi", href: "/hangelassociation/committees/inovasyon"}
            ] 
        },
        { 
            title: "KURUMSAL", 
            links: [
                {label: "Anasayfa", href: "/hangelassociation"}, 
                {label: "Dernek Hakkında", href: "/hangelassociation/about"}, 
                {label: "İletişim", href: "/hangelassociation/contact"}, 
                {label: "Geri Bildirim", href: "/hangelassociation/feedback"}
            ] 
        },
    ];

    return (
        <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
            <div className="container mx-auto max-w-5xl">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-10 px-1">
                    <Link href="/hangelassociation" className="hover:text-[#1d1d1f] transition-colors">
                        <HangelLogo className="text-base scale-90 grayscale opacity-70" />
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/hangelassociation" className="hover:text-[#1d1d1f] transition-colors">Dernek</Link>
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

                {/* Social and Contact Links */}
                <div className="pt-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <a href="#" className="p-2 bg-white rounded-lg shadow-sm hover:scale-110 transition-transform"><Instagram className="h-4 w-4 text-[#1d1d1f]/70" /></a>
                            <a href="#" className="p-2 bg-white rounded-lg shadow-sm hover:scale-110 transition-transform"><XIcon className="h-4 w-4 text-[#1d1d1f]/70" /></a>
                            <a href="#" className="p-2 bg-white rounded-lg shadow-sm hover:scale-110 transition-transform"><Linkedin className="h-4 w-4 text-[#1d1d1f]/70" /></a>
                            <a href="#" className="p-2 bg-white rounded-lg shadow-sm hover:scale-110 transition-transform"><MessageSquare className="h-4 w-4 text-[#1d1d1f]/70" /></a>
                        </div>
                        <div className="text-[12px] font-bold text-[#1d1d1f]/80">
                            <span className="text-muted-foreground mr-2 font-medium uppercase tracking-widest">İletişim:</span>
                            <a href="mailto:info@socialbusinessglobal.org" className="hover:text-primary transition-colors">info@socialbusinessglobal.org</a>
                        </div>
                    </div>
                    
                    <div className="h-px bg-black/10 w-full" />

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#1d1d1f]/50 font-medium tracking-tight">
                        <Link href="/settings/contracts" className="hover:underline">Gizlilik Politikası</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/settings/contracts" className="hover:underline">Kullanım Koşulları</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/sitemap" className="hover:underline">Site Haritası</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        <span className="text-black/10">|</span>
                        <Link href="/accessibility" className="hover:underline">Erişilebilirlik</Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-black/10">
                        <div className="text-[11px] text-[#1d1d1f]/50">
                            <span className="whitespace-nowrap">2025 © | Social Business Global | fosil.io</span>
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
