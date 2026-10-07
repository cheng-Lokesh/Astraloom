import { createHash } from "node:crypto";
import { expect,it } from "vitest";
import { digitalLifeInput,digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { canonicalStage7JsonV2 } from "@/lib/v2/outcome-calibration/ids";
import { buildFormalSandboxRunV2 } from "./runtime";
it("applies a confirmed observation-bound response correction to actual controlled next-run Events",async()=>{
 const input=digitalLifeInput(),rules=digitalLifeRules();
 const result=await buildFormalSandboxRunV2({...input,digitalLifeRules:rules,outcomeCalibration:{version:"formal-outcome-run-v1",corrections:[{key:`correction-v1-${"a".repeat(64)}`,version:"formal-outcome-rule-correction-v1",ownerId:input.ownerId,seedContextId:input.seedContextId,graphSnapshotId:input.graphSnapshotId,agentSnapshotId:input.agentSnapshotId,profileRevision:2,ruleKey:"rule-2",ruleFingerprint:createHash("sha256").update(canonicalStage7JsonV2(rules.actions[1])).digest("hex"),kind:"update_relation_signal",previousValue:"positive",nextValue:"negative",evidenceSummary:"本人观察到实际回应不同",recordedAt:"2026-10-01T00:00:00.000Z",observationSignature:"a".repeat(64),sourceRunId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}]}});
 expect(result.ok).toBe(true);if(!result.ok)return;
 const responses=result.bundle.events.filter(e=>e.eventType==="update_relation_signal");expect(responses.length).toBeGreaterThan(0);
 expect(responses.every(e=>e.deltas.some(d=>d.valueType==="relation"&&d.after==="negative"))).toBe(true);
 expect(rules.actions[1]?.operation.signal).toBe("positive");
},60_000);

it("applies a confirmed resource amount correction to a new controlled Event while preserving the original rule",async()=>{
 const input=digitalLifeInput();
 const rules={...digitalLifeRules(),strategies:[],actions:[{key:"rule-1",pathKey:"main",actorKey:"person-1",when:{kind:"at_tick",tickIndex:0},operation:{actionType:"allocate_resource",resourceKey:"resource-1",amount:2},classification:"assumption",confirmedForSimulation:true,evidenceSummary:"本人明确设定的资源投入"}]};
 const result=await buildFormalSandboxRunV2({...input,digitalLifeRules:rules,outcomeCalibration:{version:"formal-outcome-run-v1",corrections:[{key:`correction-v1-${"b".repeat(64)}`,version:"formal-outcome-rule-correction-v1",ownerId:input.ownerId,seedContextId:input.seedContextId,graphSnapshotId:input.graphSnapshotId,agentSnapshotId:input.agentSnapshotId,profileRevision:2,ruleKey:"rule-1",ruleFingerprint:createHash("sha256").update(canonicalStage7JsonV2(rules.actions[0])).digest("hex"),kind:"allocate_resource",previousValue:2,nextValue:3,evidenceSummary:"本人观察到实际投入为三小时",recordedAt:"2026-10-01T00:00:00.000Z",observationSignature:"b".repeat(64),sourceRunId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}]}});
 expect(result.ok).toBe(true);if(!result.ok)return;
 const allocations=result.bundle.events.filter(e=>e.operation.actionType==="allocate_resource");
 expect(allocations.some(e=>e.operation.actionType==="allocate_resource"&&e.operation.amount===3&&e.deltas.some(d=>d.valueType==="resource"&&d.before-d.after===3))).toBe(true);
 expect(rules.actions[0].operation.amount).toBe(2);
},60000);
