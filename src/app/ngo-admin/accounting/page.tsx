'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calculator, Receipt, TrendingUp, TrendingDown, FileText, Download, Filter, Plus, Settings2, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                        <h1 className="text-2xl font-bold font-headline">Ön Muhasebe & Entegrasyon</h1>
                        <p className="text-muted-foreground text-sm">Finansal süreçler ve ERP entegrasyonları.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni İşlem"})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Kayıt
                </Button>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="overview"><Calculator className="mr-2 h-4 w-4" /> Genel Bakış</TabsTrigger>
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> ERP Bağlantısı</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700">Gelir (Ay)</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-emerald-800">45,250 ₺</p></CardContent>
                        </Card>
                        <Card className="bg-rose-50 border-rose-200">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-700">Gider (Ay)</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-rose-800">12,800 ₺</p></CardContent>
                        </Card>
                        <Card className="bg-sky-50 border-sky-200">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-sky-700">Net Kasa</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-sky-800">32,450 ₺</p></CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Son Hareketler</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tür</TableHead><TableHead>Açıklama</TableHead><TableHead className="text-right">Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><Badge>Gelir</Badge></TableCell>
                                        <TableCell>Aylık Bağış Havuzu</TableCell>
                                        <TableCell className="text-right text-emerald-600">+12,400 ₺</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integration" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dış Sistem Entegrasyonları</CardTitle>
                            <CardDescription>Mevcut muhasebe yazılımınızı Hangel ile senkronize edin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { name: 'Paraşüt', status: 'Bağlı Değil' },
                                    { name: 'Logo İşbaşı', status: 'Bağlı Değil' },
                                    { name: 'KolayBi', status: 'Bağlı Değil' },
                                    { name: 'Bizim Hesap', status: 'Bağlı Değil' }
                                ].map((erp, i) => (
                                    <div key={i} className="p-4 border rounded-xl space-y-3 hover:bg-accent transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-bold text-xs">{erp.name[0]}</div>
                                            <Badge variant="secondary" className="text-[10px]">{erp.status}</Badge>
                                        </div>
                                        <p className="font-bold text-sm">{erp.name}</p>
                                        <Button variant="outline" size="sm" className="w-full text-xs">Şimdi Bağla</Button>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 pt-6 border-t">
                                <h4 className="font-bold text-sm flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Özel API Entegrasyonu</h4>
                                <div className="space-y-2">
                                    <Label>API Webhook URL</Label>
                                    <Input placeholder="https://sizin-sisteminiz.com/api/hangel-webhook" />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Auth Token</Label>
                                    <Input type="password" placeholder="••••••••••••••••" />
                                </div>
                                <Button onClick={() => toast({title: "API Kaydedildi"})}>API Bağlantısını Test Et</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
