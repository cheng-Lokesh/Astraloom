"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type { SupabaseRemoteSchemaStatus } from "@/types/supabase-remote-schema";
import type {
  SupabaseSetupStatusPayload,
  SupabaseSetupStepId,
  SupabaseSetupStepStatus,
} from "@/types/supabase-setup";

type SupabaseSetupClientPageProps = {
  remoteSchema: SupabaseRemoteSchemaStatus;
  status: SupabaseSetupStatusPayload;
};

const setupCopy = {
  en: {
    title: "Supabase setup",
    statusReady: "Ready for auth sync",
    statusMissing: "Setup required",
    body: "This page checks whether the project is ready for real Supabase login and safe client-writable draft sync. It never displays secret values.",
    safety:
      "For this stage, keep service-role writes, AI generation, and Stripe writes disabled. Only magic-link login and user-authored draft sync should be tested.",
    configTitle: "Current configuration",
    stepsTitle: "Execution steps",
    gateTitle: "Dangerous gates",
    gateBody:
      "These must remain off until backend writer, cost, safety, and webhook behavior are reviewed.",
    yes: "Yes",
    no: "No",
    ready: "Ready",
    missing: "Missing",
    manual: "Manual",
    blocked: "Blocked",
    item: "Item",
    current: "Current state",
    detail: "Detail",
    appUrl: "App URL",
    supabaseUrl: "Supabase URL",
    supabaseAnon: "Supabase anon key",
    serviceRole: "Service role key",
    systemWriters: "System writers",
    aiGeneration: "AI generation",
    stripeWrites: "Stripe writes",
    migrationFile: "Migration file",
    remoteSchemaTitle: "Remote schema",
    remoteSchemaReady: "Remote schema present",
    remoteSchemaIncomplete: "Remote schema incomplete",
    remoteSchemaMissing: "Missing config",
    remoteSchemaAuthFailed: "Auth failed",
    remoteSchemaNetwork: "Network error",
    remoteTables: "Remote tables",
    docTitle: "Setup document",
    docPath: "docs/supabase-auth-sync-setup.md",
    envTitle: ".env.local target",
    envBody:
      "Create .env.local from .env.example, fill only the public Supabase URL and anon key, then restart the dev server.",
    migrationTitle: "Migration",
    migrationBody:
      "Run supabase/migrations/0001_mvp_core_schema.sql in Supabase SQL Editor before testing /sync.",
    authTitle: "Auth redirect",
    authBody:
      "Set Supabase Site URL to http://localhost:3000 and add http://localhost:3000/auth/callback as an allowed redirect URL.",
    openLogin: "Open login",
    openSync: "Open sync",
    openMigration: "Open migration SQL",
    openQa: "Open QA",
    openDashboard: "Back to dashboard",
    stepLabels: {
      env_file: ".env.local",
      public_keys: "Public Supabase keys",
      dangerous_flags: "Dangerous flags",
      migration: "Database migration",
      paid_beta_keys: "Paid Beta keys",
      auth: "Magic-link auth",
      sync: "Draft sync",
    },
  },
  zh: {
    title: "Supabase 设置",
    statusReady: "可以进行登录同步验收",
    statusMissing: "需要继续配置",
    body: "这个页面检查项目是否已经准备好进行真实 Supabase 登录和安全草稿同步。它不会显示任何密钥值。",
    safety:
      "当前阶段必须继续关闭 service-role 写入、AI 生成和 Stripe 写入。只测试魔法链接登录和用户草稿同步。",
    configTitle: "当前配置",
    stepsTitle: "执行步骤",
    gateTitle: "危险闸门",
    gateBody:
      "这些必须保持关闭，直到后端写入器、成本、安全和 webhook 行为都经过审查。",
    yes: "是",
    no: "否",
    ready: "已就绪",
    missing: "缺失",
    manual: "需人工",
    blocked: "已阻断",
    item: "项目",
    current: "当前状态",
    detail: "说明",
    appUrl: "App URL",
    supabaseUrl: "Supabase URL",
    supabaseAnon: "Supabase anon key",
    serviceRole: "Service role key",
    systemWriters: "系统写入",
    aiGeneration: "AI 生成",
    stripeWrites: "Stripe 写入",
    migrationFile: "Migration 文件",
    remoteSchemaTitle: "远端 Schema",
    remoteSchemaReady: "远端 schema 已存在",
    remoteSchemaIncomplete: "远端 schema 不完整",
    remoteSchemaMissing: "缺少配置",
    remoteSchemaAuthFailed: "认证失败",
    remoteSchemaNetwork: "网络错误",
    remoteTables: "远端数据表",
    docTitle: "设置文档",
    docPath: "docs/supabase-auth-sync-setup.md",
    envTitle: ".env.local 目标",
    envBody:
      "从 .env.example 创建 .env.local，只填写 Supabase 公开 URL 和 anon key，然后重启 dev server。",
    migrationTitle: "Migration",
    migrationBody:
      "测试 /sync 前，先在 Supabase SQL Editor 运行 supabase/migrations/0001_mvp_core_schema.sql。",
    authTitle: "Auth 跳转",
    authBody:
      "把 Supabase Site URL 设为 http://localhost:3000，并把 http://localhost:3000/auth/callback 加入允许跳转地址。",
    openLogin: "打开登录",
    openSync: "打开同步",
    openMigration: "打开 Migration SQL",
    openQa: "打开 QA",
    openDashboard: "返回工作台",
    stepLabels: {
      env_file: ".env.local",
      public_keys: "Supabase 公开配置",
      dangerous_flags: "危险开关",
      migration: "数据库 migration",
      paid_beta_keys: "付费 Beta 密钥",
      auth: "魔法链接登录",
      sync: "草稿同步",
    },
  },
} as const;

