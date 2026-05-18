/**
 * KVKK/İYS pazarlama izni helper'ı.
 * Server-only. userMarketingConsent/{uid} koleksiyonundan okur.
 *
 * - Transactional ve emergency use case'leri izin sorgulamaz.
 * - Marketing için ilgili kanal izninin enabled olması şart.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { Channel, UseCase } from './types';

export interface MarketingConsentDoc {
  email?: { enabled: boolean; source?: string; updatedAt?: unknown };
  sms?: { enabled: boolean; source?: string; updatedAt?: unknown };
  iys?: { permitId?: string; lastSyncedAt?: unknown; lastSyncStatus?: 'ok' | 'error' };
  channelAddresses?: { email?: string; phone?: string };
  unsubscribeToken?: string;
}

export function requiresConsent(useCase: UseCase): boolean {
  return useCase === 'marketing';
}

export async function canSendTo(
  userId: string | null,
  channel: Channel,
  useCase: UseCase
): Promise<{ allowed: boolean; reason?: string }> {
  if (!requiresConsent(useCase)) return { allowed: true };
  if (!userId) {
    return { allowed: false, reason: 'no_user_for_marketing' };
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.userMarketingConsent).doc(userId).get();
  if (!snap.exists) return { allowed: false, reason: 'no_consent_record' };

  const data = snap.data() as MarketingConsentDoc | undefined;
  const channelFlag = channel === 'email' ? data?.email?.enabled : data?.sms?.enabled;
  if (!channelFlag) return { allowed: false, reason: 'opted_out' };

  return { allowed: true };
}

export async function filterConsentedUserIds(
  userIds: string[],
  channel: Channel,
  useCase: UseCase
): Promise<{ allowed: Set<string>; denied: Map<string, string> }> {
  if (!requiresConsent(useCase)) {
    return { allowed: new Set(userIds), denied: new Map() };
  }

  const db = getAdminFirestore();
  const allowed = new Set<string>();
  const denied = new Map<string, string>();

  // Firestore "in" query 30 element ile sınırlı — chunked fetch
  const CHUNK = 30;
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK);
    const refs = chunk.map((uid) => db.collection(COLLECTIONS.userMarketingConsent).doc(uid));
    const snaps = await db.getAll(...refs);
    for (let j = 0; j < snaps.length; j++) {
      const uid = chunk[j];
      const snap = snaps[j];
      if (!snap.exists) {
        denied.set(uid, 'no_consent_record');
        continue;
      }
      const data = snap.data() as MarketingConsentDoc | undefined;
      const flag = channel === 'email' ? data?.email?.enabled : data?.sms?.enabled;
      if (flag) allowed.add(uid);
      else denied.set(uid, 'opted_out');
    }
  }

  return { allowed, denied };
}
