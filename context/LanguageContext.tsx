'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load language preference from localStorage
    const saved = localStorage.getItem('ittehad_app_lang') as Language;
    if (saved === 'en' || saved === 'ur') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ittehad_app_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ur' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    const currentDict = translations[language] || translations.en;
    return currentDict[key] || translations.en[key] || key;
  };

  const isRTL = language === 'ur';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL }}>
      <div className={language === 'ur' ? 'font-sans urdu-mode' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
