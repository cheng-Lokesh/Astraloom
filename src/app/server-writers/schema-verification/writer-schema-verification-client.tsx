"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterSchemaTableVerification,
  WriterSchemaVerificationCheck,
  WriterSchemaVerificationCheckCategory,
  WriterSchemaVerificationPayload,
  WriterSchemaVerificationProbeResult,
} from "@/types/writer-schema-verification";

type WriterSchemaVerificationClientPageProps = {
  payload: WriterSchemaVerificationPayload;
};

const schemaCopy = {
  en: {
    title: "Applied-schema verification harness",
    badge: "Public read-only probe",
    body: "This page defines and runs a non-privileged signal check for future manually applied audit/idempotency tables. It cannot prove RLS, policy absence, or row counts without manual database evidence.",
    notice:
      "Do not treat this page as production approval. A public REST response is only a signal; database-level verification remains manual.",
    safetyState: "Safety state",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    verificationMode: "Verification mode",
    sourceProposal: "Source proposal",
    sourceChecklist: "Source checklist",
    sourceRunbook: "Source runbook",
    sqlHash: "SQL hash",
    projectUrl: "Project URL",
    publishableKey: "Publishable key",
    checkedAt: "Checked at",
    tables: "Tables",
    reachable: "Publicly reachable",
    notDetected: "Not detected",
    blockedUnknown: "Blocked or unknown",
    networkErrors: "Network errors",
    manualRequired: "Manual DB check required",
    publicCanProvePresence: "Public probe can prove table presence",
    publicCanProveRls: "Public probe can prove RLS",
    publicCanProvePolicy: "Public probe can prove policy absence",
    publicCanProveRows: "Public probe can prove zero rows",
    schemaVerified: "Schema verified",
    readyForWriters: "Ready for writer implementation",
    wouldCreateMigrationFile: "Would create migration file",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldAlterExistingTables: "Would alter existing tables",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldCreateServiceRoleClient: "Would create service-role client",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    manualSql: "Manual SQL checks",
    tableChecks: "Table checks",
    signal: "Signal",
    restStatus: "REST status",
    publicDetail: "Public probe detail",
    expected: "Expected",
    manualSqlChecks: "Manual SQL for this table",
    checks: "Checks",
    evidenceRequired: "Evidence required",
    probe: "Probe table",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe: "Probe a table to confirm the harness stays read-only and blocked.",
    openRunbook: "Open SQL runbook",
    openMigration: "Open SQL proposal",
    openDashboard: "Back to dashboard",
    categoryLabels: {
      public_config: "Public config",
      table_presence: "Table presence",
      rls: "RLS",
      policy: "Policy",
      row_count: "Row count",
      runtime_gate: "Runtime gate",
      manual_review: "Manual review",
    } satisfies Record<WriterSchemaVerificationCheckCategory, string>,
  },
  zh: {
    title: "Applied-schema verification harness",
    badge: "公开只读探测",
    body: "这个页面为未来人工应用后的 audit/idempotency 表定义非特权信号检查。它不能在没有人工数据库证据的情况下证明 RLS、policy 缺失或 row count。",
    notice:
      "不要把这个页面当作生产批准。公开 REST 响应只是信号；数据库级验证仍然需要人工完成。",
    safetyState: "安全状态",
    safeMode: "安全模式",
    readOnly: "只读",
    verificationMode: "验证模式",
    sourceProposal: "来源提案",
    sourceChecklist: "来源审查",
    sourceRunbook: "来源手册",
    sqlHash: "SQL hash",
    projectUrl: "Project URL",
    publishableKey: "Publishable key",
    checkedAt: "检查时间",
    tables: "表",
    reachable: "公开可访问",
    notDetected: "未探测到",
    blockedUnknown: "被阻断或未知",
    networkErrors: "网络错误",
    manualRequired: "需要人工数据库检查",
    publicCanProvePresence: "公开探测能否证明表存在",
    publicCanProveRls: "公开探测能否证明 RLS",
    publicCanProvePolicy: "公开探测能否证明 policy 缺失",
    publicCanProveRows: "公开探测能否证明零行",
    schemaVerified: "Schema 已验证",
    readyForWriters: "可进入 writer 实现",
    wouldCreateMigrationFile: "是否创建 migration 文件",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldAlterExistingTables: "是否修改现有表",
    wouldWriteRows: "是否写入数据",
    wouldWriteAuditRows: "是否写入 audit",
    wouldReserveIdempotencyKeys: "是否预留幂等键",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    manualSql: "人工 SQL 检查",
    tableChecks: "表检查",
    signal: "信号",
    restStatus: "REST 状态",
    publicDetail: "公开探测详情",
    expected: "预期",
    manualSqlChecks: "本表人工 SQL",
    checks: "检查项",
    evidenceRequired: "所需证据",
    probe: "探测表",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一张表，确认 harness 仍然只读且阻断。",
    openRunbook: "打开 SQL 手册",
    openMigration: "打开 SQL 提案",
    openDashboard: "返回工作台",
    categoryLabels: {
      public_config: "公开配置",
      table_presence: "表存在性",
      rls: "RLS",
      policy: "Policy",
      row_count: "行数",
      runtime_gate: "运行门槛",
      manual_review: "人工审查",
    } satisfies Record<WriterSchemaVerificationCheckCategory, string>,
  },
} as const;

