'use client';

/**
 * VolunteeringCheckinButton — gönüllülük detay sayfasında ONAYLI gönüllüye "Check-in Yap".
 * Tıklanınca kamera açılır, kapıdaki Check-in QR'ını (…/v/{id}/checkin) okur ve
 * POST /api/volunteering/{id}/checkin ile yoklamaya girer. Kamera açılmazsa,
 * yöneticinin ekranındaki 6 haneli QR'sız kodu girerek de check-in yapılabilir.
 *
 * NOT: Yoklamaya YALNIZ onaylı gönüllüler girer (sunucu applications:Onaylandı
 * şartını uygular); kod, o şartı BYPASS etmez — ek "geldi" kanıtıdır.
 *
 * Kamera/QR motoru event-checkin-scan-button.tsx kalıbından uyarlandı (native ML Kit + jsQR).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { scanQrNative } from '@/lib/native-qr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { UserCheck, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { celebrate } from '@/lib/celebrate';
import { checkinCodeFor, normalizeCode } from '@/lib/checkin-code';
import { endStoredLiveActivity } from '@/lib/native-live-activity';

// QR içeriğinden ilan id'sini çöz: …/v/{id}/checkin  → id
function oppIdFromQr(raw: string): string | null {
  const m = raw.match(/\/v\/([^/?#]+)\/checkin/i);
  return m ? decodeURIComponent(m[1]) : null;
}

export function VolunteeringCheckinButton({
  oppId,
  className,
  disabled,
  open: controlledOpen,
  onOpenChange,
}: {
  oppId: string;
  className?: string;
  disabled?: boolean;
  // Kontrollü açılış (opsiyonel) — verilmezse dahili state (mevcut davranış).
  // ?checkin=1 ile detay sayfasından dışarıdan açmak için.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState<'scanning' | 'submitting' | 'done' | 'error'>('scanning');
  const [errMsg, setErrMsg] = useState('');
  const [code, setCode] = useState('');

  const useNativeScan =
    Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('BarcodeScanner');

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  // Yoklama çağrısı — okunan QR'ın ilan id'si (varsa) sayfadaki ile eşleşmeli.
  // opts.source: 'qr' (varsayılan) ya da 'code' (kodla giriş; sunucuya kod da gider).
  const doCheckin = useCallback(async (
    scannedId: string | null,
    opts?: { source?: 'qr' | 'code'; code?: string },
  ) => {
    if (!user) { setStatus('error'); setErrMsg('Check-in için giriş yapmalısın.'); return; }
    if (scannedId && scannedId !== oppId) {
      setStatus('error');
      setErrMsg('Bu QR farklı bir ilana ait. Lütfen bu ilanın check-in QR kodunu okut.');
      return;
    }
    setStatus('submitting');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/volunteering/${oppId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          source: opts?.source ?? 'qr',
          ...(opts?.source === 'code' ? { code: opts.code } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus('error'); setErrMsg(data?.message || 'Check-in yapılamadı.'); return; }
      setStatus('done');
      celebrate();
      toast({
        title: data?.already ? 'Zaten check-in yapmışsın 🧡' : 'Check-in yapıldı! 🧡',
        description: 'Yoklaman kaydedildi.',
      });
      // Yoklama alındı → kilit ekranı Live Activity'yi sonlandır (native; web no-op).
      void endStoredLiveActivity('vol', oppId);
      setTimeout(() => setOpen(false), 1600);
    } catch { setStatus('error'); setErrMsg('Bağlantı hatası. Tekrar dene.'); }
  }, [user, oppId, toast]);

  // Kod ile check-in — önce istemcide karşılaştır (yanlışsa sunucuya gitme),
  // eşleşirse QR yolunun aynısını 'code' kaynağıyla çağır (sunucu da doğrular +
  // onaylı gönüllü şartını korur).
  const doCodeCheckin = useCallback(() => {
    const entered = normalizeCode(code);
    if (entered.length === 0) { toast({ variant: 'destructive', title: 'Kod gir' }); return; }
    if (entered !== checkinCodeFor('volunteering', oppId)) {
      toast({ variant: 'destructive', title: 'Kod hatalı', description: 'Yöneticinin ekranındaki kodu kontrol et.' });
      return;
    }
    void doCheckin(null, { source: 'code', code: entered });
  }, [code, oppId, doCheckin, toast]);

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
      const qr = jsQR(img.data, img.width, img.height);
      if (qr?.data && !handledRef.current) {
        const scannedId = oppIdFromQr(qr.data);
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
            : 'Kameraya erişilemedi. Kod ile de check-in yapabilirsin.',
      );
    }
  }, [doCheckin, stop]);

  const runNativeScan = useCallback(async () => {
    handledRef.current = false;
    setStatus('scanning');
    setErrMsg('');
    const raw = await scanQrNative();
    if (handledRef.current) return;
    if (raw == null) { setStatus('error'); setErrMsg('Tarama tamamlanmadı. Kod ile de check-in yapabilirsin.'); return; }
    const scannedId = oppIdFromQr(raw);
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
        size="lg"
        variant="secondary"
        className={className}
        disabled={disabled}
        onClick={() => { setStatus('scanning'); setCode(''); setOpen(true); }}
        aria-label="Check-in Yap"
        title="Check-in Yap"
      >
        <UserCheck className="h-5 w-5 shrink-0" />
        <span className="text-[11px] text-center leading-tight break-words">Check-in</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check-in Yap</DialogTitle>
            <DialogDescription>İlan girişindeki check-in QR kodunu kameraya göster.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {status === 'done' ? (
              <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="font-semibold">Check-in yapıldı 🧡</p>
              </div>
            ) : status === 'error' ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 text-center px-2">
                <p className="text-sm text-muted-foreground">{errMsg}</p>
                <Button onClick={() => void (useNativeScan ? runNativeScan() : startCam())}>Tekrar Dene</Button>
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

            {/* Kod ile check-in — kamera/QR çalışmasa da her zaman görünür (bitince gizle). */}
            {status !== 'done' && (
              <div className="w-full space-y-2 border-t pt-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <KeyRound className="h-4 w-4 text-primary" /> Kod ile check-in
                </p>
                <p className="text-xs text-muted-foreground">Kamera açılmıyorsa, yöneticinin ekranındaki 6 haneli kodu gir.</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') doCodeCheckin(); }}
                    inputMode="text"
                    autoCapitalize="characters"
                    maxLength={6}
                    placeholder="ABC123"
                    className="text-center font-mono text-lg tracking-[0.3em] uppercase"
                    disabled={status === 'submitting'}
                  />
                  <Button type="button" onClick={doCodeCheckin} disabled={status === 'submitting'}>
                    Kod ile Check-in
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
