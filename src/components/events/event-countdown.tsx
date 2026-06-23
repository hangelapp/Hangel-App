'use client';

/**
 * Etkinlik geri sayımı — her saniye güncellenir (setInterval). Başlamadan önce
 * "… kaldı", başladıysa "CANLI", bittiyse "sona erdi" gösterir.
 */
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { eventStart, eventPhase, type EventLike } from '@/lib/event-time';

// Geri sayım: saat:dakika:saniye (saat 24'ü aşabilir → 50:23:11).
function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function EventCountdown({ event, className }: { event: EventLike; className?: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = eventStart(event);
  if (!start || !now) return null;

  const phase = eventPhase(event, now);

  if (phase === 'live') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 font-bold text-red-600', className)}>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
        </span>
        CANLI · şu an devam ediyor
      </span>
    );
  }
  if (phase === 'ended') {
    return <span className={cn('font-medium text-muted-foreground', className)}>Etkinlik sona erdi</span>;
  }
  return (
    <span className={cn('font-bold tabular-nums', className)}>
      Başlamasına {clock(start.getTime() - now)}
    </span>
  );
}

/**
 * DualCountdown — başlamasına geri sayar; başlayınca BİTİŞE geri sayar.
 * Tarih + saat AYRI ("YYYY-MM-DD" + "HH:mm", gönüllülük) ya da birleşik gelebilir.
 * Bitiş yoksa başlangıç + 3 saat varsayılır. Sona erince gizlenir.
 *
 * Apple-temiz: SAYI öne çıkar (büyük, üstte), başlama saati/etiketi altta kalır.
 * Başlamadan önce, başlangıca yaklaştıkça %100'e dolan bir İLERLEME ÇİZGİSİ çizilir
 * (referans pencere = son 24 saat; 24 saatten uzaksa çizgi gizli, sade geri sayım).
 */
const PRELIVE_PROGRESS_WINDOW = 24 * 3600_000;
export function DualCountdown({ start, startTime, end, endTime, className }: { start?: string; startTime?: string; end?: string; endTime?: string; className?: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startStr = start ? (startTime ? `${start} ${startTime}` : start) : undefined;
  const endStr = end ? (endTime ? `${end} ${endTime}` : end) : undefined;
  const startD = eventStart({ startDate: startStr });
  if (!startD || !now) return null;
  const startMs = startD.getTime();
  const endD = eventStart({ startDate: endStr });
  const endMs = endD ? endD.getTime() : startMs + 3 * 3600_000;
  if (now > endMs) return null; // sona erdi → gösterme

  const live = now >= startMs;
  const remaining = (live ? endMs : startMs) - now;

  // Başlamadan önce: başlangıca yaklaştıkça dolan ilerleme (0→100). Canlıda: bitişe doğru azalan.
  let progress: number;
  if (live) {
    progress = Math.max(0, Math.min(100, ((endMs - now) / (endMs - startMs)) * 100));
  } else {
    const span = Math.min(PRELIVE_PROGRESS_WINDOW, startMs - (startMs - PRELIVE_PROGRESS_WINDOW));
    const elapsed = PRELIVE_PROGRESS_WINDOW - (startMs - now);
    progress = (startMs - now) <= PRELIVE_PROGRESS_WINDOW ? Math.max(0, Math.min(100, (elapsed / span) * 100)) : 0;
  }
  const showProgress = live || (startMs - now) <= PRELIVE_PROGRESS_WINDOW;

  return (
    <div className={cn('rounded-2xl border p-4', live ? 'border-red-500/25 bg-red-500/5' : 'border-primary/20 bg-primary/5', className)}>
      {/* SAYI öne çıkar — büyük, üstte; etiket altta. (Konum yer değiştirdi.) */}
      <div className="flex items-end justify-between gap-3">
        <span className={cn('font-mono text-3xl sm:text-4xl font-black tabular-nums leading-none', live ? 'text-red-600' : 'text-foreground')}>
          {clock(remaining)}
        </span>
        <span className="inline-flex items-center gap-2 pb-0.5">
          {live ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-600">Canlı · Bitişe</span>
            </>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Başlamasına</span>
          )}
        </span>
      </div>
      {/* İlerleme çizgisi — başlangıca/bitişe doğru dolar */}
      {showProgress && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', live ? 'bg-red-500' : 'bg-primary')}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Etkinlik kartı için kompakt geri sayım rozeti — SADECE başlangıca <24 saat
 * kalınca görünür ("3sa 12dk" / "45 dk"). Dakika hassasiyeti (30 sn'de bir tik).
 */
const DAY_MS = 24 * 3600_000;
export function EventCardCountdownBadge({ event, className }: { event: EventLike; className?: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const start = eventStart(event);
  if (!start || !now) return null;
  const diff = start.getTime() - now;
  if (diff <= 0 || diff > DAY_MS) return null; // sadece <24s ve henüz başlamadıysa

  const totalMin = Math.floor(diff / 60_000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  const label = h > 0 ? `${h}sa ${m}dk` : `${m} dk`;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-black uppercase tracking-wide tabular-nums text-primary-foreground shadow-md ring-1 ring-black/5 backdrop-blur-md', className)}>
      ⏳ {label}
    </span>
  );
}
