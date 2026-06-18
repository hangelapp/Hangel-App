/**
 * POST /api/super-admin/mail/campaign — hangel platform Workspace toplu mail.
 *
 * hangel kendi Workspace SMTP'sinden (mailAccounts/__platform) outreach datasına
 * ya da yüklenen listeye toplu mail gönderir. Alıcılar inlineRecipients olarak
 * çözülür (resolver inline kaynağı; marketing consent'i geçer, unsubscribe footer
 * dispatch'te eklenir). NGO cüzdanı YOK (platform). Hız: dakikada 1 mail.
 *
 * Body: {
 *   subject, body,
 *   source: 'outreach' | 'inline',
 *   filter?: { type?: string; city?: string },   // source='outreach'
 *   inlineRecipients?: { email: string; name?: string }[],  // source='inline'
 *   dryRun?: boolean,   // sadece alıcı sayısını döndür, gönderme
 * }
 *
 * Yetki: yalnız super-admin. Hata: { errorCode, message }.
 */
import { NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { resolveRecipients } from '@/lib/messaging/resolver';
import { enqueueCampaign } from '@/lib/messaging/queue/enqueue';
import { isMailConfigured } from '@/lib/mail/credential-crypto';
import { COLLECTIONS } from '@/firebase/collections';
import type { Query } from 'firebase-admin/firestore';
import type { CampaignStats, CampaignStatus } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PLATFORM_MAIL_ID = '__platform';
const MAX_RECIPIENTS = 5000;
const BATCH = 450;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** İmzayı gövdenin altına ekle (HTML; satır sonları <br/>). */
function withSignature(body: string, signature?: string): string {
  const sig = typeof signature === 'string' ? signature.trim() : '';
  if (!sig) return body;
  return `${body}<br/><br/>—<br/>${sig.replace(/\n/g, '<br/>')}`;
}

interface OutreachFilter { type?: string; city?: string }
interface InlineRec { email: string; name?: string }
interface Body {
  subject?: string;
  body?: string;
  source?: 'outreach' | 'vakif' | 'dernek' | 'inline';
  filter?: OutreachFilter;
  inlineRecipients?: InlineRec[];
  dryRun?: boolean;
}

export async function POST(req: Request) {
  const auth = await requireNgoAdmin(req, { targetNgoId: PLATFORM_MAIL_ID, allowSuperAdmin: true });
  if ('error' in auth) return auth.error;
  if (!auth.actor.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json(
      { errorCode: 'MAIL_NOT_CONFIGURED', message: 'Workspace mail özelliği şu anda kullanılamıyor.' },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }

  const source = (body.source === 'inline' || body.source === 'vakif' || body.source === 'dernek') ? body.source : 'outreach';
  const dryRun = body.dryRun === true;

  const db = getAdminFirestore();

  // Platform Workspace hesabı bağlı mı?
  const accountSnap = await db.collection(COLLECTIONS.mailAccounts).doc(PLATFORM_MAIL_ID).get();
  if (!accountSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'hangel Workspace hesabı bağlı değil.' },
      { status: 409 },
    );
  }
  const account = (accountSnap.data() as { fromEmail?: string; fromName?: string; signature?: string } | undefined) ?? {};
  const fromEmail = typeof account.fromEmail === 'string' ? account.fromEmail : '';
  const fromName = typeof account.fromName === 'string' ? account.fromName : '';
  if (!fromEmail) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'hangel Workspace hesabı bağlı değil.' },
      { status: 409 },
    );
  }

  // Alıcıları çöz: outreach datası ya da yüklenen liste.
  const collected = new Map<string, InlineRec>();
  let capped = false;

  if (source === 'inline') {
    for (const r of body.inlineRecipients ?? []) {
      const email = (r?.email ?? '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || collected.has(email)) continue;
      collected.set(email, { email, name: r?.name });
      if (collected.size >= MAX_RECIPIENTS) { capped = true; break; }
    }
  } else if (source === 'vakif') {
    // registryVakiflar — e-posta alanı ePosta; il (şehir) kodda süzülür.
    const cityFilter = (body.filter?.city ?? '').trim().toLocaleLowerCase('tr');
    const snap = await db.collection('registryVakiflar').limit(MAX_RECIPIENTS * 4).get();
    for (const d of snap.docs) {
      const data = d.data() as { ePosta?: string; name?: string; il?: string };
      const email = (data.ePosta ?? '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || collected.has(email)) continue;
      if (cityFilter && (data.il ?? '').trim().toLocaleLowerCase('tr') !== cityFilter) continue;
      collected.set(email, { email, name: data.name });
      if (collected.size >= MAX_RECIPIENTS) { capped = true; break; }
    }
  } else if (source === 'dernek') {
    // registryDernekler — resmi kütükte e-posta neredeyse hiç yok; yalnız ePosta
    // alanı OLAN kayıtları çek (orderBy alanı olmayanları eler). Çoğu zaman boş döner.
    const cityFilter = (body.filter?.city ?? '').trim().toLocaleLowerCase('tr');
    try {
      const snap = await db.collection('registryDernekler').orderBy('ePosta').limit(MAX_RECIPIENTS).get();
      for (const d of snap.docs) {
        const data = d.data() as { ePosta?: string; name?: string; il?: string };
        const email = (data.ePosta ?? '').trim().toLowerCase();
        if (!EMAIL_RE.test(email) || collected.has(email)) continue;
        if (cityFilter && (data.il ?? '').trim().toLocaleLowerCase('tr') !== cityFilter) continue;
        collected.set(email, { email, name: data.name });
        if (collected.size >= MAX_RECIPIENTS) { capped = true; break; }
      }
    } catch { /* ePosta index/alan yoksa boş geç — hata verme */ }
  } else {
    const filter = body.filter ?? {};
    // Tek eşitlik filtresi (type) — composite index gerektirmez; status/city/email
    // kodda süzülür.
    let q: Query = db.collection(COLLECTIONS.outreachContacts);
    if (filter.type) q = q.where('type', '==', filter.type);
    const snap = await q.limit(MAX_RECIPIENTS * 4).get();
    const cityFilter = (filter.city ?? '').trim().toLocaleLowerCase('tr');
    for (const d of snap.docs) {
      const data = d.data() as { email?: string; name?: string; city?: string; status?: string };
      if (data.status && data.status !== 'active') continue;
      const email = (data.email ?? '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || collected.has(email)) continue;
      if (cityFilter && (data.city ?? '').trim().toLocaleLowerCase('tr') !== cityFilter) continue;
      collected.set(email, { email, name: data.name });
      if (collected.size >= MAX_RECIPIENTS) { capped = true; break; }
    }
  }

  const inlineRecipients = [...collected.values()];

  const resolved = await resolveRecipients({
    channel: 'email',
    useCase: 'marketing',
    inlineRecipients,
  });

  // Önizleme: sadece sayı (0 olsa bile hata DEĞİL — kaynak boş olabilir).
  if (dryRun) {
    return NextResponse.json({ count: resolved.recipients.length, capped });
  }

  if (resolved.recipients.length === 0) {
    return NextResponse.json(
      { errorCode: 'NO_RECIPIENTS', message: 'Bu kaynakta e-posta adresi olan kayıt yok.' },
      { status: 400 },
    );
  }

  if (!body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'Konu ve mesaj gerekli.' }, { status: 400 });
  }

  const initialStats: CampaignStats = { queued: 0, sent: 0, delivered: 0, failed: 0, bounced: 0 };
  const campRef = db.collection(COLLECTIONS.campaigns).doc();
  await campRef.set({
    name: body.subject.trim(),
    channel: 'email',
    useCase: 'marketing',
    ngoId: PLATFORM_MAIL_ID,
    templateId: null,
    subject: body.subject.trim(),
    body: withSignature(body.body, account.signature?.trim() || ['hangel', 'hangel.org.tr', fromEmail].filter(Boolean).join('\n')),
    senderId: fromEmail,
    fromEmail,
    fromName: fromName || null,
    whatsapp: null,
    mailWorkspace: true,
    rateConfig: { perSecond: 1, perMinute: 1 },
    platformOutreach: true,
    recipients: { totalUnique: resolved.summary.afterDedupe, afterConsentFilter: resolved.summary.afterConsent },
    schedule: { mode: 'now', scheduledAt: null, timezone: 'Europe/Istanbul' },
    status: 'draft' as CampaignStatus,
    stats: initialStats,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: auth.actor.uid,
    createdByEmail: auth.actor.email ?? null,
  });

  const recipientsRef = campRef.collection(COLLECTIONS.recipients);
  for (let i = 0; i < resolved.recipients.length; i += BATCH) {
    const slice = resolved.recipients.slice(i, i + BATCH);
    const wb = db.batch();
    for (const r of slice) {
      wb.set(recipientsRef.doc(), {
        userId: r.userId,
        channelAddress: r.channelAddress,
        vars: r.vars,
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await wb.commit();
  }

  try {
    const result = await enqueueCampaign(campRef.id);
    return NextResponse.json({ campaignId: campRef.id, status: result.status, queued: result.queued, capped });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await campRef.update({ status: 'failed' as CampaignStatus, lastError: message });
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
  }
}
