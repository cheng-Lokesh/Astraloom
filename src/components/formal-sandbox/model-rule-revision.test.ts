import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirected to blank scene"); }, useRouter: () => ({ push: vi.fn() }) }));
import StartPage from "@/app/app/start/page";
import { parseRevisionQuery, compatibleRevision } from "./model-rule-revision-query";
import { confirmedRevision, ModelRuleRevision } from "./model-rule-revision";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";
import { safeDigitalLifeCorrectionContextSchema } from "@/lib/formal-sandbox/correction-context";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import { digitalLifeInput, digitalLifeRules, ids } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "@/lib/formal-sandbox/runtime";

export function revisionFixture() {
  const input = digitalLifeInput();
  const frozenRules = digitalLifeRulesSchema.parse(digitalLifeRules());
  return safeDigitalLifeCorrectionContextSchema.parse({ version: "digital-life-correction-context-v1", horizonDays: 30,
    modelContext: { graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
      agents: input.agents.map((agent, index) => ({ key: `person-${index + 1}`, label: agent.displayName, role: agent.sourceRole })),
      relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }],
      resources: input.realityProfileSnapshot.profile.worldInputs.resources.map((resource, index) => ({ key: `resource-${index + 1}`, label: resource.label, available: resource.available, minimum: resource.minimum, maximum: resource.maximum, unit: resource.unit, usePerTick: resource.usePerTick, classification: resource.classification, evidenceSummary: resource.evidenceSummary })) },
    frozenRules, draftRules: { ...frozenRules, actions: frozenRules.actions.map(action => ({ ...action, confirmedForSimulation: false })), strategies: frozenRules.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: false })) },
    permissionsReset: { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true } });
}

describe("model correction entry", () => {
  it("opens existing-run assumptions rather than redirecting to a blank scene", async () => {
    const page = await Reflect.apply(StartPage, undefined, [{ searchParams: Promise.resolve({ revise_run: "10000000-0000-4000-8000-000000000001" }) }]);
    expect(page).toBeTruthy();
  });
  it("keeps the ordinary Start route and rejects duplicate, malformed or extra selectors", async () => {
    await expect(StartPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirected to blank scene");
    for (const query of [{ revise_run: [ids.seed, ids.seed] }, { revise_run: "bad" }, { revise_run: ids.seed, graph_id: ids.graph }, {}]) expect(parseRevisionQuery(query)).toBeNull();
    expect(parseRevisionQuery({ revise_run: ids.seed })).toBe(ids.seed);
  });
  it("checks every ordinal label/resource value and revision against the exact current model", () => {
    const source = revisionFixture();
    expect(compatibleRevision(source, source.modelContext)).toBe(true);
    for (const mutate of [ (current: typeof source.modelContext) => current.profileRevision++, (current: typeof source.modelContext) => current.agents.reverse(), (current: typeof source.modelContext) => current.resources[0].available++, (current: typeof source.modelContext) => { current.relationships[0].label = "其他关系"; } ]) {
      const current = structuredClone(source.modelContext); mutate(current); expect(compatibleRevision(source, current)).toBe(false);
    }
  });
  it("loads full original actions/strategy with unchecked permissions and no rendered IDs", () => {
    const source = revisionFixture();
    expect(confirmedRevision(source.draftRules)).toBeNull();
    const html = renderToStaticMarkup(createElement(ModelRuleRevision, { source, disabled: false, onChange: vi.fn() }));
    expect(html).toContain("确认双方可投入的时间"); expect(html).toContain("先保留自主学习时间"); expect(html).toContain("协作对象"); expect(html).not.toContain(" checked");
    expect(html).not.toContain(ids.graph); expect(html).not.toContain(ids.snapshot); expect(html).not.toContain("rule-1");
    const partial = { ...source.draftRules, actions: source.draftRules.actions.map(action => ({ ...action, confirmedForSimulation: true })) };
    expect(confirmedRevision(partial)).toBeNull();
    expect(confirmedRevision({ ...partial, strategies: partial.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: true })) })).not.toBeNull();
  });
  it("reads the strict server DTO with no-store and sends only newly confirmed typed rules with a fresh key", async () => {
    const source = revisionFixture(); const frozen = JSON.stringify(source);
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, context: source }))).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, idempotent: false, run: { id: ids.seed, status: "completed" } }), { status: 201 }));
    const client = createFormalSandboxClient(fetcher);
    const loaded = await client.correctionContext(ids.seed); expect(loaded.ok).toBe(true);
    expect(fetcher.mock.calls[0][1]).toEqual({ cache: "no-store" });
    const confirmed = { ...source.frozenRules, actions: source.frozenRules.actions.map(action => ({ ...action, confirmedForSimulation: true as const })), strategies: source.frozenRules.strategies };
    await client.start({ graphSnapshotId: ids.graph, idempotencyKey: ids.variant, horizonDays: 30, digitalLifeRules: confirmed });
    const body = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(body).toEqual({ graph_snapshot_id: ids.graph, idempotency_key: ids.variant, horizon_days: 30, digital_life_rules: confirmed });
    expect(JSON.stringify(source)).toBe(frozen);
    const malformed = structuredClone(source); malformed.draftRules.actions[0].confirmedForSimulation = true as never;
    const bad = await createFormalSandboxClient(vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, context: malformed })))).correctionContext(ids.seed);
    expect(bad).toEqual({ ok: false, status: 500, errorCode: "invalid_response" });
  });
  it("the canonical Core consumes the corrected response without altering frozen source rules", async () => {
    const source = revisionFixture(); const frozen = JSON.stringify(source.frozenRules);
    const draft = structuredClone(source.frozenRules);
    const response = draft.actions[1];
    if (response.operation.actionType !== "update_relation_signal") throw new Error("fixture response missing");
    response.operation.signal = "negative";
    const rules = confirmedRevision(draft); expect(rules).not.toBeNull();
    const result = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: rules! });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bundle.events.find(event => event.eventType === "update_relation_signal")?.deltas).toContainEqual(expect.objectContaining({ before: "neutral", after: "negative" }));
    expect(JSON.stringify(source.frozenRules)).toBe(frozen);
  }, 60_000);
  it("edits a frozen resource amount only after fresh confirmation and rejects nonfinite, nonpositive or excessive values", () => {
    const source = revisionFixture();
    const allocation = { ...source.frozenRules.actions[0], key: "rule-4", operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 1 }, when: { kind: "at_tick" as const, tickIndex: 2 } };
    source.frozenRules.actions.push(allocation);
    source.draftRules.actions.push({ ...allocation, confirmedForSimulation: false });
    const html = renderToStaticMarkup(createElement(ModelRuleRevision, { source, disabled: false, onChange: vi.fn() }));
    expect(html).toContain("修订投入量"); expect(html).toContain("原资源投入：可投入时间 · 1");
    const rules = structuredClone(source.frozenRules); rules.actions.at(-1)!.operation = { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 };
    expect(confirmedRevision({ ...rules, actions: rules.actions.map((item, index) => index === rules.actions.length - 1 ? { ...item, confirmedForSimulation: false } : item) })).toBeNull();
    expect(confirmedRevision(rules)?.actions.at(-1)?.operation).toEqual({ actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 });
    for (const amount of [NaN, Infinity, 0, -1, 1000001]) { rules.actions.at(-1)!.operation = { actionType: "allocate_resource", resourceKey: "resource-1", amount }; expect(confirmedRevision(rules)).toBeNull(); }
    expect(source.frozenRules.actions.at(-1)?.operation).toEqual({ actionType: "allocate_resource", resourceKey: "resource-1", amount: 1 });
  });
});
