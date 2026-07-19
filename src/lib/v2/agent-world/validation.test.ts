import { describe, expect, it } from "vitest";

import { validateWorldV2 } from "./validation";
import { initializeWorldV2 } from "./world-initializer";
import {
  createFixedAgentWorldRuntimeV2,
  realityBoundaryV2,
  worldInitializationSpecV2,
} from "./test-fixtures";

function world() {
  const result = initializeWorldV2(
    realityBoundaryV2(),
    worldInitializationSpecV2(),
    createFixedAgentWorldRuntimeV2(),
  );
  if (!result.ok) throw new Error(result.errorCode);
  return result.world;
}

describe("World Validator V2", () => {
  it("returns stable issues for invalid namespaces and duplicate ids", () => {
    const invalid = world();
    invalid.entities[0]!.id = "world_relation_v2_wrong" as never;
    invalid.entities.push(structuredClone(invalid.entities[0]!));
    const result = validateWorldV2(invalid);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((item) => item.code)).toEqual(
      expect.arrayContaining(["invalid_id_namespace", "duplicate_id"]),
    );
  });

  it("rejects broken relation, resource, and constraint references", () => {
    const invalid = world();
    invalid.relations[0]!.toEntityId = "world_entity_v2_missing";
    invalid.resources[0]!.controllerAgentId = "agent_definition_v2_missing";
    invalid.constraints[0]!.target = {
      type: "variable",
      id: "world_variable_v2_missing",
    };
    const result = validateWorldV2(invalid);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.filter((item) => item.code === "missing_reference").length).toBeGreaterThanOrEqual(3);
  });

  it("enforces one-to-one Agent Definition and State ownership", () => {
    const invalid = world();
    invalid.agentStates.pop();
    expect(validateWorldV2(invalid)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "missing_reference", path: "agentStates" }),
      ]),
    });
  });

  it("rejects out-of-range resource and variable values", () => {
    const invalid = world();
    invalid.resources[0]!.available = 999;
    const numeric = invalid.externalVariables.find((item) => item.variableType === "number")!;
    numeric.value = -1;
    const result = validateWorldV2(invalid);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((item) => item.code)).toContain("invalid_variable_range");
  });

  it("rejects unknown top-level fields and forbidden modeling fields", () => {
    const invalid = world() as typeof world extends () => infer T ? T & Record<string, unknown> : never;
    invalid.extra = true;
    invalid.probability = 0.9;
    const result = validateWorldV2(invalid);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((item) => item.code)).toContain("forbidden_field");
  });

  it("rejects memory that references an Event which never occurred", () => {
    const invalid = world();
    invalid.agentStates[0]!.memory.push({
      id: "memory_fake",
      source: { sourceType: "world_event", worldEventId: "world_event_v2_missing" },
      content: "Fabricated history",
      recordedAt: invalid.updatedAt,
    });
    expect(validateWorldV2(invalid)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "missing_reference" }),
      ]),
    });
  });
});
