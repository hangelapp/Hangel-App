'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import {
    Loader2,
    Send,
    Phone,
    Search,
    MessageSquare,
    AlertTriangle,
    Check,
    CheckCheck,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 15_000;

type FilterKey = 'all' | 'unread' | 'window';

interface ConversationRow {
    id: string;
    contactPhone: string;
    contactName: string | null;
    contactId: string | null;
    lastMessageAt: string | null;
    lastMessageBody: string;
    lastMessageDirection: 'inbound' | 'outbound' | null;
    unreadCount: number;
    conversationWindowExpiresAt: string | null;
    windowOpen: boolean;
}

interface MessageRow {
    id: string;
    direction: 'inbound' | 'outbound' | null;
    type: string | null;
    body: string | null;
    templateName: string | null;
    mediaUrl: string | null;
    wabaMessageId: string | null;
    status: string | null;
    failureReason: string | null;
    sentBy: string | null;
    timestamp: string | null;
}

interface ConversationDetail {
    id: string;
    contactPhone: string;
    contactName: string | null;
    contactId: string | null;
    lastMessageAt: string | null;
    lastMessageBody: string;
    lastMessageDirection: 'inbound' | 'outbound' | null;
    conversationWindowExpiresAt: string | null;
    windowOpen: boolean;
}

function formatTime(value: string | null): string {
    if (!value) return '';
    try {
        const d = new Date(value);
        const now = new Date();
        const sameDay = d.toDateString() === now.toDateString();
        return sameDay
            ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    } catch {
        return '';
    }
}

