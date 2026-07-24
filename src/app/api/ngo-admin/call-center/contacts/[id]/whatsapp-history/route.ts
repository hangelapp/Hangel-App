/**
 * GET /api/ngo-admin/call-center/contacts/[id]/whatsapp-history
 *
 * Tek bir santralContact için WhatsApp konuşma geçmişi.
 *  1. authorize() → ngo-admin / super-admin + managedNgoId
 *  2. santralContacts/{id} fetch + ngoId tenant match
 *  3. wabaConversations/{ngoId__phone} fetch
 *  4. messages sub-collection → en yeni 50 mesaj
 *
 * Yanıt: { conversation: {...} | null, messages: [...] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HISTORY_LIMIT = 50;

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
    } | undefined;
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuperAdmin = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (ilgili
    // managed* alanı header ile eşleşiyor) ya da super-admin ise header'daki
    // kurum kullanılır; yoksa managedNgoId → managedBrandId → managedClubId
    // ilk dolu olana düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;

    let activeOrgId: string;
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

function tsToIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as Record<string, unknown>)) {
    const seconds = (v as { _seconds: number })._seconds;
    return new Date(seconds * 1000).toISOString();
  }
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await authorize(req);
  if (!auth) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' },
      { status: 403 },
    );
  }
  const { id: contactId } = await ctx.params;
  if (!contactId) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'Kişi id zorunlu.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  const contactSnap = await db.collection(COLLECTIONS.santralContacts).doc(contactId).get();
  if (!contactSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' },
      { status: 404 },
    );
  }
  const contactData = contactSnap.data() as Record<string, unknown>;
  if (contactData.ngoId !== auth.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' },
      { status: 403 },
    );
  }
  const contactPhone = typeof contactData.phone === 'string' ? contactData.phone : '';
  if (!contactPhone) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  const conversationId = `${auth.ngoId}__${contactPhone}`;
  const conversationRef = db.collection(COLLECTIONS.wabaConversations).doc(conversationId);
  const conversationSnap = await conversationRef.get();

  if (!conversationSnap.exists) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  const c = conversationSnap.data() as Record<string, unknown>;
  const conversation = {
    id: conversationSnap.id,
    contactPhone: typeof c.contactPhone === 'string' ? c.contactPhone : contactPhone,
    contactName: typeof c.contactName === 'string' ? c.contactName : null,
    contactId: typeof c.contactId === 'string' ? c.contactId : contactId,
    lastMessageAt: tsToIso(c.lastMessageAt),
    lastMessageBody: typeof c.lastMessageBody === 'string' ? c.lastMessageBody : '',
    lastMessageDirection:
      c.lastMessageDirection === 'inbound' || c.lastMessageDirection === 'outbound'
        ? c.lastMessageDirection
        : 'outbound',
    unreadCount: typeof c.unreadCount === 'number' ? c.unreadCount : 0,
    conversationWindowExpiresAt: tsToIso(c.conversationWindowExpiresAt),
    createdAt: tsToIso(c.createdAt),
  };

  const messagesSnap = await conversationRef
    .collection(COLLECTIONS.wabaMessages)
    .orderBy('timestamp', 'desc')
    .limit(HISTORY_LIMIT)
    .get();

  const messages = messagesSnap.docs.map((doc) => {
    const m = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      direction: m.direction === 'inbound' || m.direction === 'outbound' ? m.direction : 'outbound',
      type: typeof m.type === 'string' ? m.type : 'text',
      body: typeof m.body === 'string' ? m.body : null,
      templateName: typeof m.templateName === 'string' ? m.templateName : null,
      mediaUrl: typeof m.mediaUrl === 'string' ? m.mediaUrl : null,
      wabaMessageId: typeof m.wabaMessageId === 'string' ? m.wabaMessageId : null,
      status: typeof m.status === 'string' ? m.status : null,
      failureReason: typeof m.failureReason === 'string' ? m.failureReason : null,
      sentBy: typeof m.sentBy === 'string' ? m.sentBy : null,
      timestamp: tsToIso(m.timestamp),
    };
  });

  return NextResponse.json({ conversation, messages });
}
