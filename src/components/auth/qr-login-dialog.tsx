'use client';

/**
 * QrLoginDialog — "zaten üyeyim → telefonla bu cihazda (masaüstü/tablet) giriş".
 *
 * create → QR göster (origin/qr-login/{token}) → status poll → onaylanınca
 * custom token ile signInWithCustomToken → giriş sonrası bildirim açma teşviki →
 * onSuccess. 5 dk TTL, tek kullanımlık.
 *
 * UX: başlık "hangel'i bu cihazda aç" + QR'ın yanında numaralı adımlar (net, sade);
 * giriş başarılı olunca (tarayıcı izni daha sorulmadıysa) bildirim açmaya teşvik eder.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Smartphone, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerForPushToken } from '@/lib/fcm';

export function QrLoginDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
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

  // Giriş başarılı → bildirim açmaya teşvik et (yalnız izin daha hiç
  // sorulmadıysa; verildi/reddedildiyse doğrudan tamamla).
  const afterLogin = useCallback(() => {
    const canPrompt = typeof Notification !== 'undefined' && Notification.permission === 'default';
    if (canPrompt) setView('notifications');
    else onSuccess();
  }, [onSuccess]);

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
      setQrDataUrl(await QRCode.toDataURL(url, { width: 220, margin: 1 }));
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
    if (open) { setView('qr'); void start(); }
    else cleanup();
    return cleanup;
  }, [open, start, cleanup]);

  const enableNotifications = async () => {
    setNotifBusy(true);
    try {
      const uid = getAuth().currentUser?.uid;
      if (uid) await registerForPushToken(uid);
    } catch { /* izin reddi/desteklenmiyor — sessiz, yine de tamamla */ }
    setNotifBusy(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {view === 'qr' ? (
          <>
            <DialogHeader>
              <DialogTitle>hangel&apos;i bu cihazda aç</DialogTitle>
              <DialogDescription>
                Telefonundaki <strong>hangel</strong> hesabınla bu cihaza (masaüstü/tablet) giriş yap — tekrar kod girmene gerek yok.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-2 sm:flex-row sm:items-center">
              {/* Adımlar — QR'ın yanında numaralı, net */}
              <ol className="flex-1 space-y-3.5">
                {[
                  <>Telefonunda <strong>hangel</strong> uygulamasını aç.</>,
                  <>Profil sayfasındaki <strong>QR tarayıcıyı</strong> aç.</>,
                  <>Bu kodu telefonuna <strong>okut</strong>.</>,
                  <>Telefonunda <strong>&quot;Giriş yap&quot;</strong>ı onayla.</>,
                ].map((stepText, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-snug">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0">{stepText}</span>
                  </li>
                ))}
              </ol>

              {/* QR */}
              <div className="flex shrink-0 items-center justify-center sm:w-[220px]">
                {loading ? (
                  <div className="flex h-[220px] w-[220px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : expired ? (
                  <div className="flex h-[220px] w-[220px] flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">Kodun süresi doldu.</p>
                    <Button onClick={() => void start()}><RefreshCw className="mr-2 h-4 w-4" /> Yeni Kod</Button>
                  </div>
                ) : qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="hangel QR giriş kodu" width={220} height={220} className="rounded-xl border" />
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] font-medium text-muted-foreground">
              <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Kodu telefonundaki <strong>hangel</strong> uygulamasının QR tarayıcısıyla okut.</span>
            </div>
          </>
        ) : (
          // Giriş sonrası bildirim teşviki
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-center">Bildirimleri aç</DialogTitle>
              <DialogDescription className="text-center">
                Etkinlik, bağış ve mesaj güncellemelerini kaçırma — önemli gelişmeleri anında bildirelim.
              </DialogDescription>
            </DialogHeader>
            <div className="flex w-full flex-col gap-2 pt-1">
              <Button onClick={enableNotifications} disabled={notifBusy}>
                {notifBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Bildirimleri Aç
              </Button>
              <Button variant="ghost" onClick={onSuccess} disabled={notifBusy}>Şimdi değil</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
