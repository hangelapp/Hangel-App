'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mail, Phone, Globe, HeartHandshake, Instagram, Facebook, Linkedin,
  CreditCard, Landmark, MessageSquare, ArrowRight, CheckCircle, ChevronRight,
  Menu, MapPin, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { NGO, Volunteering } from '@/lib/types';
import type { NgoSiteSettings } from '@/app/ngo-admin/website/_components/types';

// SiteRenderer: STK'nın YAYINLANMIŞ tek-sayfa sitesini GERÇEK Firestore verisiyle
// render eder. Hem alt alan rotası (/s/[slug]) hem custom domain rotası (/d/[domain])
// aynı bileşeni kullanır. Bölüm görünürlüğü siteSettings.sections ile, tema rengi
// siteSettings.primaryColor ile, hero görselleri siteSettings.banners ile gelir.

// siteSettings + shortLink, NGO type'ında tanımlı değil — burada genişletiyoruz.
export type NgoWithSite = NGO & {
  shortLink?: string;
  website?: string;
  siteSettings?: NgoSiteSettings;
};

const XIcon = (props: React.ComponentProps<'svg'>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    {...props}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

// hex normalize: '#rrggbb' veya 'rrggbb' kabul; geçersizse default hangel turuncu.
function normalizeHex(input: string | undefined, fallback: string): string {
  const raw = (input ?? '').trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw}` : fallback;
}

interface SiteRendererProps {
  ngo: NgoWithSite;
  opportunities: Volunteering[];
}

export function SiteRenderer({ ngo, opportunities }: SiteRendererProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  // React 19 saflık: render'da new Date() yok → mount sonrası snapshot.
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const site = ngo.siteSettings ?? {};
  const sections: Record<string, boolean> = site.sections ?? {};
  // Belirtilmemiş bir bölüm: default açık kabul (STK hiç dokunmadıysa tam site).
  const show = (key: string) => sections[key] !== false;

  const primaryColor = normalizeHex(site.primaryColor, '#f34723');
  const themeStyle = {
    '--background': '#ffffff',
    '--foreground': '#042654',
    '--card': '#ffffff',
    '--card-foreground': '#042654',
    '--popover': '#ffffff',
    '--popover-foreground': '#042654',
    '--primary': primaryColor,
    '--primary-foreground': '#ffffff',
    '--secondary': '#f1f5f9',
    '--secondary-foreground': '#0f172a',
    '--muted': '#f8fafc',
    '--muted-foreground': '#64748b',
    '--accent': '#f1f5f9',
    '--accent-foreground': '#0f172a',
    '--border': '#e2e8f0',
    '--input': '#e2e8f0',
    '--ring': primaryColor,
  } as React.CSSProperties;

  const banners = Array.isArray(site.banners) ? site.banners.filter(b => !!b?.url) : [];
  const heroUrl =
    banners.find(b => b.isPrimary)?.url ||
    banners[0]?.url ||
    ngo.coverPhotoUrl ||
    ngo.avatarUrl ||
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop';

  const presidentName = (site.presidentName ?? '').trim();
  const presidentMessage = (site.presidentMessage ?? '').trim();

  const stat = site.stats ?? {};
  const volunteersStat = stat.volunteers ?? ngo.stats?.volunteers ?? 0;
  const donorsStat = stat.donors ?? ngo.stats?.donors ?? 0;
  const foundedYearStat = stat.foundedYear ?? ngo.foundationYear ?? null;
  const activeCampaignsStat = stat.activeCampaigns ?? (ngo.campaigns?.length ?? 0);

  const ngoOpportunities = useMemo(() => opportunities.slice(0, 9), [opportunities]);

  const donationMethods = [
    { name: 'hangel ile', icon: () => <span className="font-bold text-lg">hangel</span>, description: 'Alışverişlerinizle komisyonsuz destek olun.' },
    { name: 'HelpSteps ile', icon: HeartHandshake, description: 'Adımlarınızı iyiliğe dönüştürün.' },
    { name: 'Kredi Kartı ile', icon: CreditCard, description: 'Güvenli ödeme altyapısıyla doğrudan bağış yapın.' },
    { name: 'SMS ile', icon: MessageSquare, description: 'Operatörünüz üzerinden kısa mesajla bağış yapabilirsiniz.' },
  ];

  const governingBodies: Record<string, string> = {
    'Dernek': 'İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü',
    'Vakıf': 'Kültür ve Turizm Bakanlığı Vakıflar Genel Müdürlüğü',
    'Spor Kulübü': 'Gençlik ve Spor Bakanlığı',
  };
  const governingBody = governingBodies[ngo.type];

  const social = ngo.contact?.social;
  const address = ngo.contact?.address;
  const ngoUrl = `/ngos/${ngo.id}`;

  return (
    <div style={themeStyle} className="bg-background text-foreground min-h-screen">
      <header className="bg-background/80 shadow-md sticky top-0 z-50 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <a href="#hero" className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={ngo.avatarUrl} />
              <AvatarFallback>{ngo.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h1 className="text-lg md:text-xl font-bold text-foreground hidden sm:block">{ngo.name}</h1>
          </a>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-foreground">
            {show('about') && <a href="#hakkimizda" className="hover:text-primary transition-colors">Hakkımızda</a>}
            {show('volunteering') && <a href="#gonulluluk" className="hover:text-primary transition-colors">Gönüllülük</a>}
            {show('sdg') && <a href="#sdg" className="hover:text-primary transition-colors">Amaçlar</a>}
            {show('contact') && <a href="#iletisim" className="hover:text-primary transition-colors">İletişim</a>}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link href={ngoUrl}>Bağış Yap</Link>
            </Button>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Menüyü aç">
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-left">{ngo.name}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 py-6">
                  {show('about') && <SheetClose asChild><a href="#hakkimizda" className="text-lg hover:text-primary">Hakkımızda</a></SheetClose>}
                  {show('volunteering') && <SheetClose asChild><a href="#gonulluluk" className="text-lg hover:text-primary">Gönüllülük</a></SheetClose>}
                  {show('sdg') && <SheetClose asChild><a href="#sdg" className="text-lg hover:text-primary">Amaçlar</a></SheetClose>}
                  {show('contact') && <SheetClose asChild><a href="#iletisim" className="text-lg hover:text-primary">İletişim</a></SheetClose>}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 md:space-y-16">
        {/* Hero */}
        <section id="hero" className="relative h-[50vh] max-h-[600px] rounded-[2rem] overflow-hidden flex items-center justify-center text-center text-white shadow-2xl">
          <Image src={heroUrl} alt={ngo.name} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="relative z-10 p-6">
            <h2 className="text-4xl md:text-7xl font-black tracking-tight drop-shadow-xl mb-4">Dayanışma Güç Verir.</h2>
            <p className="text-lg md:text-2xl font-medium max-w-3xl mx-auto drop-shadow-lg opacity-90">
              {ngo.name} ile iyiliğin bir parçası olun, toplumsal değişimi birlikte başlatalım.
            </p>
          </div>
        </section>

        {/* Hızlı aksiyon */}
        {show('volunteering') && (
          <Card className="rounded-[2rem] border-none shadow-xl bg-primary text-primary-foreground">
            <CardContent className="p-8 sm:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Değişim Seninle Başlar.</h3>
                  <p className="text-lg opacity-90 font-medium">Becerilerinle topluma değer katmak için aramıza katıl.</p>
                </div>
                <Button asChild size="lg" variant="secondary" className="w-full md:w-auto h-14 px-10 rounded-full font-bold text-lg shadow-2xl">
                  <a href="#gonulluluk">Gönüllü Ol <ArrowRight className="ml-2 h-5 w-5" /></a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* İstatistikler */}
        {show('stats') && (
          <section id="istatistikler" className="scroll-mt-24">
            <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden bg-card">
              <CardHeader className="text-center pt-10">
                <CardTitle className="text-2xl font-bold tracking-tight">Etkimiz Rakamlarla</CardTitle>
                <CardDescription>Şeffaf ve ölçülebilir sosyal fayda verilerimiz.</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                  {foundedYearStat != null && (
                    <div className="text-center space-y-1">
                      <p className="text-5xl font-black text-primary tracking-tighter">{foundedYearStat}</p>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kuruluş Yılı</p>
                    </div>
                  )}
                  <div className="text-center space-y-1">
                    <p className="text-5xl font-black text-primary tracking-tighter">+{volunteersStat.toLocaleString('tr-TR')}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gönüllü</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-5xl font-black text-primary tracking-tighter">+{donorsStat.toLocaleString('tr-TR')}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Bağışçı</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-5xl font-black text-primary tracking-tighter">{activeCampaignsStat.toLocaleString('tr-TR')}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aktif Kampanya</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Başkanın Mesajı */}
        {show('president') && (presidentName || presidentMessage) && (
          <section id="baskan" className="scroll-mt-24">
            <Card className="rounded-[2.5rem] border-none shadow-lg bg-card overflow-hidden">
              <CardContent className="p-10 md:p-16 space-y-6">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em]">Başkanın Mesajı</Badge>
                {presidentMessage && (
                  <p className="text-lg md:text-2xl font-medium leading-relaxed text-foreground/90 italic">“{presidentMessage}”</p>
                )}
                {presidentName && (
                  <div className="pt-4 border-t">
                    <p className="font-black text-lg tracking-tight">{presidentName}</p>
                    <p className="text-sm text-muted-foreground">{ngo.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Bağış kanalları */}
        {show('donations') && (
          <section id="destek-yontemleri" className="scroll-mt-24 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Desteklerinizle Büyüyoruz</h2>
              <p className="text-muted-foreground">Kuruluşumuza katkıda bulunabileceğiniz farklı yöntemleri keşfedin.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donationMethods.map(method => {
                const Icon = method.icon;
                const isHangel = method.name === 'hangel ile';
                return (
                  <Card key={method.name} className="rounded-[2rem] hover:shadow-2xl transition-all border-none shadow-lg bg-card group overflow-hidden">
                    <CardHeader className="flex-row items-center gap-5 p-8">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl">{method.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-4">
                      <p className="text-muted-foreground leading-relaxed">{method.description}</p>
                    </CardContent>
                    <CardFooter className="px-8 pb-8">
                      <Button asChild variant="link" className="p-0 text-primary font-bold text-base hover:no-underline">
                        {isHangel ? (
                          <Link href={ngoUrl}>Hemen Destek Ol <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        ) : (
                          <Link href={ngoUrl}>Detaylı Bilgi <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Hakkımızda */}
        {show('about') && (
          <section id="hakkimizda" className="scroll-mt-24">
            <Card className="rounded-[3rem] overflow-hidden border-none shadow-2xl bg-card">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
                  <div>
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] mb-4">Vizyonumuz</Badge>
                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Hakkımızda</h3>
                  </div>
                  {ngo.about && (
                    <>
                      <p className={cn('text-lg text-muted-foreground leading-relaxed font-medium', !isAboutExpanded && 'line-clamp-6')}>{ngo.about}</p>
                      <Button variant="ghost" className="p-0 h-auto self-start text-primary font-bold hover:bg-transparent" onClick={() => setIsAboutExpanded(!isAboutExpanded)}>
                        {isAboutExpanded ? 'Daha Az Göster' : 'Kurumsal Hikayemizi Oku'}
                        <ChevronRight className={cn('ml-1 h-5 w-5 transition-transform', isAboutExpanded && 'rotate-90')} />
                      </Button>
                    </>
                  )}
                  {ngo.beneficiaryGroups && ngo.beneficiaryGroups.length > 0 && (
                    <div className="pt-8 border-t space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Etki Odaklarımız</h4>
                      <div className="flex flex-wrap gap-2">
                        {ngo.beneficiaryGroups.map(group => (
                          <Badge key={group} variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-bold">{group}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative bg-muted hidden lg:block">
                  <Image src={heroUrl} alt={ngo.name} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent" />
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Gönüllülük */}
        {show('volunteering') && ngoOpportunities.length > 0 && (
          <section id="gonulluluk" className="scroll-mt-24 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Gönüllülük İlanları</h2>
                <p className="text-muted-foreground">Yetkinliklerinizle iyilik hareketini büyütün.</p>
              </div>
              <Button asChild variant="outline" className="rounded-full px-8 h-11 font-bold border-primary/20 text-primary">
                <Link href={ngoUrl}>Tüm İlanları Gör</Link>
              </Button>
            </div>
            <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-6 overflow-hidden">
              <Carousel opts={{ align: 'start' }} className="w-full">
                <CarouselContent className="-ml-4">
                  {ngoOpportunities.map(opp => (
                    <CarouselItem key={opp.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <Card className="rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all h-full flex flex-col">
                        <CardHeader className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary"><HeartHandshake className="h-5 w-5" /></div>
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest">{opp.location?.type}</Badge>
                          </div>
                          <CardTitle className="text-lg leading-tight line-clamp-2">{opp.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1.5 pt-1"><MapPin className="h-3 w-3" /> {opp.location?.city}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-4 flex-1">
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{opp.socialArea}</p>
                        </CardContent>
                        <CardFooter className="p-6 pt-0">
                          <Button asChild variant="outline" className="w-full rounded-xl font-bold hover:bg-primary hover:text-white transition-colors">
                            <Link href={`/volunteering/${opp.id}`}>Başvur</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden lg:flex justify-end gap-2 mt-6">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            </Card>
          </section>
        )}

        {/* SKA'lar */}
        {show('sdg') && ngo.supportedSDGs && ngo.supportedSDGs.length > 0 && (
          <section id="sdg" className="scroll-mt-24 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">Küresel Amaçlar İçin Çalışıyoruz</h2>
            <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-10 overflow-hidden">
              <div className="flex flex-wrap justify-center gap-6">
                {ngo.supportedSDGs.map(sdg => (
                  <a href="https://www.kureselamaclar.org" target="_blank" rel="noopener noreferrer" key={sdg} className="group">
                    <div className="p-6 border-2 border-dashed rounded-[2rem] text-center bg-card flex flex-col items-center justify-center w-40 h-40 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-3">
                        <Target className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <p className="text-xs font-bold leading-tight">{sdg}</p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Şeffaflık */}
        {show('transparency') && (
          <section id="seffaflik" className="scroll-mt-24 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Şeffaflık ve Güven</h2>
                <p className="text-muted-foreground">Tüm verilerimiz ve raporlarımız kamuoyuna açıktır.</p>
              </div>
              <Card className="rounded-2xl border-none shadow-xl p-6 bg-primary text-primary-foreground flex flex-col items-center min-w-[180px]">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Şeffaflık Puanı</p>
                <p className="text-5xl font-black tracking-tighter">{typeof ngo.transparencyScore === 'number' ? `%${ngo.transparencyScore}` : '—'}</p>
              </Card>
            </div>
            <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-10 text-center">
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {ngo.name} şeffaflık ilkeleriyle hareket eder. Tüm kurumsal belgelerimizi ve denetim
                raporlarımızı hangel profilimiz üzerinden inceleyebilirsiniz.
              </p>
              <Button asChild className="mt-6 rounded-full px-8 h-12 font-bold">
                <Link href={ngoUrl}>Şeffaflık Detaylarını Gör <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </Card>
          </section>
        )}
      </main>

      {/* İletişim (Footer) */}
      <footer id="iletisim" className="bg-card border-t border-border/50 mt-24 py-16 scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 text-left">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={ngo.avatarUrl} />
                  <AvatarFallback>{ngo.name[0]}</AvatarFallback>
                </Avatar>
                <h4 className="font-black text-xl tracking-tighter">{ngo.name}</h4>
              </div>
              {show('contact') && (
                <div className="space-y-3 text-sm text-muted-foreground">
                  {ngo.contact?.email && <a href={`mailto:${ngo.contact.email}`} className="flex items-center gap-3 hover:text-primary transition-colors font-medium"><Mail className="h-4 w-4" /><span>{ngo.contact.email}</span></a>}
                  {ngo.contact?.phone && <a href={`tel:${ngo.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-primary transition-colors font-medium"><Phone className="h-4 w-4" /><span>{ngo.contact.phone}</span></a>}
                  {ngo.contact?.website && <a href={ngo.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors font-medium"><Globe className="h-4 w-4" /><span>{ngo.contact.website}</span></a>}
                  {address && (
                    <div className="flex items-start gap-3 pt-3 border-t">
                      <MapPin className="h-4 w-4 mt-1 shrink-0" />
                      <p className="leading-relaxed">
                        {address.fullAddress}<br />
                        <strong>{address.district}, {address.city}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {show('contact') && social && (social.twitter || social.instagram || social.facebook || social.linkedin) && (
              <div className="space-y-6">
                <h4 className="font-black uppercase tracking-[0.2em] text-xs text-muted-foreground pt-3">Sosyal Medya</h4>
                <div className="flex flex-wrap gap-3">
                  {social.twitter && <a href={`https://x.com/${social.twitter}`} target="_blank" rel="noopener noreferrer" aria-label="X" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><XIcon className="w-5 h-5" /></a>}
                  {social.instagram && <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><Instagram className="w-5 h-5" /></a>}
                  {social.facebook && <a href={`https://facebook.com/${social.facebook}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><Facebook className="w-5 h-5" /></a>}
                  {social.linkedin && <a href={`https://linkedin.com/company/${social.linkedin}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><Linkedin className="w-5 h-5" /></a>}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h4 className="font-black uppercase tracking-[0.2em] text-xs text-muted-foreground pt-3">Kurumsal Yapı</h4>
              <div className="space-y-6">
                {governingBody && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Denetleyici Makam</h5>
                    <div className="flex items-center gap-3 text-xs font-bold leading-snug">
                      <Landmark className="h-5 w-5 text-primary shrink-0" />
                      <span>{governingBody}</span>
                    </div>
                  </div>
                )}
                {ngo.memberOf && ngo.memberOf.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bağlı Olunan Platformlar</h5>
                    <div className="flex flex-col gap-2">
                      {ngo.memberOf.map(platform => (
                        <div key={platform} className="flex items-center gap-2 text-xs font-bold">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {platform}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        hangel
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-10 text-center space-y-4">
            <p className="text-xs text-muted-foreground font-medium">
              &copy; {currentYear ?? ''} {ngo.name}. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground opacity-60">hangel ile güçlendirilmiştir</span>
              <a href="https://hangel.org" target="_blank" rel="noopener noreferrer" className="font-black text-primary hover:scale-105 transition-transform">hangel</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
