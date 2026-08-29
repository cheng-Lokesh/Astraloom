"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedTextLayer } from "@/components/localized-text-layer";
import { PageContainer } from "@/components/ui-foundation";
import { BRAND_NAME } from "@/lib/brand";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/app/dashboard", label: "Home" },
  { href: "/app/start", label: "Start" },
  { href: "/app/simulation/running", label: "Progress" },
  { href: "/app/simulation/result", label: "Result" },
] as const;

const mobileFlowItems = navItems.slice(1);

const moreItems = [
  { href: "/app/archive", label: "History" },
  { href: "/app/settings", label: "Settings" },
  { href: "/app/support", label: "Help" },
  { href: "/app/new/scene", label: "Details" },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-cinematic-shell min-h-screen text-[var(--mf-ink)]">
      <div className="app-cinematic-scene" aria-hidden="true">
        <div className="app-scene-volume app-scene-volume-a" />
        <div className="app-scene-volume app-scene-volume-b" />
        <div className="app-scene-orbit app-scene-orbit-a" />
        <div className="app-scene-orbit app-scene-orbit-b" />
        <div className="app-scene-plane" />
        <div className="app-scene-particles" />
        <div className="app-scene-scan" />
      </div>
      <header className="app-cinematic-header sticky top-0 z-30 border-b border-[rgba(176,224,230,0.14)] bg-[rgba(5,5,5,0.82)] shadow-[0_1px_0_rgba(245,247,250,0.06)_inset] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/app/dashboard"
            className="group flex min-h-10 min-w-0 items-center gap-3 rounded-md outline-none"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[rgba(176,224,230,0.26)] bg-[rgba(176,224,230,0.09)] text-sm font-semibold tracking-tight text-[var(--signal-cyan)] shadow-[0_0_24px_rgba(176,224,230,0.1)] transition group-hover:scale-[1.02]">
              AL
            </span>
            <span className="min-w-0">
              <span
                data-brand-wordmark
                className="block text-[12px] uppercase text-[var(--text-secondary)]"
              >
                {BRAND_NAME}
              </span>
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                Evidence-linked life simulator
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2 lg:justify-end">
            <nav
              aria-label="Primary"
              className="hidden min-w-0 items-center gap-1 rounded-md border border-[rgba(176,224,230,0.14)] bg-[rgba(255,255,255,0.045)] p-1 shadow-[0_10px_32px_rgba(0,0,0,0.18)] md:flex"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={isActivePath(pathname, item.href)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <nav
              aria-label="Flow"
              className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-md border border-[rgba(176,224,230,0.14)] bg-[rgba(255,255,255,0.045)] p-1 shadow-[0_10px_32px_rgba(0,0,0,0.18)] md:hidden"
            >
              {mobileFlowItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={isActivePath(pathname, item.href)}
                  compact
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <MoreMenu pathname={pathname} />

            <div className="shrink-0 rounded-md border border-[rgba(176,224,230,0.14)] bg-[rgba(255,255,255,0.045)] p-1">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main
        key="app-shell"
        className="app-cinematic-main"
        data-localized-app-root
        data-localized-pathname={pathname}
      >
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
      className={`flex min-h-10 min-w-0 items-center justify-center whitespace-nowrap rounded px-3 py-2 text-center text-sm font-semibold transition-[background-color,color,transform] active:scale-95 ${
        active
          ? "bg-[rgba(176,224,230,0.12)] text-[var(--signal-cyan)] shadow-[0_0_18px_rgba(176,224,230,0.1)]"
          : "text-[var(--text-secondary)] hover:bg-[rgba(176,224,230,0.08)] hover:text-[var(--text-primary)]"
      } ${compact ? "px-2 text-xs sm:text-sm" : ""}`}
    >
      {children}
    </Link>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  return (
    <details className="relative shrink-0">
      <summary className="flex min-h-10 list-none items-center rounded-md border border-[rgba(176,224,230,0.14)] bg-[rgba(255,255,255,0.045)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] shadow-[0_10px_32px_rgba(0,0,0,0.18)] transition-[background-color,color,transform] active:scale-95 hover:bg-[rgba(176,224,230,0.08)] hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
        More
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-[rgba(176,224,230,0.14)] bg-[rgba(5,11,22,0.96)] p-2 shadow-[0_18px_54px_rgba(0,0,0,0.35)]">
        <div className="space-y-1">
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-10 items-center rounded px-3 py-2 text-sm font-semibold transition-[background-color,color,transform] active:scale-95 ${
                isActivePath(pathname, item.href)
                  ? "bg-[rgba(176,224,230,0.1)] text-[var(--signal-cyan)]"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
