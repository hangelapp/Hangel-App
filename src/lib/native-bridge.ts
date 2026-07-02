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

export function initDeepLinkListener(navigate: (path: string) => void): Unsubscribe {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle: { remove: () => Promise<void> } | null = null;
  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    try {
      const url = new URL(event.url);
      // Universal Link (http/https): hangel.org/ngo/abc → /ngo/abc (sadece pathname)
      // Custom Scheme (hangel://): host İLK segmenttir → host + pathname'i BİRLEŞTİR.
      //   hangel://blood        → /blood
      //   hangel://event/123    → /event/123   (eski kod host'u düşürüp /123 yapıyordu — bug)
      const isCustomScheme = url.protocol !== 'http:' && url.protocol !== 'https:';
      const base = isCustomScheme
        ? `/${url.host}${url.pathname === '/' ? '' : url.pathname}`
        : url.pathname;
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
