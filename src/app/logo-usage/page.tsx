
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    Download, 
    ArrowLeft, 
    FileText, 
    Palette, 
    Type,
    Copy,
    DownloadCloud,
    Star,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsTrigger, TabsList, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionTrigger, AccordionItem, AccordionContent } from '@/components/ui/accordion';

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

export default function LogoUsagePage() {
    const router = useRouter();
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

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30">
             <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Logo Kullanım Yönergesi</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                        <a href="mailto:press@hangel.org">İletişime Geç</a>
                    </Button>
                </div>
            </header>

            <main className="pt-24">
                 <section className="container mx-auto px-4 pt-16 pb-24 text-center space-y-6">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                       Dayanışmayı Görünür Kılalım.
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        hangel logosu yalnızca bir görsel kimlik değil; ortak değerlerimizin, birlikte üretme inancımızın ve toplumsal sorunlara karşı omuz omuza verdiğimiz mücadelenin simgesidir. Logomuzu doğru kullanarak bu ortak iradenin daha güçlü duyulmasına katkı sağlayın.
                    </p>
                </section>

                <section className="container mx-auto px-4 mb-24">
                     <Tabs defaultValue="logos" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto h-auto md:h-14 mb-12">
                            <TabsTrigger value="logos" className="h-14 text-sm"><Palette className="mr-2"/>Logolar</TabsTrigger>
                            <TabsTrigger value="fonts" className="h-14 text-sm"><Type className="mr-2"/>Yazı Tipleri</TabsTrigger>
                            <TabsTrigger value="colors" className="h-14 text-sm"><Palette className="mr-2"/>Renkler</TabsTrigger>
                             <TabsTrigger value="guide" className="h-14 text-sm"><FileText className="mr-2"/>Kimlik Kılavuzu</TabsTrigger>
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
                                   <div className="p-4 bg-primary rounded-2xl w-full h-full flex items-center justify-center">
                                       <span className="text-4xl font-black text-white">h</span>
                                   </div>
                                </LogoDisplayCard>
                            </div>
                        </TabsContent>

                        <TabsContent value="fonts">
                           <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center p-0 mb-8">
                                   <CardTitle>Font Kullanım Yönergesi</CardTitle>
                               </CardHeader>
                               <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-0">
                                   <FontCard title="Logo Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                   <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                   <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                               </CardContent>
                           </Card>
                        </TabsContent>
                        
                        <TabsContent value="colors">
                             <Card className="max-w-4xl mx-auto rounded-3xl p-10 bg-white">
                               <CardHeader className="text-center p-0 mb-8">
                                   <CardTitle>Renk Kullanım Yönergesi</CardTitle>
                                    <CardDescription>Renkler yalnızca belirtilen HEX değerleriyle kullanılmalıdır.</CardDescription>
                               </CardHeader>
                               <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 p-0">
                                   <ColorCard hex="#f34723" name="hangel Mercan" onCopy={() => copyColor('#f34723')} />
                                   <ColorCard hex="#1f1f1f" name="Gece Siyahı" onCopy={() => copyColor('#1f1f1f')} />
                                   <ColorCard hex="#f1f1f1" name="Açık Gri" onCopy={() => copyColor('#f1f1f1')} />
                                   <ColorCard hex="#042654" name="Lacivert" onCopy={() => copyColor('#042654')} />
                               </CardContent>
                           </Card>
                        </TabsContent>
                        
                        <TabsContent value="guide">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="bg-white rounded-3xl p-10 shadow-lg border text-center">
                                    <CardHeader>
                                        <CardTitle>hangel Canva Marka Kiti</CardTitle>
                                        <CardDescription>Logo kullanımları, renk pantoneleri, yazı tipleri, görseller için tıklatınız ve tasarımlarında kulanınız.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button asChild>
                                            <a href="#" target="_blank" rel="noopener noreferrer">Canva Marka Kiti için tıklayınız</a>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white rounded-3xl text-center p-12 space-y-6 shadow-xl">
                                <DownloadCloud className="h-16 w-16 mx-auto text-primary" />
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold">Kurumsal Kimlik Kılavuzu</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">Marka değerlerimizi, logo kullanım standartlarımızı ve iletişim dilimizi içeren rehber.</p>
                                </div>
                                <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold" onClick={() => handleDownload('hangel-brand-guide.pdf')}>
                                        PDF Olarak İndir
                                </Button>
                            </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </section>
                
                {/* Usage Rules Section */}
                <section className="max-w-4xl mx-auto px-4 mb-24">
                     <Accordion type="single" collapsible className="w-full space-y-4">
                        <AccordionItem value="item-1" className="border rounded-2xl px-6 bg-white shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-6 font-bold text-lg">Marka Kullanım İzni ve Genel Kurallar</AccordionTrigger>
                            <AccordionContent className="pt-2 border-t">
                                <div className="prose prose-sm max-w-none text-muted-foreground py-4">
                                     <p>hangel’in varlıklarını kullanan kişi ve kurumlar yalnızca tarafımızca belirlenen ve sitemizde bulunan logoları ve ekran görüntülerini kullanmalı ve bu yönergeleri izlemelidir. Yalnızca hangel’in varlıklarını herhangi bir yayında, radyoda, ev dışı reklamda veya A4 boyutundan daha büyük baskıda kullanmayı planlayanların izin istemesi gerekir. Yazılı olarak talepte bulunulan bu izin ekinde logoyu nasıl kullanmayı planladığınıza dair bir taslak içermelidir.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border rounded-2xl px-6 bg-white shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-6 font-bold text-lg">İsim ve İkon Kullanımı</AccordionTrigger>
                            <AccordionContent className="pt-2 border-t">
                                <div className="prose prose-sm max-w-none text-muted-foreground py-4">
                                    <ul>
                                        <li>"hangel" kelimesinde "h" harfini büyük yazmayın.</li>
                                        <li>hangel API’lerini kullanan bir ürün sunuyorsanız, yalnızca açıklayıcı bir ifade ile “hangel için” ya da “hangel’da” şeklinde kullanabilirsiniz.</li>
                                        <li>"han" veya "gel" ifadelerini kendi markanızla birleştirmeyin.</li>
                                        <li>hangel markasının hiçbir bölümünü bir şirket adı, diğer ticari markalar ya da genel terimlerle birleştirmeyin.</li>
                                        <li>Sosyal medya hesapları veya içerik başlıkları, resmi bir hangel hesabı gibi algılanmamalıdır.</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="border rounded-2xl px-6 bg-white shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-6 font-bold text-lg">Logo Kullanım Kuralları</AccordionTrigger>
                            <AccordionContent className="pt-2 border-t">
                                <div className="prose prose-sm max-w-none text-muted-foreground py-4">
                                    <p><strong>Denge:</strong> hangel logosu, kendi markanızla dengeli kullanılmalı; ne daha büyük ne de daha küçük olmalıdır.</p>
                                    <p><strong>Boşluk Kuralı:</strong> Logonun etrafındaki minimum boşluk, “h” harfinin yüksekliği kadar veya daha fazla olmalıdır. Bu alana metin veya başka bir görsel öğe yerleştirmeyin.</p>
                                    <p><strong>Değişiklik Yapmayın:</strong> Logonun oranları, renkleri veya yapısı değiştirilemez. Üzerine efekt veya gölge eklenemez.</p>
                                    <p><strong>Hiyerarşi:</strong> Logo, ana marka sizin markanız olacak şekilde, destekleyici bir unsur olarak konumlandırılmalıdır.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4" className="border rounded-2xl px-6 bg-white shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-6 font-bold text-lg">Yasal Sorumluluklar</AccordionTrigger>
                            <AccordionContent className="pt-2 border-t">
                                <div className="prose prose-sm max-w-none text-muted-foreground py-4">
                                    <p>hangel, fikri mülkiyetinin geliştirilmesi ve korunması için önemli kaynaklar ayırır. hangel'in ticari markaları yalnızca bu yönergelerde belirtildiği şekilde veya hangel’in yazılı izniyle kullanılabilir. hangel ticari markalarını kafa karıştırıcı derecede benzer veya zayıflatacak şekilde kullanamaz, tescil ettiremez veya hak iddia edemezsiniz. hangel, marka kullanım iznini dilediği zaman iptal etme ve marka değerleriyle tutarsız bulduğu içeriklere onay vermeme hakkını saklı tutar.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
            </main>

             <PublicFooter currentPageLabel="Logo Kullanım Yönergesi" />
        </div>
    );
}
