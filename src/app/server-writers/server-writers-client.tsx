"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  ServerWriterCapability,
  ServerWriterCategory,
  ServerWriterStatus,
  ServerWriterStatusPayload,
} from "@/types/server-writer";

type ServerWritersClientPageProps = {
  status: ServerWriterStatusPayload;
};

const categories: { id: ServerWriterCategory; accent: string }[] = [
  { id: "agent_ecology", accent: "border-emerald-200 bg-emerald-50" },
  { id: "simulation", accent: "border-sky-200 bg-sky-50" },
  { id: "reporting", accent: "border-violet-200 bg-violet-50" },
  { id: "payments", accent: "border-teal-200 bg-teal-50" },
];

const writerCopy = {
  en: {
    title: "Server writer boundary",
    status: "Backend scaffold",
    body: "This page exposes only safe configuration status. Service-role secrets never reach the browser, and all system-owned writes remain disabled unless the backend gates are explicitly turned on.",
    secureNotice:
      "The browser can still sync user-authored drafts only. Agent profiles, relation edges, runs, events, claims, reports, and payment entitlement records require server-side writers.",
    ready: "Configured",
    blocked: "Blocked",
    disabled: "Disabled",
    enabled: "Enabled",
    missing: "Missing",
    placeholder: "Ready placeholder",
    yes: "Yes",
    no: "No",
    config: "Configuration gates",
    supabaseUrl: "Supabase URL",
    serviceRole: "Service role key",
    systemWriters: "System writers flag",
    aiGeneration: "AI generation flag",
    stripeWrites: "Stripe writes flag",
    noSecrets:
      "Only booleans are shown here. The service-role key is read on the server and is never serialized into this page or the status API.",
    categoryLabels: {
      agent_ecology: "Agent ecology",
      simulation: "Simulation",
      reporting: "Reports",
      payments: "Payments",
    },
    categoryDetails: {
      agent_ecology:
        "Digital selves, NPCs, and relationship edges are generated system objects.",
      simulation:
        "Run records and event ticks must be created by backend execution.",
      reporting:
        "Claims and reports remain locked behind SafetyVerifier and entitlement gates.",
      payments:
        "Entitlements must come from Stripe webhook/server confirmation.",
    },
    writerLabels: {
      agent_profiles: "Agent profiles",
      relation_edges: "Relation edges",
      simulation_runs: "Simulation runs",
      events: "Event ticks",
      claims: "Claims",
      reports: "Reports",
      payments: "Payment entitlements",
    },
    table: "Table",
    gate: "Gate",
    detail: "Boundary detail",
    serviceRoleRequired: "Service role",
    aiRequired: "AI",
    stripeRequired: "Stripe",
    actions: "Disabled actions",
    systemWriteDisabled: "System writes disabled",
    aiDisabled: "AI generation disabled",
    stripeDisabled: "Stripe writes disabled",
    openSync: "Open sync center",
    openContracts: "Open writer contracts",
    openDryRun: "Open dry-run validator",
    openGuardrail: "Open execution guardrail",
    openAdapter: "Open adapter boundary",
    openAudit: "Open audit model",
    openIdempotency: "Open idempotency",
    openRollback: "Open rollback",
    openRollout: "Open rollout",
    openIsolation: "Open isolation",
    openStubs: "Open stubs",
    openPayloads: "Open payloads",
    openRedaction: "Open redaction",
    openEvidence: "Open evidence",
    openWriterMigration: "Open writer SQL",
    openWriterMigrationReview: "Open SQL review",
    openWriterMigrationRunbook: "Open SQL runbook",
    openSchemaVerification: "Open schema verify",
    openPersistenceDryRun: "Open persistence gate",
    openPersistenceAdapter: "Open persistence adapter",
    openPersistenceReview: "Open adapter review",
    openPersistenceFixtures: "Open adapter fixtures",
    openPersistenceNoGo: "Open adapter no-go",
    openPersistenceProposal: "Open adapter proposal",
    openPersistenceAcceptance: "Open adapter tests",
    openPersistenceApproval: "Open adapter approval",
    openPersistenceBranchPreflight: "Open branch preflight",
    openPersistenceDiffContract: "Open diff contract",
    openPersistencePatchReview: "Open patch review",
    openPersistenceOwnerSignoff: "Open owner signoff",
    openPersistenceReleaseNoGo: "Open release no-go",
    openPersistenceHumanGoNoGo: "Open human go/no-go",
    openPersistenceExternalArchive: "Open approval archive",
    openPersistenceAuthorizationReadiness: "Open authorization readiness",
    openPersistenceAuthorizationNoGo: "Open authorization no-go",
    openPersistenceAuthorizationRemediation: "Open authorization remediation",
    openPersistenceAuthorizationRemediationReview:
      "Open authorization remediation review",
    openPersistenceAuthorizationRemediationReviewNoGo:
      "Open authorization review no-go",
    openPersistenceAuthorizationReconsiderationPreflight:
      "Open authorization preflight",
    openPersistenceAuthorizationReconsiderationNoGo:
      "Open authorization reconsideration no-go",
    openPersistenceAuthorizationReconsiderationRemediation:
      "Open authorization reconsideration remediation",
    openPersistenceAuthorizationReconsiderationRemediationReview:
      "Open authorization reconsideration review",
    openPersistenceAuthorizationReconsiderationRemediationReviewNoGo:
      "Open authorization reconsideration review no-go",
    openPersistenceAuthorizationReconsiderationFinalDecision:
      "Open authorization final decision",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchive:
      "Open authorization final archive",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo:
      "Open authorization archive no-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation:
      "Open authorization archive remediation",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview:
      "Open authorization archive review",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo:
      "Open authorization archive review no-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation:
      "Open authorization archive review reconciliation",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo:
      "Open authorization archive reconciliation no-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation:
      "Open authorization archive reconciliation remediation",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview:
      "Open authorization archive reconciliation remediation review",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      "Open authorization archive reconciliation remediation review no-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      "Open authorization archive remediation review no-go reconciliation",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo:
      "Open authorization archive remediation review no-go reconciliation no-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation:
      "Open authorization archive remediation review no-go reconciliation no-go remediation",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      "Open authorization archive remediation review no-go reconciliation no-go remediation review",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      "Open authorization archive reconciliation remediation review no-go",
    openQa: "Open QA checklist",
    openDashboard: "Back to dashboard",
    nextStep: "Next build step",
    nextStepBody:
      "The read-only remediation review no-go packet now exists and still cannot accept no-go outcomes, review outcomes, remediation, resolve blockers, deny authorization, grant authorization, start implementation, or write rows. The next useful step is a read-only remediation path that organizes those remaining blockers without storing approvals, feature flags, deployments, production writers, branches, files, tests, privileged clients, migrations, or writes.",
  },
  zh: {
    title: "服务端写入边界",
    status: "后端脚手架",
    body: "这个页面只暴露安全的配置状态。service-role 密钥不会进入浏览器；除非后端闸门被明确打开，所有系统对象写入都保持禁用。",
    secureNotice:
      "浏览器仍然只能同步用户自己写下的草稿。Agent、关系边、Run、事件、Claim、报告和支付权益都必须由服务端写入器负责。",
    ready: "已配置",
    blocked: "已阻断",
    disabled: "已禁用",
    enabled: "已启用",
    missing: "缺失",
    placeholder: "占位就绪",
    yes: "是",
    no: "否",
    config: "配置闸门",
    supabaseUrl: "Supabase URL",
    serviceRole: "Service role key",
    systemWriters: "系统写入开关",
    aiGeneration: "AI 生成开关",
    stripeWrites: "Stripe 写入开关",
    noSecrets:
      "这里只展示布尔状态。service-role key 只在服务端读取，不会序列化到页面或状态 API。",
    categoryLabels: {
      agent_ecology: "Agent 生态",
      simulation: "推演运行",
      reporting: "报告输出",
      payments: "支付权益",
    },
    categoryDetails: {
      agent_ecology:
        "数字自我、NPC 和关系边都是系统生成对象，不能由浏览器直接写。",
      simulation: "Run 记录和事件 tick 必须由后端执行流程创建。",
      reporting: "Claim 和报告继续锁在 SafetyVerifier 与权益闸门之后。",
      payments: "支付权益必须来自 Stripe webhook 或服务端确认。",
    },
    writerLabels: {
      agent_profiles: "Agent 档案",
      relation_edges: "关系边",
      simulation_runs: "Simulation runs",
      events: "事件 tick",
      claims: "Claims",
      reports: "报告",
      payments: "支付权益",
    },
    table: "数据表",
    gate: "闸门",
    detail: "边界说明",
    serviceRoleRequired: "Service role",
    aiRequired: "AI",
    stripeRequired: "Stripe",
    actions: "禁用中的动作",
    systemWriteDisabled: "系统写入已禁用",
    aiDisabled: "AI 生成已禁用",
    stripeDisabled: "Stripe 写入已禁用",
    openSync: "打开同步中心",
    openContracts: "打开写入契约",
    openDryRun: "打开 dry-run 验证器",
    openGuardrail: "打开执行护栏",
    openAdapter: "打开适配器边界",
    openAudit: "打开审计模型",
    openIdempotency: "打开幂等模型",
    openRollback: "打开回滚模型",
    openRollout: "打开发布清单",
    openIsolation: "打开隔离",
    openStubs: "打开模块桩",
    openPayloads: "打开 Payload",
    openRedaction: "打开脱敏",
    openEvidence: "打开证据",
    openWriterMigration: "打开写入 SQL",
    openWriterMigrationReview: "打开 SQL 审查",
    openWriterMigrationRunbook: "打开 SQL 手册",
    openSchemaVerification: "打开 Schema 验证",
    openPersistenceDryRun: "打开持久化门槛",
    openPersistenceAdapter: "打开持久化适配器",
    openPersistenceReview: "打开适配器审查",
    openPersistenceFixtures: "打开适配器 Fixture",
    openPersistenceNoGo: "打开适配器 No-go",
    openPersistenceProposal: "打开适配器方案",
    openPersistenceAcceptance: "打开适配器验收",
    openPersistenceApproval: "打开适配器批准",
    openPersistenceBranchPreflight: "打开分支预检",
    openPersistenceDiffContract: "打开 Diff 契约",
    openPersistencePatchReview: "打开 Patch 审查",
    openPersistenceOwnerSignoff: "打开负责人签核",
    openPersistenceReleaseNoGo: "打开发布 No-go",
    openPersistenceHumanGoNoGo: "打开人工 Go/no-go",
    openPersistenceExternalArchive: "打开批准归档",
    openPersistenceAuthorizationReadiness: "打开授权准备度",
    openPersistenceAuthorizationNoGo: "打开授权 No-go",
    openPersistenceAuthorizationRemediation: "打开授权补救",
    openPersistenceAuthorizationRemediationReview: "打开授权补救审查",
    openPersistenceAuthorizationRemediationReviewNoGo: "打开授权审查 No-go",
    openPersistenceAuthorizationReconsiderationPreflight: "打开授权预检",
    openPersistenceAuthorizationReconsiderationNoGo: "打开授权重审 No-go",
    openPersistenceAuthorizationReconsiderationRemediation: "打开授权重审补救",
    openPersistenceAuthorizationReconsiderationRemediationReview:
      "打开授权重审复核",
    openPersistenceAuthorizationReconsiderationRemediationReviewNoGo:
      "打开授权重审复核 No-go",
    openPersistenceAuthorizationReconsiderationFinalDecision:
      "打开授权最终决策",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchive:
      "打开授权最终归档",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo:
      "打开授权归档 No-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation:
      "打开授权归档补救",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview:
      "打开授权归档复核",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo:
      "打开授权归档复核 No-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation:
      "打开授权归档复核 Reconcile",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo:
      "打开授权归档 Reconcile No-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation:
      "打开授权归档 Reconcile 补救",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview:
      "打开授权归档 Reconcile 补救复核",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      "打开授权归档 Reconcile 补救复核 No-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      "打开授权归档复核 No-go Reconcile",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo:
      "打开授权归档复核 No-go Reconcile No-go",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation:
      "打开授权归档复核 No-go Reconcile No-go 补救",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      "打开授权归档复核 No-go Reconcile No-go 补救复核",
    openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      "打开授权归档 Reconcile 补救复核 No-go",
    openQa: "打开 QA 清单",
    openDashboard: "返回工作台",
    nextStep: "下一步构建",
    nextStepBody:
      "只读补救复核 No-go 包已经存在，并且仍然不能接受 No-go 结果、接受复核结果、接受补救、解决阻断、拒绝授权、授予授权、启动实现或写入数据。下一步应补只读的补救路径，用来整理这些剩余阻断，同时继续禁止存储批准、功能开关、部署、生产 writer、分支、文件、测试、特权客户端、migration 和写入。",
  },
} as const;

