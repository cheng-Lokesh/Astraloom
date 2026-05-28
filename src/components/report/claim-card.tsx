import { ConfidenceTag, EvidenceTag } from "@/components/ui-foundation";
import type { ClaimDraft } from "@/types/claim";

function riskClass(risk: ClaimDraft["riskLevel"]) {
  if (risk === "high") return "border-amber-300 bg-amber-50 text-amber-950";
  if (risk === "medium") return "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]";
  return "border-[#568262]/20 bg-[#eef5ee] text-[#2f5d3d]";
}

export function ClaimCard({
  claim,
  selected,
  onSelect,
}: {
  claim: ClaimDraft;
  selected: boolean;
  onSelect: (claimId: string) => void;
}) {
  const titles: Record<string, string> = {
    risk_window: "Risk window",
    opportunity_window: "Opportunity window",
    friction_signal: "Friction signal",
    coordination_signal: "Coordination signal",
  };
  const title = titles[claim.claimType] ?? claim.claimType;

  return (
    <button
      type="button"
      onClick={() => onSelect(claim.id)}
      className={`rounded-lg border p-5 text-left transition ${
        selected
          ? "border-[#568262]/50 bg-[#eef5ee]"
          : "border-black/8 bg-white hover:border-[#568262]/30"
      }`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <EvidenceTag>evidence events {claim.evidenceEventIds.length}</EvidenceTag>
        <ConfidenceTag value={claim.confidence} />
        <span
          className={`rounded-md border px-2 py-1 text-xs font-semibold ${riskClass(
            claim.riskLevel,
          )}`}
        >
          {claim.riskLevel} risk
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            {title}
          </p>
          <h3 className="mt-2 text-base font-semibold leading-7 text-[#11150f]">
            {claim.summary}
          </h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#62695d]">
        This finding comes from Event Log evidence. It is a reviewable sandbox
        signal, not a certain result.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="mf-tag">agents {claim.relatedAgentIds.length}</span>
        <span className="mf-tag">edges {claim.relatedRelationEdgeIds.length}</span>
        <span className="mf-tag">stored id {claim.id}</span>
      </div>
    </button>
  );
}
