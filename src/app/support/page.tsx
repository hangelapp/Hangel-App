import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  UserCircle,
  HeartHandshake,
  Wallet,
  Settings2,
  Shield,
  BookText,
  ChevronRight,
  Mail
} from 'lucide-react';
import Link from 'next/link';

const helpTopics = [
  {
    icon: UserCircle,
    title: 'Hesap Yönetimi',
    description: 'Profil bilgileri, giriş ve hesap ayarları.',
    link: '#'
  },
  {
    icon: HeartHandshake,
    title: 'Gönüllülük',
    description: 'Başvurular, ilanlar ve gönüllülük süreci.',
    link: '#'
  },
  {
    icon: Wallet,
    title: 'Bağış ve Ödemeler',
    description: 'Cüzdan, bağış geçmişi ve ödeme sorunları.',
    link: '#'
  },
  {
    icon: Settings2,
    title: 'Profil ve Ayarlar',
    description: 'Bildirimler, gizlilik ve uygulama ayarları.',
    link: '#'
  },
  {
    icon: Shield,
    title: 'Güvenlik',
    description: 'Hesap güvenliği ve şifre işlemleri.',
    link: '#'
  },
  {
    icon: BookText,
    title: 'Topluluk Kuralları',
    description: 'Platform kullanım politikaları ve kurallar.',
    link: '#'
  }
];

const popularArticles = [
    { title: 'hangel Etki Puanı nasıl hesaplanır?', link: '#' },
    { title: 'Bir bağışın STK\'ya ulaşma süreci nedir?', link: '#' },
    { title: 'Gönüllülük başvurum neden reddedildi?', link: '#' },
    { title: 'Şifremi nasıl sıfırlarım?', link: '#' }
];

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Destek Merkezi</h1>
        <p className="mt-2 text-muted-foreground">Size nasıl yardımcı olabiliriz?</p>
      </div>

      <div className="relative mx-auto max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Yardım konularında ara..." className="pl-12 h-12 text-base" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Yardım Konuları</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link href={topic.link} key={topic.title} passHref>
                <Card className="hover:bg-accent hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Popüler Makaleler</h2>
        <Card>
            <CardContent className='p-0'>
                <div className='divide-y'>
                    {popularArticles.map((article) => (
                         <Link href={article.link} key={article.title} passHref>
                            <div className='flex justify-between items-center p-4 hover:bg-accent transition-colors'>
                                <p className='font-medium'>{article.title}</p>
                                <ChevronRight className='h-5 w-5 text-muted-foreground'/>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-3 pt-4">
        <h3 className="text-lg font-semibold">Aradığınızı bulamadınız mı?</h3>
        <p className="text-muted-foreground">Destek ekibimiz size yardımcı olmak için burada.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button size="lg">Destek Talebi Oluştur</Button>
           <Button size="lg" variant="outline">
            <Mail className="mr-2 h-5 w-5" />
            Bize E-posta Gönder
          </Button>
        </div>
      </div>
    </div>
  );
}
