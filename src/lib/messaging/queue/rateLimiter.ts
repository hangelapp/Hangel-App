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

    // secAt/minAt tip-güvenli oku: Timestamp, {seconds}, ISO string veya number
    // olabilir (eski/bozuk doc'lar Timestamp DEĞİL → .toMillis() 'is not a function'
    // atıp HER worker tick'ini 500 ile öldürüyordu = kuyruk hiç işlenmiyordu).
    const toMs = (v: unknown): number => {
      if (v instanceof Timestamp) return v.toMillis();
      if (typeof v === 'number') return v;
      if (v && typeof v === 'object' && typeof (v as { toMillis?: unknown }).toMillis === 'function') {
        return (v as Timestamp).toMillis();
      }
      if (v && typeof v === 'object' && typeof (v as { _seconds?: unknown })._seconds === 'number') {
        return (v as { _seconds: number })._seconds * 1000;
      }
      if (typeof v === 'string') { const t = Date.parse(v); return Number.isNaN(t) ? 0 : t; }
      return 0;
    };
    const secAt: number = toMs(data.secAt);
    const minAt: number = toMs(data.minAt);
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
        // Her zaman Timestamp yaz (data.secAt'i olduğu gibi geri yazma — bozuk tip
        // kalıcılaşmasın). Pencere dolmadıysa bilinen millis'i Timestamp'e çevir.
        secAt: Timestamp.fromMillis(now - secAt >= 1000 ? now : secAt || now),
        minAt: Timestamp.fromMillis(now - minAt >= 60_000 ? now : minAt || now),
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
