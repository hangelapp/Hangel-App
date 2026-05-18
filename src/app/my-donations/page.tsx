
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Search, Filter, ArrowDownUp, Eye, Download, Share2, Loader2, Clock, CheckCircle2, HandHeart } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
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
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

type SortKey = 'date' | 'purchaseAmount' | 'donationAmount';
type SortDirection = 'desc' | 'asc';
type FilterType = 'all' | 'income' | 'expense';

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
  const { user: authUser } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<DonationTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const donationsQuery = useMemoFirebase(
    () => authUser ? query(collection(db, 'donations'), where('userId', '==', authUser.uid)) : null,
    [db, authUser?.uid]
  );
  const { data: donationTransactions, isLoading } = useCollection<DonationTransaction>(donationsQuery);

  const transactions = useMemo(() => donationTransactions || [], [donationTransactions]);

  const totalDonations = useMemo(() =>
    transactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, curr) => acc + parseFloat(curr.donationAmount || '0'), 0),
    [transactions]
  );

  const sortedAndFilteredDonations = useMemo(() => {
    return transactions
      .filter(tx => {
        const matchesFilter = filterType === 'all' || tx.type === filterType;
        const matchesSearch = searchTerm === '' ||
          tx.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tx.ngo || []).join(', ').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        let comparison: number;
        if (sortKey === 'date') {
          const dateA = parse(`${a.date} ${a.time}`, 'yyyy-MM-dd HH:mm', new Date()).getTime();
          const dateB = parse(`${b.date} ${b.time}`, 'yyyy-MM-dd HH:mm', new Date()).getTime();
          comparison = dateA - dateB;
        } else {
          comparison = parseFloat(a[sortKey]) - parseFloat(b[sortKey]);
        }
        return sortDir === 'desc' ? -comparison : comparison;
      });
  }, [transactions, filterType, searchTerm, sortKey, sortDir]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Bağışlarım</h1>

      <Card>
        <CardHeader>
          <CardTitle>Toplam Bağış</CardTitle>
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
                    <Button variant="ghost" size="icon" aria-label="Filtrele"><Filter className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterType('all')}>Tümü</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('income')}>Gelir</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('expense')}>Gider</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Sırala"><ArrowDownUp className="h-4 w-4" /></Button>
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
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !authUser ? (
            <p className="text-center text-muted-foreground p-8">İşlem geçmişini görmek için giriş yapın.</p>
          ) : sortedAndFilteredDonations.length === 0 ? (
            <EmptyState
              icon={HandHeart}
              title="Henüz bağışın yok"
              description="Etkilenmek istediğin bir kampanyaya bağış yaparak başla."
              action={{ label: 'Bağış kampanyaları', href: '/funds' }}
            />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {sortedAndFilteredDonations.map(donation => {
                const donationAmount = parseFloat(donation.donationAmount);
                const gelirVergisi = donationAmount * 0.20;
                const netDonationAfterTaxes = donationAmount - gelirVergisi;
                const ngoShare = netDonationAfterTaxes > 0 ? netDonationAfterTaxes / 1.1 : 0;
                const hangelShare = ngoShare * 0.10;

                const status = (donation as DonationTransaction & { status?: string }).status;
                const isPaid = status === 'Yatırıldı' || status === 'Tamamlandı';
                const isPending = !isPaid && status !== 'Reddedildi';
                const statusBadge = isPaid
                  ? { class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Yatırıldı' }
                  : status === 'Reddedildi'
                    ? { class: 'bg-red-100 text-red-700 border-red-200', icon: Clock, label: 'Reddedildi' }
                    : { class: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: status || 'İşleme Alındı' };
                const StatusIcon = statusBadge.icon;
                const rowAccent = isPaid
                  ? 'border-l-4 border-l-green-500'
                  : isPending
                    ? 'border-l-4 border-l-orange-400'
                    : 'border-l-4 border-l-red-400';

                return (
                  <AccordionItem key={donation.id} value={`item-${donation.id}`} className={`border-b last:border-b-0 ${rowAccent}`}>
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-full ${isPaid ? 'bg-green-100' : isPending ? 'bg-orange-100' : 'bg-muted'}`}>
                          <ShoppingBag className={`h-5 w-5 ${isPaid ? 'text-green-700' : isPending ? 'text-orange-700' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate">{donation.brand}</p>
                            {donation.type === 'expense' && (
                              <Badge variant="outline" className={`text-[10px] font-bold uppercase ${statusBadge.class}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusBadge.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
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
                        {(donation.ngo || []).length > 0 && (
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
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedTransaction(donation); setIsReceiptOpen(true); }} aria-label="Dekontu görüntüle"><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => toast({ title: 'Dekont indiriliyor...' })} aria-label="Dekontu indir"><Download className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => toast({ title: 'Paylaşım seçenekleri açılıyor...' })} aria-label="Paylaş"><Share2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
      <ReceiptDialog transaction={selectedTransaction} open={isReceiptOpen} onOpenChange={setIsReceiptOpen} />
    </div>
  );
}
