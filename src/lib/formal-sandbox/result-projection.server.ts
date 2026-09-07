import { z } from "zod";

const ordinal = (prefix: string, index: number) => `${prefix}-${index + 1}`;
const safeText = z.string().trim().min(1).max(2_000);
const agentSchema = z.object({ id: z.string().min(1), displayName: safeText, actorType: z.enum(["self", "third_party"]), evidenceRefs: z.array(z.string()).min(1) }).passthrough();
const relationSchema = z.object({ id: z.string().min(1), fromAgentId: z.string().min(1), toAgentId: z.string().min(1), relationshipType: safeText, evidenceRefs: z.array(z.string()).min(1) }).passthrough();
const eventSchema = z.object({ id: z.string().min(1), eventType: safeText, actorId: z.string().min(1).optional(), targetEntityIds: z.array(z.string().min(1)).optional(), targetRelationIds: z.array(z.string().min(1)).optional() }).passthrough();
const claimSchema = z.object({ id: z.string().min(1), statement: safeText, uncertaintyStatement: safeText, simulationEventIds: z.array(z.string().min(1)).min(1), realEvidenceIds: z.array(z.string().min(1)).optional() }).passthrough();
const worldSnapshotSchema = z.object({
  agentDefinitions: z.array(z.object({ id: z.string().min(1), displayName: safeText }).passthrough()).max(50),
  entities: z.array(z.object({ id: z.string().min(1), agentDefinitionId: z.string().min(1) }).passthrough()).max(200),
  relations: z.array(z.object({ id: z.string().min(1), fromEntityId: z.string().min(1), toEntityId: z.string().min(1), provenance: z.object({ realEvidenceIds: z.array(z.string().min(1)).optional() }).passthrough().optional() }).passthrough()).max(500).optional(),
}).passthrough();
const bundleSchema = z.object({ inputSnapshot: z.object({ agents: z.array(agentSchema).min(1).max(50), edges: z.array(relationSchema).max(200) }).passthrough(), sourceBoundary: z.object({ evidenceLedger: z.object({ items: z.array(z.object({ statement: safeText }).passthrough()).max(200) }).passthrough().optional(), assumptionLedger: z.object({ assumptions: z.array(z.object({ statement: safeText }).passthrough()).max(200) }).passthrough().optional() }).passthrough().optional(), worldSnapshots: z.array(worldSnapshotSchema).max(500).optional(), events: z.array(eventSchema).min(1).max(500), claims: z.array(claimSchema).min(1).max(100), report: z.object({ claimIds: z.array(z.string().min(1)).min(1).max(100) }).passthrough() }).passthrough();

export const safeResultProjectionSchema = z.object({
  participants: z.array(z.object({ key: z.string().regex(/^person-[1-9]\d*$/), label: safeText, role: z.enum(["scenario decision maker", "frozen participant"]) }).strict()),
  relationships: z.array(z.object({ key: z.string().regex(/^relation-[1-9]\d*$/), fromPersonKey: z.string().regex(/^person-[1-9]\d*$/), toPersonKey: z.string().regex(/^person-[1-9]\d*$/), label: safeText }).strict()),
  facts: z.array(z.object({ key: z.string().regex(/^fact-[1-9]\d*$/), statement: safeText, boundary: z.literal("user_provided_fact") }).strict()),
  assumptions: z.array(z.object({ key: z.string().regex(/^assumption-[1-9]\d*$/), statement: safeText, boundary: z.literal("system_assumption") }).strict()),
  steps: z.array(z.object({ key: z.string().regex(/^step-[1-9]\d*$/), order: z.number().int().positive(), label: safeText, kind: z.literal("sandbox_simulation"), boundary: z.literal("simulation_step"), participantKeys: z.array(z.string().regex(/^person-[1-9]\d*$/)), relationshipKeys: z.array(z.string().regex(/^relation-[1-9]\d*$/)) }).strict()),
  claims: z.array(z.object({ key: z.string().regex(/^claim-[1-9]\d*$/), statement: safeText, uncertainty: safeText, boundary: z.literal("conditional_claim"), stepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1), supportingStepKeys: z.array(z.string().regex(/^step-[1-9]\d*$/)).min(1), participantKeys: z.array(z.string().regex(/^person-[1-9]\d*$/)), relationshipKeys: z.array(z.string().regex(/^relation-[1-9]\d*$/)) }).strict()),
}).strict();

