'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PhoneCall, Headphones, Settings2, KeyRound, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const providers = [
    { id: 'netgsm', name: 'Netgsm Santral', logo: 'N', color: 'bg-blue-600', status: 'Bağlı', price: '45 ₺ / ay', discount: '%30 İndirim' },
    { id: 'bulutsantral', name: 'Bulut Santral', logo: 'B', color: 'bg-orange-500', status: 'Bağlanabilir', price: '60 ₺ / ay', discount: 'İlk 3 Ay Ücretsiz' },
    { id: 'vodafone', name: 'Vodafone Bulut', logo: 'V', color: 'bg-[#E60000]', status: 'Bağlanabilir', price: 'Özel Teklif', discount: 'STK Tarifesi' },
];

export default function VirtualPbxPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveSantral = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({ title: "Santral Aktif Edildi", description: "Gelen çağrılar artık belirtilen numaraya yönlendirilecektir." });
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
                    <h1 className="text-2xl font-bold font-headline">Sanal Santral Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Kurumsal telefon ve çağrı merkezi altyapınızı yönetin.</p>
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
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Yapılandırma", description: `${item.name} yönetim arayüzü yükleniyor.`})}>Yapılandır</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/> Hızlı Kurulum</CardTitle>
                    <CardDescription>Sanal santral üzerinden gelen çağrıları doğrudan gönüllü temsilcilerinize yönlendirin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Santral Ana Numarası</Label>
                        <Input placeholder="0850 XXX XX XX" />
                    </div>
                    <div className="p-4 border rounded-xl bg-green-50 text-green-800 text-xs flex items-center gap-3">
                        <Headphones className="h-5 w-5 shrink-0" />
                        <p>Santraliniz Hangel CRM ile entegre olduğunda, arayan bağışçının tüm geçmişi bilgisayar ekranınızda anlık olarak açılır.</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                    <Button onClick={handleSaveSantral} disabled={isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor</> : 'Kaydet ve Aktif Et'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}