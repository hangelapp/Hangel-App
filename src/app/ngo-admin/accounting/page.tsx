'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calculator, Receipt, TrendingUp, TrendingDown, FileText, Download, Filter, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function AccountingPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">Ön Muhasebe Yönetimi</h1>
                        <p className="text-muted-foreground text-sm">Finansal kayıtlarınızı düzenleyin ve raporlayın.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({title: "Excel İçe Aktar"})}>İçe Aktar</Button>
                    <Button onClick={() => toast({title: "Yeni İşlem"})}>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Kayıt
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700">Toplam Gelir (Ay)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-emerald-800">45,250 ₺</p>
                        <p className="text-xs text-emerald-600 flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1"/> %8 artış</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700">Toplam Gider (Ay)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-rose-800">12,800 ₺</p>
                        <p className="text-xs text-rose-600 flex items-center mt-1"><TrendingDown className="h-3 w-3 mr-1"/> %2 azalış</p>
                    </CardContent>
                </Card>
                <Card className="bg-sky-50 border-sky-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-sky-700">Net Kasa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-sky-800">32,450 ₺</p>
                        <p className="text-xs text-sky-600 mt-1">Son güncelleme: Bugün 14:30</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Son Finansal Hareketler</CardTitle>
                        <CardDescription>Gelir ve gider kalemlerinin dökümü.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon"><Filter className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tür</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">Tutar</TableHead>
                                <TableHead className="text-right">Tarih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { type: 'Gelir', desc: 'Aylık Bağış Havuzu', cat: 'Bağış', amt: '+12,400 ₺', date: '22.07.2024' },
                                { type: 'Gider', desc: 'Ofis Kira Ödemesi', cat: 'Operasyon', amt: '-8,500 ₺', date: '20.07.2024' },
                                { type: 'Gelir', desc: 'Ürün Satış Geliri', cat: 'İşletme', amt: '+3,200 ₺', date: '18.07.2024' },
                                { type: 'Gider', desc: 'Sosyal Medya Reklam', cat: 'Pazarlama', amt: '-1,200 ₺', date: '15.07.2024' }
                            ].map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Badge variant={row.type === 'Gelir' ? 'default' : 'destructive'} className="text-[10px]">
                                            {row.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">{row.desc}</TableCell>
                                    <TableCell className="text-sm">{row.cat}</TableCell>
                                    <TableCell className={cn("text-right font-bold text-sm", row.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600')}>
                                        {row.amt}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{row.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-center border-t py-4">
                    <Button variant="link" className="text-xs">Tüm Hareketleri Görüntüle</Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-5 w-5" /> Fatura & Makbuz Kes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> Bağış Makbuzu Oluştur</Button>
                        <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> E-Arşiv Fatura Kes</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Download className="h-5 w-5" /> Finansal Raporlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">Mizan Raporu Al (PDF)</Button>
                        <Button variant="outline" className="w-full justify-start">Gelir Tablosu (Excel)</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
