"use client";

import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/new/scene", label: "New run" },
  { href: "/app/new/people", label: "People" },
  { href: "/app/new/agents", label: "Agents" },
  { href: "/app/new/graph", label: "Graph" },
  { href: "/app/simulation/running", label: "Simulation" },
  { href: "/app/simulation/result", label: "Result" },
  { href: "/app/archive", label: "Archive" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" },
  { href: "/app/support", label: "Support" },
  { href: "/app/admin", label: "Admin" },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#11150f]">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-[#f7f8f4]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4">
          <Link href="/app/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#11150f] text-sm font-semibold tracking-tight text-white">
              MF
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f766b]">
                MiroFish
              </span>
              <span className="block truncate text-[15px] font-semibold text-[#11150f]">
                AI Life Simulator
              </span>
            </span>
          </Link>

          <nav className="flex max-w-[74vw] shrink-0 items-center gap-1 overflow-x-auto rounded-md border border-black/8 bg-white/80 p-1 shadow-[0_12px_40px_rgba(17,21,15,0.05)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-[#52594d] transition hover:bg-[#11150f] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="ml-1 border-l border-black/8 pl-1">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">{children}</main>
    </div>
  );
}
