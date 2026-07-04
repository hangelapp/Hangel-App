/**
 * scripts/seed-market-ads.ts
 *
 * `marketAdBanners` koleksiyonuna 5 tohum reklam kreatifini yazar (Admin SDK).
 * Süper-admin "Reklam Alanı Yönetimi" seed butonu ile aynı veriyi kod dışından
 * kurar; idempotent (merge:true) — tekrar çalıştırmak güvenli.
 *
 * Usage:
 *   npx tsx scripts/seed-market-ads.ts
 *
 * Admin SDK init:
 *   - GOOGLE_APPLICATION_CREDENTIALS env varsa onu kullanır;
 *   - yoksa repo kökündeki .firebase-service-account.json;
 *   - o da yoksa applicationDefault().
 *
 * Exit codes:
 *   0 success
 *   1 herhangi bir hata (admin SDK, write)
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Path alias (@/...) raw tsx'te çözülmez; SEED_MARKET_ADS'i RELATIF yol ile al.
// scripts/../src/lib/market/ad-banners → src/lib/market/ad-banners
import { SEED_MARKET_ADS } from '../src/lib/market/ad-banners';

const MARKET_AD_BANNERS_COLLECTION = 'marketAdBanners';

function initAdmin(): void {
  if (getApps().length > 0) return;
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath && fs.existsSync(credsPath)) {
    const sa = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  const local = path.join(process.cwd(), '.firebase-service-account.json');
  if (fs.existsSync(local)) {
    const sa = JSON.parse(fs.readFileSync(local, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  initializeApp({ credential: applicationDefault() });
}

async function main(): Promise<void> {
  console.log(`[seed-market-ads] başlıyor — ${SEED_MARKET_ADS.length} kreatif yazılacak.`);
  initAdmin();
  const db = getFirestore();

  let written = 0;
  for (const b of SEED_MARKET_ADS) {
    const now = Date.now();
    await db
      .collection(MARKET_AD_BANNERS_COLLECTION)
      .doc(b.id)
      .set({ ...b, createdAt: now, updatedAt: now }, { merge: true });
    written += 1;
    console.log(`[seed-market-ads]   ✓ ${b.id}  (${b.name})`);
  }

  console.log(`[seed-market-ads] OK — ${written}/${SEED_MARKET_ADS.length} kreatif yazıldı.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed-market-ads] HATA:', err instanceof Error ? err.message : err);
  process.exit(1);
});
