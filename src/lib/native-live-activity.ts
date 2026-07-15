'use client';

/**
 * Web ↔ HangelLiveActivity Capacitor plugin köprüsü.
 *
 * Çağrılar yalnız iOS 16.1+ Capacitor app'te çalışır; web ortamında no-op
 * (Promise<null> döner).
 *
 * Akış:
 *  1. Etkinlik/ilan sayfasından `startEmergencyBloodActivity({...})` çağrılır.
 *  2. Native plugin Activity.request() yapar; pushTokenUpdates ile aldığı APNs
 *     token'ı resolve değeri olarak döner.
 *  3. Bu fonksiyon token'ı `/api/live-activity/register-token`'a POST eder
 *     (backend Firestore'a yazar).
 *  4. Backend Cloud Function (Faz 1 ikinci parça) ilgili doc'ta update
 *     olunca APNs'e doğrudan push.
 *  5. Activity tamamlanınca `endLiveActivity(activityId)` çağrılır.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

import { initializeFirebase } from '@/firebase';

interface BaseStartResult {
  activityId: string;
  pushToken: string | null;
}

interface HangelLiveActivityPlugin {
  isSupported(): Promise<{ supported: boolean }>;
  startEmergencyBlood(opts: {
    bloodType: string;
    city: string;
    requestId: string;
    hospitalName: string;
    distance?: string;
    matchedDonors?: number;
    minutesLeft?: number;
    status?: string;
  }): Promise<BaseStartResult>;
  startVolunteerTask(opts: {
    taskTitle: string;
    ngoName: string;
    location: string;
    taskId: string;
    minutesLeft?: number;
    progressPercent?: number;
    checkInOpen?: boolean;
    weatherEmoji?: string;
    weatherTemp?: string;
    organizerLogoUrl?: string;
    activityStartEpoch?: number;
    activityEndEpoch?: number;
  }): Promise<BaseStartResult>;
  startEventCountdown(opts: {
    eventTitle: string;
    location: string;
    eventId: string;
    eventStartEpoch?: number;
    eventEndEpoch?: number;
    minutesLeft?: number;
    statusLabel?: string;
    weatherEmoji?: string;
    weatherTemp?: string;
    organizerLogoUrl?: string;
  }): Promise<BaseStartResult>;
  startDonationCampaign(opts: {
    campaignTitle: string;
    ngoName: string;
    campaignId: string;
    currentAmount?: number;
    goalAmount?: number;
    donorCount?: number;
  }): Promise<BaseStartResult>;
  endActivity(opts: { activityId: string }): Promise<{ ended: boolean }>;
}

const HangelLiveActivity = registerPlugin<HangelLiveActivityPlugin>('HangelLiveActivity');

/**
 * Live Activity desteği var mı? (iOS 16.1+ + ActivityKit enabled + user Settings'te kapatmamış)
 * Web'de veya plugin yoksa false döner.
 */
export async function isLiveActivitySupported(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { supported } = await HangelLiveActivity.isSupported();
    return supported;
  } catch {
    return false;
  }
}

type ActivityType = 'emergency-blood' | 'volunteer-task' | 'event-countdown' | 'donation-campaign';

async function registerActivityToken(input: { activityId: string; pushToken: string; type: ActivityType; referenceId: string }): Promise<void> {
  const { auth } = initializeFirebase();
  const user = auth.currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  await fetch('/api/live-activity/register-token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
    body: JSON.stringify(input),
  });
}

export async function startEmergencyBloodActivity(input: {
  bloodType: string;
  city: string;
  requestId: string;
  hospitalName: string;
  distance?: string;
  matchedDonors?: number;
  minutesLeft?: number;
  status?: string;
}): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const supported = (await HangelLiveActivity.isSupported()).supported;
    if (!supported) return null;
    const { activityId, pushToken } = await HangelLiveActivity.startEmergencyBlood(input);
    if (pushToken) {
      void registerActivityToken({ activityId, pushToken, type: 'emergency-blood', referenceId: input.requestId });
    }
    return activityId;
  } catch (e) {
    console.warn('[live-activity] startEmergencyBlood failed', e);
    return null;
  }
}

