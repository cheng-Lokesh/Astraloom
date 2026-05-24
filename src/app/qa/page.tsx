"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  QaChecklistPhase,
  QaItemStatus,
  QaPhaseId,
} from "@/types/mvp-qa";

const phaseAccent: Record<QaPhaseId, string> = {
  local_runtime: "border-emerald-200 bg-emerald-50",
  supabase_environment: "border-cyan-200 bg-cyan-50",
  rls_boundary: "border-amber-200 bg-amber-50",
  route_acceptance: "border-violet-200 bg-violet-50",
  release_blocks: "border-rose-200 bg-rose-50",
};

const routeAcceptanceRoutes = [
  "/",
  "/dashboard",
  "/demo",
  "/login",
  "/auth/callback",
  "/intake",
  "/people",
  "/agents",
  "/runs",
  "/safety",
  "/reports",
  "/billing",
  "/sync",
  "/server-writers",
  "/server-writers/contracts",
  "/server-writers/dry-run",
  "/server-writers/guardrail",
  "/server-writers/adapter",
  "/server-writers/audit",
  "/server-writers/idempotency",
  "/server-writers/rollback",
  "/server-writers/rollout",
  "/server-writers/isolation",
  "/server-writers/stubs",
  "/server-writers/payloads",
  "/server-writers/redaction",
  "/server-writers/evidence",
  "/server-writers/migration",
  "/server-writers/migration-review",
  "/server-writers/migration-runbook",
  "/server-writers/schema-verification",
  "/server-writers/persistence-dry-run",
  "/server-writers/persistence-adapter",
  "/server-writers/persistence-review",
  "/server-writers/persistence-fixtures",
  "/server-writers/persistence-no-go",
  "/server-writers/persistence-proposal",
  "/server-writers/persistence-acceptance",
  "/server-writers/persistence-approval",
  "/server-writers/persistence-branch-preflight",
  "/server-writers/persistence-diff-contract",
  "/server-writers/persistence-patch-review",
  "/server-writers/persistence-owner-signoff",
  "/server-writers/persistence-release-no-go",
  "/server-writers/persistence-human-go-no-go",
  "/server-writers/persistence-external-approval-archive",
  "/server-writers/persistence-authorization-readiness",
  "/server-writers/persistence-authorization-no-go",
  "/server-writers/persistence-authorization-remediation",
  "/server-writers/persistence-authorization-remediation-review",
  "/server-writers/persistence-authorization-remediation-review-no-go",
  "/server-writers/persistence-authorization-reconsideration-preflight",
  "/server-writers/persistence-authorization-reconsideration-no-go",
  "/server-writers/persistence-authorization-reconsideration-remediation",
  "/server-writers/persistence-authorization-reconsideration-remediation-review",
  "/server-writers/persistence-authorization-reconsideration-remediation-review-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation",
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review",
  "/qa",
  "/setup",
  "/setup/migration",
  "/api/supabase-setup/status",
  "/api/supabase-setup/remote-schema",
  "/api/supabase-setup/migration",
  "/api/system-writers/status",
  "/api/system-writers/contracts",
  "/api/system-writers/dry-run",
  "/api/system-writers/guardrail",
  "/api/system-writers/service-role-adapter",
  "/api/system-writers/audit",
  "/api/system-writers/idempotency",
  "/api/system-writers/rollback",
  "/api/system-writers/rollout",
  "/api/system-writers/service-role-isolation",
  "/api/system-writers/stubs",
  "/api/system-writers/payload-parity",
  "/api/system-writers/request-redaction",
  "/api/system-writers/evidence-handoff",
  "/api/system-writers/migration-proposal",
  "/api/system-writers/migration-review",
  "/api/system-writers/migration-runbook",
  "/api/system-writers/schema-verification",
  "/api/system-writers/persistence-dry-run",
  "/api/system-writers/persistence-adapter",
  "/api/system-writers/persistence-review",
  "/api/system-writers/persistence-fixtures",
  "/api/system-writers/persistence-no-go",
  "/api/system-writers/persistence-proposal",
  "/api/system-writers/persistence-acceptance",
  "/api/system-writers/persistence-approval",
  "/api/system-writers/persistence-branch-preflight",
  "/api/system-writers/persistence-diff-contract",
  "/api/system-writers/persistence-patch-review",
  "/api/system-writers/persistence-owner-signoff",
  "/api/system-writers/persistence-release-no-go",
  "/api/system-writers/persistence-human-go-no-go",
  "/api/system-writers/persistence-external-approval-archive",
  "/api/system-writers/persistence-authorization-readiness",
  "/api/system-writers/persistence-authorization-no-go",
  "/api/system-writers/persistence-authorization-remediation",
  "/api/system-writers/persistence-authorization-remediation-review",
  "/api/system-writers/persistence-authorization-remediation-review-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-preflight",
  "/api/system-writers/persistence-authorization-reconsideration-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-remediation",
  "/api/system-writers/persistence-authorization-reconsideration-remediation-review",
  "/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation",
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review",
] as const;

