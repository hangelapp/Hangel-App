'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Target, Globe, ShieldCheck, KeyRound, CheckCircle2, Loader2, RefreshCw, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function AdsManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // ReklamAction Configuration (Multiple keys)
    const [apiKeys, setApiKeys] = useState([
        '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
        '9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48',
        '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3'
    ]);

    const handleSaveIntegration = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({ 
                title: "Entegrasyon Kaydedildi", 
                description: "API anahtarları ve reklam yapılandırmaları başarıyla güncellendi." 
            });
            setIsSaving(false);
        }, 1500);
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        setTimeout(() => {
            toast({
                title: "Bağlantı Başarılı",
                description: `${apiKeys.length} API anahtarı doğrulandı. Veri akışı aktif.`,
            });
            setIsTesting(false);
        }, 2000);
    };

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

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="marketplace"><Globe className="mr-2 h-4 w-4" /> Alan Keşfet</TabsTrigger>
                    <TabsTrigger value="campaigns"><Megaphone className="mr-2 h-4 w-4" /> Kampanyalar</TabsTrigger>
                    <TabsTrigger value="integration"><KeyRound className="mr-2 h-4 w-4" /> Entegrasyonlar</TabsTrigger>
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
                                <div key={i} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary transition-colors bg-background shadow-sm">
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
                        <Card className="bg-primary/5 border-primary/20 shadow-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Toplam Erişim</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">125,400</p></CardContent>
                        </Card>
                        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tıklama (CTR)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">3.2%</p></CardContent></Card>
                        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aktif Kampanya</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">4</p></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <Card className="border-primary/30 bg-primary/5 shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" /> ReklamAction API Entegrasyonu
                                    </CardTitle>
                                    <CardDescription>Aktif olarak kullanılan {apiKeys.length} adet API anahtarı.</CardDescription>
                                </div>
                                <Badge className="bg-green-600 text-white">BAĞLI</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                {apiKeys.map((key, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">API ANAHTARI #{index + 1}</Label>
                                        <Input 
                                            type="password"
                                            value={key}
                                            readOnly
                                            className="bg-background font-mono text-xs opacity-80"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-100/50 rounded-xl border border-blue-200 text-blue-800 text-[11px] font-medium leading-relaxed">
                                <Layers className="h-4 w-4 shrink-0" />
                                <p>Tüm anahtarlardan gelen teklifler otomatik olarak birleştirilir ve benzersiz olanlar Market sayfasında listelenir.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-background/50 border-t p-4 flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting}>
                                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Bağlantıları Test Et
                            </Button>
                            <Button size="sm" onClick={handleSaveIntegration} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Ayarları Güncelle
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="shadow-sm">
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
                                <p>Bu kodlar profil sayfanızda otomatik olarak aktifleşerek reklam performansınızı ölçmenizi sağlar.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/10 p-4 flex justify-end">
                            <Button onClick={handleSaveIntegration} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</> : 'Ayarları Kaydet'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
