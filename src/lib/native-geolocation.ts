'use client';

/**
 * Capacitor + web ortak konum yardımcısı. Native iOS/Android'de
 * @capacitor/geolocation plugin'i kullanılır (sistem permission dialog'u),
 * web'de navigator.geolocation fallback'i.
 *
 * Bu yardımcıyı çağıran taraf izin reddi durumunda graceful degradation
 * yapmalı (örn. manuel lokasyon girişi).
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export async function getCurrentPositionUnified(): Promise<GeoPosition | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions({ permissions: ['location'] });
        if (perm.location !== 'granted') return null;
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch {
      return null;
    }
  }

  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return null;
  return new Promise<GeoPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}
