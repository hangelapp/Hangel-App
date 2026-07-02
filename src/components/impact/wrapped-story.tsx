'use client';

/**
 * Etki Hikayem — Instagram-story tarzı TAM EKRAN animasyonlu oynatıcı.
 *
 * Wrapped metriklerini ("Bu ay 12 saat", "3 cana dokundun", en çok katkı alanı...)
 * tek tek, otomatik ilerleyen sahneler halinde gösterir. Üstte IG-tarzı segment
 * progress bar'ları (story-progress animasyonu), Apple geçişleri (fade/scale/spring),
 * marka mercanı + turuncu kalp, "umudu büyütüyoruz" tonu.
 *
 * FONDA MÜZİK: siteSettings/jingles → muzik[0] (sözsüz enstrümantal jingle) URL'i
 * <audio> ile çalar (autoplay tarayıcı politikası gereği kullanıcı "Oynat"
 * dokunuşuyla başlar).
 *
 * PAYLAŞ/İNDİR: sahneleri bir <canvas>'a çizip MediaRecorder ile (canvas.captureStream
 * + AudioContext MediaStreamDestination ile jingle mix) webm üretir → indirir.
 * try/catch ile sarmalı; desteklenmiyorsa graceful fallback (ekran kaydı ipucu).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc } from 'firebase/firestore';
import { Play, Pause, X, Loader2, Download, RotateCcw, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Slot = { url: string; name: string } | null;
interface JinglesDoc { santral?: Slot[]; cocuk?: Slot[]; muzik?: Slot[] }

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0');

/** Oynatıcının ihtiyaç duyduğu özet veri — page.tsx'teki Wrapped ile uyumlu. */
export interface WrappedStoryData {
  name: string;
  periodLabel: string;
  periodKind: 'month' | 'year';
  totalVolunteerHours: number;
  donationCount: number;
  eventCount: number;
  impactScore: number;
  estimatedLivesTouched: number;
  topArea: string | null;
}

interface Scene {
  /** Üst etiket (kicker) */
  kicker?: string;
  /** Büyük rakam/ifade */
  big: string;
  /** Büyük ifadenin altındaki birim/başlık */
  title?: string;
  /** Açıklama */
  subtitle?: string;
  /** İki coral/renk durağı — canvas radyal gradyanı + DOM gradient için. */
  from: string;
  via: string;
  to: string;
  /** DOM tailwind gradient sınıfı (canvas ile aynı his). */
  domGradient: string;
  /** Final kapanış sahnesi mi? (turuncu kalp + marka) */
  closing?: boolean;
}

/** Sahne süresi (ms) — IG story ritmi. */
const SCENE_MS = 4200;

