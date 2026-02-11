
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
    DownloadCloud
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const XIcon = (props: any) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
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
        <p className={fontName.includes('Bold') ? 'font-bold text-3xl' : 'text-3xl'}>Aa</p>
        <p className="text-lg font-semibold">{fontName}</p>
        <Button size="sm" variant="link" className="text-primary" onClick={onDownload}>Fontu tıkla ve indir</Button>
    </div>
);

const ColorCard = ({ hex, name, onCopy }: { hex: string, name: string, onCopy: () => void }) => (
    <div className="border rounded-2xl p-4 text-center space-y-3 bg-white/50 cursor-pointer" onClick={onCopy}>
        <div className="h-16 w-full rounded-lg" style={{ backgroundColor: hex }} />
        <p className="font-bold text-sm">{name}</p>
        <p className="text-xs font-mono text-muted-foreground">{hex}</p>
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
                 <section className="container mx-auto px-4 pt-16 pb-20 text-center space-y-6">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] max-w-5xl mx-auto leading-[0.95]">
                       Dayanışmayı Görünür Kılalım.
                    </h1>
                    <div className="text-lg md:text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed space-y-4">
                        <p>hangel logosu, tüm Sivil Toplum Kuruluşlarına eşit mesafede, kolektif iyiliğin ve dayanışmanın simgesidir.</p>
                        <p>Bu simge, sadece bir görsel kimlik değil; hepimizin ortak değeri, toplumsal sorunlara karşı omuz omuza verdiğimiz inancı temsil eder. Logomuzun doğru ve tutarlı kullanımı, bu ortak iradenin görünür hale gelmesini ve birlikte attığımız adımların daha güçlü duyulmasını sağlar. Siz değerli paydaşlarımız, logomuzu her kullandığınızda, aslında bir dayanışma zincirine yeni bir halka eklemiş oluyorsunuz.</p>
                        <p>Bu sayfada logoyu farklı formatlarda indirebilir, kullanım kurallarını inceleyebilir ve ilham verici örnekleri keşfedebilirsiniz. Gelin, kolektif umudu birlikte büyütelim.</p>
                    </div>
                </section>

                <section className="container mx-auto px-4 mb-24">
                     <Tabs defaultValue="logos" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto h-14 mb-12">
                            <TabsTrigger value="logos" className="h-12 text-sm"><Palette className="mr-2"/>Logolar</TabsTrigger>
                            <TabsTrigger value="fonts" className="h-12 text-sm"><Type className="mr-2"/>Yazı Tipleri</TabsTrigger>
                            <TabsTrigger value="colors" className="h-12 text-sm"><Palette className="mr-2"/>Renkler</TabsTrigger>
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
                
                <section className="container mx-auto px-4 mb-24 space-y-10">
                    <Card className="bg-white rounded-3xl p-10 shadow-lg border">
                         <CardHeader>
                            <CardTitle>hangel Canva Marka Kiti</CardTitle>
                            <CardDescription>Logo kullanımları, renk pantoneleri, yazı fontları, görseller için tıklatınız ve tasarımlarında kulanınız.</CardDescription>
                         </CardHeader>
                         <CardContent>
                             <Button asChild>
                                 <a href="#" target="_blank" rel="noopener noreferrer">Canva Marka Kiti için tıklayınız</a>
                             </Button>
                         </CardContent>
                    </Card>

                    <div className="prose prose-sm md:prose-base max-w-4xl mx-auto text-foreground/80">
                        <h3>hangel marka kullanım izni</h3>
                        <p>hangel’in varlıklarını kullanan kişi ve kurumlar yalnızca tarafımızca belirlenen ve sitemizde bulunan logoları ve ekran görüntülerini kullanmalı ve bu yönergeleri izlemelidir.</p>
                        <p>Yalnızca hangel’in varlıklarını herhangi bir yayında, radyoda, ev dışı reklamda veya 8,5 x 11 inçten (A4 boyutu) daha büyük baskıda kullanmayı planlayanların izin istemesi gerekir. Yazılı olarak talepte bulunulan bu izin ekinde logoyu nasıl kullanmayı planladığınıza dair bir taslak içermelidir.</p>
                        
                        <h3>hangel markasını kullanma</h3>
                        <p>hangel markasını markanızla dengeleyin. Ne kendi markanızadan büyük ne de küçük olmalı.</p>
                        <p>hangel markasını şu şekilde temsil etmekten kaçının:</p>
                        <ul>
                            <li>Ortaklık, sponsorluk veya temsilciliği eklinde,</li>
                            <li>Bir senaryo veya hikaye örgüsünün parçası olarak hangel markasını kullanmak için yazılı izne ihtiyacınız var.</li>
                        </ul>
                        
                        <h3>hangel kelimesini tutarlı tutun</h3>
                        <p>hangel markasını şu şekilde temsil etmekten kaçının:</p>
                        <ul>
                            <li>hangel ‘da “h” harfini büyük harfle yazmayın ve etrafındaki içerikle aynı yazı tipi ve boyutunu kullanın.</li>
                            <li>hangel API’lerini kullanan veya başka şekillerde hangel ile uyumlu veya ilgili olan bir uygulama, web sitesi veya ürün ya da hizmet sunuyorsanız, hangel’e yalnızca uygulamanızın “hangel için” olduğunu veya kampanyanızın adının “hangel ‘da” olduğunu açıklayıcı bir şekilde söylemek için kullanabilirsiniz.</li>
                            <li>hangel kelimesini başka bir dile çevirmeyin, kısaltmayın, farklı bir alfabe karakterleri kullanmayın.</li>
                            <li>“han” veya “gel”ı kendi markanızla birleştirmeyin.</li>
                            <li>hangel markasının hiçbir bölümünü bir STK veya şirket adı, diğer ticari markalar veya genel terimlerle birleştirmeyin.</li>
                        </ul>

                        <h3>hangel’i diğer sosyal ağlarda kullanımı</h3>
                        <ul>
                           <li>hangel’de yer alana STK’lar, Markalar ve kullanıcılar sadece kendi alanları ile diğer sosyal medya alanlarında bahsedebilirler.</li>
                           <li>Farklı marka, kullnıcı ve STK’ların görsellerini, verilerini ve/veya bilgilerini kullanım telifine sahip ilgili kişi ve kurumlardan izin almadıkça kullanmayın.</li>
                           <li>hangel, Facebook, X.com veya diğer sosyal medya şirketleriyle yapılacak bir televizyon reklamında anılabilir.</li>
                           <li>Genel bir “Bizi takip edin…” harekete geçirici mesajı olmadığı sürece, ortağız, birlikteyiz vb. ifadeler ile bahsetmeyin.</li>
                           <li>Eğer hangel kelimesini içeren bir hashtag oluşturduysanız, o hashtag üzerinde hak elde etmeye çalışmamalısınız.</li>
                        </ul>
                        
                        <h3>hangel markasının TV ve filmde kullanımı</h3>
                        <p>hangel’ı yayıncılık alanında kullanırken en önemli şey, topluluğumuzdaki marka ve STK’ların içeriklerine uygun atıflarda bulunmaktır.</p>
                        <p>Bir hangel markası veta STK’sı ile çalışıyorsanız, ilgiliden lütfen hangel profilinizi ekran görüntülerini kullanmak için izin alın.</p>
                        <p>hangel platformundaki tüm STK ve markaların marka kullanım izinleri ilgililerine aittir.</p>

                        <h3>Yasal</h3>
                        <p>hangel, fikri mülkiyetinin geliştirilmesi ve korunması için önemli kaynaklar ayırır. hangel, ticari markalarının ve logolarının dünya çapında tescilini talep etmenin yanı sıra, ticari markalarını kötüye kullanan kişilere karşı haklarını uygular.</p>
                        <p>hangel’nın ticari markaları hangel’a aittir ve yalnızca bu yönergelerde belirtildiği şekilde veya hangel’lin izniyle kullanılabilir. Herhangi bir ticari marka, hizmet markası, şirket adı, ticari ad, kullanıcı adı veya alan adı kaydı dahil olmak üzere herhangi bir hangel ticari markasını kullanamaz, tescil ettiremez veya başka bir şekilde hak iddia edemezsiniz. Herhangi bir ticari markayı, hangel’lin ticari markalarına kafa karıştırıcı derecede benzer veya onları zayıflatacak şekilde, ticari marka olarak veya ticari markanın herhangi bir parçası olarak kullanmamalı veya hak iddia etmemelisiniz. hangel’lin ticari markalarını hangel’lin Hizmet Şartları veya Topluluk Standartları ile tutarsız olacak herhangi bir şey için kullanmayın .</p>
                        <p>hangel’nın ticari markalarını kullanma iznini herhangi bir zamanda iptal edebiliriz. hangel markasıyla tutarsız olduğunu düşündüğü içeriklerin onayını vermeme hakkını saklı tutar.</p>
                    </div>
                </section>
            </main>

             <PublicFooter currentPageLabel="Logo Kullanım Yönergesi" />
        </div>
    );
}
