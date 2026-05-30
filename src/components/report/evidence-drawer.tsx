import { EvidenceTag } from "@/components/ui-foundation";
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
      <section className="mf-card p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">
          Evidence drawer
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#62695d]">
          Select a Finding to inspect sandbox event evidence.
        </p>
      </section>
    );
  }

  const claimEvents = events.filter((event) => event.claimIds.includes(claim.id));

  return (
    <section className="mf-card p-5">
      <div className="mf-section-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            Evidence basis
          </p>
          <h2 className="mt-2 text-base font-semibold text-[#11150f]">
            {claim.claimType}
          </h2>
        </div>
        <EvidenceTag>{claimEvents.length} events</EvidenceTag>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        This finding is shown only because sandbox events contain matching
        evidence. Result copy does not create independent conclusions.
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
              <Meta label="situation map edges" value={event.relationEdgeIds.join(", ")} />
              <Meta label="causes" value={event.causes.join(", ")} />
              <Meta label="evidence basis" value={event.evidenceRefs.join(", ")} />
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
      <code
        className="mt-1 block break-all text-xs text-[#62695d]"
        data-no-localize
      >
        {value || "none"}
      </code>
    </div>
  );
}
