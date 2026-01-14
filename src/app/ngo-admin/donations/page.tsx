'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowDownUp } from 'lucide-react';
import React from 'react';

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
    { month: 'Temmuz 2024', amount: 92.65, description: 'Tahmini Hak Ediş' },
    { month: 'Haziran 2024', amount: 21.25, description: 'Kesinleşen Hak Ediş' },
    { month: 'Mayıs 2024', amount: 28.33, description: 'Kesinleşen Hak Ediş' },
    { month: 'Nisan 2024', amount: 10.20, description: 'Kesinleşen Hak Ediş' },
];

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bağış Takibi</h1>
        <p className="text-muted-foreground">Kuruluşunuza aktarılan bağışların geçmişini ve aylık hak edişlerinizi takip edin.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {monthlyEarnings.map(earning => (
             <Card key={earning.month}>
                <CardHeader>
                  <CardTitle className="text-base">{earning.month}</CardTitle>
                  <CardDescription className="text-xs">{earning.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{earning.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </CardContent>
              </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>İşlem Geçmişi</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="İşlemlerde ara..." className="pl-8" />
              </div>
              <Button variant="outline">
                Sırala <ArrowDownUp className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marka</TableHead>
                <TableHead className="text-right">Alışveriş Tutarı</TableHead>
                <TableHead className="text-right">STK Payı</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donationHistory.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.brand}</TableCell>
                  <TableCell className="text-right">{tx.purchaseAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                  <TableCell className="text-right text-primary font-bold">{tx.ngoShare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'Tamamlandı' ? 'default' : 'secondary'}>{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
