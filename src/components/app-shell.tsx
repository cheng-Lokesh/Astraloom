"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedTextLayer } from "@/components/localized-text-layer";
import { PageContainer } from "@/components/ui-foundation";
import { BRAND_NAME } from "@/lib/brand";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/app/dashboard", en: "Home", zh: "首页" },
  { href: "/app/start", en: "Start", zh: "开始" },
  { href: "/app/simulation/running", en: "Sandbox", zh: "沙盘" },
  { href: "/app/simulation/result", en: "Result", zh: "结果" },
  { href: "/app/archive", en: "Archive", zh: "归档" },
  { href: "/app/settings", en: "Settings", zh: "设置" },
  { href: "/app/support", en: "Support", zh: "支持" },
];

export function AppShell({ children }: AppShellProps) {
  const { locale } = useLanguage();
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-[var(--mf-ink)]">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-[#fbfcf7]/88 shadow-[0_1px_0_rgba(255,255,255,0.72)_inset] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/app/dashboard"
            className="group flex min-w-0 items-center gap-3 rounded-md outline-none"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#11150f] text-sm font-semibold tracking-tight text-white shadow-[0_14px_30px_rgba(17,21,15,0.22)] transition group-hover:scale-[1.02]">
              AL
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f766b]">
                {BRAND_NAME}
              </span>
              <span className="block truncate text-[15px] font-semibold text-[#11150f]">
                {locale === "zh" ? "动态沙盘推演器" : "Dynamic destiny sandbox"}
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-black/8 bg-white/82 p-1 shadow-[0_12px_42px_rgba(17,21,15,0.055)]"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                active={
                  pathname === item.href ||
                  (item.href !== "/app/dashboard" && pathname.startsWith(item.href))
                }
              >
                {item[locale]}
              </NavLink>
            ))}
            <div className="ml-1 shrink-0 border-l border-black/8 pl-1">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <main data-localized-app-root data-localized-pathname={pathname}>
        <LocalizedTextLayer />
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#11150f] text-white shadow-[0_8px_18px_rgba(17,21,15,0.16)]"
          : "text-[#52594d] hover:bg-[#eef5ee] hover:text-[#11150f]"
      }`}
    >
      {children}
    </Link>
  );
}
