'use client';

/**
 * Kart üstünde "Mesaj Gönder" butonu + tıklanınca toplu mesaj Dialog'u açar.
 *
 * EventAttendees ile aynı kart-buton kalıbı (variant="outline" size="sm",
 * lucide ikonu, className prop dışarıdan gelir → etkinlik kartındaki
 * `rounded-xl w-full sm:w-auto` ile uyumlu).
 *
 * Gönüllülük ilanlarında hedef (audience) seçimi ŞART: yönetici Başvuran /
 * Onaylanan / Bekleyen gruplarına AYRI AYRI mesaj gönderebilir. Etkinlikte tek
 * grup vardır (tüm katılımcılar) → hedef seçimi gösterilmez.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Audience = 'applicants' | 'approved' | 'pending';

interface BroadcastMessageButtonProps {
  /** İlan (volunteering) veya etkinlik (event) id'si. */
  targetId: string;
  kind: 'volunteering' | 'event';
  /** İlan/etkinlik başlığı — dialog başlığında gösterilir. */
  title?: string;
  className?: string;
}

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'applicants', label: 'Başvuran' },
  { value: 'approved', label: 'Onaylanan' },
  { value: 'pending', label: 'Bekleyen' },
];

export function BroadcastMessageButton({
  targetId,
  kind,
  title,
  className,
}: BroadcastMessageButtonProps) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [audience, setAudience] = useState<Audience>('approved');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const reset = () => {
    setAudience('approved');
    setSubject('');
    setMessage('');
  };

  const openDialog = () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum gerekli' });
      return;
    }
    reset();
    setOpen(true);
  };

  const handleSend = async () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum gerekli' });
      return;
    }
    if (message.trim().length < 1) {
      toast({ variant: 'destructive', title: 'Mesaj boş olamaz' });
      return;
    }
    setSending(true);
    try {
      const token = await authUser.getIdToken();
      const endpoint =
        kind === 'volunteering'
          ? `/api/volunteering/${targetId}/broadcast`
          : `/api/events/${targetId}/broadcast`;
      const body =
        kind === 'volunteering'
          ? { audience, subject, message }
          : { subject, message };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gönderilemedi');
      toast({
        title: 'Mesaj gönderildi',
        description: `${data.sent ?? 0} kişiye ulaştı`,
      });
      setOpen(false);
      reset();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Mesaj gönderilemedi',
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('rounded-xl w-full sm:w-auto', className)}
        onClick={openDialog}
        disabled={!authUser}
      >
        <Send className="h-4 w-4 mr-1.5" /> Mesaj Gönder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">
              Mesaj Gönder{title ? ` — ${title}` : ''}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {kind === 'volunteering'
                ? 'Hedef grubu seçip toplu mesaj gönderin.'
                : 'Tüm katılımcılara gönderilecek.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {kind === 'volunteering' && (
              <div className="space-y-1.5">
                <Label className="text-sm">Hedef</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={audience === opt.value ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setAudience(opt.value)}
                      disabled={sending}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="broadcast-subject" className="text-sm">
                Konu
              </Label>
              <Input
                id="broadcast-subject"
                value={subject}
                maxLength={200}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Konu (isteğe bağlı)"
                disabled={sending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broadcast-message" className="text-sm">
                Mesaj
              </Label>
              <Textarea
                id="broadcast-message"
                value={message}
                maxLength={4000}
                rows={6}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajınızı yazın…"
                disabled={sending}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={sending || message.trim().length < 1}
                className="rounded-xl w-full sm:w-auto"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Gönder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
