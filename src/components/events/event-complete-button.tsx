'use client';

/**
 * EventCompleteButton — etkinlik yönetiminde "Tamamla" (iki adım).
 *
 * 1. ADIM — Değerlendir: katılımcılar (RSVP going + check-in) listelenir;
 *    yönetici her birine puan (1-5) + opsiyonel yorum verir →
 *    POST /api/events/[id]/review-participants (sertifika GÖNDERMEZ).
 * 2. ADIM — Kapat & Gönder: POST /api/events/[id]/complete → herkese katılım
 *    SERTİFİKASI + teşekkür DM/bildirim (puan/yorum mesaja işlenir),
 *    etkinlik completed=true (aktif/canlı listeden düşer, yeni kayıt kapanır).
 * İdempotent: zaten sertifika alanlar atlanır → "gitmeyenlere tekrar bas" işler.
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Loader2, Star, Send } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { roleLabelTr } from '@/lib/event-roles';
import type { EventUserRole } from '@/lib/event-roles';
import { celebrate } from '@/lib/celebrate';

interface Participant {
  uid: string;
  name: string;
  avatarUrl: string;
  role: string;
  rating: number;
  comment: string;
}

export function EventCompleteButton({ eventId }: { eventId: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [savingReviews, setSavingReviews] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reviewsSaved, setReviewsSaved] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const busy = loadingList || savingReviews || closing;

  const loadParticipants = useCallback(async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    setLoadingList(true);
    setReviewsSaved(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/events/${eventId}/participants`, { headers: { authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Katılımcılar getirilemedi');
      setParticipants(Array.isArray(body.participants) ? body.participants : []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : '' });
      setParticipants([]);
    } finally {
      setLoadingList(false);
    }
  }, [user, eventId, toast]);

  const onOpenChange = (o: boolean) => {
    if (busy) return;
    setOpen(o);
    if (o) void loadParticipants();
  };

  const setRating = (uid: string, rating: number) => {
    setParticipants((prev) => prev.map((p) => (p.uid === uid ? { ...p, rating } : p)));
    setReviewsSaved(false);
  };
  const setComment = (uid: string, comment: string) => {
    setParticipants((prev) => prev.map((p) => (p.uid === uid ? { ...p, comment } : p)));
    setReviewsSaved(false);
  };

  const saveReviews = async () => {
    if (!user) return;
    setSavingReviews(true);
    try {
      const token = await user.getIdToken();
      const reviews = participants
        .filter((p) => p.rating > 0 || p.comment.trim())
        .map((p) => ({ uid: p.uid, rating: p.rating, comment: p.comment }));
      if (reviews.length === 0) {
        // Değerlendirme şart değil — yine de kapatmaya izin ver.
        setReviewsSaved(true);
        toast({ title: 'Değerlendirme atlandı', description: 'Sertifika göndermeye geçebilirsin.' });
        return;
      }
      const res = await fetch(`/api/events/${eventId}/review-participants`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviews }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Değerlendirmeler kaydedilemedi');
      setReviewsSaved(true);
      toast({ title: 'Değerlendirmeler kaydedildi 🧡', description: `${body.saved} katılımcı puanlandı. Şimdi sertifikaları gönderebilirsin.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setSavingReviews(false);
    }
  };

  const closeAndSend = async () => {
    if (!user) return;
    setClosing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/events/${eventId}/complete`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Tamamlanamadı');
      // Kutlama: etkinlik tamamlama + sertifikalar gönderildi — konfeti + native haptik + bant.
      celebrate({ title: 'Etkinlik tamamlandı 🧡', message: `${body.newlyCertified} kişiye sertifika gönderildi` });
      toast({
        title: 'Etkinlik kapatıldı 🎉',
        description: `${body.newlyCertified} kişiye sertifika DM olarak gönderildi${body.alreadyDone ? ` · ${body.alreadyDone} zaten almıştı` : ''}.`,
      });
      setOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setClosing(false);
    }
  };

  const canClose = reviewsSaved || participants.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" /> Tamamla</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Etkinliği tamamla & değerlendir</DialogTitle>
          <DialogDescription>
            Önce katılımcılara <strong>puan + yorum</strong> ver, kaydet; sonra <strong>Kapat & Gönder</strong> ile herkese
            katılım <strong>sertifikası</strong> ve teşekkür DM&apos;i gider. Etkinlik kapanır, yeni kayıt alınmaz.
          </DialogDescription>
        </DialogHeader>

        {loadingList ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Katılımcılar yükleniyor…
          </div>
        ) : participants.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-muted-foreground">
            Henüz katılımcı yok. Yine de etkinliği kapatabilirsin.
          </p>
        ) : (
          <ScrollArea className="max-h-[46vh] pr-3">
            <div className="space-y-3">
              {participants.map((p) => (
                <div key={p.uid} className="rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt={p.name} /> : null}
                      <AvatarFallback className="text-xs font-bold">{p.name.slice(0, 1).toLocaleUpperCase('tr')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold leading-tight">{p.name}</p>
                      <p className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {roleLabelTr((p.role as EventUserRole) || 'participant')}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${p.name} için ${n} yıldız`}
                          onClick={() => setRating(p.uid, n)}
                          disabled={busy}
                          className="flex h-11 w-9 items-center justify-center transition active:scale-90 disabled:opacity-50 hover:text-primary"
                        >
                          <Star className={`h-5 w-5 ${p.rating >= n ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={p.comment}
                    onChange={(e) => setComment(p.uid, e.target.value)}
                    disabled={busy}
                    placeholder="Yorum (opsiyonel) — teşekkür mesajına eklenir"
                    className="mt-2.5 min-h-[40px] resize-none rounded-xl text-sm"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {participants.length > 0 && (
            <Button variant="outline" onClick={saveReviews} disabled={busy}>
              {savingReviews ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Star className="mr-1.5 h-4 w-4" />}
              Değerlendirmeleri kaydet
            </Button>
          )}
          <Button onClick={closeAndSend} disabled={busy || !canClose} title={!canClose ? 'Önce değerlendirmeleri kaydet' : undefined}>
            {closing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Kapat &amp; Sertifikaları gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
