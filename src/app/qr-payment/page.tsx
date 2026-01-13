'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, History, MoreHorizontal, RefreshCw, CheckCircle, ScanLine, Keyboard, Phone, Contact, Filter, ArrowDownUp } from 'lucide-react';
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

const RealisticQrCodeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 45 45" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h7v7H0zM2 2h3v3H2zM9 0h2v1H9zM12 0h1v2h-1zM14 0h1v2h-1zM16 0h1v2h-1zM18 0h1v1h-1zM20 0h1v1h-1zM22 0h1v2h-1zM24 0h1v1h-1zM26 0h1v1h-1zM29 0h1v1h-1zM31 0h1v1h-1zM33 0h1v1h-1zM35 0h2v1h-2zM38 0h7v7h-7zm2 2h3v3h-3zM0 9h1v2H0zM0 12h1v1h-1zM0 14h1v1h-1zM0 16h2v1H0zM0 18h1v1h-1zM0 20h2v1H0zM0 22h1v1h-1zM0 24h1v1h-1zM0 26h1v1h-1zM0 29h2v1H0zM0 31h1v1h-1zM0 33h1v1h-1zM0 35h1v2H0zM0 38h7v7H0zm2 2h3v3H2zM9 38h1v1H9zM11 38h1v1h-1zM14 38h1v1h-1zM16 38h1v1h-1zM18 38h1v1h-1zM20 38h2v1h-2zM23 38h1v1h-1zM25 38h2v1h-2zM28 38h1v1h-1zM30 38h1v1h-1zM32 38h2v1h-2zM34 38h1v2h-1zM38 38h7v7h-7zm2 2h3v3h-3zM7 9H6v1h1zM7 11H6v1h1zM7 14H6v1h1zM7 16H6v2h1zM7 19H6v1h1zM7 21H6v2h1zM7 24H6v1h1zM7 26H6v1h1zM7 28H6v1h1zM7 30H6v1h1zM7 33H6v1h1zM7 35H6v2h1zM9 7V6h1v1zM11 7V6h2v1zM14 7V6h1v1zM16 7V6h1v1zM18 7V6h2v1zM20 7V6h2v1zM23 7V6h2v1zM25 7V6h2v1zM28 7V6h2v1zM31 7V6h1v1zM33 7V6h1v1zM35 7V6h2v1zM44 9h-1v1h1zM44 11h-1v1h1zM44 14h-1v2h1zM44 17h-1v1h1zM44 19h-1v2h1zM44 21h-2v1h2zM44 24h-1v1h1zM44 26h-2v1h2zM44 28h-1v1h1zM44 30h-1v1h1zM44 33h-1v2h1zM44 35h-1v1h1zM9 44v-1h2v1zM12 44v-1h2v1zM15 44v-1h1v1zM17 44v-1h2v1zM20 44v-1h1v1zM22 44v-1h1v1zM24 44v-1h1v1zM26 44v-1h1v1zM28 44v-1h1v1zM30 44v-1h2v1zM33 44v-1h1v1zM35 44v-1h2v1zM38 9h-1v2h1zM38 12h-1v1h1zM38 14h-1v2h1zM38 17h-1v1h1zM38 19h-1v1h1zM38 21h-1v1h1zM38 23h-1v2h1zM38 26h-1v1h1zM38 28h-1v1h1zM38 31h-1v1h1zM38 33h-1v1h1zM38 35h-1v2h1zM8 8h2v1H8zM11 8h1v1h-1zM13 8h1v2h-1zM15 8h1v1h-1zM17 8h1v2h-1zM19 8h1v1h-1zM21 8h1v1h-1zM23 8h1v1h-1zM25 8h1v2h-1zM27 8h1v1h-1zM29 8h1v1h-1zM31 8h1v2h-1zM33 8h2v1h-2zM36 8h1v2h-1zM8 10h1v1H8zM10 10h1v1h-1zM12 10h1v1h-1zM14 10h2v1h-2zM17 10h1v1h-1zM19 10h1v1h-1zM21 10h1v1h-1zM23 10h1v2h-1zM25 10h1v1h-1zM27 10h1v1h-1zM29 10h1v1h-1zM31 10h1v1h-1zM33 10h1v1h-1zM35 10h1v1h-1zM37 10h1v1h-1zM8 12h1v2H8zM10 12h1v1h-1zM12 12h2v1h-2zM15 12h2v1h-2zM18 12h1v1h-1zM20 12h2v1h-2zM23 12h1v1h-1zM25 12h1v1h-1zM27 12h2v1h-2zM29 12h1v1h-1zM31 12h1v1h-1zM33 12h2v1h-2zM36 12h1v1h-1zM8 14h2v1H8zM11 14h1v1h-1zM13 14h2v1h-2zM16 14h2v1h-2zM19 14h1v1h-1zM21 14h1v1h-1zM23 14h2v1h-2zM26 14h1v1h-1zM28 14h1v1h-1zM30 14h1v1h-1zM32 14h1v1h-1zM34 14h1v1h-1zM36 14h1v1h-1zM8 16h1v1H8zM10 16h1v1h-1zM12 16h1v1h-1zM14 16h1v1h-1zM16 16h2v1h-2zM19 16h2v1h-2zM22 16h1v2h-1zM24 16h1v1h-1zM26 16h1v1h-1zM28 16h1v1h-1zM30 16h1v2h-1zM32 16h1v1h-1zM34 16h1v1h-1zM36 16h1v1h-1zM8 18h1v1H8zM10 18h1v1h-1zM12 18h2v1h-2zM15 18h1v1h-1zM17 18h1v1h-1zM19 18h1v1h-1zM21 18h1v1h-1zM23 18h1v1h-1zM25 18h1v1h-1zM27 18h1v1h-1zM29 18h1v1h-1zM31 18h1v2h-1zM33 18h1v1h-1zM35 18h1v1h-1zM37 18h1v1h-1zM8 20h2v1H8zM11 20h1v1h-1zM13 20h1v1h-1zM15 20h2v1h-2zM18 20h1v1h-1zM20 20h1v1h-1zM22 20h1v1h-1zM24 20h2v1h-2zM27 20h1v1h-1zM29 20h1v2h-1zM31 20h2v1h-2zM34 20h1v1h-1zM36 20h2v1h-2zM8 22h1v2H8zM10 22h1v1h-1zM12 22h2v1h-2zM15 22h1v1h-1zM17 22h1v1h-1zM19 22h1v1h-1zM21 22h1v1h-1zM23 22h1v1h-1zM25 22h1v2h-1zM27 22h1v1h-1zM29 22h1v1h-1zM31 22h1v1h-1zM33 22h1v1h-1zM35 22h1v1h-1zM37 22h1v1h-1zM8 24h1v1H8zM10 24h1v2h-1zM12 24h1v1h-1zM14 24h1v2h-1zM16 24h1v1h-1zM18 24h1v1h-1zM20 24h1v1h-1zM22 24h1v1h-1zM24 24h2v1h-2zM27 24h2v1h-2zM30 24h2v1h-2zM33 24h1v1h-1zM35 24h2v1h-2zM8 26h1v1H8zM10 26h1v1h-1zM12 26h1v1h-1zM14 26h1v1h-1zM16 26h1v1h-1zM18 26h1v1h-1zM20 26h2v1h-2zM23 26h1v1h-1zM25 26h1v1h-1zM27 26h1v1h-1zM29 26h1v1h-1zM31 26h1v1h-1zM33 26h1v1h-1zM35 26h1v1h-1zM37 26h1v1h-1zM8 28h1v2H8zM10 28h2v1h-2zM13 28h1v1h-1zM15 28h1v1h-1zM17 28h2v1h-2zM20 28h1v1h-1zM22 28h1v1h-1zM24 28h1v1h-1zM26 28h2v1h-2zM29 28h1v1h-1zM31 28h1v1h-1zM33 28h1v2h-1zM35 28h1v1h-1zM37 28h1v1h-1zM8 30h1v1H8zM10 30h1v1h-1zM12 30h1v1h-1zM14 30h1v1h-1zM16 30h1v1h-1zM18 30h1v1h-1zM20 30h1v1h-1zM22 30h1v2h-1zM24 30h2v1h-2zM27 30h1v1h-1zM29 30h2v1h-2zM32 30h1v1h-1zM34 30h2v1h-2zM37 30h1v1h-1zM8 32h2v1H8zM11 32h1v1h-1zM13 32h1v1h-1zM15 32h2v1h-2zM18 32h1v1h-1zM20 32h1v1h-1zM22 32h1v1h-1zM24 32h1v1h-1zM26 32h1v1h-1zM28 32h1v1h-1zM30 32h1v1h-1zM32 32h1v2h-1zM34 32h1v1h-1zM36 32h1v1h-1zM8 34h1v1H8zM10 34h1v1h-1zM12 34h1v1h-1zM14 34h1v1h-1zM16 34h2v1h-2zM19 34h1v1h-1zM21 34h2v1h-2zM24 34h1v2h-1zM26 34h2v1h-2zM29 34h1v1h-1zM31 34h1v1h-1zM33 34h1v1h-1zM35 34h1v1h-1zM37 34h1v1h-1zM8 36h1v1H8zM10 36h1v1h-1zM12 36h1v2h-1zM14 36h2v1h-2zM17 36h2v1h-2zM20 36h1v1h-1zM22 36h1v1h-1zM24 36h1v1h-1zM26 36h2v1h-2zM29 36h1v1h-1zM31 36h2v1h-2zM34 36h1v1h-1zM36 36h1v1h-1z"/>
    </svg>
);


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
        <Button variant="ghost" size="icon" className="absolute bottom-4 right-4 h-8 w-8 text-white/70 hover:text-white" onClick={onFlip}>
            <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Card Back */}
      <div className={cn("absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-6 flex flex-col justify-between shadow-lg overflow-hidden", card.textColor)}>
         <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${card.patternUrl})`, opacity: 0.1}}></div>
        <div className={`absolute inset-0 ${card.bgColor} opacity-95`}></div>
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-sm opacity-80 mb-4">Ödeme yapmak için QR kodu okutun.</p>
            <div className="bg-white/10 p-2 rounded-lg">
                 <RealisticQrCodeIcon className="h-20 w-20 text-white" />
            </div>
        </div>
         <Button variant="ghost" size="icon" className="absolute bottom-4 right-4 h-8 w-8 text-white/70 hover:text-white" onClick={onFlip}>
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

      <Card>
        <CardHeader>
          <CardTitle>Ödeme Seçenekleri</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="my_qr" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="my_qr">QR Kodum</TabsTrigger>
              <TabsTrigger value="scan_qr">QR Tara</TabsTrigger>
              <TabsTrigger value="pay_code">Kod ile</TabsTrigger>
              <TabsTrigger value="pay_phone">Numarayla</TabsTrigger>
            </TabsList>
            <TabsContent value="my_qr" className="mt-4 text-center">
               <div className="bg-muted p-4 rounded-lg inline-block shadow-inner">
                 <RealisticQrCodeIcon className="h-32 w-32 text-foreground" />
              </div>
              <p className="mt-4 font-mono text-2xl tracking-widest text-foreground font-semibold">h 123456</p>
              <p className="mt-2 text-xs text-muted-foreground">Ödeme almak veya göndermek için QR kodunuzu veya hangel kodunuzu kullanın.</p>
            </TabsContent>
            <TabsContent value="scan_qr" className="mt-4 text-center">
              <div className="w-1/2 aspect-square bg-muted rounded-xl flex flex-col items-center justify-center mx-auto">
                  <p className="text-muted-foreground text-sm">Kamera yakında burada olacak.</p>
              </div>
              <Button className="w-full mt-4"><ScanLine /> Kamerayı Aç</Button>
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
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
      </Card>


      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>Son İşlemler</CardTitle>
           <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowDownUp className="h-4 w-4" />
                </Button>
           </div>
        </CardHeader>
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
  );
}
    