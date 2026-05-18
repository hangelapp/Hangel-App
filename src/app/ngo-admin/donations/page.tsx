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

interface DonationTransaction {
    id: string;
    brand: string;
    purchaseAmount: number;
    ngoShare: number;
    date: string;
    status: string;
}

interface MonthlyEarning {
    id: string;
    month: string;
    amount: number;
    status: string;
}

const statusVariantMap = {
    'Tamamlandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
} as const;

const TransactionCard = ({ transaction }: { transaction: DonationTransaction }) => (
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
                <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                <span className='font-medium'>{transaction.purchaseAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
             </div>
             <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>STK Payı</span>
                <span className='font-bold text-primary'>{transaction.ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
             </div>
        </CardContent>
    </Card>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{message}</p>
    </div>
);

const TransactionList = ({ transactions }: { transactions: DonationTransaction[] }) => (
    <div className="space-y-4">
        {transactions.length === 0 ? (
            <EmptyState message="Henüz işlem bulunmuyor." />
        ) : (
            transactions.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} />
            ))
        )}
    </div>
);


export default function DonationsPage() {
    const [currentMonthYear, setCurrentMonthYear] = useState('');
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    useEffect(() => {
        setCurrentMonthYear(format(new Date(), 'MMMM yyyy', { locale: tr }));
    }, []);

    // Load donations from Firestore
    const donationsQuery = useMemoFirebase(() => {
        if (!authUser?.uid) return null;
        return query(
            collection(firestore, 'donations'),
            where('ngoId', '==', authUser.uid),
            orderBy('date', 'desc')
        );
    }, [firestore, authUser?.uid]);

    const { data: donationHistory, isLoading: isDonationsLoading } = useCollection<DonationTransaction>(donationsQuery);

    // Load monthly earnings from Firestore
    const earningsQuery = useMemoFirebase(() => {
        if (!authUser?.uid) return null;
        return query(
            collection(firestore, 'monthlyEarnings'),
            where('ngoId', '==', authUser.uid),
            orderBy('month', 'desc')
        );
    }, [firestore, authUser?.uid]);

    const { data: monthlyEarnings, isLoading: isEarningsLoading } = useCollection<MonthlyEarning>(earningsQuery);

    const transactions = useMemo(() => donationHistory || [], [donationHistory]);
    const earnings = useMemo(() => monthlyEarnings || [], [monthlyEarnings]);

    const pastTransactions = transactions.filter(tx => tx.status === 'Tamamlandı');
    const futureTransactions = transactions.filter(tx => tx.status === 'Beklemede');

    const donationStats = useMemo(() => {
        const totalNgoShare = transactions.reduce((acc, tx) => acc + (tx.ngoShare || 0), 0);
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

        return {
            totalNgoShare,
            totalTransactions,
            averageNgoShare: totalTransactions > 0 ? totalNgoShare / totalTransactions : 0,
            brandChartData,
        };
    }, [transactions]);

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
        <h1 className="text-2xl font-bold">Bağış Takibi</h1>
        <p className="text-muted-foreground">Kuruluşunuza aktarılan bağışların geçmişini ve aylık hak edişlerinizi takip edin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aylık Hak Edişler</CardTitle>
          <CardDescription>Geçmiş ve gelecek aylara ait kesinleşmiş ve tahmini hak edişleriniz.</CardDescription>
        </CardHeader>
        <CardContent>
            {earnings.length === 0 ? (
                <EmptyState message="Henüz hak ediş verisi bulunmuyor." />
            ) : (
            <div className="space-y-3">
                {earnings.map(earning => (
                    <div key={earning.id} className={cn(
                        "flex justify-between items-center p-3 rounded-lg bg-muted/50",
                        (currentMonthYear && earning.month.toLowerCase() === currentMonthYear.toLowerCase()) && "ring-2 ring-primary"
                    )}>
                        <div>
                            <p className="font-semibold">{earning.month}</p>
                            <p className="text-xs text-muted-foreground">{earning.status} Hak Ediş</p>
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
            <CardTitle>İşlem Geçmişi</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="İşlemlerde ara..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon" aria-label="Sırala">
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">Tüm İşlemler</TabsTrigger>
                    <TabsTrigger value="past">Kesinleşenler</TabsTrigger>
                    <TabsTrigger value="future">Bekleyenler</TabsTrigger>
                    <TabsTrigger value="stats">İstatistikler</TabsTrigger>
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
                        <EmptyState message="Henüz istatistik oluşturacak yeterli veri bulunmuyor." />
                    ) : (
                    <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Genel Bağış Özeti</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">{donationStats.totalNgoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                                <p className="text-sm text-muted-foreground">Toplam STK Payı</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{donationStats.totalTransactions}</p>
                                <p className="text-sm text-muted-foreground">Toplam İşlem Sayısı</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{donationStats.averageNgoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                                <p className="text-sm text-muted-foreground">Ortalama Bağış Tutarı</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Markalara Göre Bağış Dağılımı</CardTitle>
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
    </div>
  );
}
