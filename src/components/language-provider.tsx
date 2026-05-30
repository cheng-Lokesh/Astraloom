"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { defaultLocale, localeStorageKey, type Locale } from "@/lib/i18n";

export type LatinFontPreference = "modern" | "system" | "serif";
export type ChineseFontPreference = "system" | "hei" | "song";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  latinFont: LatinFontPreference;
  setLatinFont: (font: LatinFontPreference) => void;
  chineseFont: ChineseFontPreference;
  setChineseFont: (font: ChineseFontPreference) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const localeChangeEvent = "mirofish.locale-change";
const fontChangeEvent = "mirofish.font-change";
const latinFontStorageKey = "mirofish.font.latin";
const chineseFontStorageKey = "mirofish.font.zh";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const stored = window.localStorage.getItem(localeStorageKey);
  if (stored === "en" || stored === "zh") {
    return stored;
  }

  return defaultLocale;
}

function subscribeToLocaleChange(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(localeChangeEvent, callback);
  window.addEventListener(fontChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(localeChangeEvent, callback);
    window.removeEventListener(fontChangeEvent, callback);
  };
}

function readStoredLatinFont(): LatinFontPreference {
  if (typeof window === "undefined") return "modern";

  const stored = window.localStorage.getItem(latinFontStorageKey);
  if (stored === "modern" || stored === "system" || stored === "serif") {
    return stored;
  }

  return "modern";
}

function readStoredChineseFont(): ChineseFontPreference {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(chineseFontStorageKey);
  if (stored === "system" || stored === "hei" || stored === "song") {
    return stored;
  }

  return "system";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocaleChange,
    readStoredLocale,
    () => defaultLocale,
  );
  const latinFont = useSyncExternalStore(
    subscribeToLocaleChange,
    readStoredLatinFont,
    (): LatinFontPreference => "modern",
  );
  const chineseFont = useSyncExternalStore(
    subscribeToLocaleChange,
    readStoredChineseFont,
    (): ChineseFontPreference => "system",
  );
  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(localeStorageKey, nextLocale);
    window.dispatchEvent(new Event(localeChangeEvent));
  }, []);
  const setLatinFont = useCallback((nextFont: LatinFontPreference) => {
    window.localStorage.setItem(latinFontStorageKey, nextFont);
    window.dispatchEvent(new Event(fontChangeEvent));
  }, []);
  const setChineseFont = useCallback((nextFont: ChineseFontPreference) => {
    window.localStorage.setItem(chineseFontStorageKey, nextFont);
    window.dispatchEvent(new Event(fontChangeEvent));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.latinFont = latinFont;
    document.documentElement.dataset.zhFont = chineseFont;
  }, [latinFont, chineseFont]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      latinFont,
      setLatinFont,
      chineseFont,
      setChineseFont,
    }),
    [chineseFont, latinFont, locale, setChineseFont, setLatinFont, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
