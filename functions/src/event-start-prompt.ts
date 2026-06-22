/**
 * Etkinlik başlangıç bildirimi — organizatöre "etkinliğiniz başlıyor, başlatmak
 * ister misiniz?" bildirimi gönderir (push + uygulama-içi).
 *
 * Schedule: her 5 dakika. Başlama saati [now-15dk, now+10dk] aralığındaki, henüz
 * bildirilmemiş (startPromptSentAt yok), aktif (Beklemede/Reddedildi/Pasif değil,
 * completed değil) etkinlikleri yakalar. Organizatör kuruluşun yöneticisine
 * (adminUserId; yoksa managed*Id; yoksa etkinliği oluşturan) bildirim oluşturur.
 * notifications dokümanı onNotificationCreated tetikleyicisiyle push'a da döner.
 *
 * NOT: startDate "YYYY-MM-DD HH:mm" string olarak Europe/Istanbul (UTC+3, DST yok)
 * saatidir; runtime UTC olduğu için elle +3 ofset düşülerek epoch hesaplanır.
 *
 * Region: europe-west1.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const WINDOW_BEFORE_MS = 10 * 60 * 1000; // başlamadan 10 dk önce uyar
const WINDOW_AFTER_MS = 15 * 60 * 1000;  // başladıktan 15 dk sonraya kadar yakala
const MAX_EVENTS_PER_RUN = 50;
const HIDDEN_STATUSES = new Set(['Beklemede', 'Reddedildi', 'Pasif']);
const COL_BY_KIND: Record<string, string> = { club: 'clubs', ngo: 'ngos', brand: 'brands' };

interface EventDoc {
  name?: string;
  slug?: string;
  organizer?: string;
  organizerId?: string;
  organizerKind?: string;
  startDate?: string;
  status?: string;
  completed?: boolean;
  createdBy?: string | null;
  startPromptSentAt?: unknown;
}

// "YYYY-MM-DD HH:mm" → Istanbul yerel saatini epoch'a çevir (UTC+3 sabit).
function parseIstanbul(v: unknown): Date | null {
  if (!v || typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d, hh, mm] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh || '0') - 3, Number(mm || '0')));
}

async function resolveManagerUid(
  db: FirebaseFirestore.Firestore,
  event: EventDoc,
): Promise<{ uid: string | null; orgName: string }> {
  let orgName = event.organizer || 'Kuruluşunuz';
  const organizerId = event.organizerId;
  if (!organizerId) return { uid: event.createdBy ?? null, orgName };

  const cols = event.organizerKind && COL_BY_KIND[event.organizerKind]
    ? [COL_BY_KIND[event.organizerKind]]
    : ['clubs', 'ngos', 'brands'];
  for (const col of cols) {
    const o = await db.collection(col).doc(organizerId).get().catch(() => null);
    if (o && o.exists) {
      const od = o.data() as { adminUserId?: string; name?: string };
      if (od?.name) orgName = od.name;
      if (od?.adminUserId) return { uid: od.adminUserId, orgName };
      break;
    }
  }
  // adminUserId yoksa managed*Id ile yöneticiyi ara.
  for (const field of ['managedClubId', 'managedNgoId', 'managedBrandId']) {
    const q = await db.collection('users').where(field, '==', organizerId).limit(1).get().catch(() => null);
    if (q && !q.empty) return { uid: q.docs[0].id, orgName };
  }
  return { uid: event.createdBy ?? null, orgName };
}

export const eventStartOrganizerPrompt = onSchedule(
  { schedule: 'every 5 minutes', timeZone: TIMEZONE, region: REGION },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const from = now - WINDOW_AFTER_MS;
    const to = now + WINDOW_BEFORE_MS;

    const snap = await db
      .collection('events')
      .orderBy('startDate', 'desc')
      .limit(400)
      .get()
      .catch((e) => {
        logger.warn('[event-start] events query failed, full scan fallback', e);
        return null;
      });
    const docs = snap && !snap.empty ? snap.docs : (await db.collection('events').limit(500).get()).docs;

    let handled = 0;
    let notified = 0;
    for (const ev of docs) {
      if (handled >= MAX_EVENTS_PER_RUN) break;
      const e = ev.data() as EventDoc;
      if (e.startPromptSentAt) continue;
      if (e.completed) continue;
      if (e.status && HIDDEN_STATUSES.has(e.status)) continue;
      const start = parseIstanbul(e.startDate);
      if (!start) continue;
      const st = start.getTime();
      if (st < from || st > to) continue;

      handled++;
      const { uid: managerUid, orgName } = await resolveManagerUid(db, e);
      const eventId = ev.id;
      const eventName = e.name || 'Etkinliğiniz';
      const link = `/events/${e.slug || eventId}`;

      if (managerUid) {
        await db.collection('notifications').add({
          userId: managerUid,
          type: 'event-start',
          title: '🟢 Etkinliğiniz başlıyor',
          body: `${orgName} · "${eventName}" başlama saati geldi. Başlatmak / katılımcıları karşılamak için hazır mısınız?`,
          data: { eventId, link, action: 'start-event' },
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: 'system-event-start',
        }).then(() => { notified++; }).catch((er) => logger.warn(`[event-start] notif failed event=${eventId}`, er));
      }
      await ev.ref.update({ startPromptSentAt: FieldValue.serverTimestamp() }).catch((er) => logger.error(`[event-start] could not mark event ${eventId} as prompted (risk of duplicate prompt)`, er));
    }

    logger.info(`[event-start] handled=${handled} notified=${notified}`);
  },
);
