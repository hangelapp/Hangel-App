'use client';

/**
 * Gönüllülük QR tarama landing'i — /v/{id}/checkin.
 *
 * Giriş yapan gönüllü, STK'nın kapıda gösterdiği QR'ı okutunca buraya gelir;
 * otomatik YOKLAMA (check-in) yapılır ve sonuç gösterilir. Başarıda konfeti.
 * Giriş yoksa giriş butonu (sonra geri döner). Onaysız başvuruda net mesaj.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { endStoredLiveActivity } from '@/lib/native-live-activity';
import { Loader2, CheckCircle2, XCircle, LogIn, PartyPopper } from 'lucide-react';

type State = 'init' | 'working' | 'success' | 'already' | 'error' | 'login';

export function VolunteerAction({ volunteeringId }: { volunteeringId: string }) {
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
        // Konum (varsa) — zorunlu değil; geofence yok, sadece kayda geçer.
        let location: { latitude: number; longitude: number } | undefined;
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('no geo')); return; }
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, maximumAge: 60000 });
          });
          location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch { /* konum yok — sorun değil */ }

        const res = await fetch(`/api/volunteering/${volunteeringId}/checkin`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ source: 'qr', ...(location ? { location } : {}) }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(body.message || 'İşlem tamamlanamadı.');
          setState('error');
          return;
        }
        if (body.already) {
          setState('already');
        } else {
          setState('success');
          import('@/lib/celebrate').then((m) => m.celebrate()).catch(() => undefined);
        }
        // Yoklama başarılı (yeni ya da zaten) → kilit ekranı Live Activity'yi sonlandır (native; web no-op).
        void endStoredLiveActivity('vol', volunteeringId);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Bağlantı hatası.');
        setState('error');
      }
    })();
  }, [user, isUserLoading, volunteeringId]);

  const nextPath = `/v/${volunteeringId}/checkin`;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-8 text-center shadow-xl">
        {(state === 'init' || state === 'working' || isUserLoading) && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h1 className="text-xl font-bold">Gönüllü Yoklama</h1>
            <p className="mt-1 text-sm text-muted-foreground">İşleniyor…</p>
          </>
        )}

        {state === 'login' && (
          <>
            <LogIn className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="text-xl font-bold">Gönüllü Yoklama</h1>
            <p className="mt-2 text-sm text-muted-foreground">Devam etmek için hangel hesabınla giriş yap.</p>
            <Button asChild className="mt-5 w-full">
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Giriş Yap</Link>
            </Button>
          </>
        )}

        {state === 'success' && (
          <>
            <PartyPopper className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
            <h1 className="text-2xl font-black">Yoklaman alındı! 🧡</h1>
            <p className="mt-2 text-sm text-muted-foreground">Geldiğin kaydedildi. STK yöneticisi görecek — iyi gönüllülükler!</p>
            <Button asChild variant="outline" className="mt-5 w-full"><Link href={`/volunteering/${volunteeringId}`}>İlanı Gör</Link></Button>
          </>
        )}

        {state === 'already' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
            <h1 className="text-xl font-bold">Zaten yoklamadasın ✓</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tekrar işleme gerek yok.</p>
            <Button asChild variant="outline" className="mt-5 w-full"><Link href={`/volunteering/${volunteeringId}`}>İlanı Gör</Link></Button>
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
