import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NoEligibleActions } from "@/components/formal-sandbox/no-eligible-actions";
import { buildFormalSandboxRunV2 } from "@/lib/formal-sandbox/runtime";
import { projectFormalSandboxResult } from "@/lib/formal-sandbox/result-projection.server";
import { buildDigitalLifeModel, digitalLifeGuardSchema, type DigitalLifeRules } from "./model";
import { projectGuardObservations } from "./guard-observations";
import { digitalLifeInput, ids } from "./test-fixtures";

function fixture(value = "家庭支持待定") {
  const input = digitalLifeInput();
  input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
  input.realityProfileSnapshot.profile.externalVariables = [{ value, classification: "fact", evidenceSummary: "本人记录的当前安排" }];
  return input;
}

function action(key: string, pathKey: string, guard?: DigitalLifeRules["actions"][number]["guard"]): DigitalLifeRules["actions"][number] {
  return { key, pathKey, actorKey: pathKey === "main" ? "person-1" : pathKey, when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留共同安排", status: "planned" }, guard, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人明确确认的模拟行动条件" };
}

function rules(actions: DigitalLifeRules["actions"]): DigitalLifeRules {
  return { version: "digital-life-rules-v3", graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2, actions, strategies: [] };
}

describe("independent guard review reproductions", () => {
  it.each(["家庭支持待定", "稳".repeat(240)])("projects a legal environment guard without rejecting safe value %s", async value => {
    const input = fixture(value);
    const guard = { kind: "environment_equals" as const, variableKey: "external-variable-1", value };
    expect(digitalLifeGuardSchema.safeParse(guard).success).toBe(true);
    const declared = rules([action("rule-1", "main", guard)]);
    expect(buildDigitalLifeModel(input, declared).ok).toBe(true);
    const result = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(result.ok, !result.ok ? result.errorCode : undefined).toBe(true);
    if (!result.ok) throw new Error(result.errorCode);
    expect.soft(projectGuardObservations(result.bundle)).not.toBeNull();
    expect(projectFormalSandboxResult(result.bundle)).not.toBeNull();
  });

  it("does not deny the real selected transient event when another path prevents saving", async () => {
    const input = fixture();
    const declared = rules([
      action("rule-1", "main", { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 }),
      action("rule-2", "person-3", { kind: "resource_balance", resourceKey: "resource-1", operator: "gte", value: 8 }),
    ]);
    declared.strategies = [{ participantKey: "person-3", label: "保留独立安排", confirmedForSimulation: true, evidenceSummary: "本人选择的独立策略" }];
    const result = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: declared });
    expect(result.ok).toBe(false);
    if (result.ok || !result.pathDiagnostics) throw new Error("Expected not-saved diagnostics");
    expect(result.errorCode).toBe("no_eligible_actions");
    expect(result.pathDiagnostics.paths[1]).toMatchObject({ status: "has_events", samples: [{ selectedEventCount: 1 }, { selectedEventCount: 1 }, { selectedEventCount: 1 }] });
    expect(result.pathDiagnostics.paths[1].guardObservations.samples[0].ticks[0].observations[0]).toMatchObject({ candidate: "selected", stepKey: "step-1" });
    const markup = renderToStaticMarkup(createElement(NoEligibleActions, { diagnostics: { ...result.pathDiagnostics, paths: [result.pathDiagnostics.paths[1]] } }));
    expect(markup).toContain("候选已选中");
    expect(markup).not.toMatch(/候选已选中<\/p><p>[^<]*<\/p><p>没有对应的实际选中事件/);
    expect(markup).not.toContain("实际事件依据：模拟步骤");
  });
});
