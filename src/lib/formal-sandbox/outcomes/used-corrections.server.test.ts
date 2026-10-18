import { beforeAll, describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "../runtime";
import { projectFormalSandboxResult } from "../result-projection.server";
import { buildObservedOutcome, outcomeTargets } from "./core-adapter";
import { digest } from "./core-adapter";
import { formalSandboxResultProjectionSchema } from "../client";
import { safeUsedCorrectionsSchema } from "./used-corrections-contracts";
import { parseCompatibleForecastLockPersistenceVersion } from "./forecast-lock-compat.server";

const sourceRunId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
type Bundle = Extract<Awaited<ReturnType<typeof buildFormalSandboxRunV2>>, { ok: true }>["bundle"];
let source: Bundle;
let next: Bundle;

describe("frozen used correction receipt", () => {
  beforeAll(async () => {
    const input = digitalLifeInput();
    const rules = digitalLifeRules();
    rules.actions.push({ key: "rule-4", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: "rule-2" }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 1 }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人明确设定的后续资源投入" } as never);
    const original = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
    expect(original.ok).toBe(true);
    if (!original.ok) throw new Error("fixture runtime failed");
    source = original.bundle;
    const target = outcomeTargets(source, "2026-11-10T04:00:00.000Z", true).find(item => item.conditions.some(condition => condition.ruleKey === "rule-2"))!;
    const observed = await buildObservedOutcome(source, "2026-10-06T03:59:59.999Z", {
      target_key: target.key, observed: "uncertain", uncertainty: "medium", evidence_summary: "本人观察到询问后的实际回应有所不同",
      confirmed_user_observation: true, idempotency_key: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      observations: target.conditions.map(condition => ({ key: condition.key,
        value: condition.kind === "update_relation_signal" ? "negative" as const : condition.expectedValue,
        ...(condition.requiresTime ? { occurred_at: `2026-10-${String(10 + condition.sequence * 5).padStart(2, "0")}T04:00:00.000Z` } : {}),
      })),
      correction: { rule_key: "rule-2", confirmed_for_next_run: true },
    }, "2026-11-10T04:00:00.000Z");
    expect(observed.correction?.nextValue).toBe("negative");
    const rerun = await buildFormalSandboxRunV2({ ...input, startedAt: "2026-11-11T04:00:00.000Z", digitalLifeRules: rules,
      outcomeCalibration: { version: "formal-outcome-run-v1", corrections: [{ ...observed.correction!, key: `correction-v1-${"a".repeat(64)}`, sourceRunId }] },
    });
    expect(rerun.ok).toBe(true);
    if (!rerun.ok) throw new Error("corrected runtime failed");
    next = rerun.bundle;
  }, 120_000);

  it("shows the actual observed correction and the controlled selected Event in every sample", () => {
    const projection = projectFormalSandboxResult(next, { correctionSources: new Map([[sourceRunId, source]]) });
    expect(projection).not.toBeNull();
    expect(projection?.usedCorrections).toEqual({ version: "formal-used-corrections-v1", status: "recorded", items: [expect.objectContaining({
      key: "correction-1", sourceRunId, ruleKey: "rule-2", previousValue: "positive", nextValue: "negative",
      evidenceSummary: "本人观察到询问后的实际回应有所不同", samples: expect.arrayContaining([
        expect.objectContaining({ sampleKey: "sample-1", status: "executed", stepKeys: [expect.stringMatching(/^step-/)] }),
      ]),
    })] });
    expect(projection?.usedCorrections?.items[0]?.samples).toHaveLength(3);
    expect(projection?.strategyPaths.every(path => !Object.hasOwn(path.projection, "usedCorrections"))).toBe(true);
  });

  it("preserves a JSON-roundtripped receipt through the typed browser contract", () => {
    expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(source))) !== null, "source JSON projection").toBe(true);
    expect(projectFormalSandboxResult(JSON.parse(JSON.stringify(next))) !== null, "next JSON projection without source").toBe(true);
    const projection = projectFormalSandboxResult(JSON.parse(JSON.stringify(next)), { correctionSources: new Map([[sourceRunId, JSON.parse(JSON.stringify(source))]]) });
    expect(formalSandboxResultProjectionSchema.parse(JSON.parse(JSON.stringify(projection)))).toEqual(projection);
  });

  it("restores JSON-omitted optionals only when all original identities and signatures survive the final Core parser", () => {
    const record = JSON.parse(JSON.stringify(source.forecastPersistenceHistory![0]));
    const parsed = parseCompatibleForecastLockPersistenceVersion(record);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(JSON.parse(JSON.stringify(parsed.persistenceVersion))).toEqual(record);
    const forged = structuredClone(record);
    forged.persistenceIntegritySignature = "0".repeat(24);
    expect(parseCompatibleForecastLockPersistenceVersion(forged).ok).toBe(false);
  });

  it.each(["url", "locator", "occurredAt"])("rejects actual JSON provenance changes rather than restoring over them (%s)", field => {
    const record = JSON.parse(JSON.stringify(source.forecastPersistenceHistory![0]));
    record.artifact.value.sourceSnapshots.claimSet.realityBoundary.evidenceLedger.items[0].provenance[0][field] = field === "url" ? "https://example.org/evidence" : field === "occurredAt" ? "2026-10-05T00:00:00.000Z" : "changed section";
    expect(parseCompatibleForecastLockPersistenceVersion(record).ok).toBe(false);
  });

  it("distinguishes absent corrections from a frozen correction whose historical source is unavailable", () => {
    expect(projectFormalSandboxResult(source)?.usedCorrections).toEqual({ version: "formal-used-corrections-v1", status: "none_recorded", items: [] });
    expect(projectFormalSandboxResult(next)?.usedCorrections).toEqual({ version: "formal-used-corrections-v1", status: "source_unavailable", items: [] });
    expect(projectFormalSandboxResult(next)?.claims.length).toBeGreaterThan(0);
  });

  it.each(["ownerId", "seedContextId", "graphSnapshotId", "agentSnapshotId", "profileRevision", "previousValue", "nextValue", "ruleFingerprint", "sourceRunId"])("rejects a contradictory frozen correction instead of hiding it as missing (%s)", field => {
    const forged = structuredClone(next);
    const correction = forged.inputSnapshot.outcomeCalibration!.corrections[0]!;
    Object.assign(correction, { [field]: field.endsWith("Id") ? "cccccccc-cccc-4ccc-8ccc-cccccccccccc" : field === "profileRevision" ? 9 : field === "ruleFingerprint" ? "f".repeat(64) : "neutral" });
    // The sourceRunId mutation names a supplied unrelated/foreign source; it is not a missing read.
    const sources = new Map([[correction.sourceRunId, source]]);
    expect(projectFormalSandboxResult(forged, { correctionSources: sources })).toBeNull();
  });

  it("rejects a readable but tampered source and a changed rule fingerprint", () => {
    const forged = structuredClone(source);
    forged.inputSnapshot.digitalLifeModel!.rules.actions[1]!.evidenceSummary = "被改写的原始规则来源";
    expect(projectFormalSandboxResult(next, { correctionSources: new Map([[sourceRunId, forged]]) })).toBeNull();
    const invalid = structuredClone(source);
    invalid.forecastPersistenceHistory![0] = {} as never;
    expect(projectFormalSandboxResult(next, { correctionSources: new Map([[sourceRunId, invalid]]) })).toBeNull();
  });

  it("does not attach the receipt to a strategy even when it carries the same frozen calibration", () => {
    const strategy = next.strategyPaths!.paths[0]!.bundle;
    expect(strategy.inputSnapshot.outcomeCalibration).toBeDefined();
    expect(projectFormalSandboxResult(strategy, { correctionSources: new Map([[sourceRunId, source]]) })).not.toHaveProperty("usedCorrections");
  });

  it("rejects malformed safe receipt states", () => {
    expect(safeUsedCorrectionsSchema.safeParse({ version: "formal-used-corrections-v1", status: "recorded", items: [] }).success).toBe(false);
    const receipt = projectFormalSandboxResult(next, { correctionSources: new Map([[sourceRunId, source]]) })!.usedCorrections!;
    const forged = structuredClone(receipt);
    forged.items[0]!.samples[0]!.stepKeys = [];
    expect(safeUsedCorrectionsSchema.safeParse(forged).success).toBe(false);
  });

  it("labels a loaded rule with no controlled Event as not executed in each actual sample", async () => {
    const input = digitalLifeInput();
    input.realityProfileSnapshot.profile.worldInputs.resources[0]!.usePerTick = null;
    const rules = { ...digitalLifeRules(), version: "digital-life-rules-v3" as const, strategies: [], actions: [
      { key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick" as const, tickIndex: 0 }, operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 1 }, classification: "assumption" as const, confirmedForSimulation: true as const, evidenceSummary: "本人设定的首次投入" },
      { key: "rule-2", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick" as const, tickIndex: 1 }, guard: { kind: "resource_balance" as const, resourceKey: "resource-1", operator: "gte" as const, value: 5 }, operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 1 }, classification: "assumption" as const, confirmedForSimulation: true as const, evidenceSummary: "本人设定的后续投入" },
    ] };
    const original = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
    expect(original.ok).toBe(true); if (!original.ok) return;
    const corrections = rules.actions.map((rule, index) => ({
      key: `correction-v1-${String(index + 1).repeat(64)}`, version: "formal-outcome-rule-correction-v1", ownerId: input.ownerId, seedContextId: input.seedContextId,
      graphSnapshotId: input.graphSnapshotId, agentSnapshotId: input.agentSnapshotId, profileRevision: 2, sourceRunId, ruleKey: rule.key, ruleFingerprint: digest(rule), kind: "allocate_resource",
      previousValue: 1, nextValue: index === 0 ? 5 : 2, evidenceSummary: `本人记录的第 ${index + 1} 项资源投入修正`, recordedAt: "2026-11-10T04:00:00.000Z", observationSignature: String(index + 1).repeat(64),
    }));
    const rerun = await buildFormalSandboxRunV2({ ...input, startedAt: "2026-11-11T04:00:00.000Z", digitalLifeRules: rules, outcomeCalibration: { version: "formal-outcome-run-v1", corrections } });
    expect(rerun.ok, !rerun.ok ? rerun.errorCode : "success").toBe(true); if (!rerun.ok) return;
    const projection = projectFormalSandboxResult(rerun.bundle, { correctionSources: new Map([[sourceRunId, original.bundle]]) });
    expect(projection).not.toBeNull();
    expect(projection?.usedCorrections?.items[0]?.samples.every(sample => sample.status === "executed")).toBe(true);
    expect(projection?.usedCorrections?.items[1]?.samples).toEqual([1, 2, 3].map(index => ({ sampleKey: `sample-${index}`, status: "not_executed", stepKeys: [] })));
  }, 60_000);
});
