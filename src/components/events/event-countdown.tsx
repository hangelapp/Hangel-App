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
