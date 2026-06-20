/**
 * Etkinlik zaman yardımcıları.
 * Tarih/saat string olarak saklanır: startDate/endDate = "YYYY-MM-DD HH:mm"
 * (saat dilimi işareti yok → yerel/Europe-Istanbul varsayılır). Eski kayıtlarda
 * date ("YYYY-MM-DD") + time ("HH:mm") ayrı olabilir.
 */

export interface EventLike {
  startDate?: string | null;
  endDate?: string | null;
  date?: string | null;
  time?: string | null;
}

function parseLocal(s?: string | null): Date | null {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d, hh, mm] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh || '0'), Number(mm || '0'), 0, 0);
}

export function eventStart(e: EventLike | null | undefined): Date | null {
  if (!e) return null;
  if (e.startDate) return parseLocal(e.startDate);
  if (e.date && e.time) return parseLocal(`${e.date} ${e.time}`);
  return parseLocal(e.date);
}

export function eventEnd(e: EventLike | null | undefined): Date | null {
  return parseLocal(e?.endDate);
}

export type EventPhase = 'upcoming' | 'live' | 'ended';

// Bitiş yoksa başlangıç + 3 saat varsayılır.
const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export function eventPhase(e: EventLike | null | undefined, now: number = Date.now()): EventPhase {
  const s = eventStart(e);
  if (!s) return 'upcoming';
  const st = s.getTime();
  const en = eventEnd(e)?.getTime() ?? st + DEFAULT_DURATION_MS;
  if (now < st) return 'upcoming';
  if (now <= en) return 'live';
  return 'ended';
}

export function isLiveEvent(e: EventLike | null | undefined, now: number = Date.now()): boolean {
  return eventPhase(e, now) === 'live';
}

/** ms farkını "2 gün 4 sa 13 dk 09 sn" gibi biçimler (negatifse '0 sn'). */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0 sn';
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} gün`);
  if (d > 0 || h > 0) parts.push(`${h} sa`);
  parts.push(`${m} dk`);
  if (d === 0) parts.push(`${String(s).padStart(2, '0')} sn`);
  return parts.join(' ');
}
