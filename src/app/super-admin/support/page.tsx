'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, User as UserIcon, MessageSquare, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import {
  collection, query, orderBy, doc, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COLLECTIONS } from '@/firebase/collections';

type Ticket = {
  id: string;
  subject?: string;
  message?: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  status?: 'open' | 'answered' | 'closed' | string;
  priority?: 'low' | 'normal' | 'high' | string;
  createdAt?: unknown;
  reply?: string;
  repliedAt?: unknown;
  repliedBy?: string;
};

const statusLabel: Record<string, string> = {
  open: 'Açık',
  answered: 'Cevaplandı',
  closed: 'Kapandı',
};
const priorityLabel: Record<string, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
};

function fmtDate(v: unknown): string {
  if (!v) return '';
  try {
    const maybeDate = v as { toDate?: () => Date } | null;
    const d = maybeDate?.toDate?.() || (typeof v === 'string' ? new Date(v) : null);
    if (!d) return '';
    return format(d, 'd MMM yyyy HH:mm', { locale: tr });
  } catch { return ''; }
}

function TicketItem({ ticket, onView }: { ticket: Ticket; onView: (t: Ticket) => void }) {
  const status = ticket.status || 'open';
  const priority = ticket.priority || 'normal';
  return (
    <div className="p-4 border rounded-xl flex items-start justify-between gap-3 hover:bg-muted/30 transition">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold truncate">{ticket.subject || '(Konu yok)'}</p>
          <Badge
            variant={priority === 'high' ? 'destructive' : 'secondary'}
            className="text-[10px] uppercase font-bold"
          >
            {priorityLabel[priority] || priority}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase font-bold">
            {statusLabel[status] || status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {ticket.userName || 'Anonim'}</span>
          {ticket.userEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {ticket.userEmail}</span>}
          {!!ticket.createdAt && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(ticket.createdAt)}</span>}
        </div>
        {ticket.message && (
          <p className="text-sm text-muted-foreground line-clamp-2 pt-1">{ticket.message}</p>
        )}
      </div>
      <Button size="sm" onClick={() => onView(ticket)} className="shrink-0">Görüntüle</Button>
    </div>
  );
}

