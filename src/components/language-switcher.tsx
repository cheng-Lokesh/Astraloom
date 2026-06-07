"use client";

import { languageOptions } from "@/lib/i18n";

import { useLanguage } from "./language-provider";

export function LanguageSwitcher() {
  const { displayLocale, setLocale } = useLanguage();
  const current =
    languageOptions.find((option) => option.locale === displayLocale) ??
    languageOptions[0];

  return (
    <details className="group relative">
      <summary
        aria-label="Language selector"
        className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-[rgba(84,230,255,0.18)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-[0_10px_32px_rgba(0,0,0,0.16)] transition hover:border-[rgba(84,230,255,0.34)] hover:bg-[rgba(84,230,255,0.08)] [&::-webkit-details-marker]:hidden"
      >
        <span className="grid h-5 w-5 place-items-center rounded border border-[rgba(84,230,255,0.2)] text-[10px] text-[var(--signal-cyan)]">
          文
        </span>
        <span className="hidden sm:inline">{current.nativeLabel}</span>
        <span className="text-[var(--text-muted)]">▾</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 grid w-44 gap-1 rounded-md border border-[rgba(84,230,255,0.16)] bg-[rgba(5,11,22,0.98)] p-1.5 shadow-[0_18px_54px_rgba(0,0,0,0.38)]">
        {languageOptions.map((option) => {
          const active = option.locale === displayLocale;

          return (
            <button
              key={option.locale}
              type="button"
              onClick={() => setLocale(option.locale)}
              className={`flex items-center justify-between rounded px-2.5 py-2 text-left text-xs font-semibold transition ${
                active
                  ? "bg-[rgba(84,230,255,0.12)] text-[var(--signal-cyan)]"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{option.nativeLabel}</span>
              {active ? <span>✓</span> : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}
