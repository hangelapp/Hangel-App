
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Icons from 'lucide-react';
import React, { useState } from 'react';

const notifications = [
    { id: 1, icon: 'FileText', title: 'Yeni STK Başvurusu', description: 'Doğa Koruma Derneği platforma katılmak için başvurdu.', time: '15 dakika önce', read: false },
    { id: 2, icon: 'Shield', title: 'Şeffaflık Belgesi Onay Bekliyor', description: 'TEMA Vakfı, "2023 Faaliyet Raporu" belgesini yükledi.', time: '1 saat önce', read: false },
    { id: 3, icon: 'UserCog', title: 'Kullanıcı Şikayeti', description: 'Bir kullanıcı, bir gönderi hakkında şikayette bulundu.', time: '3 saat önce', read: true },
    { id: 4, icon: 'Bot', title: 'Haftalık Analiz Raporu Hazır', description: 'Platformun haftalık performans raporunu görüntüleyebilirsiniz.', time: '1 gün önce', read: true },
];

export default function InboxPage() {
    const [data, setData] = useState(notifications);

    const handleMarkAsRead = (id: number) => {
        setData(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const unreadCount = data.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Gelen Kutusu ({unreadCount})</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Bildirimler</CardTitle>
                    <CardDescription>Platform ile ilgili önemli güncellemeler ve yapılması gereken işlemler.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                            <TabsTrigger value="unread">Okunmamış ({unreadCount})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4 space-y-4">
                            {data.map(notification => {
                                const Icon = Icons[notification.icon as keyof typeof Icons] || Icons.Bell;
                                return (
                                <div key={notification.id} className={`p-4 border rounded-lg flex items-start gap-4 ${notification.read ? 'opacity-60' : ''}`}>
                                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                    </div>
                                    {!notification.read && <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Okundu Olarak İşaretle</Button>}
                                </div>
                            )})}
                        </TabsContent>
                        <TabsContent value="unread" className="mt-4 space-y-4">
                            {data.filter(n => !n.read).map(notification => {
                                const Icon = Icons[notification.icon as keyof typeof Icons] || Icons.Bell;
                                return (
                                <div key={notification.id} className="p-4 border rounded-lg flex items-start gap-4">
                                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                         <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Okundu Olarak İşaretle</Button>
                                </div>
                            )})}
                             {unreadCount === 0 && <p className="text-center p-8 text-muted-foreground">Okunmamış bildirim bulunmuyor.</p>}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

