/**
 * GET /api/ngo-admin/call-center/queue
 *
 * STK'nın bugünün arama kuyruğunu döner. Üç katman birleştirir ve önceliklendirir:
 *   1. DUE callback'ler  — santralScheduledCallbacks, status='pending', scheduledAt<=now
 *   2. Yeni kontaklar    — santralContacts, attempts==0 (hiç aranmamış)
 *   3. Retry kontaklar   — santralContacts, lastDisposition ∈ {no-answer,busy}, attempts<3
 *
 * Sıralama: callback (high) → new (normal) → retry (low). Toplam max 50.
 *
 * KVKK: yalnızca arama planlama metadata; recording / transcript dönmez.
 *
 * Yanıt:
 *   {
 *     queue: [{ type, priority, contactId, contactName, phone, attempts,
 *               lastDisposition?, scheduledAt?, reason?, callbackId? }],
 *     stats: { callbacksDue, newContacts, retries, total }
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUEUE = 50;
const RETRY_DISPOSITIONS = ['no-answer', 'busy'] as const;
const RETRY_MAX_ATTEMPTS = 3;

type QueueType = 'callback' | 'new' | 'retry';
type QueuePriority = 'high' | 'normal' | 'low';

interface QueueItem {
  type: QueueType;
  priority: QueuePriority;
  contactId: string;
  contactName: string;
  phone: string;
  attempts: number;
  lastDisposition?: string;
  scheduledAt?: string;
  reason?: string;
  callbackId?: string;
  whatsAppResponse?: 'yes' | 'no' | null;
  whatsAppPending?: boolean;
}

interface CallerContext {
  uid: string;
  ngoId: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as {
      role?: string;
      managedNgoId?: string;
      managedBrandId?: string;
      managedClubId?: string;
    };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managedNgoId/
    // managedBrandId/managedClubId == header) ya da super-admin ise header'daki
    // kurum kullanılır; yoksa eski davranış: ngo → brand → club ilk dolu olan.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind =
      hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club'
        ? hdrKindRaw
        : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;
    const isSuperAdmin = d.role === 'super-admin';
    let __activeNgoId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
      __activeNgoId = hdrOrgId;
    } else {
      __activeNgoId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
  } catch {
    return null;
  }
}

function toIsoOrUndefined(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return undefined;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' },
      { status: 403 },
    );
  }

  const db = getAdminFirestore();
  const now = Timestamp.now();
  const oneDayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 3600 * 1000);

  // 1) DUE callback'ler — scheduledAt <= now, status=pending.
  const callbacksSnap = await db
    .collection(COLLECTIONS.santralScheduledCallbacks)
    .where('ngoId', '==', ctx.ngoId)
    .where('status', '==', 'pending')
    .where('scheduledAt', '<=', now)
    .orderBy('scheduledAt', 'asc')
    .limit(MAX_QUEUE)
    .get();

  const callbackItems: QueueItem[] = [];
  const callbackContactIds = new Set<string>();
  for (const doc of callbacksSnap.docs) {
    const d = doc.data() as {
      contactId?: string;
      contactName?: string;
      scheduledAt?: unknown;
      reason?: string;
    };
    if (!d.contactId) continue;
    callbackContactIds.add(d.contactId);

    // Kişi telefonunu santralContacts'ten çek (callback doc'unda saklanmıyor).
    let phone = '';
    let attempts = 0;
    let contactName = d.contactName ?? '';
    let waResponse: 'yes' | 'no' | null = null;
    let waPending = false;
    const contactSnap = await db.collection(COLLECTIONS.santralContacts).doc(d.contactId).get();
    if (contactSnap.exists) {
      const c = contactSnap.data() as {
        phone?: string;
        name?: string;
        attempts?: number;
        priority?: boolean;
        lastPositiveReplyAt?: unknown;
        lastWhatsAppSentAt?: unknown;
      };
      phone = c.phone ?? '';
      attempts = typeof c.attempts === 'number' ? c.attempts : 0;
      if (!contactName) contactName = c.name ?? '';
      // Webhook olumlu cevapta priority=true + lastPositiveReplyAt yazar.
      if (c.priority === true || c.lastPositiveReplyAt != null) {
        waResponse = 'yes';
      }
      if (!waResponse && c.lastWhatsAppSentAt instanceof Timestamp) {
        waPending = c.lastWhatsAppSentAt.toMillis() < oneDayAgo.toMillis();
      }
    }
    if (!phone) continue;

    callbackItems.push({
      type: 'callback',
      priority: 'high',
      contactId: d.contactId,
      contactName,
      phone,
      attempts,
      callbackId: doc.id,
      scheduledAt: toIsoOrUndefined(d.scheduledAt),
      reason: d.reason,
      whatsAppResponse: waResponse,
      whatsAppPending: waPending,
    });
  }

  const remainingAfterCallbacks = Math.max(0, MAX_QUEUE - callbackItems.length);

  // 2) Yeni kontaklar — attempts == 0.
  const newItems: QueueItem[] = [];
  if (remainingAfterCallbacks > 0) {
    const newSnap = await db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .where('attempts', '==', 0)
      .limit(remainingAfterCallbacks)
      .get();

    for (const doc of newSnap.docs) {
      if (callbackContactIds.has(doc.id)) continue;
      const d = doc.data() as {
        name?: string;
        phone?: string;
        priority?: boolean;
        lastPositiveReplyAt?: unknown;
        lastWhatsAppSentAt?: unknown;
      };
      if (!d.phone) continue;
      const waResponse: 'yes' | 'no' | null =
        d.priority === true || d.lastPositiveReplyAt != null ? 'yes' : null;
      const waPending =
        !waResponse &&
        d.lastWhatsAppSentAt instanceof Timestamp &&
        d.lastWhatsAppSentAt.toMillis() < oneDayAgo.toMillis();
      newItems.push({
        type: 'new',
        priority: 'normal',
        contactId: doc.id,
        contactName: d.name ?? '',
        phone: d.phone,
        attempts: 0,
        whatsAppResponse: waResponse,
        whatsAppPending: waPending,
      });
    }
  }

  const remainingAfterNew = Math.max(0, MAX_QUEUE - callbackItems.length - newItems.length);

  // 3) Retry'lar — lastDisposition no-answer|busy, attempts < 3.
  const retryItems: QueueItem[] = [];
  if (remainingAfterNew > 0) {
    // NOT: composite index gerekiyor (ngoId,lastDisposition,attempts)
    const retrySnap = await db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .where('lastDisposition', 'in', RETRY_DISPOSITIONS)
      .where('attempts', '<', RETRY_MAX_ATTEMPTS)
      .limit(remainingAfterNew)
      .get();

    for (const doc of retrySnap.docs) {
      if (callbackContactIds.has(doc.id)) continue;
      const d = doc.data() as {
        name?: string;
        phone?: string;
        attempts?: number;
        lastDisposition?: string;
        priority?: boolean;
        lastPositiveReplyAt?: unknown;
        lastWhatsAppSentAt?: unknown;
      };
      if (!d.phone) continue;
      const waResponse: 'yes' | 'no' | null =
        d.priority === true || d.lastPositiveReplyAt != null ? 'yes' : null;
      const waPending =
        !waResponse &&
        d.lastWhatsAppSentAt instanceof Timestamp &&
        d.lastWhatsAppSentAt.toMillis() < oneDayAgo.toMillis();
      retryItems.push({
        type: 'retry',
        priority: 'low',
        contactId: doc.id,
        contactName: d.name ?? '',
        phone: d.phone,
        attempts: typeof d.attempts === 'number' ? d.attempts : 0,
        lastDisposition: d.lastDisposition,
        whatsAppResponse: waResponse,
        whatsAppPending: waPending,
      });
    }
  }

  // Olumlu cevap verenler (priority=true) önce sıralanır (kalan sıra korunur).
  const combined = [...callbackItems, ...newItems, ...retryItems];
  combined.sort((a, b) => {
    const aYes = a.whatsAppResponse === 'yes' ? 1 : 0;
    const bYes = b.whatsAppResponse === 'yes' ? 1 : 0;
    return bYes - aYes;
  });
  const queue = combined.slice(0, MAX_QUEUE);

  // WA gönderilmiş kişi sayısı — tenant geneli aggregate (queue dışı da sayar).
  // Tek alanlı eşitsizlik (lastWhatsAppSentAt != null) → composite index gerekmez,
  // FAILED_PRECONDITION fırlatmaz. (Eski sorgu yok-alan lastWhatsAppResponse'a
  // bakıyordu ve iki-alanlı index istiyordu; o yüzden hep 0 dönüyordu.)
  // try hem de catch atadığı için başlangıç değeri vermiyoruz (no-useless-assignment).
  let whatsAppPendingTotal: number;
  try {
    const pendingAgg = await db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .where('lastWhatsAppSentAt', '!=', null)
      .count()
      .get();
    whatsAppPendingTotal = pendingAgg.data().count;
  } catch {
    // count agg desteklenmez / index yoksa 0 dön.
    whatsAppPendingTotal = 0;
  }

  const whatsAppRespondersInQueue = queue.filter(
    (q) => q.whatsAppResponse === 'yes',
  ).length;

  return NextResponse.json({
    queue,
    stats: {
      callbacksDue: callbackItems.length,
      newContacts: newItems.length,
      retries: retryItems.length,
      total: queue.length,
      whatsAppResponders: whatsAppRespondersInQueue,
      whatsAppPending: whatsAppPendingTotal,
    },
  });
}
