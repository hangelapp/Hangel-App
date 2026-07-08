'use client';

/**
 * EventCheckinScanButton — etkinlik detay sayfasında "Check-in Yap" butonu.
 * Tıklanınca kamera açılır, kapıdaki Check-in QR'ını (…/e/{id}/checkin) okur ve
 * POST /api/clip/checkin ile check-in yapar. QR'dan okunan etkinlik id'si sayfadaki
 * etkinlikle eşleşmiyorsa uyarır (yanlış etkinlik QR'ı). Kamera açılmazsa, kullanıcı
 * zaten bu etkinliğin sayfasında olduğundan "QR'sız check-in" seçeneği sunulur.
 *
 * Kamera/QR motoru qr-scan-dialog.tsx kalıbından uyarlandı (native ML Kit + jsQR).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { scanQrNative } from '@/lib/native-qr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import { celebrate } from '@/lib/celebrate';

// QR içeriğinden etkinlik id'sini çöz: …/e/{id}/checkin  → id
function eventIdFromQr(raw: string): string | null {
  const m = raw.match(/\/e\/([^/?#]+)\/checkin/i);
  return m ? decodeURIComponent(m[1]) : null;
}

export function EventCheckinScanButton({
  eventId,
  className,
  disabled,
}: {
  eventId: string;
  className?: string;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState<'scanning' | 'submitting' | 'done' | 'error'>('scanning');
  const [errMsg, setErrMsg] = useState('');

  const useNativeScan =
    Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('BarcodeScanner');

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  // Check-in çağrısı — okunan QR'ın etkinlik id'si (varsa) sayfadaki ile eşleşmeli.
  const doCheckin = useCallback(async (scannedId: string | null) => {
    if (!user) { setStatus('error'); setErrMsg('Check-in için giriş yapmalısın.'); return; }
    if (scannedId && scannedId !== eventId) {
      setStatus('error');
      setErrMsg('Bu QR farklı bir etkinliğe ait. Lütfen bu etkinliğin check-in QR kodunu okut.');
      return;
    }
    setStatus('submitting');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/clip/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, source: 'qr' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus('error'); setErrMsg(data?.message || data?.errorCode || 'Check-in yapılamadı.'); return; }
      setStatus('done');
      celebrate();
      toast({ title: 'Check-in yapıldı! 🧡', description: 'Katılımın kaydedildi.' });
      setTimeout(() => setOpen(false), 1600);
    } catch { setStatus('error'); setErrMsg('Bağlantı hatası. Tekrar dene.'); }
  }, [user, eventId, toast]);

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
        const scannedId = eventIdFromQr(code.data);
        if (scannedId) { handledRef.current = true; stop(); void doCheckin(scannedId); return; }
      }
      rafRef.current = requestAnimationFrame(scan);
    };
    const tryGetStream = async (): Promise<MediaStream> => {
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'environment' } } },
        { video: { facingMode: 'environment' } },
        { video: true },
      ];
      let lastErr: unknown;
      for (const c of attempts) {
        try { return await navigator.mediaDevices.getUserMedia(c); } catch (e) { lastErr = e; }
      }
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cams = devs.filter((d) => d.kind === 'videoinput');
        const back = cams.find((d) => /back|rear|arka|environment/i.test(d.label)) || cams[cams.length - 1];
        if (back?.deviceId) return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: back.deviceId } } });
      } catch (e) { lastErr = e; }
      throw lastErr ?? new Error('no-stream');
    };
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-getusermedia');
      let stream: MediaStream;
      try {
        stream = await tryGetStream();
      } catch (e1) {
        const n = (e1 as { name?: string } | null)?.name;
        if (n === 'NotAllowedError' || n === 'NotReadableError' || n === 'AbortError') {
          await new Promise((r) => setTimeout(r, 1000));
          stream = await tryGetStream();
        } else { throw e1; }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* autoplay devralır */ }
      }
      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      setStatus('error');
      const name = (e as { name?: string } | null)?.name;
      setErrMsg(
        name === 'NotAllowedError'
          ? 'Kamera izni reddedildi. Ayarlar → hangel → İzinler → Kamera açık olmalı.'
          : name === 'NotFoundError'
            ? 'Kamera bulunamadı.'
            : 'Kameraya erişilemedi. QR olmadan da check-in yapabilirsin.',
      );
    }
  }, [doCheckin, stop]);

  const runNativeScan = useCallback(async () => {
    handledRef.current = false;
    setStatus('scanning');
    setErrMsg('');
    const raw = await scanQrNative();
    if (handledRef.current) return;
    if (raw == null) { setStatus('error'); setErrMsg('Tarama tamamlanmadı. QR olmadan da check-in yapabilirsin.'); return; }
    const scannedId = eventIdFromQr(raw);
    if (scannedId) { handledRef.current = true; void doCheckin(scannedId); }
    else { setStatus('error'); setErrMsg('Bu bir hangel check-in QR kodu değil.'); }
  }, [doCheckin]);

  useEffect(() => {
    if (!open) { stop(); return; }
    if (useNativeScan) void runNativeScan();
    else void startCam();
    return stop;
  }, [open, useNativeScan, runNativeScan, startCam, stop]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={disabled}
        onClick={() => { setStatus('scanning'); setOpen(true); }}
      >
        <QrCode className="h-5 w-5 mr-2" /> Check-in Yap
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check-in Yap</DialogTitle>
            <DialogDescription>Etkinlik girişindeki check-in QR kodunu kameraya göster.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {status === 'done' ? (
              <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="font-semibold">Check-in yapıldı 🧡</p>
              </div>
            ) : status === 'error' ? (
              <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center px-2">
                <p className="text-sm text-muted-foreground">{errMsg}</p>
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={() => void (useNativeScan ? runNativeScan() : startCam())}>Tekrar Dene</Button>
                  {/* Kullanıcı zaten bu etkinliğin sayfasında → QR olmadan check-in. */}
                  <Button variant="outline" onClick={() => void doCheckin(null)}>QR olmadan check-in yap</Button>
                </div>
              </div>
            ) : (
              <div className="relative h-[260px] w-full overflow-hidden rounded-xl bg-black">
                {useNativeScan ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="px-4 text-center text-sm">Kamera açılıyor… QR kodu çerçeveye getir.</p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                    <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80" />
                  </>
                )}
                {status === 'submitting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
