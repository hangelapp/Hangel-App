'use client';

/**
 * Etkinlik geri sayımı — her saniye güncellenir (setInterval). Başlamadan önce
 * "… kaldı", başladıysa "CANLI", bittiyse "sona erdi" gösterir.
 */
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { eventStart, eventPhase, formatCountdown, type EventLike } from '@/lib/event-time';

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
        <span className="relative flex h-2.5 w-2.5">
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
      Başlamasına {formatCountdown(start.getTime() - now)} kaldı
    </span>
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
    <span className={cn('inline-flex items-center gap-1 rounded-lg bg-primary/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary-foreground shadow-sm backdrop-blur-md', className)}>
      ⏳ {label}
    </span>
  );
}
