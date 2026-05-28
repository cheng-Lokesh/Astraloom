import Link from "next/link";

import type { SafetyDecision } from "@/lib/safety/safety-types";

import { EvidenceTag } from "./ui-foundation";

type SafetyDowngradeNoticeProps = {
  decision: SafetyDecision;
  title?: string;
};

const flagLabels: Record<string, string> = {
  self_harm: "Immediate safety language",
  violence: "Violence or threat language",
  stalking: "Stalking or following",
  surveillance: "Surveillance or hidden recording",
  partner_monitoring: "Partner monitoring",
  medical: "Medical decision area",
  legal: "Legal decision area",
  investment: "Investment or debt decision area",
  therapy: "Clinical or therapy area",
  minor_safety: "Minor safety concern",
  revenge: "Revenge or exposure request",
  coercion: "Coercive action request",
  third_party_mind_reading: "Private-thought certainty request",
  deterministic_fate: "Certainty wording",
  guaranteed_reconciliation: "Guaranteed outcome wording",
};

const levelConfig = {
  caution: {
    label: "Caution",
    defaultTitle: "Safety wording is tightened",
    className: "border-[#6f8faa]/35 bg-[#eef4f8] text-[#2f5064]",
    badgeClassName: "border-[#6f8faa]/25 bg-white/70 text-[#2f5064]",
    summary:
      "The sandbox can continue, with careful wording and evidence-linked claims.",
    impact: [
      "The run avoids deterministic language.",
      "Claims stay tied to Event Logs and confidence levels.",
      "Private thoughts or certain outcomes are not treated as facts.",
    ],
    nextSteps: [
      "Continue the flow if the scenario is framed as relationship dynamics.",
      "Add observed events or boundaries if something feels too broad.",
    ],
  },
  downgraded: {
    label: "Adjusted",
    defaultTitle: "Safety mode adjusted this run",
    className: "border-[#c4824a]/35 bg-[#fdf5ed] text-[#7c5524]",
    badgeClassName: "border-[#c4824a]/25 bg-white/70 text-[#7c5524]",
    summary:
      "Astraloom can still show structure, evidence, and low-risk communication options, but it keeps stronger output unavailable.",
    impact: [
      "High-risk strong claims are hidden.",
      "Full-depth or paid-depth expansion cannot bypass this state.",
      "The page focuses on relationship structure and low-risk options.",
    ],
    nextSteps: [
      "Revise the situation setup if the request was broader than intended.",
      "Keep the scenario focused on observable events and relationship structure.",
      "Contact support if this safety adjustment seems too restrictive.",
    ],
  },
  blocked: {
    label: "Paused",
    defaultTitle: "This flow is paused for safety",
    className: "border-[#8c6bb1]/35 bg-[#f4effa] text-[#4b3568]",
    badgeClassName: "border-[#8c6bb1]/25 bg-white/75 text-[#4b3568]",
    summary:
      "This scenario includes content that Astraloom should not simulate into actions, claims, or report depth.",
    impact: [
      "Simulation ticks, strong claims, and report rendering stay unavailable.",
      "Full-depth or paid-depth access remains unavailable for this run.",
      "Existing local context can still be revised from the setup page.",
    ],
    nextSteps: [
      "Return to setup and remove action requests that cross safety boundaries.",
      "Reframe the scenario around observable relationship structure.",
      "Use support if you want a safety review of the downgrade.",
    ],
  },
};

function readableRestriction(restriction: string) {
  if (restriction.toLowerCase().includes("paid")) {
    return "Full-depth and paid-depth views remain unavailable in this state.";
  }
  if (restriction.toLowerCase().includes("strong claims")) {
    return "High-risk strong claims are not shown.";
  }
  if (restriction.toLowerCase().includes("simulation")) {
    return "Simulation ticks do not run while this state is active.";
  }
  if (restriction.toLowerCase().includes("professional")) {
    return "The sandbox will not provide medical, legal, investment, or therapy instructions.";
  }
  if (restriction.toLowerCase().includes("monitoring")) {
    return "Monitoring, coercive, revenge, or surveillance steps are not shown.";
  }
  return restriction
    .replace(/^Do not /, "")
    .replace(/^Show /, "")
    .replace(/\.$/, ".");
}

export function SafetyDowngradeNotice({
  decision,
  title,
}: SafetyDowngradeNoticeProps) {
  if (decision.safetyLevel === "safe") {
    return null;
  }

  const config = levelConfig[decision.safetyLevel];
  const restrictions = decision.reportRestrictions.map(readableRestriction);
  const showAppeal =
    decision.safetyLevel === "downgraded" ||
    decision.safetyLevel === "blocked";

  return (
    <section
      className={`rounded-lg border p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)] ${config.className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
            Safety {config.label}
          </p>
          <h2 className="mt-2 text-base font-semibold">
            {title ?? config.defaultTitle}
          </h2>
        </div>
        {decision.flags.length ? (
          <div className="flex max-w-full flex-wrap gap-2">
            {decision.flags.map((flag) => (
              <EvidenceTag
                key={flag}
                className={`border-current/20 ${config.badgeClassName}`}
              >
                {flagLabels[flag] ?? flag.replaceAll("_", " ")}
              </EvidenceTag>
            ))}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6">{config.summary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-current/12 bg-white/45 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
            What changed
          </h3>
          <ul className="mt-2 space-y-1 text-xs leading-5 opacity-85">
            {[...config.impact, ...restrictions].slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-current/12 bg-white/45 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
            Next steps
          </h3>
          <ul className="mt-2 space-y-1 text-xs leading-5 opacity-85">
            {config.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/app/new/intake"
          className="rounded-md border border-current/20 bg-white/55 px-3 py-2 text-xs font-semibold"
        >
          Revise setup
        </Link>
        {showAppeal ? (
          <Link
            href="/app/support"
            className="rounded-md border border-current/20 bg-white/55 px-3 py-2 text-xs font-semibold"
          >
            Request safety review
          </Link>
        ) : null}
        <Link
          href="/app/safety"
          className="rounded-md border border-current/20 bg-white/30 px-3 py-2 text-xs font-semibold"
        >
          View safety gate
        </Link>
      </div>
    </section>
  );
}
