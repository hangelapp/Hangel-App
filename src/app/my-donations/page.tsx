import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleDollarSign } from 'lucide-react';

const donations = [
    { id: '1', store: 'Doğa Dostu Giyim', purchase: '250.00 ₺', donation: '37.50 ₺', ngo: 'TEMA Vakfı', date: '15 Temmuz 2024' },
    { id: '2', store: 'Lezzet Köyü', purchase: '120.00 ₺', donation: '12.00 ₺', ngo: 'Ahbap Derneği', date: '12 Temmuz 2024' },
    { id: '3', store: 'Tekno Market', purchase: '1500.00 ₺', donation: '75.00 ₺', ngo: 'LÖSEV', date: '10 Temmuz 2024' },
];

export default function MyDonationsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Bağışlarım</h1>
      <p className="text-muted-foreground">Alışverişlerinizle yarattığınız etkiyi ve desteklediğiniz STK'ları görün.</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="text-primary" />
            Toplam 1,580.00 ₺
          </CardTitle>
          <CardDescription>Yaptığınız alışverişler üzerinden aktarılan toplam bağış tutarı.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-4">
      <h2 className="text-lg font-semibold">İşlem Geçmişi</h2>
        {donations.map(donation => (
          <Card key={donation.id}>
            <CardHeader>
              <CardTitle className="text-lg">{donation.store}</CardTitle>
              <CardDescription>{donation.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                    <span>{donation.purchase}</span>
                </div>
                <div className='flex justify-between font-semibold'>
                    <span className='text-primary'>Bağış Tutarı</span>
                    <span className='text-primary'>{donation.donation}</span>
                </div>
                 <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Desteklenen STK</span>
                    <span>{donation.ngo}</span>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
