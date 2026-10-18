import { beforeAll, describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "../runtime";
import { buildObservedOutcome, outcomeTargets } from "./core-adapter";
import type { FormalOutcomeInput } from "./contracts";

const storedAt = "2026-10-06T03:59:59.999Z";
const afterWindow = "2026-11-10T04:00:00.000Z";
export function mixedRealityRules() {
  const rules = digitalLifeRules();
  return { ...rules, strategies: [], actions: [rules.actions[0], rules.actions[1], { ...rules.actions[0], key: "rule-3", when: { kind: "after_rule" as const, ruleKey: "rule-2" }, operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 2 } }] };
}
type RuntimeSuccess = Extract<Awaited<ReturnType<typeof buildFormalSandboxRunV2>>, { ok: true }>;
let mixed: RuntimeSuccess;
let resource: RuntimeSuccess;
beforeAll(async () => {
  const a = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: mixedRealityRules() });
  const b = await buildFormalSandboxRunV2(digitalLifeInput());
  expect(a.ok).toBe(true); expect(b.ok).toBe(true);
  if (!a.ok || !b.ok) throw new Error("runtime fixture failed");
  mixed = a; resource = b;
}, 120_000);
function observationsFor(target: ReturnType<typeof outcomeTargets>[number]): FormalOutcomeInput {
  return { target_key: target.key, observed: "uncertain", evidence_summary: "本人逐项核对实际询问和可见回应", uncertainty: "medium", confirmed_user_observation: true, idempotency_key: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", observations: target.conditions.map(c => ({ key: c.key, value: c.expectedValue, ...(c.requiresTime ? { occurred_at: `2026-10-${String(15 + c.sequence).padStart(2, "0")}T04:00:00.000Z` } : {}) })) };
}
describe("independent reality criteria v2", () => {
  it("freezes an actual same-sample request, visible response and resource chain with safe review groups", () => {
    expect(mixed.bundle.frozenRealityCriteria.version).toBe("formal-reality-criteria-v2");
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    expect(target).toMatchObject({ status: "not_observable", criteriaStatus: "available", criteriaVersion: "formal-reality-criteria-v2", review: { kind: "relationship_resource_chain" } });
    expect(target.conditions.map(c => c.measurement)).toEqual(expect.arrayContaining(["relationship_scope", "response_source", "resource_before", "resource_after", "actor_scope", "resource_scope"]));
    expect(target.conditions.length).toBeLessThanOrEqual(32);
    const review = (target as unknown as {review:{stepKeys:string[];groups:{conditionKeys:string[]}[]}}).review;
    expect(review.stepKeys).toHaveLength(3);
    expect(review.groups.flatMap(group => group.conditionKeys)).toEqual(target.conditions.map(c => c.key));
    for (const step of review.stepKeys) expect(mixed.bundle.events[Number(step.slice(5)) - 1]).toBeDefined();
  });
  it("compares a complete chain without producing Core scoring or calibration artifacts", async () => {
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    const result = await buildObservedOutcome(mixed.bundle, storedAt, observationsFor(target), afterWindow);
    expect(result.criteriaComparison).toEqual({ status: "matched", differences: [] });
    expect(result.artifacts).toEqual([]); expect(result.calibration).toBeUndefined();
  });
  it("records false asking without an invented time and keeps partial differences while the window is open", async () => {
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    const request = target.conditions.find(c => c.kind === "request_information" && c.measurement === "operation")!;
    const input = observationsFor(target);
    input.observations = input.observations.map(o => o.key === request.key ? { key:o.key,value:false } : { key:o.key,value:null });
    const result = await buildObservedOutcome(mixed.bundle, storedAt, input, "2026-10-25T04:00:00.000Z");
    expect(result.criteriaComparison).toEqual({ status: "unknown", differences: [request.key] });
  });
  it("requires asking, object/relationship scope and visible-source confirmations before a response correction", async () => {
    const target = outcomeTargets(mixed.bundle, afterWindow, true)[0];
    const response = target.conditions.find(c => c.kind === "update_relation_signal" && c.measurement === "operation")!;
    const request = target.conditions.find(c => c.kind === "request_information" && c.measurement === "operation")!;
    const input = observationsFor(target); input.correction = { rule_key: "rule-2", confirmed_for_next_run:true };
    input.observations = input.observations.map(o => o.key === response.key ? { ...o,value:"negative" } : o);
    expect((await buildObservedOutcome(mixed.bundle, storedAt, input, afterWindow)).correction?.nextValue).toBe("negative");
    const rejected = input.observations.map(o => o.key === request.key ? { key:o.key,value:false } : o);
    await expect(buildObservedOutcome(mixed.bundle, storedAt, { ...input, observations:rejected }, afterWindow)).rejects.toThrow("invalid_correction");
    for (const scope of target.conditions.filter(c => ["relationship_scope", "response_source"].includes(c.measurement))) {
      await expect(buildObservedOutcome(mixed.bundle, storedAt, { ...input, observations:input.observations.map(o => o.key === scope.key ? {...o,value:false} : o) }, afterWindow)).rejects.toThrow("invalid_correction");
    }
  });
  it("keeps pure resource comparison available in new v2 runs", async () => {
    expect(resource.bundle.frozenRealityCriteria.version).toBe("formal-reality-criteria-v2");
    const target = outcomeTargets(resource.bundle, afterWindow, true)[0];
    expect(target).toMatchObject({ criteriaStatus:"available", review:{kind:"resource"} });
    expect((await buildObservedOutcome(resource.bundle, storedAt, observationsFor(target), afterWindow)).criteriaComparison.status).toBe("matched");
  });
});
