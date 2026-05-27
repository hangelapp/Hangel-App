'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Inbox, SendHorizontal, MessageSquare, Building, School, Shield, ArrowLeft, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { addDoc, collection, doc, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { EmptyState } from '@/components/shared/empty-state';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

const senderTypeIcons: Record<string, React.ReactNode> = {
    ngo: <Building className="h-3 w-3" />,
    club: <School className="h-3 w-3" />,
    admin: <Shield className="h-3 w-3" />,
    user: <Inbox className="h-3 w-3" />
};

interface UserRecord {
    id: string; displayName?: string; fullName?: string; name?: string;
    email?: string; phoneNumber?: string; photoURL?: string; avatarUrl?: string;
    bio?: string; personalInfo?: { phone?: string; bio?: string };
    role?: 'super-admin' | 'ngo-admin' | 'brand-admin' | 'club-admin' | 'admin' | 'user';
    recipientKind?: 'ngo' | 'brand' | 'club';
}

// Spec: Kullanıcı yalnızca ilişkili olduğu kurumlara mesaj yazabilir:
//   • bağışçısı olduğu STK (supportedNgos)
//   • gönüllüsü olduğu STK (volunteerNgos)
//   • takip ettiği marka (followedBrands)
//   • üye olduğu kulüp (joinedClubs)
//   • gönüllülük başvurusu KABUL edilmiş STK (applications.status='Onaylandı'
//     ve volunteering.dates.eventEnd >= bugün)
// Kullanıcı-kullanıcı DM kapalı. Hangel destek için /contact rotası var.

interface EntityRecord {
    id: string; name?: string; shortName?: string;
    files?: { logo?: string }; logoUrl?: string;
    ngoId?: string;
    dates?: { eventEnd?: string };
    adminUserId?: string;
}