type SchemaCopy = (typeof schemaCopy)[keyof typeof schemaCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: SchemaCopy;
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

function CodeList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <pre
          key={item}
          className="overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-50"
        >
          <code>{item}</code>
        </pre>
      ))}
    </div>
  );
}

function CheckList({
  checks,
  copy,
}: {
  checks: WriterSchemaVerificationCheck[];
  copy: SchemaCopy;
}) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <article
          key={check.id}
          className="rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-950">
                {check.title}
              </h4>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {check.id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="planned">
                {copy.categoryLabels[check.category]}
              </StatusPill>
              <StatusPill
                tone={check.status === "passed" ? "ready" : "blocked"}
              >
                {check.status}
              </StatusPill>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {check.detail}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            <span className="font-semibold">{copy.evidenceRequired}: </span>
            {check.evidenceRequired}
          </p>
        </article>
      ))}
    </div>
  );
}

function TableCard({
  table,
  copy,
  onProbe,
  isProbing,
}: {
  table: WriterSchemaTableVerification;
  copy: SchemaCopy;
  onProbe: (tableName: WriterSchemaTableVerification["tableName"]) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {table.tableName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {copy.publicDetail}: {table.publicProbeDetail}
          </p>
        </div>
        <StatusPill tone="blocked">{table.publicProbeSignal}</StatusPill>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="planned">
          {copy.restStatus}: {table.publicRestStatusCode ?? "none"}
        </StatusPill>
        <BoolPill
          value={table.manualDatabaseCheckRequired}
          label={copy.manualRequired}
          copy={copy}
        />
        <BoolPill
          value={table.tablePresenceVerified}
          label={copy.schemaVerified}
          copy={copy}
        />
        <BoolPill
          value={table.rlsVerified}
          label={copy.publicCanProveRls}
          copy={copy}
        />
        <BoolPill
          value={table.zeroRowsVerified}
          label={copy.publicCanProveRows}
          copy={copy}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.manualSqlChecks}
          </h4>
          <div className="mt-2">
            <CodeList items={table.manualSqlChecks} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.checks}
          </h4>
          <div className="mt-2">
            <CheckList checks={table.checks} copy={copy} />
          </div>
        </div>
      </div>

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

export function WriterSchemaVerificationClientPage({
  payload,
}: WriterSchemaVerificationClientPageProps) {
  const { locale } = useLanguage();
  const copy = schemaCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterSchemaVerificationProbeResult | null>(null);
  const [probingTableName, setProbingTableName] =
    useState<WriterSchemaTableVerification["tableName"] | null>(null);

  async function probe(tableName: WriterSchemaTableVerification["tableName"]) {
    setProbingTableName(tableName);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/schema-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName }),
      });
      const result = (await response.json()) as WriterSchemaVerificationProbeResult;
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
            {copy.verificationMode}: {payload.verificationMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceProposal}: {payload.sourceMigrationName}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceChecklist}: {payload.sourceChecklistMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceRunbook}: {payload.sourceRunbookMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sqlHash}: {payload.sourceSqlSha256}
          </StatusPill>
          <BoolPill
            value={payload.projectUrlConfigured}
            label={copy.projectUrl}
            copy={copy}
          />
          <BoolPill
            value={payload.publishableKeyConfigured}
            label={copy.publishableKey}
            copy={copy}
          />
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.tables}: {payload.checkedTableCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.reachable}: {payload.detectedPubliclyReachableCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.notDetected}: {payload.notDetectedCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.blockedUnknown}: {payload.blockedOrUnknownCount}
          </StatusPill>
          <StatusPill tone={payload.networkErrorCount > 0 ? "blocked" : "ready"}>
            {copy.networkErrors}: {payload.networkErrorCount}
          </StatusPill>
          <BoolPill
            value={payload.manualDatabaseCheckRequired}
            label={copy.manualRequired}
            copy={copy}
          />
          <BoolPill
            value={payload.publicProbeCanProveTablePresence}
            label={copy.publicCanProvePresence}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.publicProbeCanProveRls}
            label={copy.publicCanProveRls}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.publicProbeCanProvePolicyAbsence}
            label={copy.publicCanProvePolicy}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.publicProbeCanProveZeroRows}
            label={copy.publicCanProveRows}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.schemaVerified}
            label={copy.schemaVerified}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.readyForWriterImplementation}
            label={copy.readyForWriters}
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
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/migration-runbook"
            className="rounded-md border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
          >
            {copy.openRunbook}
          </Link>
          <Link
            href="/server-writers/migration"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openMigration}
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
                  {copy.signal}: {probeResult.publicProbeSignal ?? "none"}
                </StatusPill>
                <StatusPill tone="planned">
                  {copy.restStatus}: {probeResult.publicRestStatusCode ?? "none"}
                </StatusPill>
                <BoolPill
                  value={probeResult.schemaVerified}
                  label={copy.schemaVerified}
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
        <h2 className="text-base font-semibold text-slate-950">
          {copy.manualSql}
        </h2>
        <div className="mt-4">
          <CodeList items={payload.manualVerificationSql} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.tableChecks}
        </h2>
        <div className="grid gap-4">
          {payload.tables.map((table) => (
            <TableCard
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
