"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import type {
  WriterPersistenceFixtureCase,
  WriterPersistenceFixtureCategory,
  WriterPersistenceFixtureHarnessPayload,
  WriterPersistenceFixtureHarnessProbeResult,
  WriterPersistenceFixtureStatus,
} from "@/types/writer-persistence-fixture-harness";

type WriterPersistenceFixturesClientPageProps = {
  payload: WriterPersistenceFixtureHarnessPayload;
};

const fixtureCopy = {
  en: {
    title: "Persistence adapter fixture harness",
    badge: "Fixture only",
    body: "This page defines static fixtures that prove the implementation-review evidence paths for transaction order, idempotency, audit redaction, rollback, rollout, isolation, observability, and no-go security. It does not implement the adapter.",
    notice:
      "All fixture probes are blocked by design. They return expected evidence only and cannot run transactions, create a service-role client, write rows, reserve keys, apply migrations, call AI, call Stripe, or unlock reports.",
    safetyState: "Safety state",
    fixtureMode: "Fixture mode",
    sourceReviewMode: "Source review mode",
    checkedAt: "Checked at",
    fixtures: "Fixtures",
    assertions: "Assertions",
    passedAssertions: "Passed assertions",
    blockedFixtures: "Blocked fixtures",
    manualFixtures: "Manual fixtures",
    sourceReviewItems: "Source review items",
    sourceReviewBlockers: "Source review blockers",
    sourceReviewManual: "Source manual items",
    safeMode: "Safe mode",
    readOnly: "Read-only",
    fixtureHarnessReady: "Fixture harness ready",
    fixtureEvidenceOnly: "Fixture evidence only",
    schemaVerified: "Schema verified",
    adapterImplemented: "Adapter implemented",
    implementationApproved: "Implementation approved",
    implementationAllowed: "Implementation allowed",
    reviewComplete: "Review complete",
    evidenceReady: "Blocking evidence ready",
    allRuntimeBlocked: "All runtime effects blocked",
    wouldRunTransaction: "Would run transaction",
    wouldImportRealWriter: "Would import real writer",
    wouldCreateServiceRoleClient: "Would create service-role client",
    wouldReadServiceRoleSecret: "Would read service-role secret",
    wouldPersistEvidence: "Would persist evidence",
    wouldStoreRawPayload: "Would store raw payload",
    wouldStoreSecrets: "Would store secrets",
    wouldWriteRows: "Would write rows",
    wouldWriteAuditRows: "Would write audit rows",
    wouldReserveIdempotencyKeys: "Would reserve idempotency keys",
    wouldWriteIdempotencyRows: "Would write idempotency rows",
    wouldWriteCompensationRows: "Would write compensation rows",
    wouldApplyMigration: "Would apply migration",
    wouldCreateTables: "Would create tables",
    wouldEnableWriters: "Would enable writers",
    wouldCallAi: "Would call AI",
    wouldCallStripe: "Would call Stripe",
    wouldUnlockReports: "Would unlock reports",
    yes: "Yes",
    no: "No",
    fixtureRules: "Fixture rules",
    blockedCodes: "Blocked codes",
    fixtureList: "Fixture cases",
    reviewItems: "Review items",
    methods: "Methods",
    phases: "Phases",
    failures: "Failure modes",
    inputRefs: "Input refs",
    expectedOutcomes: "Expected outcomes",
    forbiddenEffects: "Forbidden effects",
    fixtureAssertions: "Fixture assertions",
    expectedEvidence: "Expected evidence",
    probeFixture: "Probe fixture",
    probing: "Probing...",
    probeResult: "Probe result",
    noProbe:
      "Probe one fixture to confirm the harness stays evidence-only and blocked.",
    openReview: "Open adapter review",
    openAdapter: "Open adapter design",
    openDashboard: "Back to dashboard",
    statusLabels: {
      fixture_ready: "Fixture ready",
      blocked_by_review: "Blocked by review",
      manual_required: "Manual required",
    } satisfies Record<WriterPersistenceFixtureStatus, string>,
    categoryLabels: {
      transaction_order: "Transaction order",
      idempotency_replay: "Idempotency replay",
      idempotency_conflict: "Idempotency conflict",
      audit_redaction: "Audit redaction",
      rollback_compensation: "Rollback compensation",
      rollout_gate: "Rollout gate",
      service_role_isolation: "Service-role isolation",
      observability_support: "Observability support",
      security_no_go: "Security no-go",
    } satisfies Record<WriterPersistenceFixtureCategory, string>,
  },
  zh: {
    title: "持久化适配器 fixture 测试框架",
    badge: "仅 fixture",
    body: "这个页面定义静态 fixture，用来证明实现审查所需的证据路径：事务顺序、幂等、审计脱敏、回滚、发布、隔离、可观测和安全 no-go。它不实现适配器。",
    notice:
      "所有 fixture 探针都会按设计返回 blocked。它们只返回预期证据，不会运行事务、创建 service-role client、写入数据行、预留 key、应用 migration、调用 AI、调用 Stripe 或解锁报告。",
    safetyState: "安全状态",
    fixtureMode: "Fixture 模式",
    sourceReviewMode: "来源审查模式",
    checkedAt: "检查时间",
    fixtures: "Fixture",
    assertions: "断言",
    passedAssertions: "已通过断言",
    blockedFixtures: "阻断 fixture",
    manualFixtures: "需人工 fixture",
    sourceReviewItems: "来源审查项",
    sourceReviewBlockers: "来源阻断项",
    sourceReviewManual: "来源人工项",
    safeMode: "安全模式",
    readOnly: "只读",
    fixtureHarnessReady: "Fixture 框架已就绪",
    fixtureEvidenceOnly: "仅 fixture 证据",
    schemaVerified: "Schema 已验证",
    adapterImplemented: "适配器已实现",
    implementationApproved: "实现已批准",
    implementationAllowed: "允许实现",
    reviewComplete: "审查完成",
    evidenceReady: "阻断证据齐备",
    allRuntimeBlocked: "所有运行时影响已阻断",
    wouldRunTransaction: "是否运行事务",
    wouldImportRealWriter: "是否导入真实 writer",
    wouldCreateServiceRoleClient: "是否创建 service-role client",
    wouldReadServiceRoleSecret: "是否读取 service-role secret",
    wouldPersistEvidence: "是否持久化证据",
    wouldStoreRawPayload: "是否存储原始 payload",
    wouldStoreSecrets: "是否存储 secret",
    wouldWriteRows: "是否写入数据行",
    wouldWriteAuditRows: "是否写入审计行",
    wouldReserveIdempotencyKeys: "是否预留幂等 key",
    wouldWriteIdempotencyRows: "是否写入幂等行",
    wouldWriteCompensationRows: "是否写入补偿行",
    wouldApplyMigration: "是否应用 migration",
    wouldCreateTables: "是否创建表",
    wouldEnableWriters: "是否启用 writers",
    wouldCallAi: "是否调用 AI",
    wouldCallStripe: "是否调用 Stripe",
    wouldUnlockReports: "是否解锁报告",
    yes: "是",
    no: "否",
    fixtureRules: "Fixture 规则",
    blockedCodes: "阻断代码",
    fixtureList: "Fixture 用例",
    reviewItems: "审查项",
    methods: "方法",
    phases: "阶段",
    failures: "失败模式",
    inputRefs: "输入引用",
    expectedOutcomes: "预期结果",
    forbiddenEffects: "禁止影响",
    fixtureAssertions: "Fixture 断言",
    expectedEvidence: "预期证据",
    probeFixture: "探测 fixture",
    probing: "探测中...",
    probeResult: "探针结果",
    noProbe: "探测一个 fixture，确认框架仍然只提供证据且保持阻断。",
    openReview: "打开适配器审查",
    openAdapter: "打开适配器设计",
    openDashboard: "返回工作台",
    statusLabels: {
      fixture_ready: "Fixture 已就绪",
      blocked_by_review: "被审查阻断",
      manual_required: "需人工确认",
    } satisfies Record<WriterPersistenceFixtureStatus, string>,
    categoryLabels: {
      transaction_order: "事务顺序",
      idempotency_replay: "幂等重放",
      idempotency_conflict: "幂等冲突",
      audit_redaction: "审计脱敏",
      rollback_compensation: "回滚补偿",
      rollout_gate: "发布门闸",
      service_role_isolation: "Service-role 隔离",
      observability_support: "可观测与客服支持",
      security_no_go: "安全 no-go",
    } satisfies Record<WriterPersistenceFixtureCategory, string>,
  },
} as const;

