"use client";

import { languageOptions } from "@/lib/i18n";

import { useLanguage } from "./language-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      aria-label="Language selector"
      className="grid grid-cols-2 rounded-md border border-black/8 bg-[#f7f8f4] p-1"
    >
      {languageOptions.map((option) => {
        const active = option.locale === locale;

        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => setLocale(option.locale)}
            className={`rounded px-2.5 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-[#11150f] text-white shadow-[0_6px_14px_rgba(17,21,15,0.16)]"
                : "text-[#62695d] hover:bg-white hover:text-[#11150f]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
