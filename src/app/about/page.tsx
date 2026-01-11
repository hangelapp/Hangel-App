import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Hakkımızda</h1>
        <p className="text-muted-foreground">İyiliğin ve sosyal etkinin buluşma noktası.</p>
      </div>

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
          <CardTitle>Bize Ulaşın</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>destek@hangel.com</span>
            </div>
            <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>+90 555 123 45 67</span>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
