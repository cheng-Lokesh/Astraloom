import { z } from "zod";
import { canonicalModelDraftJson, digitalLifeModelDraftSchema, modelReconciliationSchema, preparedModelDraftSourceSchema, type DigitalLifeModelDraft, type ModelReconciliation, type PreparedModelDraftSource } from "./model-draft";
import { digitalLifeRulesDraftSchema, type DigitalLifeRulesDraft } from "@/lib/formal-sandbox/correction-context";
import { digitalLifeOperationSchema } from "./model";
import { validateRevisionDraft } from "./model-rule-validation";

export type ModelReconciliationResolution = { kind: "resource"; resourceKey: string; amount: number } | { kind: "variable"; variableKey: string; value: string } | { kind: "detach_profile_entry" } | { kind: "remove" };
export type ModelReconciliationInput = { draft: DigitalLifeModelDraft; reconciliation: ModelReconciliation; preparedSourceContext: PreparedModelDraftSource; resolutions: Record<string, ModelReconciliationResolution> };
export type ModelReconciliationApplication = { ok: true; draftRules: DigitalLifeRulesDraft; sourceContext: PreparedModelDraftSource; expectedRevision: number; horizonDays: 30 | 90; permissionsReset: ModelReconciliation["permissionsReset"] } | { ok: false; errorCode: "reconciliation_incomplete" | "invalid_reconciliation"; unresolvedRuleKeys: string[] };

const resets = { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true } as const;
const resourceResolution = digitalLifeOperationSchema.options[3].omit({ actionType: true }).extend({ kind: z.literal("resource") }).strict();
const variableResolution = digitalLifeOperationSchema.options[4].omit({ actionType: true }).extend({ kind: z.literal("variable") }).strict();
const resolutionSchema = z.discriminatedUnion("kind", [resourceResolution, variableResolution, z.object({ kind: z.literal("detach_profile_entry") }).strict(), z.object({ kind: z.literal("remove") }).strict()]);
const applicationInputSchema = z.object({ draft: digitalLifeModelDraftSchema, reconciliation: modelReconciliationSchema, preparedSourceContext: preparedModelDraftSourceSchema, resolutions: z.record(z.string().regex(/^rule-[1-9]\d*$/), resolutionSchema) }).strict();

/** Ordinals identify frozen selectors, not stable resource/variable identities across Profile revisions. */
export function buildModelReconciliation(draft: DigitalLifeModelDraft, prepared: PreparedModelDraftSource): ModelReconciliation | null {
  const old = draft.sourceContext?.modelContext, current = prepared.modelContext;
  if (draft.status !== "stale" || !old || !draft.draftRules || !draft.horizonDays || current.profileRevision <= old.profileRevision || old.graphSnapshotId !== current.graphSnapshotId || old.agentSnapshotId !== current.agentSnapshotId || canonicalModelDraftJson(old.agents) !== canonicalModelDraftJson(current.agents) || canonicalModelDraftJson(old.relationships) !== canonicalModelDraftJson(current.relationships)) return null;
  const requirements: ModelReconciliation["requirements"] = [];
  for (const action of draft.draftRules.actions) {
    const operation = action.operation;
    if (operation.actionType === "allocate_resource") {
      const resource = old.resources.find(item => item.key === operation.resourceKey);
      requirements.push({ ruleKey: action.key, kind: "resource", previousSelector: operation.resourceKey, ...(resource ? { previousLabel: resource.label } : {}) });
    } else if (operation.actionType === "update_external_variable") {
      const variable = "variables" in old ? old.variables?.find(item => item.key === operation.variableKey) : undefined;
      requirements.push({ ruleKey: action.key, kind: "variable", previousSelector: operation.variableKey, ...(variable ? { previousLabel: variable.label } : {}) });
    } else if (operation.actionType === "update_commitment" && operation.profileEntryKey) requirements.push({ ruleKey: action.key, kind: "detach_profile_entry", previousSelector: operation.profileEntryKey });
  }
  return { version: "digital-life-model-reconciliation-v1", draftRevision: draft.currentRevision, horizonDays: draft.horizonDays, sourceRules: structuredClone(draft.draftRules), requirements, permissionsReset: { ...resets } };
}

