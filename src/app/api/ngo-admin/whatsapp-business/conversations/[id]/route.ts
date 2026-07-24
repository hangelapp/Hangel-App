/**
 * GET  /api/ngo-admin/whatsapp-business/conversations/[id]
 * POST /api/ngo-admin/whatsapp-business/conversations/[id]
 *
 * GET:  Konuşma threadi + son 100 mesaj (subcollection wabaConversations/{id}/messages)
 *
 * POST: Free-form (text) yanıt gönder. Meta'nın 24h "conversation window"u açık
 *       olmalı. Aksi halde { errorCode: 'WINDOW_EXPIRED' } → template gerekir.
 *       Body: { type: 'text', body: string, wabaPhoneNumberId?: string }
 *
 * Yetki: STK tenant izolasyonu; conversation.ngoId == caller.ngoId.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MESSAGE_LIMIT = 100;
/** Meta free-form (24h) konuşma penceresi süresi (ms) — yeni outbound mesaj penceresi yeniler. */
const CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Meta text mesaj body üst sınırı. */
const MAX_TEXT_BODY_LEN = 4096;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface WabaConversationDoc {
  ngoId?: string;
  contactPhone?: string;
  contactName?: string;
  contactId?: string;
  lastMessageAt?: unknown;
  lastMessageBody?: string;
  lastMessageDirection?: string;
  unreadCount?: number;
  conversationWindowExpiresAt?: unknown;
}

interface WabaPhoneNumberDoc {
  ngoId?: string;
  wabaPhoneNumberId?: string;
  status?: 'active' | 'paused' | 'suspended';
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuperAdmin = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu kurum
    // yöneten kullanıcı için kritik). Caller o kuruma üye ise (managed*Id==header) ya
    // da super-admin ise header'daki kurum kullanılır; yoksa managed*Id sırasıyla.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;

    let activeOrgId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
      activeOrgId = hdrOrgId;
    } else {
      activeOrgId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!activeOrgId) return null;
    return { uid: decoded.uid, ngoId: activeOrgId };
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Konuşma id gerekli.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const convoRef = db.collection(COLLECTIONS.wabaConversations).doc(id);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Konuşma bulunamadı.' }, { status: 404 });
  }
  const convo = convoSnap.data() as WabaConversationDoc;
  if (convo.ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu konuşma için yetkiniz yok.' }, { status: 403 });
  }

  const msgsSnap = await convoRef
    .collection(COLLECTIONS.wabaMessages)
    .orderBy('timestamp', 'desc')
    .limit(MESSAGE_LIMIT)
    .get();

  const messages = msgsSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      direction: data.direction === 'inbound' || data.direction === 'outbound' ? data.direction : null,
      type: typeof data.type === 'string' ? data.type : null,
      body: typeof data.body === 'string' ? data.body : null,
      templateName: typeof data.templateName === 'string' ? data.templateName : null,
      mediaUrl: typeof data.mediaUrl === 'string' ? data.mediaUrl : null,
      wabaMessageId: typeof data.wabaMessageId === 'string' ? data.wabaMessageId : null,
      status: typeof data.status === 'string' ? data.status : null,
      failureReason: typeof data.failureReason === 'string' ? data.failureReason : null,
      sentBy: typeof data.sentBy === 'string' ? data.sentBy : null,
      timestamp: tsToIso(data.timestamp),
    };
  }).reverse(); // chronological asc for UI

  // Okundu olarak işaretle (best-effort)
  if (typeof convo.unreadCount === 'number' && convo.unreadCount > 0) {
    try { await convoRef.update({ unreadCount: 0, updatedAt: FieldValue.serverTimestamp() }); }
    catch { /* best-effort */ }
  }

  const windowMs = tsToMillis(convo.conversationWindowExpiresAt);
  const nowMs = Date.now();

  return NextResponse.json({
    conversation: {
      id: convoSnap.id,
      contactPhone: typeof convo.contactPhone === 'string' ? convo.contactPhone : '',
      contactName: typeof convo.contactName === 'string' ? convo.contactName : null,
      contactId: typeof convo.contactId === 'string' ? convo.contactId : null,
      lastMessageAt: tsToIso(convo.lastMessageAt),
      lastMessageBody: typeof convo.lastMessageBody === 'string' ? convo.lastMessageBody : '',
      lastMessageDirection:
        convo.lastMessageDirection === 'inbound' || convo.lastMessageDirection === 'outbound'
          ? convo.lastMessageDirection
          : null,
      conversationWindowExpiresAt: tsToIso(convo.conversationWindowExpiresAt),
      windowOpen: windowMs !== null && windowMs > nowMs,
    },
    messages,
  });
}

