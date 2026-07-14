'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, languages } from '@/lib/translations';
import { EVENTS, logHangelEvent } from '@/lib/analytics';

interface LanguageContextValue {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isHydrated: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export { languages };

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('tr');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app-language') as Language;
    if (saved && translations[saved]) {
      // Kullanıcının açık tercihi her zaman önce gelir.
      setLanguage(saved);
    } else if (typeof navigator !== 'undefined' && navigator.language) {
      // Kayıtlı tercih yoksa tarayıcı/cihaz dilini kullan (kullanıcının dili).
      // 'en-US' → 'en'. Desteklenmiyorsa 'tr'de kalır.
      const browser = navigator.language.split('-')[0] as Language;
      if (browser && translations[browser]) {
        setLanguage(browser);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      const isRtl = language === 'ar' || language === 'fa';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    }
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
    // Analytics: dil tercihi değişimi — kullanıcı segment'i için.
    logHangelEvent(EVENTS.change_language, { language: lang });
  };

  const t = (key: string) => {
    const keys = key.split('.');
    const lookup = (lang: Language) => {
      let result = translations[lang];
      for (const k of keys) {
        result = result?.[k];
      }
      // P2-5d: empty strings ("yet untranslated") fall through instead of rendering
      // blank. Real intentionally-blank values are not used in this codebase.
      return typeof result === 'string' && result.length > 0 ? result : undefined;
    };
    // Fallback zinciri: seçili dil → İNGİLİZCE → Türkçe → anahtar.
    // (Samara m.3) Kısmen çevrilmiş dillerde (ru/ar/fa/es/ha) eksik anahtar artık
    // Türkçe yerine İNGİLİZCE'ye düşer — çok dilli kullanıcı için çok daha tutarlı
    // bir deneyim (Arapça + İngilizce karışımı, Arapça + Türkçe'den iyidir).
    // en %100 dolu değilse tr devreye girer, böylece asla ham "key" görünmez.
    return lookup(language) ?? lookup('en') ?? lookup('tr') ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isHydrated }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
