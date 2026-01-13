'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRightLeft, History, MoreHorizontal, RefreshCw, ScanLine, Keyboard, Phone, Contact, Filter, ArrowDownUp, ToggleRight, Snowflake, CircleDollarSign, QrCode } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
    balance: '1.250,75 ₺',
    borderColorClass: 'border-gray-700'
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
    balance: '345,50 ₺',
    borderColorClass: 'border-blue-400'
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
    balance: '12.870,00 ₺',
    borderColorClass: 'border-amber-400'
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

const RealisticQrCodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" {...props}>
      <path d="M0 0 H 30 V 30 H 0 Z M 10 10 V 20 H 20 V 10 Z" />
      <path d="M70 0 H 100 V 30 H 70 Z M 80 10 V 20 H 90 V 10 Z" />
      <path d="M0 70 H 30 V 100 H 0 Z M 10 80 V 90 H 20 V 80 Z" />
      <path d="M90 60 H 100 V 70 H 90ZM70 70 H 80 V 80 H 70ZM80 80 H 90 V 90 H 80ZM90 90 H 100 V 100 H 90ZM70 90 H 80 V 100 H 70ZM60 90 H 70 V 100 H 60ZM60 70 H 70 V 80 H 60Z" />
      <path d="M40 0 H 50 V 10 H 40 Z M 40 20 H 50 V 30 H 40 Z M 40 40 H 50 V 50 H 40 Z M 40 60 H 50 V 70 H 40 Z M 40 80 H 50 V 90 H 40 Z M 0 40 H 10 V 50 H 0 Z M 20 40 H 30 V 50 H 20 Z M 40 40 H 50 V 50 H 40 Z M 60 40 H 70 V 50 H 60 Z M 80 40 H 90 V 50 H 80 Z M 10 50 H 20 V 60 H 10 Z M 30 50 H 40 V 60 H 30 Z M 50 50 H 60 V 60 H 50 Z M 70 50 H 80 V 60 H 70 Z M 90 50 H 100 V 60 H 90 Z" />
      <path d="M 35 35 H 65 V 65 H 35 Z M 45 45 H 55 V 55 H 45 Z"/>
    </svg>
);


const CardFace = ({ card, isFlipped, onFlip, onFrontClick }: { card: typeof cardData[0], isFlipped: boolean, onFlip: () => void, onFrontClick: () => void }) => {
  return (
    <div className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
      {/* Card Front */}
      <div 
        onClick={onFrontClick}
        className={cn("absolute w-full h-full [backface-visibility:hidden] rounded-2xl p-6 flex flex-col justify-between shadow-lg overflow-hidden cursor-pointer", card.textColor)}
      >
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
        <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 h-8 w-8 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); onFlip(); }}>
            <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Card Back */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn("absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-4 flex flex-col justify-between shadow-lg overflow-hidden", card.textColor, card.bgColor)}>
        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${card.patternUrl})`, opacity: 0.1}}></div>
        <div className="relative z-10 space-y-3">
          <CardTitle className="text-lg">Kart Ayarları</CardTitle>
           <div className="flex items-center justify-between text-sm">
                <label htmlFor="online-shopping" className="flex items-center gap-2 font-medium">
                  <ToggleRight className="h-5 w-5"/> İnternet Alışverişi
                </label>
                <Switch id="online-shopping" defaultChecked/>
            </div>
             <Button variant="ghost" className="w-full justify-start p-0 h-auto text-sm font-medium flex items-center gap-2">
              <Snowflake className="h-5 w-5"/> Kartı Dondur
            </Button>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto text-sm font-medium flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5"/> Limit Belirle
            </Button>
        </div>
        <div className="relative z-10 flex justify-end gap-2">
           <Button variant="secondary" size="sm">Bakiye Yükle</Button>
           <Button variant="secondary" size="sm">Sticker</Button>
        </div>
         <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 h-8 w-8 text-white/70 hover:text-white" onClick={onFlip}>
             <RefreshCw className="h-5 w-5" />
         </Button>
      </div>
    </div>
  )
};

export default function QrPaymentPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedStates, setFlippedStates] = useState<Record<string, boolean>>({});

  const handleCardClick = (index: number) => {
    // Only allow cycling through cards when clicking the active (top) card
    if (index === activeIndex) {
      setActiveIndex((prevIndex) => (prevIndex + 1) % cardData.length);
    }
  };

  const toggleFlip = (cardId: string) => {
    setFlippedStates(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const selectedCard = cardData[activeIndex];
  const selectedCardId = selectedCard?.id as keyof typeof allTransactions;
  const transactions = allTransactions[selectedCardId] || [];


  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Cüzdanım</h1>

        <div className="relative h-[280px] w-full">
            {cardData.map((card, index) => {
                const isActive = index === activeIndex;
                const isBehind = index > activeIndex;
                const zIndex = cardData.length - index;
                
                return (
                    <div 
                        key={card.id}
                        className="absolute w-full h-56 transition-all duration-500 ease-in-out [perspective:1000px]"
                        style={{
                            zIndex: isActive ? zIndex + 10 : zIndex,
                            transform: `translateY(${isActive ? 0 : (index < activeIndex ? -150 : (index - activeIndex) * 30)}px) scale(${isActive ? 1 : 1 - ((index - activeIndex) * 0.05)})`,
                            filter: `blur(${isActive ? 0 : '2px'})`,
                            opacity: isActive ? 1 : (isBehind ? 1 : 0),
                            pointerEvents: isActive ? 'auto' : 'none'
                        }}
                    >
                        <CardFace 
                            card={card} 
                            isFlipped={!!flippedStates[card.id]} 
                            onFlip={() => toggleFlip(card.id)}
                            onFrontClick={() => handleCardClick(index)}
                        />
                    </div>
                )
            })}
        </div>

      <Card className={cn("transition-colors duration-500", selectedCard.borderColorClass)}>
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
              <p className="mt-2 text-xs text-muted-foreground">Ödeme almak veya göndermek için hangel kodunuzu kullanın.</p>
              <div className="bg-white p-4 rounded-lg shadow-md inline-block my-4">
                 <RealisticQrCodeIcon className="w-32 h-32" />
              </div>
              <p className="mt-2 font-mono text-2xl tracking-widest text-foreground font-semibold">h 123456</p>
            </TabsContent>
            <TabsContent value="scan_qr" className="mt-4 text-center">
              <div className="w-1/2 aspect-square bg-muted rounded-xl flex flex-col items-center justify-center mx-auto">
                  <p className="text-muted-foreground text-sm">Kamera yakında burada olacak.</p>
              </div>
              <Button className="w-full mt-4 bg-primary"><ScanLine /> Kamerayı Aç</Button>
            </TabsContent>
            <TabsContent value="pay_code" className="mt-4 space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="pay-code">6 Haneli Ödeme Kodu</Label>
                      <Input id="pay-code" type="text" placeholder="XXXXXX" className="text-center tracking-[0.5em] text-lg" />
                  </div>
                  <Button className="w-full bg-primary">Ödeme Yap</Button>
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
                  <Button className="w-full bg-primary">Gönder</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className={cn("transition-colors duration-500", selectedCard.borderColorClass)}>
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


      <Card className={cn("transition-colors duration-500", selectedCard.borderColorClass)}>
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
    