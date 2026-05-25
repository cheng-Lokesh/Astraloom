import type { ClaimDraft } from "@/types/claim";
import type { ReportEvidenceEvent } from "@/types/report";

export function EvidenceDrawer({
  claim,
  events,
}: {
  claim: ClaimDraft | null;
  events: ReportEvidenceEvent[];
}) {
  if (!claim) {
    return (
      <section className="rounded-lg border border-black/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">
          Evidence drawer
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#62695d]">
          Select a Claim to inspect EventLog evidence.
        </p>
      </section>
    );
  }

  const claimEvents = events.filter((event) => event.claimIds.includes(claim.id));

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            Evidence drawer
          </p>
          <h2 className="mt-2 text-base font-semibold text-[#11150f]">
            {claim.claimType}
          </h2>
        </div>
        <span className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
          {claimEvents.length} events
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        这条结论来自以下事件证据，不来自独立报告生成。
      </p>

      <div className="mt-4 space-y-3">
        {claimEvents.map((event) => (
          <details
            key={event.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
            open={claimEvents.length === 1}
          >
            <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
              Tick {event.tickIndex} / {event.eventType}
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-6 text-[#62695d]">
              <p>{event.action}</p>
              <Meta label="branch" value={event.branchId} />
              <Meta label="participants" value={event.participants.join(", ")} />
              <Meta label="relation edges" value={event.relationEdgeIds.join(", ")} />
              <Meta label="causes" value={event.causes.join(", ")} />
              <pre className="max-h-48 overflow-auto rounded bg-white p-3 text-xs">
                {JSON.stringify(event.edgeWeightDeltas, null, 2)}
              </pre>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <code className="mt-1 block break-all text-xs text-[#62695d]">
        {value || "none"}
      </code>
    </div>
  );
}
