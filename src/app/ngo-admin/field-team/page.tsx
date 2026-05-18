'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Users, Navigation, Radio, ShieldCheck, Loader2, LayoutGrid, Signal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const softwareProviders = [
    { 
        id: 'connecteam', 
        name: 'Connecteam', 
        logo: 'C', 
        color: 'bg-[#0073ea]', 
        status: 'Bağlanabilir', 
        price: 'Ücretsiz (10 Kişiye Kadar)', 
        discount: 'STK\'lara %50 İndirim',
        description: 'Saha ekipleri için hepsi bir arada operasyon ve iletişim platformu.'
    },
    { 
        id: 'zello', 
        name: 'Zello for First Responders', 
        logo: 'Z', 
        color: 'bg-[#f5a623]', 
        status: 'Bağlı', 
        price: 'Ücretsiz (Onaylı STK)', 
        discount: 'Sınırsız Kullanıcı',
        description: 'Gerçek zamanlı bas-konuş (PTT) telsiz iletişimi uygulaması.'
    },
    { 
        id: 'salesforce-field', 
        name: 'Salesforce Field Service', 
        logo: 'S', 
        color: 'bg-[#00a1e0]', 
        status: 'Bağlanabilir', 
        price: 'Özel Fiyat', 
        discount: 'NGO Success Pack Dahil',
        description: 'Karmaşık saha operasyonları ve lojistik yönetimi için CRM tabanlı çözüm.'
    },
];

const activeTeams = [
    { id: 't1', name: 'İstanbul Arama Kurtarma', leader: 'Can Demir', members: 12, status: 'Görevde', location: 'Kadıköy' },
    { id: 't2', name: 'Ege Bölgesi Yardım Dağıtım', leader: 'Ayşe Yılmaz', members: 8, status: 'Hazır', location: 'İzmir' },
    { id: 't3', name: 'Güneydoğu Lojistik', leader: 'Mehmet Öztürk', members: 15, status: 'Dinlenmede', location: 'Hatay' },
];

export default function FieldTeamManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [isMapLoading, setIsMapLoading] = useState(false);

    const handleConnect = (id: string, name: string) => {
        setConnectingId(id);
        setTimeout(() => {
            toast({ 
                title: `${name} Bağlantısı İstendi`, 
                description: "Yetkilendirme ve kurumsal indirim onayı için ilgili sayfaya yönlendiriliyorsunuz." 
            });
            setConnectingId(null);
        }, 1000);
    };

    const handleOpenMap = () => {
        setIsMapLoading(true);
        setTimeout(() => {
            toast({ title: "Harita Yükleniyor", description: "Saha ekiplerinin anlık konum verileri senkronize ediliyor." });
            setIsMapLoading(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Saha Ekip Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Operasyonel ekiplerinizi ve 3. parti yönetim araçlarını tek bir yerden yönetin.</p>
                </div>
            </div>

            <Tabs defaultValue="software">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="software"><LayoutGrid className="mr-2 h-4 w-4" /> Yazılım Entegrasyonları</TabsTrigger>
                    <TabsTrigger value="active-teams"><Signal className="mr-2 h-4 w-4" /> Aktif Ekipler & Takip</TabsTrigger>
                </TabsList>

                <TabsContent value="software" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {softwareProviders.map((item) => (
                            <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group flex flex-col">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md", item.color)}>
                                            {item.logo}
                                        </div>
                                        <Badge variant={item.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px]">
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold mt-3">{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1 space-y-3">
                                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                                    <div className="p-2 rounded-md bg-muted/50 border border-dashed border-primary/20">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.price}</p>
                                        <p className="text-[9px] text-green-600 font-medium">{item.discount}</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        disabled={connectingId === item.id}
                                        onClick={() => handleConnect(item.id, item.name)}
                                    >
                                        {connectingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (item.status === 'Bağlı' ? 'Yapılandır' : 'Hemen Bağla')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-blue-800 text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Güvenli Veri Akışı</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Saha ekibi yazılımlarınızı Hangel'e bağladığınızda, gönüllü listeleriniz ve görev atamalarınız otomatik olarak senkronize edilir. 
                                Saha ekiplerinin güvenliği için konum verileri 256-bit şifreleme ile korunmaktadır.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="active-teams" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTeams.map((team) => (
                            <Card key={team.id} className="hover:border-primary transition-all group">
                                <CardHeader className="p-4 border-b">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-bold">{team.name}</CardTitle>
                                        <Badge className={cn(
                                            "text-[9px] uppercase",
                                            team.status === 'Görevde' ? "bg-red-100 text-red-700" : 
                                            team.status === 'Hazır' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                        )}>
                                            {team.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="space-y-1 text-xs">
                                        <p className="text-muted-foreground">Ekip Lideri: <span className="text-foreground font-bold">{team.leader}</span></p>
                                        <p className="text-muted-foreground">Mevcut Konum: <span className="text-foreground font-bold">{team.location}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2 border-t">
                                        <Users className="h-3 w-3" /> {team.members} Personel
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => toast({title: "Telsiz Bağlantısı", description: `${team.name} sesli kanalı açılıyor...`})}><Radio className="h-3 w-3 mr-1" /> Telsiz</Button>
                                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => toast({title: "Ekip Takibi", description: `${team.leader} konum verisi güncellendi.`})}><Navigation className="h-3 w-3 mr-1" /> İzle</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-slate-900 text-white border-none shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-primary"><Radio className="h-5 w-5 animate-pulse"/> Operasyon Merkezi (Canlı)</CardTitle>
                            <CardDescription className="text-slate-400">Tüm saha ekiplerinin anlık durumu ve görev atamaları.</CardDescription>
                        </CardHeader>
                        <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                <MapPin className="h-16 w-16 text-primary relative z-10" />
                            </div>
                            <div>
                                <p className="text-xl font-black uppercase tracking-tighter">CANLI TAKİP MODÜLÜ</p>
                                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Ekiplerinizin mobil uygulama üzerindeki konumlarını ve görev ilerlemelerini buradan izleyebilirsiniz.</p>
                            </div>
                            <Button 
                                size="lg" 
                                className="bg-primary hover:bg-primary/90 text-white font-bold px-12"
                                onClick={handleOpenMap}
                                disabled={isMapLoading}
                            >
                                {isMapLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Yükleniyor</> : 'Haritayı Tam Ekran Aç'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
