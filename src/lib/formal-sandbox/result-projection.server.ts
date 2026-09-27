import { z } from "zod";

import { listRealityProfileEntries, realityProfileDraftSchema } from "@/lib/reality-profile/profile";

const ordinal = (prefix: string, index: number) => `${prefix}-${index + 1}`;
const unsafeVisibleText = /[\u0000-\u001f\u007f-\u009f]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:raw\s+scenario|trace(?:[_ -]?id)?|internal(?:[_ -]?key|\s+evidence\s+ref)?|token|secret|password|api[_ -]?key|private\s+key|bearer)\b/i;
const safeText = z.string().trim().min(1).max(2_000).refine((value) => !unsafeVisibleText.test(value));
const reference = z.string().min(1);
const realityProfileSnapshotSchema = z.object({
  ownerId: z.string().uuid(),
  seedContextId: z.string().uuid(),
  profileId: z.string().uuid().nullable(),
  revision: z.number().int().nonnegative(),
  profile: realityProfileDraftSchema,
}).strict();
const structuredResourceSchema = z.object({
  key: z.string().regex(/^resource-[1-9]\d*$/),
  label: safeText,
  resourceType: z.enum(["time", "budget", "position_availability", "information"]),
  available: z.number().finite().min(0),
  unit: safeText,
  minimum: z.number().finite().min(0),
  maximum: z.number().finite().min(0),
  usePerTick: z.number().finite().positive().nullable(),
  classification: z.enum(["fact", "assumption"]),
  evidenceSummary: safeText,
}).strict();
const profileFactSchema = z.object({ key: z.string().regex(/^fact-[1-9]\d*$/), label: safeText, statement: safeText, evidenceSummary: safeText }).strict();
const profileAssumptionSchema = z.object({ key: z.string().regex(/^assumption-[1-9]\d*$/), label: safeText, statement: safeText, evidenceSummary: safeText }).strict();
const profileUnknownSchema = z.object({ key: z.string().regex(/^unknown-[1-9]\d*$/), label: safeText }).strict();
const agentSchema = z.object({ id: reference, displayName: safeText, actorType: z.enum(["self", "third_party"]), evidenceRefs: z.array(z.string()).min(1) }).passthrough();
const relationSchema = z.object({ id: reference, fromAgentId: reference, toAgentId: reference, relationshipType: safeText, evidenceRefs: z.array(z.string()).min(1) }).passthrough();
const eventSchema = z.object({ id: reference, eventType: safeText, actorId: reference.optional(), targetEntityIds: z.array(reference).optional(), targetRelationIds: z.array(reference).optional(), causalRealEvidenceIds: z.array(reference).optional(), priorWorldEventIds: z.array(reference).optional() }).passthrough();
const claimSchema = z.object({ id: reference, statement: safeText, uncertaintyStatement: safeText, simulationEventIds: z.array(reference).min(1), realEvidenceIds: z.array(reference).optional() }).passthrough();
const worldSnapshotSchema = z.object({
  agentDefinitions: z.array(z.object({ id: reference, displayName: safeText }).passthrough()).max(50),
  entities: z.array(z.object({ id: reference, agentDefinitionId: reference.optional() }).passthrough()).max(200),
  relations: z.array(z.object({ id: reference, fromEntityId: reference, toEntityId: reference, provenance: z.object({ realEvidenceIds: z.array(reference).optional(), assumptionIds: z.array(reference).optional(), provisional: z.boolean().optional(), visible: z.literal(true).optional() }).passthrough().optional() }).passthrough()).max(500).optional(),
  resources: z.array(z.object({ id: reference, resourceType: z.enum(["time", "budget", "position_availability", "information"]), label: safeText, available: z.number().finite().min(0), unit: safeText, min: z.number().finite().min(0), max: z.number().finite().min(0) }).passthrough()).max(8).optional(),
  constraints: z.array(z.object({ id: reference, constraintType: z.literal("deadline"), target: z.object({ type: z.literal("resource"), id: reference }).strict(), rule: z.object({ kind: z.literal("before_time"), value: z.string().datetime({ offset: true }) }).strict() }).passthrough()).max(8).optional(),
}).passthrough();
const bundleSchema = z.object({
  inputSnapshot: z.object({ ownerId: z.string().uuid().optional(), seedContextId: z.string().uuid().optional(), realityProfileSnapshot: realityProfileSnapshotSchema.optional(), agents: z.array(agentSchema).min(1).max(50), edges: z.array(relationSchema).max(200) }).passthrough(),
  sourceBoundary: z.object({ evidenceLedger: z.object({ items: z.array(z.object({ id: reference, statement: z.string().trim().min(1).max(4_000) }).passthrough()).max(200) }).passthrough().optional(), assumptionLedger: z.object({ assumptions: z.array(z.object({ statement: z.string().trim().min(1).max(2_000) }).passthrough()).max(200) }).passthrough().optional() }).passthrough().optional(),
  worldSnapshots: z.array(worldSnapshotSchema).max(500).optional(),
  events: z.array(eventSchema).min(1).max(500),
  claims: z.array(claimSchema).min(1).max(100),
  report: z.object({ claimIds: z.array(reference).min(1).max(100) }).passthrough(),
}).passthrough();

