/**
 * Meta WhatsApp Cloud API webhook — multi-tenant WABA inbound/outbound event sink.
 *
 * GET  /api/integrations/whatsapp/webhook
 *   hub.mode=subscribe + hub.verify_token == WABA_WEBHOOK_VERIFY_TOKEN
 *   → hub.challenge plain-text return (Meta requirement).
 *
 * POST /api/integrations/whatsapp/webhook
 *   Meta event'leri:
 *     - messages: gelen inbound mesaj → wabaConversations upsert + message doc,
 *                 unreadCount++ + 24h window reset + santralContacts otomatik bağlama
 *                 + onay anahtar kelimeleri ("1", "Evet", "EVET", ...) → priority=true
 *     - statuses: outbound status update (sent/delivered/read/failed)
 *     - template_status_update: wabaTemplates status sync (approved/rejected/paused)
 *
 *   Auth:
 *     - X-Hub-Signature-256 HMAC SHA256 verify (WABA_DEFAULT_APP_SECRET — bypass'sız).
 *
 *   Daima 200 OK döner (Meta retry yapmasın diye); internal error'lar log'a düşer.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Meta free-form (24h) konuşma penceresi süresi (ms). */
const CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Gönüllülük çağrı queue önceliği için tetikleyici anahtar kelimeler. */
const POSITIVE_REPLY_KEYWORDS = new Set([
  '1', 'evet', 'tamam', 'olur', 'kabul', 'katılırım', 'katilirim', 'gelirim', 'isterim', 'ok',
]);

/**
 * "Hayır" niyeti taşıyan ifadeler — tam kelime eşleşmesi yapılmaz, mesaj
 * metninin içinde geçmesi yeterli (substring). tr küçük harfe çevrilmiş metinde
 * aranır. Bu eşleşince kişiden müsait saat istenir (callback akışı).
 */
const NEGATIVE_REPLY_SUBSTRINGS = [
  'hayır', 'hayir', 'olmaz', 'istemiyorum', 'uygun değil', 'yok', 'katılamam', 'gelemem', 'no',
];

function isNegativeReply(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return NEGATIVE_REPLY_SUBSTRINGS.some((kw) => t.includes(kw));
}

/**
 * Serbest metinden best-effort randevu zamanı çıkar. Asla throw etmez.
 *  - HH:MM (veya H.MM / HH veya "saat 14") → bugün/yarın o saat (geçmişse +1 gün)
 *  - "yarın" → ertesi gün (saat yakalandıysa o saat, yoksa şu anki saat)
 *  - "bugün" → bugün (geçmiş saatse yine bugün bırakılır, operatör reason'dan görür)
 *  - hafta günü (pazartesi..pazar) → o güne ilerle
 * Hiçbiri eşleşmezse fallback: şu andan +24 saat.
 * Ham metin reason'da saklanır; bu fonksiyon yalnızca kabaca bir Date üretir.
 */
const WEEKDAYS_TR = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];

function parseCallbackTime(raw: string, now: Date = new Date()): Date {
  const text = raw.toLowerCase();
  const result = new Date(now.getTime());

  // 1) Saat: "14:30", "14.30", "saat 14", "9da" gibi → ilk makul saati al.
  let hour: number | null = null;
  let minute = 0;
  const hm = text.match(/(\d{1,2})[:.](\d{2})/);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) { hour = h; minute = m; }
  } else {
    const hOnly = text.match(/(?:saat\s*)?\b(\d{1,2})\b/);
    if (hOnly) {
      const h = Number(hOnly[1]);
      if (h >= 0 && h <= 23) { hour = h; minute = 0; }
    }
  }

  // 2) Gün ipucu: yarın / bugün / hafta günü.
  let dayOffset: number | null = null;
  if (text.includes('yarın') || text.includes('yarin')) {
    dayOffset = 1;
  } else if (text.includes('bugün') || text.includes('bugun')) {
    dayOffset = 0;
  } else {
    for (let i = 0; i < WEEKDAYS_TR.length; i += 1) {
      if (text.includes(WEEKDAYS_TR[i])) {
        const diff = (i - now.getDay() + 7) % 7;
        dayOffset = diff === 0 ? 7 : diff; // bugünün günü söylendiyse haftaya
        break;
      }
    }
  }

  // Hiçbir sinyal yoksa → fallback +24 saat.
  if (hour === null && dayOffset === null) {
    return new Date(now.getTime() + 24 * 3600 * 1000);
  }

  if (dayOffset !== null) {
    result.setDate(result.getDate() + dayOffset);
  }
  if (hour !== null) {
    result.setHours(hour, minute, 0, 0);
    // Sadece saat verildi ve geçmişte kaldıysa yarına kaydır.
    if (dayOffset === null && result.getTime() <= now.getTime()) {
      result.setDate(result.getDate() + 1);
    }
  }
  return result;
}

