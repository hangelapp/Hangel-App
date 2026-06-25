/**
 * POST /api/super-admin/messaging/campaigns/{id}/send-draft
 *
 * Bir TASLAK kampanyanın 'pending' alıcılarına, süper-admin panelinden manuel
 * tetiklenince, GÜVENLİ + KADEMELİ (domain ısıtma) e-posta gönderir.
 *
 * Neden kademeli: yeni / ısınmamış gönderim domain'inde tek seferde çok mail
 * atmak deliverability'yi (spam reputation) bozar. Bu uç, istek BAŞINA en çok
 * 50 alıcı işler ve gönderimler arasında ~1200ms bekler. Panel bu ucu, kampanya
 * bitene kadar tekrar tekrar çağırır.
 *
 * Auth: SADECE super-admin (deseni outreach/send route'undan birebir alır).
 *
 * Akış (her alıcı):
 *   1) recipient'ı transaction ile pending→sending yap (idempotency: çift-tıkta
 *      aynı alıcıyı 2 kez göndermeyiz; pending olmayanı atlarız).
 *   2) Resend'e gönder.
 *   3) başarı → recipient.status='sent' + providerMessageId + sentAt + attempts++,
 *      ve messageJobs'a doc EKLE (webhook'un İletildi/Okundu yazabilmesi ŞART).
 *      başarısız → recipient.status='failed' + lastError (kısa).
 *
 * Dönüş: { sent, failed, remaining }.
 * Hata formatı: { errorCode, message } — ham hata / secret SIZDIRILMAZ.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CampaignStatus } from '@/lib/messaging/types';

export const runtime = 'nodejs';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
// Domain ısıtma: tek istekte ASLA hepsini gönderme. İstek başına en çok bu kadar.
const MAX_PER_REQUEST = 25;
// Gönderimler arası throttle (ms) — domain güvenliği / rate-limit koruması.
const THROTTLE_MS = 1000;

interface CampaignDoc {
  subject?: string;
  bodyTemplate?: string;
  body?: string;
  status?: CampaignStatus;
}

interface RecipientDoc {
  status?: string;
  channelAddress?: string;
  vakifName?: string;
}

async function authorizeSuperAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const isSuper = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return isSuper ? { uid: decoded.uid } : null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** {{ad}} -> vakifName ile değiştir (yalnızca bu token desteklenir). */
function renderBody(template: string, vakifName: string): string {
  return template.replace(/\{\{\s*ad\s*\}\}/g, vakifName);
}

interface ResendOk { ok: true; id: string }
interface ResendErr { ok: false; message: string }