const routeAcceptanceExpectedEn = `${routeAcceptanceRoutes.join(
  ", ",
)} return 200.`;

const routeAcceptanceExpectedZh = `${routeAcceptanceRoutes.join(
  ", ",
)} 均返回 200。`;

const qaCopy = {
  en: {
    title: "MVP QA and environment setup",
    status: "Implementation checklist",
    body: "Use this page as the founder-facing acceptance checklist before real Supabase sync, service-role writers, AI generation, or Stripe are enabled.",
    doc: "Document",
    item: "Check",
    command: "Command",
    expected: "Expected result",
    notNeeded: "Manual check",
    ready: "Ready",
    manual: "Manual",
    blocked: "Keep blocked",
    supabaseReady: "Supabase env present",
    supabaseMissing: "Supabase env missing",
    openSync: "Open sync",
    openWriters: "Open writers",
    openSetup: "Open setup",
    openDashboard: "Back to dashboard",
    hardRule:
      "Hard rule: do not enable AI generation, Stripe writes, or service-role system writes until the RLS boundary has been manually verified.",
    phaseLabels: {
      local_runtime: "Local runtime",
      supabase_environment: "Supabase environment",
      rls_boundary: "RLS boundary",
      route_acceptance: "Route acceptance",
      release_blocks: "Release blocks",
    },
    phaseBodies: {
      local_runtime:
        "Verify the app can be installed, linted, built, and served locally.",
      supabase_environment:
        "Configure only the safe public Supabase values for the first authenticated test.",
      rls_boundary:
        "Confirm client-writable tables and server-owned generated tables stay separated.",
      route_acceptance:
        "Every MVP surface should return 200 and keep its scoped disabled states.",
      release_blocks:
        "These items must remain blocked before any paid or generated output is enabled.",
    },
    phases: [
      {
        id: "local_runtime",
        items: [
          {
            id: "install",
            status: "ready",
            command: "npm install",
            expected: "Dependencies install without changing the stack.",
          },
          {
            id: "lint",
            status: "ready",
            command: "npm run lint",
            expected: "ESLint exits with no errors.",
          },
          {
            id: "build",
            status: "ready",
            command: "npm run build",
            expected: "Next.js production build succeeds.",
          },
          {
            id: "dev",
            status: "manual",
            command: "npm run dev",
            expected: "The local app opens at http://localhost:3000.",
          },
        ],
      },
      {
        id: "supabase_environment",
        items: [
          {
            id: "copy_env",
            status: "manual",
            command: "Copy-Item .env.example .env.local",
            expected: "A local env file exists and is not committed.",
          },
          {
            id: "public_keys",
            status: "manual",
            expected:
              "Only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are filled for the first auth test.",
          },
          {
            id: "dangerous_flags",
            status: "blocked",
            expected:
              "SUPABASE_SERVICE_ROLE_KEY is blank, ENABLE_SYSTEM_WRITERS=false, ENABLE_AI_GENERATION=false, and ENABLE_STRIPE_WRITES=false.",
          },
        ],
      },
      {
        id: "rls_boundary",
        items: [
          {
            id: "migration",
            status: "manual",
            expected:
              "Run supabase/migrations/0001_mvp_core_schema.sql in Supabase SQL Editor.",
          },
          {
            id: "client_tables",
            status: "manual",
            expected:
              "seed_contexts, key_people, and support_tickets have user-scoped manage policies.",
          },
          {
            id: "server_tables",
            status: "blocked",
            expected:
              "agent_profiles, relation_edges, simulation_runs, events, claims, reports, payments, and consent_events stay browser read-only.",
          },
        ],
      },
      {
        id: "route_acceptance",
        items: [
          {
            id: "routes",
            status: "ready",
            command:
              "Invoke-WebRequest http://localhost:3000/<route> for each MVP route",
            expected: routeAcceptanceExpectedEn,
          },
          {
            id: "language",
            status: "ready",
            expected:
              "The language switcher changes the UI between English and Chinese without hydration errors.",
          },
          {
            id: "readonly_graph",
            status: "ready",
            expected:
              "Agent and relationship previews remain read-only with no editable edge weights.",
          },
        ],
      },
      {
        id: "release_blocks",
        items: [
          {
            id: "ai",
            status: "blocked",
            expected: "No model API is called from the MVP shell.",
          },
          {
            id: "stripe",
            status: "blocked",
            expected: "No real Stripe checkout or webhook write is enabled.",
          },
          {
            id: "reports",
            status: "blocked",
            expected:
              "Reports stay locked unless SafetyVerifier marks the run as report-ready.",
          },
        ],
      },
    ],
  },
  zh: {
    title: "MVP QA 与环境配置",
    status: "实施验收清单",
    body: "在启用真实 Supabase 同步、service-role 写入、AI 生成或 Stripe 之前，用这个页面作为创始人可读的验收清单。",
    doc: "文档",
    item: "检查项",
    command: "命令",
    expected: "预期结果",
    notNeeded: "人工检查",
    ready: "已就绪",
    manual: "需人工",
    blocked: "保持阻断",
    supabaseReady: "Supabase 环境已填写",
    supabaseMissing: "Supabase 环境未填写",
    openSync: "打开同步",
    openWriters: "打开服务端写入",
    openSetup: "打开设置",
    openDashboard: "返回工作台",
    hardRule:
      "硬规则：在人工确认 RLS 边界前，不启用 AI 生成、Stripe 写入或 service-role 系统写入。",
    phaseLabels: {
      local_runtime: "本地运行",
      supabase_environment: "Supabase 环境",
      rls_boundary: "RLS 边界",
      route_acceptance: "路由验收",
      release_blocks: "发布阻断项",
    },
    phaseBodies: {
      local_runtime:
        "确认应用可以安装、lint、构建，并能在本地运行。",
      supabase_environment:
        "第一次认证测试只填写安全的 Supabase 公开配置。",
      rls_boundary:
        "确认客户端可写表与系统生成表、支付表保持清晰隔离。",
      route_acceptance:
        "每个 MVP 页面都应返回 200，并保留各自的禁用状态。",
      release_blocks:
        "在付费或生成内容上线前，这些项目必须继续保持阻断。",
    },
    phases: [
      {
        id: "local_runtime",
        items: [
          {
            id: "install",
            status: "ready",
            command: "npm install",
            expected: "依赖可以安装，且不改变现有技术栈。",
          },
          {
            id: "lint",
            status: "ready",
            command: "npm run lint",
            expected: "ESLint 无错误退出。",
          },
          {
            id: "build",
            status: "ready",
            command: "npm run build",
            expected: "Next.js 生产构建成功。",
          },
          {
            id: "dev",
            status: "manual",
            command: "npm run dev",
            expected: "本地应用可以在 http://localhost:3000 打开。",
          },
        ],
      },
      {
        id: "supabase_environment",
        items: [
          {
            id: "copy_env",
            status: "manual",
            command: "Copy-Item .env.example .env.local",
            expected: "本地环境文件存在，并且不会提交到代码库。",
          },
          {
            id: "public_keys",
            status: "manual",
            expected:
              "第一次登录测试只填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
          },
          {
            id: "dangerous_flags",
            status: "blocked",
            expected:
              "SUPABASE_SERVICE_ROLE_KEY 留空，ENABLE_SYSTEM_WRITERS=false，ENABLE_AI_GENERATION=false，ENABLE_STRIPE_WRITES=false。",
          },
        ],
      },
      {
        id: "rls_boundary",
        items: [
          {
            id: "migration",
            status: "manual",
            expected:
              "在 Supabase SQL Editor 运行 supabase/migrations/0001_mvp_core_schema.sql。",
          },
          {
            id: "client_tables",
            status: "manual",
            expected:
              "seed_contexts、key_people、support_tickets 拥有用户范围内的 manage policy。",
          },
          {
            id: "server_tables",
            status: "blocked",
            expected:
              "agent_profiles、relation_edges、simulation_runs、events、claims、reports、payments、consent_events 对浏览器保持只读。",
          },
        ],
      },
      {
        id: "route_acceptance",
        items: [
          {
            id: "routes",
            status: "ready",
            command:
              "Invoke-WebRequest http://localhost:3000/<route> 检查每个 MVP 路由",
            expected: routeAcceptanceExpectedZh,
          },
          {
            id: "language",
            status: "ready",
            expected:
              "语言切换可以在英文和中文之间切换，且没有 hydration 错误。",
          },
          {
            id: "readonly_graph",
            status: "ready",
            expected:
              "Agent 与关系预览保持只读，没有可编辑的边权数值。",
          },
        ],
      },
      {
        id: "release_blocks",
        items: [
          {
            id: "ai",
            status: "blocked",
            expected: "MVP 外壳不调用任何模型 API。",
          },
          {
            id: "stripe",
            status: "blocked",
            expected: "不启用真实 Stripe checkout 或 webhook 写入。",
          },
          {
            id: "reports",
            status: "blocked",
            expected:
              "SafetyVerifier 未标记 report-ready 时，报告继续锁定。",
          },
        ],
      },
    ],
  },
} as const;

