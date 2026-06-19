'use client';

/**
 * /gelir-modeli-konferanslari/sunum — Apple Keynote tarzı tam-ekran sunum.
 *
 * Slaytlar Firestore'dan (`presentations/{DECK_ID}`.slides) yüklenir; yoksa
 * DEFAULT_SLIDES kullanılır → sunum, kod değişmeden /super-admin/conference-deck
 * editöründen düzenlenebilir. Tip + varsayılan içerik: @/lib/conference-deck.
 * Navigasyon: klavye (← → Space Esc), swipe, alt ilerleme çubuğu, sağ/sol tıklama.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, ArrowDown, Sparkles, Pencil } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { DEFAULT_SLIDES, DECK_COLLECTION, DECK_DOC, normalizeSlides } from '@/lib/conference-deck';

const CORAL = '#f34723';

export default function ConferenceDeckPage() {
  const router = useRouter();
  const db = useFirestore();
  const deckRef = useMemoFirebase(() => (db ? doc(db, DECK_COLLECTION, DECK_DOC) : null), [db]);
  const { data: deckDoc } = useDoc<{ slides?: unknown }>(deckRef);
  const SLIDES = useMemo(() => normalizeSlides(deckDoc?.slides ?? DEFAULT_SLIDES), [deckDoc]);

  // Kalem ikonu yalnız süper-admin'e (veya kurucuya) görünür — ziyaretçi görmez.
  const { user: authUser } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!authUser) { setIsAdmin(false); return; }
    let cancelled = false;
    authUser.getIdTokenResult().then((res) => {
      if (cancelled) return;
      const claims = res.claims as { role?: unknown; email?: unknown };
      setIsAdmin(claims.role === 'super-admin' || (typeof claims.email === 'string' && claims.email.toLowerCase() === 'ismailhilmi@hangel.org'));
    }).catch(() => { if (!cancelled) setIsAdmin(false); });
    return () => { cancelled = true; };
  }, [authUser]);

  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number, total: number) => {
    setI((cur) => {
      const target = Math.max(0, Math.min(total - 1, next));
      setDir(target >= cur ? 1 : -1);
      return target;
    });
  }, []);

  const exit = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/gelir-modeli-konferanslari');
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(i + 1, SLIDES.length); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1, SLIDES.length); }
      else if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, go, exit, SLIDES.length]);

  const slide = SLIDES[Math.min(i, SLIDES.length - 1)];
  const isCoral = slide.kind === 'title' || slide.kind === 'section' || slide.kind === 'closing';

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden select-none text-white ${isCoral ? '' : 'bg-black'}`}
      style={isCoral ? { background: `linear-gradient(135deg, ${CORAL} 0%, #c5391b 100%)` } : undefined}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1), SLIDES.length);
        touchX.current = null;
      }}
    >
      <button aria-label="Önceki" onClick={() => go(i - 1, SLIDES.length)} className="absolute left-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />
      <button aria-label="Sonraki" onClick={() => go(i + 1, SLIDES.length)} className="absolute right-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />

      <button onClick={exit} aria-label="Kapat" className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
      <div className="absolute left-6 top-6 z-30 text-[13px] font-semibold tabular-nums text-white/45">{i + 1} / {SLIDES.length}</div>

      <div key={i} className={`flex h-full w-full items-center justify-center px-8 py-20 ${dir === 1 ? 'animate-in slide-in-from-right-6' : 'animate-in slide-in-from-left-6'} fade-in duration-500`}>
        <div className="mx-auto w-full max-w-4xl text-center">

          {slide.kind === 'title' && (
            <>
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white/80">{slide.eyebrow}</p>
              <h1 className="whitespace-pre-line text-5xl font-black leading-[0.98] tracking-tighter sm:text-7xl lg:text-8xl">{slide.title}</h1>
              <p className="mt-6 text-xl font-bold tracking-tight text-white/90 sm:text-3xl">{slide.sub}</p>
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
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {slide.stats.map((s, k) => (
                  <div key={k} className="space-y-1">
                    <div className="text-6xl font-black leading-none tracking-tighter sm:text-7xl" style={{ color: CORAL }}>{s.big}</div>
                    <div className="text-sm font-medium leading-snug text-white/60">{s.label}</div>
                  </div>
                ))}
              </div>
              {slide.foot && <p className="mx-auto mt-10 max-w-2xl text-sm font-medium leading-relaxed text-white/45 sm:text-base">{slide.foot}</p>}
            </>
          )}

          {slide.kind === 'list' && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              <div className={`mx-auto mt-9 max-w-2xl gap-x-8 gap-y-3 text-left ${slide.items.length > 6 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col items-center'}`}>
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
              <div className="mx-auto mt-9 max-w-2xl space-y-2 border-l-4 pl-5 text-left" style={{ borderColor: CORAL }}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Çıktı</p>
                {slide.finding.map((f, k) => <p key={k} className="text-lg font-semibold leading-relaxed text-white/90 sm:text-2xl">{f}</p>)}
              </div>
            </>
          )}

          {slide.kind === 'closing' && (
            <>
              <h2 className="whitespace-pre-line text-5xl font-black leading-[0.95] tracking-tighter sm:text-8xl">{slide.title}</h2>
              <div className="mx-auto mt-7 max-w-2xl space-y-2">
                {slide.lines.map((l, k) => <p key={k} className="text-lg font-medium leading-relaxed text-white/90 sm:text-2xl">{l}</p>)}
              </div>
              <div className="mt-10">
                <button onClick={() => router.push('/gelir-modeli-konferanslari')} className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-[#c5391b] shadow-xl transition active:scale-95">
                  <Sparkles className="h-5 w-5" /> Şehrini Seç, Kayıt Ol
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10">
        <div className="h-full bg-white transition-all duration-500" style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} />
      </div>

      {i > 0 && (
        <button onClick={() => go(i - 1, SLIDES.length)} aria-label="Önceki" className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {i < SLIDES.length - 1 && (
        <button onClick={() => go(i + 1, SLIDES.length)} aria-label="Sonraki" className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Son slayt — süper-admin için sağ altta minik kalem: düzenleme ekranını açar */}
      {isAdmin && i === SLIDES.length - 1 && (
        <Link
          href="/super-admin/conference-deck"
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          aria-label="Sunumu düzenle"
          title="Sunumu düzenle"
          className="absolute bottom-7 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur transition hover:bg-white/30 active:scale-95"
        >
          <Pencil className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
