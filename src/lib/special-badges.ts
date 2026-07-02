/**
 * Özel / Dönemsel rozetler — paylaşılan tipler ve yardımcılar (saf; firebase yok).
 *
 * Süper-admin `specialBadges` koleksiyonunda tanım oluşturur ("Deprem Kahramanı",
 * "Yaz Gönüllüsü 2026" gibi). Bir kullanıcıya verilince, tanımın kopyası
 * `users/{uid}/badges/{id}` altına `kind:'special'` ile yazılır ve my-badges'te
 * EN ÜSTTE gösterilir (kısa ömürlü / prestijli olduğu için).
 */

export const SPECIAL_BADGE_STATUSES = ['Özel', 'Dönemsel'] as const;
export type SpecialBadgeStatus = (typeof SPECIAL_BADGE_STATUSES)[number];

/** Süper-admin'in tanımladığı özel/dönemsel rozet (specialBadges/{id}). */
export interface SpecialBadgeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  status: SpecialBadgeStatus;
  /** Vurgu rengi (kart/rozet arka planı). Yoksa marka narçiçeği kullanılır. */
  colorHex?: string;
  /** Dönemsel rozetler için görünürlük penceresi (ms epoch). */
  startAt?: number | null;
  endAt?: number | null;
  /** Yüksek = listede daha üstte. */
  priority: number;
  active: boolean;
  createdAtMs?: number;
}

/** Kullanıcının kazandığı özel rozet (users/{uid}/badges/{id}). */
export interface EarnedSpecialBadge {
  id: string;
  badgeId: string;
  name: string;
  description?: string;
  emoji?: string;
  status?: string;
  colorHex?: string;
  priority?: number;
  kind?: string; // 'special' | 'seasonal' | 'milestone' | 'area'
  earnedAtMs?: number;
}

/** Marka narçiçeği (özel rozet varsayılan vurgu rengi). */
export const SPECIAL_BADGE_DEFAULT_COLOR = '#E34234';

/** Bu rozet kaydı "özel/dönemsel" mi (my-badges'te en üstte gösterilir)? */
export function isSpecialKind(kind: string | undefined | null): boolean {
  return kind === 'special' || kind === 'seasonal';
}

/** Dönemsel rozet şu an aktif mi (tarih penceresi + active bayrağı)? */
export function isSpecialActive(def: Pick<SpecialBadgeDef, 'active' | 'startAt' | 'endAt'>, nowMs: number): boolean {
  if (!def.active) return false;
  if (def.startAt && nowMs < def.startAt) return false;
  if (def.endAt && nowMs > def.endAt) return false;
  return true;
}
