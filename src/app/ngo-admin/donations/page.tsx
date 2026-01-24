'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowDownUp } from 'lucide-react';
import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const donationHistory = [
  { id: 'TXN123', brand: 'Doğa Dostu Giyim', purchaseAmount: 150, ngoShare: 12.75, date: '2024-07-20', status: 'Tamamlandı' },
  { id: 'TXN124', brand: 'Lezzet Köyü', purchaseAmount: 80, ngoShare: 6.80, date: '2024-07-20', status: 'Tamamlandı' },
  { id: 'TXN125', brand: 'Tekno Market', purchaseAmount: 1200, ngoShare: 42.50, date: '2024-07-19', status: 'Tamamlandı' },
  { id: 'TXN126', brand: 'Gezgin Rotalar', purchaseAmount: 450, ngoShare: 30.60, date: '2024-07-18', status: 'Beklemede' },
  { id: 'TXN127', brand: 'Doğa Dostu Giyim', purchaseAmount: 250, ngoShare: 21.25, date: '2024-06-15', status: 'Tamamlandı' },
  { id: 'TXN128', brand: 'Tekno Market', purchaseAmount: 800, ngoShare: 28.33, date: '2024-05-22', status: 'Tamamlandı' },
  { id: 'TXN129', brand: 'Lezzet Köyü', purchaseAmount: 120, ngoShare: 10.20, date: '2024-04-10', status: 'Tamamlandı' },
];

const monthlyEarnings = [
    { month: 'Kasım 2024', amount: 135.50, status: 'Tahmini' },
    { month: 'Ekim 2024', amount: 110.00, status: 'Tahmini' },
    { month: 'Eylül 2024', amount: 95.75, status: 'Tahmini' },
    { month: 'Ağustos 2024', amount: 88.20, status: 'Tahmini' },
    { month: 'Temmuz 2024', amount: 92.65, status: 'Tahmini' },
    { month: 'Haziran 2024', amount: 21.25, status: 'Kesinleşti' },
    { month: 'Mayıs 2024', amount: 28.33, status: 'Kesinleşti' },
    { month: 'Nisan 2024', amount: 10.20, status: 'Kesinleşti' },
];

const statusVariantMap = {
    'Tamamlandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
} as const;

const TransactionCard = ({ transaction }: { transaction: typeof donationHistory[0] }) => (
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

const TransactionList = ({ transactions }: { transactions: typeof donationHistory }) => (
    <div className="space-y-4">
        {transactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
        ))}
    </div>
);


export default function DonationsPage() {
    const pastTransactions = donationHistory.filter(tx => tx.status === 'Tamamlandı');
    const futureTransactions = donationHistory.filter(tx => tx.status === 'Beklemede');
    
    const donationStats = useMemo(() => {
        const totalNgoShare = donationHistory.reduce((acc, tx) => acc + tx.ngoShare, 0);
        const totalTransactions = donationHistory.length;
        const donationsByBrand = donationHistory.reduce((acc, tx) => {
            if (!acc[tx.brand]) {
                acc[tx.brand] = 0;
            }
            acc[tx.brand] += tx.ngoShare;
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
    }, []);
    
    const currentMonthYear = format(new Date(), 'MMMM yyyy', { locale: tr });

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
            <div className="space-y-3">
                {monthlyEarnings.map(earning => (
                    <div key={earning.month} className={cn(
                        "flex justify-between items-center p-3 rounded-lg bg-muted/50",
                        earning.month.toLowerCase() === currentMonthYear.toLowerCase() && "ring-2 ring-primary"
                    )}>
                        <div>
                            <p className="font-semibold">{earning.month}</p>
                            <p className="text-xs text-muted-foreground">{earning.status} Hak Ediş</p>
                        </div>
                        <p className="text-lg font-bold text-primary">{earning.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                    </div>
                ))}
            </div>
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
              <Button variant="outline" size="icon">
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
                    <TransactionList transactions={donationHistory} />
                </TabsContent>
                <TabsContent value="past" className="mt-4">
                   <TransactionList transactions={pastTransactions} />
                </TabsContent>
                <TabsContent value="future" className="mt-4">
                    <TransactionList transactions={futureTransactions} />
                </TabsContent>
                <TabsContent value="stats" className="mt-4 space-y-6">
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
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
