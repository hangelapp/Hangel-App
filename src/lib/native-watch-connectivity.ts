'use client';

/**
 * HangelWatchConnectivity — Web ↔ Apple Watch köprüsü.
 *
 * iOS app içinde Capacitor plugin HangelWatchConnectivityPlugin.swift
 * üzerinden WCSession ile Watch'a mesaj gönderir/alır.
 *
 * Senaryo:
 *   Web: yeni acil kan ihtiyacı geldi → sendEmergencyToWatch({...})
 *   Watch: kullanıcı "Yardım Edebilirim" basar → 'watchResponse' event geliyor
 *   Web: respondeFromWatch event handler → /api/emergency/respond çağırır
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface BloodEmergencyPayload {
  id: string;
  bloodType: string;
  city: string;
  hospitalName: string;
  hospitalAddress?: string;
  distance?: string;
  units?: number;
  contactPhone?: string;
}

export interface WatchResponsePayload {
  emergencyId: string;
  status: 'positive' | 'negative';
  respondedAt: string; // ISO
}

interface HangelWatchConnectivityPlugin {
  isSupported(): Promise<{ supported: boolean; reachable?: boolean }>;
  sendEmergencyToWatch(payload: BloodEmergencyPayload): Promise<{ delivered: boolean }>;
  sendStateUpdate(payload: { emergencyId: string; status: string; minutesLeft?: number; matchedDonors?: number }): Promise<{ delivered: boolean }>;
  addListener(event: 'watchResponse', cb: (data: WatchResponsePayload) => void): Promise<{ remove: () => Promise<void> }>;
  removeAllListeners(): Promise<void>;
}

const plugin = registerPlugin<HangelWatchConnectivityPlugin>('HangelWatchConnectivity');

/** Native iOS dışında çağrılırsa false döner. */
export async function isWatchAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return false;
  try {
    const { supported, reachable } = await plugin.isSupported();
    return supported && (reachable ?? true);
  } catch {
    return false;
  }
}

/** Acil kan ihtiyacı bildirimini Watch ekranında göster. */
export async function pushEmergencyToWatch(payload: BloodEmergencyPayload): Promise<boolean> {
  if (!(await isWatchAvailable())) return false;
  try {
    const { delivered } = await plugin.sendEmergencyToWatch(payload);
    return delivered;
  } catch (e) {
    console.warn('[watch] sendEmergency failed', e);
    return false;
  }
}

/** Watch'taki Live Activity / liste içeriğini güncelle. */
export async function updateWatchState(input: {
  emergencyId: string;
  status: string;
  minutesLeft?: number;
  matchedDonors?: number;
}): Promise<boolean> {
  if (!(await isWatchAvailable())) return false;
  try {
    const { delivered } = await plugin.sendStateUpdate(input);
    return delivered;
  } catch (e) {
    console.warn('[watch] sendStateUpdate failed', e);
    return false;
  }
}

/**
 * Watch'tan gelen "Yardım Edebilirim/Edemem" yanıtını dinle.
 * Çağıran cleanup fonksiyonunu component unmount'ta çağırmalı.
 */
export async function onWatchResponse(
  cb: (data: WatchResponsePayload) => void,
): Promise<() => void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return () => {};
  }
  try {
    const handle = await plugin.addListener('watchResponse', cb);
    return () => { void handle.remove(); };
  } catch (e) {
    console.warn('[watch] addListener failed', e);
    return () => {};
  }
}
