'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    PlusCircle, Bell, Inbox, Search, Droplet, HeartHandshake,
    DollarSign, Newspaper, ShieldCheck, Loader2, ExternalLink,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotifItem {
    id: string;
    type?: string;
    title?: string;
    body?: string;
    message?: string;
    read?: boolean;
    createdAt?: { toDate?: () => Date; seconds?: number } | string | null;
    data?: { link?: string; href?: string };
}

const TYPE_ICON: Record<string, React.ElementType> = {
    'emergency-blood': Droplet,
    'emergency-blood-contact': Droplet,
    'emergency-confirmation': Droplet,
    'contract-update': ShieldCheck,
    donation: DollarSign,
    volunteer: HeartHandshake,
    post: Newspaper,
};

function relTime(createdAt: NotifItem['createdAt']): string {
    try {
        const d = typeof createdAt === 'object' && createdAt && 'toDate' in createdAt && typeof createdAt.toDate === 'function'
            ? createdAt.toDate()
            : typeof createdAt === 'object' && createdAt && typeof createdAt.seconds === 'number'
                ? new Date(createdAt.seconds * 1000)
                : typeof createdAt === 'string' ? new Date(createdAt) : null;
        if (!d || isNaN(d.getTime())) return '';
        return formatDistanceToNow(d, { addSuffix: true, locale: tr });
    } catch { return ''; }
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

export default function NgoNotificationsPage() {
    const router = useRouter();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const [searchTerm, setSearchTerm] = useState('');

    // Bildirim Merkezi: AKTİF KURUMA + yöneticiye düşen bildirimler.
    // userId in [entityId, adminUid] → kuruma ait bildirimler (kullanıcıda olduğu
    // gibi) + yöneticinin kişisel bildirimleri birlikte. orderBy yok → composite
    // index gerekmesin; client-side sıralanır.
    const { id: entityId } = useActiveEntity();
    const recipientIds = useMemo(
        () => Array.from(new Set([authUser?.uid, entityId].filter(Boolean))) as string[],
        [authUser?.uid, entityId],
    );
    const notifQuery = useMemoFirebase(
        () => (db && recipientIds.length > 0 ? query(collection(db, COLLECTIONS.notifications), where('userId', 'in', recipientIds)) : null),
        [db, recipientIds],
    );
    const { data: notifs, isLoading } = useCollection<NotifItem>(notifQuery);

    const sorted = useMemo(() => {
        let list = [...(notifs || [])];
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.body || n.message || '').toLowerCase().includes(q));
        }
        return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    }, [notifs, searchTerm]);

    const unread = sorted.filter(n => !n.read);

    const markRead = async (id: string) => {
        try { await updateDoc(doc(db, COLLECTIONS.notifications, id), { read: true, readAt: new Date().toISOString() }); } catch { /* sessiz */ }
    };

    const markAllRead = async () => {
        const batch = writeBatch(db);
        unread.slice(0, 400).forEach(n => batch.update(doc(db, COLLECTIONS.notifications, n.id), { read: true, readAt: new Date().toISOString() }));
        try { await batch.commit(); } catch { /* sessiz */ }
    };

    const open = (n: NotifItem) => {
        if (!n.read) markRead(n.id);
        const link = n.data?.link || n.data?.href;
        if (link) router.push(link);
    };

    const renderRow = (n: NotifItem) => {
        const Icon = (n.type && TYPE_ICON[n.type]) || Bell;
        return (
            <div key={n.id} className={`p-4 bg-background border rounded-xl flex items-start gap-4 transition-all hover:border-primary/30 group ${n.read ? 'opacity-70' : 'border-l-4 border-l-primary shadow-sm'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${n.read ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => open(n)}>
                    <p className="font-bold text-sm text-foreground">{n.title || 'Bildirim'}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{n.body || n.message || ''}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{relTime(n.createdAt)}</p>
                        {(n.data?.link || n.data?.href) && <span className="text-[10px] text-primary inline-flex items-center gap-0.5">Aç <ExternalLink className="h-3 w-3" /></span>}
                    </div>
                </div>
                {!n.read && (
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => markRead(n.id)}>
                        Okundu
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Bildirim Merkezi</h1>
                    <p className="text-muted-foreground text-sm mt-1">Kuruluşunuza düşen bildirimler — telefon ve bilgisayarınıza da anlık iletilir.</p>
                </div>
                <div className="flex items-center gap-2">
                    {unread.length > 0 && <Button variant="outline" onClick={markAllRead}>Tümünü Okundu Say</Button>}
                    <Button asChild className="shadow-lg hover:shadow-primary/20 transition-all">
                        <Link href="/ngo-admin/notifications/new"><PlusCircle className="mr-2 h-4 w-4" /> Yeni Mesaj Yaz</Link>
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Bildirimlerde ara..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-md h-12 items-center bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Inbox className="mr-2 h-4 w-4" /> Tümü {unread.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full">{unread.length}</span>}
                            </TabsTrigger>
                            <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Bell className="mr-2 h-4 w-4" /> Okunmamış
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-6 space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                            ) : sorted.length === 0 ? (
                                <div className="text-center py-24 bg-background rounded-2xl border border-dashed border-muted-foreground/20">
                                    <Inbox className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">Henüz bildiriminiz yok.</p>
                                </div>
                            ) : sorted.map(renderRow)}
                        </TabsContent>

                        <TabsContent value="unread" className="mt-6 space-y-3">
                            {unread.length === 0 ? (
                                <div className="text-center py-24 bg-background rounded-2xl border border-dashed border-muted-foreground/20">
                                    <Inbox className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">Yeni bir bildiriminiz bulunmuyor.</p>
                                </div>
                            ) : unread.map(renderRow)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
