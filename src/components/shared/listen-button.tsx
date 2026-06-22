'use client';

/**
 * ListenButton — "Dinle" (Sesli oku)
 * ----------------------------------
 * Erişilebilirlik (kör / az gören) + multitasking için içeriği yüksek sesle
 * okur. Tarayıcının yerleşik Web Speech API'sini (window.speechSynthesis)
 * kullanır; ek bir servis veya ücret gerektirmez.
 *
 * Davranış:
 *  - Oynat / Duraklat (devam et) / Durdur kontrolleri.
 *  - Konuşurken animasyonlu (canlı) durum gösterir.
 *  - Türkçe ses (lang='tr-TR') varsa otomatik seçer; sesler asenkron
 *    yüklenebildiği için `voiceschanged` olayını dinler.
 *  - speechSynthesis desteklenmiyorsa hiçbir şey render etmez (graceful).
 *  - Capacitor (iOS/Android) WebView'leri de speechSynthesis sağlar; native
 *    özel API gerekmez. Yine de tarayıcı API'si yoksa sessizce devre dışı kalır.
 *
 * Kullanım:
 *   <ListenButton text="Okunacak metin" />
 *   <ListenButton getText={() => post.content} />  // metni okuma anında üret
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SpeakState = 'idle' | 'speaking' | 'paused';

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

/**
 * HTML / fazla boşluk içeren metni sesli okumaya uygun düz metne çevirir.
 * DOM varsa textContent ile (entity'ler dahil) güvenli ayıklar; yoksa regex.
 */
function toPlainText(raw: string): string {
  const input = (raw || '').trim();
  if (!input) return '';
  const looksLikeHtml = /<[a-z!/][\s\S]*>/i.test(input);
  if (looksLikeHtml && typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = input;
    return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ListenButton({
  text,
  getText,
  className,
  variant = 'ghost',
  size = 'sm',
  label = 'Dinle',
}: {
  /** Doğrudan okunacak metin. */
  text?: string;
  /** Okuma anında metni üreten fonksiyon (örn. uzun/HTML içerik). */
  getText?: () => string;
  className?: string;
  /** Button varyantı — varsayılan: ghost. */
  variant?: React.ComponentProps<typeof Button>['variant'];
  /** Button boyutu — varsayılan: sm (yine de min 44px dokunma alanı korunur). */
  size?: React.ComponentProps<typeof Button>['size'];
  /** Görünür etiket; gizlemek için boş string verin. */
  label?: string;
}) {
  // İlk render'da SSR/CSR uyumu için her zaman aynı kalmalı; desteği
  // mount sonrası kontrol ediyoruz.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<SpeakState>('idle');
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Destek tespiti + Türkçe ses seçimi (sesler asenkron yüklenebilir).
  useEffect(() => {
    const synth = getSynth();
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
      setSupported(false);
      return;
    }
    setSupported(true);

    const pickVoice = () => {
      const voices = synth.getVoices?.() || [];
      if (!voices.length) return;
      // Önce tam tr-TR, sonra herhangi bir "tr" ile başlayan dil.
      voiceRef.current =
        voices.find((v) => v.lang?.toLowerCase() === 'tr-tr') ||
        voices.find((v) => v.lang?.toLowerCase().startsWith('tr')) ||
        null;
    };

    pickVoice();
    synth.addEventListener?.('voiceschanged', pickVoice);
    return () => {
      synth.removeEventListener?.('voiceschanged', pickVoice);
    };
  }, []);

  // Bileşen DOM'dan kalkarken okumayı durdur (sayfa değişiminde devam etmesin).
  useEffect(() => {
    return () => {
      const synth = getSynth();
      try {
        synth?.cancel();
      } catch {
        /* no-op */
      }
    };
  }, []);

  const speak = useCallback(() => {
    const synth = getSynth();
    if (!synth) return;
    const content = toPlainText(getText ? getText() : text || '');
    if (!content) return;

    // Önceki okumayı temizle.
    try {
      synth.cancel();
    } catch {
      /* no-op */
    }

    const utter = new SpeechSynthesisUtterance(content);
    utter.lang = 'tr-TR';
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setState('idle');
    utter.onerror = () => setState('idle');
    utterRef.current = utter;

    setState('speaking');
    synth.speak(utter);
  }, [getText, text]);

  const handlePrimary = useCallback(() => {
    const synth = getSynth();
    if (!synth) return;
    if (state === 'idle') {
      speak();
    } else if (state === 'speaking') {
      try {
        synth.pause();
      } catch {
        /* no-op */
      }
      setState('paused');
    } else if (state === 'paused') {
      try {
        synth.resume();
      } catch {
        /* no-op */
      }
      setState('speaking');
    }
  }, [speak, state]);

  const handleStop = useCallback(() => {
    const synth = getSynth();
    try {
      synth?.cancel();
    } catch {
      /* no-op */
    }
    setState('idle');
  }, []);

  if (!supported) return null;

  const isActive = state !== 'idle';
  const primaryLabel =
    state === 'idle' ? label : state === 'speaking' ? 'Duraklat' : 'Devam et';
  const PrimaryIcon = state === 'speaking' ? Pause : state === 'paused' ? Play : Volume2;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handlePrimary}
        aria-label={primaryLabel}
        aria-pressed={isActive}
        className={cn(
          'gap-1.5 rounded-2xl text-muted-foreground',
          isActive && 'text-primary',
        )}
      >
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          {state === 'speaking' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
          )}
          <PrimaryIcon className="relative h-4 w-4" />
        </span>
        {label ? <span className="text-xs font-medium">{primaryLabel}</span> : null}
      </Button>

      {isActive && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleStop}
          aria-label="Durdur"
          className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-primary"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      )}
    </div>
  );
}

export default ListenButton;
