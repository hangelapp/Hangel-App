
'use client';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
    Mail, Phone, Globe, ShieldCheck, HeartHandshake, Newspaper, BarChart3, Instagram, Facebook, Linkedin, 
    CreditCard, Landmark, MessageSquare, ArrowRight, CheckCircle, AlertCircle, ChevronRight, Menu, MapPin, Target, Award, Calendar
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Volunteering, Post, Campaign } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const transparencyCriteria = [
  { name: 'Faaliyet Belgesi', completed: true },
  { name: 'Tüzük / Vakıf Senedi', completed: true },
  { name: 'Yönetim Kurulu Listesi', completed: true },
  { name: 'Yıllık Faaliyet Raporu', completed: true },
  { name: 'Finansal Tablolar', completed: true },
  { name: 'Bağımsız Denetim Raporu', completed: false },
  { name: 'Etki Raporu', completed: true },
];

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


export default function WebsitePreviewPage() {
    const searchParams = useSearchParams();
    const ngo = ngos.find(n => n.id === '2'); // Ahbap Derneği
    const { toast } = useToast();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(transparencyCriteria[0]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);


    if (!ngo) {
        return <div className="h-screen flex items-center justify-center">Kuruluş bulunamadı.</div>;
    }
    
    const primaryColor = `#${searchParams.get('primary') || 'f34723'}`;
    const backgroundColor = `#${searchParams.get('secondary') || 'ffffff'}`;
    const foregroundColor = `#${searchParams.get('accent') || '042654'}`;

    const themeStyle = {
      '--background': backgroundColor,
      '--foreground': foregroundColor,
      '--card': '#ffffff',
      '--card-foreground': foregroundColor,
      '--popover': backgroundColor,
      '--popover-foreground': foregroundColor,
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

    const ngoPosts = timelinePosts.filter(p => p.author.name === ngo.name).slice(0, 6);
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.ngoId === ngo.id).slice(0, 5); 

    const donationMethods = [
        { name: 'hangel ile', icon: () => <span className="font-bold text-lg">hangel</span>, description: 'Alışverişlerinizle komisyonsuz destek olun.' },
        { name: 'HelpSteps ile', icon: HeartHandshake, description: 'Adımlarınızı iyiliğe dönüştürün.' },
        { name: 'Kredi Kartı ile', icon: CreditCard, description: 'Güvenli ödeme altyapısıyla doğrudan bağış yapın.' },
        { name: 'SMS ile', icon: MessageSquare, description: '"AHBAP" yazıp 3406\'ya göndererek 20 TL bağış yapabilirsiniz.' },
    ];
    
     const products = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `El Yapımı Ürün ${i + 1}`,
      imageUrl: `https://picsum.photos/seed/product${i}/200/200`,
      price: `${(Math.random() * 100 + 20).toFixed(2)} ₺`,
    }));
    
    const governingBodies: { [key: string]: { name: string; logo: React.ElementType } } = {
        'Dernek': { name: 'İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü', logo: Landmark },
        'Vakıf': { name: 'Kültür ve Turizm Bakanlığı Vakıflar Genel Müdürlüğü', logo: Landmark },
        'Spor Kulübü': { name: 'Gençlik ve Spor Bakanlığı', logo: Landmark }
    };
    const governingBody = governingBodies[ngo.type];

    const PostDetailDialog = ({ post, open, onClose }: { post: Post | null, open: boolean, onClose: () => void }) => {
        if (!post) return null;
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                                <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle>{post.author.name}</DialogTitle>
                                <DialogDescription>{post.timestamp}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {post.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                <Image src={post.imageUrl} alt="Post image" fill className="object-cover"/>
                            </div>
                        )}
                        <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={onClose}>Kapat</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div style={themeStyle} className="bg-background text-foreground">
            
            <header className="bg-background/80 shadow-md sticky top-0 z-50 backdrop-blur-lg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <Link href="#hero" className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={ngo.avatarUrl} />
                            <AvatarFallback>{ngo.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground hidden sm:block">{ngo.name}</h1>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-foreground">
                        <a href="#hakkimizda" className="hover:text-primary">Hakkımızda</a>
                        <a href="#kampanyalar" className="hover:text-primary">Kampanyalar</a>
                        <a href="#gonulluluk" className="hover:text-primary">Gönüllülük</a>
                        <a href="#haberler" className="hover:text-primary">Haberler</a>
                        <a href="#seffaflik" className="hover:text-primary">Şeffaflık</a>
                        <a href="#iletisim" className="hover:text-primary">İletişim</a>
                    </nav>
                     <div className="flex items-center gap-2">
                        <Button>
                            Bağış Yap
                        </Button>
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="md:hidden">
                                    <Menu className="h-7 w-7" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle className="text-left">{ngo.name}</SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 py-6">
                                    <SheetClose asChild><a href="#hakkimizda" className="text-lg hover:text-primary">Hakkımızda</a></SheetClose>
                                    <SheetClose asChild><a href="#kampanyalar" className="text-lg hover:text-primary">Kampanyalar</a></SheetClose>
                                    <SheetClose asChild><a href="#gonulluluk" className="text-lg hover:text-primary">Gönüllülük</a></SheetClose>
                                    <SheetClose asChild><a href="#haberler" className="text-lg hover:text-primary">Haberler</a></SheetClose>
                                    <SheetClose asChild><a href="#seffaflik" className="text-lg hover:text-primary">Şeffaflık</a></SheetClose>
                                    <SheetClose asChild><a href="#iletisim" className="text-lg hover:text-primary">İletişim</a></SheetClose>
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

                <Card className="bg-card -mt-8 md:-mt-16">
                  <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-center sm:text-left">
                              <h3 className="text-xl font-bold">İyiliğe Katıl, Gönüllü Ol!</h3>
                              <p className="text-sm text-muted-foreground mt-1">Topluma değer katmak için yeteneklerini ve zamanını kullan.</p>
                          </div>
                          <Button asChild size="lg" className="w-full sm:w-auto">
                              <a href="#gonulluluk">İlanları İncele</a>
                          </Button>
                      </div>
                  </CardContent>
              </Card>

                <section id="istatistikler" className="scroll-mt-20">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-foreground">
                        <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-primary">{ngo.foundationYear}</p>
                            <p className="text-sm font-semibold mt-2">Kuruluş Yılı</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-primary">{ngo.stats.volunteers.toLocaleString('tr-TR')}</p>
                            <p className="text-sm font-semibold mt-2">Gönüllü Sayısı</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-primary">{ngo.stats.projects.toLocaleString('tr-TR')}</p>
                            <p className="text-sm font-semibold mt-2">Tamamlanan Proje</p>
                        </div>
                         <div className="flex flex-col items-center">
                            <p className="text-4xl lg:text-5xl font-bold text-primary">{ngo.stats.peopleReached.toLocaleString('tr-TR')}</p>
                            <p className="text-sm font-semibold mt-2">Ulaşılan İnsan</p>
                        </div>
                    </div>
                </section>

                <section id="destek-yontemleri" className="scroll-mt-20">
                     <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-foreground">Desteklerinizle Büyüyoruz</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {donationMethods.map(method => {
                            const Icon = method.icon;
                            const isHangel = method.name === 'hangel ile';
                            return (
                             <Card key={method.name} className="flex flex-col bg-card">
                                <CardHeader className="flex-row items-center gap-4">
                                     <div className="p-3 bg-primary/10 rounded-full">
                                        <Icon className="h-6 w-6 text-primary"/>
                                    </div>
                                    <CardTitle className="text-lg text-foreground">{method.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">{method.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="ghost" className="w-full justify-start text-primary hover:text-primary/90">
                                      {isHangel ? (
                                        <Link href={`/ngos/${ngo.id}`}>Destek Ol <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                      ) : (
                                        <a href="#">Destek Ol <ArrowRight className="ml-2 h-4 w-4" /></a>
                                      )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )})}
                        <Card className="flex flex-col bg-card md:col-span-2">
                             <CardHeader className="flex-row items-center gap-4">
                                     <div className="p-3 bg-primary/10 rounded-full">
                                        <Landmark className="h-6 w-6 text-primary"/>
                                    </div>
                                    <CardTitle className="text-lg text-foreground">Banka Transferi (EFT/IBAN)</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">Doğrudan banka hesabımıza transfer yapın.</p>
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm font-mono tracking-wider p-3 bg-muted rounded-lg">
                                            <span className="truncate">TR00 0000 0000 0000 0000 0000 00</span>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText("TR00 0000 0000 0000 0000 0000 00"); toast({ title: 'IBAN Kopyalandı!' }); }}>
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 text-center">Lütfen açıklama kısmına "BAĞIŞ" yazınız.</p>
                                    </div>
                                </CardContent>
                        </Card>
                     </div>
                </section>
                
                 <section id="isletme" className="scroll-mt-20">
                     <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-foreground">İktisadi İşletme Ürünleri</h2>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {products.map(product => (
                            <Card key={product.id} className="overflow-hidden bg-card">
                                <CardContent className="p-0">
                                    <div className="relative aspect-square w-full">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                                        <p className="text-base font-bold text-primary">{product.price}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>


                <section id="hakkimizda" className="scroll-mt-20">
                     <Card className="overflow-hidden bg-card">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                           <div className="p-8 md:p-12">
                                <h3 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-4"><Globe className="h-8 w-8 text-primary"/> Hakkımızda</h3>
                                <p className={cn("text-muted-foreground leading-relaxed", !isAboutExpanded && "line-clamp-4")}>{ngo.about}</p>
                                <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setIsAboutExpanded(!isAboutExpanded)}>
                                    {isAboutExpanded ? 'Daha Az Göster' : 'Devamını Oku'}
                                </Button>
                                <h4 className="text-xl font-bold text-foreground mt-8 mb-4">Odak Alanlarımız</h4>
                                <div className="flex flex-wrap gap-2">
                                    {ngo.beneficiaryGroups.map(group => (
                                        <Badge key={group} variant="secondary" className="text-sm">{group}</Badge>
                                    ))}
                                </div>
                           </div>
                            <div className="relative min-h-[300px] md:min-h-full">
                                <Image src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Hakkımızda" fill className="object-cover"/>
                            </div>
                        </div>
                    </Card>
                </section>

                {ngo.campaigns && ngo.campaigns.length > 0 && (
                <section id="kampanyalar" className="scroll-mt-20">
                     <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-foreground"><Target className="h-8 w-8 text-primary"/> Bağış Kampanyaları</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {ngo.campaigns.map(campaign => (
                            <Card key={campaign.id} className="flex flex-col bg-card overflow-hidden">
                                <div className="relative aspect-[16/9] w-full">
                                    <Image src={campaign.imageUrl} alt={campaign.title} fill className="object-cover" />
                                </div>
                                <CardHeader>
                                    <CardTitle>{campaign.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                                    <div>
                                        <Progress value={(campaign.currentAmount / campaign.goal) * 100} className="h-2" />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>{campaign.currentAmount.toLocaleString('tr-TR')} ₺ Toplandı</span>
                                            <span>{campaign.goal.toLocaleString('tr-TR')} ₺ Hedef</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full">Hemen Bağış Yap</Button>
                                </CardFooter>
                            </Card>
                        ))}
                     </div>
                </section>
                )}

                <section id="gonulluluk" className="scroll-mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-foreground"><HeartHandshake className="h-8 w-8 text-primary"/> Gönüllülük İlanları</h2>
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {ngoOpportunities.map(opp => (
                                <CarouselItem key={opp.id} className="pl-4 md:basis-1/3">
                                    <Card className="flex flex-col h-full bg-card">
                                        <CardHeader>
                                            <CardTitle className="text-base text-foreground line-clamp-2">{opp.title}</CardTitle>
                                            <CardDescription>{opp.location.city} - {opp.commitment}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <p className="text-sm text-muted-foreground line-clamp-3">{opp.description}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button asChild variant="outline" className="w-full">
                                                <Link href={`/volunteering/${opp.id}`}>Hemen Başvur</Link>
                                            </Button>
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
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-foreground"><Newspaper className="h-8 w-8 text-primary"/> Haberler</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ngoPosts.map(post => (
                            <Card key={post.id} className="flex flex-col bg-card">
                                {post.imageUrl && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                                        <Image src={post.imageUrl} alt="Post image" fill className="object-cover"/>
                                    </div>
                                )}
                                <CardHeader className="flex-row items-center gap-3">
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">{post.author.name}</p>
                                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm line-clamp-3">{post.content}</p>
                                </CardContent>
                                <CardFooter>
                                     <Button onClick={() => setSelectedPost(post)} variant="link" className="p-0 h-auto">Devamını Oku</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="sdg" className="scroll-mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-foreground">
                        <Target className="h-8 w-8 text-primary" /> Sürdürülebilir kalkınma için Küresel Amaçlar
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {ngo.supportedSDGs.map((sdg) => (
                           <a href="https://www.kureselamaclar.org" target="_blank" rel="noopener noreferrer" key={sdg}>
                            <div className="p-3 border rounded-lg text-center bg-card flex flex-col items-center justify-center w-36 h-36 hover:bg-accent transition-colors">
                                <p className="text-sm font-semibold text-foreground">{sdg}</p>
                            </div>
                           </a>
                        ))}
                    </div>
                </section>

                <section id="seffaflik" className="scroll-mt-20">
                    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-foreground">
                            <ShieldCheck className="h-8 w-8 text-primary"/> Şeffaflık
                        </h2>
                        <div className="text-center p-4 border-2 border-dashed rounded-xl">
                            <p className="text-sm text-muted-foreground">Şeffaflık Puanı</p>
                            <p className="text-4xl font-bold text-primary">{ngo.transparencyScore}</p>
                        </div>
                    </div>
                    {/* Desktop View */}
                    <Card className="overflow-hidden hidden md:grid grid-cols-1 md:grid-cols-3 bg-card">
                        <div className="md:col-span-1 border-r bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-base text-foreground">Kriterler</CardTitle>
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
                            <h3 className="text-lg font-semibold text-foreground">{selectedDoc.name}</h3>
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
                              <Card className="overflow-hidden bg-card">
                                <AccordionTrigger className="p-3 text-left hover:no-underline">
                                  <div className="flex w-full items-center gap-3 text-sm">
                                    {item.completed ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                                    <span className="flex-1 font-semibold">{item.name}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-3 border-t">
                                    <div className="p-2 border bg-muted rounded-lg text-sm">
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

            <footer id="iletisim" className="bg-white dark:bg-gray-800 border-t mt-12 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left">
                        <div>
                            <h4 className="font-bold text-foreground mb-4">İletişim</h4>
                            <div className="space-y-2 text-sm">
                                <a href={`mailto:${ngo.contact.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /><span>{ngo.contact.email}</span></a>
                                <a href={`tel:${ngo.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /><span>{ngo.contact.phone}</span></a>
                                <a href={ngo.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary"><Globe className="h-4 w-4" /><span>{ngo.contact.website}</span></a>
                                {ngo.contact.address && <div className="flex items-start gap-2 pt-2"><MapPin className="h-4 w-4 mt-1" /><span>{ngo.contact.address.fullAddress}<br/>{ngo.contact.address.district}, {ngo.contact.address.city}</span></div>}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground mb-4">Sosyal Medya</h4>
                            <div className="flex items-center gap-4">
                                <a href={`https://twitter.com/${ngo.contact.social.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-primary/20 text-foreground hover:text-primary"><XIcon className="w-5 h-5" /></a>
                                <a href={`https://instagram.com/${ngo.contact.social.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-primary/20 text-foreground hover:text-primary"><Instagram /></a>
                                <a href={`https://facebook.com/${ngo.contact.social.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-primary/20 text-foreground hover:text-primary"><Facebook /></a>
                                <a href={`https://linkedin.com/company/${ngo.contact.social.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 rounded-full hover:bg-primary/20 text-foreground hover:text-primary"><Linkedin /></a>
                            </div>
                        </div>
                         <div>
                             <h4 className="font-bold text-foreground mb-4">Bağlı Olunan ve Üye Platformlar</h4>
                             <div className="space-y-4">
                                {governingBody && (
                                  <div>
                                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Bağlı Olduğu Kurum</h5>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Landmark className="h-5 w-5 text-muted-foreground" />
                                      <span className="font-semibold text-foreground">{governingBody.name}</span>
                                    </div>
                                  </div>
                                )}
                                {ngo.memberOf && ngo.memberOf.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-muted-foreground mb-1">Üye Olunan Platformlar</h5>
                                        <div className="flex flex-col items-start gap-1 text-sm font-semibold text-foreground">
                                            {ngo.memberOf.map(platform => (
                                                <span key={platform}>{platform}</span>
                                            ))}
                                            <a href="https://hangel.org" target="_blank" rel="noopener noreferrer" className="hover:underline">hangel</a>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                    <div className="border-t pt-8 text-center text-xs text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} {ngo.name}. Tüm hakları saklıdır.</p>
                        <p className="mt-2 flex items-center justify-center gap-1">
                            <a href="https://hangel.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">hangel</a> tarafından güçlendirilmiştir.
                        </p>
                    </div>
                </div>
            </footer>

            <PostDetailDialog post={selectedPost} open={!!selectedPost} onClose={() => setSelectedPost(null)} />
        </div>
    );
}

    
