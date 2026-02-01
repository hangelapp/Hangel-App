
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Users, Navigation, Radio, ShieldCheck, ClipboardCheck, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const teams = [
    { id: 't1', name: 'İstanbul Arama Kurtarma', leader: 'Can Demir', members: 12, status: 'Görevde', location: 'Kadıköy' },
    { id: 't2', name: 'Ege Bölgesi Yardım Dağıtım', leader: 'Ayşe Yılmaz', members: 8, status: 'Hazır', location: 'İzmir' },
    { id: 't3', name: 'Güneydoğu Lojistik', leader: 'Mehmet Öztürk', members: 15, status: 'Dinlenmede', location: 'Hatay' },
];

export default function FieldTeamManagementPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Saha Ekip Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Saha operasyonlarını ve ekiplerinizi gerçek zamanlı yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
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
                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => toast({title: "Telsiz Bağlantısı", description: "Sesli kanal açılıyor..."})}><Radio className="h-3 w-3 mr-1" /> Telsiz</Button>
                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => toast({title: "Ekip Takibi", description: "Canlı harita modülü yükleniyor..."})}><Navigation className="h-3 w-3 mr-1" /> İzle</Button>
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
                        <p className="text-xl font-black">CANLI TAKİP MODÜLÜ</p>
                        <p className="text-xs text-slate-400 mt-2 max-w-xs">Ekiplerinizin mobil uygulama üzerindeki konumlarını ve görev ilerlemelerini buradan izleyebilirsiniz.</p>
                    </div>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold">Haritayı Tam Ekran Aç</Button>
                </CardContent>
            </Card>
        </div>
    );
}
