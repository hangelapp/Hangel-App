'use client';

/**
 * QrScanDialog — WhatsApp tarzı: giriş yapmış kullanıcı, başka cihazdaki (masaüstü)
 * giriş ekranındaki QR'ı kamerayla okutur → o cihaz giriş yapar.
 *
 * QR içeriği: <origin>/qr-login/{token}. Token çözülür → /api/auth/qr-login/approve
 * (Bearer idToken) çağrılır. jsQR ile her kamera karesi taranır (iOS dahil çalışır).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { scanQrNative } from '@/lib/native-qr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Loader2, CheckCircle2, KeyRound } from 'lucide-react';

export function QrScanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState<'scanning' | 'approving' | 'done' | 'error'>('scanning');
  const [errMsg, setErrMsg] = useState('');
  const [showCode, setShowCode] = useState(false); // kamerasız: kodu elle gir
  const [codeInput, setCodeInput] = useState('');
  // Yalnız ANDROID native'de VE ML Kit plugin'i bu build'de MEVCUTSA native tarayıcı
  // kullan: eski/OEM Android WebView'ları getUserMedia'yı düzgün desteklemiyordu.
  // isPluginAvailable kontrolü kritik → henüz yeni APK'yı kurmamış (plugin'siz) eski
  // kurulumlarda otomatik olarak eski getUserMedia+jsQR yoluna düşer (gerileme yok).
  // iOS WKWebView getUserMedia'sı zaten sağlam → iOS + web bu yolda kalır.
  const useNativeScan =
    Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('BarcodeScanner');

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

  // Check-in QR'ı okununca (…/e/{id}/checkin): etkinliğe check-in yap. Header'daki
  // QR aracı hem giriş hem check-in QR'larını tanır.
  const checkin = useCallback(async (eventId: string) => {
    if (!user) { setStatus('error'); setErrMsg('Check-in için giriş yapmalısın.'); return; }
    setStatus('approving');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/clip/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, source: 'qr' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus('error'); setErrMsg(data?.message || 'Check-in yapılamadı.'); return; }
      setStatus('done');
      toast({ title: 'Check-in yapıldı! 🧡', description: 'Katılımın kaydedildi.' });
      setTimeout(() => onOpenChange(false), 1500);
    } catch { setStatus('error'); setErrMsg('Bağlantı hatası.'); }
  }, [user, toast, onOpenChange]);

  // Sertifika doğrulama QR'ı (…/c/{code}) veya kayıt/davet QR'ı
  // (…/login/selection?action=register…) okununca ilgili herkese-açık sayfaya
  // yönlendir. Bu QR'lar bir EYLEM değil NAVİGASYON'dur; dialog'u kapatıp git.
  const navigateTo = useCallback((path: string) => {
    setStatus('done');
    stop();
    onOpenChange(false);
    router.push(path);
  }, [router, onOpenChange, stop]);

  // QR içeriğini işle: giriş → check-in → sertifika doğrulama → kayıt/davet.
  // Eşleşme yoksa false (bilinmeyen QR mesajı gösterilir).
  const handleRaw = useCallback((raw: string): boolean => {
    const login = raw.match(/\/qr-login\/([a-f0-9]+)/i);
    if (login) { void approve(login[1]); return true; }
    const ci = raw.match(/\/e\/([^/?#]+)\/checkin/i);
    if (ci) { void checkin(decodeURIComponent(ci[1])); return true; }
    // Sertifika doğrulama: https://hangel.org/c/{code} (herkese açık, giriş gerekmez)
    const cert = raw.match(/\/c\/([A-Za-z0-9-]+)/);
    if (cert) { navigateTo(`/c/${cert[1]}`); return true; }
    // Kayıt / STK-davet QR'ı: …/login/selection?action=register&ref=…
    const reg = raw.match(/\/login\/selection\?([^#]*action=register[^#]*)/i);
    if (reg) { navigateTo(`/login/selection?${reg[1]}`); return true; }
    return false;
  }, [approve, checkin, navigateTo]);

  // Kamerasız cihaz: diğer cihazın ekranındaki KODU elle girip onaylar.
  const submitCode = useCallback(async () => {
    const c = codeInput.trim().toUpperCase().replace(/\s+/g, '');
    if (c.length < 4) return;
    if (!user) { setStatus('error'); setErrMsg('Önce bu cihazda giriş yapmalısın.'); return; }
    stop();
    setStatus('approving');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/auth/qr-login/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus('error'); setErrMsg(data?.message || 'Kod onaylanamadı.'); return; }
      setStatus('done');
      toast({ title: 'Giriş onaylandı 🧡', description: 'Diğer cihazda giriş yapılıyor.' });
      setTimeout(() => onOpenChange(false), 1500);
    } catch { setStatus('error'); setErrMsg('Bağlantı hatası.'); }
  }, [codeInput, user, toast, onOpenChange, stop]);

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
        if (handleRaw(code.data)) { handledRef.current = true; stop(); return; }
      }
      rafRef.current = requestAnimationFrame(scan);
    };
    // Akış almayı çok kademeli dener (bazı Android WebView'leri facingMode obje
    // constraint'ini, bazıları string'i reddeder; son çare deviceId ile arka kamera).
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
      // deviceId fallback: cihazları say, arka kamerayı seç.
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
        // İzin diyaloğu YENİ cevaplanmış olabilir (Android runtime izni) → kısa
        // bekleyip BİR kez daha dene. Bu, "ilk açılışta kamera açılmıyor" vakasını çözer.
        const n = (e1 as { name?: string } | null)?.name;
        if (n === 'NotAllowedError' || n === 'NotReadableError' || n === 'AbortError') {
          await new Promise((r) => setTimeout(r, 1000));
          stream = await tryGetStream();
        } else { throw e1; }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // play() bazı Android WebView'lerde reddeder → autoplay+muted devralır, FATAL DEĞİL.
        try { await videoRef.current.play(); } catch { /* autoplay devralır */ }
      }
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
  }, [handleRaw, stop]);

  // Native: ML Kit tam-ekran tarayıcıyı aç, okunan QR'ı işle (WebView kamerası kullanılmaz).
  const runNativeScan = useCallback(async () => {
    handledRef.current = false;
    setStatus('scanning');
    setErrMsg('');
    const raw = await scanQrNative();
    if (handledRef.current) return;
    if (raw == null) {
      setStatus('error');
      setErrMsg('Tarama tamamlanmadı ya da kameraya erişilemedi. Tekrar dene.');
      return;
    }
    if (handleRaw(raw)) { handledRef.current = true; }
    else { setStatus('error'); setErrMsg('Bu bir hangel giriş, check-in, sertifika veya kayıt QR kodu değil.'); }
  }, [handleRaw]);

  useEffect(() => {
    if (!open) { stop(); return; }
    if (useNativeScan) void runNativeScan();
    else void startCam();
    return stop;
  }, [open, useNativeScan, runNativeScan, startCam, stop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Okut</DialogTitle>
          <DialogDescription>Giriş, etkinlik check-in, sertifika doğrulama veya kayıt/davet QR&apos;ını kameraya göster.</DialogDescription>
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
              {status === 'approving' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
              )}
            </div>
          )}

          {/* Kamerasız cihaz: diğer cihazın ekranındaki kodu elle gir. */}
          {(status === 'scanning' || status === 'approving') && (
            <div className="w-full pt-1">
              {!showCode ? (
                <button
                  onClick={() => { stop(); setShowCode(true); }}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Kamera açılmıyor mu? <span className="text-primary underline underline-offset-2">Kodu gir</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') void submitCode(); }}
                    placeholder="EKRANDAKİ KOD"
                    maxLength={8}
                    autoFocus
                    className="text-center font-mono text-lg font-bold uppercase tracking-[0.25em]"
                  />
                  <Button onClick={() => void submitCode()} disabled={codeInput.trim().length < 4}>Onayla</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
