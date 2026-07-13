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

// Bir deep-link URL'ini (custom scheme veya universal link) uygulama içi
// route'a çevirir. Geçersizse null döner.
function resolveDeepLinkPath(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    // Universal Link (http/https): hangel.org/ngo/abc → /ngo/abc (sadece pathname)
    // Custom Scheme (hangel://): host İLK segmenttir → host + pathname'i BİRLEŞTİR.
    //   hangel://blood        → /blood
    //   hangel://event/123    → /events/123  (host eşlemesiyle doğru çoğul route)
    const isCustomScheme = url.protocol !== 'http:' && url.protocol !== 'https:';
    let base: string;
    if (isCustomScheme) {
      const mappedHost = SCHEME_HOST_ROUTE[url.host] || url.host;
      base = `/${mappedHost}${url.pathname === '/' ? '' : url.pathname}`;
    } else {
      base = url.pathname;
    }
    const path = `${base || '/'}${url.search}${url.hash}`;
    return path.startsWith('/') ? path : null;
  } catch {
    return null;
  }
}

export function initDeepLinkListener(navigate: (path: string) => void): Unsubscribe {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle: { remove: () => Promise<void> } | null = null;

  // 1) App AÇIKKEN gelen deep-link'ler (warm).
  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const path = resolveDeepLinkPath(event.url);
    if (path) navigate(path);
  }).then(h => { handle = h; });

  // 2) COLD-START: App KAPALIYKEN bir Live Activity / widget / deep-link'e
  //    tıklanıp uygulama o URL ile açıldığında, appUrlOpen listener kurulmadan
  //    ÖNCE URL gelmiş olur → kaçırılır → "canlı etkinliğe tıklayınca açılmıyor".
  //    getLaunchUrl açılıştaki bekleyen URL'i döndürür; onu da yönlendir.
  //    Router'ın hazır olması için küçük bir gecikme (best-effort).
  void App.getLaunchUrl().then((res) => {
    const raw = res?.url;
    if (!raw) return;
    const path = resolveDeepLinkPath(raw);
    if (path) {
      setTimeout(() => navigate(path), 300);
    }
  }).catch(() => { /* getLaunchUrl desteklenmiyorsa yok say */ });

  return () => { if (handle) void handle.remove(); };
}
