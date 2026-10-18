import { z } from "zod";
import { canonicalModelDraftJson, digitalLifeModelDraftSchema, modelReconciliationSchema, preparedModelDraftSourceSchema, type DigitalLifeModelDraft, type ModelReconciliation, type PreparedModelDraftSource } from "./model-draft";
import { digitalLifeRulesDraftSchema, type DigitalLifeRulesDraft } from "@/lib/formal-sandbox/correction-context";
import { digitalLifeOperationSchema } from "./model";
import { validateRevisionDraft } from "./model-rule-validation";

export type ModelReconciliationResolution = { kind: "resource"; resourceKey: string; amount: number } | { kind: "resource"; resourceKey: string; operator: "lte" | "gte"; value: number } | { kind: "variable"; variableKey: string; value: string } | { kind: "detach_profile_entry" } | { kind: "remove" };
export type ModelReconciliationInput = { draft: DigitalLifeModelDraft; reconciliation: ModelReconciliation; preparedSourceContext: PreparedModelDraftSource; resolutions: Record<string, ModelReconciliationResolution>; removedRuleKeys?: string[] };
export type ModelReconciliationApplication = { ok: true; draftRules: DigitalLifeRulesDraft; sourceContext: PreparedModelDraftSource; expectedRevision: number; horizonDays: 30 | 90; permissionsReset: ModelReconciliation["permissionsReset"] } | { ok: false; errorCode: "reconciliation_incomplete" | "invalid_reconciliation"; unresolvedRuleKeys: string[] };

const resets = { planning: true, symbolic: true, outcomeCalibration: true, requestIdentity: true } as const;
const resourceResolution = digitalLifeOperationSchema.options[3].omit({ actionType: true }).extend({ kind: z.literal("resource") }).strict();
const variableResolution = digitalLifeOperationSchema.options[4].omit({ actionType: true }).extend({ kind: z.literal("variable") }).strict();
const guardResourceResolution = z.object({ kind: z.literal("resource"), resourceKey: z.string().regex(/^resource-[1-8]$/), operator: z.enum(["lte", "gte"]), value: z.number().finite().nonnegative() }).strict();
const resolutionSchema = z.union([resourceResolution, guardResourceResolution, variableResolution, z.object({ kind: z.literal("detach_profile_entry") }).strict(), z.object({ kind: z.literal("remove") }).strict()]);
const applicationInputSchema = z.object({ draft: digitalLifeModelDraftSchema, reconciliation: modelReconciliationSchema, preparedSourceContext: preparedModelDraftSourceSchema, resolutions: z.record(z.string().regex(/^rule-[1-9]\d*(?::(?:operation|guard))?$/), resolutionSchema), removedRuleKeys: z.array(z.string().regex(/^rule-[1-9]\d*$/)).max(18).optional() }).strict();

/** Ordinals identify frozen selectors, not stable resource/variable identities across Profile revisions. */
export function buildModelReconciliation(draft: DigitalLifeModelDraft, prepared: PreparedModelDraftSource): ModelReconciliation | null {
  const old = draft.sourceContext?.modelContext, current = prepared.modelContext;
  if (draft.status !== "stale" || !old || !draft.draftRules || !draft.horizonDays || current.profileRevision <= old.profileRevision || old.graphSnapshotId !== current.graphSnapshotId || old.agentSnapshotId !== current.agentSnapshotId || canonicalModelDraftJson(old.agents) !== canonicalModelDraftJson(current.agents) || canonicalModelDraftJson(old.relationships) !== canonicalModelDraftJson(current.relationships)) return null;
  const requirements: Extract<ModelReconciliation, { version: "digital-life-model-reconciliation-v1" }>["requirements"] = [];
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
  const common = { draftRevision: draft.currentRevision, horizonDays: draft.horizonDays, sourceRules: structuredClone(draft.draftRules), permissionsReset: { ...resets } };
  if (draft.draftRules.version !== "digital-life-rules-v3") return { version: "digital-life-model-reconciliation-v1", ...common, requirements };
  const guardedRequirements: Extract<ModelReconciliation, { version: "digital-life-model-reconciliation-v2" }>["requirements"] = requirements.map(item => ({ ...item, requirementKey: `${item.ruleKey}:operation`, role: "operation" }));
  for (const action of draft.draftRules.actions) if (action.guard) {
    const guard = action.guard;
    const resource = guard.kind === "resource_balance" ? old.resources.find(item => item.key === guard.resourceKey) : undefined;
    const variable = guard.kind === "environment_equals" && "variables" in old ? old.variables?.find(item => item.key === guard.variableKey) : undefined;
    guardedRequirements.push({ requirementKey: `${action.key}:guard`, ruleKey: action.key, role: "guard", kind: guard.kind === "resource_balance" ? "resource" : "variable", previousSelector: guard.kind === "resource_balance" ? guard.resourceKey : guard.variableKey, ...(resource || variable ? { previousLabel: (resource ?? variable)!.label } : {}) });
  }
  return { version: "digital-life-model-reconciliation-v2", ...common, requirements: guardedRequirements };
}

