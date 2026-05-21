"use client";

import Link from "next/link";

import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

type AppShellProps = {
  children: React.ReactNode;
};

const shellCopy = {
  en: {
    productLine: "AI Life Simulator",
    workspace: "Workspace",
    intake: "New simulation",
    people: "People",
    agents: "Agents",
    runs: "Runs",
    safety: "Safety",
    reports: "Reports",
    billing: "Billing",
    sync: "Sync",
    writers: "Writers",
    dryRun: "Dry-run",
    guardrail: "Guardrail",
    adapter: "Adapter",
    audit: "Audit",
    idempotency: "Idempotency",
    rollback: "Rollback",
    rollout: "Rollout",
    isolation: "Isolation",
    stubs: "Stubs",
    payloads: "Payloads",
    redaction: "Redaction",
    evidence: "Evidence",
    writerMigration: "Writer SQL",
    writerMigrationReview: "SQL Review",
    writerMigrationRunbook: "SQL Runbook",
    schemaVerification: "Schema Verify",
    persistenceDryRun: "Persistence Gate",
    persistenceAdapter: "Persistence Adapter",
    persistenceReview: "Adapter Review",
    persistenceFixtures: "Adapter Fixtures",
    persistenceNoGo: "Adapter No-go",
    persistenceProposal: "Adapter Proposal",
    persistenceAcceptance: "Adapter Tests",
    persistenceApproval: "Adapter Approval",
    persistenceBranchPreflight: "Branch Preflight",
    persistenceDiffContract: "Diff Contract",
    persistencePatchReview: "Patch Review",
    persistenceOwnerSignoff: "Owner Signoff",
    persistenceReleaseNoGo: "Release No-go",
    persistenceHumanGoNoGo: "Human Go/no-go",
    persistenceExternalArchive: "Approval Archive",
    persistenceAuthorizationReadiness: "Auth Readiness",
    persistenceAuthorizationNoGo: "Auth No-go",
    persistenceAuthorizationRemediation: "Auth Remediation",
    persistenceAuthorizationRemediationReview: "Auth Remediation Review",
    persistenceAuthorizationRemediationReviewNoGo: "Auth Review No-go",
    persistenceAuthorizationReconsiderationPreflight: "Auth Preflight",
    persistenceAuthorizationReconsiderationNoGo: "Auth Reconsider No-go",
    persistenceAuthorizationReconsiderationRemediation:
      "Auth Reconsider Remediation",
    persistenceAuthorizationReconsiderationRemediationReview:
      "Auth Reconsider Review",
    persistenceAuthorizationReconsiderationRemediationReviewNoGo:
      "Auth Reconsider Review No-go",
    persistenceAuthorizationReconsiderationFinalDecision:
      "Auth Final Decision",
    persistenceAuthorizationReconsiderationFinalDecisionArchive:
      "Auth Final Archive",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo:
      "Auth Archive No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation:
      "Auth Archive Remediation",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview:
      "Auth Archive Review",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo:
      "Auth Archive Review No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation:
      "Auth Archive Review Reconcile",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo:
      "Auth Archive Reconcile No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation:
      "Auth Archive Reconcile Remediate",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview:
      "Auth Archive Reconcile Review",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      "Auth Archive Reconcile Review No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      "Auth Archive Review No-go Reconcile",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo:
      "Auth Archive Reconcile No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation:
      "Auth Archive Reconcile Remediate",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      "Auth Archive Reconcile Remediation Review",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      "Auth Archive Reconcile Remediation Review No-go",
    qa: "QA",
    setup: "Setup",
    login: "Login",
  },
  zh: {
    productLine: "AI 生命沙盘模拟器",
    workspace: "工作台",
    intake: "开始推演",
    people: "人物确认",
    agents: "Agent 生态",
    runs: "Run 外壳",
    safety: "安全检查",
    reports: "报告",
    billing: "支付客服",
    sync: "同步",
    writers: "服务端写入",
    dryRun: "Dry-run",
    guardrail: "护栏",
    adapter: "适配器",
    audit: "审计",
    idempotency: "幂等",
    rollback: "回滚",
    rollout: "发布",
    isolation: "隔离",
    stubs: "模块桩",
    payloads: "Payload",
    redaction: "脱敏",
    evidence: "证据",
    writerMigration: "写入 SQL",
    writerMigrationReview: "SQL 审查",
    writerMigrationRunbook: "SQL 手册",
    schemaVerification: "Schema 验证",
    persistenceDryRun: "持久化门槛",
    persistenceAdapter: "持久化适配器",
    persistenceReview: "适配器审查",
    persistenceFixtures: "适配器 Fixture",
    persistenceNoGo: "适配器 No-go",
    persistenceProposal: "适配器方案",
    persistenceAcceptance: "适配器验收",
    persistenceApproval: "适配器批准",
    persistenceBranchPreflight: "分支预检",
    persistenceDiffContract: "Diff 契约",
    persistencePatchReview: "Patch 审查",
    persistenceOwnerSignoff: "负责人签核",
    persistenceReleaseNoGo: "发布 No-go",
    persistenceHumanGoNoGo: "人工 Go/no-go",
    persistenceExternalArchive: "批准归档",
    persistenceAuthorizationReadiness: "授权准备度",
    persistenceAuthorizationNoGo: "授权 No-go",
    persistenceAuthorizationRemediation: "授权补救",
    persistenceAuthorizationRemediationReview: "授权补救审查",
    persistenceAuthorizationRemediationReviewNoGo: "授权审查 No-go",
    persistenceAuthorizationReconsiderationPreflight: "授权预检",
    persistenceAuthorizationReconsiderationNoGo: "授权重审 No-go",
    persistenceAuthorizationReconsiderationRemediation: "授权重审补救",
    persistenceAuthorizationReconsiderationRemediationReview: "授权重审复核",
    persistenceAuthorizationReconsiderationRemediationReviewNoGo:
      "授权重审复核 No-go",
    persistenceAuthorizationReconsiderationFinalDecision: "授权最终决策",
    persistenceAuthorizationReconsiderationFinalDecisionArchive: "授权最终归档",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo:
      "授权归档 No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation:
      "授权归档补救",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview:
      "授权归档复核",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo:
      "授权归档复核 No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation:
      "授权归档复核 Reconcile",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo:
      "授权归档 Reconcile No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation:
      "授权归档 Reconcile 补救",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview:
      "授权归档 Reconcile 复核",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo:
      "授权归档 Reconcile 复核 No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation:
      "授权归档复核 No-go Reconcile",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo:
      "授权归档 Reconcile No-go",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation:
      "授权归档 Reconcile 补救",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview:
      "授权归档 Reconcile 补救复核",
    persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo:
      "授权归档 Reconcile 补救复核 No-go",
    qa: "QA 验收",
    setup: "设置",
    login: "登录",
  },
};