/**
 * Webhook içinden serbest-metin WhatsApp yanıtı gönder (24s müşteri-hizmeti
 * penceresi içinde serbest metin serbest). Token apphosting env fallback'ten
 * gelir (whatsapp-send route ile aynı kaynak). Hata fırlatmaz — false döner.
 */
async function sendWhatsAppText(metaPhoneNumberId: string, to: string, body: string): Promise<boolean> {
  const accessToken = (process.env.WHATSAPP_DEFAULT_TOKEN ?? process.env.META_WA_ACCESS_TOKEN ?? '').trim();
  if (!accessToken || !metaPhoneNumberId || !to || !body) return false;
  try {
    await getWhatsAppProvider({ accessToken, phoneNumberId: metaPhoneNumberId }).sendText({ to, body });
    return true;
  } catch (err) {
    console.error('[wa-webhook] sendText failed', err instanceof Error ? err.message : 'unknown');
    return false;
  }
}

interface MetaWebhookEnvelope {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          button?: { payload?: string; text?: string };
          interactive?: {
            button_reply?: { id?: string; title?: string };
            list_reply?: { id?: string; title?: string };
          };
          image?: { id?: string; mime_type?: string; sha256?: string; caption?: string };
          document?: { id?: string; filename?: string; mime_type?: string };
        }>;
        statuses?: Array<{
          id?: string;
          status?: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp?: string;
          recipient_id?: string;
          errors?: Array<{ code?: number; title?: string; message?: string }>;
        }>;
        // template_status_update payload (field === 'message_template_status_update')
        message_template_id?: string | number;
        message_template_name?: string;
        message_template_language?: string;
        event?: 'APPROVED' | 'REJECTED' | 'PENDING' | 'PAUSED' | 'DISABLED' | 'FLAGGED';
        reason?: string;
      };
    }>;
  }>;
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WABA_DEFAULT_APP_SECRET || process.env.META_APP_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  try {
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Phone numarayı E.164'e normalize et — başında + olacak. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `+${digits}` : '';
}

function conversationDocId(ngoId: string, phone: string): string {
  return `${ngoId}__${phone.replace(/^\+/, '')}`;
}