export const safeResultProjectionSchema = z.object({
  participants: z.array(z.object({ key: z.string().regex(/^person-[1-9]\d*$/), label: safeText, role: z.enum(["scenario decision maker", "frozen participant"]) }).strict()),
  relationships: z.array(z.object({ key: z.string().regex(/^relation-[1-9]\d*$/), fromPersonKey: z.string().regex(/^person-[1-9]\d*$/), toPersonKey: z.string().regex(/^person-[1-9]\d*$/), label: safeText }).strict()),
  facts: z.array(z.object({ key: z.string().regex(/^fact-[1-9]\d*$/), statement: safeText, boundary: z.literal("user_provided_fact") }).strict()),
  assumptions: z.array(z.object({ key: z.string().regex(/^assumption-[1-9]\d*$/), statement: safeText, boundary: z.literal("system_assumption") }).strict()),
  realityProfile: z.object({
    status: z.enum(["frozen", "not_recorded"]),
    revision: z.number().int().nonnegative().nullable(),
    facts: z.array(profileFactSchema),
    assumptions: z.array(profileAssumptionSchema),
    unknowns: z.array(profileUnknownSchema),
    structuredResources: z.array(structuredResourceSchema).max(8),
    structuredConstraints: z.array(z.object({
      key: z.string().regex(/^constraint-[1-9]\d*$/),
      label: safeText,
      resourceLabel: safeText,
      rule: z.object({ kind: z.literal("before_time"), value: z.string().datetime({ offset: true }) }).strict(),
      classification: z.enum(["fact", "assumption"]),
      evidenceSummary: safeText,
    }).strict()).max(8),
  }).strict(),
  resourceChanges: z.array(z.object({
    key: z.string().regex(/^change-[1-9]\d*$/),
    pathKey: z.string().regex(/^path-[1-9]\d*$/),
    label: safeText,
    before: z.number().finite().min(0),
    after: z.number().finite().min(0),
    unit: safeText,
    minimum: z.number().finite().min(0),
    maximum: z.number().finite().min(0),
    boundary: z.literal("simulation_change"),
  }).strict()).max(500),
  steps: z.array(z.object({ key: z.string().regex(/^step-[1-9]\d*$/), order: z.number().int().positive(), label: safeText, kind: z.literal("sandbox_simulation"), boundary: z.literal("simulation_step"), participantKeys: z.array(z.string().regex(/^person-[1-9]\d*$/)), relationshipKeys: z.array(z.string().regex(/^relation-[1-9]\d*$/)) }).strict()),
  claims: z.array(z.object({ key: z.string().regex(/^claim-[1-9]\d*$/), statement: safeText, uncertainty: safeText, boundary: z.literal("conditional_claim"), stepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1), supportingStepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1), participantKeys: z.array(z.string().regex(/^person-[1-9]\d*$/)), relationshipKeys: z.array(z.string().regex(/^relation-[1-9]\d*$/)) }).strict()),
}).strict();

