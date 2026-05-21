"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterMigrationReviewCategory,
  WriterMigrationReviewItem,
  WriterMigrationReviewPayload,
  WriterMigrationReviewProbeResult,
  WriterMigrationReviewSection,
} from "@/types/writer-migration-review";

type WriterMigrationReviewClientPageProps = {
  payload: WriterMigrationReviewPayload;
};

const reviewCopy = {
  en: {
    title: "Audit/idempotency migration review",
    badge: "Review checklist only",
    body: "This page defines the manual checks required before the SQL proposal can become a real Supabase migration. It does not approve, create, or apply any migration.",
    notice:
      "This is an approval checklist, not an approval record. Until every blocking item is reviewed separately, the proposal must stay read-only.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    checklistMode: "Checklist mode",
    sourceProposal: "Source proposal",
    sourceChecks: "Source checks passed",
    tables: "Source tables",
    policies: "Source policies",
    sections: "Sections",
    items: "Items",
    blockingItems: "Blocking items",
    allItemsDefined: "All items defined",
    manualApprovalRequired: "Manual approval required",
    approvedForMigration: "Approved for migration",
    readyToApplyMigration: "Ready to apply migration",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateServiceRoleClient: "Would create service-role client",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    promotionRules: "Promotion rules",
    sourceRefs: "Source refs",
    reviewSections: "Review sections",
    requiredApprover: "Required approver",
    exitCriteria: "Exit criteria",
    requirement: "Requirement",
    evidenceRequired: "Evidence required",
    owner: "Owner",
    status: "Status",
    pendingManualReview: "Pending manual review",
    blocking: "Blocking",
    probe: "Probe section",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a section to confirm it stays blocked and read-only.",
    openMigration: "Open SQL proposal",
    openRollout: "Open rollout",
    openRunbook: "Open SQL runbook",
    openDashboard: "Back to dashboard",
    categoryLabels: {
      proposal_integrity: "Proposal integrity",
      schema: "Schema",
      rls: "RLS",
      index: "Index",
      privacy_retention: "Privacy and retention",
      audit: "Audit",
      idempotency: "Idempotency",
      rollback: "Rollback",
      operations: "Operations",
      approval: "Approval",
    } satisfies Record<WriterMigrationReviewCategory, string>,
  },
  zh: {
    title: "Audit/idempotency migration review",
    badge: "仅审查清单",
    body: "这个页面定义 SQL 提案升级为真实 Supabase migration 前必须完成的人工检查。它不会批准、创建或应用任何 migration。",
    notice:
      "这是审批清单，不是审批记录。所有阻断项没有被单独审查前，SQL 提案必须继续保持只读。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    checklistMode: "清单模式",
    sourceProposal: "来源提案",
    sourceChecks: "来源检查通过",
    tables: "来源表数量",
    policies: "来源 policy 数量",
    sections: "章节",
    items: "检查项",
    blockingItems: "阻断项",
    allItemsDefined: "检查项已定义",
    manualApprovalRequired: "需要人工审批",
    approvedForMigration: "已批准 migration",
    readyToApplyMigration: "可以应用 migration",
    wouldCreateMigrationFile: "是否创建 migration 文件",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldWriteRows: "是否写入数据",
    wouldWriteAuditRows: "是否写入 audit",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    promotionRules: "升级规则",
    sourceRefs: "来源引用",
    reviewSections: "审查章节",
    requiredApprover: "所需审批人",
    exitCriteria: "退出标准",
    requirement: "要求",
    evidenceRequired: "所需证据",
    owner: "负责人",
    status: "状态",
    pendingManualReview: "等待人工审查",
    blocking: "阻断",
    probe: "探测章节",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个章节，确认它仍然阻断且只读。",
    openMigration: "打开 SQL 提案",
    openRollout: "打开发布清单",
    openRunbook: "打开 SQL 手册",
    openDashboard: "返回工作台",
    categoryLabels: {
      proposal_integrity: "提案完整性",
      schema: "Schema",
      rls: "RLS",
      index: "索引",
      privacy_retention: "隐私与保留",
      audit: "Audit",
      idempotency: "幂等",
      rollback: "回滚",
      operations: "运维",
      approval: "审批",
    } satisfies Record<WriterMigrationReviewCategory, string>,
  },
} as const;

