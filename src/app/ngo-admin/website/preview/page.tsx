
'use client';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
    Mail, Phone, Globe, ShieldCheck, HeartHandshake, Newspaper, BarChart3, Twitter, Instagram, Facebook, Linkedin, 
    CreditCard, Landmark, MessageSquare, QrCode, ArrowRight, Download, Eye, CheckCircle, AlertCircle, ChevronRight, Menu, MapPin
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Copy } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { HangelLogo } from '@/components/icons';

const transparencyCriteria = [
  { name: 'Faaliyet Belgesi', completed: true },
  { name: 'Tüzük / Vakıf Senedi', completed: true },
  { name: 'Yönetim Kurulu Listesi', completed: true },
  { name: 'Yıllık Faaliyet Raporu', completed: true },
  { name: 'Finansal Tablolar', completed: true },
  { name: 'Bağımsız Denetim Raporu', completed: false },
  { name: 'Etki Raporu', completed: true },
];

export default function WebsitePreviewPage() {
    const searchParams = useSearchParams();
    const ngo = ngos.find(n => n.id === '2'); // Ahbap Derneği
    const { toast } = useToast();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(transparencyCriteria[0]);

    if (!ngo) {
        return <div className="h-screen flex items-center justify-center">Kuruluş bulunamadı.</div>;
    }
    
    const theme = {
        primary: `#${searchParams.get('primary') || 'f34723'}`,
        secondary: `#${searchParams.get('secondary') || 'f1f5f9'}`,
        accent: `#${searchParams.get('accent') || '042654'}`,
        'secondary-foreground': '#475569',
    };

    const ngoPosts = timelinePosts.filter(p => p.author.name === ngo.name).slice(0, 6);
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.ngoId === ngo.id).slice(0, 5); 

    const donationMethods = [
        { name: 'hangel ile', icon: 'hangel', description: 'Alışverişlerinizle komisyonsuz destek olun.' },
        { name: 'HelpSteps ile', icon: Handshake, description: 'Adımlarınızı iyiliğe dönüştürün.' },
        { name: 'Kredi Kartı ile', icon: CreditCard, description: 'Güvenli ödeme altyapısıyla doğrudan bağış yapın.' },
        { name: 'Banka Transferi (EFT/IBAN)', icon: Landmark, description: 'Doğrudan banka hesabımıza transfer yapın.', iban: 'TR00 0000 0000 0000 0000 0000 00' },
        { name: 'SMS ile', icon: MessageSquare, description: '"AHBAP" yazıp 3406\'ya göndererek 20 TL bağış yapabilirsiniz.' },
    ];
    
     const products = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `El Yapımı Ürün ${i + 1}`,
      imageUrl: `https://picsum.photos/seed/product${i}/200/200`,
      price: `${(Math.random() * 100 + 20).toFixed(2)} ₺`,
    }));

    return (
        <div style={{
            '--primary': theme.primary,
            '--secondary': theme.secondary,
            '--accent': theme.accent,
            '--secondary-foreground': theme['secondary-foreground'],
        } as React.CSSProperties} className="bg-[--secondary] text-[--secondary-foreground]">
            
            <header className="bg-white/80 dark:bg-gray-800/80 shadow-md sticky top-0 z-50 backdrop-blur-lg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <Link href="#hero" className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={ngo.avatarUrl} />
                            <AvatarFallback>{ngo.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-xl md:text-2xl font-bold text-[--accent] hidden sm:block">{ngo.name}</h1>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-[--accent]">
                        <a href="#hakkimizda" className="hover:text-[--primary]">Hakkımızda</a>
                        <a href="#gonulluluk" className="hover:text-[--primary]">Gönüllülük</a>
                        <a href="#haberler" className="hover:text-[--primary]">Haberler</a>
                        <a href="#seffaflik" className="hover:text-[--primary]">Şeffaflık</a>
                    </nav>
                     <div className="flex items-center gap-2">
                        <Button className="bg-[--primary] hover:bg-[--primary]/90 text-white">
                            Bağış Yap
                        </Button>
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle className="text-left">{ngo.name}</SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 py-6">
                                    <SheetClose asChild><a href="#hakkimizda" className="text-lg hover:text-[--primary]">Hakkımızda</a></SheetClose>
                                    <SheetClose asChild><a href="#gonulluluk" className="text-lg hover:text-[--primary]">Gönüllülük</a></SheetClose>
                                    <SheetClose asChild><a href="#haberler" className="text-lg hover:text-[--primary]">Haberler</a></SheetClose>
                                    <SheetClose asChild><a href="#seffaflik" className="text-lg hover:text-[--primary]">Şeffaflık</a></SheetClose>
                                </nav>
                            </SheetContent>
                        </Sheet>
                     </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-16 md:space-y-24">
                
                <section id="hero" className="relative h-[60vh] max-h-[700px] rounded-xl overflow-hidden flex items-center justify-center text-center text-white">
                    <Image src={ngo.coverPhotoUrl} alt="Hero" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative z-10 p-4">
                        <h2 className="text-4xl md:text-6xl font-bold drop-shadow-lg">İyiliğin ve Dayanışmanın Adresi</h2>
                        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">Toplumsal fayda için bir araya gelerek, daha güzel bir gelecek inşa ediyoruz.</p>
                    </div>
                </section>

                 <section id="cagri" className="scroll-mt-20 -mt-8 md:-mt-12">
                     <Card className="bg-white dark:bg-gray-800 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-xl font-bold text-[--accent]">İyiliğe Katıl, Gönüllü Ol!</h3>
                                    <p className="text-sm text-[--secondary-foreground] mt-1">Topluma değer katmak için yeteneklerini ve zamanını kullan.</p>
                                </div>
                                <Button asChild size="lg" className="bg-[--primary] hover:bg-[--primary]/90 text-white w-full sm:w-auto">
                                    <a href="#gonulluluk">İlanları İncele</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="istatistikler" className="scroll-mt-20">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-[--accent]">
                        <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-[--primary]">{ngo.foundationYear}</p>
                            <p className="text-sm font-semibold mt-2">Kuruluş Yılı</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-[--primary]">{ngo.stats.volunteers.toLocaleString('tr-TR')}</p>
                            <p className="text-sm font-semibold mt-2">Gönüllü Sayısı</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-[--primary]">{ngo.stats.projects.toLocaleString('tr-TR')}</p>
                            <p className="text-sm font-semibold mt-2">Tamamlanan Proje</p>
                        </div>
                         <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-[--primary]">{ngo.stats.peopleReached.toLocaleString('tr-TR')}</p>
                            <p className="text-sm font-semibold mt-2">Ulaşılan İnsan</p>
                        </div>
                    </div>
                </section>

                <section id="destek-yontemleri" className="scroll-mt-20">
                     <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-[--accent]">Desteklerinizle Büyüyoruz</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {donationMethods.map(method => {
                            const Icon = method.icon === 'hangel' ? HangelLogo : method.icon;
                            return (
                             <Card key={method.name} className="flex flex-col">
                                <CardHeader className="flex-row items-center gap-4">
                                     <div className="p-3 bg-[--primary]/10 rounded-full">
                                        {typeof Icon === 'string' ? <span className="font-bold text-lg text-[--primary]">{Icon}</span> : <Icon className="h-6 w-6 text-[--primary]"/>}
                                    </div>
                                    <CardTitle className="text-lg text-[--accent]">{method.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-[--secondary-foreground]">{method.description}</p>
                                    {method.iban && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-sm font-mono tracking-wider p-3 bg-muted rounded-lg text-foreground">
                                                <span className="truncate">{method.iban}</span>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText(method.iban!); toast({ title: 'IBAN Kopyalandı!' }); }}>
                                                    <Copy className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 text-center">Lütfen açıklama kısmına "BAĞIŞ" yazınız.</p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="ghost" className="w-full justify-start text-[--primary] hover:text-[--primary]">
                                        Destek Ol <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )})}
                     </div>
                </section>

                <section id="isletme" className="scroll-mt-20">
                     <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-[--accent]">İktisadi İşletme Ürünleri</h2>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {products.map(product => (
                            <Card key={product.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="relative aspect-square w-full">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <p className="font-semibold text-sm text-[--accent] truncate">{product.name}</p>
                                        <p className="text-base font-bold text-[--primary]">{product.price}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="hakkimizda" className="scroll-mt-20">
                     <Card className="overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                           <div className="p-8 md:p-12">
                                <h3 className="text-3xl font-bold text-[--accent] flex items-center gap-3 mb-4"><Globe className="h-8 w-8 text-[--primary]"/> Hakkımızda</h3>
                                <p className="text-[--secondary-foreground] leading-relaxed">{ngo.about}</p>
                           </div>
                            <div className="relative min-h-[300px] md:min-h-full">
                                <Image src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Hakkımızda" fill className="object-cover"/>
                            </div>
                        </div>
                    </Card>
                </section>

                <section id="gonulluluk" className="scroll-mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-[--accent]"><HeartHandshake className="h-8 w-8 text-[--primary]"/> Gönüllülük İlanları</h2>
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {ngoOpportunities.map(opp => (
                                <CarouselItem key={opp.id} className="pl-4 md:basis-1/3 lg:basis-1/5">
                                    <Card className="flex flex-col h-full">
                                        <CardHeader>
                                            <CardTitle className="text-base text-[--accent] line-clamp-2">{opp.title}</CardTitle>
                                            <CardDescription>{opp.location.city} - {opp.commitment}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <p className="text-sm text-[--secondary-foreground] line-clamp-3">{opp.description}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button variant="outline" className="w-full border-[--primary] text-[--primary] hover:bg-[--primary]/10 hover:text-[--primary]">Detayları Gör</Button>
                                        </CardFooter>
                                    </Card>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                </section>

                 <section id="haberler" className="scroll-mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-[--accent]"><Newspaper className="h-8 w-8 text-[--primary]"/> Haberler</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ngoPosts.map(post => (
                            <Card key={post.id} className="flex flex-col">
                                {post.imageUrl && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                                        <Image src={post.imageUrl} alt="Post image" fill className="object-cover"/>
                                    </div>
                                )}
                                <CardHeader className="flex-row items-center gap-3">
                                    <div>
                                        <p className="font-semibold text-[--accent] text-sm">{post.author.name}</p>
                                        <p className="text-xs text-[--secondary-foreground]">{post.timestamp}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm line-clamp-3">{post.content}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="link" className="p-0 h-auto text-[--primary]">Devamını Oku</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="seffaflik" className="scroll-mt-20">
                    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-[--accent]">
                            <ShieldCheck className="h-8 w-8 text-[--primary]"/> Şeffaflık
                        </h2>
                        <div className="text-center p-4 border-2 border-dashed rounded-xl">
                            <p className="text-sm text-muted-foreground">Şeffaflık Puanı</p>
                            <p className="text-4xl font-bold text-[--primary]">{ngo.transparencyScore}</p>
                        </div>
                    </div>
                    {/* Desktop View */}
                    <Card className="overflow-hidden hidden md:grid grid-cols-1 md:grid-cols-3">
                        <div className="md:col-span-1 border-r bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-base text-[--accent]">Kriterler</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {transparencyCriteria.map(item => (
                                    <button
                                        key={item.name}
                                        onClick={() => setSelectedDoc(item)}
                                        className={cn(
                                            "flex w-full items-center gap-3 p-3 text-left text-sm transition-colors",
                                            selectedDoc.name === item.name ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                                        )}
                                    >
                                        {item.completed ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                                        <span className="flex-1">{item.name}</span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                ))}
                            </CardContent>
                        </div>
                        <div className="md:col-span-2 p-6 flex flex-col justify-center">
                            <h3 className="text-lg font-semibold text-[--accent]">{selectedDoc.name}</h3>
                            {selectedDoc.completed ? (
                                <div className="mt-4 space-y-2 text-sm">
                                    <p className="text-green-600 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Bu kriter karşılanmıştır.</p>
                                    <div className="p-4 border bg-muted rounded-lg">
                                        <p className="font-semibold">Belge Önizlemesi</p>
                                        <p className="text-muted-foreground mt-2">"{selectedDoc.name}" belgesinin içeriği burada görüntülenecektir. Bu, kuruluşun şeffaflığını göstermek için kamuya açık bir belgedir.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-2 text-sm">
                                    <p className="text-yellow-600 flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Bu kriter henüz karşılanmamıştır.</p>
                                    <div className="p-4 border bg-muted rounded-lg">
                                        <p className="font-semibold">Belge Eksik</p>
                                        <p className="text-muted-foreground mt-2">Bu belge henüz kuruluş tarafından yüklenmemiştir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                    {/* Mobile View */}
                    <div className="md:hidden">
                        <Accordion type="single" collapsible className="w-full space-y-2">
                          {transparencyCriteria.map((item) => (
                            <AccordionItem value={item.name} key={item.name} className="border-b-0">
                              <Card className="overflow-hidden">
                                <AccordionTrigger className="p-3 text-left hover:no-underline">
                                  <div className="flex w-full items-center gap-3 text-sm">
                                    {item.completed ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                                    <span className="flex-1 font-semibold">{item.name}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-3 border-t">
                                    <div className="p-2 border bg-muted/50 rounded-lg text-sm">
                                        <p className="font-semibold">Belge Durumu</p>
                                        <p className="text-muted-foreground mt-1">{item.completed ? "Bu belge kuruluş tarafından sağlanmıştır." : "Bu belge henüz yüklenmemiştir."}</p>
                                    </div>
                                </AccordionContent>
                              </Card>
                            </AccordionItem>
                          ))}
                        </Accordion>
                    </div>
                </section>
            </main>

             <footer className="bg-white dark:bg-gray-800 border-t mt-12 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-[--secondary-foreground]">
                    {ngo.affiliatedWith && (
                      <div className="mb-8">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2">Bağlı Olduğu Üst Kuruluş</h4>
                        <div className="flex justify-center items-center gap-2">
                          <Image src={ngo.affiliatedWith.logoUrl || ''} alt={ngo.affiliatedWith.name} width={24} height={24} />
                          <span className="font-semibold text-gray-700">{ngo.affiliatedWith.name}</span>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left">
                        <div>
                            <h4 className="font-bold text-[--accent] mb-2">İletişim</h4>
                            <div className="space-y-2 text-sm">
                                <a href={`mailto:${ngo.contact.email}`} className="flex items-center gap-2 hover:text-[--primary]"><Mail className="h-4 w-4" /><span>{ngo.contact.email}</span></a>
                                <a href={`tel:${ngo.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-[--primary]"><Phone className="h-4 w-4" /><span>{ngo.contact.phone}</span></a>
                                <a href={ngo.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[--primary]"><Globe className="h-4 w-4" /><span>{ngo.contact.website}</span></a>
                                {ngo.contact.address && <div className="flex items-start gap-2 pt-2"><MapPin className="h-4 w-4 mt-1" /><span>{ngo.contact.address.fullAddress}<br/>{ngo.contact.address.district}, {ngo.contact.address.city}</span></div>}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-[--accent] mb-2">Sosyal Medya</h4>
                            <div className="flex items-center gap-4">
                                <a href={`https://twitter.com/${ngo.contact.social.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-[--primary]/20 text-[--accent] hover:text-[--primary]"><Twitter /></a>
                                <a href={`https://instagram.com/${ngo.contact.social.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-[--primary]/20 text-[--accent] hover:text-[--primary]"><Instagram /></a>
                                <a href={`https://facebook.com/${ngo.contact.social.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-[--primary]/20 text-[--accent] hover:text-[--primary]"><Facebook /></a>
                                <a href={`https://linkedin.com/company/${ngo.contact.social.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-[--primary]/20 text-[--accent] hover:text-[--primary]"><Linkedin /></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-[--accent] mb-2">Üye Olduğu Platformlar</h4>
                            <div className="flex items-center gap-4 text-sm font-semibold text-[--accent]">
                                {ngo.memberOf.map(platform => (
                                    <span key={platform}>{platform}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p>&copy; {new Date().getFullYear()} {ngo.name}. Tüm hakları saklıdır.</p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <span className="font-bold">hangel</span> tarafından güçlendirilmiştir.
                    </p>
                </div>
            </footer>
        </div>
    );
}

    
