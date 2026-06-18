/**
 * GET /api/ngo-admin/mail/connection — STK Workspace Toplu Mail bağlantı durumu.
 *
 * UI durum göstergesi: şifreleme anahtarı yapılandırıldı mı (configured),
 * süper-admin gate açık mı (gateOpen), STK'nın SMTP hesabı bağlı mı (connected),
 * hangi gönderen adres (fromEmail).
 * Yetki: requireNgoAdmin scope 'messaging'. smtpPasswordEnc / secret ASLA dönmez.
 *
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { isMailConfigured } from '@/lib/mail/credential-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'messaging' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const configured = isMailConfigured();

  const db = getAdminFirestore();

  // Workspace toplu mail TÜM STK'lara varsayılan AÇIK (2026-06-18). Süper-admin
  // bir STK'yı açıkça kapatmak isterse featureFlags.bulkMailEnabled = false yazar.
  const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(actor.ngoId).get().catch(() => null);
  const ngoData = ngoSnap?.exists ? (ngoSnap.data() as Record<string, unknown> | undefined) : undefined;
  const featureFlags = (ngoData?.featureFlags ?? undefined) as { bulkMailEnabled?: unknown } | undefined;
  const gateOpen = featureFlags?.bulkMailEnabled !== false;

  // Bağlı SMTP hesabı: mailAccounts/{ngoId}
  const mailSnap = await db.collection(COLLECTIONS.mailAccounts).doc(actor.ngoId).get().catch(() => null);
  const mailData = mailSnap?.exists ? (mailSnap.data() as { fromEmail?: unknown; signature?: unknown } | undefined) : undefined;
  const fromEmail = typeof mailData?.fromEmail === 'string' ? mailData.fromEmail : undefined;
  const connected = !!fromEmail;
  const signature = typeof mailData?.signature === 'string' ? mailData.signature : undefined;

  return NextResponse.json({ configured, gateOpen, connected, fromEmail, signature });
}

/** POST — mail imzasını kaydet (İmzanı Düzenle). */
export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'messaging' });
  if ('error' in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as { signature?: unknown } | null;
  const signature = typeof body?.signature === 'string' ? body.signature.slice(0, 2000) : '';
  await getAdminFirestore().collection(COLLECTIONS.mailAccounts).doc(auth.actor.ngoId).set({ signature }, { merge: true });
  return NextResponse.json({ ok: true });
}
