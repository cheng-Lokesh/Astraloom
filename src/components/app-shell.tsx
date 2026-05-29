"use client";

import Link from "next/link";

import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PageContainer } from "@/components/ui-foundation";
import { BRAND_NAME } from "@/lib/brand";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/app/dashboard", en: "Dashboard", zh: "仪表盘" },
  { href: "/app/new/scene", en: "New run", zh: "新沙盘" },
  { href: "/app/new/people", en: "People", zh: "人物" },
  { href: "/app/new/agents", en: "Agents", zh: "Agent" },
  { href: "/app/new/graph", en: "Graph", zh: "关系图" },
  { href: "/app/simulation/running", en: "Simulation", zh: "推演" },
  { href: "/app/simulation/result", en: "Result", zh: "结果" },
  { href: "/app/archive", en: "Archive", zh: "归档" },
  { href: "/app/billing", en: "Billing", zh: "解锁" },
  { href: "/app/settings", en: "Settings", zh: "设置" },
  { href: "/app/support", en: "Support", zh: "支持" },
  { href: "/app/admin", en: "Admin", zh: "管理" },
];

export function AppShell({ children }: AppShellProps) {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--mf-ink)]">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-[var(--background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4">
          <Link href="/app/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#11150f] text-sm font-semibold tracking-tight text-white">
              AL
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f766b]">
                {BRAND_NAME}
              </span>
              <span className="block truncate text-[15px] font-semibold text-[#11150f]">
                {locale === "zh" ? "动态沙盘推演器" : "AI Life Simulator"}
              </span>
            </span>
          </Link>

          <nav className="flex max-w-[74vw] shrink-0 items-center gap-1 overflow-x-auto rounded-md border border-black/8 bg-white/84 p-1 shadow-[0_12px_40px_rgba(17,21,15,0.05)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-[#52594d] transition hover:bg-[#11150f] hover:text-white"
              >
                {item[locale]}
              </Link>
            ))}
            <div className="ml-1 border-l border-black/8 pl-1">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <main>
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
