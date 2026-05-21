"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { isSupabaseConfigured } from "@/lib/env";

const dashboardCopy = {
  en: {
    title: "MVP operator workspace",
    body: "All local MVP shells are now available. Supabase sync and server-writer boundaries now separate client drafts, generated artifacts, and payment-owned records.",
    supabaseReady: "Supabase ready",
    supabaseBlocked: "Supabase not configured",
    ready: "Ready",
    envNeeded: "Env needed",
    next: "Next",
    planned: "Planned",
    nextTaskTitle: "Next Codex task",
    nextTaskBody:
      "Prepare the next read-only remediation path after the remediation review no-go packet. Keep it non-executable and do not accept no-go outcomes, review outcomes, remediation, reconciliation, archive outcomes, final decisions, deny or grant authorization, store approvals, create implementation files, branches, service-role clients, migrations, tests, deployments, or writes.",
    openIntake: "Open seed intake",
    openPeople: "Confirm people",
    openAgents: "Open agents",
    openRuns: "Open run shell",
    openSafety: "Open safety",
    openReports: "Open reports",
    openBilling: "Open billing",
    openSync: "Open sync",
    openWriters: "Open writers",
    openContracts: "Open contracts",
    openDryRun: "Open dry-run",
    openGuardrail: "Open guardrail",
    openAdapter: "Open adapter",
    openAudit: "Open audit",
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
    openQa: "Open QA",
    openSetup: "Open setup",
    openMigration: "Open migration",
    checkLogin: "Check login setup",
    modules: [
      {
        title: "Project shell",
        status: "ready",
        detail: "Next.js app, routing, base layout, and environment contract.",
      },
      {
        title: "Authentication",
        status: "envNeeded",
        detail:
          "Supabase magic-link login is wired after URL and anon key are set.",
      },
      {
        title: "Seed context",
        status: "ready",
        detail:
          "Main question, track A/B, time window, privacy acknowledgement, and local draft persistence.",
      },
      {
        title: "Person confirmation",
        status: "ready",
        detail:
          "Extract involved people from the seed context and confirm identity through a chat-style local flow.",
      },
      {
        title: "Agent ecology",
        status: "ready",
        detail:
          "Digital self, optional parallel selves, confirmed NPC placeholders, and read-only ecology shell.",
      },
      {
        title: "Simulation run shell",
        status: "ready",
        detail:
          "Queued run state, empty event ticks, cost gate placeholder, and generation disabled state.",
      },
      {
        title: "SafetyVerifier",
        status: "ready",
        detail:
          "Risk levels, blocked content states, readiness gates, and safety copy before report generation.",
      },
      {
        title: "Simulation report",
        status: "ready",
        detail:
          "Locked report shell, Claims placeholders, evidence refs, and report-ready gate.",
      },
      {
        title: "Payments and support",
        status: "ready",
        detail:
          "Stripe placeholder entitlement, refund path, deletion request, and support-ticket shell.",
      },
      {
        title: "Supabase persistence",
        status: "ready",
        detail:
          "Sync center for client-writable user drafts and blocked server-owned artifacts.",
      },
      {
        title: "Server writers",
        status: "ready",
        detail:
          "Read-only status page and API for backend-only writers without exposing service-role secrets.",
      },
      {
        title: "MVP QA and environment setup",
        status: "ready",
        detail:
          "Founder-friendly checklist for Supabase migration, env configuration, RLS verification, and acceptance testing.",
      },
      {
        title: "Supabase setup guide",
        status: "ready",
        detail:
          "Status API, setup page, and execution guide for real Supabase auth and safe draft sync.",
      },
      {
        title: "Migration SQL handoff",
        status: "ready",
        detail:
          "A read-only SQL page and API expose the MVP migration for direct Supabase SQL Editor execution.",
      },
      {
        title: "Authenticated Supabase sync",
        status: "ready",
        detail:
          "Magic-link session, client-writable draft sync, and remote boundary verification are working.",
      },
      {
        title: "Controlled backend writers",
        status: "ready",
        detail:
          "Read-only writer contracts define triggers, inputs, safety gates, idempotency keys, and disabled feature flags.",
      },
      {
        title: "Server writer dry-run endpoints",
        status: "ready",
        detail:
          "Server-only dry-run API validates request shape and gates without performing service-role writes.",
      },
      {
        title: "Writer execution guardrail",
        status: "ready",
        detail:
          "Read-only guardrail defines auth context, service-role isolation, audit events, rollback behavior, and rollout gates.",
      },
      {
        title: "Disabled service-role adapter",
        status: "ready",
        detail:
          "Server-only inert adapter boundary returns blocked status without creating a service-role client or writing rows.",
      },
      {
        title: "Audit event model",
        status: "ready",
        detail:
          "Read-only audit contracts define fields, redaction, event types, sample blocked events, and retention rules.",
      },
      {
        title: "Idempotency registry model",
        status: "ready",
        detail:
          "Read-only idempotency contracts define key templates, replay rules, conflict behavior, and retention policy.",
      },
      {
        title: "Rollback compensation model",
        status: "ready",
        detail:
          "Read-only rollback contracts define compensation strategies, forbidden destructive actions, review rules, and sample records.",
      },
      {
        title: "Writer rollout checklist",
        status: "ready",
        detail:
          "Read-only rollout gates define production blockers, canary order, abort conditions, and per-writer launch prerequisites.",
      },
      {
        title: "Service-role isolation test harness",
        status: "ready",
        detail:
          "Read-only isolation diagnostics prove planned writer modules stay server-only, inert, and outside browser bundles.",
      },
      {
        title: "Server-only writer module stubs",
        status: "ready",
        detail:
          "Inert .server writer module stubs exist for each contract while client creation and writes stay blocked.",
      },
      {
        title: "Writer payload parity fixtures",
        status: "ready",
        detail:
          "Align dry-run payloads, stub probes, and future writer request shapes before any real writer implementation exists.",
      },
      {
        title: "Request hashing and redaction fixtures",
        status: "ready",
        detail:
          "Define deterministic request hashes and redacted audit-safe payload previews before audit/idempotency persistence.",
      },
      {
        title: "Audit/idempotency evidence handoff",
        status: "ready",
        detail:
          "Connect request hashes and redacted previews to future audit and idempotency records without persisting them.",
      },
      {
        title: "Audit/idempotency migration proposal",
        status: "ready",
        detail:
          "Draft the future writer_audit_events and writer_idempotency_keys schema without applying migrations or enabling writes.",
      },
      {
        title: "Audit/idempotency migration review checklist",
        status: "ready",
        detail:
          "Define the manual checks required before the proposal can become an applied Supabase migration.",
      },
      {
        title: "Manual migration application runbook",
        status: "ready",
        detail:
          "Define the exact preflight, execution, post-check, and rollback steps before any SQL is applied.",
      },
      {
        title: "Applied-schema verification harness",
        status: "ready",
        detail:
          "Define a read-only checker for whether the audit/idempotency tables exist after a future manual migration.",
      },
      {
        title: "Audit/idempotency persistence dry-run gate",
        status: "ready",
        detail:
          "Define blocked dry-run checks for future audit writes and idempotency reservations after schema verification.",
      },
      {
        title: "Audit/idempotency persistence adapter design",
        status: "ready",
        detail:
          "Design the future server-only adapter boundary, transaction order, failure behavior, and evidence inputs without implementing real writes.",
      },
      {
        title: "Persistence adapter implementation review checklist",
        status: "ready",
        detail:
          "Define the evidence and approvals required before the design-only adapter can become executable server-only code.",
      },
      {
        title: "Persistence adapter fixture test harness",
        status: "ready",
        detail:
          "Create read-only fixtures for transaction, idempotency, audit redaction, rollback, and rollout evidence without implementing persistence.",
      },
      {
        title: "Persistence adapter no-go evidence packet",
        status: "ready",
        detail:
          "Aggregate review blockers, fixture assertions, and release no-go evidence into a single read-only implementation handoff gate.",
      },
      {
        title: "Persistence adapter implementation proposal scaffold",
        status: "ready",
        detail:
          "Draft a read-only implementation proposal outline without creating adapter code, transactions, service-role clients, or writes.",
      },
      {
        title: "Persistence adapter implementation acceptance test matrix",
        status: "ready",
        detail:
          "Map the proposal scaffold to read-only acceptance tests and approval criteria before any adapter implementation exists.",
      },
      {
        title: "Persistence adapter implementation approval packet",
        status: "ready",
        detail:
          "Prepare a read-only owner approval packet without creating implementation branches, service-role clients, migrations, or adapter code.",
      },
      {
        title: "Persistence adapter implementation branch preflight checklist",
        status: "ready",
        detail:
          "Define the future branch preflight checks without creating branches, adapter code, privileged clients, migrations, or writes.",
      },
      {
        title: "Persistence adapter implementation dry-run diff contract",
        status: "ready",
        detail:
          "Define a future implementation diff contract without creating implementation files, branches, tests, privileged clients, migrations, or writes.",
      },
      {
        title: "Persistence adapter implementation patch review packet",
        status: "ready",
        detail:
          "Define a future patch review packet without creating implementation files, branches, tests, privileged clients, migrations, or writes.",
      },
      {
        title: "Persistence adapter implementation owner signoff packet",
        status: "ready",
        detail:
          "Define future owner signoff requirements without accepting patches, creating approval records, branches, implementation files, tests, privileged clients, migrations, or writes.",
      },
      {
        title: "Persistence adapter implementation release no-go packet",
        status: "ready",
        detail:
          "Define final release blockers before implementation without recording owner approvals, accepting patches, creating branches, implementation files, tests, privileged clients, migrations, or writes.",
      },
      {
        title: "Persistence adapter human go/no-go runbook",
        status: "ready",
        detail:
          "Define the future human decision process without storing release decisions, enabling feature flags, deploying code, or running production writers.",
      },
      {
        title: "Persistence adapter external approval archive checklist",
        status: "ready",
        detail:
          "Define how future human decision artifacts should be named, checked, and archived outside the app without storing approvals or enabling implementation.",
      },
      {
        title: "Persistence adapter implementation authorization readiness checklist",
        status: "ready",
        detail:
          "Define how a future reviewer would decide whether external approval archives are ready for implementation authorization without accepting them in the app.",
      },
      {
        title: "Persistence adapter implementation authorization no-go decision packet",
        status: "ready",
        detail:
          "Define the future no-go decision packet for implementation authorization while still avoiding archive acceptance, approval storage, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization remediation plan",
        status: "ready",
        detail:
          "Map the no-go blockers into a read-only remediation plan without accepting archives, recording authorization decisions, creating branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization remediation review checklist",
        status: "ready",
        detail:
          "Review whether external remediation states are complete enough for future authorization reconsideration while still avoiding app-side remediation acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization remediation review no-go packet",
        status: "ready",
        detail:
          "Summarize why remediation review still cannot unlock implementation authorization while external evidence remains unaccepted and all runtime write paths stay blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration preflight checklist",
        status: "ready",
        detail:
          "Define the future read-only preflight for reconsidering authorization while still refusing no-go acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration no-go packet",
        status: "ready",
        detail:
          "Summarize why reconsideration preflight still cannot unlock implementation authorization while preflight acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration remediation plan",
        status: "ready",
        detail:
          "Map reconsideration no-go blockers into a read-only remediation plan while still refusing no-go acceptance, preflight acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration remediation review checklist",
        status: "ready",
        detail:
          "Review whether external reconsideration remediation states are complete enough for a later authorization reconsideration review while still avoiding app-side remediation acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration remediation review no-go packet",
        status: "ready",
        detail:
          "Summarize why the reconsideration remediation review still cannot unlock implementation authorization while review acceptance, external remediation acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration final no-go/go packet",
        status: "ready",
        detail:
          "Convert the reconsideration remediation review no-go result into a final read-only decision packet while final go, final no-go acceptance, authorization records, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive checklist",
        status: "ready",
        detail:
          "Define external archive metadata, artifacts, completeness, redaction, retention, and tamper-evidence requirements while still refusing archive acceptance, final decision acceptance, authorization grants, approval storage, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive no-go packet",
        status: "ready",
        detail:
          "Summarize why the external final decision archive is still no-go before any archive acceptance, final decision acceptance, authorization grants, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation plan",
        status: "ready",
        detail:
          "Map archive no-go blockers into a read-only external remediation plan while still refusing archive no-go acceptance, archive acceptance, final decision acceptance, authorization grants, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review checklist",
        status: "ready",
        detail:
          "Review whether external archive remediation states are complete enough for a later archive decision review while still refusing archive remediation acceptance, archive acceptance, final decision acceptance, authorization grants, branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go packet",
        status: "ready",
        detail:
          "Summarize why the archive remediation review still cannot unlock implementation authorization while review acceptance, archive remediation acceptance, archive acceptance, final decision acceptance, authorization grants, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation checklist",
        status: "ready",
        detail:
          "Reconcile the archive remediation review no-go packet for internal completeness while still refusing no-go acceptance, review acceptance, archive acceptance, final decision acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation no-go packet",
        status: "ready",
        detail:
          "Summarize why reconciliation still cannot unlock implementation authorization while reconciliation acceptance, no-go acceptance, review acceptance, archive acceptance, final decision acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation plan",
        status: "ready",
        detail:
          "Map reconciliation no-go blockers into a read-only remediation plan while still refusing no-go acceptance, remediation acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review checklist",
        status: "ready",
        detail:
          "Review whether reconciliation remediation states are complete enough for a later decision while still refusing remediation acceptance, review acceptance, no-go acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go packet",
        status: "ready",
        detail:
          "Summarize why reconciliation remediation review still cannot unlock implementation authorization while review acceptance, remediation acceptance, no-go acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go reconciliation checklist",
        status: "ready",
        detail:
          "Reconcile the unresolved review no-go gaps while still refusing review no-go acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go packet",
        status: "ready",
        detail:
          "Summarize why no-go reconciliation still cannot unlock implementation authorization while reconciliation acceptance, no-go acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation plan",
        status: "ready",
        detail:
          "Map the latest reconciliation no-go blockers into a read-only remediation plan while still refusing no-go acceptance, remediation acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review checklist",
        status: "ready",
        detail:
          "Review the latest remediation plan shape without accepting remediation, resolving blockers, authorizing implementation, creating branches, files, tests, privileged clients, migrations, deployments, or writes.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go packet",
        status: "ready",
        detail:
          "Summarize why remediation review still cannot unlock implementation authorization while review acceptance, remediation acceptance, no-go acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes remain blocked.",
      },
      {
        title: "Persistence adapter implementation authorization reconsideration external final decision archive remediation review no-go reconciliation remediation review no-go reconciliation no-go remediation review no-go remediation path",
        status: "next",
        detail:
          "Map the latest remediation review no-go blockers into the next read-only remediation path while still refusing no-go acceptance, remediation acceptance, authorization denial or grants, branches, files, tests, privileged clients, migrations, deployments, and writes.",
      },
    ],
  },
  zh: {
    title: "MVP 运营工作台",
    body: "本地 MVP 外壳已经可用。Supabase 同步与服务端写入边界已经区分客户端草稿、系统生成物和支付权益记录。",
    supabaseReady: "Supabase 已就绪",
    supabaseBlocked: "Supabase 未配置",
    ready: "已完成",
    envNeeded: "待配置",
    next: "下一步",
    planned: "计划中",
    nextTaskTitle: "下一轮 Codex 任务",
    nextTaskBody:
      "下一步准备补救复核 No-go 包之后的只读补救路径。继续保持不可执行，不接受 No-go 结果、不接受复核结果、不接受补救、不接受 reconciliation、不接受归档结果、不接受最终决策、不拒绝或授予授权、不存储批准，不创建实现文件、分支、service-role client、migration、测试、部署或写入。",
    openIntake: "打开推演入口",
    openPeople: "确认人物",
    openAgents: "打开 Agent 生态",
    openRuns: "打开 Run 外壳",
    openSafety: "打开安全检查",
    openReports: "打开报告",
    openBilling: "打开支付客服",
    openSync: "打开同步",
    openWriters: "打开服务端写入",
    openContracts: "打开契约",
    openDryRun: "打开 dry-run",
    openGuardrail: "打开护栏",
    openAdapter: "打开适配器",
    openAudit: "打开审计",
    openIdempotency: "打开幂等",
    openRollback: "打开回滚",
    openRollout: "打开发布",
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
    openQa: "打开 QA",
    openSetup: "打开设置",
    openMigration: "打开 migration",
    checkLogin: "检查登录设置",
    modules: [],
  },} as const;

