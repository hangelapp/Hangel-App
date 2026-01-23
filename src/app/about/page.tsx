import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, MapPin, Twitter, Instagram, Linkedin, Users, HandCoins, Hourglass, MessageSquare, Building2, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold font-headline">Hakkımızda</h1>
        <div className="text-muted-foreground space-y-3 max-w-3xl mx-auto text-base">
          <p>İyiliğin ve sosyal etkinin buluşma noktası.</p>
          <p>
            Alışverişlerimizde ek ödeme yapmaksızın her birimizin ayrı ayrı seçtiğimiz Sivil Toplum Kuruluşlarına %15’e varan oranlarda bağış yapmamızı mümkün kılan,
          </p>
          <p>
            Sahip olduğumuz profesyonel yetkinliklerimiz ve sosyal hassasiyetlerimiz doğrultusunda gönüllülük faaliyetlerine katkı sunmamızı mümkün kılan,
          </p>
          <p className="font-semibold text-foreground">
            Bağış ve gönüllük odaklı bir Sosyal Etki Platformudur.
          </p>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="text-xl">hangel'e Hoş Geldiniz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground text-sm">
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
          <CardTitle className="text-xl">Misyonumuz</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Sosyal etki yaratmak isteyen herkes için güvenilir, kolay ve ilham verici bir dijital köprü kurarak, toplumsal sorunlara sürdürülebilir çözümler bulunmasına aracılık etmek.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Vizyonumuz</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Türkiye'de ve dünyada sosyal sorumluluk ve gönüllülük denince akla gelen ilk platform olmak; iyiliği bir yaşam biçimi haline getiren, bilinçli ve aktif bir toplumun oluşmasına liderlik etmek.
          </p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sosyal Etki Raporu (Özet)</CardTitle>
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
          <CardTitle className="text-xl">Kurumsal</CardTitle>
          <CardDescription>
            Şeffaflık ilkemiz doğrultusunda kurumsal bilgilerimize ve yatırımcı ilişkileri sayfamıza buradan ulaşabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/bilgi-toplumu-hizmetleri" className="block">
            <div className="p-4 border rounded-lg hover:bg-accent transition-colors text-center h-full flex flex-col justify-center">
              <Building2 className="h-8 w-8 text-primary mx-auto mb-2"/>
              <p className="font-semibold">Bilgi Toplumu Hizmetleri</p>
            </div>
          </Link>
          <Link href="/yatirimci-iliskileri" className="block">
            <div className="p-4 border rounded-lg hover:bg-accent transition-colors text-center h-full flex flex-col justify-center">
              <Briefcase className="h-8 w-8 text-primary mx-auto mb-2"/>
              <p className="font-semibold">Yatırımcı İlişkileri</p>
            </div>
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Bize Ulaşın</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>destek@hangel.com</span>
                </div>
                <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>+90 554 700 7007</span>
                </div>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <p className="font-medium">Genel Merkez (Posta Adresi)</p>
                        <p className='text-muted-foreground'>Caferağa Mah. Moda Cad. No: 123 D:4, Kadıköy, İstanbul</p>
                    </div>
                </div>
            </div>
            <div className='space-y-4 pt-4 border-t'>
                 <h4 className='font-semibold'>Ofislerimiz</h4>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <p className="font-medium">Marmara Bölge İrtibat Ofisi</p>
                        <p className='text-muted-foreground'>Maslak, Büyükdere Cad. No: 255, Sarıyer, İstanbul</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <p className="font-medium">Ege Bölge İrtibat Ofisi</p>
                        <p className='text-muted-foreground'>Sancar Maruflu STK Yerleşkesi, Bahçeli Evler Mh., Kat:1 No:21, Karşıyaka, İzmir</p>
                    </div>
                </div>
            </div>
             <div className='space-y-4 pt-4 border-t'>
                <h4 className='font-semibold'>Sosyal Medya</h4>
                 <div className="flex gap-6">
                    <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Instagram className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" /></a>
                    <a href="https://wa.me/905547007007" target="_blank" rel="noopener noreferrer"><MessageSquare className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" /></a>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
