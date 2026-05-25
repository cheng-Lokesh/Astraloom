import type { ReportEngineV1Output } from "@/types/report";

function riskClass(risk: string) {
  if (risk === "high") return "border-amber-300 bg-amber-50 text-amber-950";
  if (risk === "medium") return "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]";
  return "border-[#568262]/20 bg-[#eef5ee] text-[#2f5d3d]";
}

export function ReportSummary({
  report,
  paidMode,
}: {
  report: ReportEngineV1Output;
  paidMode: boolean;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            Report Engine v1
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#11150f]">
            当前沙盘显示
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#62695d]">
            Report 只读取 Claim；Claim 只来自 EventLog。付费层只展开证据和策略深度，不改变结论方向、confidence 或 riskLevel。
          </p>
        </div>
        <span
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${riskClass(
            report.freePreview.overallRisk,
          )}`}
        >
          {report.freePreview.overallRiskLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="claim_id" value={report.invariant.claimIds.length} />
        <Metric
          label="preview claims"
          value={report.freePreview.summaryClaimIds.length}
        />
        <Metric
          label="evidence shown"
          value={report.freePreview.limitedEvidenceCount}
        />
        <Metric
          label={paidMode ? "full events" : "locked depth"}
          value={report.paidReport.fullEventChain.length}
        />
      </div>

      {!paidMode ? (
        <p className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-7 text-[#62695d]">
          {report.freePreview.unlockCta}
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}
