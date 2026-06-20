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
import { Star, Loader2, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';
import { eventStart, eventEnd, formatCountdown } from '@/lib/event-time';
import type { EventContributor } from '@/lib/types';

const HOUR = 3600_000;
const PRELIVE_WINDOW = 2 * HOUR; // başlangıca bu kadar kala geri sayım görünür

interface LiveEventSectionProps {
  eventId: string;
  event: { name: string; startDate: string; endDate?: string; completed?: boolean; contributors?: EventContributor[] };
  isGoing: boolean;
  isManager?: boolean;
  authUser: { getIdToken: () => Promise<string> } | null;
}

type LiveStats = { checkinCount: number; avgSpeakerRating: number; ratingCount: number };

export function LiveEventSection({ eventId, event, isGoing, isManager, authUser }: LiveEventSectionProps) {
  const { toast } = useToast();
  const [now, setNow] = useState(0);
  const [myRatings, setMyRatings] = useState<Record<number, number>>({});
  const [ratingBusy, setRatingBusy] = useState<number | null>(null);
  const [stats, setStats] = useState<LiveStats | null>(null);

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

  return (
    <section className="rounded-[1.75rem] border border-black/5 bg-card p-5 shadow-sm">
      {isLive ? (
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.15em] text-red-600">Canlı</span>
          </span>
          <span className="font-mono text-sm font-bold tabular-nums text-muted-foreground">Bitişe {formatCountdown(endMs - now)}</span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-bold text-muted-foreground">Başlamasına</span>
          <span className="font-mono text-2xl font-black tabular-nums text-foreground">{formatCountdown(startMs - now)}</span>
        </div>
      )}

      {/* Konuşmacılar — canlıda öne çıkar + "going" katılımcı 1-5 puan verir */}
      {isLive && contributors.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Konuşmacılar</p>
          {contributors.map((c, idx) => (
            <div key={idx} className="rounded-2xl bg-muted/40 p-3.5">
              <p className="truncate font-bold leading-tight">{c.name}</p>
              {c.title && <p className="truncate text-xs font-medium text-muted-foreground">{c.title}</p>}
              {isGoing ? (
                <div className="mt-2.5 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} yıldız`} disabled={ratingBusy === idx}
                      onClick={() => rate(idx, n)} className="transition active:scale-90 disabled:opacity-50">
                      <Star className={`h-7 w-7 ${(myRatings[idx] ?? 0) >= n ? 'fill-[#f34723] text-[#f34723]' : 'text-muted-foreground/40'}`} />
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
        <div className="mt-4 rounded-2xl border border-[#f34723]/20 bg-[#f34723]/5 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#f34723]">
            <UserCheck className="h-3.5 w-3.5" /> Yönetici paneli
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card p-3.5 text-center shadow-sm">
              <p className="text-3xl font-black tabular-nums leading-none text-foreground">{stats?.checkinCount ?? '—'}</p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Check-in</p>
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
                      ? 'fill-[#f34723] text-[#f34723]'
                      : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Konuşmacı puanı{stats && stats.ratingCount > 0 ? ` (${stats.ratingCount})` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
