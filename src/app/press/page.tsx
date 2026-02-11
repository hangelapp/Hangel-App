
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, ArrowLeft, Download, FileText, Image as ImageIcon, Video, Palette, Mic, Rss, Users, Globe, BarChart3, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const StatCard = ({ icon: Icon, value, label }: { icon: any, value: string, label: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-black/5 text-center transition-all hover:scale-105 hover:shadow-xl">
        <Icon className="h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-4xl font-black tracking-tighter text-[#1d1d1f]">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
);

const LogoCard = ({ title, children, svgAction, pngAction }: { title: string, children: React.ReactNode, svgAction: () => void, pngAction: () => void }) => (
    <div className="border rounded-2xl p-6 text-center space-y-4 bg-white/50">
        <div className="h-24 w-full flex items-center justify-center p-4">
            {children}
        </div>
        <h4 className="font-bold text-sm pt-2">{title}</h4>
        <div className="flex gap-2 justify-center">
            <Button size="sm" variant="ghost" className="text-xs" onClick={svgAction}>SVG İndir</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={pngAction}>PNG İndir</Button>
        </div>
    </div>
);

export default function PressPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleDownload = (file: string) => {
        toast({
            title: "İndirme Başlatılıyor",
            description: `${file} indiriliyor...`,
        });
    };

    const pressReleases = [
        { date: '25.07.2024', title: 'Hangel, Sosyal Etki Raporu 2024\'ü Yayınladı', lang: 'TR' },
        { date: '15.06.2024', title: 'Hangel Launches "Campus Ambassador" Program Across 21 Countries', lang: 'EN' },
        { date: '01.05.2024', title: 'Yeni İşbirliği: Hangel ve Türkiye\'nin Önde Gelen 50 Markası Güçlerini Birleştirdi', lang: 'TR' }
    ];
    
    const corporatePhotos = [
        { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop", alt: "Ekip Toplantısı", hint: "diverse team meeting" },
        { src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2070&auto=format&fit=crop", alt: "Ofis Ortamı", hint: "modern office workspace" },
        { src: "https://images.unsplash.com/photo-1573496545738-604081fb7c2c?q=80&w=2070&auto=format&fit=crop", alt: "Kurucu Portresi", hint: "ceo portrait professional" },
        { src: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop", alt: "Gönüllülük Etkinliği", hint: "volunteers working community" }
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
                        <Link href="/support">İletişime Geç</Link>
                    </Button>
                </div>
            </header>

            <main className="pt-24">
                {/* Hero */}
                <section className="container mx-auto px-4 pt-16 pb-24 text-center space-y-6">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                        hangel'in Hikayesi. <br /> Dünyayla Paylaşın.
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        Resmi duyurular, medya kaynakları ve kurumsal kimlik materyallerimiz.
                    </p>
                </section>

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
                        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto h-14 mb-12">
                            <TabsTrigger value="logos" className="h-12 text-sm"><Palette className="mr-2"/>Logolar</TabsTrigger>
                            <TabsTrigger value="photos" className="h-12 text-sm"><ImageIcon className="mr-2"/>Fotoğraflar</TabsTrigger>
                            <TabsTrigger value="videos" className="h-12 text-sm"><Video className="mr-2"/>Videolar</TabsTrigger>
                            <TabsTrigger value="guide" className="h-12 text-sm"><FileText className="mr-2"/>Kimlik Klavuzu</TabsTrigger>
                        </TabsList>

                        <TabsContent value="logos">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <LogoCard title="Primary Logo" svgAction={() => handleDownload('logo-primary.svg')} pngAction={() => handleDownload('logo-primary.png')}>
                                    <HangelLogo className="text-5xl" />
                                </LogoCard>
                                <LogoCard title="Siyah Logo" svgAction={() => handleDownload('logo-black.svg')} pngAction={() => handleDownload('logo-black.png')}>
                                    <HangelLogo className="text-5xl text-[#1d1d1f]" />
                                </LogoCard>
                                <LogoCard title="Beyaz Logo" svgAction={() => handleDownload('logo-white.svg')} pngAction={() => handleDownload('logo-white.png')}>
                                    <div className="bg-black rounded-lg p-2 flex-1 flex items-center justify-center">
                                       <HangelLogo className="text-5xl text-white" />
                                    </div>
                                </LogoCard>
                                <LogoCard title="Sembol" svgAction={() => handleDownload('symbol.svg')} pngAction={() => handleDownload('symbol.png')}>
                                   <div className="p-4 bg-primary rounded-2xl"><Mic className="h-10 w-10 text-white" /></div>
                                </LogoCard>
                            </div>
                        </TabsContent>
                        <TabsContent value="photos">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {corporatePhotos.map((photo, i) => (
                                    <div key={i} className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                                        <Image src={photo.src} alt={photo.alt} fill className="object-cover" data-ai-hint={photo.hint} />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button onClick={() => handleDownload(`${photo.alt}.jpg`)}><Download className="mr-2"/>İndir</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="videos">
                             <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
                                <Video className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                <p>Video arşivi yakında burada olacak.</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="guide">
                           <Card className="max-w-3xl mx-auto rounded-3xl text-center p-12 space-y-6 shadow-xl">
                               <FileText className="h-16 w-16 mx-auto text-primary" />
                               <div className="space-y-1">
                                   <h3 className="text-2xl font-bold">Kurumsal Kimlik Kılavuzu</h3>
                                   <p className="text-muted-foreground max-w-md mx-auto">Marka değerlerimizi, logo kullanım standartlarımızı ve iletişim dilimizi içeren rehber.</p>
                               </div>
                               <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                    Hemen İndir
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
                            <a href="mailto:press@hangel.com">press@hangel.com</a>
                        </Button>
                     </Card>
                </section>
            </main>

            <PublicFooter currentPageLabel="Basın Odası" />
        </div>
    );
}
