import type { ClaimDraft } from "@/types/claim";
import type { ReportStrategyOption, StrategyType } from "@/types/report";
import type { SimulationEventDraft } from "@/types/simulation-run";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function strategyTypeForClaim(
  claim: ClaimDraft,
  events: SimulationEventDraft[],
): StrategyType {
  const hasGap = events.some((event) =>
    Object.values(event.edgeWeightDeltas).some(
      (delta) => (delta.informationGap ?? 0) > 0,
    ),
  );
  const hasSupport = events.some((event) =>
    ["support", "cooperation", "disclosure"].includes(event.eventType),
  );
  const hasResourcePressure = events.some((event) =>
    Object.values(event.edgeWeightDeltas).some(
      (delta) => (delta.resourceControl ?? 0) > 0,
    ),
  );

  if (claim.riskLevel === "high") return "boundary";
  if (hasGap) return "information_fill";
  if (hasResourcePressure) return "resource_exchange";
  if (claim.claimType === "opportunity_window") return "proceed";
  if (hasSupport) return "communicate";
  if (claim.claimType === "friction_signal") return "observe";
  return "delay";
}

function titleForType(type: StrategyType) {
  const titles: Record<StrategyType, string> = {
    observe: "Observe repeat signals",
    communicate: "Low-pressure clarification",
    delay: "Delay irreversible action",
    proceed: "Small reversible step",
    boundary: "Boundary preparation",
    information_fill: "Fill information gaps",
    resource_exchange: "Clarify resource exchange",
    exit_prepare: "Prepare a low-risk exit path",
  };
  return titles[type];
}

function bodyForType(type: StrategyType, claim: ClaimDraft) {
  if (type === "boundary") {
    return `This option is linked to ${claim.id}. Use the evidence chain to define what should pause, what is acceptable, and what needs more confirmation if pressure increases in the sandbox.`;
  }
  if (type === "information_fill") {
    return `This option is linked to ${claim.id}. Ask for the missing fact, timing, or decision owner before treating the signal as directionally useful.`;
  }
  if (type === "communicate") {
    return `This option is linked to ${claim.id}. Use a low-pressure check-in to confirm observable facts without turning the sandbox signal into a conclusion.`;
  }
  if (type === "proceed") {
    return `This option is linked to ${claim.id}. Test a small reversible step and keep an observation point tied to the same Event Log evidence.`;
  }
  if (type === "delay") {
    return `This option is linked to ${claim.id}. Hold irreversible action while watching whether the same event pattern repeats across later ticks.`;
  }
  if (type === "resource_exchange") {
    return `This option is linked to ${claim.id}. Clarify time, access, approval, or support expectations before committing more resources.`;
  }
  if (type === "exit_prepare") {
    return `This option is linked to ${claim.id}. Prepare a low-risk alternative path as a contingency, not as a certain result.`;
  }
  return `This option is linked to ${claim.id}. Keep observing repeated signals and Event Log evidence before acting on the claim.`;
}

function secondaryType(primaryType: StrategyType): StrategyType {
  if (primaryType === "information_fill") return "observe";
  if (primaryType === "boundary") return "exit_prepare";
  if (primaryType === "resource_exchange") return "information_fill";
  return "information_fill";
}

export function buildStrategyOptions(
  claims: ClaimDraft[],
  events: SimulationEventDraft[],
): ReportStrategyOption[] {
  return claims.flatMap((claim) => {
    const claimEvents = events.filter((event) =>
      claim.evidenceEventIds.includes(event.id),
    );
    if (claimEvents.length === 0) return [];
    const primaryType = strategyTypeForClaim(claim, claimEvents);

    return [primaryType, secondaryType(primaryType)].map((strategyType) => ({
      id: `strategy_${hashText(`${claim.id}:${strategyType}`)}`,
      claimId: claim.id,
      strategyType,
      title: titleForType(strategyType),
      body: bodyForType(strategyType, claim),
      expectedUse:
        "Use this as a scenario option tied to the claim evidence, not as a command.",
    }));
  });
}