/** Meta phone_number_id → wabaPhoneNumbers/{docId} + ngoId resolve. */
async function resolveTenantByMetaPhoneId(
  db: Firestore,
  metaPhoneId: string,
): Promise<{ docId: string; ngoId: string } | null> {
  const snap = await db.collection(COLLECTIONS.wabaPhoneNumbers)
    .where('wabaPhoneNumberId', '==', metaPhoneId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as { ngoId?: string };
  if (!data.ngoId) return null;
  return { docId: doc.id, ngoId: data.ngoId };
}

/** santralContacts içinde phone match — ilk eşleşeni döner (tenant scoped). */
async function findContactByPhone(
  db: Firestore,
  ngoId: string,
  phone: string,
): Promise<{ id: string; name?: string } | null> {
  const snap = await db.collection(COLLECTIONS.santralContacts)
    .where('ngoId', '==', ngoId)
    .where('phone', '==', phone)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as { name?: string };
  return { id: doc.id, name: typeof data.name === 'string' ? data.name : undefined };
}

function isPositiveReply(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return POSITIVE_REPLY_KEYWORDS.has(t);
}

async function applyInboundMessage(
  db: Firestore,
  tenant: { ngoId: string },
  msg: NonNullable<NonNullable<NonNullable<MetaWebhookEnvelope['entry']>[number]['changes']>[number]['value']>['messages'] extends Array<infer M> | undefined ? M : never,
  metaPhoneNumberId: string,
  contactNameHint?: string,
): Promise<void> {
  const fromRaw = typeof msg.from === 'string' ? msg.from : '';
  if (!fromRaw) return;
  const phone = normalizePhone(fromRaw);
  if (!phone) return;

  const tsMs = typeof msg.timestamp === 'string' ? Number(msg.timestamp) * 1000 : Date.now();
  const ts = new Date(Number.isFinite(tsMs) ? tsMs : Date.now());

  // Mesaj body + type normalize — initial değerler else branch'te kullanılır
  /* eslint-disable no-useless-assignment */
  let body = '';
  let type: 'text' | 'image' | 'document' | 'button-reply' = 'text';
  let mediaUrl: string | null = null;
  /* eslint-enable no-useless-assignment */

  if (msg.type === 'text' && msg.text?.body) {
    body = msg.text.body;
    type = 'text';
  } else if (msg.type === 'button' && msg.button) {
    body = msg.button.text ?? msg.button.payload ?? '';
    type = 'button-reply';
  } else if (msg.type === 'interactive' && msg.interactive) {
    body = msg.interactive.button_reply?.title ?? msg.interactive.list_reply?.title ?? '';
    type = 'button-reply';
  } else if (msg.type === 'image' && msg.image) {
    body = msg.image.caption ?? '[görsel]';
    type = 'image';
    mediaUrl = msg.image.id ? `meta-media:${msg.image.id}` : null;
  } else if (msg.type === 'document' && msg.document) {
    body = msg.document.filename ?? '[belge]';
    type = 'document';
    mediaUrl = msg.document.id ? `meta-media:${msg.document.id}` : null;
  } else {
    body = `[${msg.type ?? 'mesaj'}]`;
  }

  const contact = await findContactByPhone(db, tenant.ngoId, phone);
  const convoId = conversationDocId(tenant.ngoId, phone);
  const convoRef = db.collection(COLLECTIONS.wabaConversations).doc(convoId);
  const windowExpiresAt = new Date(ts.getTime() + CONVERSATION_WINDOW_MS);

  const summaryBody = body.length > 120 ? body.slice(0, 117) + '...' : body;

  await convoRef.set({
    ngoId: tenant.ngoId,
    contactPhone: phone,
    contactName: contact?.name ?? contactNameHint ?? null,
    contactId: contact?.id ?? null,
    lastMessageAt: ts,
    lastMessageBody: summaryBody,
    lastMessageDirection: 'inbound',
    conversationWindowExpiresAt: windowExpiresAt,
    unreadCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await convoRef.collection(COLLECTIONS.wabaMessages).add({
    direction: 'inbound',
    type,
    body,
    mediaUrl,
    wabaMessageId: typeof msg.id === 'string' ? msg.id : null,
    status: 'delivered',
    timestamp: ts,
  });

  // Pozitif onay: santralContacts.priority = true → call queue önceliklendir
  if (contact && (type === 'text' || type === 'button-reply') && isPositiveReply(body)) {
    try {
      await db.collection(COLLECTIONS.santralContacts).doc(contact.id).set({
        priority: true,
        lastPositiveReplyAt: FieldValue.serverTimestamp(),
        lastPositiveReplyChannel: 'whatsapp',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('[wa-webhook] priority flag set failed', err instanceof Error ? err.message : 'unknown');
    }
    return; // pozitif yanıt callback durum makinesini tetiklemez
  }

  // "Hayır → müsait saat → randevu" durum makinesi.
  // Yalnızca bilinen kişiden gelen serbest metin/buton yanıtlarında çalışır.
  if (!contact || (type !== 'text' && type !== 'button-reply')) return;

  const contactRef = db.collection(COLLECTIONS.santralContacts).doc(contact.id);
  let awaitingCallbackTime: boolean;
  try {
    const snap = await contactRef.get();
    awaitingCallbackTime = snap.exists && snap.get('awaitingCallbackTime') === true;
  } catch (err) {
    console.error('[wa-webhook] contact awaiting flag read failed', err instanceof Error ? err.message : 'unknown');
    return;
  }

  if (awaitingCallbackTime) {
    // 1) Bu mesaj "müsait saat" → randevu (callback) oluştur.
    const scheduledAt = parseCallbackTime(body);
    try {
      await db.collection(COLLECTIONS.santralScheduledCallbacks).add({
        ngoId: tenant.ngoId,
        contactId: contact.id,
        contactName: contact.name ?? null,
        scheduledAt,
        status: 'pending',
        reason: `WhatsApp talebi — müsait saat: ${body}`,
        source: 'whatsapp-no-callback',
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[wa-webhook] callback create failed', err instanceof Error ? err.message : 'unknown');
    }
    try {
      await contactRef.set({ awaitingCallbackTime: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('[wa-webhook] awaiting flag clear failed', err instanceof Error ? err.message : 'unknown');
    }
    await sendWhatsAppText(metaPhoneNumberId, phone, 'Teşekkürler 🧡 Belirttiğiniz saate not aldık, sizi arayacağız.');
    return;
  }

  // 2) Negatif yanıt → müsait saat sor, kişiyi "awaiting" durumuna al.
  if (isNegativeReply(body)) {
    try {
      await contactRef.set({
        awaitingCallbackTime: true,
        lastWhatsAppResponse: 'no',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('[wa-webhook] awaiting flag set failed', err instanceof Error ? err.message : 'unknown');
    }
    await sendWhatsAppText(metaPhoneNumberId, phone, 'Anladık 🧡 Size uygun bir gün/saat söyler misiniz? O saatte sizi arayalım.');
  }
}

async function applyStatusUpdate(
  db: Firestore,
  status: NonNullable<NonNullable<NonNullable<MetaWebhookEnvelope['entry']>[number]['changes']>[number]['value']>['statuses'] extends Array<infer S> | undefined ? S : never,
): Promise<void> {
  const wabaMessageId = typeof status.id === 'string' ? status.id : '';
  const newStatus = status.status;
  if (!wabaMessageId || !newStatus) return;

  // wabaMessageId benzersiz — collectionGroup ile bul
  const msgSnap = await db.collectionGroup(COLLECTIONS.wabaMessages)
    .where('wabaMessageId', '==', wabaMessageId)
    .limit(1)
    .get();
  if (msgSnap.empty) return;
  const doc = msgSnap.docs[0];
  const update: Record<string, unknown> = {
    status: newStatus,
    [`${newStatus}At`]: FieldValue.serverTimestamp(),
  };
  if (newStatus === 'failed' && Array.isArray(status.errors) && status.errors.length > 0) {
    update.failureReason = status.errors[0].message ?? status.errors[0].title ?? null;
  }
  try { await doc.ref.update(update); }
  catch (err) { console.error('[wa-webhook] status update failed', err instanceof Error ? err.message : 'unknown'); }
}

async function applyTemplateStatusUpdate(
  db: Firestore,
  value: NonNullable<NonNullable<MetaWebhookEnvelope['entry']>[number]['changes']>[number]['value'],
): Promise<void> {
  if (!value) return;
  const name = typeof value.message_template_name === 'string' ? value.message_template_name : '';
  const language = typeof value.message_template_language === 'string' ? value.message_template_language : '';
  const event = value.event;
  if (!name || !event) return;

  const statusMap: Record<string, 'approved' | 'rejected' | 'pending' | 'paused'> = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING: 'pending',
    PAUSED: 'paused',
    DISABLED: 'paused',
    FLAGGED: 'paused',
  };
  const mapped = statusMap[event];
  if (!mapped) return;

  let query = db.collection(COLLECTIONS.wabaTemplates).where('name', '==', name);
  if (language) query = query.where('language', '==', language);
  const snap = await query.get();
  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, {
      status: mapped,
      rejectionReason: mapped === 'rejected' && typeof value.reason === 'string' ? value.reason : null,
      wabaTemplateId: typeof value.message_template_id !== 'undefined' ? String(value.message_template_id) : doc.data().wabaTemplateId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  if (!snap.empty) {
    try { await batch.commit(); }
    catch (err) { console.error('[wa-webhook] template status batch failed', err instanceof Error ? err.message : 'unknown'); }
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.WABA_WEBHOOK_VERIFY_TOKEN || process.env.META_WA_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return NextResponse.json({ errorCode: 'VERIFY_FAILED', message: 'Webhook doğrulanamadı.' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-hub-signature-256');
  if (!verifySignature(rawBody, signatureHeader)) {
    return NextResponse.json({ errorCode: 'INVALID_SIGNATURE', message: 'Webhook imzası doğrulanamadı.' }, { status: 401 });
  }

  let envelope: MetaWebhookEnvelope;
  try { envelope = JSON.parse(rawBody || '{}') as MetaWebhookEnvelope; }
  catch {
    // Meta retry etmesin diye 200 dön — ama log düşelim
    console.error('[wa-webhook] invalid JSON body');
    return NextResponse.json({ ok: true });
  }

  const db = getAdminFirestore();

  for (const entry of envelope.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      // Template status update
      if (change.field === 'message_template_status_update' || value.event) {
        try { await applyTemplateStatusUpdate(db, value); }
        catch (err) { console.error('[wa-webhook] template status update failed', err instanceof Error ? err.message : 'unknown'); }
        continue;
      }

      // messages / statuses → phone_number_id ile tenant resolve
      const metaPhoneId = value.metadata?.phone_number_id;
      if (!metaPhoneId) continue;

      // eslint-disable-next-line no-useless-assignment
      let tenant: { ngoId: string } | null = null;
      try { tenant = await resolveTenantByMetaPhoneId(db, metaPhoneId); }
      catch (err) {
        console.error('[wa-webhook] tenant resolve failed', err instanceof Error ? err.message : 'unknown');
        continue;
      }
      if (!tenant) {
        // Bilinmeyen phone_number_id — yine de 200 OK döneceğiz, ama log'a düş
        console.warn('[wa-webhook] unknown phone_number_id', metaPhoneId);
        continue;
      }

      // Inbound messages
      if (Array.isArray(value.messages)) {
        const contactNameHint = value.contacts?.[0]?.profile?.name;
        for (const msg of value.messages) {
          try { await applyInboundMessage(db, tenant, msg, metaPhoneId, contactNameHint); }
          catch (err) { console.error('[wa-webhook] inbound apply failed', err instanceof Error ? err.message : 'unknown'); }
        }
      }

      // Outbound statuses
      if (Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          try { await applyStatusUpdate(db, status); }
          catch (err) { console.error('[wa-webhook] status apply failed', err instanceof Error ? err.message : 'unknown'); }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
