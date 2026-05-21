"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceDryRunCheck,
  WriterPersistenceDryRunCheckCategory,
  WriterPersistenceDryRunOperation,
  WriterPersistenceDryRunOperationGate,
  WriterPersistenceDryRunPayload,
  WriterPersistenceDryRunProbeResult,
} from "@/types/writer-persistence-dry-run";

type WriterPersistenceDryRunClientPageProps = {
  payload: WriterPersistenceDryRunPayload;
};

const persistenceCopy = {
  en: {
    title: "Audit/idempotency persistence dry-run gate",
    badge: "Persistence blocked",
    body: "This page classifies future audit writes, idempotency reservations, and evidence persistence without executing any of them. It depends on schema verification signals, but keeps every persistence path blocked.",
    notice:
      "This is not a production writer. It never writes audit rows, never reserves idempotency keys, never stores evidence, and never creates a service-role client.",
    safetyState: "Safety state",
    gateMode: "Gate mode",
    sourceVerificationMode: "Schema source",
    sourceHandoffMode: "Evidence source",
    checkedAt: "Checked at",
    schemaTables: "Schema tables",
    auditContracts: "Audit contracts",
    idempotencyContracts: "Idempotency contracts",
    evidenceFixtures: "Evidence fixtures",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    manualRequired: "Manual DB check required",
    schemaVerified: "Schema verified",
    readyForWriters: "Ready for writer implementation",
    allBlocked: "All persistence blocked",
    persistenceAllowed: "Operation persistence allowed",
    auditAllowed: "Audit persistence allowed",
    idempotencyAllowed: "Idempotency reservation allowed",
    evidenceAllowed: "Evidence persistence allowed",
    wouldPersistEvidence: "Would persist evidence",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteIdempotencyRows: "Would write idempotency rows",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    yes: "Yes",
    no: "No",
    globalRules: "Global rules",
    sharedChecks: "Shared blocking checks",
    operations: "Dry-run operations",
    futureTables: "Future tables",
    contractCount: "Contracts",
    fixtureCount: "Fixtures",
    probeSignals: "Public probe signals",
    blockedCodes: "Blocked codes",
    checks: "Checks",
    evidenceRequired: "Evidence required",
    probeOperation: "Probe operation",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one operation to confirm the gate returns blocked state without persistence.",
    openSchemaVerification: "Open schema verification",
    openEvidence: "Open evidence handoff",
    openDashboard: "Back to dashboard",
    operationLabels: {
      audit_event_write: "Audit event write",
      idempotency_key_reservation: "Idempotency key reservation",
      evidence_persistence: "Evidence persistence",
    } satisfies Record<WriterPersistenceDryRunOperation, string>,
    categoryLabels: {
      schema_verification: "Schema verification",
      manual_evidence: "Manual evidence",
      audit_model: "Audit model",
      idempotency_model: "Idempotency model",
      evidence_handoff: "Evidence handoff",
      service_role: "Service role",
      runtime_persistence: "Runtime persistence",
      release_approval: "Release approval",
    } satisfies Record<WriterPersistenceDryRunCheckCategory, string>,
  },
  zh: {
    title: "审计/幂等持久化 dry-run 门槛",
    badge: "持久化已阻断",
    body: "这个页面只分类未来的 audit 写入、幂等 key 预留和证据持久化，不执行任何真实操作。它会读取 schema verification 信号，但所有持久化路径继续保持阻断。",
    notice:
      "这不是生产 writer。它不会写 audit 行，不会预留幂等 key，不会存储证据，也不会创建 service-role client。",
    safetyState: "安全状态",
    gateMode: "门槛模式",
    sourceVerificationMode: "Schema 来源",
    sourceHandoffMode: "证据来源",
    checkedAt: "检查时间",
    schemaTables: "Schema 表",
    auditContracts: "审计契约",
    idempotencyContracts: "幂等契约",
    evidenceFixtures: "证据 fixtures",
    safeMode: "安全模式",
    readOnly: "只读",
    manualRequired: "需要人工数据库检查",
    schemaVerified: "Schema 已验证",
    readyForWriters: "可进入 writer 实现",
    allBlocked: "所有持久化已阻断",
    persistenceAllowed: "允许本操作持久化",
    auditAllowed: "允许审计持久化",
    idempotencyAllowed: "允许幂等预留",
    evidenceAllowed: "允许证据持久化",
    wouldPersistEvidence: "是否持久化证据",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入 audit",
    wouldReserveIdempotencyKeys: "是否预留幂等 key",
    wouldWriteIdempotencyRows: "是否写入幂等行",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    yes: "是",
    no: "否",
    globalRules: "全局规则",
    sharedChecks: "共享阻断检查",
    operations: "Dry-run 操作",
    futureTables: "未来表",
    contractCount: "契约数",
    fixtureCount: "Fixtures",
    probeSignals: "公开探测信号",
    blockedCodes: "阻断代码",
    checks: "检查项",
    evidenceRequired: "所需证据",
    probeOperation: "探测操作",
    probing: "探测中...",
    probeResult: "探测结果",
    noProbe: "探测一个操作，确认门槛返回阻断状态且不执行持久化。",
    openSchemaVerification: "打开 Schema 验证",
    openEvidence: "打开证据交接",
    openDashboard: "返回工作台",
    operationLabels: {
      audit_event_write: "Audit 事件写入",
      idempotency_key_reservation: "幂等 key 预留",
      evidence_persistence: "证据持久化",
    } satisfies Record<WriterPersistenceDryRunOperation, string>,
    categoryLabels: {
      schema_verification: "Schema 验证",
      manual_evidence: "人工证据",
      audit_model: "审计模型",
      idempotency_model: "幂等模型",
      evidence_handoff: "证据交接",
      service_role: "Service role",
      runtime_persistence: "运行时持久化",
      release_approval: "发布审批",
    } satisfies Record<WriterPersistenceDryRunCheckCategory, string>,
  },
} as const;

