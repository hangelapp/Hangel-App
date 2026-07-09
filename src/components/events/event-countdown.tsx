'use client';

/**
 * Etkinlik/gönüllülük geri sayımı — her saniye güncellenir (setInterval).
 * Format: GÜN · SAAT · DAKİKA · SANİYE (dört kutu). Başlamadan önce başlangıca,
 * başladıktan sonra bitişe geri sayar; ikisinde de aynı gün+sa+dk+sn biçiminde.
 * Bittiğinde "sona erdi" gösterir.
 */
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { eventStart, eventPhase, countdownParts, type EventLike } from '@/lib/event-time';

/** Dört birim kutusu: gün / saat / dakika / saniye. `live` iken kırmızı vurgu. */
function UnitBoxes({ ms, live, size = 'md', className }: {
  ms: number;
  live?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { days, hours, minutes, seconds } = countdownParts(ms);
  const units: Array<{ v: number; label: string }> = [
    { v: days, label: 'gün' },
    { v: hours, label: 'saat' },
    { v: minutes, label: 'dk' },
    { v: seconds, label: 'sn' },
  ];
  // Apple-temiz: kenarlık/kutu YOK — büyük tabular sayı + altında minik etiket,
  // birimler boşlukla ayrılır (iki nokta yok). Canlıda yalnız kırmızı metin vurgusu.
  const numCls = size === 'lg' ? 'text-3xl sm:text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  const gapCls = size === 'lg' ? 'gap-5 sm:gap-7' : size === 'sm' ? 'gap-3' : 'gap-4';
  return (
    <div className={cn('inline-flex items-start', gapCls, className)}>
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <span className={cn('font-semibold leading-none tabular-nums tracking-tight', numCls, live ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
            {String(u.v).padStart(2, '0')}
          </span>
          <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{u.label}</span>
        </div>
      ))}
    </div>
  );
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

  if (phase === 'ended') {
    return <span className={cn('font-medium text-muted-foreground', className)}>Etkinlik sona erdi</span>;
  }

  // upcoming → başlangıca; live → bitişe (endDate yoksa başlangıç+3sa) geri say.
  const live = phase === 'live';
  const targetMs = live
    ? (eventStart({ startDate: event.endDate ?? undefined })?.getTime() ?? start.getTime() + 3 * 3600_000)
    : start.getTime();
  const remaining = targetMs - now;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {live && (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
        </span>
      )}
      <span className={cn('text-xs font-bold uppercase tracking-wider', live ? 'text-red-600' : 'text-muted-foreground')}>
        {live ? 'Canlı · Bitişe' : 'Başlamasına'}
      </span>
      <UnitBoxes ms={remaining} live={live} size="sm" />
    </span>
  );
}

/**
 * DualCountdown — başlamasına geri sayar; başlayınca BİTİŞE geri sayar.
 * Tarih + saat AYRI ("YYYY-MM-DD" + "HH:mm", gönüllülük) ya da birleşik gelebilir.
 * Bitiş yoksa başlangıç + 3 saat varsayılır. Sona erince "sona erdi" gösterir.
 *
 * Apple-temiz: GÜN · SAAT · DK · SN dört kutu; etiket üstte (Başlamasına / Canlı · Bitişe).
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

  const ended = now > endMs;
  const live = !ended && now >= startMs;
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
  const showProgress = !ended && (live || (startMs - now) <= PRELIVE_PROGRESS_WINDOW);

  return (
    <div className={cn('rounded-2xl p-4', live ? 'bg-red-500/[0.06]' : ended ? 'bg-muted/40' : 'bg-primary/[0.04]', className)}>
      <div className="mb-2 flex items-center gap-2">
        {live ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-600">Canlı · Bitişe</span>
          </>
        ) : ended ? (
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sona erdi</span>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Başlamasına</span>
        )}
      </div>
      {ended ? (
        <span className="font-medium text-muted-foreground">Bu program tamamlandı.</span>
      ) : (
        <UnitBoxes ms={remaining} live={live} size="lg" />
      )}
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
