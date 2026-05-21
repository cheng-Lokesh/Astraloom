"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const callbackCopy = {
  en: {
    title: "Completing sign in",
    body: "The app is exchanging your Supabase magic-link code for a local browser session.",
    loading: "Checking login link",
    success: "Signed in. Redirecting to sync...",
    missingClient: "Supabase client could not be created.",
    missingCode:
      "No login code was found in this URL. Send a new magic link from /login.",
    linkError:
      "This magic link is invalid or expired. Send a new link from /login and use the latest email.",
    failed: "Sign-in failed",
  },
  zh: {
    title: "正在完成登录",
    body: "应用正在把 Supabase 魔法链接 code 换成本地浏览器会话。",
    loading: "正在检查登录链接",
    success: "已登录，正在跳转到同步页...",
    missingClient: "无法创建 Supabase 客户端。",
    missingCode: "当前 URL 没有登录 code。请回到 /login 重新发送魔法链接。",
    linkError: "这个魔法链接无效或已过期。请回到 /login 重新发送，并使用最新邮件。",
    failed: "登录失败",
  },
} as const;

export default function AuthCallbackPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = callbackCopy[locale];
  const [message, setMessage] = useState<string>(copy.loading);
  const [tone, setTone] = useState<"ready" | "blocked" | "planned">("planned");

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        setTone("blocked");
        setMessage(copy.missingClient);
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = url.searchParams.get("next") || "/sync";
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const callbackError =
        url.searchParams.get("error_description") ||
        hashParams.get("error_description") ||
        url.searchParams.get("error") ||
        hashParams.get("error");

      if (callbackError) {
        if (!active) {
          return;
        }

        setTone("blocked");
        setMessage(`${copy.linkError} (${callbackError})`);
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (!active) {
            return;
          }

          setTone("blocked");
          setMessage(`${copy.failed}: ${error.message}`);
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (!active) {
            return;
          }

          setTone("blocked");
          setMessage(`${copy.failed}: ${error.message}`);
          return;
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!active) {
            return;
          }

          setTone("blocked");
          setMessage(copy.missingCode);
          return;
        }
      }

      if (!active) {
        return;
      }

      setTone("ready");
      setMessage(copy.success);
      router.replace(next);
    }

    void completeSignIn();

    return () => {
      active = false;
    };
  }, [
    copy.failed,
    copy.linkError,
    copy.missingClient,
    copy.missingCode,
    copy.success,
    router,
  ]);

  return (
    <AppShell>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {copy.body}
        </p>
        <div className="mt-5">
          <StatusPill tone={tone}>{message}</StatusPill>
        </div>
      </section>
    </AppShell>
  );
}