interface PostBody {
  type?: unknown;
  body?: unknown;
  wabaPhoneNumberId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Konuşma id gerekli.' }, { status: 400 });
  }

  let body: PostBody;
  try { body = await req.json() as PostBody; }
  catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 }); }

  const type = typeof body.type === 'string' ? body.type : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (type !== 'text') {
    return NextResponse.json({ errorCode: 'UNSUPPORTED_TYPE', message: 'Sadece text desteklenir.' }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ errorCode: 'EMPTY_BODY', message: 'Mesaj içeriği boş.' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_BODY_LEN) {
    return NextResponse.json({ errorCode: 'BODY_TOO_LONG', message: `Mesaj ${MAX_TEXT_BODY_LEN} karakteri aşamaz.` }, { status: 400 });
  }

  const db = getAdminFirestore();
  const convoRef = db.collection(COLLECTIONS.wabaConversations).doc(id);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Konuşma bulunamadı.' }, { status: 404 });
  }
  const convo = convoSnap.data() as WabaConversationDoc;
  if (convo.ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu konuşma için yetkiniz yok.' }, { status: 403 });
  }
  const contactPhone = typeof convo.contactPhone === 'string' ? convo.contactPhone : '';
  if (!contactPhone) {
    return NextResponse.json({ errorCode: 'NO_CONTACT_PHONE', message: 'Karşı taraf telefonu eksik.' }, { status: 409 });
  }

  // 24h window kontrol
  const windowMs = tsToMillis(convo.conversationWindowExpiresAt);
  const nowMs = Date.now();
  if (windowMs === null || windowMs <= nowMs) {
    return NextResponse.json({ errorCode: 'WINDOW_EXPIRED', message: '24 saatlik konuşma penceresi kapandı. Şablon (template) ile gönderin.' }, { status: 409 });
  }

  // Phone number id resolve: body veya aktif tek numara
  // eslint-disable-next-line no-useless-assignment
  let wabaPhoneNumberId = typeof body.wabaPhoneNumberId === 'string' ? body.wabaPhoneNumberId.trim() : '';
  // eslint-disable-next-line no-useless-assignment
  let metaPhoneId = '';
  if (wabaPhoneNumberId) {
    const phoneSnap = await db.collection(COLLECTIONS.wabaPhoneNumbers).doc(wabaPhoneNumberId).get();
    if (!phoneSnap.exists) {
      return NextResponse.json({ errorCode: 'PHONE_NOT_FOUND', message: 'Gönderici numara bulunamadı.' }, { status: 404 });
    }
    const pd = phoneSnap.data() as WabaPhoneNumberDoc;
    if (pd.ngoId !== ctx.ngoId) {
      return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu numara için yetkiniz yok.' }, { status: 403 });
    }
    if (pd.status !== 'active' || !pd.wabaPhoneNumberId) {
      return NextResponse.json({ errorCode: 'PHONE_NOT_ACTIVE', message: 'Gönderici numara aktif değil.' }, { status: 409 });
    }
    metaPhoneId = pd.wabaPhoneNumberId;
  } else {
    const activeSnap = await db.collection(COLLECTIONS.wabaPhoneNumbers)
      .where('ngoId', '==', ctx.ngoId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (activeSnap.empty) {
      return NextResponse.json({ errorCode: 'NO_ACTIVE_PHONE', message: 'Aktif gönderici numara bulunamadı.' }, { status: 409 });
    }
    wabaPhoneNumberId = activeSnap.docs[0].id;
    const pd = activeSnap.docs[0].data() as WabaPhoneNumberDoc;
    metaPhoneId = pd.wabaPhoneNumberId ?? '';
    if (!metaPhoneId) {
      return NextResponse.json({ errorCode: 'PHONE_NOT_PROVISIONED', message: 'Meta phone number id eksik.' }, { status: 409 });
    }
  }

  // Text mesaj — provider WhatsAppSendInput template-odaklı; free-form için doğrudan Meta'ya fetch.
  const accessToken = process.env.META_WA_ACCESS_TOKEN || process.env.WHATSAPP_DEFAULT_TOKEN;
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  if (!accessToken) {
    // Token yoksa kayıt at, ama hata dön (mock'ta da gerçek free-form gitmez).
    errorMessage = 'META_WA_ACCESS_TOKEN yok';
  } else {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: contactPhone.replace(/^\+/, ''),
          type: 'text',
          text: { body: text },
        }),
      });
      const json = await res.json() as { messages?: Array<{ id: string }>; error?: { message?: string; code?: number } };
      if (res.ok && json.messages?.[0]?.id) {
        providerMessageId = json.messages[0].id;
      } else {
        errorMessage = json.error?.message ?? `Meta HTTP ${res.status}`;
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'network error';
    }
  }

  const messageStatus = providerMessageId ? 'sent' : 'failed';
  const summaryBody = text.length > 120 ? text.slice(0, 117) + '...' : text;
  const windowExpiresAt = new Date(nowMs + CONVERSATION_WINDOW_MS);

  try {
    await convoRef.set({
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageBody: summaryBody,
      lastMessageDirection: 'outbound',
      conversationWindowExpiresAt: windowExpiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await convoRef.collection(COLLECTIONS.wabaMessages).add({
      direction: 'outbound',
      type: 'text',
      body: text,
      wabaMessageId: providerMessageId,
      wabaPhoneNumberId,
      status: messageStatus,
      failureReason: errorMessage,
      sentBy: ctx.uid,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[wa-convo-reply] persist failed', err instanceof Error ? err.message : 'unknown');
  }

  if (!providerMessageId) {
    return NextResponse.json({ errorCode: 'SEND_FAILED', message: errorMessage || 'Mesaj gönderilemedi.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, wabaMessageId: providerMessageId });
}
