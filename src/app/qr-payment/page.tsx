'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, QrCode, ScanLine, Plus, Search, Filter, ArrowDownUp, Eye, Download, Share2, MoreHorizontal, Send } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ngos } from '@/lib/data';
import Image from 'next/image';

const cardData = [
  {
    id: 'bireysel',
    type: 'Bireysel',
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-500',
    number: '5549 6010 0000 1234',
    owner: 'İsmail Hilmi ADIGÜZEL',
    expiry: '12/28',
    balance: '1.250,75 ₺',
    ngoId: '1'
  },
  {
    id: 'ogrenci',
    type: 'Öğrenci',
    bgColor: 'bg-gradient-to-br from-blue-600 to-blue-800',
    number: '5549 6010 0000 5678',
    owner: 'İsmail Hilmi ADIGÜZEL',
    expiry: '10/27',
    balance: '345,50 ₺',
    ngoId: '2'
  },
  {
    id: 'ticari',
    type: 'Ticari',
    bgColor: 'bg-gradient-to-br from-[#042654] to-black',
    number: '5549 6010 0000 9012',
    owner: 'Hangel Ticari Hesap',
    expiry: '08/29',
    balance: '12.870,00 ₺',
    ngoId: '3'
  },
];

const donationTransactions = [
    { id: '1', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA Vakfı'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '120.50', donationAmount: '12.05', ngo: ['Ahbap Derneği'], date: '2024-07-20', time: '18:10' },
    { id: '3', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' },
    { id: '4', type: 'expense', brand: 'Tekno Market', purchaseAmount: '1500.00', donationAmount: '30.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-19', time: '11:45' },
    { id: '5', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '800.00', donationAmount: '80.00', ngo: ['WWF Türkiye'], date: '2024-07-18', time: '20:05' },
    { id: '6', type: 'expense', brand: 'Kitap Kurdu', purchaseAmount: '85.00', donationAmount: '8.50', ngo: ['TEGV'], date: '2024-07-18', time: '15:20' },
    { id: '7', type: 'expense', brand: 'Kahve Dünyası', purchaseAmount: '45.00', donationAmount: '4.50', ngo: ['TEMA Vakfı'], date: '2024-07-17', time: '09:05' },
    { id: '8', type: 'income', brand: 'Para Transferi', purchaseAmount: '150.00', donationAmount: '0.00', ngo: [], date: '2024-07-16', time: '12:00' },
    { id: '9', type: 'expense', brand: 'Spor Salonu', purchaseAmount: '350.00', donationAmount: '35.00', ngo: ['Ahbap Derneği'], date: '2024-07-15', time: '19:30' },
    { id: '10', type: 'expense', brand: 'Süpermarket', purchaseAmount: '210.75', donationAmount: '21.08', ngo: ['LÖSEV'], date: '2024-07-14', time: '17:00' },
    { id: '11', type: 'expense', brand: 'Sinema Biletleri', purchaseAmount: '180.00', donationAmount: '18.00', ngo: ['TEGV'], date: '2024-07-13', time: '21:00' },
    { id: '12', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '450.00', donationAmount: '45.00', ngo: ['TEMA Vakfı'], date: '2024-07-12', time: '13:15' },
    { id: '13', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '1000.00', donationAmount: '0.00', ngo: [], date: '2024-07-11', time: '09:00' },
    { id: '14', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '95.00', donationAmount: '9.50', ngo: ['Ahbap Derneği'], date: '2024-07-10', time: '12:45' },
    { id: '15', type: 'expense', brand: 'Tekno Market', purchaseAmount: '3200.00', donationAmount: '64.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-09', time: '16:00' },
    { id: '16', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '1250.00', donationAmount: '125.00', ngo: ['WWF Türkiye'], date: '2024-07-08', time: '22:30' },
    { id: '17', type: 'expense', brand: 'Kitap Kurdu', purchaseAmount: '150.00', donationAmount: '15.00', ngo: ['TEGV'], date: '2024-07-07', time: '14:00' },
    { id: '18', type: 'expense', brand: 'Kahve Dünyası', purchaseAmount: '60.00', donationAmount: '6.00', ngo: ['TEMA Vakfı'], date: '2024-07-06', time: '10:20' },
    { id: '19', type: 'income', brand: 'Para Transferi', purchaseAmount: '250.00', donationAmount: '0.00', ngo: [], date: '2024-07-05', time: '11:00' },
    { id: '20', type: 'expense', brand: 'Spor Salonu', purchaseAmount: '350.00', donationAmount: '35.00', ngo: ['Ahbap Derneği'], date: '2024-07-04', time: '19:45' },
    { id: '21', type: 'expense', brand: 'Süpermarket', purchaseAmount: '180.25', donationAmount: '18.03', ngo: ['LÖSEV'], date: '2024-07-03', time: '18:15' },
];

const TroyLogo = ({ className }: { className?: string }) => (
    <svg className={cn("w-12 h-auto", className)} viewBox="0 0 100 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.92 27.5V7.84H22.12V10.2H15.68V16.36H21.52V18.72H15.68V25.14H22.36V27.5H12.92Z" fill="white"/>
        <path d="M34.787 27.5L29.387 18.2V27.5H26.627V7.84H29.387L34.787 17.14V7.84H37.547V27.5H34.787Z" fill="white"/>
        <path d="M42.3333 27.5V7.84H53.6933V10.2H45.0933V16.36H53.0133V18.72H45.0933V27.5H42.3333Z" fill="white"/>
        <path d="M59.2559 27.5V7.84H62.0159V25.14H68.6959V27.5H59.2559Z" fill="white"/>
        <path d="M81.7197 17.67C81.7197 23.31 77.5197 27.78 71.7597 27.78C65.9997 27.78 61.7997 23.31 61.7997 17.67C61.7997 12.03 65.9997 7.56 71.7597 7.56C77.5197 7.56 81.7197 12.03 81.7197 17.67ZM64.5597 17.67C64.5597 21.75 67.7397 25.42 71.7597 25.42C75.7797 25.42 78.9597 21.75 78.9597 17.67C78.9597 13.59 75.7797 9.92 71.7597 9.92C67.7397 9.92 64.5597 13.59 64.5597 17.67Z" fill="white"/>
    </svg>
);


export default function QrPaymentPage() {
  const { toast } = useToast();
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const handleFlip = (cardId: string) => {
    setFlippedCardId(prev => (prev === cardId ? null : cardId));
  };
  
  const handleActionClick = (action: string) => {
    toast({
      title: 'İşlevsellik Yakında!',
      description: `Dekont ${action} özelliği yakında aktif olacaktır.`,
    });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 bg-secondary min-h-screen pb-24">
        <div className="flex justify-between items-center pt-4">
            <h1 className="text-3xl font-bold font-headline">Cüzdanım</h1>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full bg-muted h-8 w-8"><Plus className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Search className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-5 w-5" /></Button>
            </div>
        </div>
        
        <Tabs defaultValue={cardData[0].id} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0">
                {cardData.map((card) => (
                    <TabsTrigger
                        key={card.id}
                        value={card.id}
                        className={cn(
                            "data-[state=active]:shadow-lg data-[state=inactive]:opacity-70 rounded-none rounded-t-lg border-b-0 p-2 text-sm font-semibold text-white focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:z-10",
                             card.bgColor
                        )}
                    >
                        {card.type}
                    </TabsTrigger>
                ))}
            </TabsList>

            {cardData.map((card) => {
                 const ngo = ngos.find(n => n.id === card.ngoId);
                 return (
                <TabsContent key={card.id} value={card.id} className="mt-0 -translate-y-1">
                     <div className="relative [perspective:1000px] h-56">
                        <div
                            className={cn(
                                "relative h-full w-full rounded-b-2xl rounded-tr-2xl shadow-lg transition-transform duration-500 [transform-style:preserve-3d]",
                                flippedCardId === card.id && "[transform:rotateY(180deg)]"
                            )}
                        >
                            {/* FRONT */}
                            <div
                                className={cn(
                                    "absolute inset-0 p-6 flex flex-col justify-between text-white [backface-visibility:hidden] rounded-2xl",
                                    card.bgColor
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-lg">{card.type}</p>
                                    <p className="font-semibold text-2xl">{card.balance}</p>
                                </div>
                                <div className="relative">
                                    <p className="font-mono tracking-widest text-lg mb-2">{card.number.replace(/(.{4})/g, '$1 ').trim()}</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs opacity-80">Kart Sahibi</p>
                                            <p className="font-semibold text-sm uppercase">{card.owner}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs opacity-80">SKT</p>
                                            <p className="font-semibold text-sm">{card.expiry}</p>
                                        </div>
                                    </div>
                                    <TroyLogo className="absolute bottom-0 right-0" />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-4 -translate-y-1/2 h-12 w-12 rounded-full text-white/70 hover:bg-white/20 hover:text-white"
                                    onClick={() => handleFlip(card.id)}
                                >
                                    <Send className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* BACK */}
                            <div
                                className={cn(
                                    "absolute inset-0 p-6 flex flex-col justify-center items-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl cursor-pointer",
                                    card.bgColor
                                )}
                                onClick={() => handleFlip(card.id)}
                            >
                                <p className="text-sm opacity-80 mb-2">Bu kart ile desteklenen kuruluş</p>
                                {ngo ? (
                                    <div className="text-center">
                                        <Image src={ngo.avatarUrl} alt={ngo.name} width={64} height={64} className="rounded-full bg-white/80 p-2 mb-2 mx-auto"/>
                                        <p className="font-semibold text-lg">{ngo.name}</p>
                                    </div>
                                ) : (
                                    <p>STK Bilgisi Yok</p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            )})}
        </Tabs>


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
        <CardHeader>
           <CardTitle>Son İşlemler</CardTitle>
           <div className="flex justify-between items-center gap-2 pt-2">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ara..." className="pl-8 text-sm h-9 w-full" />
                </div>
                <div className='flex'>
                    <Button variant="ghost" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <ArrowDownUp className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
              {donationTransactions.map(donation => {
                const donationAmount = parseFloat(donation.donationAmount);
                const tax = donationAmount * 0.20;
                const hangelShare = donationAmount * 0.10;
                const ngoShare = donationAmount - tax - hangelShare;

                return (
                    <AccordionItem key={donation.id} value={`item-${donation.id}`} className="border-b last:border-b-0">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1 text-left">
                                <p>{donation.brand}</p>
                                <p className="text-xs text-muted-foreground">
                                    {format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`${donation.type === 'income' ? 'text-green-600' : ''}`}>{donation.purchaseAmount} ₺</p>
                                {donation.type === 'expense' && <p className="text-xs text-primary">Bağış: {donation.donationAmount} ₺</p>}
                            </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 bg-muted/50">
                            <div className="space-y-2 text-sm mt-2 pt-4 border-t">
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                                    <span>{donation.purchaseAmount} ₺</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>Toplam Bağış</span>
                                    <span className='text-primary'>{donation.donationAmount} ₺</span>
                                </div>
                                <Separator />
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>Desteklenen STK Payı</span>
                                    <span>{ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>Vergi (%20)</span>
                                    <span>{tax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>hangel Katkı Payı (%10)</span>
                                    <span>{hangelShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                                {donation.ngo.length > 0 && <Separator />}
                                {donation.ngo.length > 0 && (
                                    <div className='flex justify-between text-xs mt-2'>
                                        <span className='text-muted-foreground'>Desteklenen STK(lar)</span>
                                        <span className="text-right">{donation.ngo.join(', ')}</span>
                                    </div>
                                )}
                                <div className='flex justify-between items-center text-xs pt-2'>
                                    <div>
                                        <span className='text-muted-foreground'>İşlem Tarihi: </span>
                                        <span>{format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy - HH:mm', { locale: tr })}</span>
                                    </div>
                                    <div className="flex">
                                        <Button size="icon" variant="ghost" onClick={() => handleActionClick('görüntüleme')}><Eye className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleActionClick('indirme')}><Download className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleActionClick('paylaşma')}><Share2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
              })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
