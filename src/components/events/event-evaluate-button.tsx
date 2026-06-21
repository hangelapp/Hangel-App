'use client';

/**
 * EventEvaluateButton — etkinlik sonrası "Değerlendir" butonu + dialog (yıldız + yorum).
 * Sadece "going" RSVP'li katılımcıya gösterilir; 24 saatlik pencerede etkinliği puanlar.
 * POST /api/events/[id]/evaluate (sunucu tarafında da going gating var).
 */

import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';

interface Props {
  eventId: string;
  eventName: string;
  authUser: { getIdToken: () => Promise<string> } | null;
  className?: string;
}

export function EventEvaluateButton({ eventId, eventName, authUser, className }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!authUser || rating < 1) { toast({ variant: 'destructive', title: 'Puan seç', description: '1-5 yıldız ver.' }); return; }
    setBusy(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/events/${eventId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.message || 'Hata'); }
      celebrate();
      setDone(true);
      setOpen(false);
      toast({ title: 'Değerlendirmen alındı 🧡', description: 'Teşekkürler!' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className={className} aria-label="Etkinliği değerlendir" title="Etkinliği değerlendir">
          ⭐ {done ? 'Değerlendirildi' : 'Değerlendir'}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold leading-tight">{eventName} nasıldı?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} yıldız`}
                className="flex h-12 w-12 items-center justify-center rounded-full transition active:scale-90 hover:bg-primary/10">
                <Star className={`h-9 w-9 ${rating >= n ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Yorumun (opsiyonel)…" className="rounded-2xl" rows={3} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || rating < 1} className="h-12 w-full rounded-2xl font-bold">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
