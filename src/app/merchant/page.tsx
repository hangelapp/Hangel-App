import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Handshake } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        icon: Handshake,
        title: 'Anlamlı Müşteri Etkileşimi',
        description: 'Müşterileriniz, her alışverişte bir sosyal amaca destek olmanın mutluluğunu yaşar ve markanıza olan sadakatleri artar.',
    },
    {
        icon: TrendingUp,
        title: 'Artan Görünürlük',
        description: 'İşletmeniz, Hangel\'in sosyal sorumlu mekanlar listesinde yer alır ve bilinçli tüketiciler tarafından keşfedilir.',
    },
    {
        icon: Zap,
        title: 'Hızlı ve Kolay Entegrasyon',
        description: 'Karmaşık teknik süreçlere gerek kalmadan, size özel oluşturulan QR kod ile anında ödeme almaya başlayın.',
    },
    {
        icon: CheckCircle,
        title: 'Şeffaf ve Otomatik Süreç',
        description: 'Bağış ve hizmet bedeli kesintileri her işlemde otomatik olarak ve şeffaf bir şekilde yönetilir, size ek bir operasyonel yük oluşturmaz.',
    },
];

export default function MerchantPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center space-y-4">
        <div className="inline-block bg-primary/10 p-4 rounded-full">
            <Zap className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline">İşletmenizle İyiliği Büyütün: Hangel Üye İşyeri</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Hangel QR Ödeme sistemine dahil olarak, müşterilerinize hızlı ve güvenli bir ödeme deneyimi sunarken her işlemi bir sosyal faydaya dönüştürün.
        </p>
         <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login/corporate">Hemen Başvur</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/support">Daha Fazla Bilgi Al</Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Neden Hangel Üye İşyeri Olmalısınız?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                  <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
            <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>1</div>
                <p>Müşteriniz, kasada bulunan Hangel QR kodunu telefonunun kamerasıyla veya Hangel uygulamasıyla okutur.</p>
            </div>
             <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>2</div>
                <p>Ödeme ekranında tutarı girer ve kendi seçtiği STK'ya ne kadar bağış yapılacağını şeffaf bir şekilde görür.</p>
            </div>
             <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>3</div>
                <p>Ödeme onaylandığında, tutar işletme hesabınıza geçerken, bağış payı ve cüzi bir hizmet bedeli Hangel tarafından otomatik olarak ayrıştırılır.</p>
            </div>
             <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>4</div>
                <p>Siz hiçbir ek işlem yapmadan hem satışınızı gerçekleştirir hem de toplumsal bir faydaya aracılık etmiş olursunuz.</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
