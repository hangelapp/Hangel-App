'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, History, MoreHorizontal, QrCode, RefreshCw, CheckCircle, ScanLine, Keyboard, Phone, Contact } from 'lucide-react';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

const cardData = [
  {
    id: 'bireysel',
    type: 'Bireysel',
    bgColor: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black',
    patternUrl: 'https://www.transparenttextures.com/patterns/carbon-fibre-v2.png',
    textColor: 'text-white',
    highlightColor: 'text-white/80',
    owner: 'İsmail Hilmi ADIGÜZEL',
    number: '**** **** **** 1234',
    expiry: '12/28',
    balance: '1.250,75 ₺'
  },
  {
    id: 'ogrenci',
    type: 'Öğrenci',
    bgColor: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600',
    patternUrl: 'https://www.transparenttextures.com/patterns/notebook-dark.png',
    textColor: 'text-white',
    highlightColor: 'text-white/80',
    owner: 'İsmail Hilmi ADIGÜZEL',
    number: '**** **** **** 5678',
    expiry: '08/27',
    balance: '345,50 ₺'
  },
  {
    id: 'ticari',
    type: 'Ticari',
    bgColor: 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700',
    patternUrl: 'https://www.transparenttextures.com/patterns/congruent-pentagon.png',
    textColor: 'text-white',
    highlightColor: 'text-white/80',
    owner: 'İsmail Hilmi ADIGÜZEL - TİCARİ',
    number: '**** **** **** 9012',
    expiry: '01/29',
    balance: '12.870,00 ₺'
  },
];

const allTransactions = {
    bireysel: [
        { brand: 'Doğa Dostu Giyim', amount: '-150.00 ₺', donation: '22.50 ₺', time: '14:32' },
        { brand: 'Bakiye Yükleme', amount: '+200.00 ₺', donation: '0.00 ₺', time: '09:15' },
        { brand: 'Lezzet Köyü', amount: '-45.50 ₺', donation: '4.55 ₺', time: 'Dün' },
    ],
    ogrenci: [
        { brand: 'Kampüs Kafe', amount: '-25.00 ₺', donation: '2.50 ₺', time: '12:45' },
        { brand: 'Kitapçı', amount: '-80.00 ₺', donation: '8.00 ₺', time: 'Önceki Gün' },
    ],
    ticari: [
        { brand: 'Ofis Malzemeleri', amount: '-1250.00 ₺', donation: '125.00 ₺', time: 'Pazartesi' },
        { brand: 'Tedarikçi Ödemesi', amount: '-5000.00 ₺', donation: '0.00 ₺', time: 'Geçen Hafta' },
    ],
};

const CardFace = ({ card, isFlipped, onFlip }: { card: typeof cardData[0], isFlipped: boolean, onFlip: () => void }) => {
  return (
    <div className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
      {/* Card Front */}
      <div className={cn("absolute w-full h-full [backface-visibility:hidden] rounded-2xl p-6 flex flex-col justify-between shadow-lg overflow-hidden", card.textColor)}>
        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${card.patternUrl})`, opacity: 0.1}}></div>
        <div className={`absolute inset-0 ${card.bgColor} opacity-95`}></div>
        <div className="relative z-10">
          <div className='flex justify-between items-start'>
            <p className={`font-semibold text-lg ${card.highlightColor}`}>{card.type}</p>
            <div className='text-right'>
              <p className="text-xs opacity-70">Bakiye</p>
              <p className="font-semibold text-2xl">{card.balance}</p>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <p className="font-mono tracking-widest text-lg">{card.number}</p>
          <div className='flex justify-between items-end mt-2'>
            <div>
              <p className="text-xs opacity-70">Kart Sahibi</p>
              <p className={`font-semibold text-sm ${card.textColor}`}>{card.owner}</p>
            </div>
            <div className='text-right'>
                <p className="text-xs opacity-70">Son Kul.</p>
                <p className={`font-semibold text-sm ${card.textColor}`}>{card.expiry}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="absolute bottom-4 left-4 h-8 w-8 text-white/70 hover:text-white" onClick={onFlip}>
            <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Card Back */}
      <div className={cn("absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-6 flex flex-col justify-between shadow-lg overflow-hidden", card.textColor)}>
         <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${card.patternUrl})`, opacity: 0.1}}></div>
        <div className={`absolute inset-0 ${card.bgColor} opacity-95`}></div>
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-sm opacity-80 mb-4">Ödeme yapmak için QR kodu okutun.</p>
            <div className="bg-white p-2 rounded-lg">
                 <Image src="https://i.imgur.com/gJMAiVl.png" alt="QR Code" width={80} height={80} />
            </div>
        </div>
         <Button variant="ghost" size="icon" className="absolute bottom-4 left-4 h-8 w-8 text-white/70 hover:text-white" onClick={onFlip}>
             <RefreshCw className="h-5 w-5" />
         </Button>
      </div>
    </div>
  )
};

