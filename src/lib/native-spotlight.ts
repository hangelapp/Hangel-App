'use client';

/**
 * Web ↔ HangelSpotlight Capacitor plugin köprüsü (CoreSpotlight indeksleme).
 *
 * Çağrılar yalnız iOS Capacitor app'te çalışır. STK, etkinlik, kampanya
 * gibi içerikleri iOS sistem Spotlight'ında aranabilir hale getirir.
 *
 * Tipik kullanım:
 *  - Uygulama foreground'a geldiğinde (örn. günde bir) son N STK / etkinlik
 *    fetch edilip `indexSpotlightItems`'a verilir.
 *  - İçerik silindiğinde `deindexSpotlightItems` ile index'ten çıkarılır.
 *  - Reset için `deindexSpotlightDomain('event')` veya `deindexAllSpotlight`.
 *
 * Sınırlar:
 *  - iOS bir uygulama için ~50K item kabul eder; biz 5K cap önerisi.
 *  - Thumbnail URL'leri public olmalı (auth gerektiren CDN'ler indekslenmez).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

export type SpotlightDomain = 'ngo' | 'event' | 'campaign' | 'volunteer';

export interface SpotlightItem {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  thumbnailUrl?: string;
  domain: SpotlightDomain;
}

interface HangelSpotlightPlugin {
  indexItems(opts: { items: SpotlightItem[] }): Promise<{ indexed: number }>;
  deindexItems(opts: { ids: string[] }): Promise<{ deindexed: number }>;
  deindexDomain(opts: { domain: SpotlightDomain }): Promise<{ domain: string }>;
  deindexAll(): Promise<{ ok: boolean }>;
}

const HangelSpotlight = registerPlugin<HangelSpotlightPlugin>('HangelSpotlight');

export async function indexSpotlightItems(items: SpotlightItem[]): Promise<number> {
  if (!Capacitor.isNativePlatform() || items.length === 0) return 0;
  try {
    const { indexed } = await HangelSpotlight.indexItems({ items: items.slice(0, 5000) });
    return indexed;
  } catch (e) {
    console.warn('[spotlight] indexItems failed', e);
    return 0;
  }
}

export async function deindexSpotlightItems(ids: string[]): Promise<number> {
  if (!Capacitor.isNativePlatform() || ids.length === 0) return 0;
  try {
    const { deindexed } = await HangelSpotlight.deindexItems({ ids });
    return deindexed;
  } catch (e) {
    console.warn('[spotlight] deindexItems failed', e);
    return 0;
  }
}

export async function deindexSpotlightDomain(domain: SpotlightDomain): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HangelSpotlight.deindexDomain({ domain });
  } catch {
    /* sessiz */
  }
}

export async function deindexAllSpotlight(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HangelSpotlight.deindexAll();
  } catch {
    /* sessiz */
  }
}
