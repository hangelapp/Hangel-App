'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, QrCode, ScanLine, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

const initialCardData = [
  {
    id: 'bireysel',
    type: 'Bireysel',
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-500',
    textColor: 'text-white',
    owner: 'İsmail Hilmi ADIGÜZEL',
    number: '**** 1234',
    balance: '1.250,75 ₺',
  },
  {
    id: 'ogrenci',
    type: 'Öğrenci',
    bgColor: 'bg-gradient-to-br from-blue-600 to-blue-800',
    textColor: 'text-white',
    owner: 'İsmail Hilmi ADIGÜZEL',
    number: '**** 5678',
    balance: '345,50 ₺',
  },
  {
    id: 'ticari',
    type: 'Ticari',
    bgColor: 'bg-gradient-to-br from-[#042654] to-black',
    textColor: 'text-white',
    owner: 'İsmail H. ADIGÜZEL - TİCARİ',
    number: '**** 9012',
    balance: '12.870,00 ₺',
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


export default function QrPaymentPage() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0);
  const [cardData, setCardData] = useState(initialCardData[0]);

  useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrent(api.selectedScrollSnap())

    const handleSelect = () => {
        const newIndex = api.selectedScrollSnap();
        setCurrent(newIndex);
        setCardData(initialCardData[newIndex]);
    }

    api.on("select", handleSelect)

    return () => {
      api.off("select", handleSelect)
    }
  }, [api])

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 bg-secondary min-h-screen">
        <h1 className="text-3xl font-bold font-headline pt-4">Cüzdanım</h1>

        <Carousel setApi={setApi} className="w-full">
            <CarouselContent className="-ml-4">
                {initialCardData.map((card, index) => (
                    <CarouselItem key={index} className="pl-4 basis-5/6 md:basis-1/2">
                       <div className={cn("h-56 rounded-2xl p-6 flex flex-col justify-between shadow-lg text-white", card.bgColor)}>
                            <div>
                                <div className='flex justify-between items-start'>
                                    <p className={`font-semibold text-lg`}>{card.type}</p>
                                    <p className="font-semibold text-2xl">{card.balance}</p>
                                </div>
                            </div>
                            <div>
                                <p className="font-mono tracking-widest text-lg">{card.number}</p>
                                <p className={`font-semibold text-sm`}>{card.owner}</p>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>

        <div className="grid grid-cols-4 gap-4 text-center">
            <div className='flex flex-col items-center gap-2'>
                <Button size="icon" className="h-14 w-14 rounded-full"><QrCode className="h-7 w-7" /></Button>
                <p className="text-xs font-medium">QR Göster</p>
            </div>
            <div className='flex flex-col items-center gap-2'>
                <Button size="icon" className="h-14 w-14 rounded-full"><ScanLine className="h-7 w-7" /></Button>
                <p className="text-xs font-medium">QR Tara</p>
            </div>
             <div className='flex flex-col items-center gap-2'>
                <Button size="icon" className="h-14 w-14 rounded-full"><Plus className="h-7 w-7" /></Button>
                <p className="text-xs font-medium">Bakiye Yükle</p>
            </div>
             <div className='flex flex-col items-center gap-2'>
                <Button size="icon" className="h-14 w-14 rounded-full"><ArrowRightLeft className="h-7 w-7" /></Button>
                <p className="text-xs font-medium">Transfer</p>
            </div>
        </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>Son İşlemler</CardTitle>
           <Button variant="ghost" size="sm">Tümünü Gör</Button>
        </CardHeader>
        <CardContent className="p-0">
          {(allTransactions[cardData.id as keyof typeof allTransactions] || []).length > 0 ? (
              <div className="divide-y">
              {(allTransactions[cardData.id as keyof typeof allTransactions]).map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-4">
                  <div>
                      <p className="font-semibold">{tx.brand}</p>
                      <p className="text-sm text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className="text-right">
                      <p className={`font-bold text-base ${tx.amount.startsWith('+') ? 'text-green-600' : ''}`}>{tx.amount}</p>
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