export default function MessagesPage() {
    const { t } = useTranslation();
    const [_activeTab, setActiveTab] = useState('inbox');
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { user: authUser } = useUser();
    const db = useFirestore();

    const messagesQuery = useMemoFirebase(
        () => authUser ? query(collection(db, COLLECTIONS.messages), where('recipientId', '==', authUser.uid)) : null,
        [db, authUser?.uid]
    );
    const { data: messages, isLoading } = useCollection(messagesQuery);

    // Gönderilen mesajlar — senderId == kullanıcı uid (entity adına yanıt da
    // dahildir; o durumda sender.name entity adı olur, senderId yine admin uid)
    const sentMessagesQuery = useMemoFirebase(
        () => authUser ? query(collection(db, COLLECTIONS.messages), where('senderId', '==', authUser.uid)) : null,
        [db, authUser?.uid]
    );
    const { data: sentMessages, isLoading: sentLoading } = useCollection(sentMessagesQuery);

    // Yeni Mesaj Dialog state
    const [composeOpen, setComposeOpen] = useState(false);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<UserRecord | null>(null);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    // Kullanıcının ilişki alanlarını oku (supported/volunteer ngos, followed
    // brands, joined clubs). Compose dialog açıldığında lazy yüklenir.
    const userRelDocRef = useMemoFirebase(
        () => (composeOpen && authUser?.uid) ? doc(db, COLLECTIONS.users, authUser.uid) : null,
        [db, composeOpen, authUser?.uid]
    );
    const { data: userRel } = useDoc<{
        supportedNgos?: string[];
        volunteerNgos?: string[];
        followedBrands?: string[];
        joinedClubs?: string[];
    }>(userRelDocRef);

    // Kabul edilmiş gönüllülük başvuruları (entityId = volunteering opportunity ID)
    const acceptedAppsRef = useMemoFirebase(
        () => (composeOpen && authUser?.uid) ? query(
            collection(db, COLLECTIONS.applications),
            where('userId', '==', authUser.uid),
            where('status', '==', 'Onaylandı'),
            where('type', '==', 'Gönüllülük'),
        ) : null,
        [db, composeOpen, authUser?.uid]
    );
    const { data: acceptedApps } = useCollection<{ entityId?: string }>(acceptedAppsRef);

    // Volunteering opportunities — kabul edilmiş başvurunun ngoId'sini ve
    // eventEnd tarihini çıkarmak için. Compose açıldığında tüm aktif ilanları
    // çekiyoruz (genellikle <500 ilan; client-side filtreleme yeterli).
    const oppsRef = useMemoFirebase(() => composeOpen ? collection(db, COLLECTIONS.volunteering) : null, [db, composeOpen]);
    const { data: allOpps } = useCollection<EntityRecord>(oppsRef);

    const ngosRef = useMemoFirebase(() => composeOpen ? collection(db, COLLECTIONS.ngos) : null, [db, composeOpen]);
    const brandsRef = useMemoFirebase(() => composeOpen ? collection(db, COLLECTIONS.brands) : null, [db, composeOpen]);
    const clubsRef = useMemoFirebase(() => composeOpen ? collection(db, COLLECTIONS.clubs) : null, [db, composeOpen]);
    const { data: allNgos } = useCollection<EntityRecord>(ngosRef);
    const { data: allBrands } = useCollection<EntityRecord>(brandsRef);
    const { data: allClubs } = useCollection<EntityRecord>(clubsRef);

    // Kabul edilmiş başvurudan gelen STK'lar (eventEnd > bugün ise)
    const acceptedActiveNgoIds = useMemo<Set<string>>(() => {
        if (!acceptedApps || !allOpps) return new Set();
        const today = new Date().toISOString().slice(0, 10);
        const appOppIds = new Set((acceptedApps || []).map(a => a.entityId).filter((x): x is string => !!x));
        const ngoIds = new Set<string>();
        for (const opp of allOpps) {
            if (!appOppIds.has(opp.id)) continue;
            if (!opp.ngoId) continue;
            if (opp.dates?.eventEnd && opp.dates.eventEnd < today) continue;
            ngoIds.add(opp.ngoId);
        }
        return ngoIds;
    }, [acceptedApps, allOpps]);

    const allowedNgoIds = useMemo<Set<string>>(() => {
        const ids = new Set<string>();
        (userRel?.supportedNgos || []).forEach(id => ids.add(id));
        (userRel?.volunteerNgos || []).forEach(id => ids.add(id));
        acceptedActiveNgoIds.forEach(id => ids.add(id));
        return ids;
    }, [userRel, acceptedActiveNgoIds]);

    const allowedBrandIds = useMemo<Set<string>>(() => new Set(userRel?.followedBrands || []), [userRel]);
    const allowedClubIds = useMemo<Set<string>>(() => new Set(userRel?.joinedClubs || []), [userRel]);

    interface MessageItem {
        id?: string;
        // Legacy: sender may be a string (old test data) OR an object
        sender?: string | { id?: string; name?: string; avatarUrl?: string | null };
        senderId?: string;
        senderAvatarUrl?: string;
        recipient?: { id?: string; name?: string; avatarUrl?: string | null };
        recipientId?: string;
        subject?: string; excerpt?: string; content?: string; time?: string;
        senderType?: string; unread?: boolean;
        readBy?: Record<string, unknown>;
    }

    // Sender / recipient adını her iki şemadan da güvenli çıkar
    const getSenderName = (m: MessageItem): string => typeof m.sender === 'string' ? m.sender : (m.sender?.name || 'Kullanıcı');
    const getSenderAvatar = (m: MessageItem): string | null => {
        if (typeof m.sender === 'object' && m.sender?.avatarUrl) return m.sender.avatarUrl;
        return m.senderAvatarUrl || null;
    };
    const getRecipientName = (m: MessageItem): string => m.recipient?.name || 'Alıcı';
    const getRecipientAvatar = (m: MessageItem): string | null => m.recipient?.avatarUrl || null;

    const matchSearch = (text: string) => text.toLowerCase().includes(searchTerm.toLowerCase());

    const filteredMessages = ((messages || []) as MessageItem[]).filter((m) =>
        matchSearch(getSenderName(m)) || matchSearch(m.subject || '')
    );
    const filteredSentMessages = ((sentMessages || []) as MessageItem[]).filter((m) =>
        matchSearch(getRecipientName(m)) || matchSearch(m.subject || '')
    );

    // entityId -> adminUserId lookup (bildirim göndermek için)
    const entityAdminMap = useMemo<Map<string, string>>(() => {
        const m = new Map<string, string>();
        [...(allNgos || []), ...(allBrands || []), ...(allClubs || [])].forEach(e => {
            if (e.adminUserId) m.set(e.id, e.adminUserId);
        });
        return m;
    }, [allNgos, allBrands, allClubs]);

    // Sadece izinli kurumlar: kullanıcının ilişkili olduğu STK/marka/kulüp
    const entityCandidates = useMemo<UserRecord[]>(() => {
        const mapEntity = (e: EntityRecord, kind: 'ngo' | 'brand' | 'club'): UserRecord => ({
            id: e.id,
            name: e.name || e.shortName,
            avatarUrl: e.files?.logo || e.logoUrl,
            recipientKind: kind,
        });
        return [
            ...(allNgos || []).filter(n => allowedNgoIds.has(n.id)).map((e) => mapEntity(e, 'ngo')),
            ...(allBrands || []).filter(b => allowedBrandIds.has(b.id)).map((e) => mapEntity(e, 'brand')),
            ...(allClubs || []).filter(c => allowedClubIds.has(c.id)).map((e) => mapEntity(e, 'club')),
        ].filter((e) => e.name);
    }, [allNgos, allBrands, allClubs, allowedNgoIds, allowedBrandIds, allowedClubIds]);

    const recipientCandidates = useMemo<UserRecord[]>(() => {
        const term = recipientSearch.trim().toLowerCase();
        if (!term) return entityCandidates;
        return entityCandidates.filter(e => (e.name || '').toLowerCase().includes(term));
    }, [entityCandidates, recipientSearch]);

    const hasAnyRelations = entityCandidates.length > 0;

    const resetCompose = () => {
        setRecipientSearch('');
        setSelectedRecipient(null);
        setSubject('');
        setContent('');
    };

    const handleSend = async () => {
        if (!authUser) { toast({ variant: 'destructive', title: t('dashboard.messages.toastLoginRequiredTitle'), description: t('dashboard.messages.toastLoginRequiredDesc') }); return; }
        if (!selectedRecipient) { toast({ variant: 'destructive', title: t('dashboard.messages.toastRecipientRequiredTitle'), description: t('dashboard.messages.toastRecipientRequiredDesc') }); return; }
        if (!content.trim()) { toast({ variant: 'destructive', title: t('dashboard.messages.toastEmptyTitle'), description: t('dashboard.messages.toastEmptyDesc') }); return; }
        setSending(true);
        try {
            const recipientName = selectedRecipient.displayName || selectedRecipient.fullName || selectedRecipient.name || 'Kullanıcı';
            const senderName = authUser.displayName || 'Bir kullanıcı';
            const trimmedSubject = subject.trim() || '(Konu yok)';
            const trimmedContent = content.trim();
            const msgDoc = await addDoc(collection(db, COLLECTIONS.messages), {
                sender: { id: authUser.uid, name: senderName, avatarUrl: authUser.photoURL || null },
                senderId: authUser.uid,
                recipient: { id: selectedRecipient.id, name: recipientName, avatarUrl: selectedRecipient.photoURL || selectedRecipient.avatarUrl || null },
                recipientId: selectedRecipient.id,
                subject: trimmedSubject, content: trimmedContent,
                timestamp: serverTimestamp(), status: 'sent',
            });

            // Bildirim: alıcı bir entity ise admin user'a, kullanıcı ise direkt ona
            // (mevcut kısıt: alıcı her zaman entity, ama defansif)
            const targetUserId = selectedRecipient.recipientKind
                ? entityAdminMap.get(selectedRecipient.id)
                : selectedRecipient.id;
            if (targetUserId) {
                try {
                    await addDoc(collection(db, COLLECTIONS.notifications), {
                        userId: targetUserId,
                        type: 'message',
                        title: `Yeni mesaj: ${senderName}`,
                        body: trimmedContent.length > 120 ? `${trimmedContent.slice(0, 120)}…` : trimmedContent,
                        data: { messageId: msgDoc.id, senderId: authUser.uid, recipientEntityId: selectedRecipient.id },
                        read: false,
                        createdAt: serverTimestamp(),
                        createdBy: 'message-system',
                    });
                } catch (e) {
                    console.warn('message notification create failed', e);
                }
            }

            // Push notification tetikle (best-effort, hata bloklamaz)
            try {
                const idToken = await authUser.getIdToken();
                await fetch('/api/notifications/message-sent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ messageId: msgDoc.id }),
                });
            } catch (e) {
                console.warn('message push trigger failed', e);
            }

            toast({ title: t('dashboard.messages.toastSentTitle'), description: `${recipientName}${t('dashboard.messages.toastSentDescSuffix')}` });
            setComposeOpen(false); resetCompose();
        } catch (err) {
            console.error('send message failed', err);
            toast({ variant: 'destructive', title: t('dashboard.messages.toastFailTitle'), description: t('dashboard.messages.toastFailDesc') });
        } finally { setSending(false); }
    };

    const markAsRead = async (msg: MessageItem) => {
        if (!authUser?.uid || !msg.id) return;
        if (msg.readBy && msg.readBy[authUser.uid]) return; // already marked
        try {
            await setDoc(
                doc(db, COLLECTIONS.messages, msg.id),
                { readBy: { [authUser.uid]: serverTimestamp() } },
                { merge: true },
            );
        } catch (err) {
            // graceful degradation — rules may reject; do not break UX
            console.warn('markAsRead failed', err);
        }
    };

    const openProfileFromMessage = (msg: MessageItem) => {
        void markAsRead(msg);
        if (!msg.senderId) {
            toast({
                variant: 'destructive',
                title: t('dashboard.messages.profileTitle'),
                description: t('dashboard.messages.profileUnavailable'),
            });
            return;
        }
        router.push(`/profile/${msg.senderId}`);
    };

    const isUnread = (msg: MessageItem): boolean => {
        if (!authUser?.uid) return false;
        if (msg.readBy && msg.readBy[authUser.uid]) return false;
        // fallback to legacy `unread` flag if present
        if (typeof msg.unread === 'boolean') return msg.unread;
        return true;
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('aria.back')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">{t('dashboard.messages.heading')}</h1>
                </div>
                <Button size="sm" onClick={() => setComposeOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> {t('dashboard.messages.newMessage')}
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t('dashboard.messages.searchPlaceholder')}
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Tabs defaultValue="inbox" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="inbox">
                        <Inbox className="mr-2 h-4 w-4" /> {t('dashboard.messages.tabInbox')}
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        <SendHorizontal className="mr-2 h-4 w-4" /> {t('dashboard.messages.tabSent')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="mt-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : !authUser ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('dashboard.messages.loginPrompt')}</p>
                        </div>
                    ) : (messages || []).length === 0 ? (
                        <EmptyState
                            icon={MessageSquare}
                            title={t('dashboard.messages.emptyTitle')}
                            description={t('dashboard.messages.emptyDesc')}
                        />
                    ) : filteredMessages.length > 0 ? filteredMessages.map((msg) => {
                        const senderName = getSenderName(msg);
                        const senderAvatar = getSenderAvatar(msg);
                        return (
                        <Card key={msg.id} onClick={() => void markAsRead(msg)} className={cn(
                            "cursor-pointer hover:bg-accent/50 transition-colors",
                            isUnread(msg) && "border-l-4 border-l-primary"
                        )}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <button type="button" onClick={(e) => { e.stopPropagation(); openProfileFromMessage(msg); }} className="rounded-full hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`${senderName} profilini gör`}>
                                    <Avatar className="h-12 w-12 border">
                                        {senderAvatar ? <AvatarImage src={senderAvatar} /> : null}
                                        <AvatarFallback>{senderName[0]}</AvatarFallback>
                                    </Avatar>
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); openProfileFromMessage(msg); }} className="font-bold text-sm truncate hover:underline text-left">{senderName}</button>
                                            {msg.senderType && (
                                                <div className="p-1 bg-muted rounded-full text-muted-foreground">{senderTypeIcons[msg.senderType] || null}</div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground truncate">{msg.subject}</p>
                                    <p className="text-xs text-muted-foreground truncate">{msg.excerpt || msg.content}</p>
                                </div>
                            </CardContent>
                        </Card>
                        );
                    }) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('dashboard.messages.notFound')}</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sent" className="mt-4 space-y-3">
                    {sentLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : !authUser ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <SendHorizontal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('dashboard.messages.loginPrompt')}</p>
                        </div>
                    ) : (sentMessages || []).length === 0 ? (
                        <EmptyState
                            icon={SendHorizontal}
                            title="Henüz mesaj göndermediniz"
                            description="Gönderdiğiniz mesajlar burada görünecek."
                        />
                    ) : filteredSentMessages.length > 0 ? filteredSentMessages.map((msg) => {
                        const recipientName = getRecipientName(msg);
                        const recipientAvatar = getRecipientAvatar(msg);
                        return (
                            <Card key={msg.id} className="hover:bg-accent/50 transition-colors">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border">
                                        {recipientAvatar ? <AvatarImage src={recipientAvatar} /> : null}
                                        <AvatarFallback>{recipientName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Alıcı</span>
                                                <span className="font-bold text-sm truncate">{recipientName}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground truncate">{msg.subject || '(Konu yok)'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{msg.excerpt || msg.content}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <SendHorizontal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('dashboard.messages.notFound')}</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Yeni Mesaj Dialog */}
            <Dialog open={composeOpen} onOpenChange={(open) => { setComposeOpen(open); if (!open) resetCompose(); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> {t('dashboard.messages.newMessage')}</DialogTitle>
                        <DialogDescription>{t('dashboard.messages.composeDesc')}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {selectedRecipient ? (
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        {(selectedRecipient.photoURL || selectedRecipient.avatarUrl) ? <AvatarImage src={selectedRecipient.photoURL || selectedRecipient.avatarUrl} /> : null}
                                        <AvatarFallback>{(selectedRecipient.displayName || selectedRecipient.fullName || selectedRecipient.name || '?')[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold">{selectedRecipient.displayName || selectedRecipient.fullName || selectedRecipient.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedRecipient.recipientKind === 'ngo' ? 'STK' : selectedRecipient.recipientKind === 'brand' ? 'Marka' : selectedRecipient.recipientKind === 'club' ? 'Kulüp' : ''}</p>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRecipient(null)}>Değiştir</Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Input placeholder="STK / Kulüp / Marka adı ara..." value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} />
                                <div className="max-h-44 overflow-y-auto rounded-lg border divide-y">
                                    {!hasAnyRelations ? (
                                        <div className="text-xs text-muted-foreground text-center py-6 px-4 space-y-2">
                                            <p>Henüz bağlantı kurduğunuz bir kurum yok.</p>
                                            <p className="opacity-80">Sadece bağışçısı/gönüllüsü olduğunuz STK'lara, takip ettiğiniz markalara, üye olduğunuz kulüplere ve kabul edilmiş gönüllülük başvurularınızdaki STK'lara mesaj yazabilirsiniz.</p>
                                        </div>
                                    ) : recipientCandidates.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">Aramanızla eşleşen kurum bulunamadı.</p>
                                    ) : recipientCandidates.map((u) => {
                                        const name = u.displayName || u.fullName || u.name || 'Kurum';
                                        const kindLabel = u.recipientKind === 'ngo' ? 'STK' : u.recipientKind === 'brand' ? 'Marka' : u.recipientKind === 'club' ? 'Kulüp' : '';
                                        return (
                                            <button key={`${u.recipientKind || 'entity'}-${u.id}`} type="button" onClick={() => setSelectedRecipient(u)} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50">
                                                <Avatar className="h-8 w-8">
                                                    {(u.photoURL || u.avatarUrl) ? <AvatarImage src={u.photoURL || u.avatarUrl} /> : null}
                                                    <AvatarFallback>{name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{name}</p>
                                                    {kindLabel ? <p className="text-xs text-muted-foreground truncate">{kindLabel}</p> : null}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <Input placeholder={t('dashboard.messages.subjectPlaceholder')} value={subject} onChange={(e) => setSubject(e.target.value)} />
                        <Textarea placeholder={t('dashboard.messages.contentPlaceholder')} value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
                    </div>
                    <DialogFooter className="flex-row gap-2 sm:gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => { setComposeOpen(false); resetCompose(); }}>{t('dashboard.messages.cancel')}</Button>
                        <Button type="button" className="flex-1" onClick={handleSend} disabled={sending || !selectedRecipient || !content.trim()}>
                            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('dashboard.messages.sending')}</> : <><Send className="mr-2 h-4 w-4" /> {t('dashboard.messages.send')}</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
