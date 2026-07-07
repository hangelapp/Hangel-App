/**
 * GET|POST /api/cron/affiliate-sync — Affiliate onay senkronu (App Hosting cron, İKİNCİ yol).
 *
 * Cloud Function (affiliateApprovalSync, her gün 06:00) 2026-06-26 GCP incident'inden
 * beri tetiklenmiyor. Bu route AYNI robot mantığını (runAffiliateSync) App Hosting
 * üzerinde çalıştıran yedek yoldur; Cloud Scheduler VEYA harici cron (cron-job.org)
 * ile 06:00'da çağrılabilir. Cloud Function çalışsa bile idempotent — iki yol da
 * aynı system/affiliateSyncReport + affiliateSyncRuns/{tarih} + state doc'larına yazar.
 *
 * NOT: Bu route ESKİDEN farklı bir işi (STORE_BRANDS → marketAggregates/hiddenStores)
 * ve x-messaging-key auth'unu kullanıyordu. Görev gereği Cloud Function port'una
 * (brands collection eşitleme) ve Bearer/x-cloudscheduler auth'una geçirildi.
 *
 * Auth (biri yeterli):
 *   • Authorization: Bearer ${MESSAGING_WORKER_KEY}  (mevcut cron secret'ı reuse)
 *   • x-cloudscheduler header  (Cloud Scheduler doğrudan tetiklerse)
 * Başarısız → 403. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { runAffiliateSync } from '@/lib/affiliate-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 3 ağ taraması uzun sürebilir.

function isAuthorized(req: NextRequest): boolean {
  // Cloud Scheduler HTTP hedefleri her istekte x-cloudscheduler: true gönderir.
  if (req.headers.get('x-cloudscheduler')) return true;

  const expected = process.env.MESSAGING_WORKER_KEY;
  if (!expected) return false;
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return token.length > 0 && token === expected;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetkisiz istek.' }, { status: 403 });
  }

  try {
    const summary = await runAffiliateSync(getAdminFirestore(), { notifySuperAdmins: true });
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    console.error('[cron/affiliate-sync] senkron hatası', e);
    return NextResponse.json(
      { errorCode: 'SYNC_FAILED', message: 'Affiliate senkronu çalıştırılamadı.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

// Cloud Scheduler / cron-job.org bazı kurulumlarda GET ile tetikler — aynı işi yapsın.
export async function GET(req: NextRequest) {
  return handle(req);
}
