

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowRightLeft, QrCode, ScanLine, Plus, Search, Filter, ArrowDownUp, Eye, Download, Share2, MoreHorizontal, RotateCw, SlidersHorizontal, KeyRound, Power, MessageSquareWarning, MinusCircle, Link as LinkIcon, Contact, Copy, CreditCard, ShoppingBag, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { qrPaymentCardData, user } from '@/lib/data';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { HangelLogo } from '@/components/icons';

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
  const qrData = `https://hangel.org/pay/${user.username.replace('@', '')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const [cards, setCards] = useState(qrPaymentCardData.map((c, i) => ({ ...c, status: i === 0 ? 'Aktif' : 'Aktif Değil', active: i === 0 })));
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [activatingCard, setActivatingCard] = useState<typeof cards[0] | null>(null);

  const handleActionClick = (action: string) => {
    toast({
      title: 'İşlevsellik Yakında!',
      description: `Dekont ${action} özelliği yakında aktif olacaktır.`,
    });
  };

  const handleActivateClick = (card: typeof cards[0]) => {
      if (card.status === 'Aktif') return;
      setActivatingCard(card);
      setIsActivationOpen(true);
  };

  const handleActivate = (cardId: string) => {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'Aktif' } : c));
      setIsActivationOpen(false);
      toast({ title: "Kart Aktive Edildi!", description: `${activatingCard?.type} kartınız artık kullanıma hazır.` });
  };
  
  const handleCardSelect = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card?.status !== 'Aktif') {
        toast({
            variant: "destructive",
            title: "Kart Aktif Değil",
            description: "Lütfen önce kartınızı aktive edin.",
        });
        return;
    }
    setCards(cards.map(c => ({ ...c, active: c.id === cardId })));
};

  const activeCard = cards.find(c => c.active);


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

        <Card>
            <CardHeader>
                <CardTitle>Kartlarım</CardTitle>
                <CardDescription>Kullanmak istediğiniz kartı seçin veya yeni bir kart aktive edin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {cards.map((card) => (
                    <div 
                        key={card.id} 
                        onClick={() => handleCardSelect(card.id)} 
                        className={cn(
                            "relative p-6 rounded-2xl text-white cursor-pointer transition-all duration-300 transform-gpu overflow-hidden shadow-lg",
                            card.bgColor,
                            activeCard?.id === card.id ? "scale-100 opacity-100 shadow-2xl" : "scale-95 opacity-70 hover:opacity-100 hover:scale-100"
                        )}
                    >
                        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col justify-between h-[180px]">
                            <div className="flex justify-between items-start">
                                <h4 className="text-lg font-bold">{card.type} Kart</h4>
                                {card.status === 'Aktif' ? (
                                    <HangelLogo className="text-xl font-black text-white/80" />
                                ) : (
                                     <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-300 border-none text-[10px]">Aktivasyon Gerekli</Badge>
                                )}
                            </div>
                            
                            <div className="mt-4">
                                 {card.status === 'Aktif' ? (
                                    <p className="text-3xl font-bold tracking-tight">{card.balance}</p>
                                 ) : (
                                    <p className="text-2xl font-bold tracking-tight">Aktif Değil</p>
                                 )}
                            </div>

                            <div className="mt-4 flex justify-between items-end">
                                <div>
                                    <p className="text-xs opacity-70">Kart Sahibi</p>
                                    <p className="text-sm font-semibold">{card.owner}</p>
                                </div>
                                {card.status !== 'Aktif' ? (
                                    <Button size="sm" variant="secondary" className="h-8 rounded-lg" onClick={(e) => { e.stopPropagation(); handleActivateClick(card); }}>Aktive Et</Button>
                                ) : (
                                    <p className="text-sm font-mono tracking-widest">**** {card.number.slice(-4)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

      <Card className={cn('transition-all duration-500 shadow-md', activeCard?.bgColor)}>
        <CardHeader>
            <CardTitle className="text-white">Ödeme Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="scan-qr" className="bg-background/80 backdrop-blur-sm p-2 rounded-xl">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                    <TabsTrigger value="my-qr">QR Kodum</TabsTrigger>
                    <TabsTrigger value="scan-qr">QR Oku</TabsTrigger>
                    <TabsTrigger value="by-phone">Numarayla</TabsTrigger>
                    <TabsTrigger value="by-code">Kodla</TabsTrigger>
                </TabsList>

                <TabsContent value="my-qr" className="mt-4 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-inner border">
                            <Image src={qrCodeUrl} alt="QR Code" width={150} height={150} />
                        </div>
                         <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted w-full border border-dashed">
                            <p className="text-lg font-mono font-bold tracking-widest text-foreground">h-123456</p>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => {
                                navigator.clipboard.writeText('h-123456');
                                toast({ title: 'Hangel kodu kopyalandı!' });
                            }}>
                                <Copy className="h-5 w-5" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10">
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="scan-qr" className="mt-4">
                     <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center border-2 border-dashed rounded-2xl bg-muted/30">
                        <ScanLine className="h-20 w-20 text-primary animate-pulse" />
                        <div>
                            <p className="font-bold text-foreground">Ödemek İçin Okut</p>
                            <p className="text-muted-foreground text-xs">Diğer Hangel QR kodlarını veya işyeri ödeme noktalarını tarayın.</p>
                        </div>
                        <Button size="lg" className="w-full rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20" onClick={() => toast({ title: "Kamera Açılıyor..." })}>
                            <QrCode className="mr-2 h-5 w-5" /> QR Kodu Tara
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="by-phone" className="mt-4">
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone-number" className="font-bold">Telefon Numarası</Label>
                            <div className="relative flex items-center">
                                <Input id="phone-number" type="tel" placeholder="5XX XXX XX XX" className="pr-12 h-12 rounded-xl border-2" />
                                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-primary">
                                    <Contact className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount-phone" className="font-bold">Tutar</Label>
                            <div className="relative">
                                <Input id="amount-phone" type="number" placeholder="0.00" className="h-12 rounded-xl border-2 pl-4 pr-10 text-xl font-bold" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₺</span>
                            </div>
                        </div>
                        <Button className="w-full h-12 rounded-xl text-base font-bold" onClick={(e) => { e.preventDefault(); toast({ title: 'Ödeme Yapılıyor...' }) }}>
                            <ArrowRightLeft className="mr-2 h-5 w-5" /> Ödeme Yap
                        </Button>
                    </form>
                </TabsContent>
                <TabsContent value="by-code" className="mt-4">
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-code" className="font-bold">6 Haneli Ödeme Kodu</Label>
                            <Input id="payment-code" type="text" maxLength={6} placeholder="------" className="text-center tracking-[0.5em] h-14 text-2xl font-black rounded-xl border-2" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount-code" className="font-bold">Tutar</Label>
                            <div className="relative">
                                <Input id="amount-code" type="number" placeholder="0.00" className="h-12 rounded-xl border-2 pl-4 pr-10 text-xl font-bold" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₺</span>
                            </div>
                        </div>
                        <Button className="w-full h-12 rounded-xl text-base font-bold" onClick={(e) => { e.preventDefault(); toast({ title: 'Ödeme Yapılıyor...' }) }}>
                            Ödeme Yap
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <CardTitle>Son İşlemler</CardTitle>
           <div className="flex justify-between items-center gap-2 pt-2">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="İşlemlerde ara..." className="pl-9 text-sm h-10 w-full rounded-xl" />
                </div>
                <div className='flex gap-1'>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => toast({ title: 'Filtreleme özelliği yakında gelecek!' })}>
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => toast({ title: 'Sıralama özelliği yakında gelecek!' })}>
                        <ArrowDownUp className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
              {donationTransactions.map(donation => {
                const donationAmount = parseFloat(donation.donationAmount);
                const gelirVergisi = donationAmount * 0.20;
                const netDonationAfterTaxes = donationAmount - gelirVergisi;
                const ngoShare = netDonationAfterTaxes / 1.1;
                const hangelShare = ngoShare * 0.10;

                return (
                    <AccordionItem key={donation.id} value={`item-${donation.id}`} className="border-b last:border-b-0 px-2">
                        <AccordionTrigger className="px-2 py-4 hover:no-underline">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={cn("p-2.5 rounded-xl shadow-sm", donation.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground')}>
                                    {donation.type === 'income' ? <Plus className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-sm text-foreground">{donation.brand}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                        {format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })} • {donation.time}
                                    </p>
                                </div>
                                <div className="text-right pr-2">
                                    <p className={cn("font-bold text-base", donation.type === 'income' ? 'text-green-600' : 'text-foreground')}>
                                        {donation.type === 'income' ? '+' : ''}{donation.purchaseAmount} ₺
                                    </p>
                                    {donation.type === 'expense' && <p className="text-[10px] font-bold text-primary">Bağış: {donation.donationAmount} ₺</p>}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 bg-muted/30 rounded-xl mb-2 mx-2">
                            <div className="space-y-3 text-sm mt-2 pt-4 border-t border-dashed">
                                <div className='flex justify-between font-medium'>
                                    <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                                    <span>{donation.purchaseAmount} ₺</span>
                                </div>
                                <div className='flex justify-between font-bold'>
                                    <span className='text-muted-foreground'>Toplam Bağış</span>
                                    <span className='text-primary'>{donation.donationAmount} ₺</span>
                                </div>
                                <Separator className="bg-border/50" />
                                <div className='space-y-1.5'>
                                    <div className='flex justify-between text-xs'><span className='text-muted-foreground'>Desteklenen STK Payı</span><span className="font-medium text-foreground">{ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                                    <div className='flex justify-between text-xs'><span className='text-muted-foreground'>Gelir Vergisi (%20)</span><span className="font-medium text-foreground">{gelirVergisi.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                                    <div className='flex justify-between text-xs'><span className='text-muted-foreground'>hangel Katkı Payı (%10)</span><span className="font-medium text-foreground">{hangelShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                                </div>
                                <Separator className="bg-border/50" />
                                {donation.ngo.length > 0 && (
                                    <div className='flex justify-between items-start gap-4 py-1'>
                                        <span className='text-[10px] uppercase font-bold text-muted-foreground shrink-0 mt-1'>Desteklenenler:</span>
                                        <span className="text-right text-xs font-semibold text-foreground leading-tight">{donation.ngo.join(', ')}</span>
                                    </div>
                                )}
                                <div className='flex justify-between items-center pt-2 border-t border-dashed'>
                                    <p className='text-[10px] text-muted-foreground font-mono'>ID: #{donation.id}000{donation.id}</p>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={() => handleActionClick('görüntüleme')}><Eye className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={() => handleActionClick('indirme')}><Download className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={() => handleActionClick('paylaşma')}><Share2 className="h-4 w-4"/></Button>
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

      <ActivationDialog card={activatingCard} open={isActivationOpen} onClose={() => setIsActivationOpen(false)} onActivate={handleActivate} />
      
    </div>
  );
}

    