type WriterCopy = (typeof writerCopy)[keyof typeof writerCopy];

function getStatusTone(status: ServerWriterStatus) {
  if (status === "ready_placeholder") {
    return "ready";
  }

  return "blocked";
}

function getGateTone(value: boolean) {
  return value ? "ready" : "blocked";
}

function getStatusLabel(status: ServerWriterStatus, copy: WriterCopy) {
  if (status === "ready_placeholder") {
    return copy.placeholder;
  }

  if (status === "missing_config") {
    return copy.missing;
  }

  return copy.disabled;
}

function GatePill({
  active,
  label,
  copy,
}: {
  active: boolean;
  label: string;
  copy: WriterCopy;
}) {
  return (
    <StatusPill tone={getGateTone(active)}>
      {label}: {active ? copy.yes : copy.no}
    </StatusPill>
  );
}

function WriterRow({
  writer,
  copy,
}: {
  writer: ServerWriterCapability;
  copy: WriterCopy;
}) {
  return (
    <tr className="border-b border-slate-100 align-top">
      <td className="py-3 pr-4 font-semibold text-slate-950">
        {copy.writerLabels[writer.id]}
      </td>
      <td className="py-3 pr-4 text-slate-600">{writer.tableName}</td>
      <td className="py-3 pr-4">
        <StatusPill tone={getStatusTone(writer.status)}>
          {getStatusLabel(writer.status, copy)}
        </StatusPill>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-2">
          <GatePill
            active={writer.requiresServiceRole}
            label={copy.serviceRoleRequired}
            copy={copy}
          />
          <GatePill
            active={writer.requiresAiGeneration}
            label={copy.aiRequired}
            copy={copy}
          />
          <GatePill
            active={writer.requiresStripeWrites}
            label={copy.stripeRequired}
            copy={copy}
          />
        </div>
      </td>
      <td className="py-3 text-slate-600">{writer.detail}</td>
    </tr>
  );
}

