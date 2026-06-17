/**
 * GET /api/ngo-admin/whatsapp-business/conversations
 *
 * STK admin'in WhatsApp Business konuşma threadlerini listele.
 *
 * Query:
 *   - q?:       string  (contactName / contactPhone substring)
 *   - unread?:  '1' | 'true'   (yalnız okunmamış)
 *   - limit?:   number   (default 50, max 100)
 *
 * Yanıt: { conversations: ConversationRow[] }
 *
 * Sıralama: lastMessageAt DESC.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { Query } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE_MAX = 100;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface ConversationRow {
  id: string;
  contactPhone: string;
  contactName: string | null;
  contactId: string | null;
  lastMessageAt: string | null;
  lastMessageBody: string;
  lastMessageDirection: 'inbound' | 'outbound' | null;
  unreadCount: number;
  conversationWindowExpiresAt: string | null;
  windowOpen: boolean;
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

function tsToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

function tsToMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  return null;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const unreadOnly = ['1', 'true'].includes((url.searchParams.get('unread') || '').toLowerCase());
  const limitRaw = Number.parseInt(url.searchParams.get('limit') || '50', 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, PAGE_SIZE_MAX) : 50;

  const db = getAdminFirestore();
  let query: Query = db.collection(COLLECTIONS.wabaConversations).where('ngoId', '==', ctx.ngoId);
  if (unreadOnly) {
    query = query.where('unreadCount', '>', 0);
  }
  query = query.orderBy('lastMessageAt', 'desc').limit(q ? PAGE_SIZE_MAX : limit);

  const snap = await query.get();
  const nowMs = Date.now();
  let rows: ConversationRow[] = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const windowMs = tsToMillis(data.conversationWindowExpiresAt);
    return {
      id: d.id,
      contactPhone: typeof data.contactPhone === 'string' ? data.contactPhone : '',
      contactName: typeof data.contactName === 'string' ? data.contactName : null,
      contactId: typeof data.contactId === 'string' ? data.contactId : null,
      lastMessageAt: tsToIso(data.lastMessageAt),
      lastMessageBody: typeof data.lastMessageBody === 'string' ? data.lastMessageBody : '',
      lastMessageDirection:
        data.lastMessageDirection === 'inbound' || data.lastMessageDirection === 'outbound'
          ? data.lastMessageDirection
          : null,
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
      conversationWindowExpiresAt: tsToIso(data.conversationWindowExpiresAt),
      windowOpen: windowMs !== null && windowMs > nowMs,
    };
  });

  if (q) {
    rows = rows.filter((r) => {
      const name = (r.contactName || '').toLowerCase();
      const phone = r.contactPhone.toLowerCase();
      return name.includes(q) || phone.includes(q);
    }).slice(0, limit);
  }

  return NextResponse.json({ conversations: rows });
}
