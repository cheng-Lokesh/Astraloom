"use client";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { isSupabaseConfigured } from "@/lib/env";

import { LoginForm } from "./login-form";

const loginCopy = {
  en: {
    authReady: "Auth ready",
    setupRequired: "Setup required",
    title: "Sign in to the MiroFish workspace",
    body: "This shell uses Supabase magic-link auth. Until `.env.local` is configured, the page stays in setup mode and will not send email.",
  },
  zh: {
    authReady: "登录已就绪",
    setupRequired: "需要先配置",
    title: "登录 MiroFish 工作区",
    body: "当前登录页使用 Supabase magic-link auth。配置 `.env.local` 前，页面会保持 setup 模式，不会发送邮件。",
  },
};

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const { locale } = useLanguage();
  const copy = loginCopy[locale];

  return (
    <AppShell>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <StatusPill tone={configured ? "ready" : "blocked"}>
              {configured ? copy.authReady : copy.setupRequired}
            </StatusPill>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{copy.body}</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </section>
      </div>
    </AppShell>
  );
}
