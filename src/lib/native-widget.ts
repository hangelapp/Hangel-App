'use client';

/**
 * Web ↔ HangelWidget Capacitor plugin köprüsü (ana ekran widget'ları, yazma).
 *
 * `setWidgetData()` native (iOS/Android) tarafta paylaşılan depoya (iOS App Group
 * UserDefaults, Android SharedPreferences) yazar ve widget'ları yeniler. Web
 * ortamında veya plugin yoksa no-op (sessiz).
 *
 * Alan adları her iki platform plugin'inin de beklediği mantıksal isimlerdir.
 * iOS plugin bunları App Group anahtarlarına (widget.impact.score vb.), Android
 * plugin SharedPreferences anahtarlarına eşler. Sadece DOLU gelen alanlar yazılır;
 * gelmeyen alan dokunulmaz (önceki/placeholder değer korunur).
 *
 * Senkron akışı için bkz. src/lib/sync-widget.ts.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface WidgetData {
  // Yaklaşan etkinlik
  upcomingEventTitle?: string;
  upcomingEventStartEpochMs?: number; // 1970'ten beri ms
  upcomingEventLocation?: string;
  // Etki puanı
  impactScore?: number;
  impactRank?: string;
  // Acil kan durumu
  bloodOpenRequests?: number;
  bloodNearestCity?: string;
  // Bağışlar / destek
  donationsCount?: number;
  donationsLabel?: string;
}

interface HangelWidgetPlugin {
  setData(data: WidgetData): Promise<{ ok: boolean }>;
}

const HangelWidget = registerPlugin<HangelWidgetPlugin>('HangelWidget');

/**
 * Widget verisini native paylaşılan depoya yaz ve widget'ları yenile.
 * Web / non-native → no-op. Hata / desteklenmiyor → sessizce yutulur (best-effort).
 */
export async function setWidgetData(data: WidgetData): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HangelWidget.setData(data);
  } catch (e) {
    console.warn('[native-widget] setData failed', e);
  }
}
