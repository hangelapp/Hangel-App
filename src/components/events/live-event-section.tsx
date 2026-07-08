'use client';

/**
 * LiveEventSection — OTOMATİK canlı etkinlik modu (Apple kimliği, coral vurgu).
 * Manuel "başlat/bitir" YOK — tamamen zaman-türevli:
 *   • Başlangıca ≤2 saat: "Başlamasına …" geri sayımı akar.
 *   • Başlangıç→bitiş arası: "🔴 CANLI · Bitişe …" geri sayımı akar + konuşmacıya
 *     canlı puan (SADECE "going" RSVP'li katılımcı).
 *   • Yönetici etkinliği "Tamamla" deyince (completed=true) → canlı otomatik biter.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Loader2, UserCheck, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';
import { eventStart, eventEnd, formatCountdown } from '@/lib/event-time';
import type { EventContributor } from '@/lib/types';

const HOUR = 3600_000;
const PRELIVE_WINDOW = 2 * HOUR; // başlangıca bu kadar kala geri sayım görünür

// Canlı etkinlik geri sayımı: gün · saat · dakika · saniye ("2 gün 4 sa 13 dk 09 sn").
function fmtClock(ms: number): string {
  return formatCountdown(ms);
}

interface LiveEventSectionProps {
  eventId: string;
  event: {
    name: string;
    startDate: string;
    endDate?: string;
    completed?: boolean;
    contributors?: EventContributor[];
    organizer?: string;
    organizerLogoUrl?: string;
    slug?: string;
  };
  isGoing: boolean;
  isManager?: boolean;
  authUser: { getIdToken: () => Promise<string> } | null;
  /** Etkinlik gününün hava özeti — küçük badge olarak kart içinde gösterilir (fiziksel etkinlikte). */
  weather?: { emoji: string; tempMax: number; tempMin: number; label: string } | null;
}

type LiveStats = { checkinCount: number; avgSpeakerRating: number; ratingCount: number };

