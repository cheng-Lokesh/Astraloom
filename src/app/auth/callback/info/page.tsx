import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";

export default function AuthCallbackInfoPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
        <StatusPill tone="planned">Auth callback</StatusPill>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
          Magic links open the callback route.
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#62695d]">
          The server route at <code>/auth/callback</code> exchanges the auth
          code for a Supabase SSR cookie session. This page is only a human
          readable fallback for callback errors and setup notes.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
        >
          Back to login
        </Link>
      </section>
    </AppShell>
  );
}