type SetupCopy = (typeof setupCopy)[keyof typeof setupCopy];

function getStepTone(status: SupabaseSetupStepStatus) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "blocked" || status === "missing") {
    return "blocked";
  }

  return "planned";
}

function getStepLabel(status: SupabaseSetupStepStatus, copy: SetupCopy) {
  if (status === "ready") {
    return copy.ready;
  }

  if (status === "manual") {
    return copy.manual;
  }

  if (status === "blocked") {
    return copy.blocked;
  }

  return copy.missing;
}

function BooleanPill({
  label,
  value,
  copy,
  invertTone = false,
}: {
  label: string;
  value: boolean;
  copy: SetupCopy;
  invertTone?: boolean;
}) {
  const positive = invertTone ? !value : value;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <StatusPill tone={positive ? "ready" : "blocked"}>
        {value ? copy.yes : copy.no}
      </StatusPill>
    </div>
  );
}

function getRemoteSchemaLabel(
  status: SupabaseRemoteSchemaStatus["status"],
  copy: SetupCopy,
) {
  if (status === "schema_present") {
    return copy.remoteSchemaReady;
  }

  if (status === "schema_incomplete") {
    return copy.remoteSchemaIncomplete;
  }

  if (status === "auth_failed") {
    return copy.remoteSchemaAuthFailed;
  }

  if (status === "network_error") {
    return copy.remoteSchemaNetwork;
  }

  return copy.remoteSchemaMissing;
}

export function SupabaseSetupClientPage({
  remoteSchema,
  status,
}: SupabaseSetupClientPageProps) {
  const { locale } = useLanguage();
  const copy = setupCopy[locale];
  const readyForAuthSync =
    status.safeForAuthSync && remoteSchema.status === "schema_present";

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
        <StatusPill tone={readyForAuthSync ? "ready" : "blocked"}>
          {readyForAuthSync ? copy.statusReady : copy.statusMissing}
        </StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.safety}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.stepsTitle}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-semibold">{copy.item}</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 font-semibold">{copy.detail}</th>
                  </tr>
                </thead>
                <tbody>
                  {status.steps.map((step) => (
                    <tr key={step.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold text-slate-950">
                        {copy.stepLabels[step.id as SupabaseSetupStepId]}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill tone={getStepTone(step.status)}>
                          {getStepLabel(step.status, copy)}
                        </StatusPill>
                      </td>
                      <td className="py-3 leading-6 text-slate-600">
                        {step.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                {copy.envTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.envBody}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                {copy.migrationTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.migrationBody}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                {copy.authTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.authBody}
              </p>
            </article>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.configTitle}
            </h2>
            <div className="mt-4 space-y-3">
              <BooleanPill
                label={copy.appUrl}
                value={status.appUrlConfigured}
                copy={copy}
              />
              <BooleanPill
                label={copy.supabaseUrl}
                value={status.supabaseUrlConfigured}
                copy={copy}
              />
              <BooleanPill
                label={copy.supabaseAnon}
                value={status.supabaseAnonKeyConfigured}
                copy={copy}
              />
              <BooleanPill
                label={copy.migrationFile}
                value={status.migrationFilePresent}
                copy={copy}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">
                {copy.remoteSchemaTitle}
              </h2>
              <StatusPill
                tone={
                  remoteSchema.status === "schema_present"
                    ? "ready"
                    : "blocked"
                }
              >
                {getRemoteSchemaLabel(remoteSchema.status, copy)}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {copy.remoteTables}: {remoteSchema.presentTableCount}/
              {remoteSchema.checkedTableCount}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.gateTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.gateBody}
            </p>
            <div className="mt-4 space-y-3">
              <BooleanPill
                label={copy.serviceRole}
                value={status.serviceRoleConfigured}
                copy={copy}
                invertTone
              />
              <BooleanPill
                label={copy.systemWriters}
                value={status.systemWritersEnabled}
                copy={copy}
                invertTone
              />
              <BooleanPill
                label={copy.aiGeneration}
                value={status.aiGenerationEnabled}
                copy={copy}
                invertTone
              />
              <BooleanPill
                label={copy.stripeWrites}
                value={status.stripeWritesEnabled}
                copy={copy}
                invertTone
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.docTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.docPath}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openLogin}
              </Link>
              <Link
                href="/sync"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openSync}
              </Link>
              <Link
                href="/setup/migration"
                className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
              >
                {copy.openMigration}
              </Link>
              <Link
                href="/qa"
                className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.openQa}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.openDashboard}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
