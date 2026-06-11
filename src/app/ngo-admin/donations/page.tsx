'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowDownUp, Loader2, Inbox } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { printPayoutReceipt } from '@/components/shared/payout-receipt';

interface NgoSplitEntry {
    ngoId: string;
    ngoName: string;
    amount: number;
}

interface DonationDoc {
    id: string;
    brandName?: string;
    brand?: string;
    purchaseAmount?: number;
    donationAmount?: number;
    ngoIds?: string[];
    ngo?: string[];
    ngoSplit?: NgoSplitEntry[];
    status?: string;
    period?: string;
    date?: string;
    payoutDate?: string;
}

interface DonationTransaction {
    id: string;
    brand: string;
    purchaseAmount: number;
    ngoShare: number;
    date: string;
    period: string;
    status: string;
}

interface MonthlyEarning {
    id: string;
    month: string;
    amount: number;
    status: string;
}

const PAID_STATUSES = ['Yatırıldı', 'Tamamlandı'];
const PENDING_STATUS = 'İşleme Alındı';

const statusVariantMap = {
    'Tamamlandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Yatırıldı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'İşleme Alındı': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
} as const;

const TRY = (n: number) => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

/** Bu STK'nın bir bağıştaki net payını çıkarır. */
function ngoNetShare(d: DonationDoc, ngoId: string): number {
    const split = d.ngoSplit?.find(s => s.ngoId === ngoId);
    if (split && typeof split.amount === 'number') return split.amount;
    // Eski kayıtlar için fallback: net bağışı paylaşan dernek sayısına böl.
    const divisor = d.ngo?.length || 1;
    return (d.donationAmount || 0) / divisor;
}

const TransactionCard = ({ transaction }: { transaction: DonationTransaction }) => {
    const { t } = useTranslation();
    return (
    <Card>
        <CardHeader className='pb-4'>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base">{transaction.brand}</CardTitle>
                    <CardDescription>{transaction.date}</CardDescription>
                </div>
                <Badge variant="outline" className={cn(statusVariantMap[transaction.status as keyof typeof statusVariantMap])}>
                    {transaction.status}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-2">
             <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>{t('ngoAdminDonations.purchaseAmount')}</span>
                <span className='font-medium'>{transaction.purchaseAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
             </div>
             <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>{t('ngoAdminDonations.ngoShare')}</span>
                <span className='font-bold text-primary'>{transaction.ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
             </div>
        </CardContent>
    </Card>
);
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{message}</p>
    </div>
);

const TransactionList = ({ transactions }: { transactions: DonationTransaction[] }) => {
    const { t } = useTranslation();
    return (
    <div className="space-y-4">
        {transactions.length === 0 ? (
            <EmptyState message={t('ngoAdminDonations.noTransactions')} />
        ) : (
            transactions.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} />
            ))
        )}
    </div>
);
};


