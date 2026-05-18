/**
 * Pricing tier ve maliyet hesaplama.
 *
 * Veri kaynağı: `messagingPricing/global` Firestore doc.
 * Yoksa env-default'lar kullanılır.
 *
 * Birim hesabı:
 *  - SMS: 1 segment = 1 SMS unit
 *  - Email: 1 mesaj = 1 email unit
 *  - WhatsApp: conversation category × çarpan (marketing=5, utility=2, auth=2, service=0)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { segmentInfo } from './sms-segments';
import type { Channel, WhatsAppConversationCategory } from './types';

export interface PricingTier {
  upToVolume: number | null; // null = sınırsız
  perUnit: number;            // TRY birim başına
}

export interface PricingConfig {
  tiers: {
    sms: PricingTier[];
    email: PricingTier[];
    whatsapp: PricingTier[];
  };
  freeQuota: {
    sms: number;
    email: number;
    whatsapp: number;
  };
  whatsappCategoryMultiplier: {
    marketing: number;
    utility: number;
    authentication: number;
    service: number;
  };
  kdvRate: number;             // 0.20
  currency: 'TRY';
}

const DEFAULT_PRICING: PricingConfig = {
  tiers: {
    sms: [
      { upToVolume: 1000, perUnit: 0.40 },
      { upToVolume: 10000, perUnit: 0.35 },
      { upToVolume: null, perUnit: 0.30 },
    ],
    email: [
      { upToVolume: 5000, perUnit: 0.02 },
      { upToVolume: 50000, perUnit: 0.015 },
      { upToVolume: null, perUnit: 0.012 },
    ],
    whatsapp: [
      { upToVolume: 1000, perUnit: 0.80 },
      { upToVolume: 10000, perUnit: 0.70 },
      { upToVolume: null, perUnit: 0.60 },
    ],
  },
  freeQuota: { sms: 100, email: 500, whatsapp: 50 },
  whatsappCategoryMultiplier: {
    marketing: 5,
    utility: 2,
    authentication: 2,
    service: 0,
  },
  kdvRate: 0.20,
  currency: 'TRY',
};

let cachedPricing: { value: PricingConfig; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getPricing(force = false): Promise<PricingConfig> {
  if (!force && cachedPricing && Date.now() - cachedPricing.at < CACHE_TTL_MS) {
    return cachedPricing.value;
  }
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.messagingPricing).doc('global').get();
  const value: PricingConfig = snap.exists
    ? { ...DEFAULT_PRICING, ...(snap.data() as Partial<PricingConfig>) }
    : DEFAULT_PRICING;
  cachedPricing = { value, at: Date.now() };
  return value;
}

export function invalidatePricingCache(): void {
  cachedPricing = null;
}

function findTier(tiers: PricingTier[], volume: number): PricingTier {
  for (const t of tiers) {
    if (t.upToVolume === null || volume < t.upToVolume) return t;
  }
  return tiers[tiers.length - 1];
}

export interface UnitCostResult {
  perUnit: number;        // TRY (KDV hariç)
  freeRemaining: number;  // bu kanaldaki kalan ücretsiz birim
}

export async function computeUnitCost(
  channel: Channel,
  ngoMonthlyVolume: number,
  ngoFreeQuotaUsed: number
): Promise<UnitCostResult> {
  const pricing = await getPricing();
  const tier = findTier(pricing.tiers[channel], ngoMonthlyVolume);
  const freeRemaining = Math.max(0, pricing.freeQuota[channel] - ngoFreeQuotaUsed);
  return { perUnit: tier.perUnit, freeRemaining };
}

export interface CampaignCostResult {
  recipients: number;
  unitsPerRecipient: number;   // SMS segments × 1, email × 1, WA × category multiplier
  totalUnits: number;
  freeUnitsUsed: number;
  billableUnits: number;
  unitPrice: number;           // tier'dan
  subtotal: number;
  kdv: number;
  total: number;               // KDV dahil
  currency: 'TRY';
  encoding?: 'GSM7' | 'UCS2';
}

export async function computeCampaignCost(opts: {
  channel: Channel;
  recipientCount: number;
  body?: string;                                    // SMS için segment hesabı
  whatsappCategory?: WhatsAppConversationCategory;  // WA için çarpan
  ngoMonthlyVolume?: number;
  ngoFreeQuotaUsed?: number;
}): Promise<CampaignCostResult> {
  const pricing = await getPricing();
  const monthlyVolume = opts.ngoMonthlyVolume ?? 0;
  const freeUsed = opts.ngoFreeQuotaUsed ?? 0;

  let unitsPerRecipient = 1;
  let encoding: 'GSM7' | 'UCS2' | undefined;
  if (opts.channel === 'sms') {
    const seg = segmentInfo(opts.body ?? '');
    unitsPerRecipient = seg.segments || 1;
    encoding = seg.encoding;
  } else if (opts.channel === 'whatsapp') {
    const cat = opts.whatsappCategory ?? 'utility';
    unitsPerRecipient = pricing.whatsappCategoryMultiplier[cat];
  }

  const totalUnits = opts.recipientCount * unitsPerRecipient;
  const freeRemaining = Math.max(0, pricing.freeQuota[opts.channel] - freeUsed);
  const freeUnitsUsed = Math.min(totalUnits, freeRemaining);
  const billableUnits = Math.max(0, totalUnits - freeUnitsUsed);

  const tier = findTier(pricing.tiers[opts.channel], monthlyVolume);
  const unitPrice = tier.perUnit;

  const subtotal = +(billableUnits * unitPrice).toFixed(2);
  const kdv = +(subtotal * pricing.kdvRate).toFixed(2);
  const total = +(subtotal + kdv).toFixed(2);

  return {
    recipients: opts.recipientCount,
    unitsPerRecipient,
    totalUnits,
    freeUnitsUsed,
    billableUnits,
    unitPrice,
    subtotal,
    kdv,
    total,
    currency: 'TRY',
    encoding,
  };
}
