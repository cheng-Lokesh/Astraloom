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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            {claim.claimType}
          </p>
          <h3 className="mt-2 text-base font-semibold leading-7 text-[#11150f]">
            {claim.summary}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${riskClass(
            claim.riskLevel,
          )}`}
        >
          {claim.riskLevel}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#62695d]">
        这条结论来自以下事件证据。若现有互动惯性不变，它只表示一个可复盘的沙盘信号。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag>confidence {claim.confidence}%</Tag>
        <Tag>events {claim.evidenceEventIds.length}</Tag>
        <Tag>claim_id {claim.id}</Tag>
      </div>
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
      {children}
    </span>
  );
}
