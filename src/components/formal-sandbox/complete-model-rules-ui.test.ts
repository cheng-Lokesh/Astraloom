import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ModelRulesDraftEditor } from "./model-rule-revision";

const context = { graphSnapshotId: "30000000-0000-4000-8000-000000000001", agentSnapshotId: "40000000-0000-4000-8000-000000000001", profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" as const }, { key: "person-2", label: "协作对象", role: "npc" as const }, { key: "person-3", label: "谨慎分身", role: "user_variant" as const }],
  relationships: [{ key: "relation-1", label: "本人与协作对象的协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }], resources: [] };
const draftRules = { version: "digital-life-rules-v1" as const, graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: 2, actions: [], strategies: [] };

describe("complete current model rule editing", () => {
  it("offers action and strategy creation in an empty saved current model", () => {
    const html = renderToStaticMarkup(createElement(ModelRulesDraftEditor, { source: { modelContext: context, horizonDays: 30, draftRules }, currentModel: true, disabled: false, onChange: vi.fn() }));
    expect(html).toContain("添加行动规则");
    expect(html).toContain("添加平行分身策略");
    expect(html).toContain("尚未定义策略");
  });
});
