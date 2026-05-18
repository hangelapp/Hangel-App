
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const providers = [
    { id: 'iyzico', name: 'iyzico', logo: 'i', color: 'bg-[#14294B]', status: 'Bağlı', price: '%1.2 Komisyon', discount: 'STK Özel Oran' },
    { id: 'paytr', name: 'PayTR', logo: 'P', color: 'bg-[#00A8FF]', status: 'Bağlanabilir', price: '%0.99 Komisyon', discount: 'Ertesi Gün Ödeme' },
    { id: 'stripe', name: 'Stripe', logo: 'S', color: 'bg-[#635BFF]', status: 'Bağlanabilir', price: '%2.9 + $0.30', discount: 'Global Bağış' },
];

export default function PaymentSystemsPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Pos & Ödeme Sistemleri</h1>
                    <p className="text-muted-foreground text-sm">Online bağış ve ödeme altyapınızı yönetin.</p>
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
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Başvuru Yapılıyor"})}>Sanal POS Bağla</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> Sanal POS Bilgileri</CardTitle>
                    <CardDescription>Ödeme kuruluşundan aldığınız API anahtarlarını buraya girin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Merchant ID</Label>
                        <Input placeholder="Mağaza ID girin" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input placeholder="API Anahtarınız" />
                        </div>
                        <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                    <Button onClick={() => toast({title: "POS Doğrulandı"})}>Test Et ve Kaydet</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