function getStatusTone(status: QaItemStatus) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "planned";
}

export default function QaPage() {
  const { locale } = useLanguage();
  const copy = qaCopy[locale];
  const configured = isSupabaseConfigured();
  const phases = copy.phases as readonly QaChecklistPhase[];
  const statusLabels: Record<QaItemStatus, string> = {
    ready: copy.ready,
    manual: copy.manual,
    blocked: copy.blocked,
  };

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

      <section className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">
        {copy.hardRule}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {phases.map((phase) => (
            <section
              key={phase.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`mb-4 rounded-md border px-4 py-3 ${
                  phaseAccent[phase.id]
                }`}
              >
                <h2 className="text-base font-semibold text-slate-950">
                  {copy.phaseLabels[phase.id]}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {copy.phaseBodies[phase.id]}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 pr-4 font-semibold">{copy.item}</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 pr-4 font-semibold">
                        {copy.command}
                      </th>
                      <th className="py-3 font-semibold">{copy.expected}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phase.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-semibold text-slate-950">
                          {item.id}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusPill tone={getStatusTone(item.status)}>
                            {statusLabels[item.status]}
                          </StatusPill>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {item.command ? (
                            <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800">
                              {item.command}
                            </code>
                          ) : (
                            copy.notNeeded
                          )}
                        </td>
                        <td className="py-3 leading-6 text-slate-600">
                          {item.expected}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Supabase
            </h2>
            <div className="mt-4">
              <StatusPill tone={configured ? "ready" : "blocked"}>
                {configured ? copy.supabaseReady : copy.supabaseMissing}
              </StatusPill>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.doc}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              docs/mvp-qa-environment.md
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/sync"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openSync}
              </Link>
              <Link
                href="/server-writers"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openWriters}
              </Link>
              <Link
                href="/setup"
                className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
              >
                {copy.openSetup}
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
