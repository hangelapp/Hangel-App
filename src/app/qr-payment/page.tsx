'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, QrCode, ScanLine, Plus, Search, Filter, ArrowDownUp, Eye, Download, Share2, MoreHorizontal, RotateCw, SlidersHorizontal, KeyRound, Power, MessageSquareWarning, MinusCircle, Link as LinkIcon, Contact, Copy, CreditCard } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const cardData = [
  {
    id: 'bireysel',
    type: 'Bireysel',
    bgColor: 'bg-gradient-to-br from-primary via-orange-600 to-primary/80',
    number: '5549 6010 0000 1234',
    owner: 'İsmail Hilmi ADIGÜZEL',
    expiry: '12/28',
    balance: '1.250,75 ₺',
    ngoId: '1',
    cvv: '123'
  },
  {
    id: 'ogrenci',
    type: 'Öğrenci',
    bgColor: 'bg-gradient-to-br from-cyan-700 via-cyan-500 to-cyan-800',
    number: '5549 6010 0000 5678',
    owner: 'İsmail Hilmi ADIGÜZEL',
    expiry: '10/27',
    balance: '345,50 ₺',
    ngoId: '2',
    cvv: '456'
  },
  {
    id: 'ticari',
    type: 'Ticari',
    bgColor: 'bg-gradient-to-br from-foreground via-blue-900 to-foreground/80',
    number: '5549 6010 0000 9012',
    owner: 'Hangel Ticari Hesap',
    expiry: '08/29',
    balance: '12.870,00 ₺',
    ngoId: '3',
    cvv: '789'
  },
];

