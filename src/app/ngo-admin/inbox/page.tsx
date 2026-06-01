'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Inbox, Loader2, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    useUser,
    useFirestore,
    useCollection,
    useMemoFirebase,
} from '@/firebase';
import {
    addDoc,
    collection,
    doc,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { EmptyState } from '@/components/shared/empty-state';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';

type EntityKind = 'ngo' | 'brand' | 'club';

interface ManagedEntityDoc {
    id: string;
    name?: string;
    shortName?: string;
    adminUserId?: string;
    files?: { logo?: string };
    logoUrl?: string;
}

interface MessageItem {
    id?: string;
    sender?: { id?: string; name?: string; avatarUrl?: string | null };
    senderId?: string;
    recipient?: { id?: string; name?: string; avatarUrl?: string | null };
    recipientId?: string;
    subject?: string;
    content?: string;
    status?: string;
    readBy?: Record<string, unknown>;
}

function formatTimestamp(value: unknown): string {
    const v = value as { toDate?: () => Date } | undefined;
    if (v && typeof v.toDate === 'function') {
        try {
            return v.toDate().toLocaleString('tr-TR');
        } catch {
            /* fall through */
        }
    }
    return '';
}

export default function NgoAdminInboxPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();
    const { t } = useTranslation();

    // ---- Aktif kurum (ActiveEntityProvider'dan) — banner ve sayfa tek kaynak ----
    const { id: activeId, kind: activeKind, isLoading: activeLoading } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<ManagedEntityDoc>();

    const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
        if (!activeId || !activeKind || !activeDoc) return null;
        return { kind: activeKind, data: activeDoc };
    }, [activeId, activeKind, activeDoc]);

    const entityResolving = isUserLoading || activeLoading;
    const entityId = activeEntity?.data?.id;
    const entityName = activeEntity?.data?.name || activeEntity?.data?.shortName || t('ngoAdminInbox.fallbackEntity');
    const entityLogo = activeEntity?.data?.files?.logo || activeEntity?.data?.logoUrl || null;

    // ---- Incoming messages for the active entity (realtime) ----
    const messagesQuery = useMemoFirebase(
        () => (firestore && entityId
            ? query(
                collection(firestore, COLLECTIONS.messages),
                where('recipientId', '==', entityId),
                orderBy('timestamp', 'desc'),
                limit(100),
            )
            : null),
        [firestore, entityId],
    );
    const { data: messages, isLoading: messagesLoading } = useCollection<MessageItem>(messagesQuery);

    const [openMessage, setOpenMessage] = useState<MessageItem | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);

    const isUnread = (msg: MessageItem): boolean => {
        if (!authUser?.uid) return false;
        return !(msg.readBy && msg.readBy[authUser.uid]);
    };

    const markAsRead = async (msg: MessageItem) => {
        if (!firestore || !authUser?.uid || !msg.id) return;
        if (msg.readBy && msg.readBy[authUser.uid]) return; // already marked
        try {
            await setDoc(
                doc(firestore, COLLECTIONS.messages, msg.id),
                { readBy: { [authUser.uid]: serverTimestamp() } },
                { merge: true },
            );
        } catch (err) {
            // graceful degradation — do not break UX if rules reject
            console.warn('markAsRead failed', err);
        }
    };

    const handleOpen = (msg: MessageItem) => {
        setOpenMessage(msg);
        setReplyContent('');
        void markAsRead(msg);
    };

    const handleReply = async () => {
        if (!firestore || !authUser?.uid) {
            toast({ variant: 'destructive', title: t('ngoAdminInbox.errLogin') });
            return;
        }
        if (!activeEntity || !entityId) {
            toast({ variant: 'destructive', title: t('ngoAdminInbox.errNoEntityTitle'), description: t('ngoAdminInbox.errNoEntityDesc') });
            return;
        }
        if (!openMessage?.senderId) {
            toast({ variant: 'destructive', title: t('ngoAdminInbox.errNoRecipientTitle'), description: t('ngoAdminInbox.errNoRecipientDesc') });
            return;
        }
        if (!replyContent.trim()) {
            toast({ variant: 'destructive', title: t('ngoAdminInbox.errEmpty') });
            return;
        }
        setSending(true);
        try {
            const originalSubject = openMessage.subject || '';
            const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject || t('ngoAdminInbox.noSubject')}`;
            const trimmedReply = replyContent.trim();
            const msgDoc = await addDoc(collection(firestore, COLLECTIONS.messages), {
                // Görsel gönderen: ENTITY. Rule-güvenliği için senderId = admin uid.
                sender: { id: entityId, name: entityName, avatarUrl: entityLogo },
                senderId: authUser.uid,
                recipient: {
                    id: openMessage.senderId,
                    name: openMessage.sender?.name || t('ngoAdminInbox.userFallback'),
                    avatarUrl: openMessage.sender?.avatarUrl || null,
                },
                recipientId: openMessage.senderId,
                subject: replySubject,
                content: trimmedReply,
                timestamp: serverTimestamp(),
                status: 'sent',
            });

            // Bildirim: kullanıcıya yanıt geldiğini bildir
            try {
                await addDoc(collection(firestore, COLLECTIONS.notifications), {
                    userId: openMessage.senderId,
                    type: 'message',
                    title: `${t('ngoAdminInbox.newMessagePrefix')} ${entityName}`,
                    body: trimmedReply.length > 120 ? `${trimmedReply.slice(0, 120)}…` : trimmedReply,
                    data: { messageId: msgDoc.id, fromEntityId: entityId, fromEntityName: entityName },
                    read: false,
                    createdAt: serverTimestamp(),
                    createdBy: 'message-system',
                });
            } catch (e) {
                console.warn('reply notification create failed', e);
            }

            toast({ title: t('ngoAdminInbox.replySentTitle'), description: `${openMessage.sender?.name || t('ngoAdminInbox.userFallback')} ${t('ngoAdminInbox.replySentDescSuffix')}` });
            setOpenMessage(null);
            setReplyContent('');
        } catch (err) {
            console.error('reply failed', err);
            const e = err as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: t('ngoAdminInbox.replyFailedTitle'),
                description: e?.code === 'permission-denied' ? t('ngoAdminInbox.permDenied') : (e?.message || t('ngoAdminInbox.unexpected')),
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div>
                <h1 className="text-2xl font-bold">{t('ngoAdminInbox.title')}</h1>
                <p className="text-muted-foreground">
                    {t('ngoAdminInbox.subtitle')}
                </p>
            </div>

            {entityResolving ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !authUser ? (
                <EmptyState
                    icon={Inbox}
                    title={t('ngoAdminInbox.loginTitle')}
                    description={t('ngoAdminInbox.loginDesc')}
                />
            ) : !activeEntity ? (
                <EmptyState
                    icon={Inbox}
                    title={t('ngoAdminInbox.noEntityTitle')}
                    description={t('ngoAdminInbox.noEntityDesc')}
                />
            ) : messagesLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (messages || []).length === 0 ? (
                <EmptyState
                    icon={MessageSquare}
                    title={t('ngoAdminInbox.noMessagesTitle')}
                    description={`${entityName} ${t('ngoAdminInbox.noMessagesDescSuffix')}`}
                />
            ) : (
                <div className="space-y-3">
                    {(messages || []).map((msg) => (
                        <Card
                            key={msg.id}
                            onClick={() => handleOpen(msg)}
                            className={cn(
                                'cursor-pointer hover:bg-accent/50 transition-colors',
                                isUnread(msg) && 'border-l-4 border-l-primary',
                            )}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    {msg.sender?.avatarUrl ? <AvatarImage src={msg.sender.avatarUrl} /> : null}
                                    <AvatarFallback>{(msg.sender?.name || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1 gap-2">
                                        <span className={cn('text-sm truncate', isUnread(msg) ? 'font-bold' : 'font-semibold')}>
                                            {msg.sender?.name || t('ngoAdminInbox.userFallback')}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{formatTimestamp((msg as { timestamp?: unknown }).timestamp)}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground truncate">{msg.subject || t('ngoAdminInbox.noSubject')}</p>
                                    <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Mesaj detayı + yanıt */}
            <Dialog open={!!openMessage} onOpenChange={(open) => { if (!open) { setOpenMessage(null); setReplyContent(''); } }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" /> {openMessage?.subject || t('ngoAdminInbox.noSubject')}
                        </DialogTitle>
                        <DialogDescription>
                            {openMessage?.sender?.name || t('ngoAdminInbox.userFallback')} · {formatTimestamp((openMessage as { timestamp?: unknown } | null)?.timestamp)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm">
                            {openMessage?.content}
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                <ArrowLeft className="h-3 w-3" /> {entityName} {t('ngoAdminInbox.replyAsSuffix')}
                            </p>
                            <Textarea
                                placeholder={t('ngoAdminInbox.replyPh')}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpenMessage(null); setReplyContent(''); }}>
                            {t('ngoAdminInbox.closeBtn')}
                        </Button>
                        <Button type="button" className="flex-1" onClick={handleReply} disabled={sending || !replyContent.trim()}>
                            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngoAdminInbox.sending')}</> : <><Send className="mr-2 h-4 w-4" /> {t('ngoAdminInbox.replyBtn')}</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