type FixtureCopy = (typeof fixtureCopy)[keyof typeof fixtureCopy];

function BoolPill({
  value,
  label,
  copy,
  readyWhenTrue = true,
}: {
  value: boolean;
  label: string;
  copy: FixtureCopy;
  readyWhenTrue?: boolean;
}) {
  const ready = readyWhenTrue ? value : !value;

  return (
    <StatusPill tone={ready ? "ready" : "blocked"}>
      {label}: {value ? copy.yes : copy.no}
    </StatusPill>
  );
}

function TextList({ items }: { items: readonly string[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
        none
      </p>
    );
  }

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

function statusTone(status: WriterPersistenceFixtureStatus) {
  return status === "fixture_ready" ? "ready" : "blocked";
}

function FixtureCard({
  fixture,
  copy,
  onProbe,
  isProbing,
}: {
  fixture: WriterPersistenceFixtureCase;
  copy: FixtureCopy;
  onProbe: (fixtureId: string) => void;
  isProbing: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            {fixture.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {fixture.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="planned">
            {copy.categoryLabels[fixture.category]}
          </StatusPill>
          <StatusPill tone={statusTone(fixture.status)}>
            {copy.statusLabels[fixture.status]}
          </StatusPill>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {fixture.detail}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.reviewItems}
          </h4>
          <div className="mt-2">
            <TextList items={fixture.reviewItemIds} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.inputRefs}
          </h4>
          <div className="mt-2">
            <TextList items={fixture.fixtureInputRefs} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.expectedOutcomes}
          </h4>
          <div className="mt-2">
            <TextList items={fixture.expectedOutcomeRefs} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.methods}
          </h4>
          <div className="mt-2">
            <TextList items={fixture.relatedMethods} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.phases}
          </h4>
          <div className="mt-2">
            <TextList items={fixture.relatedPhases} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {copy.forbiddenEffects}
          </h4>
          <div className="mt-2">
            <TextList items={fixture.forbiddenRuntimeEffects} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-950">
          {copy.fixtureAssertions}
        </h4>
        <div className="mt-2 grid gap-3">
          {fixture.assertions.map((assertion) => (
            <div
              key={assertion.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h5 className="text-sm font-semibold text-slate-950">
                    {assertion.title}
                  </h5>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {assertion.id}
                  </p>
                </div>
                <StatusPill tone={assertion.passed ? "ready" : "blocked"}>
                  {assertion.passed ? "passed" : "blocked"}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {assertion.detail}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                <span className="font-semibold">
                  {copy.expectedEvidence}:{" "}
                </span>
                {assertion.expectedEvidence}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onProbe(fixture.id)}
        disabled={isProbing}
        className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isProbing ? copy.probing : copy.probeFixture}
      </button>
    </article>
  );
}

