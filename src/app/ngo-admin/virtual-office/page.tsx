
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, MapPin, Coffee, Users, Calendar, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const providers = [
    { id: 'workinton', name: 'Workinton', location: '21 Lokasyon', color: 'bg-[#E30613]', status: 'Anlaşmalı', price: '450 ₺ / ay', discount: '%40 STK İndirimi' },
    { id: 'kolektif', name: 'Kolektif House', location: '12 Lokasyon', color: 'bg-[#1A1A1A]', status: 'Anlaşmalı', price: 'Ücretsiz (Kota Dahil)', discount: 'Partner STK Avantajı' },
    { id: 'eoffice', name: 'eOfis', location: '35 Lokasyon', color: 'bg-[#0054A6]', status: 'Bağlanabilir', price: '300 ₺ / ay', discount: '%50 İndirim' },
];

export default function VirtualOfficePage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Sanal ve Fiziki Ofis Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Resmi adres ve ortak çalışma alanlarınızı yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group overflow-hidden">
                        <div className={cn("h-2 w-full", item.color)} />
                        <CardContent className="p-4 flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-base">{item.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                            </div>
                            <div className="py-2 border-y border-dashed">
                                <p className="text-sm font-bold text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">{item.discount}</p>
                            </div>
                            <div className="flex gap-2 text-muted-foreground">
                                <Coffee className="h-4 w-4" title="Sınırsız İkram" />
                                <Users className="h-4 w-4" title="Toplantı Odası" />
                                <Calendar className="h-4 w-4" title="7/24 Erişim" />
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Randevu Talebi", description: "İndirimli kullanım için onay kodu üretildi."})}>Alan Rezerve Et</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Resmi Adres & Sekreterlik</CardTitle>
                    <CardDescription>STK'nızın yasal tebligat adresi olarak sanal ofis kullanımı.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-xl bg-muted/20 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm">Mevcut Adresiniz:</p>
                            <p className="text-xs text-muted-foreground">Levent, Büyükdere Cad. No: 199 (Kolektif House)</p>
                        </div>
                        <Button variant="ghost" size="sm">Adresi Değiştir</Button>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-800">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <p className="text-xs">Sanal ofis sözleşmeniz hangel üzerinden otomatik yenilenmek üzere kurgulanmıştır.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
