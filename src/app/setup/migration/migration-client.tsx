"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SupabaseMigrationPayload } from "@/types/supabase-migration";

type MigrationClientPageProps = {
  migration: SupabaseMigrationPayload;
};

const migrationCopy = {
  en: {
    title: "Supabase migration SQL",
    status: "Copy into SQL Editor",
    body: "This is the exact MVP schema migration that must be run in Supabase before login sync can be verified. It contains no secrets.",
    warning:
      "Run this in Supabase SQL Editor for your project. Do not enable service-role, AI, or Stripe flags while doing this step.",
    file: "File",
    lines: "Lines",
    tables: "Tables",
    policies: "Policies",
    rls: "RLS enabled",
    copy: "Copy SQL",
    copied: "Copied",
    copyFailed: "Copy failed",
    sqlTitle: "Migration SQL",
    instructionsTitle: "Execution order",
    instructions: [
      "Open your Supabase project dashboard.",
      "Open SQL Editor and create a new query.",
      "Paste the full SQL from this page.",
      "Run it once and confirm all tables and policies are created.",
      "Return to /setup and continue with Auth redirect configuration.",
    ],
    openSetup: "Back to setup",
    openSync: "Open sync",
    openQa: "Open QA",
  },
  zh: {
    title: "Supabase Migration SQL",
    status: "复制到 SQL Editor",
    body: "这是登录同步验收前必须在 Supabase 中执行的 MVP schema migration。里面不包含任何密钥。",
    warning:
      "请在你的 Supabase 项目 SQL Editor 中运行它。本步骤期间不要启用 service-role、AI 或 Stripe 开关。",
    file: "文件",
    lines: "行数",
    tables: "数据表",
    policies: "Policies",
    rls: "RLS 启用",
    copy: "复制 SQL",
    copied: "已复制",
    copyFailed: "复制失败",
    sqlTitle: "Migration SQL",
    instructionsTitle: "执行顺序",
    instructions: [
      "打开你的 Supabase 项目 Dashboard。",
      "进入 SQL Editor，新建一个 query。",
      "复制并粘贴本页完整 SQL。",
      "运行一次，并确认所有表和 policy 创建成功。",
      "回到 /setup，继续配置 Auth 跳转地址。",
    ],
    openSetup: "返回设置",
    openSync: "打开同步",
    openQa: "打开 QA",
  },
} as const;

export function MigrationClientPage({ migration }: MigrationClientPageProps) {
  const { locale } = useLanguage();
  const copy = migrationCopy[locale];
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function copySql() {
    try {
      await navigator.clipboard.writeText(migration.sql);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </div>
        <StatusPill tone="planned">{copy.status}</StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.warning}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">
                {copy.sqlTitle}
              </h2>
              <button
                type="button"
                onClick={copySql}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copyState === "copied"
                  ? copy.copied
                  : copyState === "failed"
                    ? copy.copyFailed
                    : copy.copy}
              </button>
            </div>
            <pre className="max-h-[620px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
              <code>{migration.sql}</code>
            </pre>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.file}
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">{copy.file}</dt>
                <dd className="mt-1 break-all leading-6 text-slate-600">
                  {migration.filePath}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.lines}</dt>
                <dd className="mt-1 text-slate-600">{migration.lineCount}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.tables}</dt>
                <dd className="mt-1 text-slate-600">{migration.tableCount}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.policies}
                </dt>
                <dd className="mt-1 text-slate-600">{migration.policyCount}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{copy.rls}</dt>
                <dd className="mt-1 text-slate-600">
                  {migration.rlsEnabledCount}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.instructionsTitle}
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
              {copy.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/setup"
                className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
              >
                {copy.openSetup}
              </Link>
              <Link
                href="/sync"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openSync}
              </Link>
              <Link
                href="/qa"
                className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.openQa}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
