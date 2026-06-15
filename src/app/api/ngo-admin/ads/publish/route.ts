/**
 * POST /api/ngo-admin/ads/publish — onaylanan reklam planını Google Ads'e yayınla.
 *
 *   body: { planId }
 *
 * Yetki: requireNgoAdmin scope 'ads'. Akış:
 *  - config yoksa 503 ADS_NOT_CONFIGURED
 *  - hesap bağlı değilse 409 NOT_CONNECTED
 *  - plan yoksa 404; plan başka STK'ya aitse 403
 *  - createSearchCampaign çağrılır → adPlans status='active' güncellenir
 *  - createSearchCampaign throw ederse 502 PUBLISH_FAILED (raw error sızdırmaz)
 *
 * refreshToken yalnız server tarafında okunur; asla loglanmaz / client'a dönmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import {
  createSearchCampaign,
  getGoogleAdsConfig,
  refreshAccessToken,
  resolveServingCustomer,
  diagnoseAccess,
  type AdPlanForCampaign,
} from '@/lib/ads/google-ads';

export const runtime = 'nodejs';

/**
 * createSearchCampaign'in fırlattığı hata mesajını yöneticiye gösterilebilir kısa
 * bir TEŞHİS özetine çevirir. mutate hataları "ads_mutate_failed:<service>:<status>:<bodyJson>"
 * biçiminde gelir; Google Ads REST hata gövdesinden errorCode + mesaj çıkarılır.
 * (Sağlayıcı policy/billing kodu — STK'nın kendi hesabına dair teşhis, sır değil.)
 */
