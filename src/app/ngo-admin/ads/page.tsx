'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Target, Globe, Plus, MousePointer2, ShieldCheck, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function AdsManagementPage() {
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
                        <h1 className="text-2xl font-bold font-headline">Reklam & Görünürlük</h1>
                        <p className="text-muted-foreground text-sm">Platform içi ve dışı reklam alanlarını yönetin.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="marketplace">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="marketplace"><Globe className="mr-2 h-4 w-4" /> Alan Keşfet</TabsTrigger>
                    <TabsTrigger value="campaigns"><Megaphone className="mr-2 h-4 w-4" /> Kampanyalar</TabsTrigger>
                    <TabsTrigger value="integration"><KeyRound className="mr-2 h-4 w-4" /> Meta / Ads</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>İş Ortağı Reklam Alanları</CardTitle>
                            <CardDescription>Hangel sistemine dahil web sitelerinin STK'lara açtığı alanlar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { site: 'haberler.com', slot: 'Manşet Yanı', type: 'Ücretsiz', reach: '100k/Gün' },
                                { site: 'alisveris-sitesi.tr', slot: 'Sepet Onay', type: 'İndirimli', reach: '25k/Gün' },
                                { site: 'blog-portali.net', slot: 'Yazı İçi', type: 'Ücretsiz', reach: '10k/Gün' }
                            ].map((partner, i) => (
                                <div key={i} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary transition-colors bg-background">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-muted"><Globe className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-bold text-sm">{partner.site}</h4>
                                            <p className="text-xs text-muted-foreground">{partner.slot} • {partner.reach}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={cn(partner.type === 'Ücretsiz' ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700")}>{partner.type}</Badge>
                                        <Button size="sm" onClick={() => toast({title: "Başvuru Yapıldı", description: "Reklam yayını için onay bekleniyor."})}>Alan Talep Et</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="campaigns" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Toplam Erişim</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">125,400</p></CardContent>
                        </Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tıklama (CTR)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">3.2%</p></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bütçe</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">1,250 ₺</p></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sosyal Medya Reklam Entegrasyonu</CardTitle>
                            <CardDescription>Facebook (Meta) Pixel ve Google Ads etiketlerinizi bağlayarak bağışçı dönüşümlerini takip edin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Meta Pixel ID</Label>
                                    <Input placeholder="123456789012345" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Google Ads Conversion ID</Label>
                                    <Input placeholder="AW-123456789" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>Bu kodlar profil sayfanızda otomatik olarak aktifleşecek ve reklam performansınızı ölçmenizi sağlayacaktır.</p>
                            </div>
                            <Button onClick={() => toast({title: "Etiketler Kaydedildi"})}>Ayarları Kaydet</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
