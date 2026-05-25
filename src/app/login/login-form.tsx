"use client";

import { useState } from "react";

import { useLanguage } from "@/components/language-provider";
import { appConfig, isSupabaseConfigured } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const formCopy = {
  en: {
    email: "Email",
    placeholder: "founder@example.com",
    submit: "Send magic link",
    sending: "Sending...",
    missingEnv: "Add Supabase URL and anon key to .env.local first.",
    clientError: "Supabase client could not be created.",
    sent: "Magic link sent. Check your email to continue.",
    rateLimited:
      "Email sending is rate limited. Wait before sending another magic link, then use only the newest email.",
  },
  zh: {
    email: "邮箱",
    placeholder: "founder@example.com",
    submit: "发送魔法链接",
    sending: "发送中...",
    missingEnv: "请先在 .env.local 中填写 Supabase URL 和 anon key。",
    clientError: "无法创建 Supabase 客户端。",
    sent: "魔法链接已发送，请检查邮箱继续。",
    rateLimited:
      "电子邮件发送已触发限流。请先等待一段时间再重新发送，并只使用最新邮件。",
  },
};

function getLoginErrorMessage(errorMessage: string, rateLimitedCopy: string) {
  const normalized = errorMessage.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("email rate") ||
    normalized.includes("over_email_send_rate_limit")
  ) {
    return rateLimitedCopy;
  }

  return errorMessage;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();
  const { locale } = useLanguage();
  const copy = formCopy[locale];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!configured) {
      setStatus("error");
      setMessage(copy.missingEnv);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setMessage(copy.clientError);
      return;
    }

    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appConfig.appUrl}/auth/callback?next=/app/dashboard`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(getLoginErrorMessage(error.message, copy.rateLimited));
      return;
    }

    setStatus("sent");
    setMessage(copy.sent);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          {copy.email}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.placeholder}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {status === "loading" ? copy.sending : copy.submit}
      </button>
      {message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            status === "sent"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
