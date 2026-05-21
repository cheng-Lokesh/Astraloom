"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterMigrationProposalCheck,
  WriterMigrationProposalCheckCategory,
  WriterMigrationProposalPayload,
  WriterMigrationProposalProbeResult,
  WriterMigrationTableProposal,
} from "@/types/writer-migration-proposal";

type WriterMigrationProposalClientPageProps = {
  payload: WriterMigrationProposalPayload;
};

const migrationProposalCopy = {
  en: {
    title: "Audit/idempotency migration proposal",
    badge: "Proposal only",
    body: "This page drafts the future writer audit and idempotency tables for review. It does not create a migration file, apply SQL, or write rows.",
    notice:
      "Do not run this SQL yet. This is a VibeCoding review artifact that must pass schema, RLS, retention, and rollout review before promotion to a real migration.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    proposalMode: "Proposal mode",
    migrationName: "Migration name",
    tables: "Tables",
    indexes: "Indexes",
    policies: "Policies",
    lines: "SQL lines",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldAlterExistingTables: "Would alter existing tables",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    allChecksPassed: "All checks passed",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    sharedChecks: "Shared checks",
    proposedSql: "Proposed SQL",
    copySql: "Copy proposal",
    copied: "Copied",
    copyFailed: "Copy failed",
    tableProposals: "Table proposals",
    purpose: "Purpose",
    owner: "Owner",
    rlsRule: "RLS rule",
    retentionRule: "Retention rule",
    sourceRefs: "Source model refs",
    columns: "Columns",
    createSql: "Create SQL",
    indexSql: "Index SQL",
    rlsSql: "RLS SQL",
    checks: "Checks",
    probe: "Probe proposal",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a table proposal to confirm no migration is applied.",
    openEvidence: "Open evidence",
    openAudit: "Open audit",
    openIdempotency: "Open idempotency",
    openReview: "Open SQL review",
    openDashboard: "Back to dashboard",
    checkCategoryLabels: {
      schema: "Schema",
      rls: "RLS",
      index: "Index",
      retention: "Retention",
      evidence_alignment: "Evidence alignment",
      write_block: "Write block",
    },
  },
  zh: {
    title: "Audit/idempotency migration proposal",
    badge: "仅提案",
    body: "这个页面草拟未来 writer audit 与 idempotency 表，供审阅使用。当前不会创建 migration 文件、不会执行 SQL、不会写入数据。",
    notice:
      "现在不要运行这段 SQL。它只是 VibeCoding 审阅产物，必须先经过 schema、RLS、保留策略和发布审查，才能升级为真实 migration。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    proposalMode: "提案模式",
    migrationName: "Migration 名称",
    tables: "表",
    indexes: "索引",
    policies: "Policies",
    lines: "SQL 行数",
    wouldCreateMigrationFile: "是否创建 migration 文件",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldAlterExistingTables: "是否修改现有表",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    allChecksPassed: "所有检查通过",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    sharedChecks: "共享检查",
    proposedSql: "SQL 提案",
    copySql: "复制提案",
    copied: "已复制",
    copyFailed: "复制失败",
    tableProposals: "表提案",
    purpose: "用途",
    owner: "Owner",
    rlsRule: "RLS 规则",
    retentionRule: "保留规则",
    sourceRefs: "来源模型引用",
    columns: "字段",
    createSql: "Create SQL",
    indexSql: "Index SQL",
    rlsSql: "RLS SQL",
    checks: "检查项",
    probe: "探测提案",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个表提案，确认不会应用 migration。",
    openEvidence: "打开证据",
    openAudit: "打开审计",
    openIdempotency: "打开幂等",
    openReview: "打开 SQL 审查",
    openDashboard: "返回工作台",
    checkCategoryLabels: {
      schema: "Schema",
      rls: "RLS",
      index: "索引",
      retention: "保留",
      evidence_alignment: "证据对齐",
      write_block: "写入阻断",
    },
  },
} as const;

type MigrationProposalCopy =
  (typeof migrationProposalCopy)[keyof typeof migrationProposalCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: MigrationProposalCopy;
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

function SqlBlock({ value }: { value: string }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-50">
      <code>{value}</code>
    </pre>
  );
}

function CheckList({
  checks,
  copy,
}: {
  checks: WriterMigrationProposalCheck[];
  copy: MigrationProposalCopy;
}) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <article
          key={check.id}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                {check.title}
              </h3>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {check.id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="planned">
                {
                  copy.checkCategoryLabels[
                    check.category as WriterMigrationProposalCheckCategory
                  ]
                }
              </StatusPill>
              <StatusPill tone={check.passed ? "ready" : "blocked"}>
                {check.passed ? copy.yes : copy.no}
              </StatusPill>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {check.detail}
          </p>
        </article>
      ))}
    </div>
  );
}

