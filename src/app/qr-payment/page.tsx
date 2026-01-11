import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, History, MoreHorizontal, Building } from 'lucide-react';
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
    bgColor: 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900',
    borderColor: 'border-zinc-700',
    textColor: 'text-zinc-200',
    highlightColor: 'text-white',
    owner: 'AYŞE YILMAZ',
    number: '**** **** **** 1234',
    expiry: '12/28',
    icon: HangelLogo,
  },
  {
    type: 'Öğrenci',
    bgColor: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
    borderColor: 'border-blue-800',
    textColor: 'text-slate-300',
    highlightColor: 'text-white',
    owner: 'AYŞE YILMAZ',
    number: '**** **** **** 5678',
    expiry: '08/27',
    icon: () => <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><Building className="w-6 h-6 text-blue-400"/></div>
  },
  {
    type: 'Ticari',
    bgColor: 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-black',
    borderColor: 'border-neutral-700',
    textColor: 'text-neutral-300',
    highlightColor: 'text-white',
    owner: 'AYŞE YILMAZ - TİCARİ',
    number: '**** **** **** 9012',
    expiry: '01/29',
    icon: () => <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center"><Building className="w-6 h-6 text-gray-400"/></div>
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
                        <div className={`relative h-56 rounded-2xl ${card.bgColor} ${card.textColor} p-6 flex flex-col justify-between shadow-2xl border ${card.borderColor} overflow-hidden`}>
                             <div className="absolute -top-16 -right-16 w-48 h-48 border-4 border-white/5 rounded-full" />
                             <div className="absolute -bottom-24 -left-12 w-48 h-48 border-2 border-white/5 rounded-full" />
                            <div className="relative z-10">
                                <div className='flex justify-between items-start'>
                                    <card.icon className={`w-10 h-10 ${card.highlightColor}`} />
                                    <p className={`font-semibold text-lg ${card.highlightColor}`}>{card.type}</p>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="font-mono tracking-widest text-xl">{card.number}</p>
                                <div className='flex justify-between items-end mt-2'>
                                    <div>
                                        <p className="text-xs opacity-70">Kart Sahibi</p>
                                        <p className={`font-semibold ${card.highlightColor}`}>{card.owner}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs opacity-70 text-right">Son Kul.</p>
                                        <p className={`font-semibold ${card.highlightColor}`}>{card.expiry}</p>
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
                    <p className={`font-bold ${tx.amount.startsWith('+') ? 'text-green-500' : ''}`}>{tx.amount}</p>
                    {tx.donation !== '0.00 ₺' && (
                        <p className="text-xs text-ring">Bağış: {tx.donation}</p>
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
