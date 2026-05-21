"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";
import type {
  WriterRolloutChecklistPayload,
  WriterRolloutContractPlan,
  WriterRolloutGate,
  WriterRolloutGateCategory,
  WriterRolloutGateStatus,
  WriterRolloutLaunchMode,
  WriterRolloutReadiness,
} from "@/types/system-writer-rollout";

type WriterRolloutClientPageProps = {
  payload: WriterRolloutChecklistPayload;
};

const contractLabels: Record<"en" | "zh", Record<SystemWriterContractId, string>> = {
  en: {
    agent_profile_generation: "Agent profile generation",
    relation_edge_generation: "Relation edge generation",
    simulation_run_create: "Simulation run creation",
    event_tick_append: "Event tick append",
    claim_generation: "Claim generation",
    report_generation: "Report generation",
    payment_entitlement_record: "Payment entitlement record",
    consent_event_record: "Consent event record",
  },
  zh: {
    agent_profile_generation: "Agent 档案生成",
    relation_edge_generation: "关系边生成",
    simulation_run_create: "Simulation run 创建",
    event_tick_append: "事件 tick 追加",
    claim_generation: "Claim 生成",
    report_generation: "报告生成",
    payment_entitlement_record: "支付权益记录",
    consent_event_record: "Consent 事件记录",
  },
};

const rolloutCopy = {
  en: {
    title: "Writer rollout checklist",
    badge: "Read-only launch gate",
    body: "This page defines the exact gates that must pass before any future writer can use service-role writes, AI calls, Stripe writes, or report unlocks.",
    notice:
      "Current state is launch-planning only: no writer is enabled, no service-role client is created, no rows are written, no AI or Stripe calls are made, and no report is unlocked.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    wouldEnableWriters: "Would enable writers",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldWriteRows: "Would write rows",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    approvedForProduction: "Approved for production",
    allRequiredGatesPassed: "All required gates passed",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    releaseSequence: "Release sequence",
    globalGates: "Global gates",
    contractPlans: "Per-writer rollout plans",
    category: "Category",
    required: "Required",
    blocking: "Blocking",
    status: "Status",
    evidence: "Evidence",
    missingWork: "Missing work",
    targetTables: "Target tables",
    requiredFlags: "Required flags",
    readiness: "Readiness",
    launchMode: "Launch mode",
    candidateOrder: "Candidate order",
    audience: "First allowed audience",
    requiredBeforeLaunch: "Required before launch",
    blockedBy: "Blocked by",
    canaryPlan: "Canary plan",
    abortConditions: "Abort conditions",
    openRollback: "Open rollback",
    openIdempotency: "Open idempotency",
    openAudit: "Open audit",
    openIsolation: "Open isolation",
    openStubs: "Open stubs",
    openDashboard: "Back to dashboard",
    gateStatusLabels: {
      passed: "Passed",
      blocked: "Blocked",
      manual_review: "Manual review",
    },
    categoryLabels: {
      environment: "Environment",
      database: "Database",
      service_role: "Service-role",
      contract_validation: "Contract validation",
      audit: "Audit",
      idempotency: "Idempotency",
      rollback: "Rollback",
      ai_safety_cost: "AI safety and cost",
      payments: "Payments",
      support: "Support",
      observability: "Observability",
      operator_review: "Operator review",
    },
    contractCategoryLabels: {
      agent_ecology: "Agent ecology",
      simulation: "Simulation",
      reporting: "Reporting",
      payments: "Payments",
      compliance: "Compliance",
    },
    readinessLabels: {
      blocked: "Blocked",
      candidate_after_gates: "Candidate after gates",
      not_first_candidate: "Not first candidate",
    },
    launchModeLabels: {
      none_currently: "None currently",
      internal_canary_after_gates: "Internal canary after gates",
      manual_operator_only_after_gates: "Manual operator only after gates",
      production_after_review: "Production after review",
    },
  },
  zh: {
    title: "Writer 发布检查清单",
    badge: "只读发布闸门",
    body: "这个页面定义未来任何 writer 使用 service-role 写入、AI 调用、Stripe 写入或报告解锁前必须通过的精确闸门。",
    notice:
      "当前状态仅为发布规划：不启用 writer、不创建 service-role client、不写任何行、不调用 AI 或 Stripe，也不解锁报告。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    wouldEnableWriters: "是否启用 writer",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldWriteRows: "是否写入行",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    approvedForProduction: "是否批准生产",
    allRequiredGatesPassed: "必要闸门是否全通过",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    releaseSequence: "发布顺序",
    globalGates: "全局闸门",
    contractPlans: "每个 writer 的发布计划",
    category: "类别",
    required: "必须",
    blocking: "阻断",
    status: "状态",
    evidence: "证据",
    missingWork: "缺口",
    targetTables: "目标表",
    requiredFlags: "必要开关",
    readiness: "准备度",
    launchMode: "发布模式",
    candidateOrder: "候选顺序",
    audience: "首批允许对象",
    requiredBeforeLaunch: "发布前必须完成",
    blockedBy: "阻断原因",
    canaryPlan: "灰度计划",
    abortConditions: "停止条件",
    openRollback: "打开回滚模型",
    openIdempotency: "打开幂等模型",
    openAudit: "打开审计模型",
    openIsolation: "打开隔离",
    openStubs: "打开模块桩",
    openDashboard: "返回工作台",
    gateStatusLabels: {
      passed: "已通过",
      blocked: "已阻断",
      manual_review: "人工复核",
    },
    categoryLabels: {
      environment: "环境",
      database: "数据库",
      service_role: "Service-role",
      contract_validation: "契约验证",
      audit: "审计",
      idempotency: "幂等",
      rollback: "回滚",
      ai_safety_cost: "AI 安全与成本",
      payments: "支付",
      support: "客服支持",
      observability: "观测",
      operator_review: "运营复核",
    },
    contractCategoryLabels: {
      agent_ecology: "Agent 生态",
      simulation: "推演运行",
      reporting: "报告输出",
      payments: "支付权益",
      compliance: "合规",
    },
    readinessLabels: {
      blocked: "阻断",
      candidate_after_gates: "闸门通过后的候选",
      not_first_candidate: "不是首个候选",
    },
    launchModeLabels: {
      none_currently: "当前不允许",
      internal_canary_after_gates: "闸门后内部灰度",
      manual_operator_only_after_gates: "闸门后仅人工运营",
      production_after_review: "复核后生产发布",
    },
  },
} as const;

