/**
 * POST /api/ngo-admin/whatsapp-business/send
 *
 * STK admin'i, onaylı bir WABA şablonu üzerinden toplu WhatsApp mesajı gönderir.
 *
 * Recipients 3 yoldan biriyle çözülür:
 *  - { recipients: string[] }              — doğrudan E.164 telefon listesi
 *  - { recipients: { contactIds: [...] } } — santralContacts/{id}.phone üzerinden
 *  - { recipients: { listId: '...' } }     — santralContacts where listIds array-contains
 *
 * Body: {
 *   wabaPhoneNumberId,  // wabaPhoneNumbers/{id} — STK'nın seçtiği gönderici numara
 *   recipients,
 *   templateId,         // wabaTemplates/{id}
 *   variables?: Record<string, string[]>  // her variable için recipient sırasına göre değer array
 * }
 *
 * Yanıt: { sent, failed, total, provider }
 *
 * Güvenlik:
 *  - Yetki: users/{uid}.managedNgoId zorunlu, role ngo-admin|super-admin
 *  - Template approved + wabaPhoneNumber active olmalı
 *  - Multi-tenant: wabaPhoneNumber ve template'in ngoId'si caller ile eşleşmeli
 *  - Üst sınır: senkron tek istekte MAX_SYNC_RECIPIENTS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/messaging/providers/whatsapp';
import type { WhatsAppTemplateComponent } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Senkron tek istekte işlenebilecek azami alıcı sayısı. Fazlası kuyruk gerektirir. */
const MAX_SYNC_RECIPIENTS = 1000;
/** Meta free-form (24h) konuşma penceresi süresi (ms). */
const CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface SendBody {
  wabaPhoneNumberId?: unknown;
  templateId?: unknown;
  recipients?: unknown;
  variables?: unknown;
}

interface WabaTemplateDoc {
  ngoId?: string;
  name?: string;
  language?: string;
  category?: 'utility' | 'marketing' | 'authentication';
  status?: string;
  variables?: string[];
  headerText?: string;
}

interface WabaPhoneNumberDoc {
  ngoId?: string;
  phoneNumber?: string;
  wabaPhoneNumberId?: string;
  status?: 'active' | 'paused' | 'suspended';
  displayName?: string;
  accessTokenRef?: string;
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
    // yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managedNgoId/BrandId/
    // ClubId==header) ya da super-admin ise header'daki kurum kullanılır; yoksa
    // eski davranış: managedNgoId → managedBrandId → managedClubId ilk dolu olan.
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

/** E.164 normalize — başında + olsun, sadece rakam. */
function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits.startsWith('+')) {
    if (digits.length < 7) return null;
    return '+' + digits.replace(/^\+/, '');
  }
  if (digits.length < 8) return null;
  return digits;
}

/** wabaConversations doc id — deterministik: ngoId__phone (+ silindi). */
function conversationDocId(ngoId: string, phone: string): string {
  return `${ngoId}__${phone.replace(/^\+/, '')}`;
}

