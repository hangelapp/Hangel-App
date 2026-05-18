'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, ShieldCheck, KeyRound, Share2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const portalPartners = [
    { id: 'gonulluyuz-biz', name: 'Gönüllüyüz Biz', logo: 'G', color: 'bg-red-700', status: 'Bağlı', type: 'Kamu / Bakanlık' },
    { id: 'ability-pool', name: 'Ability Pool', logo: 'A', color: 'bg-[#00AEEF]', status: 'Bağlanabilir', type: 'Sosyal Girişim' },
    { id: 'gonullu-org', name: 'Gönüllü.org', logo: 'G', color: 'bg-indigo-600', status: 'Bağlı', type: 'Ulusal' },
    { id: 'united-nations', name: 'UN Volunteers', logo: 'U', color: 'bg-blue-500', status: 'Bağlanabilir', type: 'Global' },
    { id: 'e-devlet', name: 'e-Devlet Gönüllülük', logo: 'e', color: 'bg-red-600', status: 'Geliştirme Aşamasında', type: 'Kamu' },
];

export default function VolunteerPortalIntegrationPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            toast({ title: "Portal Senkronizasyonu Başarılı", description: "İlanlarınız diğer platformlara aktarıldı." });
            setIsSyncing(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gönüllülük Portalı Entegrasyonu</h1>
                    <p className="text-muted-foreground text-sm">İlanlarınızı diğer yerel ve küresel platformlarla senkronize edin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {portalPartners.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md", item.color)}>
                                    {item.logo}
                                </div>
                                <Badge variant={item.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                                    {item.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold mt-3">{item.name}</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-black tracking-widest text-primary">{item.type}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast({title: "Bağlantı Ayarları", description: `${item.name} yetkilendirmesi açılıyor.`})}>
                                {item.status === 'Bağlı' ? 'Yapılandır' : 'Şimdi Bağla'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> API & Webhook Bilgileri</CardTitle>
                    <CardDescription>Diğer portallardan ilan çekmek veya ilan göndermek için gerekli bilgiler.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Global Portal Auth Token</Label>
                        <div className="flex gap-2">
                            <Input type="password" value="sk_test_51MzZ2SE1..." readOnly className="font-mono text-xs bg-muted" />
                            <Button variant="outline" size="icon" onClick={() => toast({title: "Kopyalandı"})} aria-label="Paylaş"><Share2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="p-4 border rounded-xl bg-orange-50 text-orange-800 text-xs flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <p>Dış portallara aktarılan verileriniz KVKK uyumlu olarak anonimleştirilerek paylaşılır. Sadece temel ilan detayları senkronize edilir.</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                    <Button onClick={handleSync} disabled={isSyncing}>
                        {isSyncing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Veriler Aktarılıyor</> : 'Manuel Senkronizasyon Başlat'}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="bg-muted/20 border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><Globe className="h-4 w-4" /> Yayın Durumu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span>Aktif İlanlarınız:</span>
                            <span className="font-bold">12</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span>Portallara Aktarılan:</span>
                            <span className="font-bold text-green-600">8</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span>Dış Kaynaklı Başvurular (Ay):</span>
                            <span className="font-bold">45</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
