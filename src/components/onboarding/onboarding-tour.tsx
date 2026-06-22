'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  HeartHandshake,
  CalendarHeart,
  Droplet,
  Store,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import { isNativeApp } from '@/lib/capacitor';

// hangel — ilk-açılış rehberli karşılama turu.
// Tam-ekran, kart-üstü, Apple/iOS 26 hissi: glass yüzey, spring animasyon,
// ilerleme noktaları. Marka diliyle ("yalnız değilsin", turuncu kalp 🧡).
//
// Bu bileşen SADECE görseldir; ne zaman gösterileceği (ilk-ziyaret + girişli)
// dışarıda useOnboardingTour ile yönetilir. open=true iken render edilir,
// onComplete tüm çıkışlarda (Geç / Başla / ESC) çağrılır.

interface TourStep {
  icon: LucideIcon;
  /** İkon kutusunun marka rengi (semantik değil; küçük dekoratif rozet). */
  accent: string;
  eyebrow: string;
  title: string;
  description: string;
}

const STEPS: TourStep[] = [
  {
    icon: Sparkles,
    accent: 'bg-primary',
    eyebrow: 'hoş geldin 🧡',
    title: 'yalnız değilsin',
    description:
      'yok öyle yalnız başına mücadele etmek — hangel ile umudu birlikte büyütüyoruz.',
  },
  {
    icon: HeartHandshake,
    accent: 'bg-rose-500',
    eyebrow: 'gönüllülük',
    title: 'elini taşın altına koy',
    description:
      'sana yakın gönüllülük çağrılarını keşfet, tek dokunla başvur ve etkini büyüt.',
  },
  {
    icon: CalendarHeart,
    accent: 'bg-indigo-500',
    eyebrow: 'etkinlik',
    title: 'sahaya çık',
    description:
      'STK etkinliklerine katıl, canlı modda yerini al, katılım sertifikanı topla.',
  },
  {
    icon: Droplet,
    accent: 'bg-red-600',
    eyebrow: 'acil kan',
    title: 'bir hayata dokun',
    description:
      'acil kan çağrılarını anında gör; uygun olduğunda tek dokunla yanıt ver.',
  },
  {
    icon: Store,
    accent: 'bg-green-600',
    eyebrow: 'ödemesiz bağış',
    title: 'alışverişin bağışa dönüşsün',
    description:
      'cebinden para çıkmadan — markalardan alışveriş yap, indir-kullan, destek STK’na akıt.',
  },
  {
    icon: Sparkles,
    accent: 'bg-amber-500',
    eyebrow: 'etki hikayem',
    title: 'izini gör',
    description:
      'attığın her adım etki hikayene işlenir. hazırsan birlikte başlayalım. 🧡',
  },
];

// Hafif haptik — destekleyen cihazlarda (Android WebView). iOS WKWebView
// vibrate desteklemez → sessizce atlanır. Native API web'de no-op guard'lı.
function tapHaptic(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (!isNativeApp()) return; // web'de titreşim verme (yalnız native uygulama)
  try {
    navigator.vibrate(8);
  } catch {
    // yoksay
  }
}

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ open, onComplete }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  // Yön: ileri/geri — kart slide animasyonu yönünü belirler.
  const [dir, setDir] = useState<1 | -1>(1);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Açılınca ilk adıma dön + body scroll kilidi.
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setDir(1);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const finish = useCallback(() => {
    tapHaptic();
    onComplete();
  }, [onComplete]);

  const goNext = useCallback(() => {
    tapHaptic();
    setDir(1);
    setIndex((i) => {
      if (i >= STEPS.length - 1) {
        onComplete();
        return i;
      }
      return i + 1;
    });
  }, [onComplete]);

  // ESC ile geç + odak tuzağı (basit): açılınca diyaloğa odaklan.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, finish, goNext]);

  if (!mounted || !open) return null;

  const step = STEPS[index];
  const Icon = step.icon;
  const isLast = index === STEPS.length - 1;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="hangel tanıtım turu"
      ref={dialogRef}
      tabIndex={-1}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col outline-none',
        // Liquid Glass arka plan — sayfa içeriği yumuşar ama bağlam korunur.
        'bg-background/80 backdrop-blur-2xl',
        'animate-in fade-in-0 duration-300 ease-spring',
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Üst çubuk: logo + Geç */}
      <header className="flex items-center justify-between px-5 py-4">
        <HangelLogo className="text-xl" href={null} />
        {!isLast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={finish}
            className="h-11 rounded-full px-4 text-xs font-bold text-muted-foreground"
          >
            Geç
          </Button>
        )}
      </header>

      {/* Orta: kart */}
      <main className="flex flex-1 items-center justify-center px-6">
        <section
          // key → adım değişince yeniden mount: spring slide + zoom animasyonu.
          key={index}
          className={cn(
            'w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-md',
            'animate-in fade-in-0 zoom-in-95 duration-300 ease-spring',
            dir === 1 ? 'slide-in-from-right-6' : 'slide-in-from-left-6',
          )}
        >
          {/* İkon rozeti — spring pop */}
          <div
            className={cn(
              'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm',
              'animate-in zoom-in-50 duration-500 ease-spring',
              step.accent,
            )}
          >
            <Icon className="h-10 w-10 text-white" aria-hidden />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
            {step.eyebrow}
          </p>
          <h2 className="mb-3 text-2xl font-bold leading-tight text-foreground">
            {step.title}
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </section>
      </main>

      {/* Alt: ilerleme noktaları + birincil aksiyon */}
      <footer className="px-6 pb-6 pt-2">
        {/* İlerleme noktaları */}
        <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300 ease-spring',
                i === index ? 'w-6 bg-primary' : 'w-2 bg-muted',
              )}
            />
          ))}
        </div>

        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Button
            onClick={goNext}
            size="lg"
            className="h-12 w-full rounded-2xl text-base font-bold"
          >
            {isLast ? 'Başla 🧡' : 'İleri'}
          </Button>
          {/* Erişilebilirlik: ilerleme metni (ekran okuyucu) */}
          <p className="text-center text-xs text-muted-foreground">
            {index + 1} / {STEPS.length}
          </p>
        </div>
      </footer>
    </div>,
    document.body,
  );
}

export default OnboardingTour;
