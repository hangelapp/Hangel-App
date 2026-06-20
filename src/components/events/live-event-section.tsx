'use client';

/**
 * LiveEventSection — canlı etkinlik modu (Apple kimliği, coral vurgu).
 *
 *  • Yaklaşan etkinlik (başlangıca ≤2 saat): boşalan ilerleme çizgisi + geri sayım.
 *  • Canlı (saatten otomatik türetilir, yönetici aksiyonu gerekmez): dolan ilerleme
 *    çizgisi + CANLI bandı + konuşmacılar öne çıkar; yönetici "Etkinliği kapat".
 *  • SADECE "going" RSVP'li katılımcı konuşmacıya canlı puan (1-5) verebilir.
 *  • event.completed → hiçbir şey gösterme.
 */

import React, { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';
import type { EventContributor } from '@/lib/types';

const HOUR = 3600_000;
const PRE_WINDOW = 2 * HOUR; // başlangıçtan önce canlı UI'nin açıldığı pencere
const DEFAULT_DURATION = 3 * HOUR; // endDate yoksa varsayılan süre

const CORAL = '#f34723';

interface LiveEventSectionProps {
  eventId: string;
  event: { name: string; startDate: string; endDate?: string; live?: boolean; contributors?: EventContributor[]; completed?: boolean };
  isManager: boolean;
  isGoing: boolean;
  authUser: { getIdToken: () => Promise<string> } | null;
}

type Phase = 'pre' | 'live' | null;

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d} gün ${h} saat`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function LiveEventSection({ eventId, event, isManager, isGoing, authUser }: LiveEventSectionProps) {
  const { toast } = useToast();
  const [now, setNow] = useState<number>(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [myRatings, setMyRatings] = useState<Record<number, number>>({});
  const [ratingBusy, setRatingBusy] = useState<number | null>(null);

  const startMs = Date.parse(event.startDate?.replace(' ', 'T') || '') || NaN;
  const hasStart = !isNaN(startMs) && startMs > 0;
  const endMs = event.endDate ? (Date.parse(event.endDate.replace(' ', 'T')) || NaN) : NaN;
  const liveFlag = event.live === true;
  const contributors = event.contributors ?? [];

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Kapatılmış etkinlik → hiçbir canlı UI gösterme.
  if (event.completed === true) return null;

  // Geçerli bir başlangıç yoksa ve canlı değilse hiçbir şey gösterme.
  if (!liveFlag && !hasStart) return null;

  // Bitiş zamanı: endDate yoksa start + varsayılan süre.
  const computedEndMs = !isNaN(endMs) && endMs > startMs ? endMs : (hasStart ? startMs + DEFAULT_DURATION : NaN);

  // Faz tamamen saatten türetilir (yönetici aksiyonu gerekmez).
  // 'pre'  = başlangıçtan önceki 2 saatlik pencere içindeyiz.
  // 'live' = başlangıç ile bitiş arasındayız (ya da event.live === true).
  let phase: Phase = null;
  if (liveFlag || (hasStart && now >= startMs && now <= computedEndMs)) {
    phase = 'live';
  } else if (hasStart && now >= startMs - PRE_WINDOW && now < startMs) {
    phase = 'pre';
  }
  const isLive = phase === 'live';

  // İlerleme çizgisi yüzdeleri (defansif: NaN / sıfır süre korumalı, 0..100 clamp).
  const prePct = phase === 'pre' ? clampPct(((startMs - now) / PRE_WINDOW) * 100) : 0; // boşalır
  const liveDuration = computedEndMs - startMs;
  const livePct = phase === 'live' && liveDuration > 0 ? clampPct(((now - startMs) / liveDuration) * 100) : (phase === 'live' ? 100 : 0); // dolar

  const callLive = async (action: 'start' | 'end') => {
    if (!authUser) return;
    setBusy(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/events/${eventId}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.message || 'Hata'); }
      toast({ title: action === 'start' ? '🔴 Canlı yayın başladı' : 'Canlı yayın bitti', description: action === 'start' ? 'Katılımcılara bildirim gönderildi.' : 'Etkinliği "Tamamla" ile sertifikaları gönderebilirsin.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: e instanceof Error ? e.message : 'Hata' });
    } finally { setBusy(false); }
  };

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
      {phase === 'live' ? (
        <div className="mb-4 flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <span className="text-sm font-black uppercase tracking-[0.15em] text-red-600">Canlı</span>
          <span className="truncate text-sm font-semibold text-muted-foreground">· {event.name}</span>
        </div>
      ) : phase === 'pre' ? (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <span className="text-sm font-bold text-muted-foreground">Başlamasına</span>
          <span className="font-mono text-2xl font-black tabular-nums text-foreground">{fmtCountdown(startMs - now)}</span>
        </div>
      ) : null}

      {/* İlerleme çizgisi: pre'de boşalır (start'ta 0), live'da dolar (bitişte 100). */}
      {(phase === 'pre' || phase === 'live') && (
        <div className="mb-4">
          {phase === 'live' && (
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
              </span>
              <span className="text-xs font-bold text-muted-foreground">Etkinlik başladı · devam ediyor</span>
            </div>
          )}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar"
            aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={Math.round(phase === 'pre' ? prePct : livePct)}>
            <div className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${phase === 'pre' ? prePct : livePct}%`, backgroundColor: CORAL }} />
          </div>
        </div>
      )}

      {/* Yönetici kontrolleri — sadece canlıyken "Etkinliği kapat". */}
      {isManager && isLive && (
        <div className="mb-4">
          <Button onClick={() => callLive('end')} disabled={busy} variant="outline"
            className="h-12 w-full rounded-2xl border-red-600/40 text-base font-bold text-red-600 hover:bg-red-50">
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Etkinliği kapat
          </Button>
        </div>
      )}

      {/* Konuşmacılar — canlıda öne çıkar + going katılımcı puan verir */}
      {isLive && contributors.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Konuşmacılar</p>
          {contributors.map((c, idx) => (
            <div key={idx} className="rounded-2xl bg-muted/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold leading-tight">{c.name}</p>
                  {c.title && <p className="truncate text-xs font-medium text-muted-foreground">{c.title}</p>}
                </div>
              </div>
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
    </section>
  );
}
