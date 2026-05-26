import type { ClaimDraft, ClaimRiskLevel } from "@/types/claim";
import type { FreePreviewReport } from "@/types/report";
import type { SimulationEventDraft } from "@/types/simulation-run";

function riskRank(risk: ClaimRiskLevel) {
  if (risk === "high") return 3;
  if (risk === "medium") return 2;
  return 1;
}

function highestRisk(claims: ClaimDraft[]): ClaimRiskLevel {
  return claims.reduce<ClaimRiskLevel>((current, claim) => {
    return riskRank(claim.riskLevel) > riskRank(current) ? claim.riskLevel : current;
  }, "low");
}

function riskLabel(risk: ClaimRiskLevel) {
  if (risk === "high") return "Sandbox signal: pressure needs review";
  if (risk === "medium") return "Sandbox signal: keep observing";
  return "Sandbox signal: no strong pressure pattern";
}

function timelineHint(eventCount: number, claimCount: number) {
  if (claimCount >= 2 || eventCount >= 5) return "high";
  if (claimCount === 1 || eventCount >= 2) return "medium";
  return "low";
}

export function buildFreePreviewReport(
  claims: ClaimDraft[],
  events: SimulationEventDraft[],
): FreePreviewReport {
  const claimIds = claims.map((claim) => claim.id);
  const summaryClaims = claims
    .filter((claim) => claim.evidenceEventIds.length > 0)
    .sort((left, right) => {
      const riskDiff = riskRank(right.riskLevel) - riskRank(left.riskLevel);
      return riskDiff || right.confidence - left.confidence;
    })
    .slice(0, 2);
  const eventIds = new Set(summaryClaims.flatMap((claim) => claim.evidenceEventIds));
  const visibleEvents = events.filter((event) => eventIds.has(event.id));
  const buckets = new Map<string, { eventCount: number; claimCount: number }>();

  visibleEvents.forEach((event) => {
    const current = buckets.get(event.timeLabel) ?? {
      eventCount: 0,
      claimCount: 0,
    };
    buckets.set(event.timeLabel, {
      eventCount: current.eventCount + 1,
      claimCount:
        current.claimCount +
        summaryClaims.filter((claim) => claim.evidenceEventIds.includes(event.id))
          .length,
    });
  });

  const overallRisk = highestRisk(claims);

  return {
    claimIds,
    summaryClaimIds: summaryClaims.map((claim) => claim.id),
    overallRisk,
    overallRiskLabel: riskLabel(overallRisk),
    summaryClaims,
    vagueTimeline: Array.from(buckets.entries()).map(([label, value]) => ({
      label,
      eventCount: value.eventCount,
      riskHint: timelineHint(value.eventCount, value.claimCount),
    })),
    limitedEvidenceCount: visibleEvents.length,
    unlockCta:
      "Open full depth for the complete Event Log chain, branch comparison, relation deltas, and strategy options. Full depth uses the same claim_id set and does not make the claims more certain.",
  };
}
