'use client';

/**
 * Capacitor native köprü — uygulamada açılan deep-link'leri yakalar ve
 * Next.js router'a yönlendirir.
 *
 * Tetiklendiği iki durum:
 *  - Universal Link: Safari/Mesajlar'dan tıklanan `https://hangel.org/...`
 *  - Custom Scheme: Siri Shortcuts / NFC etiketi `hangel://...`
 *
 * Apple Universal Link konfigürasyonu için `public/.well-known/apple-app-site-association`
 * dosyası servis ediliyor; Android için `public/.well-known/assetlinks.json`.
 */

import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

type Unsubscribe = () => void;

/**
 * Durum çubuğu (saat/şarj) uygulama açıkken GÖRÜNÜR kalsın — overlay kapalı
 * (içerik çubuğun altında) + show(). iOS'ta bazen gizleniyordu; bunu zorlar.
 */
export async function ensureStatusBarVisible(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.show();
  } catch {
    // status bar plugin yoksa / desteklenmiyorsa yok say
  }
}

// Custom-scheme host'unu (hangel://<host>/...) gerçek Next.js route'una çevir.
// KRİTİK: Live Activity / kilit ekranı / Dinamik Ada widget'ları TEKİL host
// kullanıyor (hangel://event/123, hangel://volunteer-task/123) ama gerçek route'lar
// ÇOĞUL/farklı (/events/123, /volunteering/123). Eşleme yapılmazsa tıklayınca
// /event/123 → 404 → "canlı etkinliğe tıklayınca gitmiyor" (defalarca bildirilen bug).
// Web'de görünmez, yalnız telefonda; bu yüzden React düzeltmeleri işe yaramadı.
const SCHEME_HOST_ROUTE: Record<string, string> = {
  event: 'events',              // hangel://event/{id}         → /events/{id}
  events: 'events',
  'volunteer-task': 'volunteering', // hangel://volunteer-task/{id} → /volunteering/{id}
  volunteering: 'volunteering',
  volunteer: 'volunteering',
  'emergency-blood': 'emergency',   // kan bağışı canlı aktivitesi → /emergency
  blood: 'emergency',
};

export function initDeepLinkListener(navigate: (path: string) => void): Unsubscribe {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle: { remove: () => Promise<void> } | null = null;
  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    try {
      const url = new URL(event.url);
      // Universal Link (http/https): hangel.org/ngo/abc → /ngo/abc (sadece pathname)
      // Custom Scheme (hangel://): host İLK segmenttir → host + pathname'i BİRLEŞTİR.
      //   hangel://blood        → /blood
      //   hangel://event/123    → /events/123  (host eşlemesiyle doğru çoğul route)
      const isCustomScheme = url.protocol !== 'http:' && url.protocol !== 'https:';
      let base: string;
      if (isCustomScheme) {
        // host'u gerçek route'a eşle (varsa); yoksa host'u aynen kullan.
        const mappedHost = SCHEME_HOST_ROUTE[url.host] || url.host;
        base = `/${mappedHost}${url.pathname === '/' ? '' : url.pathname}`;
      } else {
        base = url.pathname;
      }
      const path = `${base || '/'}${url.search}${url.hash}`;
      if (path.startsWith('/')) {
        navigate(path);
      }
    } catch {
      // malformed url — yok say
    }
  }).then(h => { handle = h; });

  return () => { if (handle) void handle.remove(); };
}
