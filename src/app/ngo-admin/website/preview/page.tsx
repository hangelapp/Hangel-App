'use client';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
    Mail, Phone, Globe, ShieldCheck, HeartHandshake, Newspaper, BarChart3, Twitter, Instagram, Facebook, Linkedin, 
    CreditCard, Landmark, MessageSquare, QrCode, ArrowRight, Download, Eye, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { HangelLogo } from '@/components/icons';
import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';


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
    const ngo = ngos.find(n => n.id === '2'); // Ahbap Derneği
    const [selectedDoc, setSelectedDoc] = React.useState(transparencyCriteria[0]);

    if (!ngo) {
        return <div className="h-screen flex items-center justify-center">Kuruluş bulunamadı.</div>;
    }
    
    // Simulating theme selection
    const theme = {
        primary: '#f34723', // Hangel Orange
        secondary: '#f1f5f9', // Slate 100 for light background
        accent: '#042654', // Hangel Blue for text
        'secondary-foreground': '#475569' // Slate 600
    };

    const ngoPosts = timelinePosts.filter(p => p.author.name === ngo.name).slice(0, 6);
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.ngoId === ngo.id).slice(0,4); 

    const donationMethods = [
        { name: 'Hangel ile', icon: HangelLogo, description: 'Alışverişlerinizle komisyonsuz destek olun.' },
        { name: 'Kredi Kartı ile', icon: CreditCard, description: 'Güvenli ödeme altyapısıyla doğrudan bağış yapın.' },
        { name: 'Banka Transferi (EFT/IBAN)', icon: Landmark, description: 'Doğrudan banka hesabımıza transfer yapın.', iban: 'TR00 0000 0000 0000 0000 0000 00' },
        { name: 'SMS ile', icon: MessageSquare, description: '"AHBAP" yazıp 1234\'e göndererek 20 TL bağış yapabilirsiniz.' },
    ];

    return (
        <div style={{
            '--primary': theme.primary,
            '--secondary': theme.secondary,
            '--accent': theme.accent,
            '--secondary-foreground': theme['secondary-foreground'],
        } as React.CSSProperties} className="bg-[--secondary] text-[--secondary-foreground]">
            
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="#" className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={ngo.avatarUrl} />
                            <AvatarFallback>{ngo.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-xl md:text-2xl font-bold text-[--accent]">{ngo.name}</h1>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-[--accent]">
                        <a href="#hakkimizda" className="hover:text-[--primary]">Hakkımızda</a>
                        <a href="#gonulluluk" className="hover:text-[--primary]">Gönüllülük</a>
                        <a href="#haberler" className="hover:text-[--primary]">Haberler</a>
                        <a href="#seffaflik" className="hover:text-[--primary]">Şeffaflık</a>
                    </nav>
                     <Button className="hidden md:flex bg-[--primary] hover:bg-[--primary]/90 text-white">
                        Bağış Yap
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-16 md:space-y-24">
                
                {/* Hero Section */}
                <section className="relative h-96 rounded-xl overflow-hidden flex items-center justify-center text-center text-white">
                    <Image src={ngo.coverPhotoUrl} alt="Hero" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative z-10 p-4">
                        <h2 className="text-4xl md:text-6xl font-bold drop-shadow-lg">İyiliğin ve Dayanışmanın Adresi</h2>
                        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">Toplumsal fayda için bir araya gelerek, daha güzel bir gelecek inşa ediyoruz.</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Button size="lg" className="bg-[--primary] hover:bg-[--primary]/90 text-white">Bağış Yap</Button>
                            <Button size="lg" variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30">Gönüllü Ol</Button>
                        </div>
                    </div>
                </section>
                
                {/* Donation Methods Section */}
                <section id="destek-yontemleri" className="scroll-mt-20">
                     <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3 text-[--accent]">Desteklerinizle Büyüyoruz</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {donationMethods.map(method => (
                             <Card key={method.name} className="flex flex-col">
                                <CardHeader className="flex-row items-center gap-4">
                                     <div className="p-3 bg-[--primary]/10 rounded-full">
                                        <method.icon className="h-6 w-6 text-[--primary]"/>
                                    </div>
                                    <CardTitle className="text-lg text-[--accent]">{method.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-[--secondary-foreground]">{method.description}</p>
                                    {(method as any).iban && (
                                        <div className="mt-4">
                                            <p className="text-sm font-mono tracking-wider p-3 bg-muted rounded-lg text-center text-foreground">{(method as any).iban}</p>
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ngoOpportunities.map(opp => (
                            <Card key={opp.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg text-[--accent]">{opp.title}</CardTitle>
                                    <CardDescription>{opp.location.city} - {opp.commitment}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-[--secondary-foreground] line-clamp-3">{opp.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full border-[--primary] text-[--primary] hover:bg-[--primary]/10 hover:text-[--primary]">Detayları Gör ve Başvur</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
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
                    <Card className="overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3">
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
                                                selectedDoc.name === item.name ? "bg-accent" : "hover:bg-accent/50"
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
                                    <p className="mt-2 text-green-600 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Bu kriter karşılanmıştır.</p>
                                ) : (
                                    <p className="mt-2 text-yellow-600 flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Bu kriter henüz karşılanmamıştır.</p>
                                )}
                                <p className="mt-4 text-sm text-[--secondary-foreground]">Bu belge veya bilgi, şeffaflığı artırmak amacıyla kuruluş tarafından sağlanmıştır. Detayları görüntülemek veya indirmek için aşağıdaki butonları kullanabilirsiniz.</p>
                                <div className="mt-6 flex gap-2">
                                    <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Görüntüle</Button>
                                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> İndir</Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>
            </main>

             <footer className="bg-white dark:bg-gray-800 border-t mt-12 py-8">
                <div className="container mx-auto text-center text-[--secondary-foreground]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left">
                        <div>
                            <h4 className="font-bold text-[--accent] mb-2">İletişim</h4>
                            <div className="space-y-2 text-sm">
                                <a href={`mailto:${ngo.contact.email}`} className="flex items-center gap-2 hover:text-[--primary]"><Mail className="h-4 w-4" /><span>{ngo.contact.email}</span></a>
                                <a href={`tel:${ngo.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-[--primary]"><Phone className="h-4 w-4" /><span>{ngo.contact.phone}</span></a>
                                <a href={ngo.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[--primary]"><Globe className="h-4 w-4" /><span>{ngo.contact.website}</span></a>
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
                        hangel tarafından güçlendirilmiştir. 
                        <HangelLogo className="h-4 w-4" />
                    </p>
                </div>
            </footer>
        </div>
    );
}
