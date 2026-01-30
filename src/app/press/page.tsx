
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, XCircle, FileText, Rss, Package, CheckCircle2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HangelLogo } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PressPage() {
  const router = useRouter();

  const logoAssets = [
    { format: 'SVG (Vektörel)', link: '#', desc: 'Baskı ve yüksek çözünürlüklü kullanımlar için.' },
    { format: 'PNG (Şeffaf)', link: '#', desc: 'Web ve sunum dosyaları için.' },
    { format: 'PDF', link: '#', desc: 'Dökümantasyon ve arşivleme için.' },
  ];
  
  const colors = [
      { name: 'Hangel Mercan (Primary)', hex: '#f34723', usage: 'Logotype ve ana butonlar' },
      { name: 'Gece Mavisi (Foreground)', hex: '#042654', usage: 'Başlıklar ve vurgulu metinler' },
      { name: 'Saf Beyaz (Background)', hex: '#ffffff', usage: 'Genel arka plan' },
      { name: 'Sis Grisi (Muted)', hex: '#f5f5f5', usage: 'İkincil alanlar' },
  ];

  const guidelines = [
      { title: 'Negatif Alan', text: 'Logonun çevresinde "h" harfi yüksekliği kadar boşluk bırakılmalıdır.' },
      { title: 'Minimum Boyut', text: 'Okunabilirlik için logotype genişliği dijitalde 80px, baskıda 20mm altına düşmemelidir.' },
      { title: 'Zemin Kullanımı', text: 'Logo tercihen beyaz veya çok açık gri zeminlerde kullanılmalıdır.' },
  ];

  const donts = [
      { text: 'Logonun renk paleti dışındaki renklerle kullanımı.' },
      { text: 'Logoyu oranlarını bozacak şekilde (aspekt oranı) değiştirmek.' },
      { text: 'Logoya gölge, eğim veya kabartma gibi efektler eklemek.' },
      { text: 'Logoyu karmaşık ve düşük kontrastlı görsellerin üzerine koymak.' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Kurumsal Basın Odası</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Hangel marka kimliği, basın bültenleri ve medya materyalleri için resmi kaynak merkezi.
        </p>
      </div>

      <Tabs defaultValue="kit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="releases">Basın Bültenleri</TabsTrigger>
          <TabsTrigger value="news">Haberler</TabsTrigger>
          <TabsTrigger value="kit">Medya Kiti & Logo</TabsTrigger>
        </TabsList>

        <TabsContent value="releases" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Güncel Basın Bültenleri</CardTitle>
                    <CardDescription>Resmi duyurularımızı buradan takip edebilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { title: 'Hangel, 2024 Yılı Sosyal Etki Raporu’nu Kamuoyuyla Paylaştı', date: '25 Temmuz 2024' },
                        { title: 'Yeni İşbirliği: Hangel ve Önde Gelen Markalar Eğitimi Destekliyor', date: '10 Haziran 2024' },
                        { title: 'Hangel QR Ödeme Sistemi ile Bağışçılıkta Dijital Dönüşüm', date: '15 Mayıs 2024' }
                    ].map((release, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <div>
                                <p className="font-semibold text-base">{release.title}</p>
                                <p className="text-sm text-muted-foreground">{release.date}</p>
                            </div>
                            <Download className="h-5 w-5 text-muted-foreground" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="news" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Rss className="h-5 w-5 text-primary"/> Basında Biz</CardTitle>
                    <CardDescription>Hangel hakkında yayınlanmış seçkin haberler.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {[
                        { outlet: 'Webrazzi', title: 'Sosyal Etkinin Yeni Nesil Platformu: Hangel', type: 'Analiz' },
                        { outlet: 'Bloomberg HT', title: 'Girişim Dünyasında Sosyal Sorumluluk Modelleri', type: 'Röportaj' },
                        { outlet: 'Anadolu Ajansı', title: 'Dijital Bağış Sistemlerinde Şeffaflık Devrimi', type: 'Haber' },
                        { outlet: 'Ekonomist', title: '2024’ün En Etkili Sosyal Girişimleri', type: 'Liste' }
                    ].map((news, i) => (
                        <div key={i} className="p-4 border rounded-lg space-y-2">
                            <Badge variant="secondary" className="mb-2">{news.outlet}</Badge>
                            <p className="font-bold">{news.title}</p>
                            <Button variant="link" className="p-0 h-auto text-primary">Habere Git</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="kit" className="mt-6 space-y-8">
            {/* Logo Usage Section */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl"><Package className="h-6 w-6 text-primary"/> Logo Kullanım Rehberi</CardTitle>
                        <CardDescription>Hangel marka varlıklarını kullanırken tutarlılığı korumak için lütfen bu rehbere uyun.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="p-12 border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-8">
                            <HangelLogo className="text-7xl" />
                            <p className="text-sm text-muted-foreground italic">hangel ana logotype (pozitif kullanım)</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {logoAssets.map((asset) => (
                                <div key={asset.format} className="p-4 border rounded-lg space-y-3 flex flex-col">
                                    <p className="font-bold">{asset.format}</p>
                                    <p className="text-xs text-muted-foreground flex-1">{asset.desc}</p>
                                    <Button size="sm" className="w-full"><Download className="mr-2 h-4 w-4" /> İndir</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Renk Paleti</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            {colors.map(c => (
                                <div key={c.name} className="space-y-2">
                                    <div className="h-16 rounded-md border" style={{ backgroundColor: c.hex }} />
                                    <p className="text-xs font-bold">{c.hex}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{c.usage}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Temel Kurallar</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {guidelines.map(g => (
                                <div key={g.title} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">{g.title}</p>
                                        <p className="text-xs text-muted-foreground">{g.text}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2"><XCircle className="h-5 w-5" /> Yapılmaması Gerekenler</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        {donts.map((d, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-background/50 rounded border border-destructive/10">
                                <span className="text-destructive font-bold">•</span>
                                <p className="text-xs text-foreground/80">{d.text}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      <footer className="pt-12 text-center">
          <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                      <p className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Basın İletişim</p>
                      <p className="text-sm text-muted-foreground">Medya talepleri ve röportaj istekleri için:</p>
                  </div>
                  <a href="mailto:basın@hangel.org" className="text-primary font-bold hover:underline">basın@hangel.org</a>
              </CardContent>
          </Card>
      </footer>
    </div>
  );
}
