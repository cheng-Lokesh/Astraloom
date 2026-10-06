import { z } from "zod";
import { listRealityProfileEntries, realityProfileDraftSchema, realityProfileFieldSchema } from "@/lib/reality-profile/profile";
import { safetyRules } from "@/lib/safety/safety-rules";

const unsafe = /[\u0000-\u001f\u007f-\u009f]|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:raw\s+(?:scenario|evidence)|trace(?:[_ -]?id)?|internal(?:[_ -]?key)?|token|secret|password|api[_ -]?key|bearer|private\s+key)\b|https?:\/\//i;
export const digitalLifeSafeText = z.string().trim().min(1).max(240).refine(value => !unsafe.test(value));
const ruleText = digitalLifeSafeText.refine(value => !safetyRules.some(rule => rule.patterns.some(pattern => pattern.test(value))));
const personKey = z.string().regex(/^person-[1-9]\d*$/);
const ruleKey = z.string().regex(/^rule-[1-9]\d*$/);
const pathKey = z.union([z.literal("main"), personKey]);
const sourceRole = z.enum(["user_core", "user_variant", "npc", "group"]);
export const digitalLifeTriggerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("at_tick"), tickIndex: z.number().int().min(0).max(5) }).strict(),
  z.object({ kind: z.literal("after_rule"), ruleKey }).strict(),
]);
export const digitalLifeOperationSchema = z.discriminatedUnion("actionType", [
  z.object({ actionType: z.literal("request_information"), targetPersonKey: personKey, question: ruleText }).strict(),
  z.object({ actionType: z.literal("update_commitment"), commitmentKey: z.string().regex(/^commitment-[1-9]\d*$/), label: ruleText, status: z.enum(["planned", "active", "fulfilled", "cancelled"]), profileEntryKey: z.string().trim().min(1).max(100).optional() }).strict(),
  z.object({ actionType: z.literal("update_relation_signal"), relationKey: z.string().regex(/^relation-[1-9]\d*$/), signal: z.enum(["negative", "neutral", "positive"]) }).strict(),
  z.object({ actionType: z.literal("allocate_resource"), resourceKey: z.string().regex(/^resource-[1-9]\d*$/), amount: z.number().finite().positive().max(1_000_000) }).strict(),
]);
export const digitalLifeRulesSchema = z.object({
  version: z.literal("digital-life-rules-v1"),
  graphSnapshotId: z.string().uuid(), agentSnapshotId: z.string().uuid(), profileRevision: z.number().int().nonnegative(),
  strategies: z.array(z.object({ participantKey: personKey, label: ruleText, confirmedForSimulation: z.literal(true), evidenceSummary: ruleText.max(160) }).strict()).max(2),
  actions: z.array(z.object({ key: ruleKey, pathKey, actorKey: personKey, when: digitalLifeTriggerSchema, operation: digitalLifeOperationSchema, classification: z.literal("assumption"), confirmedForSimulation: z.literal(true), evidenceSummary: ruleText.max(160) }).strict()).max(18),
}).strict();
export type DigitalLifeRules = z.infer<typeof digitalLifeRulesSchema>;

export const digitalLifeAgentInputSchema = z.object({
  id: z.string().uuid(), displayName: digitalLifeSafeText.max(200), actorType: z.enum(["self", "third_party", "organization"]),
  sourceRole: sourceRole.optional(), evidenceRefs: z.array(z.string().trim().min(1).max(500)).min(1),
}).strict();
export const digitalLifeEdgeInputSchema = z.object({
  id: z.string().uuid(), fromAgentId: z.string().uuid(), toAgentId: z.string().uuid(), relationshipType: digitalLifeSafeText.max(100),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).min(1),
}).strict();
export const digitalLifeProfileSnapshotSchema = z.object({
  ownerId: z.string().uuid(), seedContextId: z.string().uuid(), profileId: z.string().uuid().nullable(), revision: z.number().int().nonnegative(), profile: realityProfileDraftSchema,
}).strict();
const sourceSchema = z.object({
  ownerId: z.string().uuid(), seedContextId: z.string().uuid(), graphSnapshotId: z.string().uuid(), agentSnapshotId: z.string().uuid(),
  horizonDays: z.union([z.literal(30), z.literal(90)]), realityProfileSnapshot: digitalLifeProfileSnapshotSchema,
  agents: z.array(digitalLifeAgentInputSchema).min(1).max(50), edges: z.array(digitalLifeEdgeInputSchema).min(1).max(200),
}).passthrough();