export function WriterPersistenceFixturesClientPage({
  payload,
}: WriterPersistenceFixturesClientPageProps) {
  const { locale } = useLanguage();
  const copy = fixtureCopy[locale];
  const [probeResult, setProbeResult] =
    useState<WriterPersistenceFixtureHarnessProbeResult | null>(null);
  const [probingFixture, setProbingFixture] = useState<string | null>(null);

  async function probe(fixtureId: string) {
    setProbingFixture(fixtureId);
    setProbeResult(null);

    try {
      const response = await fetch("/api/system-writers/persistence-fixtures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fixtureId }),
      });
      const result =
        (await response.json()) as WriterPersistenceFixtureHarnessProbeResult;
      setProbeResult(result);
    } finally {
      setProbingFixture(null);
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
          <BoolPill
            value={payload.fixtureHarnessReady}
            label={copy.fixtureHarnessReady}
            copy={copy}
          />
          <BoolPill
            value={payload.fixtureEvidenceOnly}
            label={copy.fixtureEvidenceOnly}
            copy={copy}
          />
          <StatusPill tone="planned">
            {copy.fixtureMode}: {payload.fixtureMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceReviewMode}: {payload.sourceReviewMode}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.checkedAt}: {payload.checkedAt}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.fixtures}: {payload.fixtureCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.assertions}: {payload.assertionCount}
          </StatusPill>
          <StatusPill tone="ready">
            {copy.passedAssertions}: {payload.passedAssertionCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.blockedFixtures}: {payload.blockedFixtureCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.manualFixtures}: {payload.manualRequiredFixtureCount}
          </StatusPill>
          <StatusPill tone="planned">
            {copy.sourceReviewItems}: {payload.sourceReviewItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceReviewBlockers}: {payload.sourceReviewBlockingItemCount}
          </StatusPill>
          <StatusPill tone="blocked">
            {copy.sourceReviewManual}: {payload.sourceReviewManualRequiredCount}
          </StatusPill>
          <BoolPill
            value={payload.schemaVerified}
            label={copy.schemaVerified}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.adapterImplemented}
            label={copy.adapterImplemented}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.adapterImplementationApproved}
            label={copy.implementationApproved}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.adapterImplementationAllowed}
            label={copy.implementationAllowed}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.implementationReviewComplete}
            label={copy.reviewComplete}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.allBlockingEvidenceReady}
            label={copy.evidenceReady}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.allRuntimeEffectsBlocked}
            label={copy.allRuntimeBlocked}
            copy={copy}
          />
          <BoolPill
            value={payload.wouldRunTransaction}
            label={copy.wouldRunTransaction}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldImportRealWriterImplementation}
            label={copy.wouldImportRealWriter}
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
            value={payload.wouldPersistEvidence}
            label={copy.wouldPersistEvidence}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldStoreRawPayload}
            label={copy.wouldStoreRawPayload}
            copy={copy}
            readyWhenTrue={false}
          />
          <BoolPill
            value={payload.wouldStoreSecrets}
            label={copy.wouldStoreSecrets}
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
            value={payload.wouldWriteCompensationRows}
            label={copy.wouldWriteCompensationRows}
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
            value={payload.wouldEnableWriters}
            label={copy.wouldEnableWriters}
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
            href="/server-writers/persistence-review"
            className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
          >
            {copy.openReview}
          </Link>
          <Link
            href="/server-writers/persistence-adapter"
            className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
          >
            {copy.openAdapter}
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
            {copy.fixtureRules}
          </h2>
          <div className="mt-4">
            <TextList items={payload.fixtureRules} />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-950">
            {copy.blockedCodes}
          </h3>
          <div className="mt-2">
            <TextList items={payload.blockedCodes} />
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
                {probeResult.fixtureStatus ? (
                  <StatusPill tone={statusTone(probeResult.fixtureStatus)}>
                    {copy.statusLabels[probeResult.fixtureStatus]}
                  </StatusPill>
                ) : null}
                <BoolPill
                  value={probeResult.allRuntimeEffectsBlocked}
                  label={copy.allRuntimeBlocked}
                  copy={copy}
                />
                <BoolPill
                  value={probeResult.wouldRunTransaction}
                  label={copy.wouldRunTransaction}
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
              {probeResult.fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <h3 className="text-sm font-semibold text-slate-950">
                    {fixture.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {fixture.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.noProbe}
            </p>
          )}
        </aside>
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-950">
          {copy.fixtureList}
        </h2>
        <div className="grid gap-4">
          {payload.fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              copy={copy}
              onProbe={probe}
              isProbing={probingFixture === fixture.id}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
