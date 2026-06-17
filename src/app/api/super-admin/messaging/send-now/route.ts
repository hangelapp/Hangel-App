/**
 * POST /api/super-admin/messaging/send-now
 *
 * Body: { recipients: string[], body: string, useCase?: 'transactional' | 'marketing' }
 *
 * SMS_DRIVER ne olursa olsun (mock/netgsm/pasifik) bu endpoint Pasifik üzerinden
 * doğrudan gönderim yapar. Hangel kurum adına; STK adına gönderim için ayrı
 * /api/messaging/* (ngo-admin) endpoint'leri kullanılır.
 *
 * - Her recipient ardışık (100ms throttle) — Pasifik rate-limit korumalı
 * - messageJobs koleksiyonuna iş kaydı yazılır ({ ngoId: 'hangel-master', ... })
 * - Yanıt: { jobId, sent, failed }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { PasifikSmsProvider } from '@/lib/messaging/providers/sms/pasifik';
import type { CanonicalErrorCode, UseCase } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEND_DELAY_MS = 100;

interface JobResultEntry {
  to: string;
  providerMessageId: string | null;
  ok: boolean;
  errorCode?: CanonicalErrorCode;
  errorMessage?: string;
}

async function authorizeSuperAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return { uid: decoded.uid };
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

export async function POST(req: NextRequest) {
  const auth = await authorizeSuperAdmin(req);
  if (!auth) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { recipients?: unknown; body?: unknown; useCase?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const recipients = Array.isArray(body.recipients)
    ? body.recipients
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];
  const text = typeof body.body === 'string' ? body.body : '';
  const useCase: UseCase =
    body.useCase === 'marketing' ? 'marketing' : 'transactional';

  if (recipients.length === 0 || !text) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'recipients ve body alanları zorunludur.' },
      { status: 400 },
    );
  }

  const username = process.env.PASIFIK_USERNAME;
  const password = process.env.PASIFIK_PASSWORD;
  const from = process.env.PASIFIK_FROM;
  if (!username || !password || !from) {
    return NextResponse.json(
      { errorCode: 'CONFIG_MISSING', message: 'PASIFIK_USERNAME / PASIFIK_PASSWORD / PASIFIK_FROM tanımlı değil.' },
      { status: 500 },
    );
  }

  const db = getAdminFirestore();
  const provider = new PasifikSmsProvider({ username, password, from });

  // İş kaydını önden oluştur — iptal/durum takibi için.
  const jobRef = db.collection(COLLECTIONS.messageJobs).doc();
  await jobRef.set({
    ngoId: 'hangel-master',
    createdBy: auth.uid,
    channel: 'sms',
    driver: provider.driver,
    useCase,
    total: recipients.length,
    sent: 0,
    failed: 0,
    status: 'sending',
    results: [],
    createdAt: FieldValue.serverTimestamp(),
  });

  const results: JobResultEntry[] = [];
  let sent = 0;
  let failed = 0;

  try {
    for (let i = 0; i < recipients.length; i += 1) {
      const to = recipients[i];
      try {
        const r = await provider.send({ to, body: text, senderId: from, useCase });
        if (r.ok) {
          sent += 1;
          results.push({ to, providerMessageId: r.providerMessageId ?? null, ok: true });
        } else {
          failed += 1;
          results.push({
            to,
            providerMessageId: r.providerMessageId ?? null,
            ok: false,
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
          });
        }
      } catch (sendErr) {
        failed += 1;
        results.push({
          to,
          providerMessageId: null,
          ok: false,
          errorCode: 'unknown',
          errorMessage: sendErr instanceof Error ? sendErr.message : 'send error',
        });
      }

      if (i < recipients.length - 1) {
        await sleep(SEND_DELAY_MS);
      }
    }

    await jobRef.update({
      sent,
      failed,
      status: 'completed',
      results,
      completedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ jobId: jobRef.id, sent, failed });
  } catch (err) {
    console.error('[super-admin/messaging/send-now] failed', err);
    try {
      await jobRef.update({
        sent,
        failed,
        status: 'failed',
        results,
        completedAt: FieldValue.serverTimestamp(),
        errorMessage: err instanceof Error ? err.message : 'unknown',
      });
    } catch (updateErr) {
      console.error('[super-admin/messaging/send-now] job update failed', updateErr);
    }
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Toplu gönderim başarısız.' }, { status: 500 });
  }
}
