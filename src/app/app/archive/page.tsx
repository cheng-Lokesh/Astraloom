import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ArchiveHistoryClient } from "./archive-history-client";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (!auth.user?.id) {
    return (
      <AppShell>
        <main id="main-content" className="mx-auto w-full max-w-6xl py-12">
          <section className="border-y border-white/10 py-12">
            <p className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">Account History</p>
            <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">登录后查看账户历史</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">History 只读取当前账户已经完成的正式 Run。</p>
            {supabase ? <Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded bg-[var(--evidence-gold)] px-4 py-3 text-sm font-semibold text-black transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">前往登录</Link> : <p role="alert" className="mt-6 text-sm leading-7 text-[var(--risk-red)]">登录服务尚未配置，暂时不能读取账户历史。</p>}
          </section>
        </main>
      </AppShell>
    );
  }

  return <ArchiveHistoryClient timeUnavailableLabel="时间不可用" />;
}
