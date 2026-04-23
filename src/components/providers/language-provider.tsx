'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, languages } from '@/lib/translations';

const LanguageContext = createContext<any>(null);

export { languages };

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('tr');

  useEffect(() => {
    const saved = localStorage.getItem('app-language') as Language;
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
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
      return typeof result === 'string' ? result : undefined;
    };
    return lookup(language) ?? lookup('tr') ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
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
