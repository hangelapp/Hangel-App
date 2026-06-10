/**
 * Reklam platformu sabitleri. AYRI dosya (NOT 'use server') —
 * 'use server' dosyaları yalnız async fonksiyon export edebilir, const/tip edemez.
 * Hem ad-campaign-planner-flow (server) hem /api/ads/plan route buradan import eder.
 */
export const AD_PLATFORMS = ['google', 'meta', 'tiktok'] as const;
export type AdPlatform = (typeof AD_PLATFORMS)[number];
