'use client';

/**
 * Capacitor native köprü — uygulamada açılan deep-link'leri yakalar ve
 * Next.js router'a yönlendirir.
 *
 * Tetiklendiği iki durum:
 *  - Universal Link: Safari/Mesajlar'dan tıklanan `https://hangel.org.tr/...`
 *  - Custom Scheme: Siri Shortcuts / NFC etiketi `hangel://...`
 *
 * Apple Universal Link konfigürasyonu için `public/.well-known/apple-app-site-association`
 * dosyası servis ediliyor; Android için `public/.well-known/assetlinks.json`.
 */

import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type Unsubscribe = () => void;

export function initDeepLinkListener(navigate: (path: string) => void): Unsubscribe {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle: { remove: () => Promise<void> } | null = null;
  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    try {
      const url = new URL(event.url);
      // Universal Link: hangel.org.tr/ngo/abc → /ngo/abc
      // Custom Scheme: hangel://ngo/abc → /ngo/abc (host yoksa pathname'i topla)
      const path = url.pathname && url.pathname !== '/'
        ? `${url.pathname}${url.search}${url.hash}`
        : `/${url.host}${url.search}${url.hash}`;
      if (path && path.startsWith('/')) {
        navigate(path);
      }
    } catch {
      // malformed url — yok say
    }
  }).then(h => { handle = h; });

  return () => { if (handle) void handle.remove(); };
}
