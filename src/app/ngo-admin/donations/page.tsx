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
];

export default function DonationsPage() {
  const totalEarnings = donationHistory.reduce((sum, tx) => sum + tx.ngoShare, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bağış Takibi</h1>
      <Card>
        <CardHeader>
          <CardTitle>Temmuz 2024 Tahmini Hak Ediş</CardTitle>
          <CardDescription>Markalardan yapılan alışverişler aracılığıyla kuruluşunuza aktarılan bağışların geçmişi.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{totalEarnings.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
        </CardContent>
      </Card>
      
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
