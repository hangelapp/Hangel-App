/**
 * GET  /api/ngo-admin/whatsapp-business/templates?status=approved|pending|draft|rejected
 *   STK'nın şablonlarını döner. status query opsiyonel filtre.
 *
 * POST /api/ngo-admin/whatsapp-business/templates
 *   Body: { wabaPhoneNumberId, name, category, language, bodyText,
 *           headerText?, footerText?, buttons?, variables? }
 *   1) Validate: name regex /^[a-z][a-z0-9_]{2,511}$/
 *   2) Firestore'a status='draft' yaz
 *   3) Meta'ya createTemplate çağrısı (accessToken numara doc'undan)
 *   4) Yanıtla doc'u status='pending' + wabaTemplateId güncelle
 *
 *   Yanıt: { id, wabaTemplateId, status: 'pending' }
 *
 * Güvenlik: accessToken numara doc'undan okunur; multi-tenant izolasyon.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';
import { MetaCloudError } from '@/lib/whatsapp/meta-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NAME_REGEX = /^[a-z][a-z0-9_]{2,511}$/;
const ALLOWED_CATEGORIES = new Set(['utility', 'marketing', 'authentication']);
const ALLOWED_STATUSES = new Set(['draft', 'pending', 'approved', 'rejected', 'paused']);
const ALLOWED_BUTTON_TYPES = new Set(['quick_reply', 'url', 'phone_number']);

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface TemplateRow {
  id: string;
  wabaPhoneNumberId: string;
  name: string;
  category: string;
  language: string;
  bodyText: string;
  headerText: string | null;
  footerText: string | null;
  buttons: unknown[];
  variables: string[];
  wabaTemplateId: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string | null;
}

interface ButtonInput {
  type: string;
  text: string;
  url?: string;
  phoneNumber?: string;
  payload?: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string } | undefined;
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu kurum
    // yöneten kullanıcı için kritik; ngo/brand/club). Caller o kuruma üyeyse ya da
    // super-admin ise header'daki kurum kullanılır; yoksa managedNgoId → managedBrandId
    // → managedClubId ilk dolu olana düşer. Çözülen id ngoId alanında taşınır.
    const isSuperAdmin = d.role === 'super-admin';
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;
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

function toIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as Record<string, unknown>)) {
    const seconds = (v as { _seconds: number })._seconds;
    return new Date(seconds * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

function metaErrorStatus(category: string): number {
  if (category === 'invalid_token') return 401;
  if (category === 'permission_denied') return 403;
  if (category === 'not_found') return 404;
  if (category === 'rate_limit') return 429;
  if (category === 'template_not_approved') return 400;
  return 502;
}

/**
 * Schema → Meta component array. Meta BODY zorunlu; HEADER/FOOTER/BUTTONS opsiyonel.
 * Değişken sayısı = buttons hariç metinde {{n}} kalıplarının sayısı; Meta example
 * vermeyi tercih ediyor, biz variables'tan body_text örneği üretiyoruz.
 */
function buildMetaComponents(opts: {
  bodyText: string;
  headerText?: string;
  footerText?: string;
  buttons: ButtonInput[];
  variables: string[];
}): Array<Record<string, unknown>> {
  const components: Array<Record<string, unknown>> = [];

  if (opts.headerText) {
    components.push({ type: 'HEADER', format: 'TEXT', text: opts.headerText });
  }

  const bodyComponent: Record<string, unknown> = { type: 'BODY', text: opts.bodyText };
  if (opts.variables.length > 0) {
    bodyComponent.example = { body_text: [opts.variables] };
  }
  components.push(bodyComponent);

  if (opts.footerText) {
    components.push({ type: 'FOOTER', text: opts.footerText });
  }

  if (opts.buttons.length > 0) {
    const metaButtons = opts.buttons.map((b) => {
      if (b.type === 'url') {
        return { type: 'URL', text: b.text, url: b.url ?? '' };
      }
      if (b.type === 'phone_number') {
        return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phoneNumber ?? '' };
      }
      return { type: 'QUICK_REPLY', text: b.text };
    });
    components.push({ type: 'BUTTONS', buttons: metaButtons });
  }

  return components;
}