function buildScenes(d: WrappedStoryData): Scene[] {
  const periodWord = d.periodKind === 'month' ? 'Bu ay' : 'Bu yıl';
  const scenes: Scene[] = [
    {
      kicker: 'hangel · umudu büyütüyoruz',
      big: d.periodLabel,
      title: `${periodWord} etki hikayen`,
      subtitle: 'Birlikte ürettiğin iyiliğe bir göz at. Yalnız değilsin.',
      from: '#f34723', via: '#d6310f', to: '#1a0703',
      domGradient: 'from-[#f34723] via-[#d6310f] to-[#1a0703]',
    },
    {
      kicker: 'Dokunduğun tahmini can',
      big: fmt(d.estimatedLivesTouched),
      title: 'cana dokundun',
      subtitle: 'Gönüllülüğün ve desteğinle birçok hayata umut oldun.',
      from: '#10b981', via: '#047857', to: '#022c22',
      domGradient: 'from-emerald-500 via-emerald-700 to-emerald-950',
    },
    {
      kicker: 'Gönüllülük',
      big: `${fmt(d.totalVolunteerHours)} saat`,
      title: `${periodWord} emek verdin`,
      subtitle: `${fmt(d.eventCount)} etkinlik/gönüllülükte birlikte çalıştın.`,
      from: '#3b82f6', via: '#1d4ed8', to: '#0b1f4d',
      domGradient: 'from-blue-500 via-blue-700 to-blue-950',
    },
  ];

  if (d.donationCount > 0) {
    scenes.push({
      kicker: 'Destek',
      big: fmt(d.donationCount),
      title: 'kez destek oldun',
      subtitle: 'Alışverişlerinle markalar üzerinden bağış akıttın.',
      from: '#f43f5e', via: '#be123c', to: '#4c0519',
      domGradient: 'from-rose-500 via-rose-700 to-rose-950',
    });
  }

  if (d.topArea) {
    scenes.push({
      kicker: 'En çok katkı verdiğin alan',
      big: d.topArea,
      title: '',
      subtitle: `${periodWord} en çok burada iz bıraktın.`,
      from: '#8b5cf6', via: '#6d28d9', to: '#2e1065',
      domGradient: 'from-violet-500 via-violet-700 to-violet-950',
    });
  }

  scenes.push({
    kicker: 'Etki Puanın',
    big: fmt(d.impactScore),
    title: 'puan',
    subtitle: 'Topluluğa kattığın toplam etki.',
    from: '#f34723', via: '#db2777', to: '#581c87',
    domGradient: 'from-[#f34723] via-pink-600 to-purple-800',
  });

  scenes.push({
    kicker: `${d.name}`,
    big: '🧡',
    title: 'umudu büyütüyoruz',
    subtitle: 'Birlikte daha çok cana dokunmaya devam. #wearehangel',
    from: '#f34723', via: '#b3270f', to: '#000000',
    domGradient: 'from-[#f34723] via-[#b3270f] to-black',
    closing: true,
  });

  return scenes;
}

/* -------------------------------------------------------------------------- */
/*  Ana bileşen                                                               */
/* -------------------------------------------------------------------------- */

