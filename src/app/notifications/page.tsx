import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Heart } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Bildirimler</h1>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className='p-3 bg-primary/10 rounded-full'>
                <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-base">Yeni Gönüllülük Fırsatı</CardTitle>
                <CardDescription>TEMA Vakfı, "Ağaç Kardeşliği" projesi için gönüllüler arıyor. Hemen başvur!</CardDescription>
                <p className='text-xs text-muted-foreground mt-1'>15 dakika önce</p>
            </div>
        </CardHeader>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className='p-3 bg-accent/20 rounded-full'>
                <Bell className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
                <CardTitle className="text-base">Bağışınız Ulaştı</CardTitle>
                <CardDescription>"Lezzet Köyü" alışverişinizden elde edilen 5.75 TL bağış Ahbap Derneği'ne ulaştı.</CardDescription>
                 <p className='text-xs text-muted-foreground mt-1'>1 saat önce</p>
            </div>
        </CardHeader>
      </Card>
      <div className="text-center text-muted-foreground py-12">
        <p>Tüm bildirimler bu kadar.</p>
      </div>
    </div>
  );
}
