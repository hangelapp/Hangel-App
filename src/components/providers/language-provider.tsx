'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, languages } from '@/lib/translations';

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
      setLanguage(saved);
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
  };

  const t = (key: string) => {
    const keys = key.split('.');
    const lookup = (lang: Language) => {
      let result = translations[lang];
      for (const k of keys) {
        result = result?.[k];
      }
      // P2-5d: empty strings ("yet untranslated") fall through to the TR fallback
      // instead of rendering blank. Real intentionally-blank values are not used in this codebase.
      return typeof result === 'string' && result.length > 0 ? result : undefined;
    };
    return lookup(language) ?? lookup('tr') ?? key;
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
