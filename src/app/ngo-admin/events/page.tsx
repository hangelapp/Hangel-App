'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Plus, Users, MapPin, Clock, Edit, Trash2, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

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
                        <h1 className="text-2xl font-bold font-headline">Etkinlik Yönetimi</h1>
                        <p className="text-muted-foreground text-sm">Kurumsal etkinliklerinizi planlayın ve katılımcıları yönetin.</p>
                    </div>
                </div>
                <Button onClick={() => toast({title: "Yeni Etkinlik", description: "Etkinlik oluşturma sayfası açılıyor..."})}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Etkinlik Oluştur
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yaklaşan Etkinlikler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { title: 'Yıllık Dayanışma Galası', date: '12 Ağustos 2024', location: 'Hilton İstanbul', participants: '120/200', status: 'Onaylandı' },
                                { title: 'Online Gönüllü Tanışma Toplantısı', date: '5 Ağustos 2024', location: 'Zoom', participants: '45/100', status: 'Taslak' }
                            ].map((event, i) => (
                                <div key={i} className="p-4 border rounded-xl hover:bg-accent/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-lg">{event.title}</h4>
                                        <Badge variant={event.status === 'Onaylandı' ? 'default' : 'secondary'}>{event.status}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {event.date}</div>
                                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</div>
                                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {event.participants}</div>
                                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> 19:00 - 22:00</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1"><Users className="mr-2 h-4 w-4" /> Katılımcı Listesi</Button>
                                        <Button variant="outline" size="sm" className="flex-1"><Edit className="mr-2 h-4 w-4" /> Düzenle</Button>
                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hızlı İstatistikler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Aktif Etkinlikler:</span>
                                <span className="font-bold">3</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Toplam Katılımcı:</span>
                                <span className="font-bold">450</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Bilet Geliri:</span>
                                <span className="font-bold">12,400 ₺</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2"><Ticket className="h-4 w-4" /> Biletleme Sistemi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Etkinlikleriniz için ücretli veya ücretsiz biletleme yapabilir, QR kodlu giriş kontrolü sağlayabilirsiniz.
                            </p>
                            <Button variant="link" className="p-0 h-auto text-xs mt-2">Sistemi Yapılandır</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