async function resolveRecipients(
  db: FirebaseFirestore.Firestore,
  ngoId: string,
  raw: unknown,
): Promise<{ phones: string[]; contactIdByPhone: Map<string, { id: string; name?: string }> } | { error: string }> {
  const contactIdByPhone = new Map<string, { id: string; name?: string }>();

  // Direct phone array
  if (Array.isArray(raw)) {
    const phones: string[] = [];
    for (const item of raw) {
      if (typeof item !== 'string') continue;
      const p = normalizePhone(item);
      if (p) phones.push(p);
    }
    return { phones: dedupe(phones), contactIdByPhone };
  }

  if (!raw || typeof raw !== 'object') {
    return { error: 'recipients direkt dizi veya { contactIds | listId } olmalı.' };
  }

  const obj = raw as { contactIds?: unknown; listId?: unknown };

  if (Array.isArray(obj.contactIds)) {
    const ids = obj.contactIds.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim());
    if (ids.length === 0) return { phones: [], contactIdByPhone };
    // Firestore documentId in() max 30 — batch
    const phones: string[] = [];
    for (let i = 0; i < ids.length; i += 30) {
      const batch = ids.slice(i, i + 30);
      const snap = await db.collection(COLLECTIONS.santralContacts)
        .where('__name__', 'in', batch.map((id) => db.collection(COLLECTIONS.santralContacts).doc(id)))
        .get();
      for (const doc of snap.docs) {
        const data = doc.data() as { ngoId?: string; phone?: string; name?: string };
        if (data.ngoId !== ngoId) continue;
        if (typeof data.phone !== 'string') continue;
        const p = normalizePhone(data.phone);
        if (!p) continue;
        phones.push(p);
        contactIdByPhone.set(p, { id: doc.id, name: typeof data.name === 'string' ? data.name : undefined });
      }
    }
    return { phones: dedupe(phones), contactIdByPhone };
  }

  if (typeof obj.listId === 'string' && obj.listId.trim()) {
    const listId = obj.listId.trim();
    const snap = await db.collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ngoId)
      .where('listIds', 'array-contains', listId)
      .get();
    const phones: string[] = [];
    for (const doc of snap.docs) {
      const data = doc.data() as { phone?: string; name?: string };
      if (typeof data.phone !== 'string') continue;
      const p = normalizePhone(data.phone);
      if (!p) continue;
      phones.push(p);
      contactIdByPhone.set(p, { id: doc.id, name: typeof data.name === 'string' ? data.name : undefined });
    }
    return { phones: dedupe(phones), contactIdByPhone };
  }

  return { error: 'recipients dizi, contactIds veya listId içermeli.' };
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

