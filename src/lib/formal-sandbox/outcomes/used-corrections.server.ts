import { z } from "zod";
import { createHash } from "node:crypto";
import { digitalLifeModelSchema, type DigitalLifeRules } from "@/lib/digital-life/model";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import type { WorldEventV2 } from "@/lib/v2/agent-world/types";
import { canonicalStage7JsonV2 } from "@/lib/v2/outcome-calibration/ids";
import { initialWorldSourceSchema } from "../initial-world";
import type { SafeSimulationTimeline } from "../timeline-contracts";
import { frozenOutcomeCalibrationSchema } from "./correction-contracts";
import { applyFrozenCorrections } from "./rule-corrections";
import { safeUsedCorrectionsSchema, type SafeUsedCorrections } from "./used-corrections-contracts";
import { parseCompatibleForecastLockPersistenceVersion } from "./forecast-lock-compat.server";

export type UsedCorrectionProjectionOptions = { correctionSources?: ReadonlyMap<string, unknown> };
const frameSchema = z.object({
  inputSnapshot: initialWorldSourceSchema.extend({ digitalLifeModel: digitalLifeModelSchema, activePathKey: z.string() }),
  causalFingerprint: z.string().regex(/^[a-f0-9]{24}$/), policyFingerprint: z.string().regex(/^[a-f0-9]{24}$/).optional(),
  events: z.array(z.unknown()),
}).passthrough();
const same = (a: unknown, b: unknown) => canonicalStage7JsonV2(a) === canonicalStage7JsonV2(b);
const sameJson = (a: unknown, b: unknown) => same(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
const runtimeCanonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(runtimeCanonical).join(",")}]`
  : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${runtimeCanonical((value as Record<string, unknown>)[key])}`).join(",")}}` : JSON.stringify(value);
const empty = (status: "none_recorded" | "source_unavailable"): SafeUsedCorrections => ({ version: "formal-used-corrections-v1", status, items: [] });

/** No source read is needed for old Runs. Multiple source Runs are not this receipt protocol. */
export function usedCorrectionSourceRunId(raw: unknown): string | undefined {
  const frame = z.object({ inputSnapshot: z.object({ outcomeCalibration: frozenOutcomeCalibrationSchema.optional(), activePathKey: z.string().optional() }).passthrough() }).passthrough().parse(raw);
  if (frame.inputSnapshot.activePathKey && frame.inputSnapshot.activePathKey !== "main") return undefined;
  const ids = [...new Set(frame.inputSnapshot.outcomeCalibration?.corrections.map(item => item.sourceRunId) ?? [])];
  if (ids.length > 1) throw new Error("invalid_used_correction");
  return ids[0];
}

/** Use the existing canonical lock parser; no reconstructed lock or historical backfill. */
function sourceLockMatches(raw: unknown): boolean {
  const source = z.object({ sourceBoundary: z.unknown(), trajectoryAnalysis: z.unknown(), claims: z.array(z.unknown()), report: z.unknown(),
    forecastLockReference: z.object({ streamId: z.string(), version: z.number() }), forecastPersistenceHistory: z.array(z.unknown()).length(1),
  }).passthrough().parse(raw);
  const parsed = parseCompatibleForecastLockPersistenceVersion(source.forecastPersistenceHistory[0]);
  if (!parsed.ok || parsed.persistenceVersion.artifact.kind !== "forecast_lock") return false;
  const record = parsed.persistenceVersion, lock = record.artifact.value;
  if (!("sourceSnapshots" in lock)) return false;
  const snapshots = lock.sourceSnapshots;
  return record.streamId === source.forecastLockReference.streamId && record.version === source.forecastLockReference.version
    && sameJson(snapshots.claimSet.realityBoundary, source.sourceBoundary) && sameJson(snapshots.run.payload, source.trajectoryAnalysis)
    && sameJson(snapshots.report, source.report) && sameJson([...snapshots.claims].sort((a, b) => a.id.localeCompare(b.id)), source.claims);
}

function matchesControlledRule(event: WorldEventV2, rule: DigitalLifeRules["actions"][number], frame: z.infer<typeof frameSchema>) {
  const input = frame.inputSnapshot, model = input.digitalLifeModel;
  const ids = createStableAgentWorldIdFactoryV2(`formal-${frame.policyFingerprint ?? frame.causalFingerprint}`);
  const actor = model.agents.find(item => item.key === rule.actorKey);
  if (!actor || event.actorId !== ids("agent_definition", actor.sourceAgentId) || event.eventType !== rule.operation.actionType) return false;
  if (rule.operation.actionType === "allocate_resource" && event.operation.actionType === "allocate_resource") {
    const resource = input.realityProfileSnapshot.profile.worldInputs.resources[Number(rule.operation.resourceKey.slice(9)) - 1];
    if (!resource) return false;
    const resourceId = ids("world_resource", resource.key), entityId = ids("world_entity", actor.sourceAgentId);
    return event.operation.resourceId === resourceId && event.operation.amount === rule.operation.amount
      && same(event.targetResourceIds, [resourceId]) && same(event.targetEntityIds, [entityId]) && event.targetRelationIds.length === 0 && event.targetVariableIds.length === 0
      && event.deltas.length === 1 && event.deltas[0].valueType === "resource" && event.deltas[0].path === `resources.${resourceId}.available`
      && event.deltas[0].before - event.deltas[0].after === rule.operation.amount;
  }
  if (rule.operation.actionType === "update_relation_signal" && event.operation.actionType === "update_relation_signal") {
    const operation = rule.operation;
    const relation = model.relationships.find(item => item.key === operation.relationKey);
    if (!relation) return false;
    const relationId = ids("world_relation", relation.sourceEdgeId);
    const endpoints = [relation.fromPersonKey, relation.toPersonKey].map(key => model.agents.find(item => item.key === key)!).map(item => ids("world_entity", item.sourceAgentId));
    return event.operation.relationId === relationId && event.operation.signal === rule.operation.signal
      && same(event.targetRelationIds, [relationId]) && same([...event.targetEntityIds].sort(), endpoints.sort()) && event.targetResourceIds.length === 0 && event.targetVariableIds.length === 0
      && event.deltas.length === 1 && event.deltas[0].valueType === "relation" && event.deltas[0].path === `relations.${relationId}.signal` && event.deltas[0].after === rule.operation.signal;
  }
  return false;
}

/** A caller supplies only frozen source bundles already accepted by the Result projector.
 * Timeline must be the current Run's replay-validated main-path timeline. */
export function projectUsedCorrections(raw: unknown, timeline: SafeSimulationTimeline | undefined, options: UsedCorrectionProjectionOptions = {}): SafeUsedCorrections | undefined | null {
  try {
    const header = z.object({ inputSnapshot: z.object({ activePathKey: z.string().optional(), outcomeCalibration: z.unknown().optional() }).passthrough() }).passthrough().parse(raw);
    if (header.inputSnapshot.activePathKey && header.inputSnapshot.activePathKey !== "main") return undefined;
    if (header.inputSnapshot.outcomeCalibration === undefined) return empty("none_recorded");
    const calibration = frozenOutcomeCalibrationSchema.parse(header.inputSnapshot.outcomeCalibration);
    const frame = frameSchema.parse(raw), input = frame.inputSnapshot;
    // The frozen correction source identity and metadata belong to the admitted
    // causal input. Reusing otherwise identical rules cannot change that identity.
    if (createHash("sha256").update(runtimeCanonical(JSON.parse(JSON.stringify(input)))).digest("hex").slice(0, 24) !== frame.causalFingerprint) return null;
    const sourceRunId = usedCorrectionSourceRunId(raw)!;
    const seen = new Set<string>();
    for (const correction of calibration.corrections) {
      if (correction.ownerId !== input.ownerId || correction.seedContextId !== input.seedContextId || correction.graphSnapshotId !== input.graphSnapshotId
        || correction.agentSnapshotId !== input.agentSnapshotId || correction.profileRevision !== input.realityProfileSnapshot.revision
        || Date.parse(correction.recordedAt) > Date.parse(input.acceptedAt ?? input.startedAt) || seen.has(correction.ruleKey) || correction.previousValue === correction.nextValue) return null;
      const rule = input.digitalLifeModel.rules.actions.find(item => item.key === correction.ruleKey && item.pathKey === "main");
      const actualValue = rule?.operation.actionType === "allocate_resource" ? rule.operation.amount : rule?.operation.actionType === "update_relation_signal" ? rule.operation.signal : undefined;
      if (!rule || rule.operation.actionType !== correction.kind || actualValue !== correction.nextValue || rule.evidenceSummary !== correction.evidenceSummary) return null;
      seen.add(correction.ruleKey);
    }
    if (!options.correctionSources?.has(sourceRunId)) return empty("source_unavailable");
    const sourceRaw = options.correctionSources.get(sourceRunId), source = frameSchema.parse(sourceRaw);
    if (source.inputSnapshot.activePathKey !== "main" || !sourceLockMatches(sourceRaw)) return null;
    for (const field of ["ownerId", "seedContextId", "graphSnapshotId", "agentSnapshotId", "realityProfileSnapshot", "agents", "edges"] as const) if (!same(source.inputSnapshot[field], input[field])) return null;
    const effectiveRules = applyFrozenCorrections(input, source.inputSnapshot.digitalLifeModel.rules, calibration);
    // applyFrozenCorrections intentionally changes only operation value and evidenceSummary.
    // Exact equality excludes rebinding a rule, schedule, actor, guard or unrelated action.
    if (!same(effectiveRules, input.digitalLifeModel.rules) || !timeline) return null;
    const events = frame.events as WorldEventV2[];
    const eventByStep = new Map(events.map((event, index) => [`step-${index + 1}`, event]));
    const items = calibration.corrections.map((correction, index) => {
      const rule = input.digitalLifeModel.rules.actions.find(item => item.key === correction.ruleKey)!;
      const operation = rule.operation;
      const label = operation.actionType === "allocate_resource"
        ? `资源投入 · ${input.realityProfileSnapshot.profile.worldInputs.resources[Number(operation.resourceKey.slice(9)) - 1]!.label}`
        : `条件回应 · ${input.digitalLifeModel.relationships.find(item => operation.actionType === "update_relation_signal" && item.key === operation.relationKey)!.label}`;
      return { key: `correction-${index + 1}`, sourceRunId, ruleKey: correction.ruleKey, label, previousValue: correction.previousValue, nextValue: correction.nextValue,
        evidenceSummary: correction.evidenceSummary, recordedAt: correction.recordedAt,
        samples: timeline.samples.map(sample => {
          const selected = sample.ticks.flatMap(tick => tick.event?.causes.ruleKeys?.includes(rule.key) ? [tick.event] : []);
          if (selected.some(item => !eventByStep.has(item.stepKey) || !matchesControlledRule(eventByStep.get(item.stepKey)!, rule, frame))) throw new Error("invalid_used_correction_event");
          return { sampleKey: sample.key, status: selected.length ? "executed" as const : "not_executed" as const, stepKeys: selected.map(item => item.stepKey) };
        }),
      };
    });
    return safeUsedCorrectionsSchema.parse({ version: "formal-used-corrections-v1", status: "recorded", items });
  } catch { return null; }
}
