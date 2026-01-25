'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Search, Filter, ArrowDownUp, Eye, Download, Share2 } from 'lucide-react';
import { donationTransactions } from '@/lib/data';
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

// New Receipt Dialog Component
const ReceiptDialog = ({ transaction, open, onOpenChange }: { transaction: DonationTransaction | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();

    if (!transaction) return null;

    // Calculation from the accordion
    const donationAmount = parseFloat(transaction.donationAmount);
    const gelirVergisi = donationAmount * 0.20;
    const netDonationAfterTaxes = donationAmount - gelirVergisi;
    const ngoShare = netDonationAfterTaxes / 1.1;
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
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>KDV (%20)</span><span>{(0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
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
                const ngoShare = netDonationAfterTaxes / 1.1;
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
                            <span className='text-muted-foreground'>Gelir Vergisi (%20)</span>
                            <span>{gelirVergisi.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                        </div>
                         <div className='flex justify-between text-xs'>
                            <span className='text-muted-foreground'>KDV (%20)</span>
                            <span>{(0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                        </div>
                         <div className='flex justify-between text-xs'>
                            <span className='text-muted-foreground'>hangel Katkı Payı (STK Payının %10'u)</span>
                            <span>{hangelShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
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
