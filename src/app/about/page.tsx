import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Twitter, Instagram, Linkedin, Users, HandCoins, Hourglass } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Hakkımızda</h1>
        <p className="text-muted-foreground">İyiliğin ve sosyal etkinin buluşma noktası.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>hangel'e Hoş Geldiniz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Hangel olarak, bireylerin, sivil toplum kuruluşlarının (STK) ve sosyal sorumluluk sahibi markaların bir araya gelerek pozitif bir değişim yaratabileceği bir platform oluşturma hayaliyle yola çıktık. Teknolojinin gücünü kullanarak gönüllülüğü ve bağışçılığı daha erişilebilir, şeffaf ve etkili kılmayı hedefliyoruz.
          </p>
           <p>
            Platformumuz, günlük alışverişlerinizi birer iyilik hareketine dönüştürmenize olanak tanır. Anlaşmalı markalardan yaptığınız her harcamanın bir kısmı, hiçbir ek ücret ödemeden sizin seçtiğiniz bir STK'ya bağış olarak aktarılır. Böylece, günlük ihtiyaçlarınızı karşılarken aynı zamanda topluma katkıda bulunmuş olursunuz.
          </p>
          <p>
            Aynı zamanda Hangel, yeteneklerinizi ve zamanınızı topluma fayda sağlamak için kullanabileceğiniz bir gönüllülük merkezidir. İlgi alanlarınıza ve becerilerinize uygun gönüllülük ilanlarını keşfedebilir, başvurabilir ve yarattığınız etkiyi 'Sosyal Etki Puanı' ile ölçebilirsiniz.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Misyonumuz</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Sosyal etki yaratmak isteyen herkes için güvenilir, kolay ve ilham verici bir dijital köprü kurarak, toplumsal sorunlara sürdürülebilir çözümler bulunmasına aracılık etmek.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vizyonumuz</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Türkiye'de ve dünyada sosyal sorumluluk ve gönüllülük denince akla gelen ilk platform olmak; iyiliği bir yaşam biçimi haline getiren, bilinçli ve aktif bir toplumun oluşmasına liderlik etmek.
          </p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Sosyal Etki Raporu (Özet)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
                <Users className="h-8 w-8 text-primary mx-auto mb-2"/>
                <p className="text-xl font-bold">1 Milyon+</p>
                <p className="text-xs text-muted-foreground">Ulaşılan İnsan</p>
            </div>
             <div>
                <HandCoins className="h-8 w-8 text-primary mx-auto mb-2"/>
                <p className="text-xl font-bold">500.000 ₺+</p>
                <p className="text-xs text-muted-foreground">Aktarılan Bağış</p>
            </div>
             <div>
                <Hourglass className="h-8 w-8 text-primary mx-auto mb-2"/>
                <p className="text-xl font-bold">10.000+ Saat</p>
                <p className="text-xs text-muted-foreground">Gönüllülük</p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Bize Ulaşın</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>destek@hangel.com</span>
                </div>
                <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>+90 555 123 45 67</span>
                </div>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <p>Genel Merkez (Posta Adresi)</p>
                        <p className='text-sm text-muted-foreground'>Caferağa Mah. Moda Cad. No: 123 D:4, Kadıköy, İstanbul</p>
                    </div>
                </div>
            </div>
            <div className='space-y-4 pt-4 border-t'>
                 <h4 className='font-semibold'>Ofislerimiz</h4>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <p>Marmara Bölge İrtibat Ofisi</p>
                        <p className='text-sm text-muted-foreground'>Maslak, Büyükdere Cad. No: 255, Sarıyer, İstanbul</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <p>Ege Bölge İrtibat Ofisi</p>
                        <p className='text-sm text-muted-foreground'>Alsancak Mah. Atatürk Cad. No: 382, Konak, İzmir</p>
                    </div>
                </div>
            </div>
             <div className='space-y-4 pt-4 border-t'>
                <h4 className='font-semibold'>Sosyal Medya</h4>
                 <div className="flex gap-6">
                    <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-6 w-6 text-muted-foreground hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Instagram className="h-6 w-6 text-muted-foreground hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-6 w-6 text-muted-foreground hover:text-foreground" /></a>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