export function WrappedStory({ data, onClose }: { data: WrappedStoryData; onClose: () => void }) {
  const db = useFirestore();
  const { toast } = useToast();

  const jinglesRef = useMemoFirebase(
    () => (db ? doc(db, COLLECTIONS.siteSettings, 'jingles') : null),
    [db],
  );
  const { data: jingles } = useDoc<JinglesDoc>(jinglesRef);
  const jingleUrl = jingles?.muzik?.find((m): m is { url: string; name: string } => !!m?.url)?.url;

  const scenes = useMemo(() => buildScenes(data), [data]);
  const total = scenes.length;

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = scenes[Math.min(index, total - 1)];

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i; // final sahnede kal
      return i + 1;
    });
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Otomatik ilerleme zamanlayıcısı.
  useEffect(() => {
    if (!started || paused) return;
    clearTimer();
    if (index >= total - 1) return; // final sahnede otomatik durur
    timerRef.current = setTimeout(goNext, SCENE_MS);
    return clearTimer;
  }, [started, paused, index, total, goNext]);

  // Müzik kontrolü.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (started && !paused) {
      void el.play().catch(() => { /* tarayıcı engellerse sessizce geç */ });
    } else {
      el.pause();
    }
  }, [started, paused, muted]);

  // Klavye erişilebilirliği.
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, goNext, goPrev, onClose]);

  const start = () => {
    setIndex(0);
    setStarted(true);
    setPaused(false);
    // play() müzik effect'inde started=true ile tetiklenir (kullanıcı dokunuşu).
  };

  const replay = () => { setIndex(0); setPaused(false); };

  /* ---------------------------- Video dışa aktar ---------------------------- */

  const handleDownloadVideo = useCallback(async () => {
    setExporting(true);
    try {
      await exportStoryVideo(scenes, data, jingleUrl, muted);
      toast({ title: 'Video indirildi 🧡', description: 'Hikaye videon telefonuna kaydedildi.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      toast({
        variant: 'destructive',
        title: 'Video oluşturulamadı',
        description: msg === 'unsupported'
          ? 'Tarayıcın video kaydını desteklemiyor. Hikayeyi oynatıp ekran kaydı (iPhone: Kontrol Merkezi → Ekran Kaydı) alabilirsin.'
          : 'Şimdilik ekran kaydı alarak paylaşabilirsin.',
      });
    } finally {
      setExporting(false);
    }
  }, [scenes, data, jingleUrl, muted, toast]);

  const isLast = index >= total - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white select-none">
      {/* Fon müziği — autoplay kullanıcı dokunuşuyla başlar */}
      {jingleUrl && (
        <audio ref={audioRef} src={jingleUrl} loop preload="auto" className="hidden">
          <track kind="captions" />
        </audio>
      )}

      {!started ? (
        /* ----------------------------- Açılış kapısı ---------------------------- */
        <div
          className={cn(
            'h-dvh flex flex-col items-center justify-center px-8 text-center bg-gradient-to-br',
            scenes[0].domGradient,
          )}
        >
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute top-4 right-4 h-11 w-11 inline-flex items-center justify-center rounded-full bg-black/25 backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-4 max-w-sm">
            <div className="text-6xl">🧡</div>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-90">
              hangel · {data.periodKind === 'month' ? 'Bu Ay' : 'Bu Yıl'} · {data.periodLabel}
            </p>
            <h2 className="text-3xl font-black tracking-tight leading-tight text-balance">
              Etki Hikayeni İzle
            </h2>
            <p className="text-sm opacity-90 leading-relaxed">
              Sahne sahne etkin, sözsüz bir jenerik eşliğinde. Umudu birlikte büyütüyoruz.
            </p>
            <Button
              onClick={start}
              className="h-12 px-7 rounded-full bg-white text-black hover:bg-white/90 font-bold text-base"
            >
              <Play className="h-5 w-5 mr-2 fill-current" /> Hikayeni İzle
            </Button>
            <p className="text-[11px] opacity-70">Müzikli oynatılır · istediğin an sessize alabilirsin</p>
          </div>
        </div>
      ) : (
        /* ----------------------------- Oynatıcı ----------------------------- */
        <div
          className={cn(
            'h-dvh flex flex-col bg-gradient-to-br transition-[background] duration-700',
            scene.domGradient,
          )}
        >
          {/* Segment progress bar'ları (IG tarzı) */}
          <div className="flex gap-1 px-3 pt-3 pb-1">
            {scenes.map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
                <div
                  className={cn('h-full bg-white rounded-full', i < index && 'w-full')}
                  style={
                    i === index
                      ? ({
                          // story-progress keyframe; pause durunca animasyonu durdur.
                          width: '0%',
                          animation: 'story-progress var(--story-duration) linear forwards',
                          animationPlayState: paused ? 'paused' : 'running',
                          ['--story-duration' as string]: `${SCENE_MS}ms`,
                        } as React.CSSProperties)
                      : i < index
                      ? { width: '100%' }
                      : { width: '0%' }
                  }
                />
              </div>
            ))}
          </div>

          {/* Üst bar — marka + kontroller */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-black uppercase tracking-[0.25em] opacity-95">hangel</span>
            <div className="flex items-center gap-1">
              <IconBtn label={paused ? 'Oynat' : 'Duraklat'} onClick={() => setPaused((p) => !p)}>
                {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
              </IconBtn>
              <IconBtn label={muted ? 'Sesi aç' : 'Sessize al'} onClick={() => setMuted((m) => !m)}>
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </IconBtn>
              <IconBtn label="Kapat" onClick={onClose}>
                <X className="h-5 w-5" />
              </IconBtn>
            </div>
          </div>

          {/* Dokunma bölgeleri (sol=geri, sağ=ileri); ortada içerik. */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
            {/* Sol/sağ tıklama alanları */}
            <button
              aria-label="Önceki"
              onClick={goPrev}
              className="absolute inset-y-0 left-0 w-1/3 cursor-default focus:outline-none"
            />
            <button
              aria-label="Sonraki"
              onClick={goNext}
              className="absolute inset-y-0 right-0 w-2/3 cursor-default focus:outline-none"
            />

            {/* İçerik — her sahnede key ile yeniden tetiklenen Apple geçişi */}
            <div
              key={index}
              className={cn(
                'relative z-10 space-y-5 max-w-md pointer-events-none',
                'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-spring-out',
              )}
            >
              {scene.kicker && (
                <p className="text-xs font-black uppercase tracking-[0.25em] opacity-95">{scene.kicker}</p>
              )}
              <p
                className={cn(
                  'font-black leading-none tracking-tighter text-balance break-words',
                  scene.closing ? 'text-7xl' : 'text-5xl sm:text-7xl',
                )}
                style={{ textShadow: '0 6px 40px rgba(0,0,0,0.45)' }}
              >
                {scene.big}
              </p>
              {scene.title && <p className="text-2xl font-bold">{scene.title}</p>}
              {scene.subtitle && <p className="text-sm opacity-95 leading-relaxed">{scene.subtitle}</p>}
            </div>
          </div>

          {/* Alt bar — final aksiyonları */}
          <div className="px-5 pb-7 pt-2 space-y-3">
            {isLast ? (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                  onClick={handleDownloadVideo}
                  disabled={exporting}
                  className="w-full h-12 rounded-full bg-white text-black hover:bg-white/90 font-bold"
                >
                  {exporting ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Video oluşturuluyor…</>
                  ) : (
                    <><Download className="h-5 w-5 mr-2" /> Videoyu İndir</>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={replay}
                    variant="outline"
                    className="flex-1 h-11 rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 font-bold"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" /> Tekrar izle
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 h-11 rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 font-bold"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs opacity-80">
                <button onClick={goPrev} className="inline-flex items-center gap-1 font-bold disabled:opacity-30" disabled={index === 0}>
                  <ChevronLeft className="h-4 w-4" /> Geri
                </button>
                <span>İlerlemek için sağa dokun</span>
                <button onClick={goNext} className="inline-flex items-center gap-1 font-bold">
                  İleri <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Canvas → MediaRecorder webm dışa aktarımı                                 */
/* -------------------------------------------------------------------------- */

/**
 * Sahneleri 1080x1920 (9:16) bir canvas'a çizer, canvas.captureStream() + (varsa)
 * jingle sesini AudioContext MediaStreamDestination ile mixleyip MediaRecorder ile
 * webm üretir ve indirir. Desteklenmeyen tarayıcılarda 'unsupported' fırlatır.
 */
async function exportStoryVideo(
  scenes: Scene[],
  data: WrappedStoryData,
  jingleUrl: string | undefined,
  muted: boolean,
): Promise<void> {
  if (typeof window === 'undefined') throw new Error('unsupported');

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('unsupported');

  const captureStream = (canvas as HTMLCanvasElement & {
    captureStream?: (fps?: number) => MediaStream;
  }).captureStream;
  if (typeof captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error('unsupported');
  }

  const fps = 30;
  const stream: MediaStream = captureStream.call(canvas, fps);

  // --- Ses mix (best-effort; başarısız olursa sessiz devam) ---
  let audioCtx: AudioContext | null = null;
  let audioEl: HTMLAudioElement | null = null;
  if (jingleUrl && !muted) {
    try {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        audioEl = new Audio(jingleUrl);
        audioEl.crossOrigin = 'anonymous';
        audioEl.loop = true;
        const srcNode = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        srcNode.connect(dest);
        // Kayda gitmeyen monitör çıkışı ekleme (sessiz kayıt için bağlamıyoruz).
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        await audioCtx.resume().catch(() => {});
        await audioEl.play().catch(() => {});
      }
    } catch {
      // CORS / autoplay engeli — sessiz video üret.
      audioCtx = null;
      audioEl = null;
    }
  }

  // --- MediaRecorder mime seçimi ---
  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  const mimeType = mimeCandidates.find((m) => {
    try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
  });
  if (!mimeType) {
    audioEl?.pause();
    void audioCtx?.close();
    throw new Error('unsupported');
  }

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  // Sahne çizim döngüsü.
  const SCENE_DRAW_MS = 3200; // video sahnesi (oynatıcıdan biraz kısa; tempo)
  const FADE_MS = 420;
  const startTime = performance.now();
  const totalMs = scenes.length * SCENE_DRAW_MS;

  await new Promise<void>((resolve) => {
    const draw = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalMs) { resolve(); return; }
      const sceneIdx = Math.min(scenes.length - 1, Math.floor(elapsed / SCENE_DRAW_MS));
      const localT = elapsed - sceneIdx * SCENE_DRAW_MS;
      // Giriş fade/scale (Apple).
      const inT = Math.min(1, localT / FADE_MS);
      const outStart = SCENE_DRAW_MS - FADE_MS;
      const outT = localT > outStart ? (localT - outStart) / FADE_MS : 0;
      const alpha = Math.min(inT, 1 - outT);
      const scale = 0.96 + 0.04 * easeOut(inT);
      drawScene(ctx, canvas.width, canvas.height, scenes[sceneIdx], data, Math.max(0, alpha), scale, sceneIdx, scenes.length);
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });

  recorder.stop();
  await done;

  audioEl?.pause();
  void audioCtx?.close();

  const blob = new Blob(chunks, { type: mimeType });
  if (blob.size === 0) throw new Error('empty');

  const fileName = `hangel-etki-hikayem-${data.periodLabel.replace(/\s+/g, '-').toLowerCase()}.webm`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

/** Bir sahneyi canvas'a çizer (9:16 dikey, marka gradyanı + büyük tipografi). */
function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  data: WrappedStoryData,
  alpha: number,
  scale: number,
  sceneIdx: number,
  totalScenes: number,
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Radyal coral/renk gradyan zemin (kartla aynı his).
  const grad = ctx.createRadialGradient(w / 2, h * 0.18, 0, w / 2, h * 0.18, h * 0.95);
  grad.addColorStop(0, scene.from);
  grad.addColorStop(0.45, scene.via);
  grad.addColorStop(1, scene.to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Alt scrim (okunabilirlik).
  const scrim = ctx.createLinearGradient(0, h * 0.6, 0, h);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);

  // Segment progress bar'ları (üstte).
  const padX = 60;
  const barY = 70;
  const gap = 14;
  const barW = (w - padX * 2 - gap * (totalScenes - 1)) / totalScenes;
  for (let i = 0; i < totalScenes; i++) {
    const x = padX + i * (barW + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, x, barY, barW, 8, 4);
    ctx.fill();
    if (i <= sceneIdx) {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      roundRect(ctx, x, barY, barW, 8, 4);
      ctx.fill();
    }
  }

  // Marka etiketi.
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('hangel', padX, barY + 70);
  ctx.textAlign = 'right';
  ctx.font = '500 30px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('etki hikayem', w - padX, barY + 70);

  // İçerik bloğu (fade + scale, merkezde).
  ctx.globalAlpha = alpha;
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';

  let y = -120;

  if (scene.kicker) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '800 40px ui-sans-serif, system-ui, sans-serif';
    wrapText(ctx, scene.kicker.toLocaleUpperCase('tr-TR'), 0, y, w - 220, 52);
    y += 90;
  }

  // Büyük rakam/ifade.
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 8;
  const bigSize = scene.closing ? 240 : sizeForBig(scene.big);
  ctx.font = `900 ${bigSize}px ui-sans-serif, system-ui, sans-serif`;
  wrapText(ctx, scene.big, 0, y + bigSize * 0.34, w - 160, bigSize * 1.05);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  y += bigSize * 0.85 + 40;

  if (scene.title) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 64px ui-sans-serif, system-ui, sans-serif';
    wrapText(ctx, scene.title, 0, y, w - 200, 76);
    y += 96;
  }

  if (scene.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '500 40px ui-sans-serif, system-ui, sans-serif';
    wrapText(ctx, scene.subtitle, 0, y, w - 240, 54);
  }

  ctx.restore();

  // Footer (sabit, fade ile değil).
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '600 30px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('hangel.org · ' + data.periodLabel, w / 2, h - 90);
  ctx.restore();
}

function sizeForBig(text: string): number {
  const len = text.length;
  if (len <= 4) return 320;
  if (len <= 8) return 220;
  if (len <= 14) return 150;
  return 110;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Çok satırlı, ortalanmış metin (genişliğe göre sarar). */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  const totalH = (lines.length - 1) * lineHeight;
  let y = startY - totalH / 2;
  for (const line of lines) {
    ctx.fillText(line, cx, y);
    y += lineHeight;
  }
}