type ModuleStatus = "ready" | "envNeeded" | "next" | "planned";

function getStatusTone(status: ModuleStatus) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "envNeeded") {
    return "blocked";
  }

  return "planned";
}

export default function DashboardPage() {
  const configured = isSupabaseConfigured();
  const { locale } = useLanguage();
  const copy =
    locale === "zh"
      ? { ...dashboardCopy.zh, modules: dashboardCopy.en.modules }
      : dashboardCopy.en;
  const statusLabels: Record<ModuleStatus, string> = {
    ready: copy.ready,
    envNeeded: copy.envNeeded,
    next: copy.next,
    planned: copy.planned,
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </div>
        <StatusPill tone={configured ? "ready" : "blocked"}>
          {configured ? copy.supabaseReady : copy.supabaseBlocked}
        </StatusPill>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {copy.modules.map((module) => (
          <article
            key={module.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">
                {module.title}
              </h2>
              <StatusPill tone={getStatusTone(module.status)}>
                {statusLabels[module.status]}
              </StatusPill>
            </div>
            <p className="text-sm leading-6 text-slate-600">{module.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.nextTaskTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {copy.nextTaskBody}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/intake"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.openIntake}
          </Link>
          <Link
            href="/people"
            className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            {copy.openPeople}
          </Link>
          <Link
            href="/agents"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openAgents}
          </Link>
          <Link
            href="/runs"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openRuns}
          </Link>
          <Link
            href="/safety"
            className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
          >
            {copy.openSafety}
          </Link>
          <Link
            href="/reports"
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            {copy.openReports}
          </Link>
          <Link
            href="/billing"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openBilling}
          </Link>
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
            href="/server-writers/contracts"
            className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
          >
            {copy.openContracts}
          </Link>
          <Link
            href="/server-writers/dry-run"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
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
            href="/setup"
            className="rounded-md border border-lime-300 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-100"
          >
            {copy.openSetup}
          </Link>
          <Link
            href="/setup/migration"
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            {copy.openMigration}
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {copy.checkLogin}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