const donationTransactions = [
    { id: '1', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA Vakfı', 'LÖSEV'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '120.50', donationAmount: '12.05', ngo: ['Ahbap Derneği', 'TEGV'], date: '2024-07-20', time: '18:10' },
    { id: '3', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' },
    { id: '4', type: 'expense', brand: 'Tekno Market', purchaseAmount: '1500.00', donationAmount: '30.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-19', time: '11:45' },
    { id: '5', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '800.00', donationAmount: '80.00', ngo: ['WWF Türkiye', 'TEMA Vakfı'], date: '2024-07-18', time: '20:05' },
    { id: '6', type: 'expense', brand: 'Kitap Kurdu', purchaseAmount: '85.00', donationAmount: '8.50', ngo: ['TEGV', 'Tohum Otizm Vakfı'], date: '2024-07-18', time: '15:20' },
    { id: '7', type: 'expense', brand: 'Kahve Dünyası', purchaseAmount: '45.00', donationAmount: '4.50', ngo: ['TEMA Vakfı', 'Ahbap Derneği'], date: '2024-07-17', time: '09:05' },
    { id: '8', type: 'income', brand: 'Para Transferi', purchaseAmount: '150.00', donationAmount: '0.00', ngo: [], date: '2024-07-16', time: '12:00' },
    { id: '9', type: 'expense', brand: 'Spor Salonu', purchaseAmount: '350.00', donationAmount: '35.00', ngo: ['Ahbap Derneği', 'LÖSEV'], date: '2024-07-15', time: '19:30' },
    { id: '10', type: 'expense', brand: 'Süpermarket', purchaseAmount: '210.75', donationAmount: '21.08', ngo: ['LÖSEV', 'TEMA Vakfı'], date: '2024-07-14', time: '17:00' },
    { id: '11', type: 'expense', brand: 'Sinema Biletleri', purchaseAmount: '180.00', donationAmount: '18.00', ngo: ['TEGV', 'Ahbap Derneği'], date: '2024-07-13', time: '21:00' },
    { id: '12', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '450.00', donationAmount: '45.00', ngo: ['TEMA Vakfı', 'WWF Türkiye'], date: '2024-07-12', time: '13:15' },
    { id: '13', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '1000.00', donationAmount: '0.00', ngo: [], date: '2024-07-11', time: '09:00' },
    { id: '14', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '95.00', donationAmount: '9.50', ngo: ['Ahbap Derneği', 'LÖSEV'], date: '2024-07-10', time: '12:45' },
    { id: '15', type: 'expense', brand: 'Tekno Market', purchaseAmount: '3200.00', donationAmount: '64.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-09', time: '16:00' },
    { id: '16', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '1250.00', donationAmount: '125.00', ngo: ['WWF Türkiye', 'Ahbap Derneği'], date: '2024-07-08', time: '22:30' },
    { id: '17', type: 'expense', brand: 'Kitap Kurdu', purchaseAmount: '150.00', donationAmount: '15.00', ngo: ['TEGV', 'TEMA Vakfı'], date: '2024-07-07', time: '14:00' },
    { id: '18', type: 'expense', brand: 'Kahve Dünyası', purchaseAmount: '60.00', donationAmount: '6.00', ngo: ['TEMA Vakfı', 'Tohum Otizm Vakfı'], date: '2024-07-06', time: '10:20' },
    { id: '19', type: 'income', brand: 'Para Transferi', purchaseAmount: '250.00', donationAmount: '0.00', ngo: [], date: '2024-07-05', time: '11:00' },
    { id: '20', type: 'expense', brand: 'Spor Salonu', purchaseAmount: '350.00', donationAmount: '35.00', ngo: ['Ahbap Derneği', 'TEGV'], date: '2024-07-04', time: '19:45' },
    { id: '21', type: 'expense', brand: 'Süpermarket', purchaseAmount: '180.25', donationAmount: '18.03', ngo: ['LÖSEV', 'Ahbap Derneği'], date: '2024-07-03', time: '18:15' },
];

const ActivationDialog = ({ card, open, onClose, onActivate }: { card: any, open: boolean, onClose: () => void, onActivate: (id: string) => void }) => {
    if (!card) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onActivate(card.id);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kart Aktivasyonu - {card.type}</DialogTitle>
                    <DialogDescription>Lütfen kartınızı aktif etmek için gerekli bilgileri girin.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {card.type === 'Öğrenci' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="school-name">Okul Adı</Label>
                                <Input id="school-name" placeholder="Boğaziçi Üniversitesi" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student-id">Öğrenci Kimlik No</Label>
                                <Input id="student-id" placeholder="12345678901" required />
                            </div>
                        </>
                    )}
                    {card.type === 'Ticari' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="company-name">Şirket Adı</Label>
                                <Input id="company-name" placeholder="Hangel A.Ş." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax-no">Vergi Numarası</Label>
                                <Input id="tax-no" placeholder="1234567890" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax-office">Vergi Dairesi</Label>
                                <Input id="tax-office" placeholder="Kadıköy" required />
                            </div>
                        </>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
                        <Button type="submit">Kartı Aktive Et</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default function QrPaymentPage() {
  const { toast } = useToast();
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState(cardData[0].id);
  const [frozenCards, setFrozenCards] = useState<Record<string, boolean>>({});
  const [showCardDetails, setShowCardDetails] = useState<Record<string, boolean>>({});
  const [activatedCards, setActivatedCards] = useState<Record<string, boolean>>({ bireysel: true });
  const [showActivationDialog, setShowActivationDialog] = useState<string | null>(null);

  const cardToActivate = cardData.find(c => c.id === showActivationDialog);

  const handleFlip = (cardId: string) => {
    setFlippedCardId(prev => (prev === cardId ? null : cardId));
  };
  
  const toggleFreezeCard = (cardId: string) => {
    const isCurrentlyFrozen = frozenCards[cardId] || false;
    setFrozenCards(prev => ({...prev, [cardId]: !isCurrentlyFrozen }));
    toast({
        title: !isCurrentlyFrozen ? "Kart Donduruldu" : "Kart Aktif Edildi",
    });
    handleFlip(cardId);
  };
  
   const handleActivateCard = (cardId: string) => {
    setActivatedCards(prev => ({ ...prev, [cardId]: true }));
    toast({ title: "Kart Başarıyla Aktive Edildi!" });
  };

  const CardSettings = ({ cardId }: { cardId: string }) => {
    const handleSettingClick = (settingName: string) => {
        toast({
            title: "Kart Ayarları",
            description: `${settingName} işlevi yakında aktif olacaktır.`,
        });
    };
    const isCardActivated = activatedCards[cardId];
    const isCardFrozen = frozenCards[cardId];
    const card = cardData.find(c => c.id === cardId)!;

    return (
        <div className="w-full h-full flex flex-col justify-start text-left space-y-1 p-3 bg-black/20 rounded-lg backdrop-blur-sm overflow-y-auto">
            <h4 className="font-semibold text-base mb-1 text-center text-white/90">Kart Ayarları</h4>
            <Button onClick={() => setShowCardDetails(prev => ({ ...prev, [cardId]: !prev[cardId] }))} variant="ghost" size="sm" className="h-auto py-1 w-full justify-start text-white/90 hover:bg-white/20 hover:text-white text-sm"><KeyRound className="mr-2 h-4 w-4" /> Kart Bilgileri</Button>
            <Button onClick={() => handleSettingClick('Limit Değişikliği')} variant="ghost" size="sm" className="h-auto py-1 w-full justify-start text-white/90 hover:bg-white/20 hover:text-white text-sm"><SlidersHorizontal className="mr-2 h-4 w-4" /> Limit Değişikliği</Button>
            <Button 
                onClick={() => {
                    if (!isCardActivated) {
                        setShowActivationDialog(cardId);
                    } else {
                        toggleFreezeCard(cardId);
                    }
                }}
                variant="ghost" 
                size="sm" 
                className="h-auto py-1 w-full justify-start text-white/90 hover:bg-white/20 hover:text-white text-sm"
            >
                <Power className="mr-2 h-4 w-4" /> {!isCardActivated ? 'Kartı Aktive Et' : (isCardFrozen ? 'Kartı Aktif Et' : 'Kartı Dondur')}
            </Button>
            <Button onClick={() => handleSettingClick('İşlem İtirazı')} variant="ghost" size="sm" className="h-auto py-1 w-full justify-start text-white/90 hover:bg-white/20 hover:text-white text-sm"><MessageSquareWarning className="mr-2 h-4 w-4" /> İşlem İtirazı</Button>
            <Button onClick={() => handleSettingClick('Kart İptali')} variant="ghost" size="sm" className="h-auto py-1 w-full justify-start text-red-400 hover:bg-red-500/50 hover:text-white text-sm"><MinusCircle className="mr-2 h-4 w-4" /> Kartı İptal Et</Button>
        
            {showCardDetails[cardId] && (
                 <div className="text-center text-white/90 bg-black/20 p-2 rounded-md mt-1 font-mono tracking-wider">
                    <p>{card.number}</p>
                    <p>SKT: {card.expiry} / CVV: {card.cvv}</p>
                </div>
            )}
        </div>
    );
  };
  
  const handleActionClick = (action: string) => {
    toast({
      title: 'İşlevsellik Yakında!',
      description: `Dekont ${action} özelliği yakında aktif olacaktır.`,
    });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 bg-secondary min-h-screen">
        <div className="flex justify-between items-center pt-4">
            <h1 className="text-3xl font-bold font-headline">Cüzdanım</h1>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full bg-muted h-8 w-8"><Plus className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Search className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-5 w-5" /></Button>
            </div>
        </div>
        
        <Tabs defaultValue={cardData[0].id} className="w-full" onValueChange={(value) => setActiveCardId(value ?? cardData[0].id)}>
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 gap-0 rounded-none h-auto">
                {cardData.map((card) => (
                    <TabsTrigger
                        key={card.id}
                        value={card.id}
                        className={cn(
                            "data-[state=inactive]:opacity-70 rounded-none rounded-t-lg p-1 text-xs font-semibold text-white focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:z-10 shadow-none",
                             card.bgColor
                        )}
                    >
                        {card.type}
                    </TabsTrigger>
                ))}
            </TabsList>

            {cardData.map((card) => {
                 const ngo = ngos.find(n => n.id === card.ngoId);
                 const isFlipped = flippedCardId === card.id;
                 return (
                <TabsContent key={card.id} value={card.id} className="mt-0">
                    <div>
                        <div className="relative [perspective:1000px] h-56">
                            <div
                                className={cn(
                                    "relative h-full w-full rounded-b-2xl transition-transform duration-500 [transform-style:preserve-3d]",
                                    isFlipped && "[transform:rotateY(180deg)]"
                                )}
                            >
                                {/* FRONT */}
                                <div
                                    className={cn(
                                        "absolute inset-0 p-6 flex flex-col justify-between text-white [backface-visibility:hidden] rounded-b-2xl",
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
                                             <CreditCard className="h-8 w-auto text-white/80" />
                                        </div>
                                    </div>
                                    {frozenCards[card.id] && (
                                        <div className="absolute inset-0 bg-black/60 rounded-b-2xl flex items-center justify-center">
                                            <p className="text-white font-bold text-3xl -rotate-12 border-4 border-white p-4 rounded-lg">DONDURULDU</p>
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-4 -translate-y-1/2 h-12 w-12 rounded-full text-white/70 hover:bg-white/20 hover:text-white"
                                        onClick={() => handleFlip(card.id)}
                                    >
                                        <RotateCw className="h-6 w-6" />
                                    </Button>
                                </div>

                                {/* BACK */}
                                <div
                                    className={cn(
                                        "absolute inset-0 p-4 flex flex-col justify-center items-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-b-2xl",
                                        card.bgColor
                                    )}
                                >
                                <CardSettings cardId={card.id} />
                                <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-4 -translate-y-1/2 h-12 w-12 rounded-full text-white/70 hover:bg-white/20 hover:text-white"
                                        onClick={() => handleFlip(card.id)}
                                    >
                                        <RotateCw className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            )})}
        </Tabs>
      
      <Card className={cn('transition-colors border-2', 
        activeCardId === 'bireysel' && 'border-primary/50',
        activeCardId === 'ogrenci' && 'border-cyan-700/50',
        activeCardId === 'ticari' && 'border-foreground/50'
      )}>
        <CardHeader>
            <CardTitle>Ödeme Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="scan-qr">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="my-qr">QR Kodum</TabsTrigger>
                    <TabsTrigger value="scan-qr">QR Oku</TabsTrigger>
                    <TabsTrigger value="by-phone">Numarayla</TabsTrigger>
                    <TabsTrigger value="by-code">Kodla</TabsTrigger>
                </TabsList>

                <TabsContent value="my-qr" className="mt-4 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-2 rounded-lg">
                            <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://hangel.org/pay/ismail')}`} alt="QR Code" width={150} height={150} />
                        </div>
                         <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted w-full">
                            <p className="text-base font-mono font-semibold tracking-wider">h-123456</p>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                navigator.clipboard.writeText('h-123456');
                                toast({ title: 'Hangel kodu kopyalandı!' });
                            }}>
                                <Copy className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="scan-qr" className="mt-4">
                     <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                        <ScanLine className="h-20 w-20 text-primary" />
                        <p className="text-muted-foreground text-sm">Ödeme yapmak için başka bir Hangel kullanıcısının QR kodunu veya bir işyeri QR kodunu okutun.</p>
                        <Button size="lg" className="w-full" onClick={() => toast({ title: "Kamera Açılıyor..." })}>
                            <QrCode className="mr-2 h-5 w-5" /> QR Kodu Tara
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="by-phone" className="mt-4">
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone-number">Telefon Numarası</Label>
                            <div className="relative flex items-center">
                                <Input id="phone-number" type="tel" placeholder="5XX XXX XX XX" className="pr-10" />
                                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                    <Contact className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount-phone">Tutar</Label>
                            <Input id="amount-phone" type="number" placeholder="0.00" />
                        </div>
                        <Button className="w-full" onClick={(e) => { e.preventDefault(); toast({ title: 'Ödeme Yapılıyor...' }) }}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Ödeme Yap
                        </Button>
                    </form>
                </TabsContent>
                <TabsContent value="by-code" className="mt-4">
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-code">6 Haneli Ödeme Kodu</Label>
                            <Input id="payment-code" type="text" maxLength={6} placeholder="------" className="text-center tracking-[0.5em]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount-code">Tutar</Label>
                            <Input id="amount-code" type="number" placeholder="0.00" />
                        </div>
                        <Button className="w-full" onClick={(e) => { e.preventDefault(); toast({ title: 'Ödeme Yapılıyor...' }) }}>
                            Ödeme Yap
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>

      {activeCardId === 'ticari' && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Üye İşyeri Materyalleri</CardTitle>
                <CardDescription>İşletmenizde kullanabileceğiniz dijital ve basılabilir materyaller.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold">QR Kodlu Sticker</h4>
                        <p className="text-xs text-muted-foreground">Müşterilerinizin telefonlarıyla okutarak ödeme yapabileceği sticker.</p>
                    </div>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost"><Share2 className="h-4 w-4" /></Button>
                    </div>
                </div>
                <div className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold">hangel İle Öde Sticker</h4>
                        <p className="text-xs text-muted-foreground">hangel ile ödeme kabul ettiğinizi gösteren sticker.</p>
                    </div>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost"><Share2 className="h-4 w-4" /></Button>
                    </div>
                </div>
                <div className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold">"hangel Üye İşyeri" Dönkartı</h4>
                        <p className="text-xs text-muted-foreground">İşyeri girişinde kullanabileceğiniz çift taraflı dönkart.</p>
                    </div>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost"><Share2 className="h-4 w-4" /></Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )}


      <Card className={cn('transition-colors border-2', 
        activeCardId === 'bireysel' && 'border-primary/50',
        activeCardId === 'ogrenci' && 'border-cyan-700/50',
        activeCardId === 'ticari' && 'border-foreground/50'
      )}>
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
                const netDonationAfterTaxes = donationAmount - tax;
                const ngoShare = netDonationAfterTaxes / 1.1;
                const hangelShare = ngoShare * 0.10;

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
                                    <span className='text-muted-foreground'>hangel Katkı Payı (STK Payının %10'u)</span>
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
      
      <ActivationDialog 
        card={cardToActivate}
        open={!!showActivationDialog}
        onClose={() => setShowActivationDialog(null)}
        onActivate={handleActivateCard}
      />
      <div className="pb-24" />
    </div>
  );
}
