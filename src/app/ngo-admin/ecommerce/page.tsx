'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingCart, Plus, Package, Truck, BarChart3, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const initialProducts = [
    { id: '1', name: 'Ahbap Logolu Tişört', price: '250 ₺', stock: 120, sales: 45, img: 'https://picsum.photos/seed/tshirt/200/200' },
    { id: '2', name: 'Dayanışma Bez Çanta', price: '85 ₺', stock: 350, sales: 128, img: 'https://picsum.photos/seed/bag/200/200' },
    { id: '3', name: 'Gönüllü Yaka Kartı Kılıfı', price: '45 ₺', stock: 500, sales: 12, img: 'https://picsum.photos/seed/card/200/200' },
];

const initialOrders = [
    { id: 'ORD-1234', customer: 'Can Demir', items: '2x Tişört', total: '500 ₺', date: 'Bugün 10:30', status: 'Hazırlanıyor' },
    { id: 'ORD-1235', customer: 'Elif Şahin', items: '1x Bez Çanta', total: '85 ₺', date: 'Dün 18:45', status: 'Kargoya Verildi' },
];

export default function EcommerceManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">İktisadi İşletme Yönetimi</h1>
                        <p className="text-muted-foreground text-sm">Ürünlerinizi, siparişlerinizi ve e-ticaret performansınızı yönetin.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni Ürün", description: "Ürün ekleme penceresi açılıyor..."})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bu Ayki Satış</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">12,450 ₺</p>
                        <p className="text-xs text-green-600 font-semibold flex items-center mt-1"><BarChart3 className="h-3 w-3 mr-1"/> +15% artış</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aktif Siparişler</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground mt-1">2 tanesi gecikmede</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stoktaki Ürünler</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-xs text-muted-foreground mt-1">3 ürün kritik stok seviyesinde</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="products">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" /> Ürünler</TabsTrigger>
                    <TabsTrigger value="orders"><Truck className="mr-2 h-4 w-4" /> Siparişler</TabsTrigger>
                    <TabsTrigger value="settings"><Edit className="mr-2 h-4 w-4" /> Ayarlar</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6 space-y-4">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Ürün ara..." className="pl-10 h-10" />
                        </div>
                        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map(product => (
                            <Card key={product.id} className="overflow-hidden">
                                <div className="relative aspect-square w-full">
                                    <Image src={product.img} alt={product.name} fill className="object-cover" />
                                </div>
                                <CardContent className="p-4 space-y-1">
                                    <h4 className="font-bold text-sm truncate">{product.name}</h4>
                                    <p className="text-lg font-black text-primary">{product.price}</p>
                                    <div className="flex justify-between text-[10px] text-muted-foreground pt-2">
                                        <span>Stok: {product.stock}</span>
                                        <span>Toplam Satış: {product.sales}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-2 bg-muted/30 border-t flex gap-1">
                                    <Button variant="ghost" size="sm" className="flex-1 text-xs">Düzenle</Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Sipariş Takibi</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {initialOrders.map(order => (
                                    <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm">{order.id}</p>
                                                <Badge variant="outline" className={cn(
                                                    order.status === 'Hazırlanıyor' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                                )}>{order.status}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{order.customer} • {order.items}</p>
                                            <p className="text-[10px] text-muted-foreground">{order.date}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold">{order.total}</p>
                                            <Button size="sm">Detay</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mağaza Ayarları</CardTitle>
                            <CardDescription>Ödeme yöntemleri ve kargo yapılandırması.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Kargo Firması</Label>
                                <Select defaultValue="yurtici">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yurtici">Yurtiçi Kargo</SelectItem>
                                        <SelectItem value="aras">Aras Kargo</SelectItem>
                                        <SelectItem value="mng">MNG Kargo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sabit Kargo Ücreti (₺)</Label>
                                <Input type="number" defaultValue="45" />
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <h4 className="text-sm font-bold">XML Dışa Aktarımı</h4>
                                <p className="text-xs text-muted-foreground">Ürünlerinizi pazar yerlerine veya hangel markete aktarmak için XML linkini kullanın.</p>
                                <div className="flex gap-2 mt-2">
                                    <Input readOnly value="https://ahbap.org/shop/feed.xml" className="bg-muted font-mono text-[10px]" />
                                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText("https://ahbap.org/shop/feed.xml"); toast({title: "Kopyalandı!"}) }}>Kopyala</Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-6">
                            <Button onClick={() => toast({title: "Ayarlar Kaydedildi"})}>Ayarları Kaydet</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
