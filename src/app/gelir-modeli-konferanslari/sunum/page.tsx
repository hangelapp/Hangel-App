'use client';

/**
 * /gelir-modeli-konferanslari/sunum — Apple Keynote tarzı tam-ekran sunum.
 *
 * "Sivil Toplum Kuruluşlarında Gelir Modeli Oluşturma ve Sürdürülebilirlik"
 * konferansının sunumu. Tek-fikir slaytlar, dev tipografi, coral (#f34723) kimlik,
 * yumuşak geçişler. Navigasyon: klavye (← → Space Esc), dokunmatik swipe, alt
 * nokta göstergesi, sağ/sol tıklama bölgeleri. Konferans sayfasındaki
 * "Ücretsiz Eğitim Konferansı · Sertifikalı" rozetinden açılır.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HandCoins, Building2, ShoppingBag, Lightbulb, ShieldCheck,
  ChevronLeft, ChevronRight, X, Award, Sparkles, type LucideIcon,
} from 'lucide-react';

const CORAL = '#f34723';

type Slide =
  | { kind: 'title'; eyebrow: string; title: string; sub: string }
  | { kind: 'statement'; big: string; small?: string }
  | { kind: 'quote'; text: string; by?: string }
  | { kind: 'divider'; num: string; label: string; sub: string }
  | { kind: 'topic'; n: number; icon: LucideIcon; title: string; desc: string }
  | { kind: 'cta'; title: string; sub: string };

const SLIDES: Slide[] = [
  { kind: 'title', eyebrow: 'hangel · Ücretsiz Eğitim Konferansı', title: 'Gelir Modeli\nOluşturma', sub: 've Sürdürülebilirlik' },
  { kind: 'statement', big: 'Tek bağış.\nTek kaynak.', small: 'Peki ya o kaynak biterse?' },
  { kind: 'quote', text: 'Yok öyle yalnız\nbaşına mücadele etmek.' },
  { kind: 'statement', big: 'Sürdürülebilir.\nÇeşitlendirilmiş.\nBağımsız.', small: 'STK’nızın yarınını bugün güvence altına alın.' },
  { kind: 'divider', num: '5', label: 'Sütun', sub: 'Bugün birlikte keşfedeceğiz.' },
  { kind: 'topic', n: 1, icon: HandCoins, title: 'Bağışçı Çeşitlendirme', desc: 'Tek kaynağa bağımlılıktan kurtulun. Bireysel, kurumsal ve düzenli bağış modellerini bir arada kurgulayın.' },
  { kind: 'topic', n: 2, icon: Building2, title: 'Kurumsal İş Birlikleri', desc: 'Markalarla sürdürülebilir sponsorluk ve sosyal sorumluluk protokolleri tasarlayın, doğru teklifi hazırlayın.' },
  { kind: 'topic', n: 3, icon: ShoppingBag, title: 'Alışverişle Bağış Modeli', desc: 'Destekçilerinizin günlük alışverişini düzenli gelire dönüştüren hangel Bağış ekosistemini öğrenin.' },
  { kind: 'topic', n: 4, icon: Lightbulb, title: 'Sosyal Girişimcilik', desc: 'İktisadi işletme, sosyal girişim ve gelir getirici faaliyetlerle kurumunuzu mali olarak güçlendirin.' },
  { kind: 'topic', n: 5, icon: ShieldCheck, title: 'Şeffaflık ve Güven', desc: 'Şeffaflık endeksi ve raporlama ile bağışçı güvenini kazanın; güven, en güçlü gelir kaldıracınızdır.' },
  { kind: 'statement', big: 'Alışverişi bağışa\nçeviren ekosistem.', small: 'hangel ile destekçileriniz her gün, hiçbir ekstra ödeme yapmadan gelir üretir.' },
  { kind: 'quote', text: 'Şeffaflık,\nen güçlü gelir\nkaldıracınız.' },
  { kind: 'cta', title: 'Şehrini seç.\nYerini ayır.', sub: 'Ücretsiz · Sertifikalı · 10 şehir' },
];

export default function ConferenceDeckPage() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setI((cur) => {
      const target = Math.max(0, Math.min(SLIDES.length - 1, next));
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
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
      else if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, go, exit]);

  const slide = SLIDES[i];
  const isLight = slide.kind === 'cta' || slide.kind === 'title';

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden select-none ${isLight ? 'text-white' : 'bg-black text-white'}`}
      style={isLight ? { background: `linear-gradient(135deg, ${CORAL} 0%, #c5391b 100%)` } : undefined}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {/* Sol/sağ tıklama bölgeleri */}
      <button aria-label="Önceki" onClick={() => go(i - 1)} className="absolute left-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />
      <button aria-label="Sonraki" onClick={() => go(i + 1)} className="absolute right-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />

      {/* Kapat */}
      <button
        onClick={exit}
        aria-label="Kapat"
        className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Slayt sayacı */}
      <div className="absolute left-6 top-6 z-30 text-[13px] font-semibold tabular-nums text-white/50">
        {i + 1} / {SLIDES.length}
      </div>

      {/* Slayt içeriği */}
      <div key={i} className={`flex h-full w-full items-center justify-center px-8 ${dir === 1 ? 'animate-in slide-in-from-right-8' : 'animate-in slide-in-from-left-8'} fade-in duration-500`}>
        <div className="mx-auto w-full max-w-4xl text-center">
          {slide.kind === 'title' && (
            <>
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white/80">{slide.eyebrow}</p>
              <h1 className="whitespace-pre-line text-5xl font-black leading-[0.95] tracking-tighter sm:text-7xl lg:text-8xl">{slide.title}</h1>
              <p className="mt-3 text-2xl font-bold tracking-tight text-white/90 sm:text-4xl">{slide.sub}</p>
            </>
          )}

          {slide.kind === 'statement' && (
            <>
              <h2 className="whitespace-pre-line text-4xl font-black leading-[1.0] tracking-tighter sm:text-7xl">{slide.big}</h2>
              {slide.small && <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-white/55 sm:text-2xl">{slide.small}</p>}
            </>
          )}

          {slide.kind === 'quote' && (
            <h2 className="whitespace-pre-line text-4xl font-black leading-[1.05] tracking-tighter sm:text-7xl" style={{ color: CORAL }}>
              “{slide.text}”
            </h2>
          )}

          {slide.kind === 'divider' && (
            <>
              <div className="flex items-end justify-center gap-3">
                <span className="text-8xl font-black leading-none tracking-tighter sm:text-[10rem]" style={{ color: CORAL }}>{slide.num}</span>
                <span className="mb-3 text-4xl font-bold tracking-tight text-white/90 sm:text-6xl">{slide.label}</span>
              </div>
              <p className="mt-6 text-lg font-medium text-white/55 sm:text-2xl">{slide.sub}</p>
            </>
          )}

          {slide.kind === 'topic' && (
            <>
              <div className="mb-7 flex items-center justify-center gap-4">
                <span className="text-2xl font-black tabular-nums text-white/30">0{slide.n}</span>
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{ backgroundColor: `${CORAL}22` }}>
                  <slide.icon className="h-8 w-8" style={{ color: CORAL }} strokeWidth={1.9} />
                </span>
              </div>
              <h2 className="text-4xl font-black leading-tight tracking-tighter sm:text-6xl">{slide.title}</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/60 sm:text-2xl">{slide.desc}</p>
            </>
          )}

          {slide.kind === 'cta' && (
            <>
              <h2 className="whitespace-pre-line text-5xl font-black leading-[0.95] tracking-tighter sm:text-8xl">{slide.title}</h2>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-bold uppercase tracking-wider backdrop-blur sm:text-base">
                <Award className="h-4 w-4" /> {slide.sub}
              </p>
              <div className="mt-10">
                <button
                  onClick={() => router.push('/gelir-modeli-konferanslari')}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-[#c5391b] shadow-xl transition active:scale-95"
                >
                  <Sparkles className="h-5 w-5" /> Şehrini Seç, Kayıt Ol
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alt nokta göstergesi */}
      <div className="absolute inset-x-0 bottom-6 z-30 flex items-center justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            aria-label={`${idx + 1}. slayt`}
            onClick={() => go(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-7 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>

      {/* Sol/sağ ok ipuçları (masaüstü) */}
      {i > 0 && (
        <button onClick={() => go(i - 1)} aria-label="Önceki" className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {i < SLIDES.length - 1 && (
        <button onClick={() => go(i + 1)} aria-label="Sonraki" className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
