/**
 * Weekly email digest.
 *
 * Schedule : every Monday 09:00 Europe/Istanbul.
 * Audience : every "active" user (users.status != 'disabled' AND has an email
 *            AND has not opted out of marketing — see userMarketingConsent
 *            collection / personalInfo.emailOptOut flag).
 *
 * Content per user (last 7 days):
 *   - donation count + total amount they contributed (donations where
 *     userId == uid and createdAt within window)
 *   - upcoming events near them (events.startDate within next 14 days, max 5)
 *   - emergency blood calls within 60 km of lastKnownLocation, status=active
 *
 * Transport: SendGrid (env: SENDGRID_API_KEY). If the secret is unset the
 * function logs a warning and exits without sending — per spec ("user will set
 * later"). No mailQueue fallback here to keep the unit self-contained.
 *
 * Region: europe-west1.
 *
 * WARNING: SENDGRID_API_KEY secret must be created before deploy. Use:
 *   firebase functions:secrets:set SENDGRID_API_KEY
 *   firebase functions:secrets:set SENDGRID_FROM_EMAIL
 *   firebase functions:secrets:set SENDGRID_FROM_NAME
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = defineSecret('SENDGRID_FROM_EMAIL');
const SENDGRID_FROM_NAME = defineSecret('SENDGRID_FROM_NAME');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const UPCOMING_EVENT_DAYS = 14;
const MAX_EVENTS_PER_USER = 5;
const MAX_BLOOD_CALLS_PER_USER = 3;
const NEARBY_EVENT_KM = 100;
const NEARBY_BLOOD_KM = 60;
const MAX_USERS_PER_RUN = 5000; // safety cap

interface GeoPoint {
  lat: number;
  lng: number;
}

interface UserDoc {
  name?: string;
  status?: string;
  personalInfo?: {
    email?: string;
    emailOptOut?: boolean;
    canDonateBlood?: boolean;
    address?: { city?: string };
  };
  lastKnownLocation?: GeoPoint | { latitude?: number; longitude?: number };
}

interface DonationDoc {
  amount?: number;
  ngoName?: string;
  createdAt?: { toDate: () => Date };
}

interface EventDoc {
  id: string;
  name?: string;
  startDate?: string | { toDate: () => Date };
  location?: { city?: string; district?: string; address?: string };
  coordinates?: GeoPoint;
}

interface BloodCallDoc {
  id: string;
  title?: string;
  hospitalName?: string;
  city?: string;
  bloodTypes?: string[];
  coordinates?: GeoPoint;
  location?: GeoPoint;
  urgency?: string;
}

function readCoords(v: UserDoc['lastKnownLocation'] | GeoPoint | undefined): GeoPoint | null {
  if (!v) return null;
  if ('lat' in v && 'lng' in v) {
    const lat = typeof v.lat === 'number' ? v.lat : NaN;
    const lng = typeof v.lng === 'number' ? v.lng : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  if ('latitude' in v && 'longitude' in v) {
    const lat = typeof v.latitude === 'number' ? v.latitude : NaN;
    const lng = typeof v.longitude === 'number' ? v.longitude : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'object' && v && 'toDate' in (v as Record<string, unknown>)) {
    try {
      return (v as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(d);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface DigestParts {
  donationCount: number;
  donationTotal: number;
  events: EventDoc[];
  bloodCalls: BloodCallDoc[];
}

function buildHtml(userName: string, parts: DigestParts): string {
  const safeName = escapeHtml(userName);
  let html = '';
  html += '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1c1c1c;line-height:1.5;max-width:600px;margin:0 auto;padding:24px;">';
  html += `<h2 style="margin:0 0 16px 0;">Merhaba ${safeName}</h2>`;
  html += '<p>Geçen haftadan özetler ve önümüzdeki günler için fırsatlar:</p>';

  // Donation summary
  html += '<h3 style="margin-top:24px;border-bottom:1px solid #eee;padding-bottom:6px;">Geçen haftaki katkın</h3>';
  if (parts.donationCount > 0) {
    html += `<p>Bu hafta <strong>${parts.donationCount}</strong> bağış yaptın, toplam <strong>${escapeHtml(formatCurrency(parts.donationTotal))}</strong>. Teşekkür ederiz!</p>`;
  } else {
    html += '<p>Bu hafta bağış kaydın yok. Aşağıdaki acil çağrılara bir göz at — küçük katkılar büyük etki yaratır.</p>';
  }

  // Upcoming events
  html += '<h3 style="margin-top:24px;border-bottom:1px solid #eee;padding-bottom:6px;">Yakındaki etkinlikler</h3>';
  if (parts.events.length === 0) {
    html += '<p>Yakınında uygun etkinlik bulamadık.</p>';
  } else {
    html += '<ul style="padding-left:20px;margin:0;">';
    for (const e of parts.events) {
      const date = parseDate(e.startDate);
      const dateText = date ? formatDate(date) : '';
      const loc = e.location?.district || e.location?.city || '';
      html += `<li style="margin-bottom:8px;"><strong>${escapeHtml(e.name ?? 'Etkinlik')}</strong>` +
        (dateText ? ` — ${escapeHtml(dateText)}` : '') +
        (loc ? ` · ${escapeHtml(loc)}` : '') +
        '</li>';
    }
    html += '</ul>';
  }

  // Emergency blood calls
  html += '<h3 style="margin-top:24px;border-bottom:1px solid #eee;padding-bottom:6px;">Yakındaki acil kan ihtiyaçları</h3>';
  if (parts.bloodCalls.length === 0) {
    html += '<p>Şu anda yakınında acil çağrı yok.</p>';
  } else {
    html += '<ul style="padding-left:20px;margin:0;">';
    for (const b of parts.bloodCalls) {
      const types = (b.bloodTypes ?? []).join(', ') || 'Genel';
      const hosp = b.hospitalName || b.city || '';
      html += `<li style="margin-bottom:8px;"><strong>${escapeHtml(types)}</strong>` +
        (hosp ? ` · ${escapeHtml(hosp)}` : '') +
        (b.urgency ? ` <span style="color:#b00;">(${escapeHtml(b.urgency)})</span>` : '') +
        '</li>';
    }
    html += '</ul>';
  }

  html += '<hr style="margin:24px 0;border:none;border-top:1px solid #eee;">';
  html += '<p style="font-size:12px;color:#888;">Bu özetleri almak istemiyorsan profil → bildirim ayarlarından e-posta özetlerini kapatabilirsin.</p>';
  html += '</body></html>';
  return html;
}

function buildText(userName: string, parts: DigestParts): string {
  const lines: string[] = [];
  lines.push(`Merhaba ${userName}`);
  lines.push('');
  lines.push('— Geçen haftaki katkın');
  if (parts.donationCount > 0) {
    lines.push(`  ${parts.donationCount} bağış, toplam ${formatCurrency(parts.donationTotal)}`);
  } else {
    lines.push('  Bu hafta bağış kaydın yok.');
  }
  lines.push('');
  lines.push('— Yakındaki etkinlikler');
  if (parts.events.length === 0) {
    lines.push('  Uygun etkinlik bulamadık.');
  } else {
    for (const e of parts.events) {
      const date = parseDate(e.startDate);
      const dateText = date ? formatDate(date) : '';
      const loc = e.location?.district || e.location?.city || '';
      lines.push(`  • ${e.name ?? 'Etkinlik'}${dateText ? ' — ' + dateText : ''}${loc ? ' · ' + loc : ''}`);
    }
  }
  lines.push('');
  lines.push('— Yakındaki acil kan ihtiyaçları');
  if (parts.bloodCalls.length === 0) {
    lines.push('  Şu anda yakınında acil çağrı yok.');
  } else {
    for (const b of parts.bloodCalls) {
      const types = (b.bloodTypes ?? []).join(', ') || 'Genel';
      const hosp = b.hospitalName || b.city || '';
      lines.push(`  • ${types}${hosp ? ' · ' + hosp : ''}${b.urgency ? ' (' + b.urgency + ')' : ''}`);
    }
  }
  lines.push('');
  lines.push('— Bu özetleri almak istemiyorsan profil → bildirim ayarlarından kapatabilirsin.');
  return lines.join('\n');
}

interface SendGridResult {
  ok: boolean;
  status?: number;
  errorMessage?: string;
}

let sgConfigured = false;
function configureSendGrid(): boolean {
  if (sgConfigured) return true;
  const apiKey = SENDGRID_API_KEY.value()?.trim();
  if (!apiKey) return false;
  sgMail.setApiKey(apiKey);
  sgConfigured = true;
  return true;
}

async function sendViaSendGrid(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<SendGridResult> {
  if (!configureSendGrid()) {
    return { ok: false, errorMessage: 'SENDGRID_API_KEY missing' };
  }
  const fromEmail = SENDGRID_FROM_EMAIL.value()?.trim() || 'no-reply@hangel.org.tr';
  const fromName = SENDGRID_FROM_NAME.value()?.trim() || 'hangel';

  try {
    const [res] = await sgMail.send({
      to,
      from: { email: fromEmail, name: fromName },
      subject,
      text,
      html,
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { ok: true, status: res.statusCode };
    }
    return { ok: false, status: res.statusCode, errorMessage: `HTTP ${res.statusCode}` };
  } catch (e) {
    const err = e as { code?: number; message?: string; response?: { body?: unknown } };
    return {
      ok: false,
      status: err?.code,
      errorMessage: err?.message ?? (e instanceof Error ? e.message : 'send error'),
    };
  }
}

export const weeklyEmailDigest = onSchedule(
  {
    schedule: 'every monday 09:00',
    timeZone: TIMEZONE,
    region: REGION,
    secrets: [SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME],
  },
  async () => {
    const apiKey = SENDGRID_API_KEY.value()?.trim();
    if (!apiKey) {
      logger.warn('[email-digest] SENDGRID_API_KEY not configured, exiting');
      return;
    }

    const db = getFirestore();
    const now = Date.now();
    const weekAgo = now - WEEK_MS;
    const upcomingCutoff = now + UPCOMING_EVENT_DAYS * 24 * 60 * 60 * 1000;

    // Preload upcoming events (small set, shared across all users)
    const allEventsSnap = await db.collection('events').limit(500).get().catch(() => null);
    const upcomingEvents: EventDoc[] = [];
    if (allEventsSnap) {
      for (const doc of allEventsSnap.docs) {
        const data = doc.data() as EventDoc;
        const start = parseDate(data.startDate);
        if (!start) continue;
        const ms = start.getTime();
        if (ms < now || ms > upcomingCutoff) continue;
        upcomingEvents.push({ ...data, id: doc.id });
      }
    }

    // Preload active blood calls
    const callsSnap = await db
      .collection('emergencyBloodCalls')
      .where('status', '==', 'active')
      .limit(200)
      .get()
      .catch(() => null);
    const activeBloodCalls: BloodCallDoc[] = [];
    if (callsSnap) {
      for (const doc of callsSnap.docs) {
        activeBloodCalls.push({ ...(doc.data() as BloodCallDoc), id: doc.id });
      }
    }

    // Iterate users (paged to keep memory bounded)
    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let lastDocId: string | null = null;
    const pageSize = 200;

    while (processed < MAX_USERS_PER_RUN) {
      let query = db.collection('users').orderBy('__name__').limit(pageSize);
      if (lastDocId) {
        // Restart pagination from last doc
        const lastSnap = await db.collection('users').doc(lastDocId).get();
        if (lastSnap.exists) query = query.startAfter(lastSnap);
      }
      const usersSnap = await query.get();
      if (usersSnap.empty) break;

      for (const userDoc of usersSnap.docs) {
        processed++;
        const user = userDoc.data() as UserDoc;
        const email = user.personalInfo?.email;
        if (!email || user.status === 'disabled' || user.personalInfo?.emailOptOut === true) {
          skipped++;
          continue;
        }

        // Donations in past week
        const donationsSnap = await db
          .collection('donations')
          .where('userId', '==', userDoc.id)
          .where('createdAt', '>=', new Date(weekAgo))
          .get()
          .catch(() => null);

        let donationCount = 0;
        let donationTotal = 0;
        if (donationsSnap) {
          for (const d of donationsSnap.docs) {
            const data = d.data() as DonationDoc;
            donationCount++;
            donationTotal += typeof data.amount === 'number' ? data.amount : 0;
          }
        }

        // Nearby events
        const userCoords = readCoords(user.lastKnownLocation);
        const userCity = user.personalInfo?.address?.city?.toLowerCase() ?? '';
        const eventsForUser: EventDoc[] = [];
        for (const e of upcomingEvents) {
          if (eventsForUser.length >= MAX_EVENTS_PER_USER) break;
          if (userCoords && e.coordinates) {
            const d = distanceKm(userCoords.lat, userCoords.lng, e.coordinates.lat, e.coordinates.lng);
            if (d <= NEARBY_EVENT_KM) eventsForUser.push(e);
            continue;
          }
          // Fallback: city match
          if (userCity && e.location?.city && e.location.city.toLowerCase() === userCity) {
            eventsForUser.push(e);
          }
        }

        // Nearby blood calls
        const callsForUser: BloodCallDoc[] = [];
        for (const b of activeBloodCalls) {
          if (callsForUser.length >= MAX_BLOOD_CALLS_PER_USER) break;
          const bc = readCoords(b.coordinates ?? b.location);
          if (userCoords && bc) {
            const d = distanceKm(userCoords.lat, userCoords.lng, bc.lat, bc.lng);
            if (d <= NEARBY_BLOOD_KM) callsForUser.push(b);
            continue;
          }
          if (userCity && b.city && b.city.toLowerCase() === userCity) {
            callsForUser.push(b);
          }
        }

        // Skip emails that would be completely empty
        if (donationCount === 0 && eventsForUser.length === 0 && callsForUser.length === 0) {
          skipped++;
          continue;
        }

        const parts: DigestParts = {
          donationCount,
          donationTotal,
          events: eventsForUser,
          bloodCalls: callsForUser,
        };

        const name = user.name?.trim() || 'gönüllü';
        const subject = 'hangel haftalık özet';
        const html = buildHtml(name, parts);
        const text = buildText(name, parts);

        const result = await sendViaSendGrid(email, subject, html, text);
        if (result.ok) {
          sent++;
        } else {
          logger.warn(`[email-digest] send failed to ${userDoc.id}: ${result.errorMessage}`);
        }
      }

      lastDocId = usersSnap.docs[usersSnap.docs.length - 1]?.id ?? null;
      if (!lastDocId || usersSnap.size < pageSize) break;
    }

    logger.info(`[email-digest] processed=${processed} sent=${sent} skipped=${skipped}`);
  },
);
