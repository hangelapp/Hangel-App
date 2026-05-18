/**
 * Recipient resolver: spec → final recipient list + summary.
 *
 * Server-only. UI dry-run (count + sample) ve enqueue aşaması aynı fonksiyonu kullanır.
 *
 * Algoritma:
 *  1. Her kaynak için userId/channelAddress/vars çıkar (filters/segments/manual/csv)
 *  2. Channel address derive et (sms → toE164TR, email → normalizeEmail)
 *  3. Geçersizleri at, dedupe et (channelAddress'e göre, son yazma kazanır)
 *  4. Marketing ise lokal consent filtresi uygula
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { toE164TR } from './phone';
import { normalizeEmail, isValidEmail } from './email';
import { filterConsentedUserIds } from './consent';
import type {
  Channel,
  RecipientSourceSpec,
  ResolvedRecipient,
  SegmentFilters,
} from './types';

export interface ResolverSummary {
  fromFilters: number;
  fromSegments: number;
  manual: number;
  csv: number;
  beforeDedupe: number;
  afterDedupe: number;
  invalidAddress: number;
  afterConsent: number;
}

export interface ResolverResult {
  recipients: ResolvedRecipient[];
  summary: ResolverSummary;
  sample: ResolvedRecipient[];
}

interface UserDoc {
  name?: string;
  username?: string;
  role?: string;
  personalInfo?: {
    email?: string;
    phone?: string;
    address?: { city?: string; district?: string };
    profession?: string;
    bloodType?: string;
  };
  supportedNgos?: string[];
  volunteerNgos?: string[];
  managedNgoId?: string;
  stats?: { totalDonation?: number };
  volunteerInfo?: {
    skills?: string[];
    interests?: string[];
    profession?: string;
  };
}

interface RawCandidate {
  userId: string | null;
  user?: UserDoc;
  channelAddress?: string;
  varsOverride?: Record<string, string>;
  source: 'filter' | 'segment' | 'manual' | 'csv';
}

const SAMPLE_SIZE = 10;

function deriveAddress(channel: Channel, user: UserDoc | undefined): string | null {
  if (!user) return null;
  if (channel === 'sms') return toE164TR(user.personalInfo?.phone);
  const email = normalizeEmail(user.personalInfo?.email);
  return email && isValidEmail(email) ? email : null;
}

function userVars(user: UserDoc | undefined, userId: string | null): Record<string, string> {
  if (!user) return {};
  const fullName = user.name ?? user.username ?? '';
  const firstName = fullName.split(' ')[0] ?? '';
  return {
    ad: firstName,
    tam_ad: fullName,
    kullanici: user.username ?? '',
    sehir: user.personalInfo?.address?.city ?? '',
    ilce: user.personalInfo?.address?.district ?? '',
    meslek: user.volunteerInfo?.profession ?? user.personalInfo?.profession ?? '',
    user_id: userId ?? '',
  };
}

function matchesFilters(user: UserDoc, filters: SegmentFilters): boolean {
  if (filters.roles && filters.roles.length > 0) {
    if (!filters.roles.includes((user.role as 'user' | 'ngo-admin' | 'super-admin') ?? 'user')) {
      return false;
    }
  }
  if (filters.cities && filters.cities.length > 0) {
    const city = user.personalInfo?.address?.city;
    if (!city || !filters.cities.includes(city)) return false;
  }
  if (filters.districts && filters.districts.length > 0) {
    const district = user.personalInfo?.address?.district;
    if (!district || !filters.districts.includes(district)) return false;
  }
  if (filters.supportedNgoIds && filters.supportedNgoIds.length > 0) {
    const supported = user.supportedNgos ?? [];
    if (!filters.supportedNgoIds.some((id) => supported.includes(id))) return false;
  }
  if (filters.volunteerNgoIds && filters.volunteerNgoIds.length > 0) {
    const volunteer = user.volunteerNgos ?? [];
    if (!filters.volunteerNgoIds.some((id) => volunteer.includes(id))) return false;
  }
  if (filters.interests && filters.interests.length > 0) {
    const interests = user.volunteerInfo?.interests ?? [];
    if (!filters.interests.some((i) => interests.includes(i))) return false;
  }
  if (filters.skills && filters.skills.length > 0) {
    const skills = user.volunteerInfo?.skills ?? [];
    if (!filters.skills.some((s) => skills.includes(s))) return false;
  }
  if (filters.professions && filters.professions.length > 0) {
    const prof = user.volunteerInfo?.profession ?? user.personalInfo?.profession;
    if (!prof || !filters.professions.includes(prof)) return false;
  }
  if (filters.bloodTypes && filters.bloodTypes.length > 0) {
    const bt = user.personalInfo?.bloodType;
    if (!bt || !filters.bloodTypes.includes(bt)) return false;
  }
  if (filters.donationTier) {
    const total = user.stats?.totalDonation ?? 0;
    if (filters.donationTier.minTotal !== undefined && total < filters.donationTier.minTotal) return false;
    if (filters.donationTier.maxTotal !== undefined && total > filters.donationTier.maxTotal) return false;
  }
  return true;
}

async function loadByFilters(
  filters: SegmentFilters
): Promise<Array<{ userId: string; user: UserDoc }>> {
  const db = getAdminFirestore();
  // Şimdilik tüm users üzerinden tara — küçük-orta kullanıcı sayısı için yeterli.
  // İleride composite index + chained where ile optimize edilebilir.
  const snap = await db.collection('users').get();
  const out: Array<{ userId: string; user: UserDoc }> = [];
  for (const doc of snap.docs) {
    const user = doc.data() as UserDoc;
    if (matchesFilters(user, filters)) {
      out.push({ userId: doc.id, user });
    }
  }
  return out;
}

async function loadSegments(segmentIds: string[]): Promise<SegmentFilters[]> {
  const db = getAdminFirestore();
  const refs = segmentIds.map((id) => db.collection('recipientSegments').doc(id));
  if (refs.length === 0) return [];
  const snaps = await db.getAll(...refs);
  return snaps
    .filter((s) => s.exists)
    .map((s) => (s.data() as { filters?: SegmentFilters }).filters ?? {});
}

async function loadUsersByIds(
  userIds: string[]
): Promise<Map<string, UserDoc>> {
  if (userIds.length === 0) return new Map();
  const db = getAdminFirestore();
  const CHUNK = 30;
  const result = new Map<string, UserDoc>();
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK);
    const refs = chunk.map((uid) => db.collection('users').doc(uid));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) result.set(snap.id, snap.data() as UserDoc);
    }
  }
  return result;
}

interface CsvRow {
  channelAddress?: string;
  vars?: Record<string, string>;
  userId?: string | null;
}

async function loadCsvRows(csvUploadId: string): Promise<CsvRow[]> {
  const db = getAdminFirestore();
  const snap = await db.collection('csvUploads').doc(csvUploadId).get();
  if (!snap.exists) return [];
  const data = snap.data() as { rows?: CsvRow[] } | undefined;
  return data?.rows ?? [];
}

export async function resolveRecipients(spec: RecipientSourceSpec): Promise<ResolverResult> {
  const candidates: RawCandidate[] = [];

  let fromFilters = 0;
  let fromSegments = 0;
  let manual = 0;
  let csv = 0;

  // 1. Filters
  if (spec.filters) {
    const matched = await loadByFilters(spec.filters);
    fromFilters = matched.length;
    for (const { userId, user } of matched) {
      candidates.push({ userId, user, source: 'filter' });
    }
  }

  // 2. Saved segments — her bir segment'in filter'ını run et
  if (spec.segmentIds && spec.segmentIds.length > 0) {
    const filterList = await loadSegments(spec.segmentIds);
    for (const f of filterList) {
      const matched = await loadByFilters(f);
      fromSegments += matched.length;
      for (const { userId, user } of matched) {
        candidates.push({ userId, user, source: 'segment' });
      }
    }
  }

  // 3. Manual
  if (spec.manualUserIds && spec.manualUserIds.length > 0) {
    const userMap = await loadUsersByIds(spec.manualUserIds);
    for (const [uid, user] of userMap) {
      candidates.push({ userId: uid, user, source: 'manual' });
      manual += 1;
    }
  }

  // 4. CSV
  if (spec.csvUploadId) {
    const rows = await loadCsvRows(spec.csvUploadId);
    csv = rows.length;
    for (const row of rows) {
      if (!row.channelAddress) continue;
      candidates.push({
        userId: row.userId ?? null,
        channelAddress: row.channelAddress,
        varsOverride: row.vars,
        source: 'csv',
      });
    }
  }

  // 5. Address derive + invalid filter
  const beforeDedupe = candidates.length;
  let invalidAddress = 0;
  const byAddress = new Map<string, ResolvedRecipient>();

  for (const c of candidates) {
    const addr = c.channelAddress ?? deriveAddress(spec.channel, c.user);
    if (!addr) {
      invalidAddress += 1;
      continue;
    }
    const vars = c.varsOverride ?? userVars(c.user, c.userId);
    byAddress.set(addr, {
      userId: c.userId,
      channelAddress: addr,
      vars,
      consent: { marketing: spec.useCase !== 'marketing', source: 'derived', iysQueried: false },
    });
  }

  const afterDedupe = byAddress.size;
  const allResolved = [...byAddress.values()];

  // 6. Marketing consent filtresi
  let final = allResolved;
  if (spec.useCase === 'marketing') {
    const userIds = allResolved.map((r) => r.userId).filter((u): u is string => !!u);
    const { allowed } = await filterConsentedUserIds(userIds, spec.channel, spec.useCase);
    final = allResolved.filter((r) => {
      if (r.userId && allowed.has(r.userId)) {
        r.consent = { marketing: true, source: 'userMarketingConsent', iysQueried: false };
        return true;
      }
      // CSV/manuel ki userId yoksa marketing'de düşürülür (KVKK)
      return false;
    });
  }

  return {
    recipients: final,
    summary: {
      fromFilters,
      fromSegments,
      manual,
      csv,
      beforeDedupe,
      afterDedupe,
      invalidAddress,
      afterConsent: final.length,
    },
    sample: final.slice(0, SAMPLE_SIZE),
  };
}
