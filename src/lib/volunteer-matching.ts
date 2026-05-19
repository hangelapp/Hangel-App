/**
 * Intelligent Volunteer Matching — Hangel "imece" core algorithm.
 *
 * Pure scoring + ranker. No Firestore reads, no side effects.
 *
 * Scoring (0-100, integer):
 *   - Skills overlap          : 30 max (proportional to required skills count)
 *   - Interests overlap       : 20 max
 *   - Same city               : 20 (binary)
 *   - Day/time availability   : 15 max (proportional)
 *   - Same work mode          : 10 (binary, online opportunity always matches)
 *   - Same language           : 5 max
 *
 * Reasons[] returns up to 3 short Turkish strings explaining the highest
 * contributors (badge UX). The scorer never throws — missing fields just
 * yield 0 contribution from that axis.
 */

// ---------- Public input types (loose; mirrors actual Firestore docs) ----------

export type MatchingOpportunity = {
  id?: string;
  // Skills / requirements
  skills?: string[] | null;
  dailySkills?: string[] | null;
  requiredSkills?: string[] | null; // tolerated alias
  // Interests / cause areas
  socialArea?: string | null;
  interests?: string[] | null;
  category?: string | null; // tolerated alias
  // Languages
  languages?: string[] | null;
  // Location
  location?: {
    city?: string | null;
    type?: 'Online' | 'Saha' | 'Hibrit' | string | null;
  } | null;
  city?: string | null; // tolerated alias
  workMode?: string | null; // tolerated alias (Online / Yüz Yüze / Hibrit)
  // Availability — opportunities sometimes carry day/time hints
  availabilityDays?: string[] | null;
  availabilityTimes?: string[] | null;
};

export type MatchingUserProfile = {
  volunteerInfo?: {
    skills?: string[] | null;
    dailySkills?: string[] | null;
    interests?: string[] | null;
    languages?: string[] | null;
    availabilityDays?: string[] | null;
    availabilityTimes?: string[] | null;
    workModes?: string[] | null;
    motivations?: string[] | null;
  } | null;
  personalInfo?: {
    address?: {
      city?: string | null;
    } | null;
  } | null;
};

export type MatchResult = {
  score: number;
  reasons: string[];
};

export type RankedOpportunity<T extends MatchingOpportunity = MatchingOpportunity> = {
  opportunity: T;
  score: number;
  reasons: string[];
};

// ---------- Helpers ----------

const TR_LOCALE = 'tr';

const norm = (s: unknown): string =>
  typeof s === 'string' ? s.trim().toLocaleLowerCase(TR_LOCALE) : '';

const uniqNorm = (arr: ReadonlyArray<unknown> | null | undefined): string[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  for (const v of arr) {
    const n = norm(v);
    if (n) seen.add(n);
  }
  return Array.from(seen);
};

const overlap = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const bSet = new Set(b);
  let n = 0;
  for (const v of a) if (bSet.has(v)) n++;
  return n;
};

const oppSkills = (o: MatchingOpportunity): string[] =>
  uniqNorm([...(o.skills || []), ...(o.dailySkills || []), ...(o.requiredSkills || [])]);

const oppInterests = (o: MatchingOpportunity): string[] => {
  const list: unknown[] = [];
  if (o.socialArea) list.push(o.socialArea);
  if (o.category) list.push(o.category);
  if (Array.isArray(o.interests)) list.push(...o.interests);
  return uniqNorm(list);
};

const oppCity = (o: MatchingOpportunity): string => norm(o.location?.city ?? o.city ?? '');

const oppWorkMode = (o: MatchingOpportunity): string => {
  const raw = norm(o.location?.type ?? o.workMode ?? '');
  // Normalize Turkish vocabulary so user `workModes` can match Firestore enum.
  if (!raw) return '';
  if (raw === 'online') return 'online';
  if (raw === 'saha' || raw === 'yüz yüze' || raw === 'yuz yuze' || raw === 'fiziksel')
    return 'yüz yüze';
  if (raw === 'hibrit' || raw === 'hybrid') return 'hibrit';
  return raw;
};

const userWorkModes = (u: MatchingUserProfile): string[] => {
  const raw = uniqNorm(u.volunteerInfo?.workModes);
  return raw.map((m) => {
    if (m === 'online') return 'online';
    if (m === 'saha' || m === 'yüz yüze' || m === 'yuz yuze' || m === 'fiziksel') return 'yüz yüze';
    if (m === 'hibrit' || m === 'hybrid') return 'hibrit';
    return m;
  });
};

// ---------- Public API ----------

