"use client";

import { languageOptions } from "@/lib/i18n";

import { useLanguage } from "./language-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      aria-label="Language selector"
      className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1"
    >
      {languageOptions.map((option) => {
        const active = option.locale === locale;

        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => setLocale(option.locale)}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
              active
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-white hover:text-slate-950"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
