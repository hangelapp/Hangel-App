'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Plus, Users, MapPin, Landmark, Store, Building2, Info, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const venues = [
    { id: 'v1', owner: 'Kadıköy Belediyesi', name: 'Barış Manço Kültür Merkezi', type: 'Konferans Salonu', fee: 'Ücretsiz', icon: Landmark },
    { id: 'v2', owner: 'Hangel Hub', name: 'Levent Ortak Çalışma Alanı', type: 'Toplantı Odası', fee: 'Ücretsiz', icon: Building2 },
    { id: 'v3', owner: 'X Şirketi', name: 'Maslak Oditoryum', type: 'Seminer Salonu', fee: 'İndirimli', icon: Store },
];

export default function EventManagementPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">Etkinlik & Mekan Yönetimi</h1>
                        <p className="text-muted-foreground text-sm">Etkinliklerinizi planlayın ve destekçi mekanları rezerve edin.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="venues">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="venues"><Landmark className="mr-2 h-4 w-4" /> Mekan Keşfet</TabsTrigger>
                    <TabsTrigger value="my-events"><Calendar className="mr-2 h-4 w-4" /> Etkinliklerim</TabsTrigger>
                    <TabsTrigger value="booking"><CheckCircle2 className="mr-2 h-4 w-4" /> Rezervasyonlarım</TabsTrigger>
                </TabsList>

                <TabsContent value="venues" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {venues.map((venue) => (
                            <Card key={venue.id} className="hover:border-primary transition-colors flex flex-col">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-muted"><venue.icon className="h-5 w-5 text-primary" /></div>
                                        <CardTitle className="text-sm font-bold truncate">{venue.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{venue.owner}</p>
                                    <p className="text-xs mt-1">{venue.type}</p>
                                    <Badge variant="outline" className={cn("mt-2 text-[10px]", venue.fee === 'Ücretsiz' ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700")}>
                                        {venue.fee}
                                    </Badge>
                                </CardContent>
                                <CardFooter className="p-4 border-t bg-muted/20">
                                    <Button size="sm" className="w-full" onClick={() => toast({title: "Rezervasyon Talebi", description: "Mekan yetkilisine talep iletildi."})}>Tarih Al / Rezerve Et</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader><CardTitle className="text-base flex items-center gap-2 text-primary"><Info className="h-5 w-5"/> Nasıl Çalışır?</CardTitle></CardHeader>
                        <CardContent><p className="text-xs text-muted-foreground leading-relaxed">Hangel iş ortağı olan belediyeler ve şirketler, boş kapasitelerini STK'ların kullanımına açar. Buradan yapacağınız talepler ilgili kurumun onayına sunulur ve onaylandığında takviminize otomatik olarak işlenir.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="my-events" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Yaklaşan Etkinlikler</CardTitle>
                            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Yeni Etkinlik</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { title: 'Dayanışma Galası', date: '12.08.2024', location: 'Hilton Otel' }
                            ].map((event, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between group hover:bg-accent/50 transition-colors">
                                    <div className="space-y-1">
                                        <h4 className="font-bold">{event.title}</h4>
                                        <p className="text-xs text-muted-foreground">{event.date} • {event.location}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Düzenle</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="booking" className="mt-6">
                    <Card><CardContent className="p-12 text-center text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Aktif bir rezervasyonunuz bulunmuyor.</p></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
