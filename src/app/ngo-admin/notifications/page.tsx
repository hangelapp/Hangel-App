'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Icons from 'lucide-react';
import { PlusCircle, Send } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const notifications = [
    { id: 1, icon: 'HeartHandshake', title: 'Yeni Gönüllü Başvurusu', description: 'Ayşe Yılmaz, "Afet Bölgesi Yardım Dağıtımı" ilanına başvurdu.', time: '20 dakika önce', read: false, link: '/ngo-admin/volunteer' },
    { id: 2, icon: 'DollarSign', title: 'Yeni Bağış Alındı', description: 'Doğa Dostu Giyim alışverişinden 12.75 ₺ bağış hesabınıza aktarıldı.', time: '2 saat önce', read: false, link: '/ngo-admin/donations' },
    { id: 3, icon: 'Newspaper', title: 'Gönderiniz Beğenildi', description: 'Bir kullanıcı "Fidan dikme etkinliğimiz" gönderinizi beğendi.', time: '5 saat önce', read: true, link: '/ngo-admin/posts' },
    { id: 4, icon: 'ShieldCheck', title: 'Şeffaflık Belgeniz Onaylandı', description: '"2023 Faaliyet Raporu" belgeniz admin tarafından onaylandı.', time: '1 gün önce', read: true, link: '/ngo-admin/transparency' },
];

const sentMessages = [
    { id: 101, recipient: 'Aktif Gönüllüler', subject: 'Haftalık Bilgilendirme', time: '1 gün önce', status: 'İletildi' },
    { id: 102, recipient: 'Hangel Sistem Yöneticisi', subject: 'Belge Onayı Hakkında', time: '3 gün önce', status: 'Okundu' },
];

export default function NgoNotificationsPage() {
    const [data, setData] = useState(notifications);
    const router = useRouter();

    const handleMarkAsRead = (id: number) => {
        setData(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const unreadCount = data.filter(n => !n.read).length;

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gelen Kutusu ({unreadCount})</h1>
                    <p className="text-muted-foreground text-sm">Kuruluşunuzla ilgili önemli güncellemeler ve bildirimler.</p>
                </div>
                <Button asChild>
                    <Link href="/ngo-admin/notifications/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Yeni Mesaj
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Mesajlar ve Bildirimler</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                            <TabsTrigger value="unread">Okunmamış ({unreadCount})</TabsTrigger>
                            <TabsTrigger value="sent">Gönderilenler</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="mt-4 space-y-4">
                            {data.map(notification => {
                                const Icon = Icons[notification.icon as keyof typeof Icons] || Icons.Bell;
                                return (
                                <div key={notification.id} className={`p-4 border rounded-lg flex items-start gap-4 transition-colors hover:bg-accent/5 ${notification.read ? 'opacity-60' : ''}`}>
                                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1 cursor-pointer" onClick={() => notification.link && router.push(notification.link)}>
                                        <p className="font-semibold">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                    </div>
                                    {!notification.read && <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Okundu Say</Button>}
                                </div>
                            )})}
                        </TabsContent>

                        <TabsContent value="unread" className="mt-4 space-y-4">
                            {data.filter(n => !n.read).map(notification => {
                                const Icon = Icons[notification.icon as keyof typeof Icons] || Icons.Bell;
                                return (
                                <div key={notification.id} className="p-4 border rounded-lg flex items-start gap-4 transition-colors hover:bg-accent/5">
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

                        <TabsContent value="sent" className="mt-4 space-y-4">
                            {sentMessages.map(message => (
                                <div key={message.id} className="p-4 border rounded-lg flex items-start gap-4 transition-colors hover:bg-accent/5">
                                    <Send className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">{message.subject}</p>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${message.status === 'Okundu' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {message.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Alıcı: {message.recipient}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Görüntüle</Button>
                                </div>
                            ))}
                            {sentMessages.length === 0 && <p className="text-center p-8 text-muted-foreground">Henüz bir mesaj göndermediniz.</p>}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