async function sendViaResend(args: {
  apiKey: string;
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  text: string;
}): Promise<ResendOk | ResendErr> {
  let res: Response;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        from: args.from,
        to: [args.to],
        reply_to: args.replyTo,
        subject: args.subject,
        text: args.text,
      }),
    });
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message.slice(0, 200) : 'network error' };
  }

  let json: { id?: string; message?: string; name?: string };
  try {
    json = (await res.json()) as { id?: string; message?: string; name?: string };
  } catch {
    return { ok: false, message: `Resend geçersiz yanıt: HTTP ${res.status}` };
  }

  if (res.ok && json.id) {
    return { ok: true, id: json.id };
  }
  return { ok: false, message: (json.message ?? json.name ?? `Resend HTTP ${res.status}`).slice(0, 200) };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const auth = await authorizeSuperAdmin(req as unknown as NextRequest);
  if (!auth) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Geçersiz kampanya id.' }, { status: 400 });
  }

  // Provider konfigürasyonu önden doğrula — yoksa sessizce başarısız olmasın.
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const fromName = process.env.RESEND_FROM_NAME;
  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      { errorCode: 'MAIL_NOT_CONFIGURED', message: 'E-posta gönderimi şu anda yapılandırılmamış.' },
      { status: 503 },
    );
  }
  const from = `${fromName ?? 'hangel'} <${fromEmail}>`;
  const replyTo = fromEmail;

  const db = getAdminFirestore();
  const campRef = db.collection(COLLECTIONS.campaigns).doc(id);

  let campSnap;
  try {
    campSnap = await campRef.get();
  } catch {
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Kampanya okunamadı.' }, { status: 500 });
  }
  if (!campSnap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kampanya bulunamadı.' }, { status: 404 });
  }
  const campaign = (campSnap.data() ?? {}) as CampaignDoc;

  const subject = (campaign.subject ?? '').trim();
  const bodyTemplateRaw = campaign.bodyTemplate ?? campaign.body ?? '';
  if (!subject || !bodyTemplateRaw) {
    return NextResponse.json(
      { errorCode: 'CAMPAIGN_INCOMPLETE', message: 'Kampanyanın konusu ve gövdesi olmalı.' },
      { status: 400 },
    );
  }

  const recipientsCol = campRef.collection(COLLECTIONS.recipients);

  // İsteğe bağlı { count }: otomatik drip her çağrıda 1 gönderir. Üst sınır MAX_PER_REQUEST.
  let perCall = MAX_PER_REQUEST;
  try {
    const reqBody = (await req.json()) as { count?: number };
    if (typeof reqBody?.count === 'number' && reqBody.count >= 1) {
      perCall = Math.min(Math.floor(reqBody.count), MAX_PER_REQUEST);
    }
  } catch {
    /* gövde yok/parse edilemedi → varsayılan MAX_PER_REQUEST */
  }

  // Bu istekte işlenecek pending alıcılar (domain ısıtma → en çok MAX_PER_REQUEST).
  let pendingSnap;
  try {
    pendingSnap = await recipientsCol.where('status', '==', 'pending').limit(perCall).get();
  } catch {
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Alıcılar okunamadı.' }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (let _i = 0; _i < pendingSnap.docs.length; _i++) {
    const recDoc = pendingSnap.docs[_i];
    const rid = recDoc.id;
    const recRef = recipientsCol.doc(rid);

    // 1) IDEMPOTENCY: transaction ile pending→sending. Aynı alıcı başka bir
    //    eşzamanlı istek/çift-tık tarafından zaten alınmışsa (pending değilse)
    //    bu alıcıyı atla — iki kez göndermeyiz.
    let claimed = false;
    try {
      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(recRef);
        const data = (fresh.data() ?? {}) as RecipientDoc;
        if (!fresh.exists || data.status !== 'pending') {
          claimed = false;
          return;
        }
        tx.update(recRef, { status: 'sending', updatedAt: FieldValue.serverTimestamp() });
        claimed = true;
      });
    } catch {
      claimed = false;
    }
    if (!claimed) continue;

    const recData = (recDoc.data() ?? {}) as RecipientDoc;
    const to = (recData.channelAddress ?? '').trim();
    const vakifName = recData.vakifName || 'Vakıf';

    // Adres yoksa Resend'e gitme — doğrudan failed işaretle.
    if (!to) {
      failed++;
      try {
        await recRef.update({
          status: 'failed',
          lastError: 'Alıcı e-posta adresi yok',
          attempts: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {
        /* yutulur — sayaç doğru, kampanya stats aşağıda toparlanır */
      }
      continue;
    }

    const text = renderBody(bodyTemplateRaw, vakifName);

    const result = await sendViaResend({ apiKey, from, replyTo, to, subject, text });

    if (result.ok) {
      sent++;
      // 3a) recipient → sent + providerMessageId + sentAt + attempts++
      try {
        await recRef.update({
          status: 'sent',
          providerMessageId: result.id,
          sentAt: FieldValue.serverTimestamp(),
          attempts: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {
        /* yutulur */
      }
      // 3b) messageJobs doc EKLE — webhook bunu providerMessageId ile bulup
      //     İletildi/Açıldı/Tıklandı event'lerini recipient'a yazabilsin diye ŞART.
      try {
        await db.collection(COLLECTIONS.messageJobs).add({
          campaignId: id,
          recipientPath: `${COLLECTIONS.campaigns}/${id}/${COLLECTIONS.recipients}/${rid}`,
          channel: 'email',
          driver: 'resend',
          to,
          providerMessageId: result.id,
          status: 'sent',
          useCase: 'outreach-davet',
          createdAt: FieldValue.serverTimestamp(),
          sentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {
        /* yutulur — mail gitti; job kaydı oluşmazsa yalnız webhook izleme eksilir */
      }
    } else {
      failed++;
      try {
        await recRef.update({
          status: 'failed',
          lastError: result.message.slice(0, 200),
          attempts: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {
        /* yutulur */
      }
    }

    // Domain güvenliği: gönderimler arasında bekle (son alıcıdan sonra atla → timeout payı).
    if (_i < pendingSnap.docs.length - 1) await sleep(THROTTLE_MS);
  }

  // Kalan pending sayısını yeniden say (bu istekte işlenmeyenler).
  let remaining: number;
  try {
    const remSnap = await recipientsCol.where('status', '==', 'pending').count().get();
    remaining = remSnap.data().count;
  } catch {
    // count() başarısızsa muhafazakar tahmin: bu turdaki batch tam dolduysa
    // muhtemelen daha var; aksi halde 0.
    remaining = pendingSnap.size >= MAX_PER_REQUEST ? MAX_PER_REQUEST : 0;
  }

  // Kampanya stats + status güncelle (kümülatif).
  const campUpdate: Record<string, unknown> = {
    'stats.sent': FieldValue.increment(sent),
    'stats.failed': FieldValue.increment(failed),
    'stats.queued': remaining,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (remaining === 0) {
    campUpdate.status = 'completed' satisfies CampaignStatus;
    campUpdate.completedAt = FieldValue.serverTimestamp();
  } else {
    campUpdate.status = 'sending' satisfies CampaignStatus;
  }
  try {
    await campRef.update(campUpdate);
  } catch {
    /* yutulur — gönderim gerçekleşti; stats yazımı best-effort */
  }

  return NextResponse.json({ sent, failed, remaining });
}
