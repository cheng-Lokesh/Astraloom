export type Locale = "en" | "zh";
export type AppLocale = Locale | "ja" | "ko" | "es" | "fr" | "de";

export const defaultLocale: AppLocale = "zh";
export const localeStorageKey = "mirofish.locale";

export const languageOptions: Array<{
  label: string;
  nativeLabel: string;
  locale: AppLocale;
}> = [
  { label: "中文", nativeLabel: "中文", locale: "zh" },
  { label: "English", nativeLabel: "English", locale: "en" },
  { label: "日本語", nativeLabel: "日本語", locale: "ja" },
  { label: "한국어", nativeLabel: "한국어", locale: "ko" },
  { label: "Español", nativeLabel: "Español", locale: "es" },
  { label: "Français", nativeLabel: "Français", locale: "fr" },
  { label: "Deutsch", nativeLabel: "Deutsch", locale: "de" },
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
