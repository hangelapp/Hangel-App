import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, ListHistory, MoreHorizontal } from 'lucide-react';
import { HangelLogo } from '@/components/icons';

const transactions = [
    { brand: 'Doğa Dostu Giyim', amount: '-150.00 ₺', donation: '22.50 ₺', time: '14:32' },
    { brand: 'Bakiye Yükleme', amount: '+200.00 ₺', donation: '0.00 ₺', time: '09:15' },
    { brand: 'Lezzet Köyü', amount: '-45.50 ₺', donation: '4.55 ₺', time: 'Dün' },
];

export default function QrPaymentPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Cüzdanım</h1>
      <div className="relative h-48 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-amber-400 text-primary-foreground p-6 flex flex-col justify-between shadow-lg">
        <div>
          <div className='flex justify-between items-start'>
            <HangelLogo className="w-10 h-10" />
            <p className="font-semibold text-lg">Hangel Kart</p>
          </div>
        </div>
        <div>
          <p className="text-sm">Kart Numarası</p>
          <p className="font-mono tracking-widest text-lg">**** **** **** 1234</p>
          <div className='flex justify-between items-end'>
            <p className="font-semibold">AYŞE YILMAZ</p>
            <p className="text-xs">SON KUL. 12/28</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Button variant="ghost" className="flex flex-col h-auto gap-1">
            <PlusCircle />
            <span className="text-xs">Bakiye Yükle</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1">
            <ArrowRightLeft />
            <span className="text-xs">Transfer</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1">
            <ListHistory />
            <span className="text-xs">Tüm İşlemler</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1">
            <MoreHorizontal />
            <span className="text-xs">Ayarlar</span>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Son İşlemler</h2>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-b last:border-none">
                  <div>
                    <p className="font-semibold">{tx.brand}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount.startsWith('+') ? 'text-green-600' : ''}`}>{tx.amount}</p>
                    {tx.donation !== '0.00 ₺' && (
                        <p className="text-xs text-primary">Bağış: {tx.donation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
