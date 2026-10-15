import { expect, it } from "vitest";
import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "@/lib/formal-sandbox/runtime";
import { emptyEditorDraft } from "./digital-life-rules-editor";
import { addDraftAction, confirmedDraftRules, normalizeDraftForSave, removeDraftSelection, setDraftActionConfirmation, setDraftStrategyConfirmation, type DraftSource, type RevisionDraft } from "./model-rule-draft-operations";

it("saved added allocation becomes a controlled typed Event only after confirmation; cascaded deletion removes it and old bundle JSON stays frozen", async () => {
  const input = digitalLifeInput();
  input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
  const rules = digitalLifeRules() as RevisionDraft;
  const model = buildDigitalLifeModel(input, rules);
  expect(model.ok).toBe(true); if (!model.ok) return;
  const source: DraftSource = { horizonDays: 30, modelContext: { graphSnapshotId: input.graphSnapshotId, agentSnapshotId: input.agentSnapshotId, profileRevision: 2, agents: model.model.agents.map(({ key, label, role }) => ({ key, label, role })), relationships: model.model.relationships.map(({ key, label, fromPersonKey, toPersonKey }) => ({ key, label, fromPersonKey, toPersonKey })), resources: input.realityProfileSnapshot.profile.worldInputs.resources.map((resource, index) => ({ ...resource, key: `resource-${index + 1}` })) } };
  const original = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: rules });
  expect(original.ok).toBe(true); if (!original.ok) return;
  const frozen = JSON.stringify(original.bundle);
  const added = addDraftAction(source, rules, { ...emptyEditorDraft, actorKey: "person-1", operation: "allocate_resource", when: "after_rule", previousKey: "rule-2", resourceKey: "resource-1", amount: "2", evidenceSummary: "本人确认的回应后资源假设" });
  expect(added.ok).toBe(true); if (!added.ok) return;
  const saved = normalizeDraftForSave(source, added.draft);
  expect(saved).not.toBeNull(); if (!saved) return;
  expect(confirmedDraftRules(source, saved)).toBeNull();
  let confirmed: RevisionDraft = JSON.parse(JSON.stringify(saved));
  for (const action of saved.actions) { const result = setDraftActionConfirmation(source, confirmed, action.key, true); expect(result.ok).toBe(true); if (!result.ok) return; confirmed = result.draft; }
  for (const strategy of saved.strategies) { const result = setDraftStrategyConfirmation(source, confirmed, strategy.participantKey, true); expect(result.ok).toBe(true); if (!result.ok) return; confirmed = result.draft; }
  const authorized = confirmedDraftRules(source, confirmed);
  expect(authorized).not.toBeNull();
  const revised = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: authorized! });
  expect(revised.ok).toBe(true); if (!revised.ok) return;
  const allocations = revised.bundle.events.filter(event => event.eventType === "allocate_resource");
  expect(allocations.length).toBeGreaterThan(0);
  expect(allocations.some(event => event.deltas.some(delta => delta.valueType === "resource" && Number(delta.before) - Number(delta.after) === 2))).toBe(true);
  expect(allocations.every(event => event.priorWorldEventIds.length > 0 && event.causalAssumptionIds.length > 0)).toBe(true);
  const removal = removeDraftSelection(source, confirmed, { kind: "action", key: "rule-2" }, true);
  expect(removal.ok).toBe(true); if (!removal.ok) return;
  expect(removal.draft.actions.map(action => action.key)).toEqual(["rule-1", "rule-3"]);
  const removed = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: confirmedDraftRules(source, removal.draft)! });
  expect(removed.ok).toBe(true); if (!removed.ok) return;
  expect(removed.bundle.events.some(event => event.eventType === "allocate_resource" || event.eventType === "update_relation_signal")).toBe(false);
  expect(JSON.stringify(original.bundle)).toBe(frozen);
}, 60_000);