/** Returns only an unconfirmed current-source intention; saving and Run authorization remain separate. */
export function applyModelReconciliation(raw: ModelReconciliationInput): ModelReconciliationApplication {
  const invalid = (): ModelReconciliationApplication => ({ ok: false, errorCode: "invalid_reconciliation", unresolvedRuleKeys: [] });
  const parsed = applicationInputSchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const input = parsed.data;
  const plan = buildModelReconciliation(input.draft, input.preparedSourceContext);
  if (!plan || plan.version !== input.reconciliation.version || plan.draftRevision !== input.reconciliation.draftRevision || plan.horizonDays !== input.reconciliation.horizonDays || canonicalModelDraftJson(plan.sourceRules) !== canonicalModelDraftJson(input.reconciliation.sourceRules)) return invalid();
  const minimal = (requirements: ModelReconciliation["requirements"]) => requirements.map(item => ({ ruleKey: item.ruleKey, kind: item.kind, previousSelector: item.previousSelector, ...("role" in item ? { role: item.role, requirementKey: item.requirementKey } : {}) })).sort((a, b) => canonicalModelDraftJson(a).localeCompare(canonicalModelDraftJson(b)));
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
  const requirementId = (item: ModelReconciliation["requirements"][number]): string => "requirementKey" in item && typeof item.requirementKey === "string" ? item.requirementKey : item.ruleKey;
  const byKey = new Map(rules.actions.map(action => [action.key, action]));
  const v2 = plan.version === "digital-life-model-reconciliation-v2";
  if (v2 ? input.removedRuleKeys === undefined : input.removedRuleKeys !== undefined) return invalid();
  const requirements = new Map(plan.requirements.map(item => [requirementId(item), item]));
  for (const [key, resolution] of Object.entries(input.resolutions)) {
    const requirement = requirements.get(key);
    if (v2 ? !requirement || resolution.kind === "remove" : !byKey.has(key)) return invalid();
    if (resolution.kind !== "remove" && requirement?.kind !== resolution.kind) return invalid();
    if (resolution.kind === "resource" && ((requirement && "role" in requirement && requirement.role === "guard") !== ("operator" in resolution))) return invalid();
  }
  const removed = new Set<string>(v2 ? input.removedRuleKeys! : Object.entries(input.resolutions).filter(([, resolution]) => resolution.kind === "remove").map(([key]) => key));
  if (removed.size !== (v2 ? input.removedRuleKeys!.length : removed.size) || [...removed].some(key => !byKey.has(key))) return invalid();
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
  const unresolvedRuleKeys = plan.requirements.filter(item => !removed.has(item.ruleKey) && !input.resolutions[requirementId(item)]).map(requirementId);
  if (unresolvedRuleKeys.length) return { ok: false, errorCode: "reconciliation_incomplete", unresolvedRuleKeys };
  const actions = rules.actions.filter(action => !removed.has(action.key)).map(action => {
    const resolution = input.resolutions[v2 ? `${action.key}:operation` : action.key];
    const guardResolution = v2 ? input.resolutions[`${action.key}:guard`] : undefined;
    let operation = action.operation;
    if (resolution?.kind === "resource" && "amount" in resolution) operation = { actionType: "allocate_resource", resourceKey: resolution.resourceKey, amount: resolution.amount };
    if (resolution?.kind === "variable") operation = { actionType: "update_external_variable", variableKey: resolution.variableKey, value: resolution.value };
    if (resolution?.kind === "detach_profile_entry" && operation.actionType === "update_commitment") {
      const detached = { ...operation };
      delete detached.profileEntryKey;
      operation = detached;
    }
    const guard = guardResolution?.kind === "resource" && "operator" in guardResolution ? { kind: "resource_balance" as const, resourceKey: guardResolution.resourceKey, operator: guardResolution.operator, value: guardResolution.value } : guardResolution?.kind === "variable" ? { kind: "environment_equals" as const, variableKey: guardResolution.variableKey, value: guardResolution.value } : action.guard;
    return { ...action, operation, ...(guard ? { guard } : {}), confirmedForSimulation: false as const };
  });
  const draftRules = digitalLifeRulesDraftSchema.safeParse({ ...rules, version: v2 ? "digital-life-rules-v3" : "digital-life-rules-v2", graphSnapshotId: source.modelContext.graphSnapshotId, agentSnapshotId: source.modelContext.agentSnapshotId, profileRevision: source.modelContext.profileRevision, actions, strategies: rules.strategies.filter(strategy => !removedPaths.has(strategy.participantKey)).map(strategy => ({ ...strategy, confirmedForSimulation: false })) });
  if (!draftRules.success || !validateRevisionDraft({ modelContext: source.modelContext, horizonDays: plan.horizonDays }, draftRules.data).ok) return invalid();
  return { ok: true, draftRules: draftRules.data, sourceContext: source, expectedRevision: plan.draftRevision, horizonDays: plan.horizonDays, permissionsReset: { ...resets } };
}
