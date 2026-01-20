'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, QrCode, ScanLine, Plus, Search, Filter, ArrowDownUp, Eye, Download, Share2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

const cardData = [
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


export default function QrPaymentPage() {
  const { toast } = useToast();

  const handleActionClick = (action: string) => {
    toast({
      title: 'İşlevsellik Yakında!',
      description: `Dekont ${action} özelliği yakında aktif olacaktır.`,
    });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 bg-secondary min-h-screen">
        <h1 className="text-3xl font-bold font-headline pt-4">Cüzdanım</h1>
        
        <div className="space-y-4">
            {cardData.map((card, index) => (
                <div key={index} className={cn("h-56 rounded-2xl p-6 flex flex-col justify-between shadow-lg text-white", card.bgColor)}>
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
            ))}
        </div>


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