type ReviewCopy = (typeof reviewCopy)[keyof typeof reviewCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: ReviewCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
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

function ReviewItemCard({
  item,
  copy,
}: {
  item: WriterMigrationReviewItem;
  copy: ReviewCopy;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">{item.title}</h4>
          <p className="mt-1 font-mono text-xs text-slate-500">{item.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">{copy.categoryLabels[item.category]}</StatusPill>
          <StatusPill tone="blocked">{copy.pendingManualReview}</StatusPill>
          {item.blocking ? (
            <StatusPill tone="blocked">{copy.blocking}</StatusPill>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
        <div>
          <dt className="font-semibold text-slate-700">{copy.requirement}</dt>
          <dd>{item.requirement}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">
            {copy.evidenceRequired}
          </dt>
          <dd>{item.evidenceRequired}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.owner}</dt>
          <dd>{item.owner}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.sourceRefs}</dt>
          <dd className="mt-1">
            <InlineList items={item.sourceRefs} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ReviewSectionCard({
  section,
  copy,
  onProbe,
  isProbing,
}: {
  section: WriterMigrationReviewSection;
  copy: ReviewCopy;
  onProbe: (sectionId: string) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {section.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {section.purpose}
          </p>
        </div>
        <StatusPill tone="blocked">{copy.pendingManualReview}</StatusPill>
      </div>

      <dl className="mt-4 grid gap-4 text-sm leading-6 md:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-700">
            {copy.requiredApprover}
          </dt>
          <dd className="text-slate-600">{section.requiredApprover}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">{copy.exitCriteria}</dt>
          <dd className="text-slate-600">{section.exitCriteria}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-3">
        {section.items.map((item) => (
          <ReviewItemCard key={item.id} item={item} copy={copy} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onProbe(section.id)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function WriterMigrationReviewClientPage({
  payload,
}: WriterMigrationReviewClientPageProps) {
  const { locale } = useLanguage();
  const copy = reviewCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterMigrationReviewProbeResult | null>(null);
  const [probingSectionId, setProbingSectionId] = useState<string | null>(null);

  async function probe(sectionId: string) {
    setProbingSectionId(sectionId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/migration-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sectionId }),
      });
      const result = (await response.json()) as WriterMigrationReviewProbeResult;
      setProbeResult(result);
    } finally {
      setProbingSectionId(null);
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
        <StatusPill tone="blocked">{copy.badge}</StatusPill>
      </div>

      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {copy.notice}
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.safetyState}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoolPill value={payload.safeMode} label={copy.safeMode} copy={copy} />
          <BoolPill value={payload.readOnly} label={copy.readOnly} copy={copy} />
          <StatusPill tone="planned">
            {copy.checklistMode}: {payload.checklistMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceProposal}: {payload.sourceMigrationName}
          </StatusPill>
          <BoolPill
            value={payload.sourceProposalAllChecksPassed}
            label={copy.sourceChecks}
            copy={copy}
          />
          <StatusPill tone="planned">
            {copy.tables}: {payload.sourceProposedTableCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.policies}: {payload.sourceProposedPolicyCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sections}: {payload.sectionCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.items}: {payload.itemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockingItems}: {payload.blockingItemCount}
          </StatusPill>
          <BoolPill
            value={payload.allItemsDefined}
            label={copy.allItemsDefined}
            copy={copy}
          />
          <BoolPill
            value={payload.manualApprovalRequired}
            label={copy.manualApprovalRequired}
            copy={copy}
          />
          <BoolPill
            value={payload.approvedForMigration}
            label={copy.approvedForMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyToApplyMigration}
            label={copy.readyToApplyMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateMigrationFile}
            label={copy.wouldCreateMigrationFile}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldApplyMigration}
            label={copy.wouldApplyMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateTables}
            label={copy.wouldCreateTables}
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
            value={payload.wouldWriteAuditRows}
            label={copy.wouldWriteAuditRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldReserveIdempotencyKeys}
            label={copy.wouldReserveIdempotencyKeys}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldCreateServiceRoleClient}
            label={copy.wouldCreateServiceRoleClient}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/migration"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openMigration}
          </Link>
          <Link
            href="/server-writers/rollout"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openRollout}
          </Link>
          <Link
            href="/server-writers/migration-runbook"
            className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
          >
            {copy.openRunbook}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {copy.openDashboard}
          </Link>
        </div>
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.globalRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.globalRules} />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.probeResult}
          </h2>
          {probeResult ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                {probeResult.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="blocked">
                  {copy.items}: {probeResult.itemCount}
                </StatusPill>
                <StatusPill tone="blocked">
                  {copy.blockingItems}: {probeResult.blockingItemCount}
                </StatusPill>
                <BoolPill
                  value={probeResult.approvedForMigration}
                  label={copy.approvedForMigration}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldApplyMigration}
                  label={copy.wouldApplyMigration}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldCreateTables}
                  label={copy.wouldCreateTables}
                  copy={copy}
                  readyWhenTrue={false}
                />
              </div>
              <div className="grid gap-3">
                {probeResult.items.map((item) => (
                  <ReviewItemCard key={item.id} item={item} copy={copy} />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.noProbe}
            </p>
          )}
        </aside>
      </div>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.promotionRules}
        </h2>
        <div className="mt-4">
          <TextList items={payload.promotionRules} />
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.sourceRefs}
        </h2>
        <div className="mt-4">
          <InlineList items={payload.sourceRefs} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.reviewSections}
        </h2>
        <div className="grid gap-4">
          {payload.sections.map((section) => (
            <ReviewSectionCard
              key={section.id}
              section={section}
              copy={copy}
              onProbe={probe}
              isProbing={probingSectionId === section.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
