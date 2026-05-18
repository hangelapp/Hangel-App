'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShieldCheck, Users, Loader2, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const hrProviders = [
    { id: 'sap', name: 'SAP SuccessFactors', logo: 'S', color: 'bg-[#008FD3]', status: 'Bağlanabilir', type: 'Enterprise' },
    { id: 'workday', name: 'Workday', logo: 'W', color: 'bg-[#E28225]', status: 'Bağlanabilir', type: 'Cloud' },
    { id: 'kolayik', name: 'Kolay İK', logo: 'K', color: 'bg-[#FF5A5F]', status: 'Bağlı', type: 'Local' },
    { id: 'bamboohr', name: 'BambooHR', logo: 'B', color: 'bg-[#6AB43E]', status: 'Bağlanabilir', type: 'International' },
];

export default function HrIntegrationPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [connectingId, setConnectingId] = useState<string | null>(null);

    const handleConnect = (id: string, name: string) => {
        setConnectingId(id);
        setTimeout(() => {
            toast({ 
                title: `${name} Bağlantısı Başlatıldı`, 
                description: "İK sisteminizle veri güvenliği protokolü imzalanmak üzere yönlendiriliyorsunuz." 
            });
            setConnectingId(null);
        }, 1200);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">İK Şirketleri Entegrasyonu</h1>
                    <p className="text-muted-foreground text-sm">Kurumsal işbirliklerini ve çalışan gönüllülüğünü otomatikleştirin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hrProviders.map((provider) => (
                    <Card key={provider.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", provider.color)}>
                                {provider.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{provider.name}</p>
                                <Badge variant={provider.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {provider.status}
                                </Badge>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                disabled={connectingId === provider.id}
                                onClick={() => handleConnect(provider.id, provider.name)}
                            >
                                {connectingId === provider.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (provider.status === 'Bağlı' ? 'Yönet' : 'Sistemi Bağla')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="matching">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="matching"><Workflow className="mr-2 h-4 w-4" /> Bağış Eşleştirme</TabsTrigger>
                    <TabsTrigger value="volunteer"><Users className="mr-2 h-4 w-4" /> Kurumsal Gönüllülük</TabsTrigger>
                </TabsList>

                <TabsContent value="matching" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Bağış Eşleştirme (Matching Gifts)</CardTitle>
                            <CardDescription>Şirketlerin, çalışanlarının bağışlarını x2 veya x3 oranında desteklemesi için API ayarları.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Şirket Özel Kodu</Label>
                                    <Input placeholder="Örn: HNG-CORP-123" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Eşleştirme Oranı</Label>
                                    <Input placeholder="1:1, 1:2 vb." />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>Bu entegrasyon sayesinde şirketin çalışanları alışveriş yaptığında bağış tutarı şirket tarafından otomatik olarak tamamlanır.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={() => toast({title: "Ayarlar Kaydedildi"})}>Entegrasyonu Aktif Et</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="volunteer" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Kurumsal Gönüllülük Havuzu</CardTitle>
                            <CardDescription>Şirketlerin İK portalları üzerinden gönüllü takımlarını yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: 'X Teknoloji Takımı', members: 45, area: 'Eğitim', status: 'Aktif' },
                                { name: 'Y Bankası Doğa Gönüllüleri', members: 120, area: 'Çevre', status: 'Beklemede' }
                            ].map((team, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
                                        <div>
                                            <p className="font-bold text-sm">{team.name}</p>
                                            <p className="text-xs text-muted-foreground">{team.members} Çalışan • {team.area}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{team.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