const backgroundItemSchema = realityProfileFieldSchema.safeExtend({ sourceKey: z.string().min(1).max(100), dimension: z.string().min(1).max(100), label: digitalLifeSafeText, usage: z.literal("background_only") });
export const digitalLifeModelSchema = z.object({
  version: z.literal("digital-life-model-v1"),
  ownerId: z.string().uuid(), seedContextId: z.string().uuid(), graphSnapshotId: z.string().uuid(), agentSnapshotId: z.string().uuid(), profileRevision: z.number().int().nonnegative(),
  background: z.array(backgroundItemSchema).min(14).max(91),
  agents: z.array(z.object({ key: personKey, sourceAgentId: z.string().uuid(), label: digitalLifeSafeText, role: sourceRole, evidenceSummary: digitalLifeSafeText, strategyStatus: z.enum(["explicit", "not_defined", "not_applicable"]) }).strict()).min(1).max(50),
  relationships: z.array(z.object({ key: z.string().regex(/^relation-[1-9]\d*$/), sourceEdgeId: z.string().uuid(), fromPersonKey: personKey, toPersonKey: personKey, label: digitalLifeSafeText, evidenceSummary: digitalLifeSafeText }).strict()).min(1).max(200),
  rules: digitalLifeRulesSchema,
  limitations: z.array(digitalLifeSafeText).min(1).max(8),
}).strict();
export type DigitalLifeModel = z.infer<typeof digitalLifeModelSchema>;
export const ordinalPerson = (index: number) => `person-${index + 1}`;
export function roleForAgent(agent: z.infer<typeof digitalLifeAgentInputSchema>) {
  return agent.sourceRole ?? (agent.actorType === "self" ? "user_core" : agent.actorType === "organization" ? "group" : "npc");
}

