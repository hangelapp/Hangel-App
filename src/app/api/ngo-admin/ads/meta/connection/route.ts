/**
 * GET /api/ngo-admin/ads/meta/connection — STK Meta reklam bağlantı durumu.
 *
 * UI durum göstergesi: config var mı, STK'nın hesabı bağlı mı, hangi adAccountId.
 * Yetki: requireNgoAdmin scope 'ads'. accessToken / secret asla dönmez.
 *
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { isMetaConfigured } from '@/lib/ads/meta-ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const configured = isMetaConfigured();

  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTIONS.metaAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);

  const data = snap?.exists ? (snap.data() as { adAccountId?: unknown } | undefined) : undefined;
  const connected = !!data;
  const adAccountId = typeof data?.adAccountId === 'string' ? data.adAccountId : undefined;

  return NextResponse.json({ configured, connected, adAccountId });
}
