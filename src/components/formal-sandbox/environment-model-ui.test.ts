import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ModelRulesDraftEditor } from "./model-rule-revision";
import { emptyEditorDraft } from "./digital-life-rules-editor";
import { addDraftAction, normalizeDraftForSave, updateDraftAction, validateRevisionDraft, type DraftSource, type RevisionDraft } from "./model-rule-draft-operations";

const context = { graphSnapshotId: "30000000-0000-4000-8000-000000000001", agentSnapshotId: "40000000-0000-4000-8000-000000000001", profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" as const }, { key: "person-2", label: "协作对象", role: "npc" as const }, { key: "person-3", label: "谨慎分身", role: "user_variant" as const }], relationships: [], resources: [],
  variables: [{ key: "external-variable-1", category: "external_variable" as const, label: "招聘条件", value: "岗位开放", classification: "fact" as const, evidenceSummary: "本人记录" }] };
const source: DraftSource = { modelContext: context, horizonDays: 30 };
const empty: RevisionDraft = { version: "digital-life-rules-v1", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: 2, actions: [], strategies: [] };
const editor = { ...emptyEditorDraft, actorKey: "person-1", operation: "update_external_variable" as const, variableKey: "external-variable-1", text: "岗位暂缓", evidenceSummary: "比较环境变化的假设", confirmed: true };

describe("environment model UI", () => {
  it("adds a typed environment condition as v2, saves it unchecked, and rejects a second condition in the path", () => {
    const added = addDraftAction(source, empty, editor);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.draft.version).toBe("digital-life-rules-v2");
    expect(added.draft.actions[0].operation).toEqual({ actionType: "update_external_variable", variableKey: "external-variable-1", value: "岗位暂缓" });
    expect(normalizeDraftForSave(source, added.draft)?.actions[0].confirmedForSimulation).toBe(false);
    expect(addDraftAction(source, added.draft, editor).ok).toBe(false);
    const bad = updateDraftAction(source, added.draft, added.draft.actions[0].key, { operation: { actionType: "update_external_variable", variableKey: "external-variable-2", value: "岗位暂缓" } });
    expect(bad.ok && validateRevisionDraft(source, bad.draft).ok).toBe(false);
  });
  it("shows registered initial values, explicit assumption boundary and scheduling limitation, including in disabled stale review", () => {
    const draft: RevisionDraft = { ...empty, version: "digital-life-rules-v2", actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 2 }, operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "岗位暂缓" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "比较环境变化的假设" }] };
    const html = renderToStaticMarkup(createElement(ModelRulesDraftEditor, { source: { ...source, draftRules: draft }, currentModel: true, disabled: true, onChange: vi.fn() }));
    expect(html).toContain("环境条件假设");
    expect(html).toContain("岗位开放");
    expect(html).toContain("假设的新条件");
    expect(html).toContain("不代表控制现实");
    expect(html).toContain("可能未到达");
    expect(html).toContain("<fieldset disabled=");
  });
});
