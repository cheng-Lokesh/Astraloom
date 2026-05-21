export type Locale = "en" | "zh";

export const defaultLocale: Locale = "en";
export const localeStorageKey = "mirofish.locale";

export const languageOptions: Array<{ label: string; locale: Locale }> = [
  { label: "EN", locale: "en" },
  { label: "中文", locale: "zh" },
];
