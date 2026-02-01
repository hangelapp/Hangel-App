'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Target, TrendingUp, DollarSign, Plus, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

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
                        <h1 className="text-2xl font-bold font-headline">Reklam Yönetimi</h1>
                        <p className="text-muted-foreground text-sm">Platform genelinde görünürlüğünüzü artırın.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni Kampanya", description: "Reklam oluşturma sihirbazı açılıyor..."})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Reklam
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Erişim</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">125,400</p>
                        <p className="text-xs text-green-600 font-semibold flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1"/> +12%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tıklama Oranı (CTR)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">3.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">Sektör ortalaması %2.1</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Harcanan Bütçe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">1,250 ₺</p>
                        <p className="text-xs text-muted-foreground mt-1">Kalan: 3,750 ₺</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Aktif Kampanyalar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { title: 'Eğitim Seferberliği Tanıtımı', reach: '45k', budget: '500 ₺', progress: 65, status: 'Yayında' },
                        { title: 'Gönüllü Çağrısı - İzmir', reach: '12k', budget: '200 ₺', progress: 40, status: 'Yayında' }
                    ].map((ad, i) => (
                        <div key={i} className="p-4 border rounded-xl space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base">{ad.title}</h4>
                                    <p className="text-xs text-muted-foreground">Erişim: {ad.reach} • Bütçe: {ad.budget}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-700">{ad.status}</Badge>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Tamamlanma</span>
                                    <span>%{ad.progress}</span>
                                </div>
                                <Progress value={ad.progress} className="h-1.5" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1"><Eye className="mr-2 h-4 w-4" /> İstatistikler</Button>
                                <Button variant="outline" size="sm" className="flex-1">Duraklat</Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Hedefleme Ayarları</CardTitle>
                    <CardDescription>Reklamlarınızın kimlere gösterileceğini varsayılan olarak belirleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Hedef Şehirler</Label>
                            <Input placeholder="Tüm Türkiye" />
                        </div>
                        <div className="space-y-2">
                            <Label>İlgi Alanları</Label>
                            <Input placeholder="Eğitim, Doğa, Çocuk..." />
                        </div>
                    </div>
                    <Button variant="secondary" className="w-full">Hedeflemeyi Güncelle</Button>
                </CardContent>
            </Card>
        </div>
    );
}
