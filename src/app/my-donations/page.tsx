
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
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { normalizeRates, computeDonationSplit, type DonationRates } from '@/lib/donation-split';

type NgoSplitEntry = { ngoId: string; ngoName: string; amount: number };

type SortKey = 'date' | 'purchaseAmount' | 'donationAmount';
type SortDirection = 'desc' | 'asc';
type FilterType = 'all' | 'income' | 'expense';

const ReceiptDialog = ({ transaction, open, onOpenChange, t, rates }: { transaction: DonationTransaction | null, open: boolean, onOpenChange: (open: boolean) => void, t: (key: string) => string, rates: DonationRates }) => {
    const { toast } = useToast();

    if (!transaction) return null;

    const donationAmount = parseFloat(transaction.donationAmount);
    const ngoSplit = (transaction as DonationTransaction & { ngoSplit?: NgoSplitEntry[] }).ngoSplit;
    const ngoCount = transaction.ngo?.length || 2;
    const split = computeDonationSplit(donationAmount, rates, ngoCount);
    const fmtCurrency = (n: number) => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('dashboard.donations.receiptTitle')}</DialogTitle>
                    <DialogDescription>{t('dashboard.donations.transactionId')}: {transaction.id}</DialogDescription>
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
                            <h4 className="font-semibold">{t('dashboard.donations.donationDetails')}</h4>
                            <div className='flex justify-between'><span className='text-muted-foreground'>{t('dashboard.donations.totalDonation')}</span><span className='font-medium text-primary'>{transaction.donationAmount} ₺</span></div>
                            <Separator />
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.ngoShare')}</span><span>{fmtCurrency(split.ngoShareTotal)}</span></div>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.incomeTax')}</span><span>{fmtCurrency(split.incomeTax)}</span></div>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.vat')}</span><span>{fmtCurrency(split.vat)}</span></div>
                            <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.hangelShare')}</span><span>{fmtCurrency(split.hangelShare)}</span></div>
                            {((ngoSplit && ngoSplit.length > 0) || transaction.ngo.length > 0) && <Separator />}
                            {ngoSplit && ngoSplit.length > 0 ? (
                                <div className='space-y-1 mt-2'>
                                    <span className='text-muted-foreground text-xs'>{t('dashboard.donations.supportedNgos')}</span>
                                    {ngoSplit.map((entry, i) => (
                                        <div key={entry.ngoId || `${entry.ngoName}-${i}`} className='flex justify-between items-center text-xs'>
                                            <span className="text-right font-medium">{entry.ngoName}</span>
                                            <span>{fmtCurrency(entry.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : transaction.ngo.length > 0 ? (
                                <div className='flex justify-between items-center text-xs mt-2'>
                                    <span className='text-muted-foreground'>{t('dashboard.donations.supportedNgos')}</span>
                                    <span className="text-right font-medium">{transaction.ngo.join(', ')}</span>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dashboard.donations.receiptClose')}</Button>
                    <Button onClick={() => toast({ title: t('dashboard.donations.toastReceiptDownloading') })}>
                        <Download className="mr-2 h-4 w-4" /> {t('dashboard.donations.receiptDownload')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function MyDonationsPage() {
  const { t } = useTranslation();
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
    () => authUser ? query(collection(db, COLLECTIONS.donations), where('userId', '==', authUser.uid)) : null,
    [db, authUser?.uid]
  );
  const { data: donationTransactions, isLoading } = useCollection<DonationTransaction>(donationsQuery);

  // "Bağışın işleniyor" — kullanıcı "Ürüne Git / Alışverişe Başla"ya tıkladığında
  // affiliate-go route'u attribution click'i (affiliateClicks) yazar; o koleksiyon
  // SADECE Admin SDK erişimlidir (client okuyamaz). Bunun yerine tıklama anında
  // yazılan, sahibinin okuyabildiği işaretli bildirimi (data.affiliatePending)
  // okuyup "onay bekleyen" durumu gösteriyoruz. Conversion onaylanınca gerçek
  // bağış postback'ten donations'a düşer ("İşleme Alındı") ve aşağıdaki listede
  // görünür; pending kart yalnız bilgilendirme amaçlıdır.
  // Tek where('userId') — mevcut bildirim sorgularıyla aynı desen, yeni composite
  // index gerektirmez. type/affiliatePending filtresi client-side uygulanır.
  const pendingNotifQuery = useMemoFirebase(
    () => authUser
      ? query(collection(db, COLLECTIONS.notifications), where('userId', '==', authUser.uid))
      : null,
    [db, authUser?.uid]
  );
  const { data: pendingNotifs } = useCollection<{
    id: string;
    type?: string;
    createdAt?: { seconds: number } | null;
    data?: { affiliatePending?: boolean; brandName?: string | null } | null;
  }>(pendingNotifQuery);

  // "Şimdi"yi mount'ta bir kez sabitle (render-pure; Date.now()'u her render'da
  // çağırmaktan kaçınırız). Cutoff bu sabite göre hesaplanır.
  const [nowMs] = useState(() => Date.now());

  // Son 14 günde başlatılmış, henüz onaylanmamış alışveriş tıklamaları.
  // (14 gün: çoğu affiliate ağı dönüşümü bu süre içinde onaylar; sonrası
  // büyük olasılıkla alışveriş tamamlanmadı demektir, kartı bayatlatmayalım.)
  const pendingShopping = useMemo(() => {
    const cutoff = nowMs - 14 * 24 * 60 * 60 * 1000;
    return (pendingNotifs || [])
      .filter((n) => n.data?.affiliatePending === true)
      .map((n) => ({
        id: n.id,
        brandName: n.data?.brandName || null,
        createdAtMs: n.createdAt?.seconds ? n.createdAt.seconds * 1000 : nowMs,
      }))
      .filter((p) => p.createdAtMs >= cutoff)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [pendingNotifs, nowMs]);

  const ratesDocRef = useMemoFirebase(
    () => (db ? doc(db, COLLECTIONS.siteSettings, 'donationRates') : null),
    [db]
  );
  const { data: ratesDoc } = useDoc<Partial<DonationRates>>(ratesDocRef);
  const rates = useMemo(() => normalizeRates(ratesDoc), [ratesDoc]);

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
      <h1 className="text-2xl font-bold font-headline">{t('dashboard.donations.heading')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.donations.totalTitle')}</CardTitle>
          <CardDescription>{t('dashboard.donations.totalDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalDonations.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
        </CardContent>
      </Card>

      {/* İşleniyor (onay bekliyor) — başlatılmış ama henüz onaylanmamış alışverişler.
          Onaylanınca gerçek bağış aşağıdaki geçmişte "İşleme Alındı" olarak görünür. */}
      {authUser && pendingShopping.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Clock className="h-4 w-4 shrink-0" />
              Bağışın işleniyor 🧡
            </CardTitle>
            <CardDescription>
              Başlattığın alışverişler onaylanınca bağışların otomatik hesabına işlenir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {pendingShopping.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-primary/20 bg-background/60 p-3"
              >
                <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                  <ShoppingBag className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {p.brandName || 'Alışveriş'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.createdAtMs), 'dd MMMM yyyy - HH:mm', { locale: tr })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-orange-200 bg-orange-100 text-[10px] font-bold uppercase text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  İşleniyor
                </Badge>
              </div>
            ))}
            <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
              Onaylanması markaya göre birkaç dakika–saat (bazen birkaç gün) sürebilir.
              Tamamlanınca bağışın geçmiş listende görünür. Yalnız değilsin, birlikte
              umudu büyütüyoruz.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>{t('dashboard.donations.historyTitle')}</CardTitle>
            <div className="flex justify-between items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('dashboard.donations.searchPlaceholder')}
                  className="pl-8 text-sm h-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className='flex'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('aria.filter')}><Filter className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilterType('all')}>{t('dashboard.donations.filterAll')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('income')}>{t('dashboard.donations.filterIncome')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('expense')}>{t('dashboard.donations.filterExpense')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('aria.sort')}><ArrowDownUp className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSortKey('date'); setSortDir('desc'); }}>{t('dashboard.applications.sortNewest')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey('date'); setSortDir('asc'); }}>{t('dashboard.applications.sortOldest')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey('purchaseAmount'); setSortDir('desc'); }}>{t('dashboard.donations.sortPurchaseDesc')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey('purchaseAmount'); setSortDir('asc'); }}>{t('dashboard.donations.sortPurchaseAsc')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey('donationAmount'); setSortDir('desc'); }}>{t('dashboard.donations.sortDonationDesc')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey('donationAmount'); setSortDir('asc'); }}>{t('dashboard.donations.sortDonationAsc')}</DropdownMenuItem>
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
            <p className="text-center text-muted-foreground p-8">{t('dashboard.donations.loginPrompt')}</p>
          ) : sortedAndFilteredDonations.length === 0 ? (
            <EmptyState
              icon={HandHeart}
              title={t('dashboard.donations.emptyTitle')}
              description={t('dashboard.donations.emptyDesc')}
              action={{ label: t('dashboard.donations.emptyAction'), href: '/funds' }}
            />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {sortedAndFilteredDonations.map(donation => {
                const donationAmount = parseFloat(donation.donationAmount);
                const rowSplit = computeDonationSplit(donationAmount, rates, donation.ngo?.length || 2);
                const ngoShare = rowSplit.ngoShareTotal;
                const gelirVergisi = rowSplit.incomeTax;
                const hangelShare = rowSplit.hangelShare;

                const status = (donation as DonationTransaction & { status?: string }).status;
                const isPaid = status === 'Yatırıldı' || status === 'Tamamlandı';
                const isPending = !isPaid && status !== 'Reddedildi';
                const statusBadge = isPaid
                  ? { class: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', icon: CheckCircle2, label: t('dashboard.donations.statusDeposited') }
                  : status === 'Reddedildi'
                    ? { class: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: Clock, label: t('dashboard.donations.statusRejected') }
                    : { class: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800', icon: Clock, label: status || t('dashboard.donations.statusProcessing') };
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
                        <div className={`p-2 rounded-full ${isPaid ? 'bg-green-100 dark:bg-green-900/30' : isPending ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted'}`}>
                          <ShoppingBag className={`h-5 w-5 ${isPaid ? 'text-green-700 dark:text-green-300' : isPending ? 'text-orange-700 dark:text-orange-300' : 'text-muted-foreground'}`} />
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
                          {donation.type === 'expense' && <p className="text-xs text-primary">{t('dashboard.donations.donationLabel')}: {donation.donationAmount} ₺</p>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 bg-muted/50">
                      <div className="space-y-2 text-sm mt-2 pt-4 border-t">
                        <div className='flex justify-between font-medium'>
                          <span className='text-muted-foreground'>{t('dashboard.donations.purchaseAmount')}</span>
                          <span>{donation.purchaseAmount} ₺</span>
                        </div>
                        <div className='flex justify-between font-bold'>
                          <span className='text-muted-foreground'>{t('dashboard.donations.totalDonation')}</span>
                          <span className='text-primary'>{donation.donationAmount} ₺</span>
                        </div>
                        <Separator />
                        <div className='space-y-1.5'>
                          <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.ngoShare')}</span><span className="font-medium text-foreground">{ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                          <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.incomeTax')}</span><span className="font-medium text-foreground">{gelirVergisi.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                          <div className='flex justify-between text-xs'><span className='text-muted-foreground'>{t('dashboard.donations.hangelShareShort')}</span><span className="font-medium text-foreground">{hangelShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
                        </div>
                        <Separator />
                        {(() => {
                          const rowNgoSplit = (donation as DonationTransaction & { ngoSplit?: NgoSplitEntry[] }).ngoSplit;
                          if (rowNgoSplit && rowNgoSplit.length > 0) {
                            return (
                              <div className='space-y-1 mt-2'>
                                <span className='text-muted-foreground text-xs'>{t('dashboard.donations.supportedNgos')}</span>
                                {rowNgoSplit.map((entry, i) => (
                                  <div key={entry.ngoId || `${entry.ngoName}-${i}`} className='flex justify-between items-center text-xs'>
                                    <span className="text-right font-medium">{entry.ngoName}</span>
                                    <span>{entry.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          if ((donation.ngo || []).length > 0) {
                            return (
                              <div className='flex justify-between items-center text-xs mt-2'>
                                <span className='text-muted-foreground'>{t('dashboard.donations.supportedNgos')}</span>
                                <span className="text-right font-medium">{donation.ngo.join(', ')}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <div className='flex justify-between items-center text-xs'>
                          <div>
                            <span className='text-muted-foreground'>{t('dashboard.donations.transactionDate')}: </span>
                            <span>{format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })} - {donation.time}</span>
                          </div>
                          <div className="flex">
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedTransaction(donation); setIsReceiptOpen(true); }} aria-label={t('dashboard.donations.ariaViewReceipt')}><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => toast({ title: t('dashboard.donations.toastReceiptDownloading') })} aria-label={t('dashboard.donations.ariaDownloadReceipt')}><Download className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => toast({ title: t('dashboard.donations.toastShareOpening') })} aria-label={t('dashboard.donations.ariaShare')}><Share2 className="h-4 w-4" /></Button>
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
      <ReceiptDialog transaction={selectedTransaction} open={isReceiptOpen} onOpenChange={setIsReceiptOpen} t={t} rates={rates} />
    </div>
  );
}
