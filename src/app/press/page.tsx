
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, ArrowLeft, Download, FileText, Image as ImageIcon, Video, Palette, Mic, Rss, Users, Globe, BarChart3, TrendingUp, DownloadCloud, Type, Copy
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebPage } from '@/hooks/use-site-content';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const StatCard = ({ icon: Icon, value, label }: { icon: any, value: string, label: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-black/5 text-center transition-all hover:scale-105 hover:shadow-xl">
        <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-4xl font-black tracking-tighter text-[#1d1d1f]">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
);

const LogoDisplayCard = ({ title, description, children, onDownload }: { title: string, description: string, children: React.ReactNode, onDownload: () => void }) => (
    <div className="border rounded-2xl bg-white/50 text-center flex flex-col">
        <div className="h-32 w-full flex items-center justify-center p-6 bg-muted/30 rounded-t-2xl">
            {children}
        </div>
        <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-bold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
            <Button size="sm" variant="outline" className="text-xs mt-4 w-full" onClick={onDownload}>
                <Download className="mr-2 h-3.5 w-3.5"/> PNG İndir
            </Button>
        </div>
    </div>
);

const FontCard = ({ title, fontName, onDownload }: { title: string, fontName: string, onDownload: () => void }) => (
    <div className="border rounded-2xl p-6 text-center space-y-3 bg-white/50">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-3xl", fontName.includes('Bold') && 'font-bold', fontName.includes('SemiBold') && 'font-semibold')}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, onCopy }: { hex: string, name: string, onCopy: () => void }) => (
    <div className="border rounded-2xl p-4 text-center space-y-3 bg-white/50 cursor-pointer" onClick={onCopy}>
        <div className="h-16 w-full rounded-lg" style={{ backgroundColor: hex }} />
        <p className="font-bold text-sm">{name}</p>
        <div className="flex items-center justify-center gap-1 text-xs font-mono text-muted-foreground">
            {hex} <Copy className="w-3 h-3" />
        </div>
    </div>
);


export default function PressPage() {
    const router = useRouter();
    const cms = useWebPage('press');
    const { toast } = useToast();

    const handleDownload = (file: string) => {
        toast({
            title: "İndirme Başlatılıyor",
            description: `${file} indiriliyor...`,
        });
    };
    
    const copyColor = (hex: string) => {
        navigator.clipboard.writeText(hex);
        toast({
            title: "Renk Kodu Kopyalandı",
            description: `${hex} panoya kopyalandı.`,
        });
    };

    const pressReleases = [
        { date: '25.07.2024', title: 'Hangel, Sosyal Etki Raporu 2024\'ü Yayınladı', lang: 'TR' },
        { date: '15.06.2024', title: 'Hangel Launches "Campus Ambassador" Program Across 21 Countries', lang: 'EN' },
        { date: '01.05.2024', title: 'Yeni İşbirliği: Hangel ve Türkiye\'nin Önde Gelen 50 Markası Güçlerini Birleştirdi', lang: 'TR' }
    ];

    const photos = [
        { id: 1, src: 'https://storage.googleapis.com/project-123-bucket/image.jpg', alt: 'Kurucu Sosyal Girişimci', hint: 'founder portrait' },
        { id: 2, src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop', alt: 'Ofiste çalışan ekip', hint: 'office team working' },
        { id: 3, src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop', alt: 'Toplantı odasında beyin fırtınası', hint: 'meeting brainstorming' },
        { id: 4, src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop', alt: 'Gönüllüler bir araya geliyor', hint: 'volunteers meeting' },
        { id: 5, src: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop', alt: 'Uygulama Arayüzü', hint: 'app ui design' },
        { id: 6, src: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1974&auto=format&fit=crop', alt: 'Mobil Uygulama Ekranı', hint: 'mobile app screen' },
        { id: 7, src: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=2070&auto=format&fit=crop', alt: 'Telefon Ekranı', hint: 'phone screen' },
        { id: 8, src: 'https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop', alt: 'Dayanışma içinde insanlar', hint: 'people solidarity' },
        { id: 9, src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop', alt: 'Kurumsal sunum', hint: 'corporate presentation' },
        { id: 10, src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop', alt: 'Mutlu ve çeşitli bir topluluk', hint: 'happy diverse community' },
    ];
    
    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Basın Odası</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                        <a href="mailto:press@hangel.org">İletişime Geç</a>
                    </Button>
                </div>
            </header>

            <main className="pt-24">
                {/* Hero */}
                <section className="container mx-auto px-4 pt-16 pb-24 text-center space-y-6">
                    {cms.subtitle && (
                        <p className="text-sm md:text-base font-bold uppercase tracking-widest text-primary">{cms.subtitle}</p>
                    )}
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                        {cms.title || (<>hangel'in Hikayesi. <br /> Dünyayla Paylaşın.</>)}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        {cms.description || 'Resmi duyurular, medya kaynakları ve kurumsal kimlik materyallerimiz.'}
                    </p>
                    {cms.heroImageUrl && (
                        <div className="relative w-full max-w-5xl mx-auto aspect-[21/9] rounded-3xl overflow-hidden mt-8 shadow-xl">
                            <Image src={cms.heroImageUrl} alt={cms.title || 'Basın Odası'} fill className="object-cover" />
                        </div>
                    )}
                </section>

                {cms.body && (
                    <section className="container mx-auto px-4 mb-16 max-w-4xl">
                        <Card className="rounded-[2.5rem] border-none shadow-lg bg-white">
                            <CardContent className="p-8 prose prose-lg max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: cms.body }} />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Stats */}
                <section className="container mx-auto px-4 mb-24">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard icon={Globe} value="21" label="Ülkede Aktif" />
                        <StatCard icon={Users} value="1.2M+" label="Kullanıcı" />
                        <StatCard icon={BarChart3} value="12.5M ₺" label="Toplam Etki" />
                        <StatCard icon={TrendingUp} value="%120" label="Yıllık Büyüme" />
                    </div>
                </section>
                
                {/* Press Releases */}
                <section className="container mx-auto px-4 mb-24">
                     <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl"><Rss className="h-6 w-6 text-primary" /> Basın Bültenleri</CardTitle>
                            <CardDescription>En son haberler ve duyurular.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pressReleases.map((release, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl bg-muted/30 hover:bg-muted/70 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-bold">{release.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{release.date} • <span className="font-semibold">{release.lang}</span></p>
                                    </div>
                                    <div className="flex gap-2 mt-3 sm:mt-0">
                                        <Button size="sm" variant="ghost" onClick={() => handleDownload(`${release.title}.pdf`)}><Download className="mr-2 h-4 w-4" /> İndir</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                     </Card>
                </section>

                {/* Media Kit */}
                <section className="container mx-auto px-4 mb-24">
                    <Tabs defaultValue="logos" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-4xl mx-auto h-auto mb-12">
                            <TabsTrigger value="logos" className="h-12 text-sm"><Palette className="mr-2"/>Logolar</TabsTrigger>
                            <TabsTrigger value="fonts" className="h-12 text-sm"><Type className="mr-2"/>Yazı Tipleri</TabsTrigger>
                            <TabsTrigger value="colors" className="h-12 text-sm"><Palette className="mr-2"/>Renkler</TabsTrigger>
                            <TabsTrigger value="photos" className="h-12 text-sm"><ImageIcon className="mr-2"/>Kurumsal Fotoğraflar</TabsTrigger>
                            <TabsTrigger value="guide" className="h-12 text-sm"><FileText className="mr-2"/>Kimlik Klavuzu</TabsTrigger>
                        </TabsList>

                        <TabsContent value="logos">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <LogoDisplayCard title="Birincil Logo" description="Zeminsiz Logo (PNG)" onDownload={() => handleDownload('birincil-logo.png')}>
                                    <HangelLogo className="text-5xl text-primary" />
                                </LogoDisplayCard>
                                 <LogoDisplayCard title="İkincil Logo" description="Zeminli Logo (PNG)" onDownload={() => handleDownload('ikincil-logo.png')}>
                                    <div className="p-4 bg-primary rounded-2xl"><HangelLogo className="text-5xl text-white" /></div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="Üçüncül Logo" description="Beyaz logo (PNG) (Zorunlu hallerde)" onDownload={() => handleDownload('beyaz-logo.png')}>
                                    <div className="p-4 bg-black rounded-2xl w-full h-full flex items-center justify-center">
                                       <HangelLogo className="text-5xl text-white" />
                                    </div>
                                </LogoDisplayCard>
                                <LogoDisplayCard title="App Icon" description="(PNG)" onDownload={() => handleDownload('app-icon.png')}>
                                   <div className="p-4 bg-primary rounded-2xl"><Mic className="h-10 w-10 text-white" /></div>
                                </LogoDisplayCard>
                            </div>
                        </TabsContent>

                        <TabsContent value="fonts">
                           <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>Font Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                   <FontCard title="Logo Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                   <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                   <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                               </CardContent>
                           </Card>
                        </TabsContent>
                        
                        <TabsContent value="colors">
                             <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center">
                                   <CardTitle>Renk Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                                   <ColorCard hex="#f34723" name="hangel Mercan" onCopy={() => copyColor('#f34723')} />
                                   <ColorCard hex="#1f1f1f" name="Gece Siyahı" onCopy={() => copyColor('#1f1f1f')} />
                                   <ColorCard hex="#f1f1f1" name="Açık Gri" onCopy={() => copyColor('#f1f1f1')} />
                                   <ColorCard hex="#042654" name="Lacivert" onCopy={() => copyColor('#042654')} />
                               </CardContent>
                           </Card>
                        </TabsContent>
                        
                        <TabsContent value="photos">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {photos.map((photo) => (
                                    <Card key={photo.id} className="rounded-2xl overflow-hidden group">
                                        <CardContent className="p-0">
                                            <div className="relative aspect-[4/3] w-full">
                                                <Image src={photo.src} alt={photo.alt} fill className="object-cover" data-ai-hint={photo.hint} />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-3 bg-muted/50">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="w-full text-xs"
                                                onClick={() => handleDownload(`kurumsal-fotograf-${photo.id}.jpg`)}
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Yüksek Çözünürlüklü İndir
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="guide">
                           <Card className="max-w-3xl mx-auto rounded-3xl text-center p-12 space-y-6 shadow-xl bg-white">
                               <DownloadCloud className="h-16 w-16 mx-auto text-primary" />
                               <div className="space-y-1">
                                   <h3 className="text-2xl font-bold">Kurumsal Kimlik Kılavuzu</h3>
                                   <p className="text-muted-foreground max-w-md mx-auto">Marka değerlerimizi, logo kullanım standartlarımızı ve iletişim dilimizi içeren rehber.</p>
                               </div>
                               <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                    PDF Olarak İndir
                               </Button>
                           </Card>
                        </TabsContent>
                    </Tabs>
                </section>
                
                {/* Contact */}
                <section className="container mx-auto px-4 my-24">
                     <Card className="bg-black text-white rounded-[2.5rem] p-12 text-center shadow-2xl">
                        <h3 className="text-3xl font-bold mb-2">Medya İletişim</h3>
                        <p className="text-white/70 mb-6">Basın ve medya talepleriniz için bize ulaşın.</p>
                        <Button asChild variant="secondary" size="lg" className="rounded-full h-14 px-10 text-lg font-bold">
                            <a href="mailto:press@hangel.org">press@hangel.org</a>
                        </Button>
                     </Card>
                </section>
            </main>

            <PublicFooter currentPageLabel="Basın Odası" />
        </div>
    );
}
