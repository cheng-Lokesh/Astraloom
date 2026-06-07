"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedTextLayer } from "@/components/localized-text-layer";
import { PageContainer } from "@/components/ui-foundation";
import { BRAND_NAME } from "@/lib/brand";
import type { AppLocale } from "@/lib/i18n";

type AppShellProps = {
  children: React.ReactNode;
};

type ShellLabel = Record<AppLocale, string>;

const navItems = [
  {
    href: "/app/dashboard",
    label: {
      zh: "首页",
      en: "Home",
      ja: "ホーム",
      ko: "홈",
      es: "Inicio",
      fr: "Accueil",
      de: "Startseite",
    },
  },
  {
    href: "/app/start",
    label: {
      zh: "开始",
      en: "Start",
      ja: "開始",
      ko: "시작",
      es: "Empezar",
      fr: "Demarrer",
      de: "Start",
    },
  },
  {
    href: "/app/simulation/running",
    label: {
      zh: "进度",
      en: "Progress",
      ja: "進行状況",
      ko: "진행",
      es: "Progreso",
      fr: "Progression",
      de: "Fortschritt",
    },
  },
  {
    href: "/app/simulation/result",
    label: {
      zh: "结果",
      en: "Result",
      ja: "結果",
      ko: "결과",
      es: "Resultado",
      fr: "Resultat",
      de: "Ergebnis",
    },
  },
] as const;

const mobileFlowItems = navItems.slice(1);

const moreItems = [
  {
    href: "/app/archive",
    label: {
      zh: "历史",
      en: "History",
      ja: "履歴",
      ko: "기록",
      es: "Historial",
      fr: "Historique",
      de: "Verlauf",
    },
  },
  {
    href: "/app/settings",
    label: {
      zh: "设置",
      en: "Settings",
      ja: "設定",
      ko: "설정",
      es: "Ajustes",
      fr: "Parametres",
      de: "Einstellungen",
    },
  },
  {
    href: "/app/support",
    label: {
      zh: "帮助",
      en: "Help",
      ja: "ヘルプ",
      ko: "도움말",
      es: "Ayuda",
      fr: "Aide",
      de: "Hilfe",
    },
  },
  {
    href: "/app/new/scene",
    label: {
      zh: "详细结构",
      en: "Details",
      ja: "詳細",
      ko: "상세",
      es: "Detalles",
      fr: "Details",
      de: "Details",
    },
  },
] as const;

const shellCopy: {
  tagline: ShellLabel;
  more: ShellLabel;
} = {
  tagline: {
    zh: "帮你看清下一步",
    en: "Understand your next step",
    ja: "次の一歩を見通す",
    ko: "다음 단계를 더 선명하게",
    es: "Entiende tu proximo paso",
    fr: "Comprendre votre prochaine etape",
    de: "Den nachsten Schritt verstehen",
  },
  more: {
    zh: "更多",
    en: "More",
    ja: "その他",
    ko: "더보기",
    es: "Mas",
    fr: "Plus",
    de: "Mehr",
  },
};

export function AppShell({ children }: AppShellProps) {
  const { displayLocale } = useLanguage();
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-[var(--mf-ink)]">
      <header className="sticky top-0 z-30 border-b border-[rgba(84,230,255,0.14)] bg-[rgba(3,5,10,0.84)] shadow-[0_1px_0_rgba(245,247,250,0.06)_inset] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/app/dashboard"
            className="group flex min-w-0 items-center gap-3 rounded-md outline-none"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[rgba(84,230,255,0.24)] bg-[rgba(84,230,255,0.1)] text-sm font-semibold tracking-tight text-[var(--signal-cyan)] shadow-[0_0_24px_rgba(84,230,255,0.1)] transition group-hover:scale-[1.02]">
              AL
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                {BRAND_NAME}
              </span>
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                {shellCopy.tagline[displayLocale]}
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2 lg:justify-end">
            <nav
              aria-label="Primary"
              className="hidden min-w-0 items-center gap-1 rounded-md border border-[rgba(84,230,255,0.14)] bg-[rgba(255,255,255,0.045)] p-1 shadow-[0_10px_32px_rgba(0,0,0,0.18)] md:flex"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={isActivePath(pathname, item.href)}
                >
                  {item.label[displayLocale]}
                </NavLink>
              ))}
            </nav>

            <nav
              aria-label="Flow"
              className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-md border border-[rgba(84,230,255,0.14)] bg-[rgba(255,255,255,0.045)] p-1 shadow-[0_10px_32px_rgba(0,0,0,0.18)] md:hidden"
            >
              {mobileFlowItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={isActivePath(pathname, item.href)}
                  compact
                >
                  {item.label[displayLocale]}
                </NavLink>
              ))}
            </nav>

            <MoreMenu displayLocale={displayLocale} pathname={pathname} />

            <div className="shrink-0 rounded-md border border-[rgba(84,230,255,0.14)] bg-[rgba(255,255,255,0.045)] p-1">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main key={displayLocale} data-localized-app-root data-localized-pathname={pathname}>
        <LocalizedTextLayer />
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (pathname === "/" && href === "/app/dashboard") return true;
  return pathname === href || (href !== "/app/dashboard" && pathname.startsWith(href));
}

function NavLink({
  href,
  active,
  compact = false,
  children,
}: {
  href: string;
  active: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`min-w-0 whitespace-nowrap rounded px-3 py-2 text-center text-sm font-semibold transition ${
        active
          ? "bg-[rgba(84,230,255,0.12)] text-[var(--signal-cyan)] shadow-[0_0_18px_rgba(84,230,255,0.1)]"
          : "text-[var(--text-secondary)] hover:bg-[rgba(84,230,255,0.08)] hover:text-[var(--text-primary)]"
      } ${compact ? "px-2 text-xs sm:text-sm" : ""}`}
    >
      {children}
    </Link>
  );
}

function MoreMenu({
  displayLocale,
  pathname,
}: {
  displayLocale: AppLocale;
  pathname: string;
}) {
  return (
    <details className="relative shrink-0">
      <summary className="list-none rounded-md border border-[rgba(84,230,255,0.14)] bg-[rgba(255,255,255,0.045)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] shadow-[0_10px_32px_rgba(0,0,0,0.18)] transition hover:bg-[rgba(84,230,255,0.08)] hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
        {shellCopy.more[displayLocale]}
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-[rgba(84,230,255,0.14)] bg-[rgba(5,11,22,0.96)] p-2 shadow-[0_18px_54px_rgba(0,0,0,0.35)]">
        <div className="space-y-1">
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-3 py-2 text-sm font-semibold transition ${
                isActivePath(pathname, item.href)
                  ? "bg-[rgba(84,230,255,0.1)] text-[var(--signal-cyan)]"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label[displayLocale]}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
