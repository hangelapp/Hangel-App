
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Search, Filter, ArrowDownUp, Eye, Download, Share2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { DonationTransaction } from '@/lib/types';

type SortKey = 'date' | 'purchaseAmount' | 'donationAmount';
type SortDirection = 'desc' | 'asc';
type FilterType = 'all' | 'income' | 'expense';

const donationTransactions = [
    { id: '1', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '250.00', donationAmount: '25.00', ngo: ['TEMA Vakfı', 'LÖSEV'], date: '2024-07-21', time: '14:32' },
    { id: '2', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '120.50', donationAmount: '12.05', ngo: ['Uluslararası Sosyal Fayda Derneği', 'TEGV'], date: '2024-07-20', time: '18:10' },
    { id: '3', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '500.00', donationAmount: '0.00', ngo: [], date: '2024-07-20', time: '10:00' },
    { id: '4', type: 'expense', brand: 'Tekno Market', purchaseAmount: '1500.00', donationAmount: '30.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-19', time: '11:45' },
    { id: '5', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '800.00', donationAmount: '80.00', ngo: ['WWF Türkiye', 'TEMA Vakfı'], date: '2024-07-18', time: '20:05' },
    { id: '6', type: 'expense', brand: 'Kitap Kurdu', purchaseAmount: '85.00', donationAmount: '8.50', ngo: ['TEGV', 'Tohum Otizm Vakfı'], date: '2024-07-18', time: '15:20' },
    { id: '7', type: 'expense', brand: 'Kahve Dünyası', purchaseAmount: '45.00', donationAmount: '4.50', ngo: ['TEMA Vakfı', 'Uluslararası Sosyal Fayda Derneği'], date: '2024-07-17', time: '09:05' },
    { id: '8', type: 'income', brand: 'Para Transferi', purchaseAmount: '150.00', donationAmount: '0.00', ngo: [], date: '2024-07-16', time: '12:00' },
    { id: '9', type: 'expense', brand: 'Spor Salonu', purchaseAmount: '350.00', donationAmount: '35.00', ngo: ['Uluslararası Sosyal Fayda Derneği', 'LÖSEV'], date: '2024-07-15', time: '19:30' },
    { id: '10', type: 'expense', brand: 'Süpermarket', purchaseAmount: '210.75', donationAmount: '21.08', ngo: ['LÖSEV', 'TEMA Vakfı'], date: '2024-07-14', time: '17:00' },
    { id: '11', type: 'expense', brand: 'Sinema Biletleri', purchaseAmount: '180.00', donationAmount: '18.00', ngo: ['TEGV', 'Uluslararası Sosyal Fayda Derneği'], date: '2024-07-13', time: '21:00' },
    { id: '12', type: 'expense', brand: 'Doğa Dostu Giyim', purchaseAmount: '450.00', donationAmount: '45.00', ngo: ['TEMA Vakfı', 'WWF Türkiye'], date: '2024-07-12', time: '13:15' },
    { id: '13', type: 'income', brand: 'Bakiye Yükleme', purchaseAmount: '1000.00', donationAmount: '0.00', ngo: [], date: '2024-07-11', time: '09:00' },
    { id: '14', type: 'expense', brand: 'Lezzet Köyü', purchaseAmount: '95.00', donationAmount: '9.50', ngo: ['Uluslararası Sosyal Fayda Derneği', 'LÖSEV'], date: '2024-07-10', time: '12:45' },
    { id: '15', type: 'expense', brand: 'Tekno Market', purchaseAmount: '3200.00', donationAmount: '64.00', ngo: ['LÖSEV', 'TEGV'], date: '2024-07-09', time: '16:00' },
    { id: '16', type: 'expense', brand: 'Gezgin Rotalar', purchaseAmount: '1250.00', donationAmount: '125.00', ngo: ['WWF Türkiye', 'Uluslararası Sosyal Fayda Derneği'], date: '2024-07-08', time: '22:30' },
    { id: '17', type: 'expense', brand: 'Kitap Kurdu', purchaseAmount: '150.00', donationAmount: '15.00', ngo: ['TEGV', 'TEMA Vakfı'], date: '2024-07-07', time: '14:00' },
    { id: '18', type: 'expense', brand: 'Kahve Dünyası', purchaseAmount: '60.00', donationAmount: '6.00', ngo: ['TEMA Vakfı', 'Tohum Otizm Vakfı'], date: '2024-07-06', time: '10:20' },
    { id: '19', type: 'income', brand: 'Para Transferi', purchaseAmount: '250.00', donationAmount: '0.00', ngo: [], date: '2024-07-05', time: '11:00' },
    { id: '20', type: 'expense', brand: 'Spor Salonu', purchaseAmount: '350.00', donationAmount: '35.00', ngo: ['Uluslararası Sosyal Fayda Derneği', 'TEGV'], date: '2024-07-04', time: '19:45' },
    { id: '21', type: 'expense', brand: 'Süpermarket', purchaseAmount: '180.25', donationAmount: '18.03', ngo: ['LÖSEV', 'Uluslararası Sosyal Fayda Derneği'], date: '2024-07-03', time: '18:15' },
];