type PersistenceCopy = (typeof persistenceCopy)[keyof typeof persistenceCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: PersistenceCopy;
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

function CheckList({
  checks,
  copy,
}: {
  checks: WriterPersistenceDryRunCheck[];
  copy: PersistenceCopy;
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

function OperationCard({
  gate,
  copy,
  onProbe,
  isProbing,
}: {
  gate: WriterPersistenceDryRunOperationGate;
  copy: PersistenceCopy;
  onProbe: (operation: WriterPersistenceDryRunOperation) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {copy.operationLabels[gate.operation]}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{gate.title}</p>
        </div>
        <StatusPill tone="blocked">{copy.badge}</StatusPill>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="planned">
          {copy.futureTables}: {gate.futureTableNames.join(", ")}
        </StatusPill>
        <StatusPill tone="planned">
          {copy.contractCount}: {gate.sourceContractIds.length}
        </StatusPill>
        <StatusPill tone="planned">
          {copy.fixtureCount}: {gate.sourceFixtureCount}
        </StatusPill>
        <BoolPill
          value={gate.persistenceAllowed}
          label={copy.persistenceAllowed}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={gate.wouldWriteRows}
          label={copy.wouldWriteRows}
          copy={copy}
          readyWhenTrue={false}
        />
        <BoolPill
          value={gate.wouldCreateServiceRoleClient}
          label={copy.wouldCreateServiceRoleClient}
          copy={copy}
          readyWhenTrue={false}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.probeSignals}
          </h4>
          <div className="mt-2 grid gap-2">
            {gate.sourcePublicProbeSignals.map((signal) => (
              <div
                key={signal.tableName}
                className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600"
              >
                <span className="font-semibold text-slate-900">
                  {signal.tableName}
                </span>
                : {signal.signal} ({signal.statusCode ?? "none"})
              </div>
            ))}
          </div>

          <h4 className="mt-4 text-sm font-semibold text-slate-950">
            {copy.blockedCodes}
          </h4>
          <div className="mt-2">
            <TextList items={gate.blockedCodes} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.checks}
          </h4>
          <div className="mt-2">
            <CheckList checks={gate.checks} copy={copy} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onProbe(gate.operation)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probeOperation}
      </button>
    </article>
  );
}

export function WriterPersistenceDryRunClientPage({
  payload,
}: WriterPersistenceDryRunClientPageProps) {
  const { locale } = useLanguage();
  const copy = persistenceCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceDryRunProbeResult | null>(null);
  const [probingOperation, setProbingOperation] =
    useState<WriterPersistenceDryRunOperation | null>(null);

  async function probe(operation: WriterPersistenceDryRunOperation) {
    setProbingOperation(operation);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-dry-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operation }),
      });
      const result =
        (await response.json()) as WriterPersistenceDryRunProbeResult;
      setProbeResult(result);
    } finally {
      setProbingOperation(null);
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
            {copy.gateMode}: {payload.gateMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceVerificationMode}: {payload.sourceVerificationMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceHandoffMode}: {payload.sourceHandoffMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.schemaTables}: {payload.checkedSchemaTableCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.auditContracts}: {payload.auditContractCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.idempotencyContracts}: {payload.idempotencyContractCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.evidenceFixtures}: {payload.evidenceFixtureCount}
          </StatusPill>
          <BoolPill
            value={payload.manualDatabaseCheckRequired}
            label={copy.manualRequired}
            copy={copy}
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
            value={payload.allPersistenceAttemptsBlocked}
            label={copy.allBlocked}
            copy={copy}
          />
          <BoolPill
            value={payload.auditPersistenceAllowed}
            label={copy.auditAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.idempotencyReservationAllowed}
            label={copy.idempotencyAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.evidencePersistenceAllowed}
            label={copy.evidenceAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldPersistEvidence}
            label={copy.wouldPersistEvidence}
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
            value={payload.wouldWriteIdempotencyRows}
            label={copy.wouldWriteIdempotencyRows}
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
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/server-writers/schema-verification"
            className="rounded-md border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            {copy.openSchemaVerification}
          </Link>
          <Link
            href="/server-writers/evidence"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {copy.openEvidence}
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
                  {probeResult.operation
                    ? copy.operationLabels[probeResult.operation]
                    : copy.badge}
                </StatusPill>
                <BoolPill
                  value={probeResult.allPersistenceAttemptsBlocked}
                  label={copy.allBlocked}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldWriteRows}
                  label={copy.wouldWriteRows}
                  copy={copy}
                  readyWhenTrue={false}
                />
                <BoolPill
                  value={probeResult.wouldCreateServiceRoleClient}
                  label={copy.wouldCreateServiceRoleClient}
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
          {copy.sharedChecks}
        </h2>
        <div className="mt-4">
          <CheckList checks={payload.sharedChecks} copy={copy} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.operations}
        </h2>
        <div className="grid gap-4">
          {payload.operationGates.map((gate) => (
            <OperationCard
              key={gate.operation}
              gate={gate}
              copy={copy}
              onProbe={probe}
              isProbing={probingOperation === gate.operation}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
