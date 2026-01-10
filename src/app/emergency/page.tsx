import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Siren } from 'lucide-react';

export default function EmergencyPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Acil Durum</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Siren />
            Yardım Çağrısı
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Gerçek bir acil durumda ilgili butona basın.
          </p>
          <Button variant="destructive" size="lg" className="w-full">
            Acil Durum Çağrısı Yap
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="text-red-500" />
            Aktif Kan İhtiyaçları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg border bg-card">
              <div>
                <p className="font-bold">
                  A Rh+ <span className="font-normal text-sm text-muted-foreground">(2 ünite)</span>
                </p>
                <p className="text-sm text-muted-foreground">Ankara Şehir Hastanesi</p>
              </div>
              <Button variant="outline" size="sm">
                Detaylar
              </Button>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border bg-card">
              <div>
                <p className="font-bold">
                  0 Rh- <span className="font-normal text-sm text-muted-foreground">(Acil)</span>
                </p>
                <p className="text-sm text-muted-foreground">İstanbul Çapa Tıp Fakültesi</p>
              </div>
              <Button variant="outline" size="sm">
                Detaylar
              </Button>
            </div>
             <div className="text-center text-muted-foreground py-4">
                <p>Şu anda başka acil kan ihtiyacı bulunmuyor.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