/** Variables map'inden i. recipient için template components üret. */
function buildComponents(
  variables: Record<string, string[]> | null,
  variableOrder: string[],
  recipientIndex: number,
  headerText: string | undefined,
): WhatsAppTemplateComponent[] {
  const components: WhatsAppTemplateComponent[] = [];

  if (variableOrder.length === 0) return components;

  const params = variableOrder.map((key) => {
    const arr = variables?.[key];
    const val = Array.isArray(arr) && typeof arr[recipientIndex] === 'string' ? arr[recipientIndex] : '';
    return { type: 'text' as const, text: val };
  });

  components.push({ type: 'body', parameters: params });

  if (headerText) {
    // Header'da variable varsa burada da map'lenmeli — POC: body ile aynı sırayı kullanıyor.
    // Header variable'ları üretim'de ayrı bir variableOrderHeader gerektirebilir.
  }

  return components;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: SendBody;
  try { body = await req.json() as SendBody; }
  catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 }); }

  const wabaPhoneNumberId = typeof body.wabaPhoneNumberId === 'string' ? body.wabaPhoneNumberId.trim() : '';
  const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';
  if (!wabaPhoneNumberId || !templateId) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'wabaPhoneNumberId ve templateId zorunlu.' }, { status: 400 });
  }

  const variables: Record<string, string[]> | null =
    body.variables && typeof body.variables === 'object'
      ? Object.fromEntries(
          Object.entries(body.variables as Record<string, unknown>)
            .filter(([, v]) => Array.isArray(v))
            .map(([k, v]) => [k, (v as unknown[]).map((x) => (typeof x === 'string' ? x : ''))]),
        )
      : null;

  const db = getAdminFirestore();

  // 1. Phone number doc — active + tenant
  const phoneDocSnap = await db.collection(COLLECTIONS.wabaPhoneNumbers).doc(wabaPhoneNumberId).get();
  if (!phoneDocSnap.exists) {
    return NextResponse.json({ errorCode: 'PHONE_NOT_FOUND', message: 'Gönderici numara bulunamadı.' }, { status: 404 });
  }
  const phoneDoc = phoneDocSnap.data() as WabaPhoneNumberDoc;
  if (phoneDoc.ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu numara için yetkiniz yok.' }, { status: 403 });
  }
  if (phoneDoc.status !== 'active') {
    return NextResponse.json({ errorCode: 'PHONE_NOT_ACTIVE', message: 'Gönderici numara aktif değil.' }, { status: 409 });
  }
  const wabaPhoneId = phoneDoc.wabaPhoneNumberId;
  if (!wabaPhoneId) {
    return NextResponse.json({ errorCode: 'PHONE_NOT_PROVISIONED', message: 'Meta phone number id eksik.' }, { status: 409 });
  }

  // 2. Template — approved + tenant
  const tplSnap = await db.collection(COLLECTIONS.wabaTemplates).doc(templateId).get();
  if (!tplSnap.exists) {
    return NextResponse.json({ errorCode: 'TEMPLATE_NOT_FOUND', message: 'Şablon bulunamadı.' }, { status: 404 });
  }
  const tpl = tplSnap.data() as WabaTemplateDoc;
  if (tpl.ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu şablon için yetkiniz yok.' }, { status: 403 });
  }
  if (tpl.status !== 'approved') {
    return NextResponse.json({ errorCode: 'TEMPLATE_NOT_APPROVED', message: 'Şablon Meta onayında değil.' }, { status: 409 });
  }
  if (!tpl.name || !tpl.language) {
    return NextResponse.json({ errorCode: 'TEMPLATE_MALFORMED', message: 'Şablon name/language eksik.' }, { status: 409 });
  }
  const variableOrder = Array.isArray(tpl.variables) ? tpl.variables.filter((s): s is string => typeof s === 'string') : [];
  const conversationCategory: 'utility' | 'marketing' | 'authentication' =
    tpl.category === 'marketing' ? 'marketing'
    : tpl.category === 'authentication' ? 'authentication'
    : 'utility';

  // 3. Recipients resolve
  const resolved = await resolveRecipients(db, ctx.ngoId, body.recipients);
  if ('error' in resolved) {
    return NextResponse.json({ errorCode: 'BAD_RECIPIENTS', message: resolved.error }, { status: 400 });
  }
  const allPhones = resolved.phones;
  if (allPhones.length === 0) {
    return NextResponse.json({ errorCode: 'NO_RECIPIENTS', message: 'Hiçbir geçerli alıcı bulunamadı.' }, { status: 400 });
  }
  const recipientsTruncated = allPhones.length > MAX_SYNC_RECIPIENTS;
  const phones = recipientsTruncated ? allPhones.slice(0, MAX_SYNC_RECIPIENTS) : allPhones;

  // 4. Dispatch
  const provider = getWhatsAppProvider();
  let sent = 0;
  let failed = 0;
  const nowMs = Date.now();
  const windowExpiresAt = new Date(nowMs + CONVERSATION_WINDOW_MS);

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];
    const components = buildComponents(variables, variableOrder, i, tpl.headerText);

    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;

    try {
      const r = await provider.send({
        to: phone.replace(/^\+/, ''),
        templateName: tpl.name,
        templateLanguage: tpl.language,
        components,
        conversationCategory,
        useCase: conversationCategory === 'marketing' ? 'marketing' : 'transactional',
        wabaPhoneNumberId: wabaPhoneId,
      });
      if (r.ok && r.providerMessageId) {
        sent++;
        providerMessageId = r.providerMessageId;
      } else {
        failed++;
        errorMessage = r.errorMessage ?? r.errorCode ?? 'unknown';
      }
    } catch (err) {
      failed++;
      errorMessage = err instanceof Error ? err.message : 'unknown';
    }

    // wabaConversations upsert + message subdoc
    try {
      const convoId = conversationDocId(ctx.ngoId, phone);
      const convoRef = db.collection(COLLECTIONS.wabaConversations).doc(convoId);
      const contactRef = resolved.contactIdByPhone.get(phone);

      const messageStatus = providerMessageId ? 'sent' : 'failed';
      const summaryBody = `[${tpl.name}]`;

      await convoRef.set({
        ngoId: ctx.ngoId,
        contactPhone: phone,
        contactName: contactRef?.name ?? null,
        contactId: contactRef?.id ?? null,
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessageBody: summaryBody,
        lastMessageDirection: 'outbound',
        conversationWindowExpiresAt: windowExpiresAt,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      await convoRef.collection(COLLECTIONS.wabaMessages).add({
        direction: 'outbound',
        type: 'template',
        templateName: tpl.name,
        body: summaryBody,
        wabaMessageId: providerMessageId,
        wabaPhoneNumberId,
        status: messageStatus,
        failureReason: errorMessage,
        sentBy: ctx.uid,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[wa-send] conversation upsert failed', err instanceof Error ? err.message : 'unknown');
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    sent,
    failed,
    total: phones.length,
    recipientsTruncated,
    provider: provider.driver,
  });
}
