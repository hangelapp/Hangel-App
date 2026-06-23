'use client';

/**
 * EventAttendanceButton — etkinlik katılımcı listesi (kart üstünde buton + dialog).
 * "Katıl" diyen (RSVP status='going', vazgeçmemiş) herkesi PROFİL ismiyle listeler;
 * check-in yapanları yeşil işaretler. GET /api/events/[id]/attendance (organizatör/super-admin).
 */

import React, { useState } from 'react';
import { Users, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Person { uid: string; name: string; email: string; registered: boolean; checkedIn: boolean }

interface Props {
  eventId: string;
  eventName: string;
  authUser: { getIdToken: () => Promise<string> } | null;
  className?: string;
}

export function EventAttendanceButton({ eventId, eventName, authUser, className }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);

  const load = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/events/${eventId}/attendance`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.message || 'Liste alınamadı'); }
      const data = await res.json();
      setPeople(Array.isArray(data.people) ? data.people : []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Katılımcılar alınamadı', description: e instanceof Error ? e.message : 'Hata' });
    } finally { setLoading(false); }
  };

  const going = people.filter((p) => p.registered);
  const checkedInCount = people.filter((p) => p.checkedIn).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) void load(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Users className="mr-2 h-4 w-4" /> Katılımcılar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold leading-tight">{eventName} — Katılımcılar</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-muted/40 p-3 text-center">
                <p className="text-2xl font-black tabular-nums">{going.length}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Kayıtlı</p>
              </div>
              <div className="flex-1 rounded-2xl bg-emerald-500/10 p-3 text-center">
                <p className="text-2xl font-black tabular-nums text-emerald-600">{checkedInCount}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Check-in</p>
              </div>
            </div>
            {going.length === 0 ? (
              <p className="py-6 text-center text-sm font-medium text-muted-foreground">Henüz "Katıl" diyen yok.</p>
            ) : (
              <ul className="divide-y divide-border">
                {going.map((p) => (
                  <li key={p.uid} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0">
                      <span className="block break-words font-semibold">{p.name}</span>
                      {p.email && <span className="block truncate text-xs text-muted-foreground">{p.email}</span>}
                    </span>
                    {p.checkedIn && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Check-in yaptı
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
