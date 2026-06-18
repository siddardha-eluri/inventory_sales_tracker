"use client";

import React, { createContext, useState, useEffect, useMemo } from 'react';
import { en, hi, te } from '@/locales';

type Language = 'en' | 'hi' | 'te';
type Translations = typeof en;

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
}

export const I18nContext = createContext<I18nContextType | null>(null);

const translationsMap = { en, hi, te };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('shopstock-lang') as Language;
    if (storedLang && ['en', 'hi', 'te'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('shopstock-lang', lang);
  };

  const currentTranslations = useMemo(() => translationsMap[language], [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, translations: currentTranslations }}>
      {children}
    </I18nContext.Provider>
  );
}
