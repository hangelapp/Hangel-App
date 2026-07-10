'use client';

/**
 * /gelir-modeli-konferanslari/sunum — Apple Keynote tarzı tam-ekran sunum.
 *
 * Slaytlar Firestore'dan (siteSettings/conferenceDeck.slides) yüklenir; yoksa
 * DEFAULT_SLIDES. Editör: /super-admin/conference-deck. Tip + içerik: @/lib/conference-deck.
 * Navigasyon: klavye (← → Space Esc), swipe, ilerleme çubuğu, sağ/sol tıklama.
 * Bazı slaytlar "build" içerir (reveal): başlık önce, maddeler bir sonraki tıkta açılır.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, ArrowDown, Sparkles, Pencil, ExternalLink, Maximize, Download, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { type Slide, DEFAULT_SLIDES, DECK_COLLECTION, DECK_DOC, normalizeSlides, DEFAULT_QR_CAPTION_CLOSING, DEFAULT_QR_CAPTION_THANKS, DECK_QR_URL } from '@/lib/conference-deck';

const CORAL = '#f34723';

// Fullscreen API — webkit (Safari) önekli yöntemleri de kapsayan tipler.
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
const fsActive = () => typeof document !== 'undefined' && !!(document.fullscreenElement || (document as FsDoc).webkitFullscreenElement);

/** Slayt-içi açılış (build) sayısı: reveal'lı liste → 1, diğer → 0. */
function buildsFor(s: Slide): number {
  return s.kind === 'list' && s.reveal ? 1 : 0;
}

/** Verilen URL'i QR koda çevirip gösterir (tarayıcıda, qrcode paketiyle). */
function SlideQR({ url, size = 190 }: { url: string; size?: number }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let on = true;
    import('qrcode')
      .then(m => m.default.toDataURL(url, { width: size, margin: 1 }))
      .then(d => { if (on) setSrc(d); })
      .catch(() => undefined);
    return () => { on = false; };
  }, [url, size]);
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="QR kod" width={size} height={size} className="rounded-2xl bg-white p-3 shadow-2xl" />
    : <div style={{ width: size, height: size }} className="animate-pulse rounded-2xl bg-white/25" />;
}

