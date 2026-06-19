'use client';

/**
 * Etkinlik QR tarama landing'i — /e/{id}/kayit ve /e/{id}/checkin.
 *
 * Giriş yapan kullanıcı QR'ı okutunca buraya gelir; otomatik kayıt (RSVP) ya da
 * check-in yapılır, sonuç gösterilir. Check-in başarısında konfeti + haptik.
 * Giriş yoksa giriş butonu (sonra geri döner).
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, LogIn, CalendarCheck, PartyPopper } from 'lucide-react';

type Mode = 'kayit' | 'checkin';
type State = 'init' | 'working' | 'success' | 'already' | 'error' | 'login';

export function EventAction({ eventId, mode }: { eventId: string; mode: Mode }) {
  const { user, isUserLoading } = useUser();
  const [state, setState] = useState<State>('init');
  const [msg, setMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (isUserLoading || ran.current) return;
    if (!user) { setState('login'); return; }
    ran.current = true;
    (async () => {
      setState('working');
      try {
        const token = await user.getIdToken();
        const res = mode === 'kayit'
          ? await fetch(`/api/events/${eventId}/rsvp`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'going' }) })
          : await fetch(`/api/clip/checkin`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ eventId, source: 'qr' }) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(body.message || 'İşlem tamamlanamadı. Etkinlik penceresi kapalı olabilir.');
          setState('error');
          return;
        }
        if (body.already) {
          setState('already');
        } else {
          setState('success');
          if (mode === 'checkin') import('@/lib/celebrate').then((m) => m.celebrate()).catch(() => undefined);
        }
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Bağlantı hatası.');
        setState('error');
      }
    })();
  }, [user, isUserLoading, mode, eventId]);

  const title = mode === 'kayit' ? 'Etkinliğe Kayıt' : 'Etkinlik Check-in';
  const nextPath = `/e/${eventId}/${mode}`;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-8 text-center shadow-xl">
        {(state === 'init' || state === 'working' || isUserLoading) && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">İşleniyor…</p>
          </>
        )}

        {state === 'login' && (
          <>
            <LogIn className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Devam etmek için hangel hesabınla giriş yap.</p>
            <Button asChild className="mt-5 w-full">
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Giriş Yap</Link>
            </Button>
          </>
        )}

        {state === 'success' && (
          <>
            {mode === 'checkin' ? <PartyPopper className="mx-auto mb-4 h-14 w-14 text-emerald-500" /> : <CalendarCheck className="mx-auto mb-4 h-14 w-14 text-emerald-500" />}
            <h1 className="text-2xl font-black">{mode === 'kayit' ? 'Kaydın alındı! 🧡' : 'Check-in yapıldı! 🧡'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'kayit' ? 'Etkinliğe kaydoldun. Görüşmek üzere!' : 'Katılımın kaydedildi, impact puanın eklendi.'}
            </p>
            <Button asChild variant="outline" className="mt-5 w-full"><Link href={`/events/${eventId}`}>Etkinliği Gör</Link></Button>
          </>
        )}

        {state === 'already' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
            <h1 className="text-xl font-bold">{mode === 'kayit' ? 'Zaten kayıtlısın ✓' : 'Zaten check-in yapmışsın ✓'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tekrar işleme gerek yok.</p>
            <Button asChild variant="outline" className="mt-5 w-full"><Link href={`/events/${eventId}`}>Etkinliği Gör</Link></Button>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h1 className="text-xl font-bold">Olmadı</h1>
            <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
            <Button onClick={() => { ran.current = false; setState('init'); }} variant="outline" className="mt-5 w-full">Tekrar Dene</Button>
          </>
        )}
      </div>
    </div>
  );
}