function summarizeAdsError(raw: string): string {
  const m = raw.match(/^ads_mutate_failed:([^:]+):(\d+):([\s\S]*)$/);
  if (m) {
    const [, service, status, body] = m;
    let reason: string;
    try {
      const j = JSON.parse(body) as {
        error?: {
          message?: string;
          details?: Array<{ errors?: Array<{
            message?: string;
            errorCode?: Record<string, string>;
            location?: { fieldPathElements?: Array<{ fieldName?: string }> };
          }> }>;
        };
      };
      const first = j.error?.details?.[0]?.errors?.[0];
      const codeObj = first?.errorCode ?? {};
      const codeKey = Object.keys(codeObj)[0];
      const codeVal = codeKey ? `${codeKey}.${codeObj[codeKey]}` : '';
      const fieldPath = (first?.location?.fieldPathElements ?? [])
        .map((e) => e.fieldName).filter(Boolean).join('.');
      reason = [codeVal, fieldPath ? `alan: ${fieldPath}` : '', first?.message || j.error?.message]
        .filter(Boolean).join(' — ');
    } catch {
      reason = body.slice(0, 200);
    }
    return `Adım: ${service} (HTTP ${status})${reason ? ' · ' + reason : ''}`.slice(0, 320);
  }
  if (raw.includes('ads_token_refresh_failed')) return 'Yetki/oturum yenilenemedi — hesabı yeniden bağlayın.';
  if (raw.includes('ads_invalid_customer')) return 'Geçersiz reklam hesabı numarası.';
  if (raw.startsWith('ads_missing_resource')) return 'Google beklenen kaynağı döndürmedi.';
  return raw.slice(0, 200);
}

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const config = getGoogleAdsConfig();
  if (!config) {
    return NextResponse.json(
      { errorCode: 'ADS_NOT_CONFIGURED', message: 'Google Ads bağlantısı henüz yapılandırılmadı.' },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as { planId?: unknown } | null;
  const planId = typeof body?.planId === 'string' ? body.planId : '';
  if (!planId) {
    return NextResponse.json(
      { errorCode: 'MISSING', message: 'planId gerekli.' },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();

  // --- Connected account (refresh token + customerId). ---
  const acctSnap = await db
    .collection(COLLECTIONS.adAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);
  const acct = acctSnap?.exists
    ? (acctSnap.data() as { refreshToken?: unknown; customerId?: unknown; loginCustomerId?: unknown } | undefined)
    : undefined;
  const refreshToken = typeof acct?.refreshToken === 'string' ? acct.refreshToken : '';
  let customerId = typeof acct?.customerId === 'string' ? acct.customerId : '';
  let loginCustomerId = typeof acct?.loginCustomerId === 'string' ? acct.loginCustomerId : '';
  if (!refreshToken) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Önce Google Ads hesabını bağlayın.' },
      { status: 409 }
    );
  }

  // SELF-HEAL: customerId boşsa (callback çözememişse) burada stored refresh token ile
  // servis edebilen hesabı (+ login-customer-id bağlamını) çöz + kaydet. Böylece
  // "Yayınla → 409 → tekrar bağla" döngüsü kırılır; STK'nın hesaba doğrudan ya da bir
  // manager üzerinden erişmesi fark etmez.
  if (!customerId) {
    const accessToken = await refreshAccessToken(config, refreshToken);
    if (accessToken) {
      const resolved = await resolveServingCustomer(accessToken, config);
      if (resolved) {
        customerId = resolved.customerId;
        loginCustomerId = resolved.loginCustomerId;
      }
      console.log('[ads/publish] self-heal resolved', {
        ngoId: actor.ngoId, customerId: customerId || '(none)', loginCustomerId: loginCustomerId || '(none)',
      });
      if (customerId) {
        await db.collection(COLLECTIONS.adAccounts).doc(actor.ngoId)
          .set({ customerId, loginCustomerId }, { merge: true }).catch(() => {});
      }
    }
    if (!customerId) {
      const diag = accessToken ? await diagnoseAccess(accessToken, config).catch(() => '') : 'Erişim belirteci alınamadı (token reddedildi).';
      return NextResponse.json(
        {
          errorCode: 'NO_SERVING_ACCOUNT',
          message: 'Google Ads servis hesabı çözülemedi.',
          detail: `Bağlanan Google hesabıyla reklam servis edebilen (manager olmayan) bir Google Ads hesabına ulaşılamadı. Teşhis: ${diag}`,
        },
        { status: 409 }
      );
    }
  }

  // --- Plan ownership. ---
  const planSnap = await db
    .collection(COLLECTIONS.adPlans)
    .doc(planId)
    .get()
    .catch(() => null);
  if (!planSnap?.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_FOUND', message: 'Plan bulunamadı.' },
      { status: 404 }
    );
  }
  const plan = planSnap.data() as Record<string, unknown>;
  if (plan.ngoId !== actor.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu plan size ait değil.' },
      { status: 403 }
    );
  }

  // landing bir KOD ('hangel-bagis' | 'hangel-gonulluluk' | 'kurum-sitesi') —
  // gerçek bir finalUrl'e çevir (RSA için mutlak URL zorunlu).
  const SITE = 'https://hangel.org.tr';
  const profileUrl = `${SITE}/ngos/${actor.ngoId}`;
  const landingCode = typeof plan.landing === 'string' ? plan.landing : '';
  let landingUrl = profileUrl; // hangel-bagis + varsayılan
  if (landingCode === 'hangel-gonulluluk') {
    landingUrl = `${SITE}/volunteering`;
  } else if (landingCode === 'kurum-sitesi') {
    // STK'nın kendi sitesi; yoksa hangel profiline düş.
    const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(actor.ngoId).get().catch(() => null);
    const website = ngoSnap?.exists ? (ngoSnap.data() as { website?: unknown } | undefined)?.website : undefined;
    landingUrl = typeof website === 'string' && /^https?:\/\//i.test(website) ? website : profileUrl;
  }

  const planForCampaign: AdPlanForCampaign = {
    title: typeof plan.title === 'string' ? plan.title : undefined,
    landing: landingUrl,
    keywords: Array.isArray(plan.keywords)
      ? plan.keywords.filter((k): k is string => typeof k === 'string')
      : undefined,
    headlines: Array.isArray(plan.headlines)
      ? plan.headlines.filter((h): h is string => typeof h === 'string')
      : undefined,
    descriptions: Array.isArray(plan.descriptions)
      ? plan.descriptions.filter((d): d is string => typeof d === 'string')
      : undefined,
  };

  let campaignResourceName: string;
  try {
    const result = await createSearchCampaign(config, refreshToken, customerId, loginCustomerId || undefined, planForCampaign);
    campaignResourceName = result.campaignResourceName;
  } catch (err) {
    // Gerçek Google Ads hatasını sunucu loguna yaz (Cloud Logging). Yöneticiye
    // sadeleştirilmiş bir TEŞHİS özeti döndür (Ads policy/billing kodu — STK'nın
    // kendi hesabına dair, sır değil; "neden yayınlanmadı"yı görmesi gerekir).
    const raw = err instanceof Error ? err.message : String(err);
    console.error('[ads/publish] createSearchCampaign failed', {
      ngoId: actor.ngoId,
      customerId,
      loginCustomerId: config.loginCustomerId,
      planId,
      raw,
    });
    return NextResponse.json(
      { errorCode: 'PUBLISH_FAILED', message: 'Yayınlama başarısız.', detail: summarizeAdsError(raw) },
      { status: 502 }
    );
  }

  await db.collection(COLLECTIONS.adPlans).doc(planId).set(
    {
      status: 'active',
      campaignResourceName,
      publishedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, status: 'active', campaignId: campaignResourceName });
}
