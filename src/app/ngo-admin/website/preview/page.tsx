
'use client';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
    Mail, Phone, Globe, ShieldCheck, HeartHandshake, Newspaper, BarChart3, Instagram, Facebook, Linkedin, 
    CreditCard, Landmark, MessageSquare, ArrowRight, CheckCircle, AlertCircle, ChevronRight, Menu, MapPin, Target, Award, Calendar, ShoppingBag,
    FileText, Eye
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Copy } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Post } from '@/lib/types';
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

function PreviewContent() {
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
        <div style={themeStyle} className="bg-background text-foreground min-h-screen">
            
            <header className="bg-background/80 shadow-md sticky top-0 z-50 backdrop-blur-lg border-b border-border/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <Link href="#hero" className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={ngo.avatarUrl} />
                            <AvatarFallback>{ngo.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-lg md:text-xl font-bold text-foreground hidden sm:block">{ngo.name}</h1>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-foreground">
                        <a href="#hakkimizda" className="hover:text-primary transition-colors">Hakkımızda</a>
                        <a href="#kampanyalar" className="hover:text-primary transition-colors">Kampanyalar</a>
                        <a href="#gonulluluk" className="hover:text-primary transition-colors">Gönüllülük</a>
                        <a href="#haberler" className="hover:text-primary transition-colors">Haberler</a>
                        <a href="#seffaflik" className="hover:text-primary transition-colors">Şeffaflık</a>
                        <a href="#iletisim" className="hover:text-primary transition-colors">İletişim</a>
                    </nav>
                     <div className="flex items-center gap-2">
                        <Button className="shadow-lg shadow-primary/20">
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

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 md:space-y-16">
                
                {/* 1. Pencere: Hero */}
                <section id="hero" className="relative h-[50vh] max-h-[600px] rounded-[2rem] overflow-hidden flex items-center justify-center text-center text-white shadow-2xl">
                    <Image src={ngo.coverPhotoUrl} alt="Hero" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                    <div className="relative z-10 p-6">
                        <h2 className="text-4xl md:text-7xl font-black tracking-tight drop-shadow-xl mb-4">
                            Dayanışma Güç Verir.
                        </h2>
                        <p className="text-lg md:text-2xl font-medium max-w-3xl mx-auto drop-shadow-lg opacity-90">
                            {ngo.name} ile iyiliğin bir parçası olun, toplumsal değişimi birlikte başlatalım.
                        </p>
                    </div>
                </section>

                {/* 2. Pencere: Hızlı Aksiyon */}
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

                {/* 3. Pencere: İstatistikler */}
                <section id="istatistikler" className="scroll-mt-24">
                    <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden bg-card">
                        <CardHeader className="text-center pt-10">
                            <CardTitle className="text-2xl font-bold tracking-tight">Etkimiz Rakamlarla</CardTitle>
                            <CardDescription>Şeffaf ve ölçülebilir sosyal fayda verilerimiz.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                                <div className="text-center space-y-1">
                                    <p className="text-5xl font-black text-primary tracking-tighter">{ngo.foundationYear}</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kuruluş Yılı</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-5xl font-black text-primary tracking-tighter">+{ngo.stats.volunteers.toLocaleString('tr-TR')}</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gönüllü</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-5xl font-black text-primary tracking-tighter">{ngo.stats.projects}</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tamamlanan Proje</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-5xl font-black text-primary tracking-tighter">1M+</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ulaşılan İnsan</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 4. Pencere: Bağış Kanalları */}
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
                                        <Link href={`/ngos/${ngo.id}`}>Hemen Destek Ol <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                      ) : (
                                        <a href="#">Detaylı Bilgi <ArrowRight className="ml-2 h-4 w-4" /></a>
                                      )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )})}
                        <Card className="rounded-[2rem] border-none shadow-lg bg-card md:col-span-2 overflow-hidden">
                             <CardHeader className="flex-row items-center gap-5 p-8">
                                     <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                        <Landmark className="h-7 w-7" />
                                    </div>
                                    <CardTitle className="text-xl">Banka Transferi (EFT/IBAN)</CardTitle>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="flex-1 space-y-4">
                                        <p className="text-muted-foreground leading-relaxed">Doğrudan banka hesabımıza transfer yaparak çalışmalarımızı destekleyebilirsiniz.</p>
                                        <div className="flex items-center justify-between text-base font-mono tracking-widest p-4 bg-muted rounded-2xl border-2 border-dashed">
                                            <span className="truncate">TR00 0000 0000 0000 0000 0000 00</span>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-primary hover:bg-primary/10" onClick={() => { navigator.clipboard.writeText("TR00 0000 0000 0000 0000 0000 00"); toast({ title: 'IBAN Kopyalandı!' }); }}>
                                                <Copy className="h-5 w-5"/>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto p-6 bg-muted/50 rounded-[2rem] border text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Hızlı Bağış Notu</p>
                                        <p className="text-sm font-bold">Açıklama: BAĞIŞ</p>
                                    </div>
                                </CardContent>
                        </Card>
                     </div>
                </section>
                
                {/* 5. Pencere: İktisadi İşletme */}
                <section id="isletme" className="scroll-mt-24 space-y-8">
                     <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">İktisadi İşletme Mağazası</h2>
                        <p className="text-muted-foreground">Her alışverişiniz doğrudan projelerimize fon sağlamaktadır.</p>
                     </div>
                     <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-2 overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {products.map(product => (
                                <Card key={product.id} className="border-none shadow-none bg-transparent group cursor-pointer">
                                    <CardContent className="p-2 space-y-3">
                                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md group-hover:scale-[1.02] transition-transform">
                                            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button variant="secondary" size="sm" className="rounded-full shadow-lg"><ShoppingBag className="mr-2 h-4 w-4" /> İncele</Button>
                                            </div>
                                        </div>
                                        <div className="px-1">
                                            <p className="font-bold text-xs truncate opacity-80">{product.name}</p>
                                            <p className="text-base font-black text-primary tracking-tighter">{product.price}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="p-6 border-t flex justify-center">
                            <Button variant="outline" className="rounded-full px-10 h-12 font-bold border-primary/20 text-primary hover:bg-primary/5">Mağazanın Tamamını Gör</Button>
                        </div>
                    </Card>
                </section>

                {/* 6. Pencere: Hakkımızda */}
                <section id="hakkimizda" className="scroll-mt-24">
                     <Card className="rounded-[3rem] overflow-hidden border-none shadow-2xl bg-card">
                        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                           <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
                                <div>
                                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] mb-4">Vizyonumuz</Badge>
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">İyiliği Herkes İçin Erişilebilir Kılıyoruz.</h3>
                                </div>
                                <p className={cn("text-lg text-muted-foreground leading-relaxed font-medium", !isAboutExpanded && "line-clamp-6")}>{ngo.about}</p>
                                <Button variant="ghost" className="p-0 h-auto self-start text-primary font-bold hover:bg-transparent" onClick={() => setIsAboutExpanded(!isAboutExpanded)}>
                                    {isAboutExpanded ? 'Daha Az Göster' : 'Kurumsal Hikayemizi Oku'} <ChevronRight className={cn("ml-1 h-5 w-5 transition-transform", isAboutExpanded && "rotate-90")} />
                                </Button>
                                <div className="pt-8 border-t space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Etki Odaklarımız</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {ngo.beneficiaryGroups.map(group => (
                                            <Badge key={group} variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-bold">{group}</Badge>
                                        ))}
                                    </div>
                                </div>
                           </div>
                            <div className="relative bg-muted hidden lg:block">
                                <Image src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Hakkımızda" fill className="object-cover"/>
                                <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent" />
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 7. Pencere: Kampanyalar */}
                {ngo.campaigns && ngo.campaigns.length > 0 && (
                <section id="kampanyalar" className="scroll-mt-24 space-y-10">
                     <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Aktif Kampanyalarımız</h2>
                        <p className="text-muted-foreground">Hedeflerimize birlikte ulaşalım, daha fazla hayata dokunalım.</p>
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {ngo.campaigns.map(campaign => (
                            <Card key={campaign.id} className="rounded-[2.5rem] flex flex-col bg-card overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all">
                                <div className="relative aspect-video w-full">
                                    <Image src={campaign.imageUrl} alt={campaign.title} fill className="object-cover" />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/90 backdrop-blur-md text-primary border-none font-bold uppercase text-[9px] tracking-widest">Acil Destek</Badge>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <CardTitle className="text-2xl mb-4 leading-tight">{campaign.title}</CardTitle>
                                    <p className="text-muted-foreground leading-relaxed mb-8 flex-1">{campaign.description}</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Toplanan</p>
                                                <p className="text-2xl font-black text-primary tracking-tighter">{campaign.currentAmount.toLocaleString('tr-TR')} ₺</p>
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground">{((campaign.currentAmount / campaign.goal) * 100).toFixed(0)}%</p>
                                        </div>
                                        <Progress value={(campaign.currentAmount / campaign.goal) * 100} className="h-3 rounded-full bg-muted shadow-inner" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-widest">Hedef: {campaign.goal.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>
                                <CardFooter className="px-8 pb-8 pt-0">
                                    <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">Kampanyaya Destek Ol</Button>
                                </CardFooter>
                            </Card>
                        ))}
                     </div>
                </section>
                )}

                {/* 8. Pencere: Gönüllülük */}
                <section id="gonulluluk" className="scroll-mt-24 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Gönüllülük İlanları</h2>
                            <p className="text-muted-foreground">Yetkinliklerinizle iyilik hareketini büyütün.</p>
                        </div>
                        <Button variant="outline" className="rounded-full px-8 h-11 font-bold border-primary/20 text-primary">Tüm İlanları Gör</Button>
                    </div>
                    <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-6 overflow-hidden">
                        <Carousel opts={{ align: "start" }} className="w-full">
                            <CarouselContent className="-ml-4">
                                {ngoOpportunities.map(opp => (
                                    <CarouselItem key={opp.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                        <Card className="rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all h-full flex flex-col">
                                            <CardHeader className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><HeartHandshake className="h-5 w-5" /></div>
                                                    <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest">{opp.location.type}</Badge>
                                                </div>
                                                <CardTitle className="text-lg leading-tight line-clamp-2">{opp.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-1.5 pt-1"><MapPin className="h-3 w-3" /> {opp.location.city}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-6 pb-4 flex-1">
                                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{opp.description}</p>
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

                {/* 9. Pencere: Haberler */}
                <section id="haberler" className="scroll-mt-24 space-y-10">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Haberler & Duyurular</h2>
                        <p className="text-muted-foreground">Kuruluşumuzdan en güncel gelişmeler ve faaliyet özetleri.</p>
                    </div>
                    <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ngoPosts.map(post => (
                                <Card key={post.id} className="rounded-3xl overflow-hidden border border-border/50 hover:shadow-xl transition-all h-full flex flex-col group">
                                    {post.imageUrl && (
                                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                                            <Image src={post.imageUrl} alt="Post image" fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                                        </div>
                                    )}
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="h-8 w-8 border">
                                                <AvatarImage src={post.author.avatarUrl} />
                                                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{post.timestamp}</div>
                                        </div>
                                        <CardTitle className="text-lg leading-tight line-clamp-3 group-hover:text-primary transition-colors">{post.content}</CardTitle>
                                    </CardHeader>
                                    <CardFooter className="p-6 pt-0 mt-auto">
                                         <Button onClick={() => setSelectedPost(post)} variant="ghost" className="p-0 h-auto text-primary font-bold">Okumaya Devam Et <ArrowRight className="ml-1 h-4 w-4" /></Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* 10. Pencere: SKA'lar */}
                <section id="sdg" className="scroll-mt-24 space-y-8">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">Küresel Amaçlar İçin Çalışıyoruz</h2>
                    <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-10 overflow-hidden">
                        <div className="flex flex-wrap justify-center gap-6">
                            {ngo.supportedSDGs.map((sdg) => (
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

                {/* 11. Pencere: Şeffaflık */}
                <section id="seffaflik" className="scroll-mt-24 space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Şeffaflık ve Güven</h2>
                            <p className="text-muted-foreground">Tüm verilerimiz ve raporlarımız kamuoyuna açıktır.</p>
                        </div>
                        <Card className="rounded-2xl border-none shadow-xl p-6 bg-primary text-primary-foreground flex flex-col items-center min-w-[180px]">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Şeffaflık Puanı</p>
                            <p className="text-5xl font-black tracking-tighter">{ngo.transparencyScore}</p>
                        </Card>
                    </div>
                    
                    <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-lg bg-card">
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            <div className="md:col-span-1 border-r bg-muted/30">
                                <CardHeader className="p-6 border-b">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Denetim Kriterleri</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {transparencyCriteria.map(item => (
                                            <button
                                                key={item.name}
                                                onClick={() => setSelectedDoc(item)}
                                                className={cn(
                                                    "flex w-full items-center gap-4 p-4 text-left text-sm transition-all border-b last:border-b-0",
                                                    selectedDoc.name === item.name ? "bg-card shadow-md z-10 font-bold" : "hover:bg-muted/50"
                                                )}
                                            >
                                                {item.completed ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />}
                                                <span className="flex-1 truncate">{item.name}</span>
                                                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", selectedDoc.name === item.name && "rotate-90")} />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </div>
                            <div className="md:col-span-2 p-10 flex flex-col justify-center bg-card">
                                <h3 className="text-2xl font-bold tracking-tight mb-6">{selectedDoc.name}</h3>
                                {selectedDoc.completed ? (
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-800">
                                            <CheckCircle className="h-5 w-5 shrink-0" />
                                            <p className="text-sm font-bold">Bu kriter başarıyla karşılanmıştır.</p>
                                        </div>
                                        <div className="p-8 border-2 border-dashed rounded-[2rem] bg-muted/20 flex flex-col items-center justify-center text-center space-y-4">
                                            <FileText className="h-12 w-12 text-muted-foreground/40" />
                                            <div>
                                                <p className="font-bold">Kurumsal Belge Yayında</p>
                                                <p className="text-xs text-muted-foreground mt-1 px-10">İlgili belgenin dijital kopyası yetkili denetiminden geçerek yayına alınmıştır.</p>
                                            </div>
                                            <Button size="sm" variant="outline" className="rounded-full font-bold h-10 px-6">Belgeyi Görüntüle <Eye className="ml-2 h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3 text-amber-800">
                                            <AlertCircle className="h-5 w-5 shrink-0" />
                                            <p className="text-sm font-bold">Bu belge henüz yüklenmemiştir.</p>
                                        </div>
                                        <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-40">
                                            <p className="text-sm font-medium italic">Belge bekliyor...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </section>
            </main>

            {/* 12. Pencere: İletişim (Footer) */}
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
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <a href={`mailto:${ngo.contact.email}`} className="flex items-center gap-3 hover:text-primary transition-colors font-medium"><Mail className="h-4 w-4" /><span>{ngo.contact.email}</span></a>
                                <a href={`tel:${ngo.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-primary transition-colors font-medium"><Phone className="h-4 w-4" /><span>{ngo.contact.phone}</span></a>
                                <a href={ngo.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors font-medium"><Globe className="h-4 w-4" /><span>{ngo.contact.website}</span></a>
                                {ngo.contact.address && (
                                    <div className="flex items-start gap-3 pt-3 border-t">
                                        <MapPin className="h-4 w-4 mt-1 shrink-0" />
                                        <p className="leading-relaxed">
                                            {ngo.contact.address.fullAddress}<br/>
                                            <strong>{ngo.contact.address.district}, {ngo.contact.address.city}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <h4 className="font-black uppercase tracking-[0.2em] text-xs text-muted-foreground pt-3">Sosyal Medya</h4>
                            <div className="flex flex-wrap gap-3">
                                <a href={`https://twitter.com/${ngo.contact.social.twitter}`} target="_blank" rel="noopener noreferrer" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><XIcon className="w-5 h-5" /></a>
                                <a href={`https://instagram.com/${ngo.contact.social.instagram}`} target="_blank" rel="noopener noreferrer" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><Instagram className="w-5 h-5" /></a>
                                <a href={`https://facebook.com/${ngo.contact.social.facebook}`} target="_blank" rel="noopener noreferrer" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><Facebook className="w-5 h-5" /></a>
                                <a href={`https://linkedin.com/company/${ngo.contact.social.linkedin}`} target="_blank" rel="noopener noreferrer" className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><Linkedin className="w-5 h-5" /></a>
                            </div>
                        </div>

                         <div className="space-y-6">
                             <h4 className="font-black uppercase tracking-[0.2em] text-xs text-muted-foreground pt-3">Kurumsal Yapı</h4>
                             <div className="space-y-6">
                                {governingBody && (
                                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Denetleyici Makam</h5>
                                    <div className="flex items-center gap-3 text-xs font-bold leading-snug">
                                      <Landmark className="h-5 w-5 text-primary shrink-0" />
                                      <span>{governingBody.name}</span>
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
                        <p className="text-xs text-muted-foreground font-medium">&copy; {new Date().getFullYear()} {ngo.name}. Tüm hakları saklıdır.</p>
                        <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="text-muted-foreground opacity-60">Powered by</span>
                            <a href="https://hangel.org" target="_blank" rel="noopener noreferrer" className="font-black text-primary hover:scale-105 transition-transform">hangel A.Ş.</a>
                        </div>
                    </div>
                </div>
            </footer>

            <PostDetailDialog post={selectedPost} open={!!selectedPost} onClose={() => setSelectedPost(null)} />
        </div>
    );
}

export default function WebsitePreviewPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Önizleme yükleniyor...</div>}>
            <PreviewContent />
        </Suspense>
    );
}