function TicketDialog({
  ticket, open, onOpenChange, onSendReply, onMarkClosed, sending,
}: {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSendReply: (replyText: string) => Promise<void>;
  onMarkClosed: () => Promise<void>;
  sending: boolean;
}) {
  const [reply, setReply] = useState('');

  React.useEffect(() => {
     
    if (ticket) setReply(ticket.reply || '');
  }, [ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{ticket.subject || '(Konu yok)'}</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block text-xs">
              <strong>{ticket.userName || 'Anonim'}</strong>
              {ticket.userEmail && <> &middot; {ticket.userEmail}</>}
            </span>
            <span className="block text-xs text-muted-foreground">{fmtDate(ticket.createdAt)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Kullanıcının mesajı</Label>
            <div className="p-4 bg-muted/30 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border">
              {ticket.message || '—'}
            </div>
          </div>

          {ticket.reply && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Mevcut yanıtınız
              </Label>
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.reply}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {ticket.repliedAt ? `Yanıtlandı: ${fmtDate(ticket.repliedAt)}` : ''}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {ticket.reply ? 'Yanıtı güncelle' : 'Yanıt yaz'}
            </Label>
            <Textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={6}
              placeholder="Kullanıcıya gönderilecek yanıtı buraya yazın..."
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Yanıt kullanıcıya bildirim olarak iletilir; talebi "Cevaplandı" olarak işaretler.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {ticket.status !== 'closed' && (
            <Button variant="outline" onClick={onMarkClosed} disabled={sending}>
              Kapat
            </Button>
          )}
          <Button
            onClick={() => onSendReply(reply.trim())}
            disabled={sending || !reply.trim()}
            className="font-bold"
          >
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ticket.reply ? 'Yanıtı Güncelle' : 'Yanıtı Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SupportPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const ticketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, COLLECTIONS.supportTickets), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: tickets, isLoading } = useCollection<Ticket>(ticketsQuery);

  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [sending, setSending] = useState(false);

  const buckets = useMemo(() => {
    const open: Ticket[] = [];
    const answered: Ticket[] = [];
    const closed: Ticket[] = [];
    (tickets || []).forEach(t => {
      const s = t.status || 'open';
      if (s === 'answered') answered.push(t);
      else if (s === 'closed') closed.push(t);
      else open.push(t);
    });
    return { open, answered, closed };
  }, [tickets]);

  const handleSendReply = async (replyText: string) => {
    if (!activeTicket || !replyText) return;
    setSending(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.supportTickets, activeTicket.id), {
        reply: replyText,
        status: 'answered',
        repliedAt: serverTimestamp(),
        repliedBy: authUser?.uid || null,
      });
      // Kullanıcıya bildirim gönder (varsa userId'si)
      if (activeTicket.userId) {
        try {
          await addDoc(collection(db, COLLECTIONS.notifications), {
            userId: activeTicket.userId,
            type: 'support-reply',
            title: 'Destek talebinize yanıt geldi',
            body: `"${activeTicket.subject || 'Talebiniz'}" konulu mesajınıza yanıt verildi.`,
            data: { ticketId: activeTicket.id },
            read: false,
            createdAt: serverTimestamp(),
            createdBy: authUser?.uid || null,
          });
        } catch (e) {
          console.warn('Notification send failed (non-fatal):', e);
        }
      }
      toast({ title: 'Yanıt gönderildi', description: 'Kullanıcıya iletildi.' });
      setActiveTicket(null);
    } catch (e) {
      console.error('Send reply failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Yanıt gönderilemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    } finally {
      setSending(false);
    }
  };

  const handleMarkClosed = async () => {
    if (!activeTicket) return;
    setSending(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.supportTickets, activeTicket.id), {
        status: 'closed',
        closedAt: serverTimestamp(),
      });
      toast({ title: 'Talep kapandı' });
      setActiveTicket(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Hata oluştu.';
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Destek talepleri yükleniyor...</p>
      </div>
    );
  }

  const renderList = (list: Ticket[], emptyText: string) => (
    list.length > 0
      ? <div className="space-y-3">{list.map(t => <TicketItem key={t.id} ticket={t} onView={setActiveTicket} />)}</div>
      : (
        <div className="py-16 text-center text-muted-foreground space-y-2">
          <Inbox className="h-10 w-10 mx-auto opacity-30" />
          <p>{emptyText}</p>
        </div>
      )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Destek Talepleri</h1>
        <p className="text-sm text-muted-foreground">Kullanıcılardan gelen destek taleplerini yanıtlayın.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Talepler ({tickets?.length || 0})</CardTitle>
          <CardDescription>
            {buckets.open.length} açık · {buckets.answered.length} cevaplandı · {buckets.closed.length} kapandı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Açık ({buckets.open.length})</TabsTrigger>
              <TabsTrigger value="answered">Cevaplandı ({buckets.answered.length})</TabsTrigger>
              <TabsTrigger value="closed">Kapandı ({buckets.closed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-4">
              {renderList(buckets.open, 'Açık destek talebi yok.')}
            </TabsContent>
            <TabsContent value="answered" className="mt-4">
              {renderList(buckets.answered, 'Henüz cevaplanmış talep yok.')}
            </TabsContent>
            <TabsContent value="closed" className="mt-4">
              {renderList(buckets.closed, 'Kapatılmış talep yok.')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TicketDialog
        ticket={activeTicket}
        open={!!activeTicket}
        onOpenChange={(o) => !o && setActiveTicket(null)}
        onSendReply={handleSendReply}
        onMarkClosed={handleMarkClosed}
        sending={sending}
      />
    </div>
  );
}
