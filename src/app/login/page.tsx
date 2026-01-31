'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight, Sparkles, HeartHandshake, HandCoins, Award, ArrowRight, Bot, 
  Search, ShieldCheck, Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Facebook, MessageSquare, Heart, Users, Camera
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { allEntityLists, marketCategories, categoryMapping } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
];

export default function LoginPage() {
  const [language, setLanguage] = useState('tr');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [activeEntityType, setActiveEntityType] = useState('all');

  const filteredBrands = allEntityLists.filter(brand => {
    const matchesType = activeEntityType === 'all' || brand.type === activeEntityType;
    const brandCats = categoryMapping[activeCategory as keyof typeof categoryMapping] || [];
    const matchesCategory = activeCategory === 'Tümü' || activeCategory === 'Öne çıkanlar' || brandCats.includes(brand.category);
    return matchesType && matchesCategory;
  }).slice(0, 16);

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff] text-[#1d1d1f] font-sans antialiased overflow-x-hidden">
      {/* Apple Style Global Header */}
      <header className="sticky top-0 z-50 w-full h-12 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50">
        <div className="container mx-auto h-full max-w-5xl px-6 flex items-center justify-between">
          <HangelLogo className="text-xl tracking-tight opacity-90" />
          <div className="flex items-center gap-6">
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-auto py-1 text-[12px] font-normal text-[#1d1d1f] hover:text-primary transition-colors focus:ring-0">
                    <Globe className="h-3.5 w-3.5" />
                    <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                    {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="ghost" className="text-[12px] h-auto p-0 font-normal hover:bg-transparent hover:text-primary transition-colors" asChild>
                <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-6 text-center bg-gradient-to-b from-white to-[#f5f5f7]">
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] leading-[1.1]">
                    İyiliğin ve Sosyal Etkinin <br /> <span className="text-primary">Yeni Nesil Hali.</span>
                </h1>
                <p className="text-xl md:text-2xl font-medium text-[#86868b] max-w-2xl mx-auto leading-relaxed">
                    Umudu büyütüyor, toplumsal sorunlar için birlikte çalışıyoruz.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild className="h-14 px-10 text-lg font-semibold rounded-full shadow-2xl hover:shadow-primary/30 transition-all scale-105 active:scale-95">
                        <Link href="/login/selection?action=register">Hemen Başla</Link>
                    </Button>
                    <Button variant="link" className="text-lg font-medium text-[#0066cc] flex items-center group">
                        Nasıl Çalışır? <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="py-24 px-6 bg-[#f5f5f7]">
            <div className="container mx-auto max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* hangel imece Card */}
                    <Card className="group relative overflow-hidden border-none shadow-none bg-white rounded-3xl h-[500px] transition-all hover:scale-[1.01]">
                        <CardContent className="p-10 flex flex-col h-full justify-between">
                            <div className="space-y-4 relative z-10">
                                <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none font-bold px-3 py-1">hangel imece</Badge>
                                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Yetkinliklerin <br />Toplumsal Faydaya Dönüşsün.</h3>
                                <p className="text-[#86868b] text-lg max-w-xs">Gönüllü ol, imece ruhuyla toplumsal sorunlara birlikte çözüm üret.</p>
                            </div>
                            <div className="relative h-48 w-full mt-auto">
                                <HeartHandshake className="absolute -bottom-10 -right-10 h-64 w-64 text-orange-500/10 transition-transform group-hover:scale-110 duration-700" />
                                <Image src="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop" alt="Volunteer" fill className="object-cover rounded-2xl shadow-xl" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* hangel bağışı Card */}
                    <Card className="group relative overflow-hidden border-none shadow-none bg-[#1d1d1f] text-white rounded-3xl h-[500px] transition-all hover:scale-[1.01]">
                        <CardContent className="p-10 flex flex-col h-full">
                            <div className="space-y-4 relative z-10">
                                <Badge className="bg-primary/20 text-primary border-none font-bold px-3 py-1">hangel bağışı</Badge>
                                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Alışverişin <br />İyiliğe Dönüşsün.</h3>
                                <p className="text-[#86868b] text-lg max-w-xs">Ek bir ödeme yapmadan, seçtiğiniz STK'ya %15'e varan oranlarda bağış yap.</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center pt-10">
                                <div className="relative">
                                    <HandCoins className="h-40 w-40 text-primary animate-pulse" />
                                    <Heart className="absolute -top-4 -right-4 h-12 w-12 text-red-500" />
                                </div>
                            </div>
                            <Button variant="link" className="text-white mt-auto justify-start p-0 group">
                                Bağış Sistemini Keşfet <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Brand Marketplace Section - Mini Pazaryeri */}
        <section className="py-24 px-6 bg-primary">
            <div className="container mx-auto max-w-5xl space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                        Sevdiğiniz Markalarla <br />Sessizce İyilik Yapın.
                    </h2>
                    <p className="text-white/80 text-xl md:text-2xl max-w-2xl mx-auto">
                        Anlaşmalı markalardan yaptığınız her harcamanın bir kısmı, seçtiğiniz STK'ya bağış olarak aktarılır.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-[40px] p-4 sm:p-10 border border-white/20 shadow-2xl">
                    <Tabs defaultValue="all" className="w-full space-y-8" onValueChange={setActiveEntityType}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
                            <TabsList className="bg-white/10 border-white/20 text-white">
                                <TabsTrigger value="all">Tümü</TabsTrigger>
                                <TabsTrigger value="cooperative">Kooperatif</TabsTrigger>
                                <TabsTrigger value="economic">İktisadi İşl.</TabsTrigger>
                                <TabsTrigger value="brand">Marka</TabsTrigger>
                                <TabsTrigger value="social">Sosyal İşl.</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                                {marketCategories.slice(0, 8).map((cat) => (
                                    <Button 
                                        key={cat.mainCategory}
                                        variant={activeCategory === cat.mainCategory ? "secondary" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "rounded-full text-xs font-bold whitespace-nowrap",
                                            activeCategory === cat.mainCategory ? "bg-white text-primary" : "text-white hover:bg-white/10"
                                        )}
                                        onClick={() => setActiveCategory(cat.mainCategory)}
                                    >
                                        {cat.mainCategory}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                            {filteredBrands.length > 0 ? filteredBrands.map((brand) => (
                                <Link href={`/market/${brand.id}`} key={brand.id} className="group flex flex-col items-center gap-3 transition-transform hover:scale-110">
                                    <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center p-4 shadow-lg ring-4 ring-white/10 group-hover:ring-white/30 transition-all">
                                        <Image src={brand.logoUrl} alt={brand.name} width={64} height={64} className="object-contain" />
                                        {brand.donationRate > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                %{brand.donationRate}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-white text-[10px] font-bold tracking-wide opacity-80 group-hover:opacity-100 text-center uppercase">{brand.name}</span>
                                </Link>
                            )) : (
                                <p className="col-span-full text-center text-white/60 py-12">Bu kriterlerde marka bulunamadı.</p>
                            )}
                        </div>
                    </Tabs>
                    
                    <div className="mt-16 text-center">
                        <Button variant="secondary" className="rounded-full px-10 h-14 text-lg font-bold bg-white text-primary hover:bg-white/90 shadow-xl transition-all" asChild>
                            <Link href="/market">Tüm Markaları Keşfet ({allEntityLists.length})</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 bg-white text-center">
            <div className="max-w-3xl mx-auto space-y-10">
                <Sparkles className="h-16 w-16 text-primary mx-auto animate-bounce" />
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Değişimi Başlatmaya <br />Hazır Mısın?</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button size="lg" asChild className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl hover:shadow-primary/20 transition-all">
                        <Link href="/login/selection?action=register">Hemen Üye Ol</Link>
                    </Button>
                </div>
                <p className="text-[#86868b] text-sm">Ücretsiz kayıt olun, sosyal etkinizi bugün ölçmeye başlayın.</p>
            </div>
        </section>
      </main>

      {/* Apple Style Footer */}
      <footer className="bg-[#f5f5f7] py-12 px-6 border-t border-[#d2d2d7] text-[#1d1d1f]">
        <div className="container mx-auto h-full max-w-5xl space-y-8">
            <nav className="flex items-center gap-2 text-[12px] text-[#6e6e73] font-normal">
                <Link href="/" className="hover:text-[#1d1d1f] transition-colors"><HangelLogo className="text-lg opacity-70" /></Link>
                <ChevronRight className="h-3 w-3 opacity-50" />
                <span>Giriş Yap</span>
            </nav>

            <div className="block lg:hidden">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="apps" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Hangel Uygulamaları</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="#" className="hover:underline">iOS Uygulaması</Link>
                            <Link href="#" className="hover:underline">Android Uygulaması</Link>
                            <Link href="#" className="hover:underline">AppGallery</Link>
                            <Link href="#" className="hover:underline">Chrome Mağazası</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="account" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Hesap ve Cüzdan</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/profile" className="hover:underline">Hangel Hesabım</Link>
                            <Link href="/qr-payment" className="hover:underline">Cüzdanım</Link>
                            <Link href="/my-donations" className="hover:underline">Bağışlarım</Link>
                            <Link href="/my-applications" className="hover:underline">Başvurularım</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="support" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Destek ve Yardım</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/support" className="hover:underline">Destek Merkezi</Link>
                            <Link href="/support/faq" className="hover:underline">Sıkça Sorulan Sorular</Link>
                            <Link href="/support/guides" className="hover:underline">Rehberler</Link>
                            <Link href="/support/contact" className="hover:underline">Bize Ulaşın</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="corporate" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Kurumsal</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/about" className="hover:underline">Hakkımızda</Link>
                            <Link href="/corporate" className="hover:underline">Kamu İlişkileri</Link>
                            <Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link>
                            <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="hidden lg:grid grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Hangel Uygulamaları</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="#" className="hover:underline">iOS Uygulaması</Link></li>
                        <li><Link href="#" className="hover:underline">Android Uygulaması</Link></li>
                        <li><Link href="#" className="hover:underline">AppGallery</Link></li>
                        <li><Link href="#" className="hover:underline">Chrome Mağazası</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Hesap ve Cüzdan</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/profile" className="hover:underline">Hangel Hesabım</Link></li>
                        <li><Link href="/qr-payment" className="hover:underline">Cüzdanım</Link></li>
                        <li><Link href="/my-donations" className="hover:underline">Bağışlarım</Link></li>
                        <li><Link href="/my-applications" className="hover:underline">Başvurularım</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Destek ve Yardım</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/support" className="hover:underline">Destek Merkezi</Link></li>
                        <li><Link href="/support/faq" className="hover:underline">Sıkça Sorulan Sorular</Link></li>
                        <li><Link href="/support/guides" className="hover:underline">Rehberler</Link></li>
                        <li><Link href="/support/contact" className="hover:underline">Bize Ulaşın</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Kurumsal</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/about" className="hover:underline">Hakkımızda</Link></li>
                        <li><Link href="/corporate" className="hover:underline">Kamu İlişkileri</Link></li>
                        <li><Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link></li>
                        <li><Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link></li>
                    </ul>
                </div>
            </div>

            <div className="text-[12px] text-[#6e6e73] space-y-4 pt-4 border-t border-[#d2d2d7]">
                <p className="leading-relaxed">
                    Başka bir sorunuz mu var? <Link href="/support" className="text-[#0066cc] hover:underline">Destek Merkezi'ni</Link> ziyaret edin veya <span className="whitespace-nowrap font-medium text-[#1d1d1f]">+90 554 700 70 07</span> numaralı telefonu arayın.
                </p>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="order-2 lg:order-1 flex flex-col lg:flex-row gap-4">
                        <span className="font-normal">© 2026 hangel.org. Tüm hakları saklıdır.</span>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                            <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                            <span className="text-[#d2d2d7]">|</span>
                            <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerez Politikası</Link>
                            <span className="text-[#d2d2d7]">|</span>
                            <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                            <span className="text-[#d2d2d7]">|</span>
                            <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 font-semibold text-[#1d1d1f] hover:underline cursor-pointer transition-colors">
                        Türkiye
                    </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}