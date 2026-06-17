/**
 * POST /api/ngo-admin/call-center/contacts/[id]/whatsapp-send
 *
 * Çağrı merkezi UI'sinden tek bir kişiye WhatsApp şablon mesajı gönderir.
 * Akış:
 *  1. authorize() → ngo-admin / super-admin + managedNgoId
 *  2. santralContacts/{id} fetch + ngoId tenant match
 *  3. wabaTemplates/{templateId} fetch + ngoId match + status 'approved'
 *  4. wabaPhoneNumbers (template.wabaPhoneNumberId) fetch + ngoId match
 *  5. Meta Cloud sendTemplate (POC: env access token fallback)
 *  6. wabaConversations upsert + messages subcoll insert
 *  7. santralContacts güncelle: lastWhatsAppSentAt + lastWhatsAppTemplate + wabaConversationId
 *
 * Body: { templateId: string, variables?: Record<string, string> }
 *   variables → template.variables sırasına göre body component params'a map'lenir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';
import { MetaCloudError, type TemplateComponent } from '@/lib/whatsapp/meta-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_HOURS = 24;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface PostBody {
  templateId?: unknown;
  variables?: unknown;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string } | undefined;
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

function conversationDocId(ngoId: string, contactPhone: string): string {
  return `${ngoId}__${contactPhone}`;
}

function buildBodyComponents(
  variableNames: string[],
  values: Record<string, string>,
): TemplateComponent[] {
  if (variableNames.length === 0) return [];
  const params = variableNames.map((name) => ({
    type: 'text' as const,
    text: typeof values[name] === 'string' ? values[name] : '',
  }));
  return [{ type: 'body', parameters: params }];
}

function mapMetaErrorStatus(category: MetaCloudError['category']): number {
  switch (category) {
    case 'invalid_token':
    case 'permission_denied':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'invalid_phone':
    case 'template_not_approved':
      return 400;
    case 'network':
      return 502;
    default:
      return 502;
  }
}

export async function POST(
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

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' },
      { status: 400 },
    );
  }

  if (typeof body.templateId !== 'string' || !body.templateId.trim()) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'templateId zorunlu.' },
      { status: 400 },
    );
  }
  const templateId = body.templateId.trim();

  const variables: Record<string, string> =
    body.variables && typeof body.variables === 'object' && !Array.isArray(body.variables)
      ? Object.fromEntries(
          Object.entries(body.variables as Record<string, unknown>).map(([k, v]) => [
            k,
            typeof v === 'string' ? v : '',
          ]),
        )
      : {};

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
    return NextResponse.json(
      { errorCode: 'NO_PHONE', message: 'Kişinin telefon numarası yok.' },
      { status: 400 },
    );
  }
  const contactName = typeof contactData.name === 'string' ? contactData.name : '';

  const templateSnap = await db.collection(COLLECTIONS.wabaTemplates).doc(templateId).get();
  if (!templateSnap.exists) {
    return NextResponse.json(
      { errorCode: 'TEMPLATE_NOT_FOUND', message: 'Şablon bulunamadı.' },
      { status: 404 },
    );
  }
  const templateData = templateSnap.data() as Record<string, unknown>;
  if (templateData.ngoId !== auth.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu şablona erişim yetkiniz yok.' },
      { status: 403 },
    );
  }
  if (templateData.status !== 'approved') {
    return NextResponse.json(
      { errorCode: 'TEMPLATE_NOT_APPROVED', message: 'Şablon Meta onayında değil.' },
      { status: 400 },
    );
  }
  const templateName = typeof templateData.name === 'string' ? templateData.name : '';
  const templateLanguage = typeof templateData.language === 'string' ? templateData.language : 'tr';
  const templateWabaPhoneNumberId =
    typeof templateData.wabaPhoneNumberId === 'string' ? templateData.wabaPhoneNumberId : '';
  const templateVariableNames = Array.isArray(templateData.variables)
    ? (templateData.variables as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  if (!templateName || !templateWabaPhoneNumberId) {
    return NextResponse.json(
      { errorCode: 'TEMPLATE_INVALID', message: 'Şablon eksik alanlar içeriyor.' },
      { status: 500 },
    );
  }

  const phoneSnap = await db
    .collection(COLLECTIONS.wabaPhoneNumbers)
    .doc(templateWabaPhoneNumberId)
    .get();
  if (!phoneSnap.exists) {
    return NextResponse.json(
      { errorCode: 'PHONE_NOT_FOUND', message: 'WABA numarası bulunamadı.' },
      { status: 404 },
    );
  }
  const phoneData = phoneSnap.data() as Record<string, unknown>;
  if (phoneData.ngoId !== auth.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu WABA numarasına erişim yetkiniz yok.' },
      { status: 403 },
    );
  }
  if (phoneData.status !== 'active') {
    return NextResponse.json(
      { errorCode: 'PHONE_NOT_ACTIVE', message: 'WABA numarası aktif değil.' },
      { status: 400 },
    );
  }
  const metaPhoneNumberId =
    typeof phoneData.wabaPhoneNumberId === 'string' ? phoneData.wabaPhoneNumberId : '';
  const wabaAccountId = typeof phoneData.wabaAccountId === 'string' ? phoneData.wabaAccountId : '';
  if (!metaPhoneNumberId) {
    return NextResponse.json(
      { errorCode: 'PHONE_INVALID', message: 'WABA numarası eksik metadata içeriyor.' },
      { status: 500 },
    );
  }

  // POC: Secret Manager entegrasyonu yok → apphosting.yaml env fallback.
  const accessToken = process.env.WHATSAPP_DEFAULT_TOKEN ?? process.env.META_WA_ACCESS_TOKEN ?? '';
  if (!accessToken) {
    return NextResponse.json(
      {
        errorCode: 'WABA_TOKEN_MISSING',
        message: 'WhatsApp access token yapılandırılmamış.',
      },
      { status: 500 },
    );
  }

  const provider = getWhatsAppProvider({
    accessToken,
    phoneNumberId: metaPhoneNumberId,
    wabaId: wabaAccountId || undefined,
  });

  const components = buildBodyComponents(templateVariableNames, variables);

  let sendResult: { wabaMessageId: string; contactWaId: string };
  try {
    sendResult = await provider.sendTemplate({
      to: contactPhone,
      templateName,
      languageCode: templateLanguage,
      components,
    });
  } catch (err) {
    if (err instanceof MetaCloudError) {
      return NextResponse.json(
        { errorCode: `META_${err.category.toUpperCase()}`, message: err.message },
        { status: mapMetaErrorStatus(err.category) },
      );
    }
    return NextResponse.json(
      { errorCode: 'SEND_FAILED', message: err instanceof Error ? err.message : 'Gönderim başarısız.' },
      { status: 502 },
    );
  }

  const now = Timestamp.now();
  const conversationId = conversationDocId(auth.ngoId, contactPhone);
  const conversationRef = db.collection(COLLECTIONS.wabaConversations).doc(conversationId);
  const conversationSnap = await conversationRef.get();
  const windowExpires = Timestamp.fromMillis(now.toMillis() + WINDOW_HOURS * 3600 * 1000);
  const lastBody = `[Şablon] ${templateName}`;

  if (!conversationSnap.exists) {
    await conversationRef.set({
      ngoId: auth.ngoId,
      contactPhone,
      contactName: contactName || null,
      contactId,
      lastMessageAt: now,
      lastMessageBody: lastBody,
      lastMessageDirection: 'outbound',
      unreadCount: 0,
      conversationWindowExpiresAt: windowExpires,
      createdAt: now,
    });
  } else {
    await conversationRef.update({
      lastMessageAt: now,
      lastMessageBody: lastBody,
      lastMessageDirection: 'outbound',
      conversationWindowExpiresAt: windowExpires,
      ...(contactName ? { contactName } : {}),
      contactId,
    });
  }

  await conversationRef.collection(COLLECTIONS.wabaMessages).add({
    direction: 'outbound',
    type: 'template',
    templateName,
    body: lastBody,
    wabaMessageId: sendResult.wabaMessageId,
    status: 'sent',
    sentBy: auth.uid,
    timestamp: now,
  });

  await contactSnap.ref.update({
    lastWhatsAppSentAt: FieldValue.serverTimestamp(),
    lastWhatsAppTemplate: templateName,
    wabaConversationId: conversationId,
  });

  return NextResponse.json({
    ok: true,
    wabaMessageId: sendResult.wabaMessageId,
    conversationId,
  });
}
