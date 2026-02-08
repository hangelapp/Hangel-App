'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Plus, Users, MapPin, Landmark, Store, Building2, Info, CheckCircle2, ChevronRight, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const organizations = [
    {
        id: 'org1',
        name: 'Kadıköy Belediyesi',
        type: 'Belediye',
        logo: 'https://logo.clearbit.com/kadikoy.bel.tr',
        venues: [
            { id: 'v1', name: 'Barış Manço Kültür Merkezi', type: 'Konferans Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 250 },
            { id: 'v4', name: 'Kozyatağı Kültür Merkezi', type: 'Tiyatro Salonu', fee: 'Ücretsiz', icon: Landmark, capacity: 400 },
            { id: 'v5', name: 'Caddebostan Kültür Merkezi', type: 'Çok Amaçlı Salon', fee: 'İndirimli', icon: Landmark, capacity: 600 },
        ]
    },
    {
        id: 'org2',
        name: 'hangel A.Ş.',
        type: 'İş Ortağı',
        logo: '',
        venues: [
            { id: 'v2', name: 'Levent Ortak Çalışma Alanı', type: 'Toplantı Odası', fee: 'Ücretsiz', icon: Building2, capacity: 20 },
            { id: 'v6', name: 'Moda İmece Ofisi', type: 'Workshop Alanı', fee: 'Ücretsiz', icon: Building2, capacity: 15 },
        ]
    },
    {
        id: 'org3',
        name: 'X Teknoloji Şirketi',
        type: 'Kurumsal Destekçi',
        logo: 'https://logo.clearbit.com/google.com',
        venues: [
            { id: 'v3', name: 'Maslak Oditoryum', type: 'Seminer Salonu', fee: 'İndirimli', icon: Store, capacity: 150 },
        ]
    },
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
                        <p className="text-muted-foreground text-sm">Destekçi kuruluşların mekanlarını keşfedin ve rezerve edin.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="venues">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="venues"><Landmark className="mr-2 h-4 w-4" /> Mekan Keşfet</TabsTrigger>
                    <TabsTrigger value="my-events"><Calendar className="mr-2 h-4 w-4" /> Etkinliklerim</TabsTrigger>
                    <TabsTrigger value="booking"><CheckCircle2 className="mr-2 h-4 w-4" /> Rezervasyonlarım</TabsTrigger>
                </TabsList>

                <TabsContent value="venues" className="mt-6 space-y-8">
                    {organizations.map((org) => (
                        <Card key={org.id} className="overflow-hidden border-2 shadow-sm">
                            <CardHeader className="bg-muted/30 border-b p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={org.logo} />
                                            <AvatarFallback><Building className="h-6 w-6" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{org.name}</CardTitle>
                                            <CardDescription className="text-xs font-bold text-primary uppercase tracking-widest">{org.type}</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary font-bold">Tümünü Gör <ChevronRight className="ml-1 h-4 w-4"/></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 bg-background">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {org.venues.map((venue) => (
                                        <Card key={venue.id} className="hover:border-primary transition-all hover:shadow-md cursor-pointer group">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        <venue.icon className="h-5 w-5" />
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] font-bold",
                                                        venue.fee === 'Ücretsiz' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        {venue.fee}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{venue.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">{venue.type}</p>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
                                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {venue.capacity} Kişi</span>
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> İstanbul</span>
                                                </div>
                                                <Button size="sm" className="w-full text-xs h-8" onClick={() => toast({title: "Rezervasyon Talebi", description: `${org.name} yetkilisine talep iletildi.`})}>Rezerve Et</Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-primary">
                                <Info className="h-5 w-5"/> Nasıl Çalışır?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Hangel iş ortağı olan belediyeler ve şirketler, atıl durumdaki veya destek amaçlı ayırdıkları mekanları STK'ların kullanımına sunar. 
                                Kurum pencerelerinden seçeceğiniz mekanlar için yapacağınız talepler, kurum yetkilisi tarafından onaylandığında rezervasyonunuz kesinleşir.
                            </p>
                        </CardContent>
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
                    <Card><CardContent className="p-12 text-center text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>Aktif bir mekan rezervasyonunuz bulunmuyor.</p></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
