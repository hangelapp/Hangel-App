
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, XCircle, FileText, Rss, Package, CheckCircle2, Info, Palette, Type, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HangelLogo } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function PressPage() {
  const router = useRouter();

  const logoAssets = [
    { format: 'SVG (Vektörel)', link: '#', desc: 'Baskı ve yüksek çözünürlüklü kullanımlar için önerilir.' },
    { format: 'PNG (Şeffaf)', link: '#', desc: 'Web ve sunum dosyaları için idealdir.' },
    { format: 'PDF', link: '#', desc: 'Dökümantasyon ve arşivleme amaçlı kullanım.' },
  ];
  
  const colors = [
      { name: 'Hangel Mercan (Primary)', hex: '#f34723', usage: 'Logotype, ana butonlar ve vurgular' },
      { name: 'Gece Mavisi (Foreground)', hex: '#042654', usage: 'Başlıklar ve ana metinler' },
      { name: 'Saf Beyaz (Background)', hex: '#ffffff', usage: 'Uygulama arka planı' },
      { name: 'Sis Grisi (Muted)', hex: '#f5f5f5', usage: 'İkincil alanlar ve kartlar' },
  ];

  const typography = [
      { type: 'Headline (Başlıklar)', font: 'Sans-Serif Bold', desc: 'Kurumsal ve güçlü bir duruş için.' },
      { type: 'Body (Metin)', font: 'Sans-Serif Regular', desc: 'Okunabilirlik ve sadelik için.' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Kurumsal Basın Odası</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Hangel marka kimliği, resmi duyurular ve medya materyalleri için merkezi kaynak.
        </p>
      </div>

      <Tabs defaultValue="releases" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="releases">Basın Bültenleri</TabsTrigger>
          <TabsTrigger value="news">Haberler</TabsTrigger>
          <TabsTrigger value="kit">Medya Kiti & Logo</TabsTrigger>
        </TabsList>

        <TabsContent value="releases" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Güncel Duyurular</CardTitle>
                    <CardDescription>Resmi basın açıklamalarımızı buradan takip edebilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { title: 'Hangel, 2024 Yılı Sosyal Etki Raporu’nu Kamuoyuyla Paylaştı', date: '25 Temmuz 2024', category: 'Kurumsal' },
                        { title: 'Yeni İşbirliği: Hangel ve Önde Gelen Markalar Eğitimi Destekliyor', date: '10 Haziran 2024', category: 'İşbirliği' },
                        { title: 'Hangel QR Ödeme Sistemi ile Bağışçılıkta Dijital Dönüşüm', date: '15 Mayıs 2024', category: 'Teknoloji' }
                    ].map((release, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                            <div className="space-y-1">
                                <Badge variant="outline" className="mb-1">{release.category}</Badge>
                                <p className="font-semibold text-base group-hover:text-primary transition-colors">{release.title}</p>
                                <p className="text-sm text-muted-foreground">{release.date}</p>
                            </div>
                            <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="news" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
                {[
                    { outlet: 'Webrazzi', title: 'Sosyal Etkinin Yeni Nesil Platformu: Hangel', type: 'Analiz', date: '12.07.2024' },
                    { outlet: 'Bloomberg HT', title: 'Girişim Dünyasında Sosyal Sorumluluk Modelleri', type: 'Röportaj', date: '05.07.2024' },
                    { outlet: 'Anadolu Ajansı', title: 'Dijital Bağış Sistemlerinde Şeffaflık Devrimi', type: 'Haber', date: '20.06.2024' },
                    { outlet: 'Ekonomist', title: '2024’ün En Etkili Sosyal Girişimleri', type: 'Liste', date: '15.06.2024' }
                ].map((news, i) => (
                    <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary">{news.outlet}</Badge>
                                <span className="text-xs text-muted-foreground">{news.date}</span>
                            </div>
                            <CardTitle className="text-lg mt-2">{news.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="link" className="p-0 h-auto text-primary">Habere Git</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="kit" className="mt-6 space-y-8">
            {/* Logo Kullanım Rehberi */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl"><Package className="h-6 w-6 text-primary"/> Logo Kullanım Rehberi</CardTitle>
                    <CardDescription>Marka varlıklarımızı doğru ve tutarlı bir şekilde kullanmanız için hazırlanan rehberdir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="p-12 border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-8">
                        <HangelLogo className="text-7xl" />
                        <p className="text-sm text-muted-foreground italic">hangel ana logotype (pozitif kullanım)</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {logoAssets.map((asset) => (
                            <div key={asset.format} className="p-4 border rounded-lg space-y-3 flex flex-col bg-card">
                                <p className="font-bold">{asset.format}</p>
                                <p className="text-xs text-muted-foreground flex-1">{asset.desc}</p>
                                <Button size="sm" className="w-full"><Download className="mr-2 h-4 w-4" /> İndir</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Renk Paleti */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Renk Paleti</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {colors.map(c => (
                            <div key={c.name} className="space-y-2">
                                <div className="h-16 rounded-md border shadow-inner" style={{ backgroundColor: c.hex }} />
                                <p className="text-xs font-bold">{c.hex}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight">{c.usage}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Tipografi */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-primary" /> Tipografi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {typography.map(t => (
                            <div key={t.type} className="space-y-1">
                                <p className="text-sm font-bold">{t.type}</p>
                                <p className="text-lg font-headline">{t.font}</p>
                                <p className="text-xs text-muted-foreground">{t.desc}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Kurallar */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-green-600 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Temel İlkeler</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                            <p className="text-xs text-muted-foreground">Logonun çevresinde her zaman "h" harfi kadar güvenli alan bırakılmalıdır.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                            <p className="text-xs text-muted-foreground">Dijitalde minimum 80px genişlikte kullanılmalıdır.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><XCircle className="h-5 w-5" /> Yanlış Kullanımlar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-foreground/80">• Logoyu oranlarını bozarak (basık/uzun) kullanmayın.</p>
                        <p className="text-xs text-foreground/80">• Logoya gölge, eğim veya 3D efektler eklemeyin.</p>
                        <p className="text-xs text-foreground/80">• Kurumsal renk paleti dışındaki renklerle renklendirmeyin.</p>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      <footer className="pt-12 text-center">
          <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                      <p className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Basın İletişim Hattı</p>
                      <p className="text-sm text-muted-foreground">Medya talepleri, röportaj istekleri ve kurumsal işbirlikleri için:</p>
                  </div>
                  <a href="mailto:basın@hangel.org" className="text-primary font-bold hover:underline">basın@hangel.org</a>
              </CardContent>
          </Card>
      </footer>
    </div>
  );
}
