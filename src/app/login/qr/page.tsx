'use client';

/**
 * /login/qr — "zaten üyeyim → telefonla bu cihazda (masaüstü/tablet) giriş" SAYFASI.
 *
 * Popup değil, tam sayfa (web.whatsapp.com deseni gibi: solda numaralı adımlar, sağda QR).
 * Akış: create → QR göster (origin/qr-login/{token}) → status poll → onaylanınca
 * signInWithCustomToken → (tarayıcı izni daha sorulmadıysa) bildirim açma teşviki →
 * güvenli `next` yoluna yönlendir. 5 dk TTL, tek kullanımlık.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { Loader2, RefreshCw, Smartphone, Bell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { registerForPushToken } from '@/lib/fcm';

// Açık-redirect koruması: yalnız aynı-origin relative yol (login/selection ile birebir).
function resolveNext(raw: string | null): string {
  if (!raw) return '/market';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/market';
  return raw;
}

const STEPS: React.ReactNode[] = [
  <>Telefonunda <strong>hangel</strong> uygulamasını aç.</>,
  <>Profil sayfasındaki <strong>QR tarayıcıyı</strong> aç.</>,
  <>Bu kodu telefonuna <strong>okut</strong>.</>,
  <>Telefonunda <strong>&quot;Giriş yap&quot;</strong>ı onayla.</>,
];

function QrLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveNext(searchParams.get('next'));
  const { toast } = useToast();

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [view, setView] = useState<'qr' | 'notifications'>('qr');
  const [notifBusy, setNotifBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (expiryRef.current) { clearTimeout(expiryRef.current); expiryRef.current = null; }
  }, []);

  const finish = useCallback(() => { router.replace(nextPath); }, [router, nextPath]);

  // Giriş başarılı → (izin daha hiç sorulmadıysa) bildirim açmaya teşvik; yoksa yönlendir.
  const afterLogin = useCallback(() => {
    const canPrompt = typeof Notification !== 'undefined' && Notification.permission === 'default';
    if (canPrompt) setView('notifications');
    else finish();
  }, [finish]);

  const start = useCallback(async () => {
    cleanup();
    setExpired(false);
    setQrDataUrl('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/qr-login/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error('create failed');
      const token = data.token as string;
      const url = `${window.location.origin}/qr-login/${token}`;
      const QRCode = (await import('qrcode')).default;
      setQrDataUrl(await QRCode.toDataURL(url, { width: 240, margin: 1 }));
      setLoading(false);
      pollRef.current = setInterval(async () => {
        try {
          const sres = await fetch(`/api/auth/qr-login/status?token=${token}`);
          const sdata = await sres.json();
          if (sdata.status === 'approved' && sdata.customToken) {
            cleanup();
            await signInWithCustomToken(getAuth(), sdata.customToken);
            afterLogin();
          } else if (sdata.status === 'expired') {
            cleanup();
            setExpired(true);
          }
        } catch { /* geçici hata — sonraki tick'te yeniden dener */ }
      }, 2500);
      expiryRef.current = setTimeout(() => { cleanup(); setExpired(true); }, 5 * 60 * 1000);
    } catch {
      setLoading(false);
      toast({ variant: 'destructive', title: 'QR oluşturulamadı', description: 'Lütfen tekrar dene.' });
    }
  }, [cleanup, afterLogin, toast]);

  useEffect(() => {
    void start();
    return cleanup;
  }, [start, cleanup]);

  const enableNotifications = async () => {
    setNotifBusy(true);
    try {
      const uid = getAuth().currentUser?.uid;
      if (uid) await registerForPushToken(uid);
    } catch { /* izin reddi/desteklenmiyor — sessiz, yine de yönlendir */ }
    setNotifBusy(false);
    finish();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-start bg-secondary p-4 pt-8">
      <div className="mb-4 flex w-full max-w-2xl items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-2xl" aria-label="Geri">
          <Link href="/login/selection"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <HangelLogo className="text-2xl" />
      </div>

      <div className="w-full max-w-2xl">
        <Card className="rounded-[2rem] border-none shadow-2xl">
          {view === 'qr' ? (
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-2xl font-black tracking-tight text-foreground">hangel&apos;i bu cihazda aç</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Telefonundaki <strong>hangel</strong> hesabınla bu cihaza (masaüstü/tablet) giriş yap — tekrar kod girmene gerek yok.
              </p>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Numaralı adımlar */}
                <ol className="flex-1 space-y-4">
                  {STEPS.map((stepText, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-snug">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0">{stepText}</span>
                    </li>
                  ))}
                </ol>

                {/* QR */}
                <div className="flex shrink-0 items-center justify-center">
                  {loading ? (
                    <div className="flex h-[240px] w-[240px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : expired ? (
                    <div className="flex h-[240px] w-[240px] flex-col items-center justify-center gap-3 text-center">
                      <p className="text-sm text-muted-foreground">Kodun süresi doldu.</p>
                      <Button onClick={() => void start()}><RefreshCw className="mr-2 h-4 w-4" /> Yeni Kod</Button>
                    </div>
                  ) : qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="hangel QR giriş kodu" width={240} height={240} className="rounded-2xl border" />
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <Smartphone className="h-4 w-4 shrink-0" />
                Kodu telefonundaki <strong className="mx-1">hangel</strong> uygulamasının QR tarayıcısıyla okut.
              </div>
              <div className="mt-3 text-center">
                <Link href="/login/selection" className="text-sm font-semibold text-primary underline underline-offset-4">
                  Telefon numarası ile giriş yap
                </Link>
              </div>
            </CardContent>
          ) : (
            // Giriş sonrası bildirim teşviki
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-foreground">Bildirimleri aç</h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                Etkinlik, bağış ve mesaj güncellemelerini kaçırma — önemli gelişmeleri anında bildirelim.
              </p>
              <div className="flex w-full max-w-xs flex-col gap-2 pt-1">
                <Button onClick={enableNotifications} disabled={notifBusy}>
                  {notifBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                  Bildirimleri Aç
                </Button>
                <Button variant="ghost" onClick={finish} disabled={notifBusy}>Şimdi değil</Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function QrLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <QrLoginPageInner />
    </Suspense>
  );
}
