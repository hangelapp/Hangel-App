/**
 * Firestore-backed token bucket. Birden fazla worker invocation race condition'a
 * girmesin diye state transaction ile güncellenir.
 *
 * Doc shape: messagingRateState/{driver} = { tokensPerSec, tokensPerMin, secTokens, minTokens, secAt, minAt }
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getThrottleMultiplier } from '../trust-score';

export interface RateLimitConfig {
  perSecond: number;
  perMinute: number;
}

/**
 * NGO trust score'a göre etkin rate config döndürür.
 * Multiplier < 1.0 ise perSecond/perMinute o oranda düşürülür.
 */
export async function getEffectiveRate(
  baseCfg: RateLimitConfig,
  ngoId?: string | null
): Promise<RateLimitConfig> {
  if (!ngoId) return baseCfg;
  const multiplier = await getThrottleMultiplier(ngoId);
  if (multiplier >= 1.0) return baseCfg;
  return {
    perSecond: Math.max(1, Math.floor(baseCfg.perSecond * multiplier)),
    perMinute: Math.max(1, Math.floor(baseCfg.perMinute * multiplier)),
  };
}

export interface TakeResult {
  ok: boolean;
  waitMs?: number;
}

/** Bir token "almaya" çalış; başarılı olursa true, throttle ediliyorsa beklenecek süre döner. */
export async function tryTakeToken(
  driver: string,
  cfg: RateLimitConfig
): Promise<TakeResult> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.messagingRateState).doc(driver);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data()! : {};

    const secAt: number = (data.secAt as Timestamp | undefined)?.toMillis() ?? 0;
    const minAt: number = (data.minAt as Timestamp | undefined)?.toMillis() ?? 0;
    let secTokens: number = typeof data.secTokens === 'number' ? data.secTokens : cfg.perSecond;
    let minTokens: number = typeof data.minTokens === 'number' ? data.minTokens : cfg.perMinute;

    // Refill: tam pencere dolduysa tokens sıfırlanır
    if (now - secAt >= 1000) secTokens = cfg.perSecond;
    if (now - minAt >= 60_000) minTokens = cfg.perMinute;

    if (secTokens <= 0) {
      return { ok: false, waitMs: Math.max(50, 1000 - (now - secAt)) };
    }
    if (minTokens <= 0) {
      return { ok: false, waitMs: Math.max(50, 60_000 - (now - minAt)) };
    }

    secTokens -= 1;
    minTokens -= 1;

    tx.set(
      ref,
      {
        secTokens,
        minTokens,
        secAt: now - secAt >= 1000 ? Timestamp.fromMillis(now) : data.secAt ?? Timestamp.fromMillis(now),
        minAt: now - minAt >= 60_000 ? Timestamp.fromMillis(now) : data.minAt ?? Timestamp.fromMillis(now),
        perSecond: cfg.perSecond,
        perMinute: cfg.perMinute,
        updatedAt: Timestamp.fromMillis(now),
      },
      { merge: true }
    );

    return { ok: true };
  });
}

/**
 * Token alana kadar (veya maxWaitMs dolana kadar) bekler. Spin-loop değil — gerçek backoff yapar.
 */
export async function takeToken(
  driver: string,
  cfg: RateLimitConfig,
  maxWaitMs = 5000
): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const r = await tryTakeToken(driver, cfg);
    if (r.ok) return true;
    const wait = Math.min(r.waitMs ?? 200, Math.max(50, deadline - Date.now()));
    await new Promise((res) => setTimeout(res, wait));
  }
  return false;
}
