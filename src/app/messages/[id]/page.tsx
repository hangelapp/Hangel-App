'use client';

/**
 * /messages/[id] — Tek mesaj detay sayfası (Instagram benzeri normal sayfa).
 *
 * Önceki: Dialog/Modal popup. Şimdi: dedicated route, back navigation,
 * deep-link uyumlu. Push notification clickAction'da /messages/:id açar.
 */

import React, { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Reply, ExternalLink } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTranslation } from '@/components/providers/language-provider';
import { sanitizeHtml } from '@/lib/sanitize-html';

interface MessageItem {
  id: string;
  subject?: string;
  content?: string;
  // Rich HTML alternatif — sistem mesajları (örn. /api/emergency/respond)
  // tıklanabilir tel:/maps:// linkleri için bunu doldurur. Render tarafı
  // DOMPurify ile sanitize edip basar; yoksa `content` plain text fallback.
  contentHtml?: string;
  excerpt?: string;
  time?: string;
  read?: boolean;
  sender?: { id?: string; name?: string; avatarUrl?: string };
  senderId?: string;
  senderName?: string;
  recipient?: { id?: string; name?: string; avatarUrl?: string };
  recipientId?: string;
  recipientName?: string;
  timestamp?: { toDate?: () => Date } | string;
  data?: Record<string, unknown>;
}

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const messageId = String(params.id);
  const isSent = searchParams.get('sent') === '1';

  const msgRef = useMemoFirebase(
    () => (db && messageId ? doc(db, COLLECTIONS.messages, messageId) : null),
    [db, messageId],
  );
  const { data: msg, isLoading } = useDoc<MessageItem>(msgRef);

  // Otomatik okundu işaretle
  useEffect(() => {
    if (!msg || msg.read || isSent || !msgRef) return;
    updateDoc(msgRef, { read: true, readAt: serverTimestamp() }).catch((e) =>
      console.warn('[messages/:id] markAsRead failed', e),
    );
  }, [msg, isSent, msgRef]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!msg) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Geri">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground">{t('dashboard.messages.notFound') || 'Mesaj bulunamadı.'}</p>
      </div>
    );
  }

  const otherParty = isSent ? msg.recipient : msg.sender;
  const otherName = otherParty?.name || (isSent ? msg.recipientName : msg.senderName) || 'hangel';
  const otherAvatar = otherParty?.avatarUrl;
  const otherId = otherParty?.id || (isSent ? msg.recipientId : msg.senderId);
  const isSystemMessage = otherId === 'hangel-system';

  let timestampText = '';
  let fullTimestampText = '';
  try {
    const d =
      typeof msg.timestamp === 'object' && msg.timestamp !== null && 'toDate' in msg.timestamp
        ? msg.timestamp.toDate?.()
        : typeof msg.timestamp === 'string'
          ? new Date(msg.timestamp)
          : null;
    if (d) {
      timestampText = formatDistanceToNow(d, { addSuffix: true, locale: tr });
      // Net tarih/saat — minik detay olarak mesaj kartının altında.
      fullTimestampText = d.toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  } catch {}

  return (
    <div className="min-h-dvh bg-secondary/30">
      {/* Sticky header — Instagram benzeri */}
      <div className="sticky top-0 z-10 glass-prominent backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center gap-3 pt-[env(safe-area-inset-top)]">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Geri" className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 border shrink-0">
          {otherAvatar ? <AvatarImage src={otherAvatar} /> : null}
          <AvatarFallback>{otherName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold break-words">{otherName}</p>
          {timestampText && <p className="text-[11px] text-muted-foreground truncate">{timestampText}</p>}
        </div>
        {!isSystemMessage && otherId && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={() => router.push(`/u/${otherId}`)}
            aria-label="Profili görüntüle"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Mesaj içerik */}
      <div className="p-4 space-y-4">
        {msg.subject && (
          <h1 className="text-xl font-black tracking-tight break-words">{msg.subject}</h1>
        )}
        <Card>
          <CardContent className="p-5">
            {msg.contentHtml ? (
              // Sistem mesajları (kan talebi vb.) — tel:/maps:// linkleri var.
              // sanitizeHtml DOMPurify ile XSS önler; tel:/https: korunur.
              <div
                className="text-sm leading-relaxed prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_a]:break-words"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.contentHtml) }}
              />
            ) : (
              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {msg.content || msg.excerpt || t('dashboard.messages.noContent') || 'İçerik yok.'}
              </div>
            )}
            {fullTimestampText && (
              <p className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground text-right">{fullTimestampText}</p>
            )}
          </CardContent>
        </Card>

        {!isSystemMessage && otherId && !isSent && (
          <Button
            type="button"
            className="w-full h-12 rounded-2xl"
            onClick={() =>
              router.push(`/messages?to=${otherId}&subject=${encodeURIComponent('RE: ' + (msg.subject || ''))}`)
            }
          >
            <Reply className="h-4 w-4 mr-2" />
            Yanıtla
          </Button>
        )}
      </div>
    </div>
  );
}
