'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Plus, Users, MapPin, Clock, Edit, Trash2, Ticket, Building2, Store, Landmark, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                        <p className="text-muted-foreground text-sm">Etkinliklerinizi planlayın ve destekçi mekanları keşfedin.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni Etkinlik"})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Etkinlik
                </Button>
            </div>

            <Tabs defaultValue="my-events">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="my-events"><Calendar className="mr-2 h-4 w-4" /> Etkinliklerim</TabsTrigger>
                    <TabsTrigger value="venues"><Landmark className="mr-2 h-4 w-4" /> Mekan Keşfet</TabsTrigger>
                </TabsList>

                <TabsContent value="my-events" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Yaklaşan Etkinlikler</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { title: 'Dayanışma Galası', date: '12 Ağustos 2024', location: 'Hilton Otel' }
                            ].map((event, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-bold">{event.title}</h4>
                                        <p className="text-xs text-muted-foreground">{event.date} • {event.location}</p>
                                    </div>
                                    <Button variant="outline" size="sm">Yönet</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="venues" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>STK Dostu Mekanlar & İmkanlar</CardTitle>
                            <CardDescription>Belediyeler ve kurumsal şirketlerin STK kullanımına açtığı alanlar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { owner: 'Kadıköy Belediyesi', name: 'Barış Manço Kültür Merkezi', type: 'Konferans Salonu', fee: 'Ücretsiz', icon: Landmark },
                                { owner: 'Hangel Hub', name: 'Levent Ortak Çalışma Alanı', type: 'Toplantı Odası', fee: 'Ücretsiz', icon: Building2 },
                                { owner: 'X Şirketi', name: 'Maslak Oditoryum', type: 'Seminer Salonu', fee: 'İndirimli', icon: Store }
                            ].map((venue, i) => (
                                <div key={i} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-muted"><venue.icon className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-bold text-sm">{venue.name}</h4>
                                            <p className="text-xs text-muted-foreground">{venue.owner} • {venue.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={cn(venue.fee === 'Ücretsiz' ? "bg-green-100 text-green-700" : "")}>{venue.fee}</Badge>
                                        <Button size="sm" onClick={() => toast({title: "Randevu Talebi", description: "Mekan sorumlusuna kullanım talebi iletildi."})}>Tarih Al</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
