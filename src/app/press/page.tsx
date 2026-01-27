'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, XCircle, FileText, Rss, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HangelLogo } from '@/components/icons';
import Link from 'next/link';

export default function PressPage() {
  const router = useRouter();

  const logoAssets = [
    { format: 'SVG', link: '#' },
    { format: 'PNG', link: '#' },
    { format: 'PDF', link: '#' },
  ];
  
  const colors = [
      { name: 'Primary (Mercan)', hex: '#FF7F50', variable: 'var(--primary)' },
      { name: 'Background (Açık Pembe)', hex: '#F8E8E8' },
      { name: 'Accent (Soluk Turuncu)', hex: '#F08080' },
      { name: 'Foreground (Koyu Mavi)', hex: '#042654', variable: 'var(--foreground)' },
  ];

  const donts = [
      { text: 'Logonun renklerini değiştirmeyin.' },
      { text: 'Logoyu oranlarını bozacak şekilde esnetmeyin veya sıkıştırmayın.' },
      { text: 'Logoya gölge, parlama gibi efektler eklemeyin.' },
      { text: 'Logoyu karmaşık ve okunurluğu azaltan arka planlara yerleştirmeyin.' },
  ];
  
   const pressReleases = [
    { title: 'Hangel, 2024 Sosyal Etki Raporunu Yayınladı', date: '25 Temmuz 2024', link: '#' },
    { title: 'Yeni "Eğitimde Fırsat Eşitliği" Kampanyası Başladı', date: '15 Temmuz 2024', link: '#' },
    { title: 'Hangel Platformu 10 Milyon TL Bağış Hacmine Ulaştı', date: '01 Haziran 2024', link: '#' },
  ];

  const newsArticles = [
    { title: 'Teknolojiyle İyilik: Hangel Nasıl Fark Yaratıyor?', source: 'Webrazzi', link: '#' },
    { title: 'Sosyal Girişimciliğin Yükselen Yıldızı: Hangel', source: 'Bloomberg HT', link: '#' },
    { title: 'Bir Milyon Kullanıcı Hangel\'de Buluştu', source: 'Anadolu Ajansı', link: '#' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Basın</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Hangel ile ilgili en son haberlere, basın bültenlerine ve medya materyallerine buradan ulaşabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Basın Bültenleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {pressReleases.map(item => (
                    <a key={item.title} href={item.link} className="block p-3 border rounded-lg hover:bg-accent">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                    </a>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Rss className="h-5 w-5 text-primary"/> Basında Hangel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 {newsArticles.map(item => (
                    <a key={item.title} href={item.link} className="block p-3 border rounded-lg hover:bg-accent">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.source}</p>
                    </a>
                ))}
            </CardContent>
        </Card>
      </div>
      
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><Package className="h-6 w-6 text-primary"/> Medya Kiti ve Logo Kullanımı</CardTitle>
            <CardDescription>Hangel marka varlıklarını kullanırken marka kimliğimizin tutarlılığını korumak için lütfen bu rehbere uyun.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
            <Card>
                <CardHeader>
                  <CardTitle>Temel Logo</CardTitle>
                  <CardDescription>
                    Tercih edilen logo formatımız budur. Lütfen mümkün olduğunca bu logoyu kullanın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-8 border rounded-lg bg-muted/30">
                        <HangelLogo className="text-6xl"/>
                        <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary text-primary-foreground text-5xl font-bold">h</div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {logoAssets.map((asset) => (
                        <Button key={asset.format} asChild variant="outline" className="flex-1">
                            <a href={asset.link} download>
                            <Download className="mr-2 h-4 w-4" />
                            {asset.format} Olarak İndir
                            </a>
                        </Button>
                        ))}
                    </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Koruma Alanı</CardTitle>
                  <CardDescription>
                    Logonun okunabilirliğini sağlamak için çevresinde her zaman yeterli boşluk bırakın. Koruma alanı, logonun "h" harfinin genişliği kadar olmalıdır.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        <div className="relative border border-dashed border-primary/50 p-4">
                            <HangelLogo className="text-5xl" />
                        </div>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Renk Paleti</CardTitle>
                  <CardDescription>Marka kimliğimizin temelini oluşturan ana renklerimiz.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {colors.map(color => (
                    <div key={color.name}>
                      <div className="w-full h-20 rounded-lg border" style={{ backgroundColor: color.variable || color.hex }}></div>
                      <p className="mt-2 font-semibold text-sm">{color.name}</p>
                      <p className="text-xs text-muted-foreground">{color.hex}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipografi</CardTitle>
                  <CardDescription>
                    Tüm metinlerimizde 'PT Sans' yazı tipini kullanıyoruz. Bu, markamızın modern ve okunabilir estetiğini korumamıza yardımcı olur.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-lg">
                        <p className="font-headline text-3xl font-bold">PT Sans Bold (Başlıklar)</p>
                        <p className="font-body text-base mt-2">PT Sans Regular (Gövde Metinleri)</p>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Yapılmaması Gerekenler</CardTitle>
                  <CardDescription>Logonun bütünlüğünü ve tutarlılığını korumak için lütfen bu hatalardan kaçının.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {donts.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                        <p className="text-sm text-foreground">{item.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
        </CardContent>
       </Card>
    </div>
  );
}
