'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Package, Globe, Copy, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const marketplaceProviders = [
    { id: 'trendyol', name: 'Trendyol', logo: 'T', color: 'bg-[#f27a1a]', status: 'Bağlanabilir' },
    { id: 'hepsiburada', name: 'Hepsiburada', logo: 'H', color: 'bg-[#ff6000]', status: 'Bağlı' },
    { id: 'amazon', name: 'Amazon', logo: 'A', color: 'bg-[#232f3e]', status: 'Bağlanabilir' },
    { id: 'n11', name: 'n11', logo: 'n', color: 'bg-[#5d1ed4]', status: 'Bağlanabilir' },
];

export default function EcommerceManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const xmlFeedUrl = "https://hangel.org/api/v1/xml/ahbap-isletme-feed";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Kopyalandı!", description: "Link panoya kaydedildi." });
    };

    const handleSaveIntegration = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({ title: "Pazar Yeri Bağlandı", description: "Ürünleriniz senkronize edilmeye başlandı." });
            setIsSaving(false);
        }, 1500);
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
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Globe className="mr-2 h-4 w-4" /> Pazar Yeri Bağla</TabsTrigger>
                    <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" /> Ürünlerim</TabsTrigger>
                    <TabsTrigger value="xml"><Copy className="mr-2 h-4 w-4" /> XML Feed</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {marketplaceProviders.map((mp) => (
                            <Card key={mp.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", mp.color)}>
                                        {mp.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{mp.name}</p>
                                        <Badge variant={mp.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {mp.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Yönlendiriliyor", description: `${mp.name} mağaza paneline gidiliyor.`})}>Bağla</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> API Entegrasyon Bilgileri</CardTitle>
                            <CardDescription>Pazar yerlerinden aldığınız Mağaza ID ve API kodlarını buraya girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Mağaza ID</Label>
                                <Input placeholder="Seller ID / Mağaza Kodunuz" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input placeholder="API Anahtarı" />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Secret</Label>
                                    <Input type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-orange-50 text-orange-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>Entegrasyon sayesinde stoklarınız tüm pazar yerlerinde Hangel ile senkronize çalışacaktır.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={handleSaveIntegration} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor</> : 'Bağlantıyı Kaydet'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="products" className="mt-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold">Aktif Ürünler (12)</h3>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: '1', name: 'Logolu Tişört', price: '250 ₺', stock: 120, img: 'https://picsum.photos/seed/t1/200/200' },
                            { id: '2', name: 'Bez Çanta', price: '85 ₺', stock: 450, img: 'https://picsum.photos/seed/t2/200/200' },
                            { id: '3', name: 'Kupa Bardak', price: '120 ₺', stock: 85, img: 'https://picsum.photos/seed/t3/200/200' }
                        ].map(product => (
                            <Card key={product.id} className="overflow-hidden group hover:border-primary transition-colors">
                                <div className="relative aspect-square w-full">
                                    <Image src={product.img} alt={product.name} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm">Düzenle</Button>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h4 className="font-bold text-sm truncate">{product.name}</h4>
                                    <p className="text-lg font-black text-primary">{product.price}</p>
                                    <p className="text-[10px] text-muted-foreground">Stok: {product.stock}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="xml" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Otomatik Veri Akışı (XML Feed)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Bu linki kullanarak ürünlerinizi Google Merchant, Facebook Catalog veya diğer pazar yerlerine otomatik olarak aktarabilirsiniz.</p>
                            <div className="flex gap-2">
                                <Input readOnly value={xmlFeedUrl} className="font-mono text-xs bg-muted" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(xmlFeedUrl)}><Copy className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => toast({title: "Feed Yenilendi"})}>Akışı Güncelle</Button>
                                <Button variant="outline" className="flex-1" onClick={() => window.open(xmlFeedUrl, '_blank')}>Önizle</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}