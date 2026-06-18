'use client';

/**
 * QrScanDialog — WhatsApp tarzı: giriş yapmış kullanıcı, başka cihazdaki (masaüstü)
 * giriş ekranındaki QR'ı kamerayla okutur → o cihaz giriş yapar.
 *
 * QR içeriği: <origin>/qr-login/{token}. Token çözülür → /api/auth/qr-login/approve
 * (Bearer idToken) çağrılır. jsQR ile her kamera karesi taranır (iOS dahil çalışır).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function QrScanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState<'scanning' | 'approving' | 'done' | 'error'>('scanning');
  const [errMsg, setErrMsg] = useState('');

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  const approve = useCallback(async (token: string) => {
    if (!user) { setStatus('error'); setErrMsg('Önce bu cihazda giriş yapmalısın.'); return; }
    setStatus('approving');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/auth/qr-login/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus('error'); setErrMsg(data?.message || 'Onaylanamadı.'); return; }
      setStatus('done');
      toast({ title: 'Giriş onaylandı 🧡', description: 'Diğer cihazda giriş yapılıyor.' });
      setTimeout(() => onOpenChange(false), 1500);
    } catch { setStatus('error'); setErrMsg('Bağlantı hatası.'); }
  }, [user, toast, onOpenChange]);

  const startCam = useCallback(async () => {
    handledRef.current = false;
    setStatus('scanning');
    setErrMsg('');
    const scan = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(scan); return; }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx || canvas.width === 0) { rafRef.current = requestAnimationFrame(scan); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data && !handledRef.current) {
        const m = code.data.match(/\/qr-login\/([a-f0-9]+)/i);
        if (m) { handledRef.current = true; stop(); void approve(m[1]); return; }
      }
      rafRef.current = requestAnimationFrame(scan);
    };
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-getusermedia');
      // Bazı WebView'ler facingMode obje constraint'ini reddeder → sırayla dene.
      const tries: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'environment' } } },
        { video: true },
      ];
      let stream: MediaStream | null = null;
      let lastErr: unknown;
      for (const c of tries) {
        try { stream = await navigator.mediaDevices.getUserMedia(c); break; } catch (e) { lastErr = e; }
      }
      if (!stream) throw lastErr ?? new Error('no-stream');
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      setStatus('error');
      const name = (e as { name?: string } | null)?.name;
      setErrMsg(
        name === 'NotAllowedError'
          ? 'Kamera izni reddedildi. Telefon Ayarlar → Uygulamalar → hangel → İzinler → Kamera açık olmalı.'
          : name === 'NotFoundError'
            ? 'Kamera bulunamadı.'
            : 'Kameraya erişilemedi. Uygulamayı en son sürüme güncelleyip tekrar dene.',
      );
    }
  }, [approve, stop]);

  useEffect(() => {
    if (open) void startCam();
    else stop();
    return stop;
  }, [open, startCam, stop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Okut</DialogTitle>
          <DialogDescription>Bilgisayardaki giriş ekranındaki QR kodunu kameraya göster.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {status === 'done' ? (
            <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold">Giriş onaylandı</p>
            </div>
          ) : status === 'error' ? (
            <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">{errMsg}</p>
              <Button onClick={() => void startCam()}>Tekrar Dene</Button>
            </div>
          ) : (
            <div className="relative h-[260px] w-full overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80" />
              {status === 'approving' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
