
'use client';

import React, { useState } from 'react';
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
    CheckCircle,
    Landmark,
    Ruler,
    Scale,
    Handshake,
    Mic,
    Newspaper,
    Tv
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    <div className="border rounded-2xl bg-white/50 text-center flex flex-col shadow-sm hover:shadow-lg transition-shadow">
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
    <div className="border rounded-2xl p-6 text-center space-y-3 bg-white/50 shadow-sm hover:shadow-xl transition-shadow">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <p className={cn("text-3xl", fontName.includes('Bold') && 'font-bold', fontName.includes('SemiBold') && 'font-semibold')}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, onCopy }: { hex: string, name: string, onCopy: () => void }) => (
    <div className="border rounded-2xl p-4 text-center space-y-3 bg-white/50 cursor-pointer shadow-sm hover:shadow-xl transition-shadow group" onClick={onCopy}>
        <div className="h-16 w-full rounded-lg" style={{ backgroundColor: hex }} />
        <p className="font-bold text-sm">{name}</p>
        <div className="flex items-center justify-center gap-1 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
            {hex} <Copy className="w-3 h-3" />
        </div>
    </div>
);


const RuleCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <Card className="rounded-2xl bg-muted/30 border-none">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg"><Icon className="h-5 w-5 text-primary" />{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
            <div className="prose prose-sm max-w-none text-muted-foreground border-t pt-4">
                {children}
            </div>
        </CardContent>
    </Card>
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
                        hangel logosu, kolektif iyiliğin ve dayanışmanın simgesidir. Doğru ve tutarlı kullanımı, bu ortak iradenin daha güçlü duyulmasına katkı sağlar.
                    </p>
                </section>
                
                 <section className="container mx-auto px-4 mb-24">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-6 md:p-10">
                        <CardHeader className="p-0 mb-12 text-center">
                            <CardTitle className="text-3xl font-bold tracking-tight">Medya Kiti</CardTitle>
                            <CardDescription>Logolar, yazı tipleri, renkler ve rehberler.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 space-y-16">
                            
                            {/* --- LOGOLAR --- */}
                            <div className="space-y-8">
                                <h3 className="text-center text-xl font-bold tracking-tight">Logolar</h3>
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
                                        <div className="p-4 bg-primary rounded-2xl"><span className="text-4xl font-black text-white">h</span></div>
                                    </LogoDisplayCard>
                                </div>
                            </div>

                            {/* --- YAZI TİPLERİ --- */}
                            <div className="space-y-8 pt-12 border-t">
                                <h3 className="text-center text-xl font-bold tracking-tight">Yazı Tipleri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FontCard title="Logo Fontu" fontName="Poppins Bold" onDownload={() => handleDownload('poppins-bold.ttf')} />
                                    <FontCard title="Başlık Fontu" fontName="Poppins SemiBold" onDownload={() => handleDownload('poppins-semibold.ttf')} />
                                    <FontCard title="Metin Fontu" fontName="Poppins Regular" onDownload={() => handleDownload('poppins-regular.ttf')} />
                                </div>
                                <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto">Tipografik bütünlük, marka algısının sürekliliği açısından zorunludur. Farklı font kullanımı marka tutarlılığını zedeler.</p>
                            </div>

                            {/* --- RENKLER --- */}
                            <div className="space-y-8 pt-12 border-t">
                                <h3 className="text-center text-xl font-bold tracking-tight">Renkler</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <ColorCard hex="#f34723" name="hangel Mercan" onCopy={() => copyColor('#f34723')} />
                                <ColorCard hex="#1f1f1f" name="Gece Siyahı" onCopy={() => copyColor('#1f1f1f')} />
                                <ColorCard hex="#f1f1f1" name="Açık Gri" onCopy={() => copyColor('#f1f1f1')} />
                                <ColorCard hex="#042654" name="Lacivert" onCopy={() => copyColor('#042654')} />
                                </div>
                                <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto">Renkler yalnızca belirtilen HEX değerleriyle kullanılmalıdır. Ton, gölge veya gradyan uygulamaları marka bütünlüğünü bozacak şekilde değiştirilmemelidir.</p>
                            </div>

                            {/* --- REHBERLER --- */}
                            <div className="space-y-8 pt-12 border-t">
                                <h3 className="text-center text-xl font-bold tracking-tight">Rehberler</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-muted/30 rounded-3xl p-8 text-center shadow-none border-dashed border-2">
                                        <CardHeader className="p-0">
                                            <CardTitle>hangel Canva Marka Kiti</CardTitle>
                                            <CardDescription>Logo, renk, yazı tipi ve görsellere Canva üzerinden erişin.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0 mt-6">
                                            <Button asChild>
                                                <a href="#" target="_blank" rel="noopener noreferrer">Canva Marka Kitine Git</a>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-muted/30 rounded-3xl text-center p-8 shadow-none border-dashed border-2">
                                        <CardHeader className="p-0">
                                            <CardTitle>Kurumsal Kimlik Kılavuzu</CardTitle>
                                            <CardDescription>Marka değerleri, logo standartları ve iletişim dili rehberi.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0 mt-6">
                                            <Button onClick={() => handleDownload('hangel-brand-guide.pdf')}>PDF Olarak İndir</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </section>
                
                 <section className="container mx-auto px-4 mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Kullanım Kuralları</h2>
                        <p className="text-muted-foreground mt-2">Marka varlıklarımızın doğru kullanımı için lütfen bu yönergeleri izleyin.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RuleCard title="Marka Mimarisi ve Hiyerarşi" icon={Landmark}>
                            <p><strong>Ana Marka:</strong> hangel</p>
                            <p><strong>Alt Markalar:</strong> hangel imece, hangel bağış, hangel clubs, Sosyal İnovasyon Merkezi vb. tüm alt markalar ana marka çatısı altındadır.</p>
                            <p><strong>Hiyerarşi:</strong> hangel logosu destekleyici bir unsur olarak konumlandırılmalıdır. Ana marka her zaman iş birliği yapan kurumun kendi markasıdır. Logo, en baskın görsel öğe olarak kullanılmamalıdır.</p>
                        </RuleCard>
                         <RuleCard title="Logo Boyut ve Boşluk Kuralları" icon={Ruler}>
                            <h4>Minimum Boyut Kuralı</h4>
                            <ul>
                                <li><strong>Dijital Ortam:</strong> Minimum genişlik: 120px</li>
                                <li><strong>Basılı Materyal:</strong> Minimum genişlik: 25mm</li>
                            </ul>
                            <h4>Boşluk (Clear Space) Kuralı</h4>
                            <p>Logonun etrafındaki minimum güvenli alan, logo içindeki "h" harfinin yüksekliği kadar olmalıdır. Bu alana metin, görsel veya başka bir grafik öğe yerleştirilemez.</p>
                        </RuleCard>
                        <RuleCard title="Ortak Markalama (Co-Branding)" icon={Handshake}>
                             <p>Ortak kampanya ve sponsorluk durumlarında logolar eşit ölçekte, yatay hizada ve aralarında minimum "h yüksekliği" kadar boşluk bırakılarak kullanılmalıdır. Birleşik tek bir görsel kilit (lock-up) oluşturulamaz.</p>
                        </RuleCard>
                        <RuleCard title="İsim ve Metin Kullanımı" icon={Newspaper}>
                            <ul>
                                <li>"hangel" kelimesinde "h" harfi büyük yazılamaz.</li>
                                <li>İzin verilen kullanım: “hangel için geliştirilmiştir”, “hangel ile uyumludur”, “hangel platformunda yer alır”.</li>
                                <li>Yasaklı kullanım: “hangelPro”, “hangelClubX” gibi birleştirmeler yapılamaz.</li>
                                <li>Sosyal medya hesap isimleri resmi bir hesap algısı yaratmamalıdır. (Örn: "hangel Haber" yerine "hangel hakkında haberler")</li>
                            </ul>
                        </RuleCard>
                         <RuleCard title="Medya ve Yayın Kullanımı" icon={Tv}>
                             <p>TV, film, radyo, açık hava reklamları ve A4 boyutundan büyük baskı materyallerinde kullanım için yazılı izin alınması zorunludur. Yayın içeriklerinde, platformdaki marka ve STK'lara doğru atıf yapılması esastır. Ekran görüntüleri kullanımı için ilgili kurumdan izin alınmalıdır.</p>
                        </RuleCard>
                        <RuleCard title="Yasal Çerçeve" icon={Scale}>
                            <p>hangel ticari markaları hangel'e aittir ve yalnızca bu yönergelerde belirtildiği şekilde veya yazılı izinle kullanılabilir. hangel'in ticari markalarını kullanarak herhangi bir hak iddia edemezsiniz. Marka değerleriyle tutarsız olduğu düşünülen içeriklere onay vermeme ve marka kullanım iznini dilediği zaman tek taraflı olarak iptal etme hakkı saklı tutar.</p>
                        </RuleCard>
                    </div>
                </section>
                
                <section className="container mx-auto px-4 my-24 text-center">
                     <Card className="bg-primary text-primary-foreground rounded-[2.5rem] p-12 shadow-2xl shadow-primary/20">
                        <h3 className="text-3xl font-bold mb-2">Marka bir görselden ibaret değildir.</h3>
                        <p className="opacity-80 mb-6">Marka, bir taahhüttür.</p>
                     </Card>
                </section>
            </main>

            <PublicFooter currentPageLabel="Logo Kullanım Yönergesi" />
        </div>
    );
}