function normalizeButtons(input: unknown): ButtonInput[] | { error: string } {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return { error: 'buttons dizi olmalı.' };
  const out: ButtonInput[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { error: 'Geçersiz buton kaydı.' };
    const r = raw as Record<string, unknown>;
    const type = typeof r.type === 'string' ? r.type : '';
    const text = typeof r.text === 'string' ? r.text.trim() : '';
    if (!ALLOWED_BUTTON_TYPES.has(type)) return { error: `Buton tipi geçersiz: ${type || '(boş)'}` };
    if (!text) return { error: 'Buton metni zorunlu.' };
    const btn: ButtonInput = { type, text };
    if (type === 'url') {
      const url = typeof r.url === 'string' ? r.url.trim() : '';
      if (!url) return { error: 'URL butonu için url zorunlu.' };
      btn.url = url;
    }
    if (type === 'phone_number') {
      const phone = typeof r.phoneNumber === 'string' ? r.phoneNumber.trim() : '';
      if (!phone) return { error: 'Telefon butonu için phoneNumber zorunlu.' };
      btn.phoneNumber = phone;
    }
    if (type === 'quick_reply') {
      const payload = typeof r.payload === 'string' ? r.payload.trim() : '';
      if (payload) btn.payload = payload;
    }
    out.push(btn);
  }
  if (out.length > 3) return { error: 'En fazla 3 buton.' };
  return out;
}

