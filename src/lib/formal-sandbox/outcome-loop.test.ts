import { describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";
import { buildObservedOutcome, digest, outcomeTargets } from "./outcomes/core-adapter";

describe("formal durable outcome prerequisite", () => {
  it("returns the complete canonical pre-lock history for atomic durable storage", async () => {
    const result = await buildFormalSandboxRunV2({ ...digitalLifeInput(), digitalLifeRules: digitalLifeRules() });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bundle = result.bundle as unknown as { forecastPersistenceHistory?: Array<{ artifact: { kind: string; value: { sourceSnapshots: unknown } }; version: number }> };
    expect(bundle.forecastPersistenceHistory).toHaveLength(1);
    expect(bundle.forecastPersistenceHistory?.[0]?.artifact.kind).toBe("forecast_lock");
    expect(bundle.forecastPersistenceHistory?.[0]?.version).toBe(1);
  }, 60_000);
});

describe("formal actual observations and applied conditions",()=>{
  it("captures a later user observation through the accepted Core without rewriting the forecast",async()=>{
    const result=await buildFormalSandboxRunV2({...digitalLifeInput(),digitalLifeRules:digitalLifeRules()});
    expect(result.ok).toBe(true);if(!result.ok)return;
    const before=JSON.stringify(result.bundle);
    const recordedAt="2026-11-10T04:00:00.000Z";
    const target=outcomeTargets(result.bundle,recordedAt,true)[0]!;
    const observations=target.conditions.map(c=>({key:c.key,value:c.kind==="update_relation_signal"?"negative" as const:c.expectedValue,occurred_at:"2026-10-20T04:00:00.000Z"}));
    const built=await buildObservedOutcome(result.bundle,"2026-10-06T03:59:59.999Z",{target_key:target.key,observed:"uncertain",observations,evidence_summary:"本人记录的询问后回应与原条件不同",uncertainty:"medium",confirmed_user_observation:true,correction:{rule_key:"rule-2",confirmed_for_next_run:true},idempotency_key:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"},recordedAt);
    expect(built.artifacts).toHaveLength(0);
    expect(built.criteriaComparison.status).toBe("not_recorded");
    expect(built.correction?.nextValue).toBe("negative");
    expect(JSON.stringify(result.bundle)).toBe(before);
  },60_000);
  it("uses a source-bound confirmed correction to change controlled next-run response Events",async()=>{
    const input=digitalLifeInput(); const rules=digitalLifeRules();
    const result=await buildFormalSandboxRunV2({...input,digitalLifeRules:rules,outcomeCalibration:{version:"formal-outcome-run-v1",corrections:[{
      key:`correction-v1-${"a".repeat(64)}`,version:"formal-outcome-rule-correction-v1",ownerId:input.ownerId,seedContextId:input.seedContextId,graphSnapshotId:input.graphSnapshotId,agentSnapshotId:input.agentSnapshotId,profileRevision:2,ruleKey:"rule-2",ruleFingerprint:digest(rules.actions[1]),kind:"update_relation_signal",previousValue:"positive",nextValue:"negative",evidenceSummary:"本人观察到实际回应不同",recordedAt:"2026-10-01T00:00:00.000Z",observationSignature:"a".repeat(64),sourceRunId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    }]}});
    expect(result.ok).toBe(true);if(!result.ok)return;
    const responses=result.bundle.events.filter(e=>e.eventType==="update_relation_signal");
    expect(responses.length).toBeGreaterThan(0);
    expect(responses.every(e=>e.deltas.some(d=>d.valueType==="relation"&&d.after==="negative"))).toBe(true);
    expect(rules.actions[1]?.operation.signal).toBe("positive");
  },60_000);
});
