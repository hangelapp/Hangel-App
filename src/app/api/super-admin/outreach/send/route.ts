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
import { getEmailProvider } from '@/lib/messaging/providers/email';
import { getSmsProvider } from '@/lib/messaging/providers/sms';

const MAX_PER_REQUEST = 500;

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
        out.push({
          id: doc.id,
          name: data.name || '',
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
  if (!channel || !['email', 'sms'].includes(channel)) {
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

  // KVKK uyumu — TÜM toplu outreach maillerine otomatik unsubscribe footer eklenir.
  // Bu footer kullanıcı body'sinde olsun olmasın HER zaman eklenir; yinelenmesi sorun değil.
  function addUnsubscribeFooter(html: string, text: string, replyTo: string): { html: string; text: string } {
    const htmlFooter = `<hr style="margin:24px 0 12px;border:none;border-top:1px solid #e5e5e5"><p style="font-size:11px;color:#666;font-family:system-ui,sans-serif;line-height:1.5">Bu e-postayı, hangel.org tanıtım iletişimi kapsamında aldınız. <strong>İletişim listesinden çıkmak için</strong> bu maile "ÇIKAR" yazarak yanıtlayın (Reply-To: <a href="mailto:${replyTo}" style="color:#666">${replyTo}</a>). Kaydınız 7 iş günü içinde kapatılır. — KVKK Ticari Elektronik İleti Yönetmeliği uyarınca.</p>`;
    const textFooter = `\n\n---\nBu e-postayı, hangel.org tanıtım iletişimi kapsamında aldınız.\nİletişim listesinden çıkmak için bu maile "ÇIKAR" yazarak yanıtlayın (${replyTo}).\nKaydınız 7 iş günü içinde kapatılır. — KVKK Ticari Elektronik İleti Yönetmeliği uyarınca.`;
    return { html: html + htmlFooter, text: text + textFooter };
  }

  if (channel === 'email') {
    const provider = getEmailProvider();
    const from = body.fromEmail || process.env.RESEND_FROM_EMAIL || 'merhaba@hangel.org';
    const fromName = body.fromName || process.env.RESEND_FROM_NAME || 'hangel';
    for (const c of contacts) {
      if (!c.email) {
        skipped++;
        continue;
      }
      const personalizedSubject = interpolate(body.subject || '', { name: c.name });
      const personalizedBody = interpolate(body.body, { name: c.name });
      const withFooter = addUnsubscribeFooter(plainToHtml(personalizedBody), personalizedBody, from);
      try {
        await provider.send({
          to: c.email,
          subject: personalizedSubject,
          html: withFooter.html,
          text: withFooter.text,
          fromEmail: from,
          fromName,
          replyTo: from,  // Yanıt aynı adrese — "ÇIKAR" yanıtlarını okumak için
          useCase: 'marketing',
        });
        sent++;
      } catch (e) {
        failed++;
        errors.push(`${c.name} <${c.email}>: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`);
      }
    }
  } else {
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
