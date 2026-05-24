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
    body: "Run these migrations in order before real login sync and evidence-chain persistence are verified. The SQL contains no secrets and does not enable service-role writers.",
    warning:
      "Use Supabase SQL Editor for your project. Keep service-role, AI, Stripe, and report unlock gates disabled while doing this step.",
    file: "File",
    files: "Migration files",
    lines: "Lines",
    tables: "Tables",
    policies: "Policies",
    rls: "RLS enabled",
    copy: "Copy all SQL",
    copied: "Copied",
    copyFailed: "Copy failed",
    sqlTitle: "Combined migration SQL",
    instructionsTitle: "Execution order",
    instructions: [
      "Open your Supabase project dashboard.",
      "Open SQL Editor and create a new query.",
      "Paste the full combined SQL from this page.",
      "Run it once. The migrations are idempotent and ordered by filename.",
      "Return to /setup and verify the remote schema check.",
    ],
    openSetup: "Back to setup",
    openSync: "Open sync",
    openQa: "Open QA",
  },
  zh: {
    title: "Supabase 迁移 SQL",
    status: "复制到 SQL Editor",
    body: "在验证真实登录同步和证据链持久化之前，先按顺序执行这些迁移。SQL 不包含密钥，也不会开启 service-role 写入器。",
    warning:
      "请在你的 Supabase 项目 SQL Editor 中执行。此阶段继续关闭 service-role、AI、Stripe 和报告解锁闸门。",
    file: "文件",
    files: "迁移文件",
    lines: "行数",
    tables: "数据表",
    policies: "Policies",
    rls: "RLS 启用",
    copy: "复制全部 SQL",
    copied: "已复制",
    copyFailed: "复制失败",
    sqlTitle: "合并后的迁移 SQL",
    instructionsTitle: "执行顺序",
    instructions: [
      "打开你的 Supabase 项目 Dashboard。",
      "进入 SQL Editor，新建一个 query。",
      "复制并粘贴本页完整 SQL。",
      "运行一次。迁移按文件名排序，且设计为可重复执行。",
      "回到 /setup，继续验证远程 schema 检查。",
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
          <StatusPill tone="planned">{copy.status}</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            {copy.body}
          </p>
        </div>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.warning}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#11150f]">
                {copy.sqlTitle}
              </h2>
              <button
                type="button"
                onClick={copySql}
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
              >
                {copyState === "copied"
                  ? copy.copied
                  : copyState === "failed"
                    ? copy.copyFailed
                    : copy.copy}
              </button>
            </div>
            <pre className="max-h-[620px] overflow-auto rounded-md border border-black/10 bg-[#11150f] p-4 text-xs leading-5 text-white/86">
              <code>{migration.sql}</code>
            </pre>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-base font-semibold text-[#11150f]">
              {copy.files}
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-[#11150f]">{copy.file}</dt>
                <dd className="mt-1 break-all leading-6 text-[#62695d]">
                  {migration.filePath}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#11150f]">{copy.lines}</dt>
                <dd className="mt-1 text-[#62695d]">{migration.lineCount}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#11150f]">{copy.tables}</dt>
                <dd className="mt-1 text-[#62695d]">{migration.tableCount}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#11150f]">
                  {copy.policies}
                </dt>
                <dd className="mt-1 text-[#62695d]">{migration.policyCount}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#11150f]">{copy.rls}</dt>
                <dd className="mt-1 text-[#62695d]">
                  {migration.rlsEnabledCount}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2 border-t border-black/8 pt-4">
              {migration.migrations.map((file) => (
                <div
                  key={file.filePath}
                  className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
                >
                  <code className="block break-all text-xs text-[#62695d]">
                    {file.filePath}
                  </code>
                  <div className="mt-2 text-xs text-[#7d8578]">
                    {file.tableCount} tables / {file.policyCount} policies
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-base font-semibold text-[#11150f]">
              {copy.instructionsTitle}
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[#62695d]">
              {copy.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-5">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/setup"
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                {copy.openSetup}
              </Link>
              <Link
                href="/sync"
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                {copy.openSync}
              </Link>
              <Link
                href="/qa"
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
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
