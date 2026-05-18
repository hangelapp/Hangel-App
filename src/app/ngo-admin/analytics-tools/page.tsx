'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Code, ShieldCheck, KeyRound, Loader2, MousePointer2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const trackingTools = [
    { id: 'ga4', name: 'Google Analytics 4', logo: 'GA', color: 'bg-[#F9AB00]', status: 'Bağlı', type: 'Analytics' },
    { id: 'meta-pixel', name: 'Meta Pixel', logo: 'MP', color: 'bg-[#0668E1]', status: 'Bağlanabilir', type: 'Ads' },
    { id: 'hotjar', name: 'Hotjar', logo: 'HJ', color: 'bg-[#FD3C00]', status: 'Bağlanabilir', type: 'UX' },
    { id: 'gtm', name: 'Tag Manager', logo: 'TM', color: 'bg-[#246FDB]', status: 'Bağlı', type: 'Integration' },
];

export default function AnalyticsToolsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({ title: "Takip Kodları Kaydedildi", description: "Değişiklikler tüm platformda aktif hale getirildi." });
            setIsSaving(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Web Analiz Araçları</h1>
                    <p className="text-muted-foreground text-sm">Ziyaretçi trafiğinizi ve bağışçı dönüşümlerini profesyonelce ölçümleyin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trackingTools.map((tool) => (
                    <Card key={tool.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", tool.color)}>
                                {tool.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{tool.name}</p>
                                <Badge variant={tool.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {tool.status}
                                </Badge>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => toast({title: "Yapılandırma", description: `${tool.name} ayarları açılıyor.`})}
                            >
                                {tool.status === 'Bağlı' ? 'Yönet' : 'Kuruluma Başla'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="standard">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="standard"><Code className="mr-2 h-4 w-4" /> Standart Etiketler</TabsTrigger>
                    <TabsTrigger value="events"><MousePointer2 className="mr-2 h-4 w-4" /> Olay İzleme (Events)</TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> Kimlikler (Tracking IDs)</CardTitle>
                            <CardDescription>Kullandığınız araçların mülk veya hesap kimliklerini buraya girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>GA4 Measurement ID</Label>
                                    <Input placeholder="G-XXXXXXXXXX" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meta Pixel ID</Label>
                                    <Input placeholder="123456789012345" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>GTM Container ID</Label>
                                <Input placeholder="GTM-XXXXXXX" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor</> : 'Değişiklikleri Kaydet'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Dönüşüm Olayları (Conversion Tracking)</CardTitle>
                            <CardDescription>Bağış ve gönüllülük adımları için otomatik olay izleme durumları.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: 'donations_completed', label: 'Bağış Tamamlandı', status: 'İzleniyor' },
                                { name: 'volunteer_apply_click', label: 'Gönüllü Başvuru Tıklandı', status: 'İzleniyor' },
                                { name: 'ngo_profile_share', label: 'Profil Paylaşıldı', status: 'İzleniyor' }
                            ].map((event, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between bg-muted/10">
                                    <div>
                                        <p className="font-bold text-sm">{event.label}</p>
                                        <code className="text-[10px] text-muted-foreground">{event.name}</code>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{event.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold">Veri Gizliliği ve Çerez Politikası</p>
                    <p>Takip kodları eklendiğinde, web sitenizdeki çerez onay bannerı otomatik olarak "Analitik Çerezler" kategorisini aktif hale getirir. Tüm veri toplama işlemleri KVKK ve GDPR uyumlu olarak gerçekleştirilmektedir.</p>
                </div>
            </div>
        </div>
    );
}
