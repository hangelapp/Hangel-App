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
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
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

    // Yeni Mesaj Dialog state
    const [composeOpen, setComposeOpen] = useState(false);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<UserRecord | null>(null);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    // Tüm kullanıcılar — client-side filtre (mevcut surveys/users pattern)
    const usersRef = useMemoFirebase(
        () => composeOpen ? collection(db, COLLECTIONS.users) : null,
        [db, composeOpen]
    );
    const { data: allUsers } = useCollection<UserRecord>(usersRef);

    interface MessageItem {
        id?: string; sender?: string; senderId?: string; senderAvatarUrl?: string;
        subject?: string; excerpt?: string; content?: string; time?: string;
        senderType?: string; unread?: boolean;
        readBy?: Record<string, unknown>;
    }
    const filteredMessages = ((messages || []) as MessageItem[]).filter((m) =>
        m.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const recipientCandidates = useMemo<UserRecord[]>(() => {
        const term = recipientSearch.trim().toLowerCase();
        if (!term) return (allUsers || []).slice(0, 20);
        return (allUsers || []).filter((u) => {
            if (u.id === authUser?.uid) return false;
            const name = (u.displayName || u.fullName || u.name || '').toLowerCase();
            const phone = (u.phoneNumber || u.personalInfo?.phone || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            return name.includes(term) || phone.includes(term) || email.includes(term);
        }).slice(0, 30);
    }, [allUsers, recipientSearch, authUser?.uid]);

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
            await addDoc(collection(db, COLLECTIONS.messages), {
                sender: { id: authUser.uid, name: authUser.displayName || 'Kullanıcı', avatarUrl: authUser.photoURL || null },
                senderId: authUser.uid,
                recipient: { id: selectedRecipient.id, name: recipientName, avatarUrl: selectedRecipient.photoURL || selectedRecipient.avatarUrl || null },
                recipientId: selectedRecipient.id,
                subject: subject.trim() || '(Konu yok)', content: content.trim(),
                timestamp: serverTimestamp(), status: 'sent',
            });
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
                    ) : filteredMessages.length > 0 ? filteredMessages.map((msg) => (
                        <Card key={msg.id} onClick={() => void markAsRead(msg)} className={cn(
                            "cursor-pointer hover:bg-accent/50 transition-colors",
                            isUnread(msg) && "border-l-4 border-l-primary"
                        )}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <button type="button" onClick={(e) => { e.stopPropagation(); openProfileFromMessage(msg); }} className="rounded-full hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`${msg.sender} profilini gör`}>
                                    <Avatar className="h-12 w-12 border">
                                        {msg.senderAvatarUrl ? <AvatarImage src={msg.senderAvatarUrl} /> : null}
                                        <AvatarFallback>{(msg.sender || '?')[0]}</AvatarFallback>
                                    </Avatar>
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); openProfileFromMessage(msg); }} className="font-bold text-sm truncate hover:underline text-left">{msg.sender}</button>
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
                    )) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('dashboard.messages.notFound')}</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sent" className="mt-4 text-center py-20 text-muted-foreground">
                    <SendHorizontal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{t('dashboard.messages.sentEmpty')}</p>
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
                                        <p className="text-xs text-muted-foreground">{selectedRecipient.email || selectedRecipient.phoneNumber || selectedRecipient.personalInfo?.phone || ''}</p>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRecipient(null)}>Değiştir</Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Input placeholder={t('dashboard.messages.recipientSearchPlaceholder')} value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} />
                                <div className="max-h-44 overflow-y-auto rounded-lg border divide-y">
                                    {recipientCandidates.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">{t('dashboard.messages.recipientNoResult')}</p>
                                    ) : recipientCandidates.map((u) => {
                                        const name = u.displayName || u.fullName || u.name || 'Kullanıcı';
                                        const sub = u.email || u.phoneNumber || u.personalInfo?.phone || '';
                                        return (
                                            <button key={u.id} type="button" onClick={() => setSelectedRecipient(u)} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50">
                                                <Avatar className="h-8 w-8">
                                                    {(u.photoURL || u.avatarUrl) ? <AvatarImage src={u.photoURL || u.avatarUrl} /> : null}
                                                    <AvatarFallback>{name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{name}</p>
                                                    {sub ? <p className="text-xs text-muted-foreground truncate">{sub}</p> : null}
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
