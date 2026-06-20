'use client';

/**
 * EventCompleteButton — etkinlik yönetiminde "Tamamla".
 *
 * Onay sonrası POST /api/events/[id]/complete → tüm katılımcılara katılım
 * sertifikası + teşekkür bildirimi/DM (/my-badges deep-link'li). İdempotent:
 * zaten sertifika alanlar atlanır, böylece "gitmeyenlere gönder" de bununla işler.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function EventCompleteButton({ eventId }: { eventId: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const complete = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/events/${eventId}/complete`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Tamamlanamadı');
      toast({
        title: 'Etkinlik tamamlandı 🎉',
        description: `${body.newlyCertified} kişiye sertifika + bildirim gönderildi${body.alreadyDone ? ` · ${body.alreadyDone} zaten almıştı` : ''}.`,
      });
      setOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm"><CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" /> Tamamla</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Etkinliği tamamla?</AlertDialogTitle>
          <AlertDialogDescription>
            Tüm katılımcılara <strong>katılım sertifikası</strong> verilir ve <strong>teşekkür bildirimi + hangel DM</strong> gönderilir
            (sertifikalarını profillerinden indirebilirler). Zaten sertifikası olanlar atlanır — tekrar basabilirsin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Vazgeç</AlertDialogCancel>
          <Button onClick={complete} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />} Tamamla & Gönder
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
