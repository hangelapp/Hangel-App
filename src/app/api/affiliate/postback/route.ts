/**
 * Affiliate postback receiver — `GET|POST /api/affiliate/postback`.
 *
 * GelirOrtakları / HasOffers (Tune) affiliate panellerinden çağrılır. Bir
 * dönüşüm (conversion) onaylandığında panel bu URL'i çağırır (genelde GET pixel,
 * bazen POST). Bizim `clickId`'imiz subId (transaction_id) olarak geri gelir;
 * onunla `affiliateClicks/{clickId}` doc'unu bulup kullanıcı + markayı çözer ve
 * onaylı dönüşümler için BAĞIŞ oluştururuz.
 *
 * Bağış oluşturma mantığı `/api/affiliate/webhook/[brandId]/route.ts`'ten
 * PORTLANMIŞTIR (donation row + notification + impactScore + donation-split:
 * computeDonationSplit / normalizeRates / periodKey, supportedNgos %50/%50).
 *
 * Param (query veya form-encoded body):
 *  - transaction_id  → bizim clickId (zorunlu; subId mekanizması)
 *  - amount          → satış tutarı (purchaseAmount)
 *  - commission/payout → bizim hak edişimiz (donationAmount kaynağı)
 *  - status          → approved | pending | rejected (yalnız approved bağış üretir)
 *  - offer_id?       → bilgi amaçlı (log)
 *  - key?            → opsiyonel imza/secret (AFFILIATE_POSTBACK_SECRET ile karşılaştırılır)
 *
 * Idempotency:
 *  - `affiliateClicks/{clickId}.status === 'converted'` ise tekrar bağış
 *    oluşturulmaz (clickId zaten tek dönüşüm anchor'ı). Bağış doc'u da
 *    deterministik id (`postback_{clickId}`) ile `.create()` edilir → çift
 *    çağrıda da tek satır.
 *
 * Güvenlik:
 *  - `AFFILIATE_POSTBACK_SECRET` env varsa `?key=` ile timing-safe karşılaştırılır.
 *  - Yoksa geçerli bir `clickId` (mevcut affiliateClicks doc) varlığı gate olur.
 *
 * Hata yanıt şekli: `{ errorCode, message }`. Panel tarafının postback'i
 * "başarısız" sayıp tekrar denemesini önlemek için, dönüşümü kaydedemediğimiz
 * iş-mantığı durumları (bilinmeyen clickId / approved değil / zaten converted)
 * 200 ile bilgilendirici döner; yalnız gerçek hatalar 4xx/5xx döner.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeRates, computeDonationSplit, periodKey, type DonationRates } from '@/lib/donation-split';

export const runtime = 'nodejs';

// COLLECTIONS.affiliateClicks Agent A tarafından collections.ts'e eklenir.
// Burada const'a alıp fallback literal veriyoruz ki bu dosya A'nın edit'inden
// ÖNCE typecheck edilse bile build kırılmasın (string union'a düşmez).
const AFFILIATE_CLICKS =
  (COLLECTIONS as Record<string, string>).affiliateClicks ?? 'affiliateClicks';

type ErrorCode =
  | 'MISSING_TRANSACTION_ID'
  | 'INVALID_AMOUNT'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

function errorResponse(status: number, errorCode: ErrorCode, message: string) {
  return NextResponse.json({ errorCode, message }, { status });
}

/** İş-mantığı "no-op" durumları — panel retry'ını tetiklememek için 200. */
function ackResponse(state: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ status: state, ...extra }, { status: 200 });
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** "5,30" / "5.30 TL" / "%5" gibi gelebilen tutarları güvenli sayıya çevirir. */
function parseAmount(raw: string | null): number | null {
  if (raw === null || raw === '') return null;
  const cleaned = raw.replace('%', '').replace(/[^0-9,.-]/g, '').replace(',', '.').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

interface PostbackParams {
  clickId: string | null;
  amount: number | null;       // satış tutarı (purchaseAmount)
  commission: number | null;   // bizim hak ediş (donationAmount kaynağı)
  status: string | null;       // approved | pending | rejected
  offerId: string | null;
  key: string | null;
}

/** GET query + (POST için) form-encoded body'i birleştirip param çıkarır. */
async function readParams(req: Request): Promise<PostbackParams> {
  const url = new URL(req.url);
  const q = url.searchParams;

  // POST gövdesi (form-encoded ya da JSON) varsa onu da harmanla — bazı paneller
  // POST + body ile çağırır. Sorgu parametresi öncelikli kalır.
  const body = new URLSearchParams();
  if (req.method === 'POST') {
    const ctype = (req.headers.get('content-type') || '').toLowerCase();
    try {
      if (ctype.includes('application/json')) {
        const json = (await req.json()) as Record<string, unknown> | null;
        if (json && typeof json === 'object') {
          for (const [k, v] of Object.entries(json)) {
            if (v !== undefined && v !== null) body.set(k, String(v));
          }
        }
      } else {
        const text = await req.text();
        if (text) {
          const parsed = new URLSearchParams(text);
          parsed.forEach((v, k) => body.set(k, v));
        }
      }
    } catch {
      // Gövde okunamazsa yalnız query ile devam.
    }
  }

  const get = (...keys: string[]): string | null => {
    for (const k of keys) {
      const fromQuery = q.get(k);
      if (fromQuery !== null && fromQuery !== '') return fromQuery;
      const fromBody = body.get(k);
      if (fromBody !== null && fromBody !== '') return fromBody;
    }
    return null;
  };

  return {
    clickId: get('transaction_id', 'aff_sub', 'aff_sub1', 'subid', 'sub_id', 'clickId'),
    amount: parseAmount(get('amount', 'sale_amount', 'sale')),
    commission: parseAmount(get('commission', 'payout', 'amount_payout')),
    status: get('status', 'conversion_status', 'approval_status'),
    offerId: get('offer_id', 'offerId', 'offer'),
    key: get('key', 'secret', 'sig'),
  };
}

function isApproved(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  return s === 'approved' || s === 'approve' || s === 'confirmed' || s === 'success' || s === '1';
}

async function handle(req: Request) {
  const params = await readParams(req);

  // Opsiyonel secret gate.
  const expectedSecret = process.env.AFFILIATE_POSTBACK_SECRET ?? '';
  if (expectedSecret) {
    if (!params.key || !timingSafeStringEqual(params.key, expectedSecret)) {
      return errorResponse(401, 'UNAUTHORIZED', 'invalid or missing postback key');
    }
  }

  if (!params.clickId) {
    return errorResponse(400, 'MISSING_TRANSACTION_ID', 'transaction_id (clickId) is required');
  }
  // Doc id güvenliği — Firestore doc id'de '/' olamaz, uzunluk sınırı var.
  const clickId = params.clickId.replace(/[/]/g, '_').slice(0, 1500);

  const db = getAdminFirestore();
  const clickRef = db.collection(AFFILIATE_CLICKS).doc(clickId);

  let clickSnap;
  try {
    clickSnap = await clickRef.get();
  } catch (err) {
    console.error('[affiliate postback] click lookup failed', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'click lookup failed');
  }

  // Bilinmeyen clickId → panel retry'ı istemiyoruz, 200 ack (no donation).
  if (!clickSnap.exists) {
    return ackResponse('unknown_click', { clickId });
  }

  const click = clickSnap.data() as {
    userId?: string | null;
    brandId?: string | null;
    brandName?: string | null;
    network?: string | null;
    donationRate?: number | null;
    status?: string | null;
    donationId?: string | null;
  };

  // Idempotent: zaten dönüştürülmüşse tekrar bağış oluşturma.
  if (click.status === 'converted') {
    return ackResponse('already_converted', { clickId, donationId: click.donationId ?? null });
  }

  // approved değilse (pending/rejected) → sadece logla, bağış yok.
  if (!isApproved(params.status)) {
    return ackResponse('not_approved', { clickId, conversionStatus: params.status ?? null });
  }

  const userId = typeof click.userId === 'string' && click.userId ? click.userId : null;
  const brandId = typeof click.brandId === 'string' && click.brandId ? click.brandId : null;

  // Anonim tıklama (login'siz) → bağış bağlanamaz; click'i converted işaretle
  // (gelir bize gelir ama kullanıcıya atfedilemez) ve ack dön.
  if (!userId) {
    try {
      await clickRef.update({
        status: 'converted',
        convertedAt: FieldValue.serverTimestamp(),
        conversionAmount: params.amount ?? null,
        conversionCommission: params.commission ?? null,
        conversionOfferId: params.offerId ?? null,
        donationId: null,
        note: 'anonymous-click-no-user',
      });
    } catch (err) {
      console.error('[affiliate postback] anon click update failed', err);
    }
    return ackResponse('converted_no_user', { clickId });
  }

  // commission yoksa amount'a düş (bazı paneller yalnız sale_amount yollar).
  const commission = params.commission ?? params.amount ?? 0;
  const purchaseAmount = params.amount ?? commission;
  if (!Number.isFinite(commission) || commission < 0) {
    return errorResponse(400, 'INVALID_AMOUNT', 'commission/amount must be a non-negative number');
  }

  // ── Bağış oluşturma (webhook route'tan PORTLANMIŞ) ────────────────────────
  const brandKey = brandId ?? '';
  let brandName: string | null = (typeof click.brandName === 'string' && click.brandName) ? click.brandName : null;
  let brandSlug: string | null = null;
  let brandLogoUrl: string | null = null;
  let brandDonationRate = typeof click.donationRate === 'number' ? click.donationRate : 0;

  if (brandKey) {
    try {
      const brandSnap = await db.collection(COLLECTIONS.brands).doc(brandKey).get();
      const data = brandSnap.data() as
        | { name?: string; slug?: string; logoUrl?: string; donationRate?: number }
        | undefined;
      if (data) {
        brandName = brandName ?? (typeof data.name === 'string' ? data.name : null);
        brandSlug = typeof data.slug === 'string' ? data.slug : null;
        brandLogoUrl = typeof data.logoUrl === 'string' ? data.logoUrl : null;
        if (typeof data.donationRate === 'number') brandDonationRate = data.donationRate;
      }
    } catch (err) {
      // Marka denormalizasyonu best-effort — postback'i düşürme.
      console.error('[affiliate postback] brand metadata lookup failed', err);
    }
  }

  const userRef = db.collection(COLLECTIONS.users).doc(userId);
  // Bağış doc'u deterministik id ile → çift postback'te de tek satır.
  const donationRef = db.collection(COLLECTIONS.donations).doc(`postback_${clickId}`.slice(0, 1500));
  const notificationRef = db.collection(COLLECTIONS.notifications).doc();
  const nowDate = new Date();
  const datePart = nowDate.toISOString().split('T')[0];
  const timePart = nowDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const period = periodKey(nowDate);

  // Bağış dağıtımı: oranlar + kullanıcının seçtiği 2 dernek (%50/%50).
  let rates: DonationRates;
  try {
    const rSnap = await db.collection(COLLECTIONS.siteSettings).doc('donationRates').get();
    rates = normalizeRates(rSnap.exists ? (rSnap.data() as Partial<DonationRates>) : null);
  } catch {
    rates = normalizeRates(null);
  }

  let supportedNgoIds: string[] = [];
  try {
    const uSnap = await userRef.get();
    const arr = (uSnap.data() as { supportedNgos?: string[] } | undefined)?.supportedNgos;
    if (Array.isArray(arr)) supportedNgoIds = arr.filter((x): x is string => typeof x === 'string').slice(0, 2);
  } catch {
    /* okunamazsa atanmamış kalır */
  }

  const ngoNames: string[] = [];
  for (const nid of supportedNgoIds) {
    try {
      const nSnap = await db.collection(COLLECTIONS.ngos).doc(nid).get();
      ngoNames.push((nSnap.data() as { name?: string } | undefined)?.name || nid);
    } catch {
      ngoNames.push(nid);
    }
  }

  const split = computeDonationSplit(commission, rates, supportedNgoIds.length);
  // Kullanıcı EN AZ 1 STK destekliyorsa bağış atanır (eskiden tam 2 şartı vardı;
  // 1 STK destekleyen kullanıcının bağışı "atanmamış" kalıp STK paneline hiç
  // düşmüyordu). computeDonationSplit zaten perNgo = ngoShareTotal/ngoCount ile
  // doğru böler (1 STK → tamamı o STK'ya).
  const assigned = supportedNgoIds.length >= 1;
  const perNgoEntries = supportedNgoIds.map((nid, i) => ({ ngoId: nid, ngoName: ngoNames[i] || nid, amount: split.perNgo }));

  let createdDonationId: string;
  try {
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);

      // Bağış satırı — webhook ile AYNI şekil (my-donations bunu okur).
      tx.create(donationRef, {
        userId,
        userName: userSnap.exists
          ? ((userSnap.data() as { displayName?: string; email?: string } | undefined)?.displayName
            ?? (userSnap.data() as { displayName?: string; email?: string } | undefined)?.email
            ?? 'Kullanıcı')
          : 'Kullanıcı',
        userEmail: userSnap.exists
          ? ((userSnap.data() as { email?: string } | undefined)?.email ?? null)
          : null,
        brand: brandName ?? brandKey,
        brandId: brandKey,
        brandName: brandName ?? brandKey,
        brandSlug: brandSlug ?? '',
        brandLogoUrl: brandLogoUrl ?? '',
        orderId: clickId,
        purchaseAmount: purchaseAmount.toFixed(2),
        donationAmount: commission.toFixed(2),
        donationRate: brandDonationRate,
        currency: 'TRY',
        date: datePart,
        time: timePart,
        period,
        type: 'expense',
        // PDF madde #2: işleme alındı (turuncu). Süper admin hesap kesiminde
        // "Yatırıldı" (yeşil) yapacak.
        status: 'İşleme Alındı',
        // Dağıtım: kullanıcının 2 derneğine %50/%50 (seçilmemişse atanmamış).
        ngo: assigned ? ngoNames : ['Atanmamış'],
        ngoIds: assigned ? supportedNgoIds : [],
        ngoSplit: perNgoEntries,
        split: {
          gross: split.gross,
          incomeTax: split.incomeTax,
          vat: split.vat,
          netAfterTax: split.netAfterTax,
          ngoShareTotal: split.ngoShareTotal,
          hangelShare: split.hangelShare,
          perNgo: split.perNgo,
          ngoCount: split.ngoCount,
          rates,
        },
        settlementStatus: assigned ? 'pending' : 'unassigned',
        createdAt: FieldValue.serverTimestamp(),
        source: 'affiliate-postback',
        clickId,
        network: typeof click.network === 'string' ? click.network : null,
        offerId: params.offerId ?? null,
      });

      tx.create(notificationRef, {
        userId,
        type: 'donation',
        title: 'Bağışınız işleme alınmıştır',
        body: `${brandName ?? 'Marka'} alışverişinizden ${commission.toFixed(2)} ₺ bağış işleme alındı.`,
        data: {
          brandId: brandKey,
          brandName: brandName ?? brandKey,
          orderId: clickId,
          donationId: donationRef.id,
        },
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'affiliate-postback',
      });

      if (userSnap.exists) {
        // impactScore, gerçekten STK'lara giden net tutar (ngoShareTotal) kadar
        // artar — brüt komisyon değil (eskiden brütten artıyor, etkiyi şişiriyordu).
        tx.update(userRef, {
          impactScore: FieldValue.increment(split.ngoShareTotal),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // STK profillerine yansıt: her desteklenen STK'nın stats.totalDonation'ına
      // kendi payı (perNgo), donationCount'una +1. Böylece STK public profili +
      // STK-admin dashboard'u "toplanan bağış" rakamını gösterir.
      // (ngoIds atanmışsa; atanmamışsa STK yok, atlanır.)
      if (assigned) {
        for (const nid of supportedNgoIds) {
          const nRef = db.collection(COLLECTIONS.ngos).doc(nid);
          tx.set(nRef, {
            stats: {
              totalDonation: FieldValue.increment(split.perNgo),
              donationCount: FieldValue.increment(1),
            },
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }

      // Marka profiline yansıt: markanın stats.totalDonation'ına brüt bağış (commission).
      // Marka mağaza profili (/market/[id]) "Toplam Bağış Hacmi" bunu okur.
      if (brandKey) {
        const bRef = db.collection(COLLECTIONS.brands).doc(brandKey);
        tx.set(bRef, {
          stats: {
            totalDonation: FieldValue.increment(commission),
            donationCount: FieldValue.increment(1),
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    });
    createdDonationId = donationRef.id;
  } catch (err) {
    const code = (err as { code?: number | string }).code;
    // Deterministik donation id zaten varsa (çift postback) → idempotent ack.
    if (code === 6 || code === 'already-exists') {
      // click doc'unu da converted'a çekmeyi garantiye al.
      try {
        await clickRef.update({
          status: 'converted',
          donationId: donationRef.id,
          convertedAt: FieldValue.serverTimestamp(),
        });
      } catch { /* best-effort */ }
      return ackResponse('already_converted', { clickId, donationId: donationRef.id });
    }
    console.error('[affiliate postback] donation/notification write failed', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'failed to record donation');
  }

  // click doc'unu converted işaretle + donationId yaz.
  try {
    await clickRef.update({
      status: 'converted',
      donationId: createdDonationId,
      convertedAt: FieldValue.serverTimestamp(),
      conversionAmount: purchaseAmount,
      conversionCommission: commission,
      conversionOfferId: params.offerId ?? null,
    });
  } catch (err) {
    // Bağış zaten oluştu; click güncellemesi best-effort.
    console.error('[affiliate postback] click status update failed', err);
  }

  return ackResponse('converted', { clickId, donationId: createdDonationId });
}

export async function GET(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error('[affiliate postback] GET unhandled', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'unexpected error');
  }
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error('[affiliate postback] POST unhandled', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'unexpected error');
  }
}
