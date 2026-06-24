'use client';

/**
 * QrLoginDialog — masaüstünde "zaten üyeyim → QR ile giriş".
 *
 * create → QR göster (origin/qr-login/{token}) → status poll → onaylanınca
 * custom token ile signInWithCustomToken → onSuccess. 5 dk TTL, tek kullanımlık.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (expiryRef.current) { clearTimeout(expiryRef.current); expiryRef.current = null; }
  }, []);

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
            onSuccess();
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
  }, [cleanup, onSuccess, toast]);

  useEffect(() => {
    if (open) void start();
    else cleanup();
    return cleanup;
  }, [open, start, cleanup]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>hangel uygulamasıyla giriş</DialogTitle>
          <DialogDescription>
            Telefonundaki <strong>hangel uygulamasını</strong> aç, QR tarayıcıyla aşağıdaki kodu okut ve girişi onayla.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {loading ? (
            <div className="flex h-[240px] w-[240px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : expired ? (
            <div className="flex h-[240px] w-[240px] flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Kodun süresi doldu.</p>
              <Button onClick={() => void start()}><RefreshCw className="mr-2 h-4 w-4" /> Yeni Kod</Button>
            </div>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR giriş kodu" width={240} height={240} className="rounded-xl border" />
          ) : null}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="h-4 w-4 shrink-0" /> hangel uygulaman → QR tarayıcıyla okut → &quot;Onayla&quot;
            </div>
            <p className="text-[11px] font-medium text-amber-600">
              Bu, WhatsApp QR&apos;ı değildir — kendi <strong>hangel</strong> uygulamandaki QR tarayıcıyı kullan.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
