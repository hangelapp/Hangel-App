'use client';

/**
 * DistanceBadge — hedef konuma (etkinlik/gönüllülük/kan) uzaklığı km + ~dk gösterir.
 *
 * Kullanıcı konumu bir kez alınıp cache'lenir (in-memory + localStorage, 12 saat),
 * böylece her sayfa/kart tekrar izin istemez. İzin zaten verildiyse otomatik ölçer;
 * verilmediyse "konum izni verirsen mesafeni gösteririm" şeklinde tıklanabilir CTA.
 *
 * target koordinatı yoksa hiçbir şey çizmez (adresin yanında sessizce görünmez).
 */
import { useEffect, useState, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { getCurrentPositionUnified } from '@/lib/native-geolocation';
import { distanceSummary, formatKm, formatMinutes, type LatLon } from '@/lib/geo-distance';
import { cn } from '@/lib/utils';

type Status = 'unknown' | 'loading' | 'ready' | 'denied';
const CACHE_KEY = 'hangel_user_coords';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

let memCoords: LatLon | null = null;

function readCache(): LatLon | null {
  if (memCoords) return memCoords;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { lat: number; lon: number; ts: number };
    if (Date.now() - o.ts > MAX_AGE_MS) return null;
    memCoords = { lat: o.lat, lon: o.lon };
    return memCoords;
  } catch { return null; }
}

function writeCache(c: LatLon) {
  memCoords = c;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...c, ts: Date.now() })); } catch { /* yoksay */ }
}

export function DistanceBadge({
  target,
  className,
}: {
  target?: { lat?: number | null; lon?: number | null } | null;
  className?: string;
}) {
  const hasTarget = Number.isFinite(target?.lat) && Number.isFinite(target?.lon);
  const [coords, setCoords] = useState<LatLon | null>(null);
  const [status, setStatus] = useState<Status>('unknown');
  const [result, setResult] = useState<string | null>(null);

  const request = useCallback(async () => {
    setStatus('loading');
    try {
      const pos = await getCurrentPositionUnified();
      if (pos) {
        const c = { lat: pos.latitude, lon: pos.longitude };
        writeCache(c);
        setCoords(c);
        setStatus('ready');
      } else {
        setStatus('denied');
      }
    } catch {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    if (!hasTarget) return;
    const cached = readCache();
    if (cached) { setCoords(cached); setStatus('ready'); return; }
    // İzin zaten verildiyse sessizce ölç; değilse CTA göster.
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((res) => { if (res.state === 'granted') request(); })
        .catch(() => { /* permissions API yoksa CTA kalır */ });
    }
  }, [hasTarget, request]);

  // Konum + hedef hazır → gerçek sürüş mesafesi/süresi (OSRM); başarısızsa kuş-uçuşu tahmin.
  useEffect(() => {
    if (status !== 'ready' || !coords || !hasTarget) return;
    const tLat = target!.lat as number;
    const tLon = target!.lon as number;
    let active = true;
    (async () => {
      try {
        const r = await fetch(`/api/route?fromLat=${coords.lat}&fromLon=${coords.lon}&toLat=${tLat}&toLon=${tLon}`);
        if (r.ok) {
          const j = await r.json() as { km?: number; minutes?: number };
          if (active && typeof j.km === 'number' && typeof j.minutes === 'number') {
            setResult(`${formatKm(j.km)} · ${formatMinutes(j.minutes, false)}`);
            return;
          }
        }
      } catch { /* OSRM başarısız → tahmine düş */ }
      if (active) setResult(distanceSummary(coords, { lat: tLat, lon: tLon }).text);
    })();
    return () => { active = false; };
  }, [status, coords, hasTarget, target]);

  if (!hasTarget) return null;

  if (status === 'ready' && coords) {
    // Gerçek sürüş (OSRM) hazırsa onu, değilse anında kuş-uçuşu tahmini göster.
    const text = result ?? distanceSummary(coords, { lat: target!.lat as number, lon: target!.lon as number }).text;
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-primary', className)}>
        <MapPin className="h-3.5 w-3.5" /> {text} uzakta
      </span>
    );
  }

  if (status === 'loading') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mesafe ölçülüyor…
      </span>
    );
  }

  // unknown / denied → tıklanabilir CTA
  return (
    <button
      type="button"
      onClick={request}
      className={cn('inline-flex items-center gap-1 text-xs font-medium text-primary/90 hover:text-primary underline-offset-2 hover:underline text-left', className)}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      {status === 'denied'
        ? 'Konum kapalı — açıp dokun, ne kadar uzakta olduğunu göstereyim'
        : 'Konum izni verirsen ne kadar uzakta olduğunu (km · süre) gösteririm'}
    </button>
  );
}
