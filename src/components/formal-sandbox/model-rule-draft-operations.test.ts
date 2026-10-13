import { describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { emptyEditorDraft } from "./digital-life-rules-editor";
import { addDraftAction, addDraftStrategy, confirmedDraftRules, normalizeDraftForSave, previewDraftRemoval, removeDraftSelection, setDraftActionConfirmation, updateDraftAction, updateDraftStrategy, validateRevisionDraft, type DraftOperationResult, type DraftSource, type RevisionDraft } from "./model-rule-draft-operations";

function fixture(): { source: DraftSource; draft: RevisionDraft } {
  const input = digitalLifeInput();
  const resource = input.realityProfileSnapshot.profile.worldInputs.resources[0];
  return { source: { horizonDays: 30, modelContext: { graphSnapshotId: input.graphSnapshotId, agentSnapshotId: input.agentSnapshotId, profileRevision: 2, agents: [{ key: "person-1", label: "本人", role: "user_core" }, { key: "person-2", label: "协作对象", role: "npc" }, { key: "person-3", label: "平行自我", role: "user_variant" }, { key: "person-4", label: "另一对象", role: "npc" }, { key: "person-5", label: "第二策略", role: "user_variant" }], relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }, { key: "relation-2", label: "另一关系", fromPersonKey: "person-1", toPersonKey: "person-4" }], resources: [{ ...resource, key: "resource-1" }] } }, draft: digitalLifeRules() as RevisionDraft };
}
function changed(result: DraftOperationResult) { expect(result.ok).toBe(true); if (!result.ok) throw new Error(result.message); return result; }
const commitment = (key: string, prior: string): RevisionDraft["actions"][number] => ({ key, pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: prior }, operation: { actionType: "update_commitment", commitmentKey: "commitment-8", label: "确认下一步安排", status: "planned" }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "本人确认的后续安排" });