export async function startVolunteerTaskActivity(input: {
  taskTitle: string;
  ngoName: string;
  location: string;
  taskId: string;
  minutesLeft?: number;
  progressPercent?: number;
  checkInOpen?: boolean;
  weatherEmoji?: string;
  weatherTemp?: string;
  organizerLogoUrl?: string;
  activityStartEpoch?: number;
  activityEndEpoch?: number;
}): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { activityId, pushToken } = await HangelLiveActivity.startVolunteerTask(input);
    if (pushToken) {
      void registerActivityToken({ activityId, pushToken, type: 'volunteer-task', referenceId: input.taskId });
    }
    return activityId;
  } catch (e) {
    console.warn('[live-activity] startVolunteerTask failed', e);
    return null;
  }
}

export async function startEventCountdownActivity(input: {
  eventTitle: string;
  location: string;
  eventId: string;
  eventStartEpoch?: number;
  eventEndEpoch?: number;
  minutesLeft?: number;
  statusLabel?: string;
  weatherEmoji?: string;
  weatherTemp?: string;
  organizerLogoUrl?: string;
}): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { activityId, pushToken } = await HangelLiveActivity.startEventCountdown(input);
    if (pushToken) {
      void registerActivityToken({ activityId, pushToken, type: 'event-countdown', referenceId: input.eventId });
    }
    return activityId;
  } catch (e) {
    console.warn('[live-activity] startEventCountdown failed', e);
    return null;
  }
}

export async function startDonationCampaignActivity(input: {
  campaignTitle: string;
  ngoName: string;
  campaignId: string;
  currentAmount?: number;
  goalAmount?: number;
  donorCount?: number;
}): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { activityId, pushToken } = await HangelLiveActivity.startDonationCampaign(input);
    if (pushToken) {
      void registerActivityToken({ activityId, pushToken, type: 'donation-campaign', referenceId: input.campaignId });
    }
    return activityId;
  } catch (e) {
    console.warn('[live-activity] startDonationCampaign failed', e);
    return null;
  }
}

/**
 * Entity başına başlatılan Live Activity'nin activityId'sini localStorage'da sakla.
 * Böylece kullanıcı check-in yaptığında (veya başka bir tamamlama anında) doğru
 * activity sonlandırılabilir. Web/native fark etmez — sadece string saklar.
 * key kalıbı: hangel:laId:event:{id} / hangel:laId:vol:{id}
 */
export function laIdKeyFor(kind: 'event' | 'vol', id: string): string {
  return `hangel:laId:${kind}:${id}`;
}

export function storeLiveActivityId(kind: 'event' | 'vol', id: string, activityId: string): void {
  try { localStorage.setItem(laIdKeyFor(kind, id), activityId); } catch { /* yok say */ }
}

/**
 * Entity için saklanmış activityId varsa Live Activity'yi sonlandır ve key'i temizle.
 * Check-in başarısında çağrılır. Native değilse / kayıt yoksa no-op (best-effort).
 */
export async function endStoredLiveActivity(kind: 'event' | 'vol', id: string): Promise<void> {
  try {
    const key = laIdKeyFor(kind, id);
    let activityId: string | null = null;
    try { activityId = localStorage.getItem(key); } catch { /* yok say */ }
    if (activityId) {
      await endLiveActivity(activityId);
    }
    try { localStorage.removeItem(key); } catch { /* yok say */ }
  } catch (e) {
    console.warn('[live-activity] endStoredLiveActivity failed', e);
  }
}

export async function endLiveActivity(activityId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { ended } = await HangelLiveActivity.endActivity({ activityId });
    // Backend tarafından token kayıtlarını da temizle
    const { auth } = initializeFirebase();
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      await fetch(`/api/live-activity/register-token?activityId=${encodeURIComponent(activityId)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${idToken}` },
      });
    }
    return ended;
  } catch (e) {
    console.warn('[live-activity] endActivity failed', e);
    return false;
  }
}
