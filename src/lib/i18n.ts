export type Locale = "en" | "zh";
export type AppLocale = Locale | "ja" | "ko" | "es" | "fr" | "de";

export const defaultLocale: AppLocale = "en";
export const localeStorageKey = "mirofish.locale";

export const languageOptions: Array<{
  label: string;
  nativeLabel: string;
  locale: AppLocale;
}> = [
  { label: "English", nativeLabel: "English", locale: "en" },
  { label: "Chinese", nativeLabel: "Chinese", locale: "zh" },
  { label: "Japanese", nativeLabel: "Japanese", locale: "ja" },
  { label: "Korean", nativeLabel: "Korean", locale: "ko" },
  { label: "Spanish", nativeLabel: "Spanish", locale: "es" },
  { label: "French", nativeLabel: "French", locale: "fr" },
  { label: "German", nativeLabel: "Deutsch", locale: "de" },
];

export function isAppLocale(value: string | null): value is AppLocale {
  return languageOptions.some((option) => option.locale === value);
}

export function baseLocale(locale: AppLocale): Locale {
  return locale === "zh" ? "zh" : "en";
}

export function htmlLang(locale: AppLocale) {
  const values: Record<AppLocale, string> = {
    zh: "zh-CN",
    en: "en",
    ja: "ja",
    ko: "ko",
    es: "es",
    fr: "fr",
    de: "de",
  };
  return values[locale];
}
