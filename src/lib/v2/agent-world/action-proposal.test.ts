import { describe, expect, it } from "vitest";

import { approveActionProposalV2, buildActionProposalV2 } from "./action-proposal";
import { initializeWorldV2 } from "./world-initializer";
import {
  actionProposalInputV2,
  createFixedAgentWorldRuntimeV2,
  idsV2,
  realityBoundaryV2,
  worldInitializationSpecV2,
} from "./test-fixtures";

function world() {
  const result = initializeWorldV2(realityBoundaryV2(), worldInitializationSpecV2(), createFixedAgentWorldRuntimeV2());
  if (!result.ok) throw new Error(result.errorCode);
  return result.world;
}

describe("Action Proposal and approval V2", () => {
  it("builds a candidate without modifying World", () => {
    const current = world();
    const before = structuredClone(current);
    const result = buildActionProposalV2(actionProposalInputV2(current), current);
    expect(result.ok).toBe(true);
    expect(current).toEqual(before);
  });

  it.each(["worldPatch", "rawPatch", "setState"])("strictly rejects forbidden field %s", (field) => {
    const current = world();
    const input = { ...actionProposalInputV2(current), [field]: {} };
    expect(buildActionProposalV2(input, current)).toMatchObject({ ok: false, errorCode: "invalid_action_proposal" });
  });

  it("rejects unknown actors and targets", () => {
    const current = world();
    expect(buildActionProposalV2(actionProposalInputV2(current, { actorAgentId: "agent_definition_v2_missing" }), current)).toMatchObject({ ok: false, errorCode: "unknown_actor" });
    expect(buildActionProposalV2(actionProposalInputV2(current, { targetResourceIds: ["world_resource_v2_missing"], parameters: { actionType: "allocate_resource", resourceId: "world_resource_v2_missing", amount: 1 } }), current)).toMatchObject({ ok: false, errorCode: "unknown_target" });
  });

  it("rejects unconfirmed high-impact third-party assumptions", () => {
    const current = world();
    const assumption = current.realityBoundarySnapshot.assumptionLedger.assumptions[0]!;
    assumption.epistemicStatus = "inferred";
    assumption.confirmationStatus = "pending";
    expect(buildActionProposalV2(actionProposalInputV2(current, { assumptionIds: [assumption.id] }), current)).toMatchObject({ ok: false, errorCode: "third_party_confirmation_required" });
  });

  it("approves a valid Proposal into an immutable deep-copied Command", () => {
    const current = world();
    const built = buildActionProposalV2(actionProposalInputV2(current), current);
    if (!built.ok) throw new Error(built.errorCode);
    const approved = approveActionProposalV2(built.proposal, current, 0, createFixedAgentWorldRuntimeV2());
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.command.expectedWorldRevision).toBe(0);
    expect(approved.command.validationRuleIds.length).toBeGreaterThan(0);
    if (built.proposal.parameters.actionType !== "allocate_resource") {
      throw new Error("unexpected_action_type");
    }
    built.proposal.parameters.amount = 9;
    expect(approved.command.operation).toMatchObject({ amount: 1 });
  });

  it("requires a non-negative expectedWorldRevision", () => {
    const current = world();
    const built = buildActionProposalV2(actionProposalInputV2(current), current);
    if (!built.ok) throw new Error(built.errorCode);
    expect(approveActionProposalV2(built.proposal, current, undefined as never, createFixedAgentWorldRuntimeV2())).toMatchObject({ ok: false, errorCode: "invalid_expected_revision" });
  });

  it("rejects numeric parameters outside World ranges", () => {
    const current = world();
    expect(buildActionProposalV2(actionProposalInputV2(current, { parameters: { actionType: "allocate_resource", resourceId: idsV2.time, amount: 99 } }), current)).toMatchObject({ ok: false, errorCode: "value_out_of_range" });
  });
});
