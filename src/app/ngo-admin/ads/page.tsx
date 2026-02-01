'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Target, TrendingUp, DollarSign, Plus, Eye, Globe, Share2, MousePointer2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                        <p className="text-muted-foreground text-sm">Hangel ekosistemindeki reklam alanlarını yönetin.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni Kampanya"})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Kampanya
                </Button>
            </div>

            <Tabs defaultValue="campaigns">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="campaigns"><Megaphone className="mr-2 h-4 w-4" /> Kampanyalarım</TabsTrigger>
                    <TabsTrigger value="marketplace"><Globe className="mr-2 h-4 w-4" /> İş Ortağı Alanları</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Toplam Erişim</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">125,400</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tıklama (CTR)</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">3.2%</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Harcanan Bütçe</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">1,250 ₺</p></CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Aktif Reklamlarım</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { title: 'Eğitim Seferberliği', reach: '45k', budget: '500 ₺', status: 'Yayında' }
                            ].map((ad, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold">{ad.title}</h4>
                                        <p className="text-xs text-muted-foreground">Erişim: {ad.reach} • Bütçe: {ad.budget}</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700">{ad.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="marketplace" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kullanılabilir İş Ortağı Reklam Alanları</CardTitle>
                            <CardDescription>Hangel sistemine dahil web siteleri ve pazar yerlerinin STK'lara açtığı ücretsiz/indirimli alanlar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { site: 'haberler.com', slot: 'Manşet Yanı Banner', type: 'Ücretsiz', reach: '100k/Gün' },
                                { site: 'alisveris-sitesi.tr', slot: 'Sepet Onay Ekranı', type: 'Sponsorlu', reach: '25k/Gün' },
                                { site: 'blog-portali.net', slot: 'Yazı İçi Native', type: 'Ücretsiz', reach: '10k/Gün' }
                            ].map((partner, i) => (
                                <div key={i} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-muted"><Globe className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-bold text-sm">{partner.site}</h4>
                                            <p className="text-xs text-muted-foreground">{partner.slot} • {partner.reach}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className={cn(partner.type === 'Ücretsiz' ? "bg-green-100 text-green-700" : "")}>{partner.type}</Badge>
                                        <Button size="sm" onClick={() => toast({title: "Talep İletildi", description: "Reklam yayını için onay bekleniyor."})}>Alan Talep Et</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
