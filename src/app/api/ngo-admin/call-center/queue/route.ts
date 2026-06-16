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
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
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
    const contactSnap = await db.collection(COLLECTIONS.santralContacts).doc(d.contactId).get();
    if (contactSnap.exists) {
      const c = contactSnap.data() as { phone?: string; name?: string; attempts?: number };
      phone = c.phone ?? '';
      attempts = typeof c.attempts === 'number' ? c.attempts : 0;
      if (!contactName) contactName = c.name ?? '';
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
      const d = doc.data() as { name?: string; phone?: string };
      if (!d.phone) continue;
      newItems.push({
        type: 'new',
        priority: 'normal',
        contactId: doc.id,
        contactName: d.name ?? '',
        phone: d.phone,
        attempts: 0,
      });
    }
  }

  const remainingAfterNew = Math.max(0, MAX_QUEUE - callbackItems.length - newItems.length);

  // 3) Retry'lar — lastDisposition no-answer|busy, attempts < 3.
  const retryItems: QueueItem[] = [];
  if (remainingAfterNew > 0) {
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
      };
      if (!d.phone) continue;
      retryItems.push({
        type: 'retry',
        priority: 'low',
        contactId: doc.id,
        contactName: d.name ?? '',
        phone: d.phone,
        attempts: typeof d.attempts === 'number' ? d.attempts : 0,
        lastDisposition: d.lastDisposition,
      });
    }
  }

  const queue = [...callbackItems, ...newItems, ...retryItems].slice(0, MAX_QUEUE);

  return NextResponse.json({
    queue,
    stats: {
      callbacksDue: callbackItems.length,
      newContacts: newItems.length,
      retries: retryItems.length,
      total: queue.length,
    },
  });
}