export default function QrPaymentPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [flippedStates, setFlippedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect(); // Set initial state
    
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleCardClick = (index: number) => {
    if (index !== current) {
      api?.scrollTo(index);
    }
  };

  const toggleFlip = (cardId: string) => {
    setFlippedStates(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const selectedCardId = cardData[current]?.id as keyof typeof allTransactions;
  const transactions = allTransactions[selectedCardId] || [];
  const selectedCardOwner = cardData[current]?.owner || '';


  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Cüzdanım</h1>

        <div className="h-56">
          <Carousel setApi={setApi} opts={{ align: 'start' }} className="w-full">
              <CarouselContent className="-ml-2">
                  {cardData.map((card, index) => (
                      <CarouselItem key={card.id} className="pl-2 basis-[90%]" onClick={() => handleCardClick(index)}>
                          <div className={`relative h-56 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out [perspective:1000px] ${current === index ? 'z-10 scale-100' : 'z-0 scale-95 opacity-80'}`}>
                            <CardFace card={card} isFlipped={!!flippedStates[card.id]} onFlip={() => toggleFlip(card.id)} />
                          </div>
                      </CarouselItem>
                  ))}
              </CarouselContent>
          </Carousel>
        </div>


        <Tabs defaultValue="my_qr" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my_qr" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><QrCode /><span className="text-xs">QR Kodum</span></TabsTrigger>
            <TabsTrigger value="scan_qr" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><ScanLine /><span className="text-xs">QR Tara</span></TabsTrigger>
            <TabsTrigger value="pay_code" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Keyboard /><span className="text-xs">Kod ile</span></TabsTrigger>
            <TabsTrigger value="pay_phone" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Phone /><span className="text-xs">Numarayla</span></TabsTrigger>
          </TabsList>
          <TabsContent value="my_qr" className="mt-4 text-center">
            <div className="bg-white p-4 inline-block rounded-xl shadow-md">
                <Image src="https://i.imgur.com/gJMAiVl.png" alt="QR Code" width={160} height={160} />
            </div>
             <p className="mt-4 font-mono text-2xl tracking-widest text-foreground font-semibold">123-456</p>
            <p className="mt-2 text-xs text-muted-foreground">Ödeme almak veya göndermek için QR kodunuzu gösterin.</p>
          </TabsContent>
          <TabsContent value="scan_qr" className="mt-4 text-center">
             <div className="aspect-square bg-muted rounded-xl flex flex-col items-center justify-center">
                <p className="text-muted-foreground">Kamera yakında burada olacak.</p>
             </div>
             <Button className="w-full mt-4"><ScanLine className="mr-2 h-4 w-4" /> Kamerayı Aç</Button>
          </TabsContent>
          <TabsContent value="pay_code" className="mt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="pay-code">6 Haneli Ödeme Kodu</Label>
                    <Input id="pay-code" type="text" placeholder="XXXXXX" className="text-center tracking-[0.5em] text-lg" />
                </div>
                <Button className="w-full">Ödeme Yap</Button>
          </TabsContent>
          <TabsContent value="pay_phone" className="mt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <div className="relative flex items-center">
                      <Input id="phone" type="tel" placeholder="5XX XXX XX XX" className="pr-10" />
                      <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8 text-muted-foreground">
                        <Contact className="h-5 w-5" />
                      </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount-transfer">Tutar</Label>
                    <Input id="amount-transfer" type="number" placeholder="0.00 ₺" />
                </div>
                <Button className="w-full">Gönder</Button>
          </TabsContent>
        </Tabs>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Dialog>
            <DialogTrigger asChild>
                 <Button variant="ghost" className="flex flex-col h-auto gap-1.5 text-muted-foreground hover:text-foreground">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center"><PlusCircle /></div>
                    <span className="text-xs">Bakiye Yükle</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bakiye Yükle</DialogTitle>
                    <DialogDescription>Yüklemek istediğiniz tutarı girin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Tutar</Label>
                        <Input id="amount" type="number" placeholder="0.00 ₺" />
                    </div>
                     <Button className="w-full">Yükle</Button>
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="flex flex-col h-auto gap-1.5 text-muted-foreground hover:text-foreground">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center"><ArrowRightLeft /></div>
                    <span className="text-xs">Transfer</span>
                </Button>
            </DialogTrigger>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Para Transferi</DialogTitle>
                    <DialogDescription>Telefon numarası ile kolayca para gönderin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="phone-transfer">Telefon Numarası</Label>
                        <Input id="phone-transfer" type="tel" placeholder="5XX XXX XX XX" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount-transfer-dialog">Tutar</Label>
                        <Input id="amount-transfer-dialog" type="number" placeholder="0.00 ₺" />
                    </div>
                     <Button className="w-full">Gönder</Button>
                </div>
            </DialogContent>
        </Dialog>

        <Button asChild variant="ghost" className="flex flex-col h-auto gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/my-donations">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center"><History /></div>
                <span className="text-xs">Tüm İşlemler</span>
            </Link>
        </Button>

        <Button asChild variant="ghost" className="flex flex-col h-auto gap-1.5 text-muted-foreground hover:text-foreground">
             <Link href="/settings">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center"><MoreHorizontal /></div>
                <span className="text-xs">Ayarlar</span>
            </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">{`${selectedCardOwner.split(' ')[0]} H. A. - ${cardData[current]?.type} Kart İşlemleri`}</h2>
        <Card>
          <CardContent className="p-0">
            {transactions.length > 0 ? (
                <div className="divide-y">
                {transactions.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-semibold text-sm">{tx.brand}</p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${tx.amount.startsWith('+') ? 'text-green-600' : ''}`}>{tx.amount}</p>
                        {tx.donation !== '0.00 ₺' && (
                            <p className="text-xs text-primary font-semibold">Bağış: {tx.donation}</p>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    Bu kart için henüz işlem yok.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    