function formatBubbleTime(value: string | null): string {
    if (!value) return '';
    try {
        return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function truncate(text: string, max = 40): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function StatusIcon({ status }: { status: string | null }) {
    if (status === 'failed') {
        return <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-label="Başarısız" />;
    }
    if (status === 'read') {
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" aria-label="Okundu" />;
    }
    if (status === 'delivered') {
        return <CheckCheck className="h-3.5 w-3.5 text-gray-500" aria-label="İletildi" />;
    }
    if (status === 'sent') {
        return <Check className="h-3.5 w-3.5 text-gray-500" aria-label="Gönderildi" />;
    }
    return <Clock className="h-3.5 w-3.5 text-gray-400" aria-label="Beklemede" />;
}

export default function WhatsAppBusinessInboxPage() {
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();

    const [conversations, setConversations] = useState<ConversationRow[]>([]);
    const [filter, setFilter] = useState<FilterKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [listLoading, setListLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ConversationDetail | null>(null);
    const [messages, setMessages] = useState<MessageRow[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const fetchConversations = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (!authUser) return;
            if (!opts?.silent) setListLoading(true);
            try {
                const token = await authUser.getIdToken();
                const params = new URLSearchParams();
                if (filter === 'unread') params.set('unread', '1');
                params.set('limit', '100');
                const res = await fetch(
                    `/api/ngo-admin/whatsapp-business/conversations?${params.toString()}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (!res.ok) {
                    if (!opts?.silent) {
                        const data = (await res.json().catch(() => null)) as { message?: string } | null;
                        toast({
                            variant: 'destructive',
                            title: 'Konuşmalar alınamadı',
                            description: data?.message ?? `HTTP ${res.status}`,
                        });
                    }
                    return;
                }
                const data = (await res.json()) as { conversations?: ConversationRow[] };
                setConversations(Array.isArray(data.conversations) ? data.conversations : []);
            } catch (err) {
                if (!opts?.silent) {
                    toast({
                        variant: 'destructive',
                        title: 'Konuşmalar alınamadı',
                        description: err instanceof Error ? err.message : 'Bilinmeyen hata',
                    });
                }
            } finally {
                if (!opts?.silent) setListLoading(false);
            }
        },
        [authUser, filter, toast],
    );

    const fetchDetail = useCallback(
        async (id: string, opts?: { silent?: boolean }) => {
            if (!authUser) return;
            if (!opts?.silent) setDetailLoading(true);
            try {
                const token = await authUser.getIdToken();
                const res = await fetch(`/api/ngo-admin/whatsapp-business/conversations/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const data = (await res.json().catch(() => null)) as { message?: string } | null;
                    toast({
                        variant: 'destructive',
                        title: 'Konuşma yüklenemedi',
                        description: data?.message ?? `HTTP ${res.status}`,
                    });
                    return;
                }
                const data = (await res.json()) as {
                    conversation?: ConversationDetail;
                    messages?: MessageRow[];
                };
                setDetail(data.conversation ?? null);
                setMessages(Array.isArray(data.messages) ? data.messages : []);
                // Local unread reset (server GET zaten markRead yapıyor)
                setConversations((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
                );
            } catch (err) {
                toast({
                    variant: 'destructive',
                    title: 'Konuşma yüklenemedi',
                    description: err instanceof Error ? err.message : 'Bilinmeyen hata',
                });
            } finally {
                if (!opts?.silent) setDetailLoading(false);
            }
        },
        [authUser, toast],
    );

    // İlk yükleme ve filtre değişiminde
    useEffect(() => {
        if (isUserLoading || !authUser) return;
        void fetchConversations();
    }, [authUser, isUserLoading, fetchConversations]);

    // 15s polling (sadece sessiz refresh)
    useEffect(() => {
        if (isUserLoading || !authUser) return;
        const t = window.setInterval(() => {
            void fetchConversations({ silent: true });
            if (selectedId) void fetchDetail(selectedId, { silent: true });
        }, POLL_INTERVAL_MS);
        return () => window.clearInterval(t);
    }, [authUser, isUserLoading, fetchConversations, fetchDetail, selectedId]);

    // Mesajlar değiştiğinde dibe scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, selectedId]);

    const filteredConversations = useMemo(() => {
        let rows = conversations;
        if (filter === 'window') rows = rows.filter((c) => c.windowOpen);
        if (filter === 'unread') rows = rows.filter((c) => c.unreadCount > 0);
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            rows = rows.filter((c) => {
                const name = (c.contactName || '').toLowerCase();
                const phone = c.contactPhone.toLowerCase();
                return name.includes(q) || phone.includes(q);
            });
        }
        return rows;
    }, [conversations, filter, searchQuery]);

    const totalUnread = useMemo(
        () => conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
        [conversations],
    );

    const handleSelect = useCallback(
        (id: string) => {
            setSelectedId(id);
            void fetchDetail(id);
        },
        [fetchDetail],
    );

    const handleSendReply = useCallback(async () => {
        if (!authUser || !selectedId) return;
        const body = replyBody.trim();
        if (!body) {
            toast({ variant: 'destructive', title: 'Mesaj boş olamaz' });
            return;
        }
        if (!detail?.windowOpen) {
            toast({
                variant: 'destructive',
                title: '24 saatlik pencere kapalı',
                description: 'Yeni gönderim için şablon kullanmanız gerekir.',
            });
            return;
        }
        setSending(true);
        try {
            const token = await authUser.getIdToken();
            const res = await fetch(
                `/api/ngo-admin/whatsapp-business/conversations/${selectedId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ type: 'text', body }),
                },
            );
            const data = (await res.json().catch(() => null)) as {
                ok?: boolean;
                errorCode?: string;
                message?: string;
            } | null;
            if (!res.ok || !data?.ok) {
                toast({
                    variant: 'destructive',
                    title: 'Mesaj gönderilemedi',
                    description: data?.message ?? `HTTP ${res.status}`,
                });
                return;
            }
            setReplyBody('');
            toast({ title: 'Mesaj gönderildi' });
            await fetchDetail(selectedId, { silent: true });
            await fetchConversations({ silent: true });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Mesaj gönderilemedi',
                description: err instanceof Error ? err.message : 'Bilinmeyen hata',
            });
        } finally {
            setSending(false);
        }
    }, [authUser, selectedId, replyBody, detail, toast, fetchDetail, fetchConversations]);

    const renderMessageBody = (m: MessageRow) => {
        if (m.type === 'template') {
            return (
                <div className="space-y-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                        Şablon: {m.templateName ?? '—'}
                    </div>
                    {m.body ? <div className="whitespace-pre-wrap break-words">{m.body}</div> : null}
                </div>
            );
        }
        if (m.type === 'button-reply') {
            return (
                <div className="space-y-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                        Buton yanıtı
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.body ?? '—'}</div>
                </div>
            );
        }
        if (m.type === 'image' || m.type === 'document') {
            return (
                <div className="space-y-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                        {m.type === 'image' ? 'Görsel' : 'Doküman'}
                    </div>
                    {m.mediaUrl ? (
                        <a
                            href={m.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline break-all"
                        >
                            {m.mediaUrl}
                        </a>
                    ) : null}
                    {m.body ? <div className="whitespace-pre-wrap break-words">{m.body}</div> : null}
                </div>
            );
        }
        return <div className="whitespace-pre-wrap break-words">{m.body ?? '—'}</div>;
    };

    return (
        <div className="flex h-[calc(100vh-7rem)] flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">WhatsApp Gelen Kutusu</h1>
                    <p className="text-sm text-muted-foreground">
                        Aktif konuşmaları görüntüle, 24 saatlik pencere açıkken serbest yanıt ver.
                    </p>
                </div>
                {totalUnread > 0 ? (
                    <Badge variant="destructive" className="text-sm">
                        {totalUnread} okunmamış
                    </Badge>
                ) : null}
            </div>

            <div className="flex min-h-0 flex-1 gap-3">
                {/* SOL: Konuşma listesi */}
                <Card className="flex w-[250px] shrink-0 flex-col overflow-hidden">
                    <div className="space-y-2 border-b p-3">
                        <div className="flex gap-1">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 flex-1 px-2 text-xs"
                                onClick={() => setFilter('all')}
                            >
                                Tümü
                            </Button>
                            <Button
                                variant={filter === 'unread' ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 flex-1 px-2 text-xs"
                                onClick={() => setFilter('unread')}
                            >
                                Okunmamış
                            </Button>
                            <Button
                                variant={filter === 'window' ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 flex-1 px-2 text-xs"
                                onClick={() => setFilter('window')}
                            >
                                24sa
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ara…"
                                className="h-8 pl-7 text-xs"
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        {listLoading ? (
                            <div className="flex items-center justify-center p-6 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground">
                                <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-50" />
                                Konuşma yok
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {filteredConversations.map((c) => {
                                    const active = c.id === selectedId;
                                    const displayName = c.contactName || c.contactPhone;
                                    return (
                                        <li key={c.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(c.id)}
                                                className={cn(
                                                    'w-full px-3 py-2 text-left transition-colors hover:bg-muted/60',
                                                    active && 'bg-muted',
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium">
                                                            {displayName}
                                                        </div>
                                                        {c.contactName ? (
                                                            <div className="truncate text-[11px] text-muted-foreground">
                                                                {c.contactPhone}
                                                            </div>
                                                        ) : null}
                                                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {c.lastMessageDirection === 'outbound' ? '↗ ' : ''}
                                                            {truncate(c.lastMessageBody, 40)}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatTime(c.lastMessageAt)}
                                                        </span>
                                                        {c.unreadCount > 0 ? (
                                                            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                                                                {c.unreadCount}
                                                            </span>
                                                        ) : c.windowOpen ? (
                                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" title="24sa pencere açık" />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </ScrollArea>
                </Card>

                {/* SAĞ: Konuşma detayı */}
                <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {!selectedId ? (
                        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                            <div>
                                <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                Bir konuşma seçin
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Üst bilgi */}
                            <div className="flex items-center justify-between gap-3 border-b bg-background p-3">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold">
                                        {detail?.contactName || detail?.contactPhone || '—'}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {detail?.contactPhone}
                                        {detail ? (
                                            detail.windowOpen ? (
                                                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    24sa pencere açık
                                                </span>
                                            ) : (
                                                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    24sa pencere kapalı
                                                </span>
                                            )
                                        ) : null}
                                    </div>
                                </div>
                                {detail?.contactId ? (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/call/${detail.contactId}`}>
                                            <Phone className="mr-1.5 h-4 w-4" />
                                            Çağrı yap
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>

                            {/* Mesajlar */}
                            <ScrollArea className="flex-1 bg-[#f0f2f5]">
                                <div className="space-y-2 p-4">
                                    {detailLoading && messages.length === 0 ? (
                                        <div className="flex items-center justify-center p-6 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-muted-foreground">
                                            Henüz mesaj yok.
                                        </div>
                                    ) : (
                                        messages.map((m) => {
                                            const outbound = m.direction === 'outbound';
                                            return (
                                                <div
                                                    key={m.id}
                                                    className={cn(
                                                        'flex',
                                                        outbound ? 'justify-end' : 'justify-start',
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                                                            outbound
                                                                ? 'rounded-br-md bg-gradient-to-br from-[#dcf8c6] to-[#c5edb1] text-gray-900'
                                                                : 'rounded-bl-md bg-white text-gray-900',
                                                        )}
                                                    >
                                                        {renderMessageBody(m)}
                                                        <div
                                                            className={cn(
                                                                'mt-1 flex items-center gap-1 text-[10px]',
                                                                outbound
                                                                    ? 'justify-end text-gray-600'
                                                                    : 'justify-end text-gray-500',
                                                            )}
                                                        >
                                                            <span>{formatBubbleTime(m.timestamp)}</span>
                                                            {outbound ? <StatusIcon status={m.status} /> : null}
                                                        </div>
                                                        {m.status === 'failed' && m.failureReason ? (
                                                            <div className="mt-1 text-[10px] text-red-600">
                                                                {m.failureReason}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Alt: yanıt input veya pencere kapalı uyarısı */}
                            <div className="border-t bg-background p-3">
                                {detail?.windowOpen ? (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            void handleSendReply();
                                        }}
                                        className="flex items-end gap-2"
                                    >
                                        <Input
                                            value={replyBody}
                                            onChange={(e) => setReplyBody(e.target.value)}
                                            placeholder="Yanıt yazın…"
                                            disabled={sending}
                                            className="flex-1"
                                            maxLength={4096}
                                        />
                                        <Button type="submit" disabled={sending || !replyBody.trim()}>
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="mr-1.5 h-4 w-4" />
                                                    Gönder
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    24 saatlik pencere doldu
                                                </div>
                                                <div>
                                                    Şablon mecburi — Yeni gönderim için Toplu Gönder
                                                    sayfasını kullanın.
                                                </div>
                                            </div>
                                        </div>
                                        <Button asChild size="sm" variant="default">
                                            <Link href="/ngo-admin/whatsapp-business/send">
                                                Yeni Şablon Gönder
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
