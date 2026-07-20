import { approveActionProposalV2 } from "../agent-world/action-proposal";
import type { ActionProposalInputV2, WorldStateV2 } from "../agent-world/types";
import { applyWorldTransitionV2 } from "../agent-world/world-transition";
import { parseTrajectoryInstantV2 } from "../trajectory/time";
import { canonicalJsonV2 } from "./ids";
import { deepFreezeCloneV2 } from "./immutable";
import type { BatchRunSpecV2, TrajectoryAnalysisAdapterV2 } from "./types";

export function applyPreRunActionV2({
  proposal,
  world,
  variantId,
  variantIndex,
  spec,
  adapter,
}: {
  proposal: ActionProposalInputV2;
  world: WorldStateV2;
  variantId: string;
  variantIndex: number;
  spec: BatchRunSpecV2;
  adapter: TrajectoryAnalysisAdapterV2;
}) {
  let suppliedRuntime;
  try {
    suppliedRuntime = adapter.interventionRuntimeFactory(deepFreezeCloneV2({
      interventionId: proposal.id,
      variantIndex,
      spec,
    }));
  } catch {
    return { ok: false as const, phase: "input" as const, causeCode: "runtime_factory_failed", variantId };
  }
  let capturedTime: unknown;
  try { capturedTime = suppliedRuntime.clock(); } catch {
    return { ok: false as const, phase: "input" as const, causeCode: "runtime_clock_failed", variantId };
  }
  const runtimeInstant = parseTrajectoryInstantV2(capturedTime);
  const proposalInstant = parseTrajectoryInstantV2(proposal.createdAt);
  const worldInstant = parseTrajectoryInstantV2(world.updatedAt);
  if (!runtimeInstant.ok || !proposalInstant.ok || !worldInstant.ok || proposalInstant.value.epochMilliseconds !== runtimeInstant.value.epochMilliseconds || runtimeInstant.value.epochMilliseconds < worldInstant.value.epochMilliseconds) {
    return { ok: false as const, phase: "input" as const, causeCode: "invalid_intervention_time", variantId };
  }
  const fixedRuntime = {
    clock: () => runtimeInstant.value.isoTimestamp,
    idFactory: suppliedRuntime.idFactory,
  };
  const baselineWorld = structuredClone(world);
  const approval = approveActionProposalV2(structuredClone(proposal), baselineWorld, baselineWorld.revision, fixedRuntime);
  if (!approval.ok) return { ok: false as const, phase: "approval" as const, causeCode: approval.errorCode, variantId };
  const transition = applyWorldTransitionV2(baselineWorld, approval.command, fixedRuntime);
  if (!transition.ok) return { ok: false as const, phase: "transition" as const, causeCode: transition.errorCode, variantId };
  if (canonicalJsonV2(transition.world.realityBoundarySnapshot.evidenceLedger) !== canonicalJsonV2(world.realityBoundarySnapshot.evidenceLedger)) return { ok: false as const, phase: "transition" as const, causeCode: "real_evidence_ledger_changed", variantId };
  return { ok: true as const, transition };
}
