/**
 * GET /api/ngo-admin/ads/connection — STK Google Ads bağlantı durumu.
 *
 * UI durum göstergesi: config var mı, STK'nın hesabı bağlı mı, hangi customerId.
 * Yetki: requireNgoAdmin scope 'ads'. refreshToken / secret asla dönmez.
 *
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { isAdsConfigured, getGoogleAdsConfig, refreshAccessToken } from '@/lib/ads/google-ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const configured = isAdsConfigured();

  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTIONS.adAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);

  const data = snap?.exists
    ? (snap.data() as { customerId?: unknown; refreshToken?: unknown } | undefined)
    : undefined;
  const connected = !!data;
  const customerId = typeof data?.customerId === 'string' ? data.customerId : undefined;

  // TOKEN SAĞLIĞI: "bağlı" görünüp yayında patlamayı önlemek için stored refresh
  // token'ı gerçekten dene. Ölü/expired (OAuth consent screen "Testing" modunda
  // refresh token 7 günde expire olur; ya da iptal) ise needsReconnect=true →
  // UI sessizce "bağlı" demek yerine "yeniden bağlan" gösterir.
  let needsReconnect = false;
  const refreshToken = typeof data?.refreshToken === 'string' ? data.refreshToken : '';
  if (configured && connected && refreshToken) {
    const config = getGoogleAdsConfig();
    if (config) {
      const accessToken = await refreshAccessToken(config, refreshToken);
      needsReconnect = !accessToken;
    }
  }

  return NextResponse.json({ configured, connected, customerId, needsReconnect });
}