export function scoreMatch(
  opportunity: MatchingOpportunity,
  userProfile: MatchingUserProfile,
): MatchResult {
  const vi = userProfile.volunteerInfo || {};
  const userSkills = uniqNorm([...(vi.skills || []), ...(vi.dailySkills || [])]);
  const userInterests = uniqNorm(vi.interests);
  const userLanguages = uniqNorm(vi.languages);
  const userDays = uniqNorm(vi.availabilityDays);
  const userTimes = uniqNorm(vi.availabilityTimes);
  const userCity = norm(userProfile.personalInfo?.address?.city);
  const userModes = userWorkModes(userProfile);

  const reasonPool: Array<{ text: string; weight: number }> = [];

  // --- Skills (30) ---
  let skillsScore = 0;
  const reqSkills = oppSkills(opportunity);
  if (reqSkills.length > 0 && userSkills.length > 0) {
    const matched = overlap(reqSkills, userSkills);
    if (matched > 0) {
      skillsScore = Math.round((matched / reqSkills.length) * 30);
      if (skillsScore > 30) skillsScore = 30;
      reasonPool.push({
        text: `Yetkinlik eşleşmesi: ${matched} ortak alan`,
        weight: skillsScore,
      });
    }
  }

  // --- Interests (20) ---
  let interestsScore = 0;
  const oInterests = oppInterests(opportunity);
  if (oInterests.length > 0 && userInterests.length > 0) {
    const matched = overlap(oInterests, userInterests);
    if (matched > 0) {
      interestsScore = Math.round((matched / oInterests.length) * 20);
      if (interestsScore > 20) interestsScore = 20;
      reasonPool.push({
        text: `İlgi alanın ile örtüşüyor (${matched} alan)`,
        weight: interestsScore,
      });
    }
  }

  // --- Same city (20, binary) ---
  let cityScore = 0;
  const oCity = oppCity(opportunity);
  if (oCity && userCity && oCity === userCity) {
    cityScore = 20;
    reasonPool.push({ text: 'Aynı şehirde', weight: cityScore });
  }

  // --- Day/Time availability (15) ---
  let availScore = 0;
  const oDays = uniqNorm(opportunity.availabilityDays);
  const oTimes = uniqNorm(opportunity.availabilityTimes);
  let availMatched = 0;
  let availTotal = 0;
  if (oDays.length > 0) {
    availTotal += oDays.length;
    availMatched += overlap(oDays, userDays);
  }
  if (oTimes.length > 0) {
    availTotal += oTimes.length;
    availMatched += overlap(oTimes, userTimes);
  }
  if (availTotal > 0 && availMatched > 0) {
    availScore = Math.round((availMatched / availTotal) * 15);
    if (availScore > 15) availScore = 15;
    reasonPool.push({ text: 'Müsait olduğun günlerde', weight: availScore });
  }

  // --- Work mode (10, binary) ---
  let workModeScore = 0;
  const oMode = oppWorkMode(opportunity);
  if (oMode && userModes.length > 0 && userModes.includes(oMode)) {
    workModeScore = 10;
    const label = oMode === 'online' ? 'Online' : oMode === 'hibrit' ? 'Hibrit' : 'Yüz yüze';
    reasonPool.push({ text: `${label} çalışmayı tercih ediyorsun`, weight: workModeScore });
  }

  // --- Languages (5) ---
  let langScore = 0;
  const oLangs = uniqNorm(opportunity.languages);
  if (oLangs.length > 0 && userLanguages.length > 0) {
    const matched = overlap(oLangs, userLanguages);
    if (matched > 0) {
      langScore = Math.round((matched / oLangs.length) * 5);
      if (langScore > 5) langScore = 5;
      reasonPool.push({ text: 'Aynı dili konuşuyorsunuz', weight: langScore });
    }
  }

  const total =
    skillsScore + interestsScore + cityScore + availScore + workModeScore + langScore;
  const score = Math.max(0, Math.min(100, total));

  // Top 3 reasons by weight, stable ordering.
  const reasons = reasonPool
    .filter((r) => r.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((r) => r.text);

  return { score, reasons };
}

export const RANK_CAP = 20;

export function rankOpportunities<T extends MatchingOpportunity>(
  opportunities: ReadonlyArray<T>,
  userProfile: MatchingUserProfile,
  topN: number = RANK_CAP,
): RankedOpportunity<T>[] {
  const cap = Math.max(0, Math.min(RANK_CAP, Math.floor(topN)));
  if (cap === 0 || !Array.isArray(opportunities) || opportunities.length === 0) return [];

  const ranked: RankedOpportunity<T>[] = opportunities.map((o) => {
    const { score, reasons } = scoreMatch(o, userProfile);
    return { opportunity: o, score, reasons };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, cap);
}
