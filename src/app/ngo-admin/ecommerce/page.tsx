'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingCart, Plus, Package, Truck, BarChart3, Edit, Trash2, Search, Filter, Share2, Globe, CheckCircle2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function EcommerceManagementPage() {
    const { toast } = useToast();
    const router = useRouter();

    const xmlFeedUrl = "https://hangel.org/api/v1/xml/ahbap-isletme-feed";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Kopyalandı!", description: "Link panoya kaydedildi." });
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">İktisadi İşletme & Pazar Yeri</h1>
                        <p className="text-muted-foreground text-sm">Ürün yönetimi ve pazar yeri entegrasyonları.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni Ürün"})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
                </Button>
            </div>

            <Tabs defaultValue="products">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" /> Ürünler</TabsTrigger>
                    <TabsTrigger value="orders"><Truck className="mr-2 h-4 w-4" /> Siparişler</TabsTrigger>
                    <TabsTrigger value="sync"><Globe className="mr-2 h-4 w-4" /> Entegrasyon</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: '1', name: 'Logolu Tişört', price: '250 ₺', stock: 120, img: 'https://picsum.photos/seed/t1/200/200' }
                        ].map(product => (
                            <Card key={product.id} className="overflow-hidden">
                                <div className="relative aspect-square w-full"><Image src={product.img} alt={product.name} fill className="object-cover" /></div>
                                <CardContent className="p-4">
                                    <h4 className="font-bold text-sm truncate">{product.name}</h4>
                                    <p className="text-lg font-black text-primary">{product.price}</p>
                                    <p className="text-[10px] text-muted-foreground">Stok: {product.stock}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="sync" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>XML & Pazar Yeri Entegrasyonu</CardTitle>
                            <CardDescription>Ürünlerinizi Trendyol, Hepsiburada ve Hangel Market'e otomatik olarak aktarın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 border rounded-xl space-y-3 bg-muted/20">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-bold text-sm">Hangel Market XML Feed URL</Label>
                                        <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input readOnly value={xmlFeedUrl} className="bg-background font-mono text-xs" />
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(xmlFeedUrl)}><Copy className="h-4 w-4" /></Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Bu linki pazar yerlerindeki XML içe aktarma bölümüne ekleyerek stoklarınızı otomatik senkronize edebilirsiniz.</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t">
                                <h4 className="font-bold text-sm">Pazar Yeri API Bağlantıları</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-primary/50 cursor-pointer">
                                        <span className="font-semibold text-sm">Trendyol Entegrasyonu</span>
                                        <Button variant="ghost" size="sm" className="text-xs">Bağla</Button>
                                    </div>
                                    <div className="p-4 border rounded-xl flex items-center justify-between group hover:border-primary/50 cursor-pointer">
                                        <span className="font-semibold text-sm">Hepsiburada Entegrasyonu</span>
                                        <Button variant="ghost" size="sm" className="text-xs">Bağla</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders" className="mt-6">
                    <Card><CardHeader><CardTitle>Aktif Siparişler</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Bekleyen sipariş bulunmuyor.</p></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
