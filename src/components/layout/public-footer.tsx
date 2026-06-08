'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Globe } from 'lucide-react';
import { HangelLogo } from '@/components/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
export function PublicFooter({ currentPageLabel }: { currentPageLabel?: string }) {
    const footerGroups = [
        { 
            title: "Keşfet", 
            links: [
                {label: "Market", href: "/market"}, 
                {label: "Gönüllülük", href: "/volunteering"}, 
                {label: "Zaman Tüneli", href: "/timeline"},
            ] 
        },
        { 
            title: "Kurumsal", 
            links: [
                {label: "Biz Kimiz?", href: "/about"}, 
                {label: "Sürdürülebilirlik", href: "/social-impact"}, 
                {label: "Basın Odası", href: "/press"}, 
                {label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri"}, 
                {label: "Kariyer", href: "/careers"},
            ] 
        },
        { 
            title: "İşbirlikleri", 
            links: [
                {label: "Üye İşyeri Ol", href: "/merchant"}, 
                {label: "STK Kaydı", href: "/ngo-onboarding"}, 
                {label: "Kulüp Kaydı", href: "/campus-advantages"},
                {label: "Kamu İşbirlikleri", href: "/corporate"}
            ] 
        },
        { 
            title: "hangel derneği", 
            links: [
                {label: "Dernek Ana Sayfa", href: "/hangelassociation"}, 
                {label: "Dernek Hakkında", href: "/hangelassociation/about"}, 
                {label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop"}, 
                {label: "Mevzuat Taslağı", href: "/hangelassociation/legislation"}
            ] 
        },
        { 
            title: "Hesabım ve Destek", 
            links: [
                {label: "Geniş Yap", href: "/login/selection?action=login"}, 
                {label: "Kayıt Ol", href: "/login/selection?action=register"}, 
                {label: "Destek Merkezi", href: "/support"}, 
                {label: "Geri Bildirim", href: "/feedback"}
            ] 
        },
    ];

    // 8 platform — landing'deki StoreBadges ile birebir aynı sıra/durumlar.
    // status: live (etiket yok) | beta | yakında | PWA
    const appStoreLinks: Array<{ label: string; href: string; status?: 'beta' | 'yakında' | 'PWA' }> = [
        { label: "App Store",       href: "https://apps.apple.com/tr/app/hangel/id6664058822" },              // iOS — canlı
        { label: "Google Play",     href: "https://play.google.com/store/apps/details?id=com.hangel.app" },   // canlı
        { label: "AppGallery",      href: "https://appgallery.huawei.com/app/C113000000", status: 'yakında' }, // Huawei
        { label: "Apple Watch",     href: "https://apps.apple.com/tr/app/hangel/id6664058822" },              // canlı (iOS app ile)
        { label: "Mac App",         href: "https://apps.apple.com/tr/app/hangel/id6664058822" },              // canlı (Apple Silicon)
        { label: "Apple Vision",    href: "https://apps.apple.com/tr/app/hangel/id6664058822" },              // canlı (Vision Pro, iPad uyumlu)
        { label: "Microsoft Store", href: "https://hangel.org.tr/", status: 'PWA' },                          // Web zaten PWA
        { label: "Chrome Uzantısı", href: "https://hangel.org.tr/", status: 'yakında' },                       // Chrome Web Store pending
    ];
    
    const socialLinks = [
        { label: 'Facebook', href: 'https://facebook.com/hangelorg' },
        { label: 'Instagram', href: 'https://instagram.com/hangelorg' },
        { label: 'X.com', href: 'https://x.com/hangelorg' },
        { label: 'YouTube', href: 'https://youtube.com/@hangelorg' },
        { label: 'LinkedIn', href: 'https://linkedin.com/company/hangelorg' },
        { label: 'TikTok', href: 'https://tiktok.com/@hangelorg' },
        { label: 'Next Sosyal', href: 'https://nextsosyal.com/@hangelorg' },
    ];

    const policyLinks = [
        { label: "Sözleşmeler", href: "/settings/contracts" },
        { label: "Politikalar", href: "/settings/contracts" },
        { label: "Site Haritası", href: "/sitemap" },
        { label: "Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri" },
        { label: "Erişilebilirlik", href: "/accessibility" },
        { label: "Standartlar", href: "/standards" },
        { label: "Logo Kullanımı", href: "/logo-usage" }
    ];

    return (
        <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
            <div className="container mx-auto max-w-6xl">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-10 px-1">
                    <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">
                        <HangelLogo className="text-base" href={null} />
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
                
                <div className="pt-6 space-y-3">
                    <div className="flex justify-start items-center flex-wrap gap-x-2 gap-y-1 text-[12px] text-[#1d1d1f]/70 font-normal">
                        {appStoreLinks.map((link, index) => (
                            <React.Fragment key={link.label}>
                                <Link href={link.href} target="_blank" rel="noopener noreferrer" className="text-[#1d1d1f]/70 hover:text-primary transition-colors">
                                    {link.label}
                                    {link.status && (
                                        <span className={[
                                            'ml-1 text-[9px] uppercase tracking-wider align-middle',
                                            link.status === 'beta' ? 'text-amber-600' : link.status === 'PWA' ? 'text-emerald-600' : 'text-black/40',
                                        ].join(' ')}>{link.status}</span>
                                    )}
                                </Link>
                                {index < appStoreLinks.length - 1 && <span className="text-black/20 mx-0.5">|</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="h-px bg-black/10 w-full" />
                    <div className="flex justify-start items-center flex-wrap gap-x-1 gap-y-1 text-[12px] text-[#1d1d1f]/70 font-normal">
                        {socialLinks.map((link, index) => (
                            <React.Fragment key={link.label}>
                                <a href={link.href} className="text-[#1d1d1f]/70 hover:text-primary transition-colors">{link.label}</a>
                                {index < socialLinks.length - 1 && <span className="text-black/20 mx-0.5">|</span>}
                            </React.Fragment>
                        ))}
                    </div>
                     <div className="h-px bg-black/10 w-full" />
                    <p className="text-[12px] text-[#1d1d1f]/70 pt-2">Diğer alışveriş seçenekleri: Yakınınızda bir <a href="#" className="text-primary font-bold hover:underline">hangel destek</a> bulun veya 0554 700 70 07 numaralı telefonu arayın.</p>
                     
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                         <div className="flex flex-wrap gap-x-1 gap-y-1 text-[11px] text-[#1d1d1f]/50 font-medium tracking-tight">
                            {policyLinks.map((link, index) => (
                                <React.Fragment key={link.label}>
                                    <Link href={link.href} className="hover:underline">{link.label}</Link>
                                    {index < policyLinks.length - 1 && <span className="text-black/10 mx-0.5">|</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="text-[11px] font-bold text-[#1d1d1f]/70 flex items-center gap-2 self-start md:self-center">
                            <Globe className="h-3 w-3" />
                            Türkiye
                        </div>
                    </div>
                     <div className="text-left text-[11px] text-[#1d1d1f]/50 pt-4 space-y-1">
                        <p>© 2024 hangel teknoloji ve sosyal etki anonim şirketi. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