/** Returns only an unconfirmed current-source intention; saving and Run authorization remain separate. */
export function applyModelReconciliation(raw: ModelReconciliationInput): ModelReconciliationApplication {
  const invalid = (): ModelReconciliationApplication => ({ ok: false, errorCode: "invalid_reconciliation", unresolvedRuleKeys: [] });
  const parsed = applicationInputSchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const input = parsed.data;
  const plan = buildModelReconciliation(input.draft, input.preparedSourceContext);
  if (!plan || plan.draftRevision !== input.reconciliation.draftRevision || plan.horizonDays !== input.reconciliation.horizonDays || canonicalModelDraftJson(plan.sourceRules) !== canonicalModelDraftJson(input.reconciliation.sourceRules)) return invalid();
  const minimal = (requirements: ModelReconciliation["requirements"]) => requirements.map(({ ruleKey, kind, previousSelector }) => ({ ruleKey, kind, previousSelector }));
  if (canonicalModelDraftJson(minimal(plan.requirements)) !== canonicalModelDraftJson(minimal(input.reconciliation.requirements))) return invalid();
  const source = input.preparedSourceContext;
  const knownCurrent = input.draft.currentSourceContext;
  if (!knownCurrent) return invalid();
  if ("version" in knownCurrent) {
    if (canonicalModelDraftJson(knownCurrent) !== canonicalModelDraftJson(source)) return invalid();
  } else {
    const legacyContext = { ...source.modelContext };
    delete (legacyContext as { variables?: unknown }).variables;
    if (canonicalModelDraftJson(knownCurrent.modelContext) !== canonicalModelDraftJson(legacyContext)) return invalid();
  }
  const rules = plan.sourceRules;
  const byKey = new Map(rules.actions.map(action => [action.key, action]));
  const requirements = new Map(plan.requirements.map(item => [item.ruleKey, item]));
  for (const [key, resolution] of Object.entries(input.resolutions)) {
    if (!byKey.has(key) || resolution.kind !== "remove" && requirements.get(key)?.kind !== resolution.kind) return invalid();
  }
  const removed = new Set(Object.entries(input.resolutions).filter(([, resolution]) => resolution.kind === "remove").map(([key]) => key));
  const removedPaths = new Set<string>();
  let expanded = true;
  while (expanded) {
    const before = removed.size;
    for (const action of rules.actions) if (action.when.kind === "after_rule" && removed.has(action.when.ruleKey)) removed.add(action.key);
    for (const strategy of rules.strategies) if (!rules.actions.some(action => !removed.has(action.key) && action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey)) {
      removedPaths.add(strategy.participantKey);
      for (const action of rules.actions) if (action.pathKey === strategy.participantKey) removed.add(action.key);
    }
    expanded = before !== removed.size;
  }
  const unresolvedRuleKeys = plan.requirements.filter(item => !removed.has(item.ruleKey) && !input.resolutions[item.ruleKey]).map(item => item.ruleKey);
  if (unresolvedRuleKeys.length) return { ok: false, errorCode: "reconciliation_incomplete", unresolvedRuleKeys };
  const actions = rules.actions.filter(action => !removed.has(action.key)).map(action => {
    const resolution = input.resolutions[action.key];
    let operation = action.operation;
    if (resolution?.kind === "resource") operation = { actionType: "allocate_resource", resourceKey: resolution.resourceKey, amount: resolution.amount };
    if (resolution?.kind === "variable") operation = { actionType: "update_external_variable", variableKey: resolution.variableKey, value: resolution.value };
    if (resolution?.kind === "detach_profile_entry" && operation.actionType === "update_commitment") {
      const detached = { ...operation };
      delete detached.profileEntryKey;
      operation = detached;
    }
    return { ...action, operation, confirmedForSimulation: false as const };
  });
  const draftRules = digitalLifeRulesDraftSchema.safeParse({ ...rules, version: "digital-life-rules-v2", graphSnapshotId: source.modelContext.graphSnapshotId, agentSnapshotId: source.modelContext.agentSnapshotId, profileRevision: source.modelContext.profileRevision, actions, strategies: rules.strategies.filter(strategy => !removedPaths.has(strategy.participantKey)).map(strategy => ({ ...strategy, confirmedForSimulation: false })) });
  if (!draftRules.success || !validateRevisionDraft({ modelContext: source.modelContext, horizonDays: plan.horizonDays }, draftRules.data).ok) return invalid();
  return { ok: true, draftRules: draftRules.data, sourceContext: source, expectedRevision: plan.draftRevision, horizonDays: plan.horizonDays, permissionsReset: { ...resets } };
}
