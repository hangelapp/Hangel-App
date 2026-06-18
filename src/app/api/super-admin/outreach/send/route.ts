/**
 * POST /api/super-admin/outreach/send
 *
 * Outreach hub'da seçilen kontaklara toplu email/SMS gönderir.
 *
 * Body:
 *   {
 *     source: 'registryVakiflar' | 'registryDernekler' | 'outreachContacts',
 *     channel: 'email' | 'sms',
 *     ids: string[],
 *     subject?: string,      // email only
 *     body: string,
 *     fromEmail?: string,    // email only
 *     fromName?: string,     // email only
 *     senderId?: string,     // sms only
 *   }
 *
 * Audit log:
 *   /outreachSends/{autoId} = {
 *     adminUid, source, channel, ids, subject?, body, sent, failed, skipped,
 *     errors: [string], createdAt, completedAt
 *   }
 *
 * Sınırlar:
 *   - Tek istekte 500 kontak max (gerekirse partition'la).
 *   - Mock provider varsa "mock" mode'da hata atmaz, sadece simüle eder.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getSmsProvider } from '@/lib/messaging/providers/sms';
import { buildEmailSignatureHtml, HANGEL_EMAIL_SIGNATURE } from '@/lib/mail/email-signature';
import { enqueueCampaign } from '@/lib/messaging/queue/enqueue';
import { isMailConfigured } from '@/lib/mail/credential-crypto';
import type { CampaignStats, CampaignStatus } from '@/lib/messaging/types';

const MAX_PER_REQUEST = 500;
// hangel platform Workspace mail hesabı (mailAccounts/__platform) — toplu outreach
// e-postaları, doğrudan Resend yerine bu hesabın SMTP'sinden dakikada 1 gönderilir.
const PLATFORM_MAIL_ID = '__platform';
const RECIPIENTS_BATCH = 450;

interface OutreachContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

async function isSuperAdmin(req: NextRequest): Promise<{ ok: boolean; uid?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { ok: true, uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const isSuper = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok: !!isSuper, uid: isSuper ? decoded.uid : undefined };
  } catch {
    return { ok: false };
  }
}

async function loadContacts(source: string, ids: string[]): Promise<OutreachContact[]> {
  const db = getAdminFirestore();
  const out: OutreachContact[] = [];
  // Firestore in() limit = 30, chunk işle
  const chunkSize = 30;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const snap = await db.collection(source).where('__name__', 'in', chunk).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (source === 'registryVakiflar') {
        out.push({
          id: doc.id,
          name: data.name || '',
          email: data.ePosta,
          phone: data.telefon1 || data.telefon2,
        });
      } else if (source === 'registryDernekler') {
        // Dernek kütüğünde e-posta `ePosta` alanında (vakıflarla aynı şema). Önceden
        // hiç map'lenmiyordu → e-postası OLAN dernekler bile "kanal bilgisi yok" diye
        // atlanıyordu. (Çoğu dernekte ePosta yoktur; olanlar artık gönderilir.)
        out.push({
          id: doc.id,
          name: data.name || '',
          email: data.ePosta,
          phone: data.telefon1 || data.telefon2,
        });
      } else {
        out.push({
          id: doc.id,
          name: data.name || '',
          email: data.email,
          phone: data.phone,
        });
      }
    }
  }
  return out;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function plainToHtml(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br>');
}

export async function POST(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: {
    source?: string;
    channel?: 'email' | 'sms';
    ids?: string[];
    subject?: string;
    body?: string;
    fromEmail?: string;
    fromName?: string;
    senderId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }

  const { source, channel, ids } = body;
  if (!source || !['registryVakiflar', 'registryDernekler', 'outreachContacts'].includes(source)) {
    return NextResponse.json({ errorCode: 'BAD_SOURCE', message: 'source geçersiz' }, { status: 400 });
  }
  if (!channel || !['email', 'sms', 'whatsapp'].includes(channel)) {
    return NextResponse.json({ errorCode: 'BAD_CHANNEL', message: 'channel geçersiz' }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ errorCode: 'NO_IDS', message: 'En az 1 kontak gerekli' }, { status: 400 });
  }
  if (ids.length > MAX_PER_REQUEST) {
    return NextResponse.json({ errorCode: 'TOO_MANY', message: `Tek istekte max ${MAX_PER_REQUEST} kontak` }, { status: 400 });
  }
  if (!body.body || body.body.trim().length < 5) {
    return NextResponse.json({ errorCode: 'BAD_BODY', message: 'Mesaj çok kısa' }, { status: 400 });
  }
  if (channel === 'email' && !body.subject?.trim()) {
    return NextResponse.json({ errorCode: 'NO_SUBJECT', message: 'Email için konu gerekli' }, { status: 400 });
  }

  // Email dalı Workspace kuyruğuna gittiğinden, platform mail hesabının bağlı
  // olduğunu (mailAccounts/__platform + secret) önden doğrula — yoksa job'lar
  // sessizce başarısız olur. SMS/WhatsApp bu kontrolden etkilenmez.
  if (channel === 'email' && !isMailConfigured()) {
    return NextResponse.json(
      { errorCode: 'MAIL_NOT_CONFIGURED', message: 'Workspace mail özelliği şu anda kullanılamıyor.' },
      { status: 503 },
    );
  }

  const db = getAdminFirestore();
  const auditRef = db.collection('outreachSends').doc();
  await auditRef.set({
    adminUid: auth.uid,
    source,
    channel,
    ids,
    subject: body.subject || null,
    body: body.body,
    fromEmail: body.fromEmail || null,
    fromName: body.fromName || null,
    senderId: body.senderId || null,
    status: 'sending',
    createdAt: FieldValue.serverTimestamp(),
  });

  const contacts = await loadContacts(source, ids);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  // NOT: KVKK "ÇIKAR/listeden çık" footer'ı artık email dalında BURADA eklenmez —
  // Workspace kuyruğunda worker dispatch'i ekler (appendGenericOptOutFooter), çift
  // eklemeyi önlemek için. SMS/WhatsApp footer'ı kendi dallarında.

  if (channel === 'email') {
    // DOĞRUDAN Resend YOK. Workspace Toplu Mail ile aynı yol: bir campaign doc'u
    // (ngoId=__platform, mailWorkspace, perMinute=1) + recipients yaz, enqueue et.
    // Worker __platform SMTP'sinden dakikada 1 gönderir, KVKK "ÇIKAR" footer'ını
    // dispatch sırasında ekler (appendGenericOptOutFooter).
    //
    // Değişken interpolasyonu worker'da yapılır ama worker'ın render()'ı TEK süslü
    // parantez token'ı kullanır ({ad}, {name}). UI'da kullanıcı {{name}} yazıyor →
    // worker'a gitmeden ÇİFT parantezi TEKE indir, ve hem {name} hem {ad}/{tam_ad}
    // (resolver şeması) vars olarak ver. (SMS/WhatsApp dalları kendi {{name}}
    // interpolate()'ini kullanmaya devam eder; orası DEĞİŞMEDİ.)
    const normalizeTokens = (s: string): string => s.replace(/\{\{(\w+)\}\}/g, '{$1}');

    const from = body.fromEmail || process.env.RESEND_FROM_EMAIL || 'merhaba@hangel.org';
    const fromName = body.fromName || process.env.RESEND_FROM_NAME || 'hangel';

    // hangel kurumsal imzası gövdeye GÖVDE içine eklenir (worker bu yolda imza
    // EKLEMEZ; yalnız KVKK opt-out footer'ı ekler → footer çift eklenmez).
    const sigHtml = buildEmailSignatureHtml(HANGEL_EMAIL_SIGNATURE);
    // Gövde HAM tutulur (interpolasyon worker'da); plain text → HTML + imza.
    const htmlBody = plainToHtml(normalizeTokens(body.body)) + sigHtml;
    const subjectTpl = normalizeTokens((body.subject || '').trim());

    // E-postası OLAN contact'lardan alıcı listesi kur; olmayan = skipped.
    const recipients: { userId: string | null; channelAddress: string; vars: Record<string, string> }[] = [];
    const seen = new Set<string>();
    for (const c of contacts) {
      const email = (c.email || '').trim().toLowerCase();
      if (!email) {
        skipped++;
        continue;
      }
      if (seen.has(email)) continue;
      seen.add(email);
      const firstName = (c.name || '').split(' ')[0] ?? '';
      recipients.push({
        userId: c.id || null,
        channelAddress: email,
        // {name} (UI) + {ad}/{tam_ad} (resolver şeması) — render() hangisi varsa çözer.
        vars: { name: c.name || '', ad: firstName, tam_ad: c.name || '' },
      });
    }

    if (recipients.length === 0) {
      await auditRef.update({
        status: 'completed',
        sent: 0,
        failed: 0,
        skipped,
        errors: [],
        completedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, mode: 'queued', queued: 0, skipped, campaignId: null });
    }

    const initialStats: CampaignStats = { queued: 0, sent: 0, delivered: 0, failed: 0, bounced: 0 };
    const campRef = db.collection(COLLECTIONS.campaigns).doc();
    await campRef.set({
      name: subjectTpl || 'Outreach',
      channel: 'email',
      useCase: 'marketing',
      ngoId: PLATFORM_MAIL_ID,
      templateId: null,
      subject: subjectTpl,
      body: htmlBody,
      senderId: from,
      fromEmail: from,
      fromName: fromName || null,
      replyTo: from,
      whatsapp: null,
      mailWorkspace: true,
      rateConfig: { perSecond: 1, perMinute: 1 },
      platformOutreach: true,
      schedule: { mode: 'now', scheduledAt: null, timezone: 'Europe/Istanbul' },
      status: 'draft' as CampaignStatus,
      stats: initialStats,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: auth.uid,
      createdByEmail: null,
    });

    const recipientsRef = campRef.collection(COLLECTIONS.recipients);
    for (let i = 0; i < recipients.length; i += RECIPIENTS_BATCH) {
      const slice = recipients.slice(i, i + RECIPIENTS_BATCH);
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
      const enq = await enqueueCampaign(campRef.id);
      await auditRef.update({
        status: 'completed',
        mode: 'queued',
        campaignId: campRef.id,
        queued: enq.queued,
        skipped,
        completedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({
        ok: true,
        mode: 'queued',
        queued: enq.queued,
        skipped,
        campaignId: campRef.id,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await campRef.update({ status: 'failed' as CampaignStatus, lastError: message });
      await auditRef.update({ status: 'failed', error: message, completedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 });
    }
  } else if (channel === 'sms') {
    const provider = getSmsProvider();
    const senderId = (body.senderId || 'HANGEL').slice(0, 11);
    for (const c of contacts) {
      if (!c.phone) {
        skipped++;
        continue;
      }
      const personalizedBody = interpolate(body.body, { name: c.name });
      try {
        await provider.send({
          to: c.phone,
          body: personalizedBody,
          senderId,
          useCase: 'marketing',
        });
        sent++;
      } catch (e) {
        failed++;
        errors.push(`${c.name} <${c.phone}>: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
      }
    }
  } else {
    // WhatsApp — soğuk numaralara serbest metin GÖNDERİLEMEZ; Meta politikası gereği
    // onaylı bir pazarlama (marketing) şablonu şart. Şablon adı WHATSAPP_OUTREACH_TEMPLATE_NAME
    // env ile gelir (Meta Business Manager'da oluşturulup onaylanınca). Yapılandırılmadıysa
    // hepsini atla + net mesaj ver (sessiz başarısızlık yok).
    const tplName = process.env.WHATSAPP_OUTREACH_TEMPLATE_NAME;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const tplLang = process.env.WHATSAPP_OUTREACH_TEMPLATE_LANG || 'tr';
    if (!tplName || !token || !phoneNumberId) {
      skipped = contacts.length;
      errors.push('WhatsApp toplu gönderim için Meta-onaylı pazarlama şablonu gerekli (WHATSAPP_OUTREACH_TEMPLATE_NAME yapılandırılmadı).');
    } else {
      const apiVer = process.env.WHATSAPP_API_VERSION || 'v21.0';
      for (const c of contacts) {
        if (!c.phone) {
          skipped++;
          continue;
        }
        const personalizedBody = interpolate(body.body, { name: c.name }).slice(0, 1024);
        try {
          const res = await fetch(`https://graph.facebook.com/${apiVer}/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: c.phone.replace(/[^0-9]/g, ''),
              type: 'template',
              template: {
                name: tplName,
                language: { code: tplLang },
                components: [{ type: 'body', parameters: [{ type: 'text', text: personalizedBody }] }],
              },
            }),
          });
          if (!res.ok) {
            throw new Error((await res.text().catch(() => '')).slice(0, 120));
          }
          sent++;
        } catch (e) {
          failed++;
          errors.push(`${c.name} <${c.phone}>: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
        }
      }
    }
  }

  await auditRef.update({
    status: 'completed',
    sent,
    failed,
    skipped,
    errors: errors.slice(0, 20),
    completedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    sent,
    failed,
    skipped,
    errors: errors.slice(0, 10),
    auditId: auditRef.id,
  });
}
