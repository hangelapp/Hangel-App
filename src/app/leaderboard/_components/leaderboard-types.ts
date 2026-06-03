/**
 * leaderboard-types.ts — paylaşılan tipler ve metrik yardımcıları.
 *
 * Firestore `users` koleksiyonundaki veri iki yerde olabiliyor:
 * - Yeni şema: `stats.{impactScore, volunteerHours, totalDonation}`
 * - Eski/davet akışı: top-level field'lar
 * Her iki yeri de okuyup max alıyoruz — page.tsx eski davranışını koruyor.
 */

export type LeaderboardUser = {
  id?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  stats?: {
    impactScore?: number;
    volunteerHours?: number;
    totalDonation?: number;
  };
  impactScore?: number;
  volunteerHours?: number;
  totalDonation?: number;
  personalInfo?: { address?: { school?: string; city?: string } };
  volunteerInfo?: { education?: Array<{ school?: string }> };
  privacySettings?: { isPrivate?: boolean };
};

export type RankedUser = LeaderboardUser & {
  _value: number;
  _rank: number;
};

export type MetricKey = 'impactScore' | 'volunteerHours' | 'totalDonation';

export type Scope = 'global' | 'country' | 'city' | 'school';

export type TimeRange = 'all' | 'year' | 'month' | 'week';

export const getValue = (u: LeaderboardUser, key: MetricKey): number => {
  const fromStats = Number(u?.stats?.[key]) || 0;
  const fromTop = Number(u?.[key]) || 0;
  return Math.max(fromStats, fromTop);
};

export const userSchools = (u: LeaderboardUser): string[] => {
  const list: string[] = [];
  if (u?.personalInfo?.address?.school) list.push(u.personalInfo.address.school);
  if (Array.isArray(u?.volunteerInfo?.education)) {
    u.volunteerInfo.education.forEach((e) => {
      if (e?.school) list.push(e.school);
    });
  }
  return list;
};