function TableProposalCard({
  table,
  copy,
  onProbe,
  isProbing,
}: {
  table: WriterMigrationTableProposal;
  copy: MigrationProposalCopy;
  onProbe: (tableName: WriterMigrationTableProposal["tableName"]) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {table.tableName}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {table.purpose}
          </p>
        </div>
        <StatusPill tone="planned">{table.owner}</StatusPill>
      </div>

      <dl className="grid gap-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.columns}
          </dt>
          <dd className="mt-2">
            <InlineList items={table.proposedColumns} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.sourceRefs}
          </dt>
          <dd className="mt-2">
            <InlineList items={table.sourceModelRefs} />
          </dd>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.rlsRule}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-slate-600">
              {table.rlsRule}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.retentionRule}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-slate-600">
              {table.retentionRule}
            </dd>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <BoolPill
            value={table.wouldCreateTable}
            label={copy.wouldCreateTables}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={table.wouldApplySql}
            label={copy.wouldApplyMigration}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={table.wouldWriteRows}
            label={copy.wouldWriteRows}
            copy={copy}
            readyWhenTrue={false}
          />
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.createSql}
          </dt>
          <dd className="mt-2">
            <SqlBlock value={table.createSql} />
          </dd>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.indexSql}
            </dt>
            <dd className="mt-2">
              <SqlBlock value={table.indexSql.join("\n")} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {copy.rlsSql}
            </dt>
            <dd className="mt-2">
              <SqlBlock value={table.rlsSql.join("\n")} />
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">
            {copy.checks}
          </dt>
          <dd className="mt-2">
            <CheckList checks={table.checks} copy={copy} />
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onProbe(table.tableName)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probe}
      </button>
    </article>
  );
}

export function WriterMigrationProposalClientPage({
  payload,
}: WriterMigrationProposalClientPageProps) {
  const { locale } = useLanguage();
  const copy = migrationProposalCopy[locale];
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [probeResult, setProbeResult] =
    useState<WriterMigrationProposalProbeResult | null>(null);
  const [probingTableName, setProbingTableName] =
    useState<WriterMigrationTableProposal["tableName"] | null>(null);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(payload.proposedSql);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  async function probe(tableName: WriterMigrationTableProposal["tableName"]) {
    setProbingTableName(tableName);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/migration-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName }),
      });
      const result = (await response.json()) as WriterMigrationProposalProbeResult;
      setProbeResult(result);
    } finally {
      setProbingTableName(null);
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
        <StatusPill tone="planned">{copy.badge}</StatusPill>
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
            {copy.proposalMode}: {payload.proposalMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.migrationName}: {payload.migrationName}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.tables}: {payload.proposedTableCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.indexes}: {payload.proposedIndexCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.policies}: {payload.proposedPolicyCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.lines}: {payload.sqlLineCount}
          </StatusPill>
          <StatusPill tone={payload.allChecksPassed ? "ready" : "blocked"}>
            {copy.allChecksPassed}:{" "}
            {payload.allChecksPassed ? copy.yes : copy.no}
          </StatusPill>
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
            value={payload.wouldAlterExistingTables}
            label={copy.wouldAlterExistingTables}
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
          <BoolPill
            value={payload.wouldReadServiceRoleSecret}
            label={copy.wouldReadServiceRoleSecret}
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
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/evidence"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openEvidence}
          </Link>
          <Link
            href="/server-writers/audit"
            className="rounded-md border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            {copy.openAudit}
          </Link>
          <Link
            href="/server-writers/idempotency"
            className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            {copy.openIdempotency}
          </Link>
          <Link
            href="/server-writers/migration-review"
            className="rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-100"
          >
            {copy.openReview}
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
            <div className="mt-4 space-y-4 text-sm">
              <p className="leading-6 text-slate-600">
                {probeResult.summary}
              </p>
              <InlineList
                items={[probeResult.tableName ?? "no table", probeResult.proposalMode]}
              />
              <div className="flex flex-wrap gap-2">
                <BoolPill
                  value={probeResult.wouldCreateMigrationFile}
                  label={copy.wouldCreateMigrationFile}
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
                <BoolPill
                  value={probeResult.wouldWriteRows}
                  label={copy.wouldWriteRows}
                  copy={copy}
                  readyWhenTrue={false}
                />
              </div>
              <CheckList checks={probeResult.checks} copy={copy} />
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.noProbe}
            </p>
          )}
        </aside>
      </div>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            {copy.proposedSql}
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
                : copy.copySql}
          </button>
        </div>
        <SqlBlock value={payload.proposedSql} />
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.sharedChecks}
        </h2>
        <div className="mt-4">
          <CheckList checks={payload.sharedChecks} copy={copy} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.tableProposals}
        </h2>
        <div className="grid gap-4">
          {payload.tables.map((table) => (
            <TableProposalCard
              key={table.tableName}
              table={table}
              copy={copy}
              onProbe={probe}
              isProbing={probingTableName === table.tableName}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
