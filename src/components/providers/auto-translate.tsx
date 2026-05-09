'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/components/providers/language-provider';

// Google Translate, sayfadaki metinleri <font> etiketlerine sarar. Bu işlem
// React'ın virtual DOM kayıtlarıyla çakışır; navigasyon sırasında React,
// "kendi child'ı olmayan" bir node'u kaldırmaya çalışır ve şu hatayı atar:
//   NotFoundError: Failed to execute 'removeChild' on 'Node'
// Bu hatadan kaçınmak için Node.prototype.removeChild ve insertBefore'u bir kere
// patch'liyoruz: parent eşleşmiyorsa sessizce fallback davranış uyguluyoruz.
// Ref: https://github.com/facebook/react/issues/11538
let domPatched = false;
function patchDomMethodsForGoogleTranslate() {
  if (domPatched) return;
  if (typeof Node === 'undefined' || !Node.prototype) return;
  const origRemoveChild = Node.prototype.removeChild;
  // @ts-ignore — runtime patch
  Node.prototype.removeChild = function (child: any) {
    if (child?.parentNode !== this) {
      if (child?.parentNode) return child.parentNode.removeChild(child);
      return child;
    }
    // @ts-ignore
    return origRemoveChild.apply(this, arguments as any);
  };
  const origInsertBefore = Node.prototype.insertBefore;
  // @ts-ignore — runtime patch
  Node.prototype.insertBefore = function (newNode: any, refNode: any) {
    if (refNode && refNode.parentNode !== this) {
      // @ts-ignore
      return origInsertBefore.call(this, newNode, null);
    }
    // @ts-ignore
    return origInsertBefore.apply(this, arguments as any);
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
    const baseDomain = host.split('.').slice(-2).join('.'); // hangel.org.tr -> org.tr (kabul edilebilir; alternatif: tam host)

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

  (window as any).googleTranslateElementInit = function () {
    if (!(window as any).google?.translate?.TranslateElement) return;
    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage: 'tr',
        includedLanguages: 'en,ru,ar,fa,es,ha',
        autoDisplay: false,
        layout: (window as any).google.translate.TranslateElement.InlineLayout?.SIMPLE,
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
