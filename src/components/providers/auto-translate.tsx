'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/components/providers/language-provider';

// =============================================================================
// DEPRECATED — TASK P3-1 (partial). Spawn task P3-1b for full removal.
// =============================================================================
// This provider integrates the Google Translate widget as a fallback translation
// layer for strings NOT yet in `src/lib/translations.ts`. As more strings are
// migrated to native i18n (P2-5, P2-5b ongoing), this becomes unnecessary.
//
// REMOVAL CHECKLIST (must be completed before deleting this file):
//   1. All user-visible strings across `src/app/**` and `src/components/**`
//      must be wrapped in `useTranslation().t(...)` with keys in
//      `src/lib/translations.ts` for all supported languages (tr/en/ru/ar/fa/es/ha).
//   2. No JSX literal Turkish text remains in render paths (grep for common TR words).
//   3. Verify language switcher works without reloading the page.
//   4. Then: remove <AutoTranslate /> from `src/app/layout.tsx`, delete this file.
//
// WHY THE Node.prototype PATCH IS HERE:
//   Google Translate wraps text nodes with <font> elements at runtime. React's
//   reconciler then tries to removeChild / insertBefore nodes that have been
//   reparented by Google, and throws:
//     NotFoundError: Failed to execute 'removeChild' on 'Node'
//   The patch wraps these two methods so a mismatched parentNode is handled
//   gracefully instead of throwing. This is a well-known workaround:
//     https://github.com/facebook/react/issues/11538
//   It is NOT cosmetic / NOT removable while Google Translate is active.
// =============================================================================

let domPatched = false;
function patchDomMethodsForGoogleTranslate() {
  if (domPatched) return;
  if (typeof Node === 'undefined' || !Node.prototype) return;
  const origRemoveChild = Node.prototype.removeChild;
  // @ts-ignore — runtime patch (see deprecation notice above)
  Node.prototype.removeChild = function (...args: [Node]) {
    const child = args[0] as Node & { parentNode?: Node | null };
    if (child?.parentNode !== this) {
      if (child?.parentNode) return child.parentNode.removeChild(child);
      return child;
    }
    // @ts-ignore
    return origRemoveChild.apply(this, args);
  };
  const origInsertBefore = Node.prototype.insertBefore;
  // @ts-ignore — runtime patch (see deprecation notice above)
  Node.prototype.insertBefore = function (...args: [Node, Node | null]) {
    const [newNode, refNode] = args;
    const ref = refNode as (Node & { parentNode?: Node | null }) | null;
    if (ref && ref.parentNode !== this) {
      // @ts-ignore
      return origInsertBefore.call(this, newNode, null);
    }
    // @ts-ignore
    return origInsertBefore.apply(this, args);
  };
  domPatched = true;
}

// Google Translate widget'ını yükler ve seçilen dile göre tüm sayfa içeriğini
// canlı olarak çevirir. Türkçe seçiliyse çeviri devre dışı bırakılır.
//
// Çalışma mantığı:
//   - googtrans cookie'sine /tr/<hedefDil> yazar
//   - script'i sayfaya ekler ve gizli widget div'ini render eder
//   - dil değişince cookie'yi günceller ve sayfayı reload eder
//     (Google Translate runtime cookie'yi okuyup yeniden başlar)

const GTRANSLATE_LANG_MAP: Record<string, string> = {
  tr: 'tr',
  en: 'en',
  ru: 'ru',
  ar: 'ar',
  fa: 'fa',
  es: 'es',
  ha: 'ha',
};

const setCookie = (name: string, value: string, domain?: string) => {
  const exp = new Date();
  exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
  let cookie = `${name}=${value}; expires=${exp.toUTCString()}; path=/`;
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
};

const deleteCookie = (name: string, domain?: string) => {
  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
};

export default function AutoTranslate() {
  const { language, isHydrated } = useTranslation();

  useEffect(() => {
    // Hydration'dan önce cookie'ye dokunma — aksi halde localStorage'dan
    // okunan dilden önce 'tr' default'u ile cookie silinir, sonsuz reload döngüsüne girer.
    if (!isHydrated) return;

    // Türkçe dışında bir dil seçiliyse Google Translate DOM'u değiştireceği için
    // navigasyonda React'ın çakışmaması adına Node.prototype'ı patch'le.
    if ((GTRANSLATE_LANG_MAP[language] || 'tr') !== 'tr') {
      patchDomMethodsForGoogleTranslate();
    }

    const target = GTRANSLATE_LANG_MAP[language] || 'tr';
    const isTurkish = target === 'tr';
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const baseDomain = host.split('.').slice(-2).join('.'); // örn. {slug}.hangel.org -> hangel.org (cookie base domain, tüm alt alanlarda geçerli)

    // Mevcut cookie değerini oku
    const current = document.cookie.split('; ').find(r => r.startsWith('googtrans='))?.split('=')[1];
    const desired = isTurkish ? '' : `/tr/${target}`;

    if (current === desired || (isTurkish && !current)) {
      // Sadece widget'ı yükle, cookie değişmedi → reload yok
      ensureWidget(target);
      return;
    }

    // Cookie güncelle (hem host hem .domain için)
    if (isTurkish) {
      deleteCookie('googtrans');
      deleteCookie('googtrans', host);
      deleteCookie('googtrans', `.${baseDomain}`);
    } else {
      setCookie('googtrans', desired);
      if (host) setCookie('googtrans', desired, host);
      if (baseDomain) setCookie('googtrans', desired, `.${baseDomain}`);
    }
    // Reload — Google runtime cookie'yi okuyup hedef dile çevirir
    window.location.reload();
  }, [language, isHydrated]);

  return (
    <>
      {/* Google Translate banner ve frame'lerini gizle */}
      <style jsx global>{`
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .goog-tooltip, .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        font[style*="background-color"] { background: transparent !important; }
        #google_translate_element { display: none !important; }
      `}</style>
      <div id="google_translate_element" aria-hidden="true" />
    </>
  );
}

function ensureWidget(target: string) {
  if (target === 'tr') return;
  if (document.getElementById('google-translate-script')) return;

  type TranslateElementConstructor = new (
    options: {
      pageLanguage: string;
      includedLanguages: string;
      autoDisplay: boolean;
      layout?: unknown;
    },
    elementId: string,
  ) => unknown;
  interface GoogleTranslateGlobal {
    google?: {
      translate?: {
        TranslateElement?: TranslateElementConstructor & {
          InlineLayout?: { SIMPLE?: unknown };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
  const w = window as unknown as GoogleTranslateGlobal;
  w.googleTranslateElementInit = function () {
    const TranslateElement = w.google?.translate?.TranslateElement;
    if (!TranslateElement) return;
    new TranslateElement(
      {
        pageLanguage: 'tr',
        includedLanguages: 'en,ru,ar,fa,es,ha',
        autoDisplay: false,
        layout: TranslateElement.InlineLayout?.SIMPLE,
      },
      'google_translate_element',
    );
  };

  const script = document.createElement('script');
  script.id = 'google-translate-script';
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}
