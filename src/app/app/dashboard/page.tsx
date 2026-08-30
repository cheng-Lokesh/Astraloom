import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SandboxDashboardClient } from "./sandbox-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth.user?.id) return <AppShell><main id="main-content" className="mx-auto w-full max-w-6xl py-12"><section className="border-y border-white/10 py-12"><p className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">My Sandbox / 我的沙盘</p><h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">登录后查看我的沙盘</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">个人数字生命链只会从你的账户正式记录中读取，不会显示演示状态。</p><Link href="/login" className="mt-6 inline-flex min-h-10 items-center rounded bg-[var(--evidence-gold)] px-4 py-3 text-sm font-semibold text-black transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">前往登录</Link></section></main></AppShell>;
  return <AppShell><SandboxDashboardClient /></AppShell>;
}