export type SafeResultProjection = z.infer<typeof safeResultProjectionSchema>;

export function projectFormalSandboxResult(rawBundle: unknown): SafeResultProjection | null {
  const parsed = bundleSchema.safeParse(rawBundle);
  if (!parsed.success) return null;
  const bundle = parsed.data;
  const agentIds = new Set(bundle.inputSnapshot.agents.map((item) => item.id));
  if (agentIds.size !== bundle.inputSnapshot.agents.length || bundle.inputSnapshot.edges.some((edge) => !agentIds.has(edge.fromAgentId) || !agentIds.has(edge.toAgentId) || edge.fromAgentId === edge.toAgentId)) return null;
  const eventKeyById = new Map(bundle.events.map((event, index) => [event.id, ordinal("step", index)]));
  const claimIds = new Set(bundle.claims.map((claim) => claim.id));
  if (eventKeyById.size !== bundle.events.length || claimIds.size !== bundle.claims.length || bundle.report.claimIds.length !== claimIds.size || bundle.report.claimIds.some((id) => !claimIds.has(id)) || bundle.claims.some((claim) => claim.simulationEventIds.some((id) => !eventKeyById.has(id)))) return null;
  const participantKeys = bundle.inputSnapshot.agents.map((_, index) => ordinal("person", index));
  const personKeyById = new Map(bundle.inputSnapshot.agents.map((agent, index) => [agent.id, participantKeys[index]! ]));
  const relationshipKeys = bundle.inputSnapshot.edges.map((_, index) => ordinal("relation", index));
  const peopleByDisplayName = new Map<string, string[]>();
  bundle.inputSnapshot.agents.forEach((agent) => peopleByDisplayName.set(agent.displayName, [...(peopleByDisplayName.get(agent.displayName) ?? []), personKeyById.get(agent.id)!]));
  const personKeyByDefinitionId = new Map<string, string>();
  for (const snapshot of bundle.worldSnapshots ?? []) for (const definition of snapshot.agentDefinitions) {
    const matches = peopleByDisplayName.get(definition.displayName) ?? [];
    if (matches.length === 1) personKeyByDefinitionId.set(definition.id, matches[0]!);
  }
  const personKeyByEntityId = new Map<string, string>();
  const worldRelationById = new Map<string, { fromPersonKey: string; toPersonKey: string }>();
  const worldRelations: { fromPersonKey: string; toPersonKey: string; realEvidenceIds: string[] }[] = [];
  for (const snapshot of bundle.worldSnapshots ?? []) {
    for (const entity of snapshot.entities) {
      const personKey = personKeyByDefinitionId.get(entity.agentDefinitionId);
      if (personKey) personKeyByEntityId.set(entity.id, personKey);
    }
    for (const relation of snapshot.relations ?? []) {
      const fromPersonKey = personKeyByEntityId.get(relation.fromEntityId);
      const toPersonKey = personKeyByEntityId.get(relation.toEntityId);
      if (fromPersonKey && toPersonKey) {
        worldRelationById.set(relation.id, { fromPersonKey, toPersonKey });
        worldRelations.push({ fromPersonKey, toPersonKey, realEvidenceIds: relation.provenance?.realEvidenceIds ?? [] });
      }
    }
  }
  const relationshipKeyByEndpoints = new Map(bundle.inputSnapshot.edges.map((edge, index) => [`${personKeyById.get(edge.fromAgentId)}>${personKeyById.get(edge.toAgentId)}`, relationshipKeys[index]!]));
  const relationshipEvidenceLinks = new Map<string, { relationshipKey: string; participantKeys: string[] }[]>();
  for (const relation of worldRelations) {
    const relationshipKey = relationshipKeyByEndpoints.get(`${relation.fromPersonKey}>${relation.toPersonKey}`) ?? relationshipKeyByEndpoints.get(`${relation.toPersonKey}>${relation.fromPersonKey}`);
    if (!relationshipKey) continue;
    for (const evidenceId of relation.realEvidenceIds) relationshipEvidenceLinks.set(evidenceId, [...(relationshipEvidenceLinks.get(evidenceId) ?? []), { relationshipKey, participantKeys: [relation.fromPersonKey, relation.toPersonKey] }]);
  }
  const eventLinks = new Map(bundle.events.map((event) => {
    const eventParticipantKeys = [...new Set([event.actorId, ...(event.targetEntityIds ?? [])].map((id) => id ? personKeyByEntityId.get(id) : undefined).filter((key): key is string => Boolean(key)))];
    const eventParticipantSet = new Set(eventParticipantKeys);
    const targetedRelations = (event.targetRelationIds ?? []).map((id) => worldRelationById.get(id)).filter((item): item is { fromPersonKey: string; toPersonKey: string } => Boolean(item)).map((item) => relationshipKeyByEndpoints.get(`${item.fromPersonKey}>${item.toPersonKey}`)).filter((key): key is string => Boolean(key));
    const endpointRelations = bundle.inputSnapshot.edges.map((edge, index) => ({ edge, key: relationshipKeys[index]! })).filter(({ edge }) => eventParticipantSet.has(personKeyById.get(edge.fromAgentId)!) && eventParticipantSet.has(personKeyById.get(edge.toAgentId)!)).map(({ key }) => key);
    return [event.id, { participantKeys: eventParticipantKeys, relationshipKeys: [...new Set([...targetedRelations, ...endpointRelations])] }] as const;
  }));
  const projection = {
    participants: bundle.inputSnapshot.agents.map((agent, index) => ({ key: participantKeys[index]!, label: agent.displayName, role: agent.actorType === "self" ? "scenario decision maker" as const : "frozen participant" as const })),
    relationships: bundle.inputSnapshot.edges.map((edge, index) => ({ key: relationshipKeys[index]!, fromPersonKey: personKeyById.get(edge.fromAgentId)!, toPersonKey: personKeyById.get(edge.toAgentId)!, label: edge.relationshipType })),
    facts: (bundle.sourceBoundary?.evidenceLedger?.items ?? []).map((fact, index) => ({ key: ordinal("fact", index), statement: fact.statement, boundary: "user_provided_fact" as const })),
    assumptions: (bundle.sourceBoundary?.assumptionLedger?.assumptions ?? []).map((assumption, index) => ({ key: ordinal("assumption", index), statement: assumption.statement, boundary: "system_assumption" as const })),
    steps: bundle.events.map((event, index) => ({ key: eventKeyById.get(event.id)!, order: index + 1, label: event.eventType.replaceAll("_", " "), kind: "sandbox_simulation" as const, boundary: "simulation_step" as const, participantKeys: eventLinks.get(event.id)!.participantKeys, relationshipKeys: eventLinks.get(event.id)!.relationshipKeys })),
    claims: bundle.claims.map((claim, index) => { const stepKeys = claim.simulationEventIds.map((id) => eventKeyById.get(id)!); const links = claim.simulationEventIds.map((id) => eventLinks.get(id)!); const evidenceLinks = (claim.realEvidenceIds ?? []).flatMap((id) => relationshipEvidenceLinks.get(id) ?? []); return { key: ordinal("claim", index), statement: claim.statement, uncertainty: claim.uncertaintyStatement, boundary: "conditional_claim" as const, stepKeys, supportingStepKeys: stepKeys, participantKeys: [...new Set([...links.flatMap((item) => item.participantKeys), ...evidenceLinks.flatMap((item) => item.participantKeys)])], relationshipKeys: [...new Set([...links.flatMap((item) => item.relationshipKeys), ...evidenceLinks.map((item) => item.relationshipKey)])] }; }),
  };
  return safeResultProjectionSchema.safeParse(projection).data ?? null;
}
