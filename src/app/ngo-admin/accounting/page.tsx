'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calculator, Settings2, KeyRound, Plus, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const erpProviders = [
    { id: 'parasut', name: 'Paraşüt', logo: 'P', color: 'bg-orange-600', status: 'Bağlı' },
    { id: 'logo', name: 'Logo İşbaşı', logo: 'L', color: 'bg-red-600', status: 'Bağlanabilir' },
    { id: 'kolaybi', name: 'KolayBi', logo: 'K', color: 'bg-blue-500', status: 'Bağlanabilir' },
    { id: 'bizimhesap', name: 'Bizim Hesap', logo: 'B', color: 'bg-emerald-600', status: 'Bağlanabilir' },
];

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
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> Yazılım Bağla</TabsTrigger>
                    <TabsTrigger value="overview"><Calculator className="mr-2 h-4 w-4" /> Kasa Takibi</TabsTrigger>
                    <TabsTrigger value="api"><LinkIcon className="mr-2 h-4 w-4" /> API Ayarları</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {erpProviders.map((erp) => (
                            <Card key={erp.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", erp.color)}>
                                        {erp.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{erp.name}</p>
                                        <Badge variant={erp.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {erp.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full">Bağla</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> ERP Bağlantı Kodları</CardTitle>
                            <CardDescription>Mevcut ön muhasebe yazılımınızdan aldığınız API bilgilerini buraya girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>API Username / Client ID</Label>
                                    <Input placeholder="Client ID girin" />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Password / Client Secret</Label>
                                    <Input type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>Entegrasyon aktif olduğunda, Hangel üzerinden gelen bağışlar otomatik olarak muhasebe sisteminize "Bağış Geliri" olarak işlenir.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={() => toast({title: "Entegrasyon Tamamlandı"})}>Bağlantıyı Doğrula</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

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
                                    <TableRow><TableHead>Tür</TableHead><TableHead>Açıklama</TableHead><TableHead className="text-right">Tutar</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><Badge>Gelir</Badge></TableCell>
                                        <TableCell>Aylık Bağış Havuzu Transferi</TableCell>
                                        <TableCell className="text-right text-emerald-600">+12,400 ₺</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Özel API Webhook Ayarları</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Webhook URL</Label><Input placeholder="https://..." /></div>
                            <div className="space-y-2"><Label>Auth Token</Label><Input type="password" placeholder="••••" /></div>
                            <Button onClick={() => toast({title: "API Ayarları Kaydedildi"})}>Kaydet</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
