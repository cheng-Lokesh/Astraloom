import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { FormalIntakeClient } from "./formal-intake-client";

export const dynamic = "force-dynamic";

function IntakeLoginBoundary({ configured }: { configured: boolean }) {
  return (
    <AppShell>
      <main id="main-content" className="mx-auto w-full max-w-6xl py-12">
        <section className="border-y border-white/10 py-12">
          <p className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">
            Formal Seed / 正式处境
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">
            登录后继续正式录入
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            正式处境只会在登录账户中提交。确认提交前，此页不会创建正式 Seed 或进入 People。
          </p>
          {configured ? (
            <Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded bg-[var(--evidence-gold)] px-4 py-3 text-sm font-semibold text-black transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">
              前往登录
            </Link>
          ) : (
            <p role="alert" className="mt-6 text-sm leading-7 text-[var(--risk-red)]">
              登录服务尚未配置，暂时不能提交正式处境。
            </p>
          )}
        </section>
      </main>
    </AppShell>
  );
}

export default async function IntakePage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (!auth.user?.id) {
    return <IntakeLoginBoundary configured={Boolean(supabase)} />;
  }

  return (
    <AppShell>
      <FormalIntakeClient />
    </AppShell>
  );
}