/** Structured rules are explicit simulation assumptions; free text is never parsed into behavior. */
export function buildDigitalLifeModel(rawSource: unknown, rawRules?: unknown): { ok: true; model: DigitalLifeModel } | { ok: false; errorCode: "invalid_digital_life_rules" } {
  const fail = () => ({ ok: false as const, errorCode: "invalid_digital_life_rules" as const });
  const parsed = sourceSchema.safeParse(rawSource);
  if (!parsed.success) return fail();
  const source = parsed.data;
  const profile = source.realityProfileSnapshot;
  if (profile.ownerId !== source.ownerId || profile.seedContextId !== source.seedContextId || profile.revision !== profile.profile.revision) return fail();
  const profileEntries = listRealityProfileEntries(profile.profile);
  if (profile.profileId === null && (profile.revision !== 0 || profileEntries.some(item => item.field.classification !== "unknown") || profile.profile.worldInputs.resources.length > 0 || profile.profile.worldInputs.constraints.length > 0)) return fail();
  const roles = source.agents.map(roleForAgent);
  if (roles.filter(role => role === "user_core").length !== 1 || roles.filter(role => role === "user_variant").length > 2) return fail();
  if (source.agents.some((agent, index) => agent.actorType !== (roles[index] === "user_core" || roles[index] === "user_variant" ? "self" : roles[index] === "group" ? "organization" : "third_party"))) return fail();
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (!unique(source.agents.map(agent => agent.id)) || !unique(source.edges.map(edge => edge.id))) return fail();
  const personById = new Map(source.agents.map((agent, index) => [agent.id, ordinalPerson(index)]));
  if (source.edges.some(edge => !personById.has(edge.fromAgentId) || !personById.has(edge.toAgentId) || edge.fromAgentId === edge.toAgentId)) return fail();
  const rulesResult = digitalLifeRulesSchema.safeParse(rawRules ?? { version: "digital-life-rules-v1", graphSnapshotId: source.graphSnapshotId, agentSnapshotId: source.agentSnapshotId, profileRevision: profile.revision, strategies: [], actions: [] });
  if (!rulesResult.success) return fail();
  const rules = rulesResult.data;
  if (rules.graphSnapshotId !== source.graphSnapshotId || rules.agentSnapshotId !== source.agentSnapshotId || rules.profileRevision !== profile.revision) return fail();
  if (!unique(rules.strategies.map(strategy => strategy.participantKey)) || !unique(rules.actions.map(action => action.key))) return fail();
  const roleByPerson = new Map(roles.map((role, index) => [ordinalPerson(index), role]));
  const coreKey = ordinalPerson(roles.indexOf("user_core"));
  const strategyKeys = new Set(rules.strategies.map(strategy => strategy.participantKey));
  if (rules.strategies.some(strategy => roleByPerson.get(strategy.participantKey) !== "user_variant" || !rules.actions.some(action => action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey))) return fail();
  const seen = new Map<string, DigitalLifeRules["actions"][number]>();
  for (const action of rules.actions) {
    const role = roleByPerson.get(action.actorKey);
    const activeSelf = action.pathKey === "main" ? coreKey : action.pathKey;
    if (!role || (action.pathKey !== "main" && !strategyKeys.has(action.pathKey))) return fail();
    if ((role === "user_core" || role === "user_variant") && action.actorKey !== activeSelf) return fail();
    if (rules.actions.filter(item => item.pathKey === action.pathKey).length > (source.horizonDays === 30 ? 3 : 6)) return fail();
    if (action.when.kind === "at_tick" && action.when.tickIndex >= (source.horizonDays === 30 ? 3 : 6)) return fail();
    const previous = action.when.kind === "after_rule" ? seen.get(action.when.ruleKey) : undefined;
    if (action.when.kind === "after_rule" && (!previous || previous.pathKey !== action.pathKey)) return fail();
    if (role === "npc" || role === "group") {
      if (action.operation.actionType !== "update_relation_signal" || previous?.operation.actionType !== "request_information" || previous.operation.targetPersonKey !== action.actorKey) return fail();
    }
    if (action.operation.actionType === "request_information") {
      const targetRole = roleByPerson.get(action.operation.targetPersonKey);
      if ((targetRole !== "npc" && targetRole !== "group") || !source.edges.some(edge => [personById.get(edge.fromAgentId), personById.get(edge.toAgentId)].includes(coreKey) && [personById.get(edge.fromAgentId), personById.get(edge.toAgentId)].includes(action.operation.actionType === "request_information" ? action.operation.targetPersonKey : ""))) return fail();
    } else if (action.operation.actionType === "update_commitment") {
      const sourceKey = action.operation.profileEntryKey;
      if (sourceKey && !profileEntries.some(entry => entry.key === sourceKey && entry.field.classification !== "unknown")) return fail();
    } else if (action.operation.actionType === "update_relation_signal") {
      const relation = source.edges[Number(action.operation.relationKey.slice("relation-".length)) - 1];
      if (!relation || ![personById.get(relation.fromAgentId), personById.get(relation.toAgentId)].includes(action.actorKey) || ![personById.get(relation.fromAgentId), personById.get(relation.toAgentId)].includes(coreKey) || (role !== "npc" && role !== "group")) return fail();
    } else {
      const declared = profile.profile.worldInputs.resources[Number(action.operation.resourceKey.slice("resource-".length)) - 1];
      if (!declared || action.operation.amount > declared.available - declared.minimum || action.actorKey !== activeSelf) return fail();
    }
    seen.set(action.key, action);
  }
  const model = digitalLifeModelSchema.safeParse({
    version: "digital-life-model-v1", ownerId: source.ownerId, seedContextId: source.seedContextId, graphSnapshotId: source.graphSnapshotId, agentSnapshotId: source.agentSnapshotId, profileRevision: profile.revision,
    background: profileEntries.map(({ key, label, field }) => ({ sourceKey: key, dimension: key.startsWith("lifeModelDomains.") ? key.split(".").slice(0, 2).join(".") : key.split(".")[0], label, ...field, usage: "background_only" })),
    agents: source.agents.map((agent, index) => ({ key: ordinalPerson(index), sourceAgentId: agent.id, label: agent.displayName, role: roles[index], evidenceSummary: "来自本次冻结的账户人物快照；不推断私密意图", strategyStatus: roles[index] === "user_variant" ? strategyKeys.has(ordinalPerson(index)) ? "explicit" : "not_defined" : "not_applicable" })),
    relationships: source.edges.map((edge, index) => ({ key: `relation-${index + 1}`, sourceEdgeId: edge.id, fromPersonKey: personById.get(edge.fromAgentId), toPersonKey: personById.get(edge.toAgentId), label: edge.relationshipType, evidenceSummary: "来自本次锁定关系图的账户关系记录" })),
    rules,
    limitations: ["背景记录不代表已建立因果规则", "第三方回应仅为本人确认的条件模拟假设", "平行策略分别运行，资源与模拟频次不会合并", "人生气候与象征解释不直接决定行动或结果"],
  });
  return model.success ? { ok: true, model: structuredClone(model.data) } : fail();
}
