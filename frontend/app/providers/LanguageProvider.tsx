'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import commonEn from '@/public/locales/en/common.json';
import dashboardEn from '@/public/locales/en/dashboard.json';
import complaintsEn from '@/public/locales/en/complaints.json';

import commonHi from '@/public/locales/hi/common.json';
import dashboardHi from '@/public/locales/hi/dashboard.json';
import complaintsHi from '@/public/locales/hi/complaints.json';

import commonGu from '@/public/locales/gu/common.json';
import dashboardGu from '@/public/locales/gu/dashboard.json';
import complaintsGu from '@/public/locales/gu/complaints.json';

export type Language = 'en' | 'hi' | 'gu';

export type Namespace =
  | 'common'
  | 'dashboard'
  | 'complaints';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, namespace?: Namespace, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<Namespace, Record<string, any>>> = {
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    complaints: complaintsEn,
  },
  hi: {
    common: commonHi,
    dashboard: dashboardHi,
    complaints: complaintsHi,
  },
  gu: {
    common: commonGu,
    dashboard: dashboardGu,
    complaints: complaintsGu,
  },
};

const getNestedValue = (obj: any, path: string): string | undefined => {
  if (!obj) return undefined;

  const keys = path.split('.');

  let value = obj;

  for (const key of keys) {
    if (
      value &&
      typeof value === 'object' &&
      Object.prototype.hasOwnProperty.call(value, key)
    ) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return typeof value === 'string' ? value : undefined;
};

const applyLanguageToDocument = (lang: Language) => {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-language', lang);
};

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');

    const selectedLanguage: Language =
      savedLanguage === 'hi'
        ? 'hi'
        : savedLanguage === 'gu'
        ? 'gu'
        : 'en';

    setLanguageState(selectedLanguage);
    applyLanguageToDocument(selectedLanguage);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    applyLanguageToDocument(language);
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);

    localStorage.setItem('language', lang);

    applyLanguageToDocument(lang);
  };

  const t = (
    key: string,
    namespace: Namespace = 'common',
    fallbackText?: string
  ): string => {
    const currentNamespace = translations[language]?.[namespace];
    const englishNamespace = translations.en?.[namespace];

    const translated = getNestedValue(currentNamespace, key);

    if (translated) {
      return translated;
    }

    const fallback = getNestedValue(englishNamespace, key);

    if (fallback) {
      return fallback;
    }

    console.warn(
      `[Translation Missing] ${namespace}.${key} (${language})`
    );

    return fallbackText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used within a LanguageProvider'
    );
  }

  return context;
}