export function LiveEventSection({ eventId, event, isGoing, isManager, authUser, weather }: LiveEventSectionProps) {
  const { toast } = useToast();
  const [now, setNow] = useState(0);
  const [myRatings, setMyRatings] = useState<Record<number, number>>({});
  const [ratingBusy, setRatingBusy] = useState<number | null>(null);
  const [stats, setStats] = useState<LiveStats | null>(null);
  // Hava durumu badge'i varsayılan kapalı — ana içeriği bastırmasın; kullanıcı isterse detay açar.
  const [weatherExpanded, setWeatherExpanded] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Yönetici canlı paneli — 12 sn'de bir check-in + ortalama konuşmacı puanını çek.
  const startMsForPoll = eventStart(event)?.getTime() ?? NaN;
  const endMsForPoll = eventEnd(event)?.getTime() ?? (isNaN(startMsForPoll) ? NaN : startMsForPoll + 3 * HOUR);
  const liveForPoll = !!now && !isNaN(startMsForPoll) && event.completed !== true && now >= startMsForPoll && now <= endMsForPoll;
  useEffect(() => {
    if (!isManager || !liveForPoll || !authUser) return;
    let active = true;
    const load = async () => {
      try {
        const token = await authUser.getIdToken();
        const res = await fetch(`/api/events/${eventId}/live-stats`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = (await res.json()) as LiveStats;
        if (active) setStats(data);
      } catch { /* canlı panel best-effort; sessiz başarısız */ }
    };
    void load();
    const t = setInterval(load, 12_000);
    return () => { active = false; clearInterval(t); };
  }, [isManager, liveForPoll, authUser, eventId]);

  const startMs = eventStart(event)?.getTime() ?? NaN;
  const endMs = eventEnd(event)?.getTime() ?? (isNaN(startMs) ? NaN : startMs + 3 * HOUR);
  const contributors = event.contributors ?? [];

  // Görünürlük penceresi: completed değil + başlangıca ≤2h + bitiş geçmemiş.
  if (!now || isNaN(startMs)) return null;
  if (event.completed === true) return null;
  if (now < startMs - PRELIVE_WINDOW) return null;
  if (now > endMs) return null;

  const isLive = now >= startMs && now <= endMs;

  // İlerleme çizgisi: başlamadan önce başlangıca yaklaştıkça %100'e dolar
  // (referans pencere = görünürlük penceresi, 2 saat); canlıda bitişe doğru azalır.
  const progressPct = isLive
    ? Math.max(0, Math.min(100, ((endMs - now) / (endMs - startMs)) * 100))
    : Math.max(0, Math.min(100, ((PRELIVE_WINDOW - (startMs - now)) / PRELIVE_WINDOW) * 100));

  const startClock = (() => {
    const d = eventStart(event);
    if (!d) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const rate = async (idx: number, rating: number) => {
    if (!authUser) return;
    setRatingBusy(idx);
    setMyRatings((p) => ({ ...p, [idx]: rating }));
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/events/${eventId}/rate-speaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contributorIndex: idx, rating }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.message || 'Hata'); }
      celebrate();
      toast({ title: 'Puanın kaydedildi 🧡', description: 'Teşekkürler!' });
    } catch (e) {
      setMyRatings((p) => { const n = { ...p }; delete n[idx]; return n; });
      toast({ variant: 'destructive', title: 'Puan kaydedilemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally { setRatingBusy(null); }
  };

  // Etkinlik hem öncesinde hem esnasında kart tıklanabilir → detay sayfasına gider.
  // Slug varsa /events/[slug]'a, yoksa /events/[eventId]'e bağla (asla ölü link).
  const detailHref = `/events/${event.slug || eventId}`;
  const HeaderWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Link href={detailHref} className="block -m-1 rounded-2xl p-1 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${event.name} etkinliğini aç`}>
      {children}
    </Link>
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <HeaderWrap>
      {/* Üst satır: düzenleyen kurum logosu/adı + (varsa) hava badge — canlı modda ekranda görünür */}
      {(event.organizerLogoUrl || event.organizer || weather) && (
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {event.organizerLogoUrl ? (
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.organizerLogoUrl} alt={event.organizer || 'Düzenleyen'} className="h-full w-full object-contain" />
            </span>
          ) : event.organizer ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
              {(event.organizer || '?').slice(0, 2).toLocaleUpperCase('tr')}
            </span>
          ) : null}
          {event.organizer && (
            <span className="min-w-0 flex-1 break-words text-xs font-bold uppercase tracking-wider text-muted-foreground">{event.organizer}</span>
          )}
          {weather && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWeatherExpanded((v) => !v); }}
              aria-expanded={weatherExpanded}
              aria-label={`Hava durumu ${weather.tempMax}° ${weather.label}`}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground/80 transition hover:bg-muted"
            >
              <span aria-hidden className="text-sm leading-none">{weather.emoji}</span>
              <span>{weather.tempMax}°</span>
              {weatherExpanded && (
                <span className="max-w-[120px] truncate text-[11px] font-medium text-muted-foreground">{weather.label} · {weather.tempMin}°</span>
              )}
              <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${weatherExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* SAYI öne çıkar (büyük, üstte); etiket + başlama saati altta — konum yer değiştirdi */}
      {isLive ? (
        <div>
          <div className="flex items-end justify-between gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black tabular-nums leading-none text-red-600">{fmtClock(endMs - now)}</span>
            <span className="inline-flex items-center gap-2 pb-0.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.15em] text-red-600">Canlı · Bitişe</span>
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-red-500 transition-[width] duration-1000 ease-linear" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black tabular-nums leading-none text-foreground">{fmtClock(startMs - now)}</span>
            <span className="flex flex-col items-end pb-0.5 text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Başlamasına</span>
              {startClock && <span className="text-xs font-semibold tabular-nums text-muted-foreground/80">başlangıç {startClock}</span>}
            </span>
          </div>
          {/* İlerleme çizgisi — başlangıca yaklaştıkça %100'e dolar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
      </HeaderWrap>

      {/* Konuşmacılar — canlıda öne çıkar + "going" katılımcı 1-5 puan verir */}
      {isLive && contributors.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Konuşmacılar</p>
          {contributors.map((c, idx) => (
            <div key={idx} className="rounded-2xl bg-muted/40 p-3.5">
              <p className="break-words font-bold leading-tight">{c.name}</p>
              {c.title && <p className="truncate text-xs font-medium text-muted-foreground">{c.title}</p>}
              {isGoing ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} yıldız`} disabled={ratingBusy === idx}
                      onClick={() => rate(idx, n)}
                      className="flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-50 hover:bg-primary/10">
                      <Star className={`h-7 w-7 ${(myRatings[idx] ?? 0) >= n ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`} />
                    </button>
                  ))}
                  {ratingBusy === idx && <Loader2 className="ml-1 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium text-muted-foreground">Puan vermek için etkinliğe katıl.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Yönetici paneli — SADECE canlıda + yöneticide görünür (katılımcı görmez) */}
      {isLive && isManager && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
            <UserCheck className="h-3.5 w-3.5" /> Yönetici paneli
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card p-3.5 text-center shadow-sm">
              <p className="text-3xl font-black tabular-nums leading-none text-foreground">{stats?.checkinCount ?? '—'}</p>
              <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Check-in</p>
            </div>
            <div className="rounded-2xl bg-card p-3.5 text-center shadow-sm">
              <p className="text-3xl font-black tabular-nums leading-none text-foreground">
                {stats && stats.ratingCount > 0 ? stats.avgSpeakerRating.toFixed(1) : '—'}
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${stats && stats.ratingCount > 0 && Math.round(stats.avgSpeakerRating) >= n
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Konuşmacı puanı{stats && stats.ratingCount > 0 ? ` (${stats.ratingCount})` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
