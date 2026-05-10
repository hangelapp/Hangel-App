
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Icons from 'lucide-react';
import { PlusCircle, Send, Bell, Inbox, SendHorizontal, Search, Filter } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

const notifications = [
    { id: 1, icon: 'HeartHandshake', title: 'Yeni Gönüllü Başvurusu', description: 'Ayşe Yılmaz, "Afet Bölgesi Yardım Dağıtımı" ilanına başvurdu.', time: '20 dakika önce', read: false, link: '/ngo-admin/volunteer' },
    { id: 2, icon: 'DollarSign', title: 'Yeni Bağış Alındı', description: 'Doğa Dostu Giyim alışverişinden 12.75 ₺ bağış hesabınıza aktarıldı.', time: '2 saat önce', read: false, link: '/ngo-admin/donations' },
    { id: 3, icon: 'Newspaper', title: 'Gönderiniz Beğenildi', description: 'Bir kullanıcı "Fidan dikme etkinliğimiz" gönderinizi beğendi.', time: '5 saat önce', read: true, link: '/ngo-admin/posts' },
    { id: 4, icon: 'ShieldCheck', title: 'Şeffaflık Belgeniz Onaylandı', description: '"2023 Faaliyet Raporu" belgeniz admin tarafından onaylandı.', time: '1 gün önce', read: true, link: '/ngo-admin/transparency' },
];

const sentMessages = [
    { id: 101, recipient: 'Aktif Gönüllüler', subject: 'Haftalık Bilgilendirme', time: '1 gün önce', status: 'İletildi' },
    { id: 102, recipient: 'Hangel Sistem Yöneticisi', subject: 'Belge Onayı Hakkında', time: '3 gün önce', status: 'Okundu' },
    { id: 103, recipient: 'Bağışçılarım', subject: 'Aylık Faaliyet Özeti', time: '5 gün önce', status: 'İletildi' },
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
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Gelen Kutusu</h1>
                    <p className="text-muted-foreground text-sm mt-1">Kuruluşunuzla ilgili önemli güncellemeler ve topluluk etkileşimi.</p>
                </div>
                <Button asChild className="shadow-lg hover:shadow-primary/20 transition-all">
                    <Link href="/ngo-admin/notifications/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Yeni Mesaj Yaz
                    </Link>
                </Button>
            </div>
            
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Mesajlarda veya bildirimlerde ara..." className="pl-10" />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-12 items-center bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Inbox className="mr-2 h-4 w-4" /> Tümü {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full">{unreadCount}</span>}
                            </TabsTrigger>
                            <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Bell className="mr-2 h-4 w-4" /> Okunmamış
                            </TabsTrigger>
                            <TabsTrigger value="sent" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <SendHorizontal className="mr-2 h-4 w-4" /> Gönderilenler
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="mt-6 space-y-3">
                            {data.map(notification => {
                                const IconComp = (Icons[notification.icon as keyof typeof Icons] || Icons.Bell) as React.ElementType;
                                return (
                                <div key={notification.id} className={`p-4 bg-background border rounded-xl flex items-start gap-4 transition-all hover:border-primary/30 group ${notification.read ? 'opacity-70' : 'border-l-4 border-l-primary shadow-sm'}`}>
                                    <div className={`p-2 rounded-lg ${notification.read ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                                        <IconComp className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => notification.link && router.push(notification.link)}>
                                        <p className="font-bold text-sm text-foreground">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{notification.description}</p>
                                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">{notification.time}</p>
                                    </div>
                                    {!notification.read && (
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleMarkAsRead(notification.id)}>
                                            Okundu
                                        </Button>
                                    )}
                                </div>
                            )})}
                        </TabsContent>

                        <TabsContent value="unread" className="mt-6 space-y-3">
                            {data.filter(n => !n.read).map(notification => {
                                const IconComp = (Icons[notification.icon as keyof typeof Icons] || Icons.Bell) as React.ElementType;
                                return (
                                <div key={notification.id} className="p-4 bg-background border border-l-4 border-l-primary rounded-xl flex items-start gap-4 shadow-sm">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <IconComp className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => notification.link && router.push(notification.link)}>
                                        <p className="font-bold text-sm text-foreground">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{notification.description}</p>
                                         <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">{notification.time}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Okundu Say</Button>
                                </div>
                            )})}
                             {unreadCount === 0 && (
                                <div className="text-center py-24 bg-background rounded-2xl border border-dashed border-muted-foreground/20">
                                    <Inbox className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">Yeni bir bildiriminiz bulunmuyor.</p>
                                </div>
                             )}
                        </TabsContent>

                        <TabsContent value="sent" className="mt-6 space-y-3">
                            {sentMessages.map(message => (
                                <div key={message.id} className="p-4 bg-background border rounded-xl flex items-start gap-4 hover:border-primary/20 transition-all">
                                    <div className="p-2 bg-muted text-muted-foreground rounded-lg">
                                        <Send className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-sm text-foreground">{message.subject}</p>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${message.status === 'Okundu' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {message.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 font-medium">Alıcı: {message.recipient}</p>
                                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">{message.time}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">Detay</Button>
                                </div>
                            ))}
                            {sentMessages.length === 0 && (
                                <div className="text-center py-24 bg-background rounded-2xl border border-dashed border-muted-foreground/20">
                                    <SendHorizontal className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">Henüz bir mesaj göndermediniz.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