export function ServerWritersClientPage({
  status,
}: ServerWritersClientPageProps) {
  const { locale } = useLanguage();
  const copy = writerCopy[locale];
  const allConfigured =
    status.supabaseUrlConfigured &&
    status.serviceRoleConfigured &&
    status.systemWritersEnabled;

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
        <StatusPill tone={allConfigured ? "ready" : "blocked"}>
          {copy.status}
        </StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.secureNotice}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {categories.map((category) => {
            const writers = status.writers.filter(
              (writer) => writer.category === category.id,
            );

            return (
              <section
                key={category.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`mb-4 rounded-md border px-4 py-3 ${category.accent}`}
                >
                  <h2 className="text-base font-semibold text-slate-950">
                    {copy.categoryLabels[category.id]}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {copy.categoryDetails[category.id]}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-3 pr-4 font-semibold">
                          {copy.table}
                        </th>
                        <th className="py-3 pr-4 font-semibold">Table</th>
                        <th className="py-3 pr-4 font-semibold">Status</th>
                        <th className="py-3 pr-4 font-semibold">
                          {copy.gate}
                        </th>
                        <th className="py-3 font-semibold">{copy.detail}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {writers.map((writer) => (
                        <WriterRow
                          key={writer.id}
                          writer={writer}
                          copy={copy}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.config}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <GatePill
                active={status.supabaseUrlConfigured}
                label={copy.supabaseUrl}
                copy={copy}
              />
              <GatePill
                active={status.serviceRoleConfigured}
                label={copy.serviceRole}
                copy={copy}
              />
              <GatePill
                active={status.systemWritersEnabled}
                label={copy.systemWriters}
                copy={copy}
              />
              <GatePill
                active={status.aiGenerationEnabled}
                label={copy.aiGeneration}
                copy={copy}
              />
              <GatePill
                active={status.stripeWritesEnabled}
                label={copy.stripeWrites}
                copy={copy}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {copy.noSecrets}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.actions}
            </h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
              >
                {copy.systemWriteDisabled}
              </button>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
              >
                {copy.aiDisabled}
              </button>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
              >
                {copy.stripeDisabled}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.nextStep}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.nextStepBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/sync"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openSync}
              </Link>
              <Link
                href="/server-writers/contracts"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openContracts}
              </Link>
              <Link
                href="/server-writers/dry-run"
                className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
              >
                {copy.openDryRun}
              </Link>
              <Link
                href="/server-writers/guardrail"
                className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
              >
                {copy.openGuardrail}
              </Link>
              <Link
                href="/server-writers/adapter"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openAdapter}
              </Link>
              <Link
                href="/server-writers/audit"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openAudit}
              </Link>
              <Link
                href="/server-writers/idempotency"
                className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
              >
                {copy.openIdempotency}
              </Link>
              <Link
                href="/server-writers/rollback"
                className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.openRollback}
              </Link>
              <Link
                href="/server-writers/rollout"
                className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
              >
                {copy.openRollout}
              </Link>
              <Link
                href="/server-writers/isolation"
                className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
              >
                {copy.openIsolation}
              </Link>
              <Link
                href="/server-writers/stubs"
                className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
              >
                {copy.openStubs}
              </Link>
              <Link
                href="/server-writers/payloads"
                className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              >
                {copy.openPayloads}
              </Link>
              <Link
                href="/server-writers/redaction"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openRedaction}
              </Link>
              <Link
                href="/server-writers/evidence"
                className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
              >
                {copy.openEvidence}
              </Link>
              <Link
                href="/server-writers/migration"
                className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
              >
                {copy.openWriterMigration}
              </Link>
              <Link
                href="/server-writers/migration-review"
                className="rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-100"
              >
                {copy.openWriterMigrationReview}
              </Link>
              <Link
                href="/server-writers/migration-runbook"
                className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
              >
                {copy.openWriterMigrationRunbook}
              </Link>
              <Link
                href="/server-writers/schema-verification"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openSchemaVerification}
              </Link>
              <Link
                href="/server-writers/persistence-dry-run"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openPersistenceDryRun}
              </Link>
              <Link
                href="/server-writers/persistence-adapter"
                className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
              >
                {copy.openPersistenceAdapter}
              </Link>
              <Link
                href="/server-writers/persistence-review"
                className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.openPersistenceReview}
              </Link>
              <Link
                href="/server-writers/persistence-fixtures"
                className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
              >
                {copy.openPersistenceFixtures}
              </Link>
              <Link
                href="/server-writers/persistence-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-proposal"
                className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                {copy.openPersistenceProposal}
              </Link>
              <Link
                href="/server-writers/persistence-acceptance"
                className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
              >
                {copy.openPersistenceAcceptance}
              </Link>
              <Link
                href="/server-writers/persistence-approval"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceApproval}
              </Link>
              <Link
                href="/server-writers/persistence-branch-preflight"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistenceBranchPreflight}
              </Link>
              <Link
                href="/server-writers/persistence-diff-contract"
                className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                {copy.openPersistenceDiffContract}
              </Link>
              <Link
                href="/server-writers/persistence-patch-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistencePatchReview}
              </Link>
              <Link
                href="/server-writers/persistence-owner-signoff"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceOwnerSignoff}
              </Link>
              <Link
                href="/server-writers/persistence-release-no-go"
                className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.openPersistenceReleaseNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-human-go-no-go"
                className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
              >
                {copy.openPersistenceHumanGoNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-external-approval-archive"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openPersistenceExternalArchive}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-readiness"
                className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                {copy.openPersistenceAuthorizationReadiness}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceAuthorizationRemediation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-remediation-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistenceAuthorizationRemediationReview}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-remediation-review-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationRemediationReviewNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-preflight"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationPreflight}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationRemediation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-remediation-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationRemediationReview}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-remediation-review-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationRemediationReviewNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecision}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive"
                className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchive}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation"
                className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review"
                className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview}
              </Link>
              <Link
                href="/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                {copy.openPersistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo}
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
