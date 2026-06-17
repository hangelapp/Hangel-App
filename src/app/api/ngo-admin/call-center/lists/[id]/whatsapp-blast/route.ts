/**
 * POST /api/ngo-admin/call-center/lists/[id]/whatsapp-blast
 *
 * Bir santralContactLists içindeki tüm aktif kişilere şablon WhatsApp gönder.
 *  1. authorize() → ngo-admin / super-admin + managedNgoId
 *  2. Liste fetch + ngoId match + status != 'archived'
 *  3. Template fetch + ngoId match + status 'approved'
 *  4. WABA numarası fetch + ngoId match + active
 *  5. Liste'deki santralContacts → batch sendTemplate
 *  6. Her başarılı için wabaConversations upsert + message insert + santralContacts güncelle
 *
 * Body: { templateId: string, wabaPhoneNumberId: string, variables?: Record<string,string> }
 * Variables liste-bazlı sabit değerlerdir; kişi-bazlı dinamik değişken (örn. ad)
 * Faz 2 işidir, şu an boş bırakılınca empty string gönderilir.
 *
 * Yanıt: { sent, failed, errors: [{ contactId, errorCode, message }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';
import { MetaCloudError, type TemplateComponent } from '@/lib/whatsapp/meta-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const WINDOW_HOURS = 24;
const BATCH_SIZE = 400;
const MAX_RECIPIENTS = 2000;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface PostBody {
  templateId?: unknown;
  wabaPhoneNumberId?: unknown;
  variables?: unknown;
}

interface BlastError {
  contactId: string;
  errorCode: string;
  message: string;
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
  const { id: listId } = await ctx.params;
  if (!listId) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'Liste id zorunlu.' },
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
  if (typeof body.wabaPhoneNumberId !== 'string' || !body.wabaPhoneNumberId.trim()) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'wabaPhoneNumberId zorunlu.' },
      { status: 400 },
    );
  }
  const templateId = body.templateId.trim();
  const wabaPhoneDocId = body.wabaPhoneNumberId.trim();

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

  const listSnap = await db.collection(COLLECTIONS.santralContactLists).doc(listId).get();
  if (!listSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_FOUND', message: 'Liste bulunamadı.' },
      { status: 404 },
    );
  }
  const listData = listSnap.data() as Record<string, unknown>;
  if (listData.ngoId !== auth.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu listeye erişim yetkiniz yok.' },
      { status: 403 },
    );
  }
  if (listData.status === 'archived') {
    return NextResponse.json(
      { errorCode: 'LIST_ARCHIVED', message: 'Arşivlenmiş listeye gönderim yapılamaz.' },
      { status: 400 },
    );
  }

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
  const templateVariableNames = Array.isArray(templateData.variables)
    ? (templateData.variables as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  if (!templateName) {
    return NextResponse.json(
      { errorCode: 'TEMPLATE_INVALID', message: 'Şablon eksik alanlar içeriyor.' },
      { status: 500 },
    );
  }

  const phoneSnap = await db.collection(COLLECTIONS.wabaPhoneNumbers).doc(wabaPhoneDocId).get();
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

  const accessToken = process.env.WHATSAPP_DEFAULT_TOKEN ?? process.env.META_WA_ACCESS_TOKEN ?? '';
  if (!accessToken) {
    return NextResponse.json(
      { errorCode: 'WABA_TOKEN_MISSING', message: 'WhatsApp access token yapılandırılmamış.' },
      { status: 500 },
    );
  }

  const provider = getWhatsAppProvider({
    accessToken,
    phoneNumberId: metaPhoneNumberId,
    wabaId: wabaAccountId || undefined,
  });

  const components = buildBodyComponents(templateVariableNames, variables);

  // Liste üyelerini sayfalı oku — büyük listelerde memory koruması.
  let sent = 0;
  let failed = 0;
  const errors: BlastError[] = [];
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let totalProcessed = 0;

  for (;;) {
    if (totalProcessed >= MAX_RECIPIENTS) break;

    let q = db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', auth.ngoId)
      .where('listIds', 'array-contains', listId)
      .orderBy('__name__')
      .limit(BATCH_SIZE);
    if (cursor) q = q.startAfter(cursor);

    const pageSnap = await q.get();
    if (pageSnap.empty) break;

    for (const doc of pageSnap.docs) {
      if (totalProcessed >= MAX_RECIPIENTS) break;
      totalProcessed += 1;

      const c = doc.data() as Record<string, unknown>;
      const contactPhone = typeof c.phone === 'string' ? c.phone : '';
      const contactName = typeof c.name === 'string' ? c.name : '';

      if (!contactPhone) {
        failed += 1;
        errors.push({ contactId: doc.id, errorCode: 'NO_PHONE', message: 'Telefon yok.' });
        continue;
      }

      let result: { wabaMessageId: string; contactWaId: string };
      try {
        result = await provider.sendTemplate({
          to: contactPhone,
          templateName,
          languageCode: templateLanguage,
          components,
        });
      } catch (err) {
        failed += 1;
        if (err instanceof MetaCloudError) {
          errors.push({
            contactId: doc.id,
            errorCode: `META_${err.category.toUpperCase()}`,
            message: err.message,
          });
        } else {
          errors.push({
            contactId: doc.id,
            errorCode: 'SEND_FAILED',
            message: err instanceof Error ? err.message : 'Gönderim başarısız.',
          });
        }
        continue;
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
          contactId: doc.id,
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
          contactId: doc.id,
        });
      }

      await conversationRef.collection(COLLECTIONS.wabaMessages).add({
        direction: 'outbound',
        type: 'template',
        templateName,
        body: lastBody,
        wabaMessageId: result.wabaMessageId,
        status: 'sent',
        sentBy: auth.uid,
        timestamp: now,
      });

      await doc.ref.update({
        lastWhatsAppSentAt: FieldValue.serverTimestamp(),
        lastWhatsAppTemplate: templateName,
        wabaConversationId: conversationId,
      });

      sent += 1;
    }

    if (pageSnap.size < BATCH_SIZE) break;
    cursor = pageSnap.docs[pageSnap.docs.length - 1];
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    totalProcessed,
    truncated: totalProcessed >= MAX_RECIPIENTS,
    errors,
  });
}