type RolloutCopy = (typeof rolloutCopy)[keyof typeof rolloutCopy];

function toneForBoolean(value: boolean, readyWhenTrue = true) {
  const ready = readyWhenTrue ? value : !value;
  return ready ? "ready" : "blocked";
}

function toneForGate(status: WriterRolloutGateStatus) {
  if (status === "passed") {
    return "ready";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "planned";
}

function toneForReadiness(readiness: WriterRolloutReadiness) {
  if (readiness === "candidate_after_gates") {
    return "planned";
  }

  return "blocked";
}

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: RolloutCopy;
  readyWhenTrue?: boolean;
}) {
  return (
    <StatusPill tone={toneForBoolean(value, readyWhenTrue)}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function InlineList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-600">
      {items.map((item) => (
        <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function SafetyState({
  payload,
  copy,
}: {
  payload: WriterRolloutChecklistPayload;
  copy: RolloutCopy;
}) {
  return (
    <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        {copy.safetyState}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <BoolPill value={payload.safeMode} label={copy.safeMode} copy={copy} />
        <BoolPill value={payload.readOnly} label={copy.readOnly} copy={copy} />
        <BoolPill
          value={payload.wouldEnableWriters}
          label={copy.wouldEnableWriters}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.wouldCreateServiceRoleClient}
          label={copy.wouldCreateServiceRoleClient}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.wouldWriteRows}
          label={copy.wouldWriteRows}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.wouldCallAi}
          label={copy.wouldCallAi}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.wouldCallStripe}
          label={copy.wouldCallStripe}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.wouldUnlockReports}
          label={copy.wouldUnlockReports}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.approvedForProduction}
          label={copy.approvedForProduction}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={payload.allRequiredGatesPassed}
          label={copy.allRequiredGatesPassed}
          copy={copy}
          readyWhenTrue={false}
        />
      </div>
    </section>
  );
}

