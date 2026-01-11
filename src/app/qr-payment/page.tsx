import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, History, MoreHorizontal, Building, GraduationCap } from 'lucide-react';
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
    bgColor: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black',
    patternUrl: 'https://www.transparenttextures.com/patterns/carbon-fibre-v2.png',
    textColor: 'text-white',
    highlightColor: 'text-white/80',
    owner: 'AYŞE YILMAZ',
    number: '**** **** **** 1234',
    expiry: '12/28',
    icon: () => <HangelLogo className="w-12 h-12 text-white" />,
  },
  {
    type: 'Öğrenci',
    bgColor: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600',
    patternUrl: 'https://www.transparenttextures.com/patterns/notebook-dark.png',
    textColor: 'text-white',
    highlightColor: 'text-white/80',
    owner: 'AYŞE YILMAZ',
    number: '**** **** **** 5678',
    expiry: '08/27',
    icon: () => <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><GraduationCap className="w-7 h-7 text-white"/></div>
  },
  {
    type: 'Ticari',
    bgColor: 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700',
    patternUrl: 'https://www.transparenttextures.com/patterns/congruent-pentagon.png',
    textColor: 'text-white',
    highlightColor: 'text-white/80',
    owner: 'AYŞE YILMAZ - TİCARİ',
    number: '**** **** **** 9012',
    expiry: '01/29',
    icon: () => <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Building className="w-7 h-7 text-white"/></div>,
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
                        <div className={`relative h-56 rounded-2xl ${card.textColor} p-6 flex flex-col justify-between shadow-2xl overflow-hidden`}>
                            <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${card.patternUrl})`, opacity: 0.1}}></div>
                            <div className={`absolute inset-0 ${card.bgColor} opacity-95`}></div>
                            
                            <div className="relative z-10">
                                <div className='flex justify-between items-start'>
                                    <card.icon />
                                    <p className={`font-semibold text-lg ${card.highlightColor}`}>{card.type}</p>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="font-mono tracking-widest text-xl">{card.number}</p>
                                <div className='flex justify-between items-end mt-2'>
                                    <div>
                                        <p className="text-xs opacity-70">Kart Sahibi</p>
                                        <p className={`font-semibold ${card.textColor}`}>{card.owner}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs opacity-70 text-right">Son Kul.</p>
                                        <p className={`font-semibold ${card.textColor}`}>{card.expiry}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>


      <div className="grid grid-cols-4 gap-2 text-center">
        <Button variant="ghost" className="flex flex-col h-auto gap-1 text-muted-foreground hover:text-foreground">
            <PlusCircle />
            <span className="text-xs">Bakiye Yükle</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1 text-muted-foreground hover:text-foreground">
            <ArrowRightLeft />
            <span className="text-xs">Transfer</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1 text-muted-foreground hover:text-foreground">
            <History />
            <span className="text-xs">Tüm İşlemler</span>
        </Button>
        <Button variant="ghost" className="flex flex-col h-auto gap-1 text-muted-foreground hover:text-foreground">
            <MoreHorizontal />
            <span className="text-xs">Ayarlar</span>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Son İşlemler</h2>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-b last:border-none">
                  <div>
                    <p className="font-semibold">{tx.brand}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount.startsWith('+') ? 'text-green-600' : ''}`}>{tx.amount}</p>
                    {tx.donation !== '0.00 ₺' && (
                        <p className="text-xs text-primary font-semibold">Bağış: {tx.donation}</p>
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