export default function ConferenceDeckPage() {
  const router = useRouter();
  const db = useFirestore();
  const deckRef = useMemoFirebase(() => (db ? doc(db, DECK_COLLECTION, DECK_DOC) : null), [db]);
  const { data: deckDoc } = useDoc<{ slides?: unknown }>(deckRef);
  const SLIDES = useMemo(() => normalizeSlides(deckDoc?.slides ?? DEFAULT_SLIDES), [deckDoc]);

  // Kalem ikonu yalnız süper-admin'e (veya kurucuya) görünür — ziyaretçi görmez.
  // Sağlam tespit: token claim (zorla yenilenir) VEYA Firestore'daki rol VEYA Auth e-postası.
  const FOUNDER_EMAIL = 'ismailhilmi@hangel.org';
  const { user: authUser } = useUser();
  const [claimsAdmin, setClaimsAdmin] = useState(false);
  useEffect(() => {
    if (!authUser) { setClaimsAdmin(false); return; }
    let cancelled = false;
    authUser.getIdTokenResult(true).then((res) => { // true = bayat claim'i yenile
      if (cancelled) return;
      const claims = res.claims as { role?: unknown; email?: unknown };
      setClaimsAdmin(claims.role === 'super-admin' || (typeof claims.email === 'string' && claims.email.toLowerCase() === FOUNDER_EMAIL));
    }).catch(() => { if (!cancelled) setClaimsAdmin(false); });
    return () => { cancelled = true; };
  }, [authUser]);
  const userDocRef = useMemoFirebase(() => (db && authUser ? doc(db, 'users', authUser.uid) : null), [db, authUser]);
  const { data: userDoc } = useDoc<{ role?: string }>(userDocRef);
  const isAdmin = claimsAdmin
    || userDoc?.role === 'super-admin'
    || (typeof authUser?.email === 'string' && authUser.email.toLowerCase() === FOUNDER_EMAIL);

  const [i, setI] = useState(0);
  const [build, setBuild] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dl, setDl] = useState(false);

  // Sunumu PowerPoint (.pptx) olarak indir — ekrandaki (Firestore) slaytları
  // sunucuya POST eder; route .pptx üretip döner (pptxgenjs Node tarafında).
  const handleDownloadPptx = useCallback(async () => {
    setDl(true);
    try {
      const res = await fetch('/api/conference-deck/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: SLIDES }),
      });
      if (!res.ok) throw new Error(`İndirme başarısız (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hangel-gelir-modeli-sunum.pptx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PPTX indirilemedi:', err);
    } finally {
      setDl(false);
    }
  }, [SLIDES]);

  // Tam ekran (Fullscreen API) — tarayıcının üst çubukları (sekme/URL) gizlenir.
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onFs = () => setIsFs(fsActive());
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, []);
  const toggleFs = useCallback(() => {
    const d = document as FsDoc;
    const el = rootRef.current as FsEl | null;
    if (fsActive()) {
      if (document.exitFullscreen) void document.exitFullscreen();
      else d.webkitExitFullscreen?.();
    } else if (el) {
      if (el.requestFullscreen) void el.requestFullscreen();
      else el.webkitRequestFullscreen?.();
    }
  }, []);

  const next = useCallback(() => {
    setDir(1);
    if (build < buildsFor(SLIDES[i])) setBuild(build + 1);
    else { setBuild(0); setI(v => Math.min(SLIDES.length - 1, v + 1)); }
  }, [i, build, SLIDES]);

  const prev = useCallback(() => {
    setDir(-1);
    if (build > 0) setBuild(build - 1);
    else { setBuild(0); setI(v => Math.max(0, v - 1)); }
  }, [build, SLIDES]);

  const goTo = useCallback((idx: number) => {
    setDir(idx >= i ? 1 : -1); setBuild(0);
    setI(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }, [i, SLIDES]);

  const exit = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/gelir-modeli-konferanslari');
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Sunum kumandaları/"pointer" (Logitech, Kensington vb.) varsayılan olarak
      // Page Down/Up gönderir (ok tuşu değil); bazıları Enter/Backspace/Tab kullanır.
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') { e.preventDefault(); prev(); }
      // Tam ekrandayken Esc'i tarayıcı tam ekranı kapatmak için kullanır; sunumu kapatma.
      else if (e.key === 'Escape') { if (!fsActive()) exit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, exit]);

  const slide = SLIDES[Math.min(i, SLIDES.length - 1)];
  const isCoral = slide.kind === 'title' || slide.kind === 'section' || slide.kind === 'closing' || slide.kind === 'thanks' || (slide.kind === 'list' && !!slide.hero);
  const isLast = i === SLIDES.length - 1;

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[100] overflow-hidden select-none text-white ${isCoral ? '' : 'bg-black'}`}
      style={isCoral ? { background: `linear-gradient(135deg, ${CORAL} 0%, #c5391b 100%)` } : undefined}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
        touchX.current = null;
      }}
    >
      <button aria-label="Önceki" onClick={prev} className="absolute left-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />
      <button aria-label="Sonraki" onClick={next} className="absolute right-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />

      <button onClick={exit} aria-label="Kapat" className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
      <div className="absolute left-6 top-6 z-30 text-[13px] font-semibold tabular-nums text-white/45">{i + 1} / {SLIDES.length}</div>

      {/* Her slaytta sol alt köşe — konferans sayfasına götüren kalıcı QR. */}
      {/* closing/thanks slaytlarının zaten büyük QR'ı var; orada tekrar gösterme. */}
      {slide.kind !== 'closing' && slide.kind !== 'thanks' && (
        <div className="pointer-events-none absolute bottom-6 left-5 z-40 flex flex-col items-center gap-1.5">
          <SlideQR url={DECK_QR_URL} size={isFs ? 100 : 80} />
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">Okut, katıl</span>
        </div>
      )}

      <div key={i} className={`flex h-full w-full items-center justify-center px-8 py-20 ${dir === 1 ? 'animate-in slide-in-from-right-6' : 'animate-in slide-in-from-left-6'} fade-in duration-500`}>
        <div className="mx-auto w-full max-w-4xl text-center">

          {slide.kind === 'title' && (
            <>
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white/80">{slide.eyebrow}</p>
              <h1 className="whitespace-pre-line text-5xl font-black leading-[0.98] tracking-tighter sm:text-7xl lg:text-8xl">{slide.title}</h1>
              <p className="mt-6 text-xl font-bold tracking-tight text-white/90 sm:text-3xl">{slide.sub}</p>
              {slide.foot && (
                <p className="mt-10 max-w-2xl text-xs font-medium leading-snug text-white/70 sm:text-sm">{slide.foot}</p>
              )}
            </>
          )}

          {slide.kind === 'section' && (
            <>
              <p className="text-7xl font-black leading-none tracking-tighter text-white/40 sm:text-9xl">BÖLÜM</p>
              <p className="my-2 text-8xl font-black leading-none tracking-tighter sm:text-[11rem]">{slide.num}</p>
              <p className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{slide.name}</p>
            </>
          )}

          {slide.kind === 'body' && (
            <>
              {slide.eyebrow && <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em]" style={{ color: CORAL }}>{slide.eyebrow}</p>}
              <h2 className="whitespace-pre-line text-4xl font-black leading-[1.02] tracking-tighter sm:text-6xl">{slide.title}</h2>
              <div className="mx-auto mt-8 max-w-2xl space-y-4">
                {slide.lines.map((l, k) => <p key={k} className="text-lg font-medium leading-relaxed text-white/65 sm:text-2xl">{l}</p>)}
              </div>
            </>
          )}

          {slide.kind === 'stats' && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              <div className={slide.row ? 'mt-10 flex flex-row flex-nowrap items-start justify-center gap-4 sm:gap-12' : 'mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3'}>
                {slide.stats.map((s, k) => (
                  <div key={k} className={slide.row ? 'flex flex-col items-center' : 'space-y-1'}>
                    <div className={`font-black leading-none tracking-tighter ${slide.row ? 'text-4xl sm:text-7xl' : 'text-6xl sm:text-7xl'}`} style={{ color: CORAL }}>{s.big}</div>
                    <div className={`font-medium leading-snug text-white/60 ${slide.row ? 'mt-1 whitespace-nowrap text-xs sm:text-base' : 'text-sm'}`}>{s.label}</div>
                  </div>
                ))}
              </div>
              {slide.foot && <p className="mx-auto mt-10 max-w-2xl text-sm font-medium leading-relaxed text-white/45 sm:text-base">{slide.foot}</p>}
            </>
          )}

          {slide.kind === 'list' && slide.hero && (
            <>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Sosyal Etki Platformu
              </div>
              <h2 className="text-7xl font-black lowercase leading-none tracking-tighter sm:text-9xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-xl text-lg font-semibold text-white/90 sm:text-2xl">{slide.intro}</p>}
              <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2.5 text-left">
                {slide.items.map((it, k) => {
                  const m = it.match(/^(.*?)\s*\((.*)\)\s*$/);
                  const t = m ? m[1] : it;
                  const d = m ? m[2] : '';
                  return (
                    <div key={k} className="flex items-baseline gap-2.5 rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25">
                      <span className="h-2 w-2 shrink-0 self-center rounded-full bg-white/90" />
                      <span className="font-bold sm:text-lg">{t}</span>
                      {d && <span className="text-sm text-white/75">— {d}</span>}
                    </div>
                  );
                })}
              </div>
              {slide.foot && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs font-bold sm:text-sm">
                  {slide.foot.replace(/\.\s*$/, '').split('→').map((step, k, arr) => (
                    <React.Fragment key={k}>
                      <span className="rounded-full bg-black/15 px-3 py-1.5">{step.trim()}</span>
                      {k < arr.length - 1 && <span className="text-white/70">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          )}

          {slide.kind === 'list' && !slide.hero && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              {slide.reveal && build < 1 ? (
                <p className="mt-12 animate-pulse text-base font-semibold text-white/45">Devam etmek için ekrana dokun ▸</p>
              ) : (
                <>
                  <div key={`items-${build}`} className={`mx-auto mt-9 max-w-2xl animate-in fade-in slide-in-from-bottom-2 gap-x-8 gap-y-3 text-left duration-500 ${slide.items.length > 6 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col items-center'}`}>
                    {slide.items.map((it, k) => (
                      <div key={k} className={`flex items-center gap-3 ${slide.items.length > 6 ? '' : 'w-full max-w-md'}`}>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CORAL }} />
                        <span className="text-lg font-semibold text-white/90 sm:text-xl">{it}</span>
                      </div>
                    ))}
                  </div>
                  {slide.foot && <p className="mx-auto mt-9 max-w-2xl text-sm font-medium text-white/45 sm:text-base">{slide.foot}</p>}
                </>
              )}
            </>
          )}

          {slide.kind === 'flow' && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              <div className="mx-auto mt-9 flex w-full max-w-md flex-col items-center gap-2">
                {slide.steps.map((s, k) => (
                  <React.Fragment key={k}>
                    <div className={`w-full rounded-2xl px-5 py-3 text-base font-bold sm:text-xl ${k === slide.steps.length - 1 ? 'text-white' : 'bg-white/[0.06] text-white/90'}`} style={k === slide.steps.length - 1 ? { backgroundColor: CORAL } : undefined}>{s}</div>
                    {k < slide.steps.length - 1 && <ArrowDown className="h-5 w-5 text-white/35" />}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {slide.kind === 'research' && (
            <>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em]" style={{ color: CORAL }}>Araştırma {slide.n}</p>
              <h2 className="mx-auto max-w-3xl text-2xl font-bold italic leading-snug tracking-tight sm:text-4xl">“{slide.paper}”</h2>
              <p className="mt-5 text-base font-medium text-white/55 sm:text-lg">{slide.year} · {slide.authors.join(', ')}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {slide.unis.map((u, k) => (
                  <span key={k} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${CORAL}66`, color: '#ffd9ce' }}>{u}</span>
                ))}
              </div>
              <div className="mx-auto mt-8 max-w-2xl space-y-2 border-l-4 pl-5 text-left" style={{ borderColor: CORAL }}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Çıktı</p>
                {slide.finding.map((f, k) => <p key={k} className="text-lg font-semibold leading-relaxed text-white/90 sm:text-2xl">{f}</p>)}
              </div>
              {slide.highlight && <p className="mx-auto mt-6 max-w-2xl text-sm font-semibold leading-relaxed text-white/75 sm:text-base">{slide.highlight}</p>}
              {slide.source && (
                <a href={slide.source} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-white/45 underline decoration-white/30 underline-offset-2 transition hover:text-white/80">
                  <ExternalLink className="h-3.5 w-3.5" /> Kaynak
                </a>
              )}
            </>
          )}

          {slide.kind === 'closing' && (
            <>
              <h2 className="whitespace-pre-line text-5xl font-black leading-[0.95] tracking-tighter sm:text-8xl">{slide.title}</h2>
              <div className="mx-auto mt-7 max-w-2xl space-y-2">
                {slide.lines.map((l, k) => <p key={k} className="text-lg font-medium leading-relaxed text-white/90 sm:text-2xl">{l}</p>)}
              </div>
              {slide.qr ? (
                <div className="mt-9 flex flex-col items-center gap-3">
                  <SlideQR url={slide.qr} size={190} />
                  <p className="text-sm font-bold text-white/95 sm:text-base">{slide.qrCaption || DEFAULT_QR_CAPTION_CLOSING}</p>
                </div>
              ) : (
                <div className="mt-10">
                  <button onClick={() => router.push('/gelir-modeli-konferanslari')} className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-[#c5391b] shadow-xl transition active:scale-95">
                    <Sparkles className="h-5 w-5" /> Şehrini Seç, Kayıt Ol
                  </button>
                </div>
              )}
            </>
          )}

          {slide.kind === 'thanks' && (
            <>
              <h2 className="whitespace-pre-line text-6xl font-black leading-[0.95] tracking-tighter sm:text-9xl">{slide.title}</h2>
              {slide.sub && <p className="mt-5 text-xl font-bold tracking-tight text-white/90 sm:text-3xl">{slide.sub}</p>}
              {slide.qr && (
                <div className="mt-9 flex flex-col items-center gap-3">
                  <SlideQR url={slide.qr} size={170} />
                  <p className="text-sm font-bold text-white/95 sm:text-base">{slide.qrCaption || DEFAULT_QR_CAPTION_THANKS}</p>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* İlerleme çubuğu (slayt bazlı) */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10">
        <div className="h-full bg-white transition-all duration-500" style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} />
      </div>

      {i > 0 && (
        <button onClick={prev} aria-label="Önceki" className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {!(isLast && build >= buildsFor(slide)) && (
        <button onClick={next} aria-label="Sonraki" className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Sağ alt köşe — tam ekranda DEĞİLKEN her slaytta: tam ekran + (süper-admin) düzenle */}
      {!isFs && (
        <div className="absolute bottom-7 right-5 z-40 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownloadPptx(); }}
            disabled={dl}
            aria-label="PowerPoint olarak indir"
            title="PowerPoint (.pptx) olarak indir"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur transition hover:bg-white/30 active:scale-95 disabled:opacity-60"
          >
            {dl ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFs(); }}
            aria-label="Tam ekran"
            title="Tam ekran"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur transition hover:bg-white/30 active:scale-95"
          >
            <Maximize className="h-5 w-5" />
          </button>
          {isAdmin && (
            <Link
              href="/super-admin/conference-deck"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              aria-label="Sunumu düzenle"
              title="Sunumu düzenle"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur transition hover:bg-white/30 active:scale-95"
            >
              <Pencil className="h-5 w-5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