export function AppShell({ children }: AppShellProps) {
  const { locale } = useLanguage();
  const copy = shellCopy[locale];
  const navItems = [
    { href: "/dashboard", label: copy.workspace },
    { href: "/intake", label: copy.intake },
    { href: "/people", label: copy.people },
    { href: "/agents", label: copy.agents },
    { href: "/runs", label: copy.runs },
    { href: "/safety", label: copy.safety },
    { href: "/reports", label: copy.reports },
    { href: "/billing", label: copy.billing },
    { href: "/sync", label: copy.sync },
    { href: "/server-writers", label: copy.writers },
    { href: "/server-writers/dry-run", label: copy.dryRun },
    { href: "/server-writers/guardrail", label: copy.guardrail },
    { href: "/server-writers/adapter", label: copy.adapter },
    { href: "/server-writers/audit", label: copy.audit },
    { href: "/server-writers/idempotency", label: copy.idempotency },
    { href: "/server-writers/rollback", label: copy.rollback },
    { href: "/server-writers/rollout", label: copy.rollout },
    { href: "/server-writers/isolation", label: copy.isolation },
    { href: "/server-writers/stubs", label: copy.stubs },
    { href: "/server-writers/payloads", label: copy.payloads },
    { href: "/server-writers/redaction", label: copy.redaction },
    { href: "/server-writers/evidence", label: copy.evidence },
    { href: "/server-writers/migration", label: copy.writerMigration },
    { href: "/server-writers/migration-review", label: copy.writerMigrationReview },
    { href: "/server-writers/migration-runbook", label: copy.writerMigrationRunbook },
    { href: "/server-writers/schema-verification", label: copy.schemaVerification },
    { href: "/server-writers/persistence-dry-run", label: copy.persistenceDryRun },
    { href: "/server-writers/persistence-adapter", label: copy.persistenceAdapter },
    { href: "/server-writers/persistence-review", label: copy.persistenceReview },
    { href: "/server-writers/persistence-fixtures", label: copy.persistenceFixtures },
    { href: "/server-writers/persistence-no-go", label: copy.persistenceNoGo },
    { href: "/server-writers/persistence-proposal", label: copy.persistenceProposal },
    { href: "/server-writers/persistence-acceptance", label: copy.persistenceAcceptance },
    { href: "/server-writers/persistence-approval", label: copy.persistenceApproval },
    {
      href: "/server-writers/persistence-branch-preflight",
      label: copy.persistenceBranchPreflight,
    },
    {
      href: "/server-writers/persistence-diff-contract",
      label: copy.persistenceDiffContract,
    },
    {
      href: "/server-writers/persistence-patch-review",
      label: copy.persistencePatchReview,
    },
    {
      href: "/server-writers/persistence-owner-signoff",
      label: copy.persistenceOwnerSignoff,
    },
    {
      href: "/server-writers/persistence-release-no-go",
      label: copy.persistenceReleaseNoGo,
    },
    {
      href: "/server-writers/persistence-human-go-no-go",
      label: copy.persistenceHumanGoNoGo,
    },
    {
      href: "/server-writers/persistence-external-approval-archive",
      label: copy.persistenceExternalArchive,
    },
    {
      href: "/server-writers/persistence-authorization-readiness",
      label: copy.persistenceAuthorizationReadiness,
    },
    {
      href: "/server-writers/persistence-authorization-no-go",
      label: copy.persistenceAuthorizationNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-remediation",
      label: copy.persistenceAuthorizationRemediation,
    },
    {
      href: "/server-writers/persistence-authorization-remediation-review",
      label: copy.persistenceAuthorizationRemediationReview,
    },
    {
      href: "/server-writers/persistence-authorization-remediation-review-no-go",
      label: copy.persistenceAuthorizationRemediationReviewNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-preflight",
      label: copy.persistenceAuthorizationReconsiderationPreflight,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-no-go",
      label: copy.persistenceAuthorizationReconsiderationNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-remediation",
      label: copy.persistenceAuthorizationReconsiderationRemediation,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-remediation-review",
      label: copy.persistenceAuthorizationReconsiderationRemediationReview,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-remediation-review-no-go",
      label: copy.persistenceAuthorizationReconsiderationRemediationReviewNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision",
      label: copy.persistenceAuthorizationReconsiderationFinalDecision,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive",
      label: copy.persistenceAuthorizationReconsiderationFinalDecisionArchive,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go",
      label: copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediation,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReview,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliation,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-no-go",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediation,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReview,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview,
    },
    {
      href: "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go",
      label:
        copy.persistenceAuthorizationReconsiderationFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo,
    },
    { href: "/qa", label: copy.qa },
    { href: "/setup", label: copy.setup },
    { href: "/login", label: copy.login },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Project MiroFish
            </span>
            <span className="text-lg font-semibold text-slate-950">
              {copy.productLine}
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
