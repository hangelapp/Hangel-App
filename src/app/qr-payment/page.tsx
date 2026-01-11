import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, History, MoreHorizontal, School, Building } from 'lucide-react';
import { HangelLogo } from '@/components/icons';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const transactions = [
    { brand: 'Doğa Dostu Giyim', amount: '-150.00 ₺', donation: '22.50 ₺', time: '14:32' },
    { brand: 'Bakiye Yükleme', amount: '+200.00 ₺', donation: '0.00 ₺', time: '09:15' },
    { brand: 'Lezzet Köyü', amount: '-45.50 ₺', donation: '4.55 ₺', time: 'Dün' },
];

const cards = [
  {
    type: 'Standart',
    bgColor: 'from-primary via-orange-500 to-amber-400',
    textColor: 'text-primary-foreground',
    owner: 'AYŞE YILMAZ',
    number: '**** **** **** 1234',
    expiry: '12/28',
    icon: HangelLogo,
  },
  {
    type: 'Öğrenci',
    bgColor: 'from-indigo-500 via-purple-500 to-pink-500',
    textColor: 'text-white',
    owner: 'AYŞE YILMAZ',
    number: '**** **** **** 5678',
    expiry: '08/27',
    icon: School,
  },
  {
    type: 'Ticari',
    bgColor: 'from-slate-900 to-slate-700',
    textColor: 'text-slate-100',
    owner: 'AYŞE YILMAZ - TİCARİ',
    number: '**** **** **** 9012',
    expiry: '01/29',
    icon: Building,
  },
];


export default function QrPaymentPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Cüzdanım</h1>

        <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent>
                {cards.map((card, index) => (
                    <CarouselItem key={index}>
                        <div className={`relative h-52 rounded-xl bg-gradient-to-br ${card.bgColor} ${card.textColor} p-6 flex flex-col justify-between shadow-lg`}>
                            <div>
                                <div className='flex justify-between items-start'>
                                    <card.icon className="w-10 h-10" />
                                    <p className="font-semibold text-lg">{card.type}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm opacity-80">Kart Numarası</p>
                                <p className="font-mono tracking-widest text-lg">{card.number}</p>
                                <div className='flex justify-between items-end'>
                                    <p className="font-semibold">{card.owner}</p>
                                    <p className="text-xs">SON KUL. {card.expiry}</p>
                                </div>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>


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
            <History />
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