// New Receipt Dialog Component
const ReceiptDialog = ({ transaction, open, onOpenChange }: { transaction: DonationTransaction | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();

    if (!transaction) return null;

    const donationAmount = parseFloat(transaction.donationAmount);
    const gelirVergisi = donationAmount * 0.20;
    const kdv = donationAmount * 0.20;
    const netDonationAfterTaxes = donationAmount - gelirVergisi - kdv;
    const ngoShare = netDonationAfterTaxes > 0 ? netDonationAfterTaxes / 1.1 : 0;
    const hangelShare = ngoShare * 0.10;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>İşlem Dekontu</DialogTitle>
                    <DialogDescription>İşlem ID: {transaction.id}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center font-bold">
                            <span>{transaction.brand}</span>
                            <span>{transaction.purchaseAmount} ₺</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {format(parse(transaction.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })} - {transaction.time}
                        </div>
                    </div>
                    {transaction.type === 'expense' && (
                        <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">Bağış Detayları</h4>
                            <div className='flex justify-between'><span className='text-muted-foreground'>Toplam Bağış</span><span className='font-medium text-primary'>{transaction.donationAmount} ₺</span></div>
                            <Separator />
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>Desteklenen STK Payı</span><span>{ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>Gelir Vergisi (%20)</span><span>{gelirVergisi.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>KDV (%20)</span><span>{kdv.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>hangel Katkı Payı (STK Payının %10'u)</span><span>{hangelShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                            {transaction.ngo.length > 0 && <Separator />}
                             {transaction.ngo.length > 0 && (
                                <div className='flex justify-between items-center text-xs mt-2'>
                                    <span className='text-muted-foreground'>Desteklenen STK(lar)</span>
                                    <span className="text-right font-medium">{transaction.ngo.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
                    <Button onClick={() => toast({ title: 'Dekont indiriliyor...' })}>
                        <Download className="mr-2 h-4 w-4" /> PDF İndir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function MyDonationsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<DonationTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);


  const totalDonations = donationTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + parseFloat(curr.donationAmount), 0);

  const sortedAndFilteredDonations = useMemo(() => {
    return donationTransactions
    .filter(tx => {
        const matchesFilter = filterType === 'all' || tx.type === filterType;
        const matchesSearch = searchTerm === '' || 
                              tx.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              tx.ngo.join(', ').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'date') {
            const dateA = parse(`${a.date} ${a.time}`, 'yyyy-MM-dd HH:mm', new Date()).getTime();
            const dateB = parse(`${b.date} ${b.time}`, 'yyyy-MM-dd HH:mm', new Date()).getTime();
            comparison = dateA - dateB;
        } else {
            comparison = parseFloat(a[sortKey]) - parseFloat(b[sortKey]);
        }
        return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [filterType, searchTerm, sortKey, sortDir]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Bağışlarım</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>
            Toplam Bağış
          </CardTitle>
          <CardDescription>Ek bir ödeme yapmadan, alışverişlerinle iyiliğe dönüşen bağış.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{totalDonations.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
                <CardTitle>İşlem Geçmişi</CardTitle>
                <div className="flex justify-between items-center gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Ara..." 
                          className="pl-8 text-sm h-9 w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className='flex'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Filter className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilterType('all')}>Tümü</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('income')}>Gelir</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterType('expense')}>Gider</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ArrowDownUp className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSortKey('date'); setSortDir('desc'); }}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortKey('date'); setSortDir('asc'); }}>Tarihe Göre (En Eski)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortKey('purchaseAmount'); setSortDir('desc'); }}>Alışveriş Tutarı (Azalan)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortKey('purchaseAmount'); setSortDir('asc'); }}>Alışveriş Tutarı (Artan)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortKey('donationAmount'); setSortDir('desc'); }}>Bağış Tutarı (Azalan)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortKey('donationAmount'); setSortDir('asc'); }}>Bağış Tutarı (Artan)</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {sortedAndFilteredDonations.map(donation => {
                const donationAmount = parseFloat(donation.donationAmount);
                const gelirVergisi = donationAmount * 0.20;
                const netDonationAfterTaxes = donationAmount - gelirVergisi;
                const ngoShare = netDonationAfterTaxes > 0 ? netDonationAfterTaxes / 1.1 : 0;
                const hangelShare = ngoShare * 0.10;

                return (
                    <AccordionItem key={donation.id} value={`item-${donation.id}`} className="border-b last:border-b-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-full">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                            <p>{donation.brand}</p>
                            <p className="text-xs text-muted-foreground">
                                {donation.ngo && donation.ngo.length > 0 ? donation.ngo.join(', ') : `${format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })} - ${donation.time}`}
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
                        <div className='flex justify-between font-medium'>
                            <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                            <span>{donation.purchaseAmount} ₺</span>
                        </div>
                        <div className='flex justify-between font-bold'>
                            <span className='text-muted-foreground'>Toplam Bağış</span>
                            <span className='text-primary'>{donation.donationAmount} ₺</span>
                        </div>
                        <Separator />
                        <div className='space-y-1.5'>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>Desteklenen STK Payı</span><span className="font-medium text-foreground">{ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                             <div className='flex justify-between text-xs'><span className='text-muted-foreground'>Gelir Vergisi (%20)</span><span className="font-medium text-foreground">{gelirVergisi.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                             <div className='flex justify-between text-xs'><span className='text-muted-foreground'>hangel Katkı Payı (%10)</span><span className="font-medium text-foreground">{hangelShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                        </div>
                        <Separator />
                        {donation.ngo.length > 0 && (
                            <div className='flex justify-between items-center text-xs mt-2'>
                                <span className='text-muted-foreground'>Desteklenen STK(lar)</span>
                                <span className="text-right font-medium">{donation.ngo.join(', ')}</span>
                            </div>
                        )}
                        <div className='flex justify-between items-center text-xs'>
                            <div>
                                <span className='text-muted-foreground'>İşlem Tarihi: </span>
                                <span>{format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })} - {donation.time}</span>
                            </div>
                            <div className="flex">
                                <Button size="icon" variant="ghost" onClick={() => { setSelectedTransaction(donation); setIsReceiptOpen(true); }}><Eye className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => toast({ title: 'Dekont indiriliyor...' })}><Download className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => toast({ title: 'Paylaşım seçenekleri açılıyor...' })}><Share2 className="h-4 w-4"/></Button>
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
        <ReceiptDialog transaction={selectedTransaction} open={isReceiptOpen} onOpenChange={setIsReceiptOpen} />
    </div>
  );
}
