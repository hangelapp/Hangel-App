'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Loader2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Süper-admine düşen bildirimler `notifications` koleksiyonuna her admin'in KENDİ
// uid'i ile yazılır (bkz. super-admin/notifications). Bu sayfa aynı pattern'i
// kullanır: where('userId','==',authUser.uid). orderBy YOK → composite index
// gerekmesin; client-side sıralanır.

interface NotifItem {
    id: string;
    type?: string;
    title?: string;
    body?: string;
    message?: string;
    read?: boolean;
    createdAt?: { toDate?: () => Date; seconds?: number } | string | null;
    link?: string;
    data?: { link?: string; href?: string };
}

function toMillis(v: NotifItem['createdAt']): number {
    if (!v) return 0;
    if (typeof v === 'object') {
        if ('toDate' in v && typeof v.toDate === 'function') return v.toDate().getTime();
        if (typeof v.seconds === 'number') return v.seconds * 1000;
    }
    if (typeof v === 'string') { const t = new Date(v).getTime(); return isNaN(t) ? 0 : t; }
    return 0;
}

function relTime(createdAt: NotifItem['createdAt']): string {
    const ms = toMillis(createdAt);
    if (!ms) return '';
    try {
        return formatDistanceToNow(new Date(ms), { addSuffix: true, locale: tr });
    } catch {
        return '';
    }
}

export default function InboxPage() {
    const db = useFirestore();
    const { user: authUser } = useUser();
    const router = useRouter();

    const notifQuery = useMemoFirebase(
        () => (db && authUser?.uid ? query(collection(db, COLLECTIONS.notifications), where('userId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: notifs, isLoading } = useCollection<NotifItem>(notifQuery);

    const sorted = useMemo(
        () => [...(notifs || [])].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
        [notifs],
    );
    const unread = useMemo(() => sorted.filter(n => !n.read), [sorted]);
    const unreadCount = unread.length;

    const handleMarkAsRead = async (id: string) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, COLLECTIONS.notifications, id), { read: true, readAt: new Date().toISOString() });
        } catch {
            /* sessiz */
        }
    };

    const openLink = (n: NotifItem) => {
        const link = n.link || n.data?.link || n.data?.href;
        if (link) router.push(link);
    };

    const renderRow = (n: NotifItem, dim: boolean) => (
        <div key={n.id} className={`p-4 border rounded-lg flex items-start gap-4 ${dim && n.read ? 'opacity-60' : ''}`}>
            <Bell className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1 cursor-pointer" onClick={() => openLink(n)}>
                <p className="font-semibold">{n.title || 'Bildirim'}</p>
                <p className="text-sm text-muted-foreground">{n.body || n.message || ''}</p>
                <p className="text-xs text-muted-foreground mt-1">{relTime(n.createdAt)}</p>
            </div>
            {!n.read && <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(n.id)}>Okundu Olarak İşaretle</Button>}
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Gelen Kutusu ({unreadCount})</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Bildirimler</CardTitle>
                    <CardDescription>Platform ile ilgili önemli güncellemeler ve yapılması gereken işlemler.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <Tabs defaultValue="all">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="all">Tümü</TabsTrigger>
                                <TabsTrigger value="unread">Okunmamış ({unreadCount})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all" className="mt-4 space-y-4">
                                {sorted.length === 0 ? (
                                    <p className="text-center p-8 text-muted-foreground">Henüz bildirim bulunmuyor.</p>
                                ) : sorted.map(n => renderRow(n, true))}
                            </TabsContent>
                            <TabsContent value="unread" className="mt-4 space-y-4">
                                {unread.map(n => renderRow(n, false))}
                                {unreadCount === 0 && <p className="text-center p-8 text-muted-foreground">Okunmamış bildirim bulunmuyor.</p>}
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
