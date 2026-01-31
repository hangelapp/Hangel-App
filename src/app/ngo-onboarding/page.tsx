
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, TrendingUp, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        icon: TrendingUp,
        title: 'Görünürlüğünüzü Artırın',
        description: 'Binlerce bilinçli kullanıcıya ulaşarak misyonunuzu daha geniş kitlelere duyurun ve yeni destekçiler kazanın.',
    },
    {
        icon: Users,
        title: 'Gönüllü Havuzunuzu Genişletin',
        description: 'İhtiyaçlarınıza özel yetkinliklere sahip, motive ve tutkulu gönüllülere kolayca ulaşın, topluluğunuzu büyütün.',
    },
    {
        icon: HeartHandshake,
        title: 'Sürdürülebilir Bağış Kaynağı',
        description: 'Kullanıcıların günlük alışverişlerinden hiçbir ek çaba gerektirmeden düzenli ve sürdürülebilir bağışlar elde edin.',
    },
    {
        icon: CheckCircle,
        title: 'Kolay Yönetim Paneli',
        description: 'Gönüllülük ilanlarınızı yayınlayın, başvuruları yönetin, bağışlarınızı takip edin ve etki raporlarınızı oluşturun.',
    },
];

export default function NgoOnboardingPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center space-y-4">
        <div className="inline-block bg-primary/10 p-4 rounded-full">
            <HeartHandshake className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline">STK'nızla Topluma Değer Katın: Hangel Partneri Olun</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Hangel'in dijital dünyasında yerinizi alarak misyonunuzu daha geniş kitlelere ulaştırın, gönüllü ve bağışçı ağınızı büyütün.
        </p>
         <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login/selection?action=register">Hemen Başvur</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/support">Daha Fazla Bilgi Al</Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Neden Hangel'de Yer Almalısınız?</CardTitle>
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
                <p><strong>Ücretsiz Başvurun:</strong> Platforma katılmak için basit başvuru formumuzu doldurun. Ekibimiz başvurunuzu hızla değerlendirsin.</p>
            </div>
             <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>2</div>
                <p><strong>Profilinizi Oluşturun:</strong> Onaylandıktan sonra size özel yönetim panelinden profilinizi oluşturun, misyonunuzu ve faaliyetlerinizi anlatın.</p>
            </div>
             <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>3</div>
                <p><strong>Gönüllü İlanları Yayınlayın:</strong> İhtiyaç duyduğunuz yetkinliklere göre gönüllülük ilanları oluşturun ve gelen başvuruları kolayca yönetin.</p>
            </div>
             <div className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>4</div>
                <p><strong>Etkinizi Paylaşın ve Büyütün:</strong> Kullanıcılar, alışverişleriyle size düzenli bağış yaparken, siz de sağladığınız etkiyi gönderilerle tüm toplulukla paylaşın.</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