describe("current model typed draft operations", () => {
  it("adds an unconfirmed typed resource action without reusing a removed stable key", () => {
    const { source, draft } = fixture(); draft.actions = []; draft.strategies = [];
    const result = changed(addDraftAction(source, draft, { ...emptyEditorDraft, actorKey: "person-1", operation: "allocate_resource", resourceKey: "resource-1", amount: "2", evidenceSummary: "本人明确设定的资源假设" }, ["rule-8"]));
    expect(result.draft.actions[0]).toMatchObject({ key: "rule-9", confirmedForSimulation: false, operation: { actionType: "allocate_resource", amount: 2 } });
    expect(result.resetPermissions).toBe(true); expect(draft.actions).toEqual([]);
  });
  it("revokes the changed action, all transitive dependents and affected strategy confirmation", () => {
    const { source, draft } = fixture(); draft.actions.push(commitment("rule-4", "rule-2"));
    const result = changed(updateDraftAction(source, draft, "rule-1", { evidenceSummary: "本人补充的行动依据" }));
    expect(result.draft.actions.filter(action => action.pathKey === "main").every(action => !action.confirmedForSimulation)).toBe(true);
    expect(result.draft.actions.find(action => action.key === "rule-3")?.confirmedForSimulation).toBe(true);
    const variant = changed(updateDraftAction(source, draft, "rule-3", { evidenceSummary: "策略补充依据" }));
    expect(variant.draft.strategies[0].confirmedForSimulation).toBe(false);
  });
  it("keeps the original NPC actor and edge invalid when a request target changes until explicitly reconfigured", () => {
    const { source, draft } = fixture();
    const result = changed(updateDraftAction(source, draft, "rule-1", { operation: { actionType: "request_information", targetPersonKey: "person-4", question: "确认共同时间" } }));
    expect(result.draft.actions[1]).toMatchObject({ actorKey: "person-2", confirmedForSimulation: false, operation: { relationKey: "relation-1" } });
    expect(result.invalidActionKeys).toContain("rule-2"); expect(normalizeDraftForSave(source, result.draft)).toBeNull();
    const repaired = changed(updateDraftAction(source, result.draft, "rule-2", { actorKey: "person-4", operation: { actionType: "update_relation_signal", relationKey: "relation-2", signal: "neutral" } }));
    expect(validateRevisionDraft(source, repaired.draft).ok).toBe(true);
  });
  it("previews unordered transitive deletion and requires explicit confirmation before removing it", () => {
    const { source, draft } = fixture(); draft.actions = [commitment("rule-4", "rule-2"), ...draft.actions];
    expect(previewDraftRemoval(draft, { kind: "action", key: "rule-1" }).actionKeys).toEqual(["rule-4", "rule-1", "rule-2"]);
    expect(removeDraftSelection(source, draft, { kind: "action", key: "rule-1" }, false).ok).toBe(false);
    expect(changed(removeDraftSelection(source, draft, { kind: "action", key: "rule-1" }, true)).draft.actions.map(action => action.key)).toEqual(["rule-3"]);
  });
  it("deletes a strategy and every rule of that independent path while retaining main rules", () => {
    const { source, draft } = fixture();
    expect(previewDraftRemoval(draft, { kind: "strategy", participantKey: "person-3" })).toEqual({ actionKeys: ["rule-3"], strategyKeys: ["person-3"] });
    const result = changed(removeDraftSelection(source, draft, { kind: "strategy", participantKey: "person-3" }, true));
    expect(result.draft.strategies).toEqual([]); expect(result.draft.actions.map(action => action.key)).toEqual(["rule-1", "rule-2"]);
  });
  it("rejects cyclic and cross-path dependencies without mutating the existing draft", () => {
    const { source, draft } = fixture(); const before = JSON.stringify(draft);
    expect(updateDraftAction(source, draft, "rule-1", { when: { kind: "after_rule", ruleKey: "rule-2" } }).ok).toBe(false);
    expect(updateDraftAction(source, draft, "rule-1", { when: { kind: "after_rule", ruleKey: "rule-3" } }).ok).toBe(false);
    expect(JSON.stringify(draft)).toBe(before);
  });
  it("stably sorts a legal prerequisite edit without renaming rule keys", () => {
    const { source, draft } = fixture(); draft.actions = [commitment("rule-4", "rule-1"), ...draft.actions];
    const result = changed(updateDraftAction(source, draft, "rule-4", { when: { kind: "after_rule", ruleKey: "rule-2" } }));
    expect(result.draft.actions.map(action => action.key)).toEqual(["rule-1", "rule-2", "rule-4", "rule-3"]);
  });
  it("validates source identities, horizon, resource bounds, paths and safe text before Save or Run", () => {
    const { source, draft } = fixture();
    for (const mutate of [(value: RevisionDraft) => { value.profileRevision++; }, (value: RevisionDraft) => { value.actions[0].when = { kind: "at_tick", tickIndex: 3 }; }, (value: RevisionDraft) => { value.actions[0].operation = { actionType: "allocate_resource", resourceKey: "resource-1", amount: 8 }; }, (value: RevisionDraft) => { value.actions[0].evidenceSummary = "https://example.com"; }, (value: RevisionDraft) => { value.actions[0].pathKey = "person-4"; }]) {
      const invalid = structuredClone(draft); mutate(invalid); expect(validateRevisionDraft(source, invalid).ok).toBe(false); expect(confirmedDraftRules(source, invalid)).toBeNull();
    }
    expect(validateRevisionDraft(source, draft).ok).toBe(true);
  });
  it("adds only existing variant strategies, resets their path on edits and supports two independent paths", () => {
    const { source, draft } = fixture();
    const added = changed(addDraftStrategy(source, draft, { participantKey: "person-5", label: "先确认第二安排", evidenceSummary: "本人设定的另一策略" }));
    expect(added.draft.strategies[1].confirmedForSimulation).toBe(false);
    expect(addDraftStrategy(source, added.draft, { participantKey: "person-4", label: "错误人物", evidenceSummary: "本人设定" }).ok).toBe(false);
    const edited = changed(updateDraftStrategy(source, draft, "person-3", { label: "新的策略名称" }));
    expect(edited.draft.actions[2].confirmedForSimulation).toBe(false); expect(edited.draft.actions[0].confirmedForSimulation).toBe(true);
  });
  it("requires all explicit confirmations for Run while normalized Save revokes every permission", () => {
    const { source, draft } = fixture();
    expect(confirmedDraftRules(source, draft)).not.toBeNull();
    const saved = normalizeDraftForSave(source, draft); expect(saved).not.toBeNull();
    expect(saved?.actions.every(action => !action.confirmedForSimulation)).toBe(true); expect(saved?.strategies.every(strategy => !strategy.confirmedForSimulation)).toBe(true);
    const confirmed = changed(setDraftActionConfirmation(source, saved!, "rule-1", true));
    expect(confirmed.resetPermissions).toBe(false); expect(confirmedDraftRules(source, confirmed.draft)).toBeNull();
  });
});
