"use client";

import type { EntitlementDecision } from "@/lib/entitlements/entitlement-types";
import type { ReportEngineV1Output } from "@/types/report";

export function UnlockReportCard({
  report,
  decision,
  onUnlock,
  onReset,
}: {
  report: ReportEngineV1Output | null;
  decision: EntitlementDecision | null;
  onUnlock: () => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-lg bg-[#11150f] p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b7e6c6]">
        Mock paid unlock
      </p>
      <h2 className="mt-3 text-2xl font-semibold">
        Unlock full evidence depth for this report
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/66">
        付费解锁完整事件链和策略深度；不代表确定预测，不提升“命运准确率”，也不绕过安全限制。
      </p>

      <div className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
          current state
        </div>
        <div className="mt-2 text-sm leading-6 text-white/70">
          <p>free preview: {decision?.canViewFreePreview ? "active" : "blocked"}</p>
          <p>paid report: {decision?.canViewPaidReport ? "active" : "locked"}</p>
          <p>claim_id count: {decision?.invariant.claimIds.length ?? 0}</p>
        </div>
      </div>

      {decision?.blockedReason ? (
        <p className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-3 text-sm leading-6 text-white/66">
          {decision.blockedReason}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onUnlock}
          disabled={!report || decision?.safetyLevel === "blocked" || decision?.safetyLevel === "downgraded"}
          className="rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mock unlock paid report
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
        >
          Reset local entitlement
        </button>
      </div>
    </section>
  );
}
