/**
 * GET /api/ngo-admin/ads/tiktok/connection — STK TikTok reklam bağlantı durumu.
 *
 * UI durum göstergesi: config var mı, STK'nın hesabı bağlı mı, hangi advertiserId.
 * Yetki: requireNgoAdmin scope 'ads'. accessToken / secret asla dönmez.
 *
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { isTiktokConfigured } from '@/lib/ads/tiktok-ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const configured = isTiktokConfigured();

  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTIONS.tiktokAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);

  const data = snap?.exists ? (snap.data() as { advertiserId?: unknown } | undefined) : undefined;
  const connected = !!data;
  const advertiserId = typeof data?.advertiserId === 'string' ? data.advertiserId : undefined;

  return NextResponse.json({ configured, connected, advertiserId });
}
