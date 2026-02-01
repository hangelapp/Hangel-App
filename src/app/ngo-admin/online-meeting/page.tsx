
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Video, Settings2, KeyRound, ShieldCheck, Globe, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const providers = [
    { id: 'zoom', name: 'Zoom', logo: 'Z', color: 'bg-[#2D8CFF]', status: 'Bağlı', price: 'Ücretsiz (NGO Plan)', discount: '%100 İndirim' },
    { id: 'meet', name: 'Google Meet', logo: 'M', color: 'bg-[#00AC47]', status: 'Bağlanabilir', price: '12 ₺ / ay', discount: '%80 İndirim' },
    { id: 'teams', name: 'MS Teams', logo: 'T', color: 'bg-[#6264A7]', status: 'Bağlanabilir', price: 'Ücretsiz (Office 365 NGO)', discount: '%100 İndirim' },
];

export default function OnlineMeetingPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Online Eğitim & Toplantı</h1>
                    <p className="text-muted-foreground text-sm">Uzaktan eğitim ve toplantı araçlarınızı yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", item.color)}>
                                {item.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <Badge variant={item.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {item.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-medium">{item.discount}</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Entegrasyon Penceresi Açılıyor"})}>Bağla</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> API & SDK Bilgileri</CardTitle>
                    <CardDescription>Toplantı aracınızdan aldığınız Client ID ve Secret bilgilerini girin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Client ID</Label>
                            <Input placeholder="Client ID girin" />
                        </div>
                        <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <p>Entegrasyon sonrası etkinliklerinizde "Toplantıya Katıl" butonu otomatik olarak görünecektir.</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                    <Button onClick={() => toast({title: "Ayarlar Kaydedildi"})}>Doğrula ve Kaydet</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