function normalizeVariables(input: unknown): string[] | { error: string } {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return { error: 'variables dizi olmalı.' };
  const out: string[] = [];
  for (const v of input) {
    if (typeof v !== 'string' || !v.trim()) return { error: 'variables string olmalı.' };
    out.push(v.trim());
  }
  return out;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const statusFilter = req.nextUrl.searchParams.get('status');
  if (statusFilter && !ALLOWED_STATUSES.has(statusFilter)) {
    return NextResponse.json(
      { errorCode: 'BAD_STATUS', message: 'Geçersiz status filtresi.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    let q = db
      .collection(COLLECTIONS.wabaTemplates)
      .where('ngoId', '==', ctx.ngoId);
    if (statusFilter) q = q.where('status', '==', statusFilter);
    snap = await q.orderBy('createdAt', 'desc').get();
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Şablon sorgusu başarısız.' },
      { status: 500 },
    );
  }

  const templates: TemplateRow[] = snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      wabaPhoneNumberId: typeof d.wabaPhoneNumberId === 'string' ? d.wabaPhoneNumberId : '',
      name: typeof d.name === 'string' ? d.name : '',
      category: typeof d.category === 'string' ? d.category : 'utility',
      language: typeof d.language === 'string' ? d.language : 'tr',
      bodyText: typeof d.bodyText === 'string' ? d.bodyText : '',
      headerText: typeof d.headerText === 'string' ? d.headerText : null,
      footerText: typeof d.footerText === 'string' ? d.footerText : null,
      buttons: Array.isArray(d.buttons) ? d.buttons : [],
      variables: Array.isArray(d.variables) ? (d.variables as string[]) : [],
      wabaTemplateId: typeof d.wabaTemplateId === 'string' ? d.wabaTemplateId : null,
      status: typeof d.status === 'string' ? d.status : 'draft',
      rejectionReason: typeof d.rejectionReason === 'string' ? d.rejectionReason : null,
      createdAt: toIso(d.createdAt),
    };
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövde.' }, { status: 400 });
  }

  const wabaPhoneNumberId = typeof body.wabaPhoneNumberId === 'string' ? body.wabaPhoneNumberId.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim().toLowerCase() : '';
  const category = typeof body.category === 'string' ? body.category.trim().toLowerCase() : '';
  const language = typeof body.language === 'string' ? body.language.trim() : '';
  const bodyText = typeof body.bodyText === 'string' ? body.bodyText.trim() : '';
  const headerText = typeof body.headerText === 'string' ? body.headerText.trim() : '';
  const footerText = typeof body.footerText === 'string' ? body.footerText.trim() : '';

  if (!wabaPhoneNumberId) {
    return NextResponse.json({ errorCode: 'MISSING_PHONE_ID', message: 'wabaPhoneNumberId zorunlu.' }, { status: 400 });
  }
  if (!NAME_REGEX.test(name)) {
    return NextResponse.json(
      { errorCode: 'BAD_NAME', message: 'name küçük harfle başlamalı, sadece harf/rakam/alt çizgi içermeli (3-512 karakter).' },
      { status: 400 },
    );
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json(
      { errorCode: 'BAD_CATEGORY', message: 'category utility/marketing/authentication olmalı.' },
      { status: 400 },
    );
  }
  if (!language) {
    return NextResponse.json({ errorCode: 'MISSING_LANGUAGE', message: 'language zorunlu.' }, { status: 400 });
  }
  if (!bodyText) {
    return NextResponse.json({ errorCode: 'MISSING_BODY', message: 'bodyText zorunlu.' }, { status: 400 });
  }

  const buttonsRes = normalizeButtons(body.buttons);
  if (!Array.isArray(buttonsRes)) {
    return NextResponse.json({ errorCode: 'BAD_BUTTONS', message: buttonsRes.error }, { status: 400 });
  }
  const variablesRes = normalizeVariables(body.variables);
  if (!Array.isArray(variablesRes)) {
    return NextResponse.json({ errorCode: 'BAD_VARIABLES', message: variablesRes.error }, { status: 400 });
  }

  const db = getAdminFirestore();

  // Numara doc'unu yükle — tenant izolasyonu + accessToken/wabaAccountId.
  const numberRef = db.collection(COLLECTIONS.wabaPhoneNumbers).doc(wabaPhoneNumberId);
  const numberSnap = await numberRef.get();
  if (!numberSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NUMBER_NOT_FOUND', message: 'Şablon için belirtilen numara bulunamadı.' },
      { status: 404 },
    );
  }
  const numberData = numberSnap.data() as Record<string, unknown>;
  if (numberData.ngoId !== ctx.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu numara başka bir STK\'ya ait.' },
      { status: 403 },
    );
  }
  const accessToken = typeof numberData.accessToken === 'string' ? numberData.accessToken : '';
  const wabaAccountId = typeof numberData.wabaAccountId === 'string' ? numberData.wabaAccountId : '';
  const metaPhoneNumberId = typeof numberData.wabaPhoneNumberId === 'string' ? numberData.wabaPhoneNumberId : '';
  if (!accessToken || !wabaAccountId) {
    return NextResponse.json(
      { errorCode: 'NUMBER_NOT_READY', message: 'Numara Meta entegrasyonu eksik.' },
      { status: 409 },
    );
  }

  // Aynı tenant + numara + name + language tekrar oluşturulamaz.
  const dupSnap = await db
    .collection(COLLECTIONS.wabaTemplates)
    .where('ngoId', '==', ctx.ngoId)
    .where('wabaPhoneNumberId', '==', wabaPhoneNumberId)
    .where('name', '==', name)
    .where('language', '==', language)
    .limit(1)
    .get();
  if (!dupSnap.empty) {
    return NextResponse.json(
      { errorCode: 'DUPLICATE', message: 'Bu isim + dil için şablon zaten var.' },
      { status: 409 },
    );
  }

  // 1) Önce draft yaz (Meta hatası halinde audit izi kalsın).
  const ref = db.collection(COLLECTIONS.wabaTemplates).doc();
  await ref.set({
    ngoId: ctx.ngoId,
    wabaPhoneNumberId,
    wabaAccountId,
    name,
    category,
    language,
    bodyText,
    headerText: headerText || null,
    footerText: footerText || null,
    buttons: buttonsRes,
    variables: variablesRes,
    status: 'draft',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: ctx.uid,
  });

  // 2) Meta'ya gönder.
  const components = buildMetaComponents({
    bodyText,
    headerText: headerText || undefined,
    footerText: footerText || undefined,
    buttons: buttonsRes,
    variables: variablesRes,
  });
  const client = getWhatsAppProvider({ accessToken, phoneNumberId: metaPhoneNumberId, wabaId: wabaAccountId });
  let created: { id: string; status: string };
  try {
    created = await client.createTemplate({
      wabaId: wabaAccountId,
      name,
      category: category === 'utility' ? 'UTILITY' : category === 'marketing' ? 'MARKETING' : 'AUTHENTICATION',
      languageCode: language,
      components,
    });
  } catch (e) {
    // Meta reddetti — draft'ı koru, hata mesajı dön.
    if (e instanceof MetaCloudError) {
      await ref.update({
        status: 'rejected',
        rejectionReason: e.message,
        rejectedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        { errorCode: 'META_ERROR', message: e.message },
        { status: metaErrorStatus(e.category) },
      );
    }
    return NextResponse.json(
      { errorCode: 'META_ERROR', message: e instanceof Error ? e.message : 'Meta gönderimi başarısız.' },
      { status: 502 },
    );
  }

  // 3) Doc'u pending + wabaTemplateId ile güncelle.
  await ref.update({
    status: 'pending',
    wabaTemplateId: created.id,
    submittedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    id: ref.id,
    wabaTemplateId: created.id,
    status: 'pending',
  });
}
