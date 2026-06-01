

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// P2-4: closed icon set for notifications lookup — replaces `import * as Icons`.
import { Bell, Bot, FileText, Shield, UserCog } from 'lucide-react';
import React, { useState } from 'react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Bell,
    Bot,
    FileText,
    Shield,
    UserCog,
};
import { useRouter } from 'next/navigation';

const notifications = [
    { id: 1, icon: 'FileText', title: 'Yeni STK Başvurusu', description: 'Doğa Koruma Derneği platforma katılmak için başvurdu.', time: '15 dakika önce', read: false, link: '/super-admin/applications' },
    { id: 2, icon: 'Shield', title: 'Şeffaflık Belgesi Onay Bekliyor', description: 'TEMA Vakfı, "2023 Faaliyet Raporu" belgesini yükledi.', time: '1 saat önce', read: false, link: '/super-admin/transparency' },
    { id: 3, icon: 'UserCog', title: 'Kullanıcı Şikayeti', description: 'Bir kullanıcı, bir gönderi hakkında şikayette bulundu.', time: '3 saat önce', read: true, link: '/super-admin/posts' },
    { id: 4, icon: 'Bot', title: 'Haftalık Analiz Raporu Hazır', description: 'Platformun haftalık performans raporunu görüntüleyebilirsiniz.', time: '1 gün önce', read: true, link: '/super-admin/analytics' },
];

const _sentMessages = [
    { id: 101, recipient: 'Aktif Gönüllüler', subject: 'Haftalık Bilgilendirme', time: '1 gün önce', status: 'İletildi' },
    { id: 102, recipient: 'hangel Sistem Yöneticisi', subject: 'Belge Onayı Hakkında', time: '3 gün önce', status: 'Okundu' },
    { id: 103, recipient: 'Bağışçılarım', subject: 'Aylık Faaliyet Özeti', time: '5 gün önce', status: 'İletildi' },
];

export default function InboxPage() {
    const [data, setData] = useState(notifications);
    const router = useRouter();

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
                                const Icon = iconMap[notification.icon] || Bell;
                                return (
                                <div key={notification.id} className={`p-4 border rounded-lg flex items-start gap-4 ${notification.read ? 'opacity-60' : ''}`}>
                                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1 cursor-pointer" onClick={() => notification.link && router.push(notification.link)}>
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
                                const Icon = iconMap[notification.icon] || Bell;
                                return (
                                <div key={notification.id} className="p-4 border rounded-lg flex items-start gap-4">
                                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1 cursor-pointer" onClick={() => notification.link && router.push(notification.link)}>
                                        <p className="font-semibold">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                         <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Okundu Say</Button>
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