export default function DonationsPage() {
    const [currentMonthYear, setCurrentMonthYear] = useState('');
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const { t } = useTranslation();
    const { id: ngoId } = useActiveEntity();
    // React 19 saflık: render içinde new Date() çağırmamak için bir kez snapshot.
    const [nowMs] = useState(() => Date.now());

    useEffect(() => {
        setCurrentMonthYear(format(new Date(), 'MMMM yyyy', { locale: tr }));
    }, []);

    // Gerçek bağışlar: bu STK'nın dahil olduğu dağıtımlar.
    const donationsQuery = useMemoFirebase(() => {
        if (!ngoId) return null;
        return query(
            collection(firestore, COLLECTIONS.donations),
            where('ngoIds', 'array-contains', ngoId)
        );
    }, [firestore, ngoId]);

    const { data: donationDocs, isLoading: isDonationsLoading } = useCollection<DonationDoc>(donationsQuery);

    // Ödeme geçmişi: bu STK'ya yapılan hak ediş ödemeleri (payouts kaydı).
    const payoutsQuery = useMemoFirebase(() => {
        if (!ngoId) return null;
        return query(collection(firestore, COLLECTIONS.payouts), where('ngoId', '==', ngoId));
    }, [firestore, ngoId]);
    const { data: payoutDocs } = useCollection<{ id: string; period?: string; amount?: number; donationCount?: number; status?: string; reference?: string; notes?: string; ngoName?: string; paidAt?: { toDate?: () => Date } | null }>(payoutsQuery);
    const payoutHistory = useMemo(() => {
        return (payoutDocs || []).slice().sort((a, b) => {
            const am = a.paidAt?.toDate ? a.paidAt.toDate().getTime() : 0;
            const bm = b.paidAt?.toDate ? b.paidAt.toDate().getTime() : 0;
            return bm - am;
        });
    }, [payoutDocs]);

    // Load monthly earnings from Firestore (yardımcı/legacy gösterim).
    const earningsQuery = useMemoFirebase(() => {
        if (!authUser?.uid) return null;
        return query(
            collection(firestore, COLLECTIONS.monthlyEarnings),
            where('ngoId', '==', authUser.uid),
            orderBy('month', 'desc')
        );
    }, [firestore, authUser?.uid]);

    const { data: monthlyEarnings, isLoading: isEarningsLoading } = useCollection<MonthlyEarning>(earningsQuery);

    const earnings = useMemo(() => monthlyEarnings || [], [monthlyEarnings]);

    // Her bağışı bu STK'nın net payıyla işlem kaydına dönüştür.
    const transactions = useMemo<DonationTransaction[]>(() => {
        if (!ngoId) return [];
        return (donationDocs || [])
            .map((d) => ({
                id: d.id,
                brand: d.brandName || d.brand || '—',
                purchaseAmount: d.purchaseAmount || 0,
                ngoShare: ngoNetShare(d, ngoId),
                date: d.date || '',
                period: d.period || (d.date ? d.date.slice(0, 7) : ''),
                status: d.status || PENDING_STATUS,
            }))
            .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    }, [donationDocs, ngoId]);

    const pastTransactions = transactions.filter(tx => PAID_STATUSES.includes(tx.status));
    const futureTransactions = transactions.filter(tx => tx.status === PENDING_STATUS);

    const donationStats = useMemo(() => {
        const totalNgoShare = transactions.reduce((acc, tx) => acc + (tx.ngoShare || 0), 0);
        const pendingNgoShare = transactions
            .filter(tx => tx.status === PENDING_STATUS)
            .reduce((acc, tx) => acc + (tx.ngoShare || 0), 0);
        const paidNgoShare = transactions
            .filter(tx => PAID_STATUSES.includes(tx.status))
            .reduce((acc, tx) => acc + (tx.ngoShare || 0), 0);
        const totalTransactions = transactions.length;
        const donationsByBrand = transactions.reduce((acc, tx) => {
            if (!acc[tx.brand]) {
                acc[tx.brand] = 0;
            }
            acc[tx.brand] += (tx.ngoShare || 0);
            return acc;
        }, {} as Record<string, number>);

        const brandChartData = Object.entries(donationsByBrand)
            .map(([name, Bağış]) => ({ name, Bağış }))
            .sort((a, b) => b.Bağış - a.Bağış);

        // AYLIK kırılım: period (YYYY-MM) bazında net toplamlar.
        const byMonth = transactions.reduce((acc, tx) => {
            const key = tx.period || (tx.date ? tx.date.slice(0, 7) : '—');
            acc[key] = (acc[key] || 0) + (tx.ngoShare || 0);
            return acc;
        }, {} as Record<string, number>);
        const monthlyBreakdown = Object.entries(byMonth)
            .map(([period, amount]) => ({ period, amount }))
            .sort((a, b) => (a.period < b.period ? 1 : -1));

        // GÜNLÜK kırılım: son 30 günün date bazında net toplamları.
        const cutoff = nowMs - 30 * 24 * 60 * 60 * 1000;
        const byDay = transactions.reduce((acc, tx) => {
            if (!tx.date) return acc;
            const ts = Date.parse(tx.date);
            if (Number.isNaN(ts) || ts < cutoff) return acc;
            acc[tx.date] = (acc[tx.date] || 0) + (tx.ngoShare || 0);
            return acc;
        }, {} as Record<string, number>);
        const dailyBreakdown = Object.entries(byDay)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => (a.date < b.date ? 1 : -1));

        return {
            totalNgoShare,
            pendingNgoShare,
            paidNgoShare,
            totalTransactions,
            averageNgoShare: totalTransactions > 0 ? totalNgoShare / totalTransactions : 0,
            brandChartData,
            monthlyBreakdown,
            dailyBreakdown,
        };
    }, [transactions, nowMs]);

    const isLoading = isDonationsLoading || isEarningsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('ngoAdminDonations.title')}</h1>
        <p className="text-muted-foreground">{t('ngoAdminDonations.subtitle')}</p>
      </div>

      {/* ANA GÖSTERİM: gerçek net hak ediş özeti */}
      <Card>
        <CardHeader>
          <CardTitle>Net Hak Ediş</CardTitle>
          <CardDescription>Bağış dağıtım motorundan derneğinize düşen gerçek net pay.</CardDescription>
        </CardHeader>
        <CardContent>
            {transactions.length === 0 ? (
                <EmptyState message="Henüz dağıtılmış bağış bulunmuyor." />
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{TRY(donationStats.totalNgoShare)}</p>
                    <p className="text-sm text-muted-foreground">Toplam Net Hak Ediş</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-100/60 dark:bg-yellow-900/20">
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{TRY(donationStats.pendingNgoShare)}</p>
                    <p className="text-sm text-muted-foreground">Bekleyen (İşleme Alındı)</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100/60 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{TRY(donationStats.paidNgoShare)}</p>
                    <p className="text-sm text-muted-foreground">Ödenen (Yatırıldı)</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{donationStats.totalTransactions}</p>
                    <p className="text-sm text-muted-foreground">İşlem Sayısı</p>
                </div>
            </div>
            )}
        </CardContent>
      </Card>

      {/* AYLIK ve GÜNLÜK periyot kırılımı */}
      {transactions.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aylık Periyot</CardTitle>
            <CardDescription>Ay (YYYY-MM) bazında net hak ediş.</CardDescription>
          </CardHeader>
          <CardContent>
            {donationStats.monthlyBreakdown.length === 0 ? (
                <EmptyState message="Aylık veri yok." />
            ) : (
            <div className="space-y-2">
                {donationStats.monthlyBreakdown.map(m => (
                    <div key={m.period} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <p className="font-semibold">{m.period}</p>
                        <p className="text-lg font-bold text-primary">{TRY(m.amount)}</p>
                    </div>
                ))}
            </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Günlük Periyot</CardTitle>
            <CardDescription>Son 30 günde gün (YYYY-MM-DD) bazında net hak ediş.</CardDescription>
          </CardHeader>
          <CardContent>
            {donationStats.dailyBreakdown.length === 0 ? (
                <EmptyState message="Son 30 günde bağış yok." />
            ) : (
            <div className="space-y-2">
                {donationStats.dailyBreakdown.map(d => (
                    <div key={d.date} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <p className="font-semibold">{d.date}</p>
                        <p className="text-lg font-bold text-primary">{TRY(d.amount)}</p>
                    </div>
                ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('ngoAdminDonations.monthlyTitle')}</CardTitle>
          <CardDescription>{t('ngoAdminDonations.monthlyDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            {earnings.length === 0 ? (
                <EmptyState message={t('ngoAdminDonations.noEarnings')} />
            ) : (
            <div className="space-y-3">
                {earnings.map(earning => (
                    <div key={earning.id} className={cn(
                        "flex justify-between items-center p-3 rounded-lg bg-muted/50",
                        (currentMonthYear && earning.month.toLowerCase() === currentMonthYear.toLowerCase()) && "ring-2 ring-primary"
                    )}>
                        <div>
                            <p className="font-semibold">{earning.month}</p>
                            <p className="text-xs text-muted-foreground">{earning.status} {t('ngoAdminDonations.earningSuffix')}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">{(earning.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                    </div>
                ))}
            </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle>{t('ngoAdminDonations.historyTitle')}</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t('ngoAdminDonations.searchPh')} className="pl-8" />
              </div>
              <Button variant="outline" size="icon" aria-label={t('ngoAdminDonations.sortAria')}>
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">{t('ngoAdminDonations.tabAll')}</TabsTrigger>
                    <TabsTrigger value="past">{t('ngoAdminDonations.tabPast')}</TabsTrigger>
                    <TabsTrigger value="future">{t('ngoAdminDonations.tabFuture')}</TabsTrigger>
                    <TabsTrigger value="stats">{t('ngoAdminDonations.tabStats')}</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <TransactionList transactions={transactions} />
                </TabsContent>
                <TabsContent value="past" className="mt-4">
                   <TransactionList transactions={pastTransactions} />
                </TabsContent>
                <TabsContent value="future" className="mt-4">
                    <TransactionList transactions={futureTransactions} />
                </TabsContent>
                <TabsContent value="stats" className="mt-4 space-y-6">
                    {transactions.length === 0 ? (
                        <EmptyState message={t('ngoAdminDonations.noStats')} />
                    ) : (
                    <>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('ngoAdminDonations.summaryTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">{donationStats.totalNgoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                                <p className="text-sm text-muted-foreground">{t('ngoAdminDonations.totalNgoShare')}</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{donationStats.totalTransactions}</p>
                                <p className="text-sm text-muted-foreground">{t('ngoAdminDonations.totalTransactions')}</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{donationStats.averageNgoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                                <p className="text-sm text-muted-foreground">{t('ngoAdminDonations.avgDonation')}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('ngoAdminDonations.brandChartTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={donationStats.brandChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`} />
                                    <Legend />
                                    <Bar dataKey="Bağış" fill="#f34723" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    </>
                    )}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      {payoutHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ödeme Geçmişi</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {payoutHistory.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{p.period || '—'} dönemi</p>
                  <p className="text-xs text-muted-foreground">
                    {(p.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    {p.donationCount ? ` · ${p.donationCount} bağış` : ''}
                    {p.paidAt?.toDate ? ` · ${format(p.paidAt.toDate(), 'd MMM yyyy', { locale: tr })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-green-100 text-green-700 border-green-200">Ödendi</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => printPayoutReceipt({
                      ngoName: p.ngoName || '',
                      period: p.period || '',
                      amount: p.amount || 0,
                      donationCount: p.donationCount || 0,
                      paidAtMs: p.paidAt?.toDate ? p.paidAt.toDate().getTime() : null,
                      reference: p.reference,
                      notes: p.notes,
                      payoutId: p.id,
                    })}
                  >
                    Makbuz
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