function GateTable({
  gates,
  copy,
}: {
  gates: WriterRolloutGate[];
  copy: RolloutCopy;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3 pr-4 font-semibold">Gate</th>
            <th className="py-3 pr-4 font-semibold">{copy.category}</th>
            <th className="py-3 pr-4 font-semibold">{copy.status}</th>
            <th className="py-3 pr-4 font-semibold">{copy.required}</th>
            <th className="py-3 pr-4 font-semibold">{copy.blocking}</th>
            <th className="py-3 pr-4 font-semibold">{copy.evidence}</th>
            <th className="py-3 font-semibold">{copy.missingWork}</th>
          </tr>
        </thead>
        <tbody>
          {gates.map((gate) => (
            <tr key={gate.id} className="border-b border-slate-100 align-top">
              <td className="py-3 pr-4">
                <div className="font-semibold text-slate-950">
                  {gate.title}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-500">
                  {gate.id}
                </div>
              </td>
              <td className="py-3 pr-4">
                <StatusPill tone="planned">
                  {
                    copy.categoryLabels[
                      gate.category as WriterRolloutGateCategory
                    ]
                  }
                </StatusPill>
              </td>
              <td className="py-3 pr-4">
                <StatusPill tone={toneForGate(gate.status)}>
                  {copy.gateStatusLabels[gate.status]}
                </StatusPill>
              </td>
              <td className="py-3 pr-4">
                <StatusPill tone={gate.required ? "planned" : "ready"}>
                  {gate.required ? copy.yes : copy.no}
                </StatusPill>
              </td>
              <td className="py-3 pr-4">
                <StatusPill tone={gate.blocking ? "blocked" : "planned"}>
                  {gate.blocking ? copy.yes : copy.no}
                </StatusPill>
              </td>
              <td className="py-3 pr-4 leading-6 text-slate-600">
                {gate.evidence}
              </td>
              <td className="py-3 leading-6 text-slate-600">
                {gate.missingWork}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractCard({
  plan,
  locale,
  copy,
}: {
  plan: WriterRolloutContractPlan;
  locale: "en" | "zh";
  copy: RolloutCopy;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {plan.candidateOrder}. {contractLabels[locale][plan.contractId]}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {plan.contractId}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <StatusPill tone={toneForReadiness(plan.readiness)}>
            {copy.readinessLabels[plan.readiness as WriterRolloutReadiness]}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.launchModeLabels[plan.launchMode as WriterRolloutLaunchMode]}
          </StatusPill>
        </div>
      </div>

      <dl className="grid gap-4 lg:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.category}
          </dt>
          <dd className="mt-2">
            <StatusPill tone="planned">
              {
                copy.contractCategoryLabels[
                  plan.category as SystemWriterContractCategory
                ]
              }
            </StatusPill>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.audience}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">
            {plan.firstAllowedAudience}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.targetTables}
          </dt>
          <dd className="mt-2">
            <InlineList items={plan.targetTables} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requiredFlags}
          </dt>
          <dd className="mt-2">
            <InlineList items={plan.requiredFlags} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.blockedBy}
          </dt>
          <dd className="mt-2">
            <InlineList items={plan.blockedBy} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.requiredBeforeLaunch}
          </dt>
          <dd className="mt-2">
            <TextList items={plan.requiredBeforeLaunch} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.canaryPlan}
          </dt>
          <dd className="mt-2">
            <TextList items={plan.canaryPlan} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.abortConditions}
          </dt>
          <dd className="mt-2">
            <TextList items={plan.abortConditions} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function WriterRolloutClientPage({
  payload,
}: WriterRolloutClientPageProps) {
  const { locale } = useLanguage();
  const copy = rolloutCopy[locale];

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
        <StatusPill tone="planned">{copy.badge}</StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.notice}
      </section>

      <SafetyState payload={payload} copy={copy} />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link
          href="/server-writers/rollback"
          className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
        >
          {copy.openRollback}
        </Link>
        <Link
          href="/server-writers/idempotency"
          className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
        >
          {copy.openIdempotency}
        </Link>
        <Link
          href="/server-writers/audit"
          className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
        >
          {copy.openAudit}
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
          href="/dashboard"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          {copy.openDashboard}
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.globalRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.globalRules} />
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.releaseSequence}
          </h2>
          <div className="mt-4">
            <TextList items={payload.releaseSequence} />
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.globalGates}
        </h2>
        <div className="mt-4">
          <GateTable gates={payload.globalGates} copy={copy} />
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.contractPlans}
        </h2>
        <div className="grid gap-4">
          {payload.contractPlans.map((plan) => (
            <ContractCard
              key={plan.contractId}
              plan={plan}
              locale={locale}
              copy={copy}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
