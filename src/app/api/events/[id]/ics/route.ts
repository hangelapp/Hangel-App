/**
 * GET /api/events/[id]/ics — etkinlik için takvim dosyası (.ics).
 *
 * Sistem tarayıcısında açılınca "Takvime Ekle" sayfası çıkar (iOS/Android/masaüstü).
 * 1 saat önce hatırlatma alarmı (VALARM) içerir. Public (auth yok).
 */
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

// "YYYY-MM-DD HH:mm" → Date (yerel). Saatsizse 00:00.
function parseLocal(s?: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
  const [, y, mo, d, hh, mm] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh || '0'), Number(mm || '0'), 0, 0);
}

function fmtIcs(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function esc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  if (!eventId) return new Response('Geçersiz etkinlik', { status: 400 });

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.events).doc(eventId).get();
  if (!snap.exists) return new Response('Etkinlik bulunamadı', { status: 404 });
  const e = snap.data() as {
    name?: string; startDate?: string; endDate?: string; description?: string; organizer?: string;
    location?: { address?: string; district?: string; city?: string; type?: string };
  };

  const start = parseLocal(e.startDate);
  if (!start) return new Response('Etkinlik tarihi yok', { status: 422 });
  const end = parseLocal(e.endDate) ?? new Date(start.getTime() + 2 * 3600_000);
  const loc = e.location?.type === 'Online'
    ? 'Online'
    : [e.location?.address, e.location?.district, e.location?.city].filter(Boolean).join(', ');
  const url = `https://hangel.org.tr/events/${eventId}`;
  const desc = `${e.description || ''}\nDüzenleyen: ${e.organizer || 'hangel'}\n${url}`.trim();

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//hangel//TR//', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:hangel-${eventId}@hangel.org.tr`,
    `DTSTAMP:${fmtIcs(new Date())}`,
    `DTSTART:${fmtIcs(start)}`,
    `DTEND:${fmtIcs(end)}`,
    `SUMMARY:${esc(e.name || 'hangel Etkinliği')}`,
    loc ? `LOCATION:${esc(loc)}` : '',
    `DESCRIPTION:${esc(desc)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Etkinlik 1 saat içinde başlıyor', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(ics, {
    status: 200,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="hangel-${eventId}.ics"`,
      'cache-control': 'no-store',
    },
  });
}
