import Link from "next/link";

import type { EntitlementDecision } from "@/lib/entitlements/entitlement-types";

export function PaidUnlockBoundary({
  decision,
}: {
  decision: EntitlementDecision;
}) {
  if (decision.canViewPaidReport) {
    return (
      <section className="rounded-lg border border-[#568262]/20 bg-[#eef5ee] p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">
          Paid report depth active
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#3f483d]">
          Full evidence chain and strategy depth are available for this report.
          claim_id, confidence, and riskLevel remain unchanged.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-black/8 bg-[#f7f8f4] p-5">
      <h2 className="text-sm font-semibold text-[#11150f]">
        Paid unlock boundary
      </h2>
      <p className="mt-3 text-sm leading-7 text-[#62695d]">
        {decision.blockedReason} Paid depth unlocks complete EventLog evidence
        and strategy options only. It does not create Claims, raise confidence,
        change riskLevel, or bypass safety restrictions.
      </p>
      <Link
        href="/app/billing"
        className="mt-4 inline-flex w-full justify-center rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white"
      >
        Open billing unlock
      </Link>
    </section>
  );
}
