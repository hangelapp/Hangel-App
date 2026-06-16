/**
 * POST /api/super-admin/ngo-ads/agency/campaign-status — kampanya durum değiştir.
 *
 * hangel ekibi ajans panelinden bir alt-hesap kampanyasını duraklatır /
 * etkinleştirir / kaldırır. İşlem MCC (config.loginCustomerId) bağlamında yapılır.
 *
 * Auth: super-admin (performance/route.ts deseni). adAgency/{mcc} refreshToken
 * yoksa 409 NOT_CONNECTED. refreshToken asla dönmez/loglanmaz; raw Google hatası
 * client'a sızdırılmaz. Hata: { errorCode, message }.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { getGoogleAdsConfig, updateCampaignStatus } from '@/lib/ads/google-ads';

export const runtime = 'nodejs';

const MCC_DOC_ID = 'mcc';

const VALID_STATUSES = ['ENABLED', 'PAUSED', 'REMOVED'] as const;
type CampaignStatus = (typeof VALID_STATUSES)[number];

function isCampaignStatus(value: unknown): value is CampaignStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value);
}

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return (
      d?.role === 'super-admin' ||
      (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    customerId?: unknown;
    campaignResourceName?: unknown;
    status?: unknown;
  } | null;

  const customerId = typeof body?.customerId === 'string' ? body.customerId : '';
  const campaignResourceName =
    typeof body?.campaignResourceName === 'string' ? body.campaignResourceName : '';
  const status = body?.status;

  if (!customerId || !campaignResourceName) {
    return NextResponse.json(
      { errorCode: 'MISSING_FIELDS', message: 'customerId ve campaignResourceName zorunlu.' },
      { status: 400 }
    );
  }
  if (!isCampaignStatus(status)) {
    return NextResponse.json(
      { errorCode: 'INVALID_STATUS', message: 'Geçersiz durum.' },
      { status: 400 }
    );
  }

  const config = getGoogleAdsConfig();
  if (!config) {
    return NextResponse.json(
      { errorCode: 'ADS_NOT_CONFIGURED', message: 'Google Ads bağlantısı henüz yapılandırılmadı.' },
      { status: 503 }
    );
  }

  const agencySnap = await getAdminFirestore()
    .collection(COLLECTIONS.adAgency)
    .doc(MCC_DOC_ID)
    .get()
    .catch(() => null);
  const mccRefreshToken =
    typeof agencySnap?.data()?.refreshToken === 'string'
      ? (agencySnap!.data()!.refreshToken as string)
      : '';
  if (!mccRefreshToken) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Ajans (MCC) hesabı bağlı değil.' },
      { status: 409 }
    );
  }

  try {
    await updateCampaignStatus(
      config,
      mccRefreshToken,
      customerId,
      config.loginCustomerId,
      campaignResourceName,
      status
    );
    return NextResponse.json({ ok: true, status });
  } catch (raw) {
    // Raw Google hatasını client'a SIZDIRMA — sadece sunucu loguna teşhis.
    console.error('[agency/campaign-status] failed', { customerId, status, raw });
    return NextResponse.json(
      { errorCode: 'STATUS_FAILED', message: 'Durum güncellenemedi.' },
      { status: 502 }
    );
  }
}