export type SafeResultProjection = z.infer<typeof safeResultProjectionSchema>;

const unique = (values: readonly string[]) => new Set(values).size === values.length;
const directed = (from: string, to: string) => `${from}>${to}`;
const undirected = (left: string, right: string) => [left, right].sort().join("<>");
const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalValue(item)]));
  return value;
};
const provenanceSignature = (value: Record<string, unknown> | undefined) => JSON.stringify(canonicalValue({
  ...(value ?? {}),
  realEvidenceIds: [...((value?.realEvidenceIds as string[] | undefined) ?? [])].sort(),
  assumptionIds: [...((value?.assumptionIds as string[] | undefined) ?? [])].sort(),
}));

export function projectFormalSandboxResult(rawBundle: unknown): SafeResultProjection | null {
  const parsed = bundleSchema.safeParse(rawBundle);
  if (!parsed.success) return null;
  const bundle = parsed.data;
  const profileSnapshot = bundle.inputSnapshot.realityProfileSnapshot;
  if (profileSnapshot) {
    if (bundle.inputSnapshot.ownerId !== profileSnapshot.ownerId || bundle.inputSnapshot.seedContextId !== profileSnapshot.seedContextId || profileSnapshot.revision !== profileSnapshot.profile.revision) return null;
    if (profileSnapshot.profileId === null && (profileSnapshot.revision !== 0 || listRealityProfileEntries(profileSnapshot.profile).some(({ field }) => field.classification !== "unknown"))) return null;
  }
  const realityProfile = profileSnapshot ? (() => {
    const entries = listRealityProfileEntries(profileSnapshot.profile);
    const worldInputs = profileSnapshot.profile.worldInputs;
    const resourceLabelByKey = new Map(worldInputs.resources.map((resource) => [resource.key, resource.label]));
    return {
      status: "frozen" as const,
      revision: profileSnapshot.revision,
      facts: entries.filter(({ field }) => field.classification === "fact").map(({ label, field }, index) => ({ key: ordinal("fact", index), label, statement: field.value, evidenceSummary: field.evidenceSummary })),
      assumptions: entries.filter(({ field }) => field.classification === "assumption").map(({ label, field }, index) => ({ key: ordinal("assumption", index), label, statement: field.value, evidenceSummary: field.evidenceSummary })),
      unknowns: entries.filter(({ field }) => field.classification === "unknown").map(({ label }, index) => ({ key: ordinal("unknown", index), label })),
      structuredResources: worldInputs.resources.map((resource, index) => ({
        key: ordinal("resource", index),
        label: resource.label,
        resourceType: resource.resourceType,
        available: resource.available,
        unit: resource.unit,
        minimum: resource.minimum,
        maximum: resource.maximum,
        usePerTick: resource.usePerTick,
        classification: resource.classification,
        evidenceSummary: resource.evidenceSummary,
      })),
      structuredConstraints: worldInputs.constraints.map((constraint, index) => ({
        key: ordinal("constraint", index),
        label: constraint.label,
        resourceLabel: resourceLabelByKey.get(constraint.resourceKey)!,
        rule: constraint.rule,
        classification: constraint.classification,
        evidenceSummary: constraint.evidenceSummary,
      })),
    };
  })() : { status: "not_recorded" as const, revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [] };

  const agentIds = bundle.inputSnapshot.agents.map((item) => item.id);
  const edgeIds = bundle.inputSnapshot.edges.map((item) => item.id);
  const frozenEndpoints = bundle.inputSnapshot.edges.map((edge) => directed(edge.fromAgentId, edge.toAgentId));
  const agentIdSet = new Set(agentIds);
  if (!unique(agentIds) || !unique(edgeIds) || !unique(frozenEndpoints) || bundle.inputSnapshot.agents.some((agent) => !unique(agent.evidenceRefs)) || bundle.inputSnapshot.edges.some((edge) => !unique(edge.evidenceRefs) || !agentIdSet.has(edge.fromAgentId) || !agentIdSet.has(edge.toAgentId) || edge.fromAgentId === edge.toAgentId)) return null;

  const evidenceItems = bundle.sourceBoundary?.evidenceLedger?.items ?? [];
  const frozenSeedSummary = typeof bundle.inputSnapshot.seedSummary === "string" ? bundle.inputSnapshot.seedSummary.trim() : "";
  const visibleEvidenceItems = evidenceItems.filter((item) => {
    const claimKey = typeof item.claimKey === "string" ? item.claimKey : "";
    return !claimKey.startsWith("reality.profile.")
      && (claimKey === "formal.seed.summary" || !frozenSeedSummary || item.statement !== frozenSeedSummary);
  });
  const visibleRunAssumptions = (bundle.sourceBoundary?.assumptionLedger?.assumptions ?? []).filter((item) => {
    const category = typeof item.category === "string" ? item.category : "";
    return !category.startsWith("reality_profile_");
  });
  const evidenceIds = evidenceItems.map((item) => item.id);
  if (!unique(evidenceIds)) return null;
  const evidenceIdSet = new Set(evidenceIds);

  const eventIds = bundle.events.map((event) => event.id);
  const claimIds = bundle.claims.map((claim) => claim.id);
  if (!unique(eventIds) || !unique(claimIds) || !unique(bundle.report.claimIds)) return null;
  const eventIdSet = new Set(eventIds);
  const claimIdSet = new Set(claimIds);
  if (bundle.report.claimIds.length !== claimIdSet.size || bundle.report.claimIds.some((id) => !claimIdSet.has(id)) || bundle.claims.some((claim) => !unique(claim.simulationEventIds) || !unique(claim.realEvidenceIds ?? []) || claim.simulationEventIds.some((id) => !eventIdSet.has(id)) || (claim.realEvidenceIds ?? []).some((id) => !evidenceIdSet.has(id)))) return null;

  const definitionDisplayById = new Map<string, string>();
  const entityDefinitionById = new Map<string, string | undefined>();
  const worldRelationEndpointsById = new Map<string, { fromEntityId: string; toEntityId: string; realEvidenceIds: string[]; provenanceSignature: string }>();
  const worldResourceShapeById = new Map<string, string>();
  const frozenWorldResources = profileSnapshot?.profile.worldInputs.resources ?? [];
  const frozenWorldConstraints = profileSnapshot?.profile.worldInputs.constraints ?? [];
  for (const snapshot of bundle.worldSnapshots ?? []) {
    const definitionIds = snapshot.agentDefinitions.map((item) => item.id);
    const entityIds = snapshot.entities.map((item) => item.id);
    const relations = snapshot.relations ?? [];
    const relationIds = relations.map((item) => item.id);
    const relationEndpoints = relations.map((item) => directed(item.fromEntityId, item.toEntityId));
    const resources = snapshot.resources ?? [];
    const resourceIds = resources.map((item) => item.id);
    const constraints = snapshot.constraints ?? [];
    const constraintIds = constraints.map((item) => item.id);
    if (!unique(definitionIds) || !unique(entityIds) || !unique(relationIds) || !unique(relationEndpoints) || !unique(resourceIds) || !unique(constraintIds)) return null;
    if (frozenWorldResources.length > 0) {
      if (resources.length !== frozenWorldResources.length || constraints.length !== frozenWorldConstraints.length) return null;
      for (let index = 0; index < frozenWorldResources.length; index += 1) {
        const frozen = frozenWorldResources[index]!;
        const modeled = resources[index]!;
        if (modeled.label !== frozen.label || modeled.resourceType !== frozen.resourceType || modeled.unit !== frozen.unit || modeled.min !== frozen.minimum || modeled.max !== frozen.maximum || modeled.available < modeled.min || modeled.available > modeled.max) return null;
        const signature = JSON.stringify([modeled.label, modeled.resourceType, modeled.unit, modeled.min, modeled.max]);
        const previous = worldResourceShapeById.get(modeled.id);
        if (previous && previous !== signature) return null;
        worldResourceShapeById.set(modeled.id, signature);
      }
      for (const frozen of frozenWorldConstraints) {
        const resourceIndex = frozenWorldResources.findIndex((resource) => resource.key === frozen.resourceKey);
        const modeledResource = resources[resourceIndex];
        const modeledConstraint = constraints.find((item) => item.target.id === modeledResource?.id && item.rule.value === frozen.rule.value);
        if (!modeledConstraint || modeledConstraint.rule.kind !== frozen.rule.kind) return null;
      }
    }
    const localDefinitionIds = new Set(definitionIds);
    const localEntityIds = new Set(entityIds);
    if (snapshot.entities.some((entity) => entity.agentDefinitionId !== undefined && !localDefinitionIds.has(entity.agentDefinitionId))) return null;
    if (relations.some((relation) => !localEntityIds.has(relation.fromEntityId) || !localEntityIds.has(relation.toEntityId) || relation.fromEntityId === relation.toEntityId)) return null;

    for (const definition of snapshot.agentDefinitions) {
      const previous = definitionDisplayById.get(definition.id);
      if (previous !== undefined && previous !== definition.displayName) return null;
      definitionDisplayById.set(definition.id, definition.displayName);
    }
    for (const entity of snapshot.entities) {
      if (entityDefinitionById.has(entity.id) && entityDefinitionById.get(entity.id) !== entity.agentDefinitionId) return null;
      entityDefinitionById.set(entity.id, entity.agentDefinitionId);
    }
    for (const relation of relations) {
      const realEvidenceIds = relation.provenance?.realEvidenceIds ?? [];
      if (!unique(realEvidenceIds) || realEvidenceIds.some((id) => !evidenceIdSet.has(id))) return null;
      const normalizedProvenance = provenanceSignature(relation.provenance);
      const previous = worldRelationEndpointsById.get(relation.id);
      if (previous && (previous.fromEntityId !== relation.fromEntityId || previous.toEntityId !== relation.toEntityId || previous.provenanceSignature !== normalizedProvenance)) return null;
      worldRelationEndpointsById.set(relation.id, { fromEntityId: relation.fromEntityId, toEntityId: relation.toEntityId, realEvidenceIds, provenanceSignature: normalizedProvenance });
    }
  }

  const definitionIdSet = new Set(definitionDisplayById.keys());
  const entityIdSet = new Set(entityDefinitionById.keys());
  const worldRelationIdSet = new Set(worldRelationEndpointsById.keys());
  if (bundle.events.some((event) => (event.actorId !== undefined && !definitionIdSet.has(event.actorId)) || !unique(event.targetEntityIds ?? []) || (event.targetEntityIds ?? []).some((id) => !entityIdSet.has(id)) || !unique(event.targetRelationIds ?? []) || (event.targetRelationIds ?? []).some((id) => !worldRelationIdSet.has(id)) || !unique(event.causalRealEvidenceIds ?? []) || (event.causalRealEvidenceIds ?? []).some((id) => !evidenceIdSet.has(id)) || !unique(event.priorWorldEventIds ?? []) || (event.priorWorldEventIds ?? []).some((id) => !eventIdSet.has(id)))) return null;

  const participantKeys = bundle.inputSnapshot.agents.map((_, index) => ordinal("person", index));
  const personKeyById = new Map(bundle.inputSnapshot.agents.map((agent, index) => [agent.id, participantKeys[index]!]));
  const relationshipKeys = bundle.inputSnapshot.edges.map((_, index) => ordinal("relation", index));
  const peopleByDisplayName = new Map<string, string[]>();
  bundle.inputSnapshot.agents.forEach((agent) => peopleByDisplayName.set(agent.displayName, [...(peopleByDisplayName.get(agent.displayName) ?? []), personKeyById.get(agent.id)!]));

  const personKeyByDefinitionId = new Map<string, string>();
  for (const [definitionId, displayName] of definitionDisplayById) {
    const matches = peopleByDisplayName.get(displayName) ?? [];
    if (matches.length === 1) personKeyByDefinitionId.set(definitionId, matches[0]!);
  }
  const personKeyByEntityId = new Map<string, string>();
  for (const [entityId, definitionId] of entityDefinitionById) {
    const personKey = definitionId === undefined ? undefined : personKeyByDefinitionId.get(definitionId);
    if (personKey) personKeyByEntityId.set(entityId, personKey);
  }

  const relationshipKeyByEndpoints = new Map(bundle.inputSnapshot.edges.map((edge, index) => [directed(personKeyById.get(edge.fromAgentId)!, personKeyById.get(edge.toAgentId)!), relationshipKeys[index]!]));
  const relationshipKeysByUndirectedEndpoints = new Map<string, string[]>();
  bundle.inputSnapshot.edges.forEach((edge, index) => {
    const key = undirected(personKeyById.get(edge.fromAgentId)!, personKeyById.get(edge.toAgentId)!);
    relationshipKeysByUndirectedEndpoints.set(key, [...(relationshipKeysByUndirectedEndpoints.get(key) ?? []), relationshipKeys[index]!]);
  });
  const mappedWorldRelations = new Map<string, { fromPersonKey: string; toPersonKey: string; relationshipKey: string | undefined; realEvidenceIds: string[] }>();
  for (const [relationId, relation] of worldRelationEndpointsById) {
    const fromPersonKey = personKeyByEntityId.get(relation.fromEntityId);
    const toPersonKey = personKeyByEntityId.get(relation.toEntityId);
    if (!fromPersonKey || !toPersonKey) continue;
    const relationshipKey = relationshipKeyByEndpoints.get(directed(fromPersonKey, toPersonKey)) ?? relationshipKeyByEndpoints.get(directed(toPersonKey, fromPersonKey));
    mappedWorldRelations.set(relationId, { fromPersonKey, toPersonKey, relationshipKey, realEvidenceIds: relation.realEvidenceIds });
  }

  const relationshipEvidenceLinks = new Map<string, { relationshipKey: string; participantKeys: string[] }[]>();
  for (const relation of mappedWorldRelations.values()) {
    if (!relation.relationshipKey) continue;
    for (const evidenceId of relation.realEvidenceIds) relationshipEvidenceLinks.set(evidenceId, [...(relationshipEvidenceLinks.get(evidenceId) ?? []), { relationshipKey: relation.relationshipKey, participantKeys: [relation.fromPersonKey, relation.toPersonKey] }]);
  }

  const eventKeyById = new Map(bundle.events.map((event, index) => [event.id, ordinal("step", index)]));
  const eventLinks = new Map(bundle.events.map((event) => {
    const eventParticipantKeys = [...new Set([event.actorId ? personKeyByDefinitionId.get(event.actorId) : undefined, ...(event.targetEntityIds ?? []).map((id) => personKeyByEntityId.get(id))].filter((key): key is string => Boolean(key)))];
    const targetedRelations = (event.targetRelationIds ?? []).map((id) => mappedWorldRelations.get(id)?.relationshipKey).filter((key): key is string => Boolean(key));
    const eventParticipantSet = new Set(eventParticipantKeys);
    const inferredRelations = (event.targetRelationIds?.length ?? 0) > 0 ? [] : bundle.inputSnapshot.edges.flatMap((edge, index) => {
      const from = personKeyById.get(edge.fromAgentId)!;
      const to = personKeyById.get(edge.toAgentId)!;
      const candidates = relationshipKeysByUndirectedEndpoints.get(undirected(from, to)) ?? [];
      return eventParticipantSet.has(from) && eventParticipantSet.has(to) && candidates.length === 1 ? [relationshipKeys[index]!] : [];
    });
    return [event.id, { participantKeys: eventParticipantKeys, relationshipKeys: [...new Set([...targetedRelations, ...inferredRelations])] }] as const;
  }));

  const resourceChanges = (bundle.worldSnapshots ?? []).flatMap((snapshot, pathIndex) =>
    frozenWorldResources.flatMap((frozen, resourceIndex) => {
      const resource = snapshot.resources?.[resourceIndex];
      if (!resource) return [];
      return [{
        key: ordinal("change", pathIndex * frozenWorldResources.length + resourceIndex),
        pathKey: ordinal("path", pathIndex),
        label: frozen.label,
        before: frozen.available,
        after: resource.available,
        unit: frozen.unit,
        minimum: frozen.minimum,
        maximum: frozen.maximum,
        boundary: "simulation_change" as const,
      }];
    }),
  );
  const projection = {
    participants: bundle.inputSnapshot.agents.map((agent, index) => ({ key: participantKeys[index]!, label: agent.displayName, role: agent.actorType === "self" ? "scenario decision maker" as const : "frozen participant" as const })),
    relationships: bundle.inputSnapshot.edges.map((edge, index) => ({ key: relationshipKeys[index]!, fromPersonKey: personKeyById.get(edge.fromAgentId)!, toPersonKey: personKeyById.get(edge.toAgentId)!, label: edge.relationshipType })),
    facts: visibleEvidenceItems.map((fact, index) => ({
      key: ordinal("fact", index),
      statement: fact.claimKey === "formal.seed.summary" ? "本次运行使用已提交的 Seed 作为 Reality evidence；情境原文未展示。" : fact.statement,
      boundary: "user_provided_fact" as const,
    })),
    assumptions: visibleRunAssumptions.map((assumption, index) => ({ key: ordinal("assumption", index), statement: assumption.statement, boundary: "system_assumption" as const })),
    realityProfile,
    resourceChanges,
    steps: bundle.events.map((event, index) => ({ key: eventKeyById.get(event.id)!, order: index + 1, label: event.eventType.replaceAll("_", " "), kind: "sandbox_simulation" as const, boundary: "simulation_step" as const, participantKeys: eventLinks.get(event.id)!.participantKeys, relationshipKeys: eventLinks.get(event.id)!.relationshipKeys })),
    claims: bundle.claims.map((claim, index) => {
      const stepKeys = claim.simulationEventIds.map((id) => eventKeyById.get(id)!);
      const links = claim.simulationEventIds.map((id) => eventLinks.get(id)!);
      const evidenceLinks = (claim.realEvidenceIds ?? []).flatMap((id) => relationshipEvidenceLinks.get(id) ?? []);
      return { key: ordinal("claim", index), statement: claim.statement, uncertainty: claim.uncertaintyStatement, boundary: "conditional_claim" as const, stepKeys, supportingStepKeys: stepKeys, participantKeys: [...new Set([...links.flatMap((item) => item.participantKeys), ...evidenceLinks.flatMap((item) => item.participantKeys)])], relationshipKeys: [...new Set([...links.flatMap((item) => item.relationshipKeys), ...evidenceLinks.map((item) => item.relationshipKey)])] };
    }),
  };
  return safeResultProjectionSchema.safeParse(projection).data ?? null;
}
