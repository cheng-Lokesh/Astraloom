import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DigitalLifeRulesEditor, buildEditorRules, emptyEditorDraft } from "./digital-life-rules-editor";

export const context = {
  graphSnapshotId: "00000000-0000-4000-8000-000000000001",
  agentSnapshotId: "00000000-0000-4000-8000-000000000002",
  profileRevision: 2,
  agents: [{ key: "person-4", label: "本人", role: "user_core" as const }, { key: "person-8", label: "合作伙伴", role: "npc" as const }, { key: "person-11", label: "另一种沟通策略", role: "user_variant" as const }],
  relationships: [{ key: "relation-7", label: "合作关系", fromPersonKey: "person-4", toPersonKey: "person-8" }],
  resources: [{ key: "resource-3", label: "时间", available: 8, minimum: 2, unit: "小时" }],
};

describe("digital life rules editor", () => {
  it("requires explicit confirmation and a safe source summary before creating a rule", () => {
    const draft = { ...emptyEditorDraft, actorKey: "person-4", targetKey: "person-8", text: "询问下一步安排", evidenceSummary: "本人拟定的沟通假设" };
    expect(buildEditorRules(context, 30, [], [], draft).ok).toBe(false);
    const result = buildEditorRules(context, 30, [], [], { ...draft, confirmed: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rules.actions[0]).toMatchObject({ actorKey: "person-4", operation: { targetPersonKey: "person-8" }, classification: "assumption", confirmedForSimulation: true });
  });
  it("rejects unavailable ordinals, out of range cycles and third party actions without a preceding information request", () => {
    const draft = { ...emptyEditorDraft, actorKey: "person-4", targetKey: "person-8", text: "询问下一步安排", evidenceSummary: "本人拟定的沟通假设", confirmed: true };
    expect(buildEditorRules(context, 30, [], [], { ...draft, tickIndex: 3 }).ok).toBe(false);
    expect(buildEditorRules(context, 90, [], [], { ...draft, tickIndex: 5 }).ok).toBe(true);
    expect(buildEditorRules(context, 30, [], [], { ...draft, actorKey: "person-1" }).ok).toBe(false);
    expect(buildEditorRules(context, 30, [], [], { ...draft, actorKey: "person-8", operation: "update_relation_signal", relationKey: "relation-7" }).ok).toBe(false);
  });
  it("keeps labelled standard controls, source guidance and correction links without displaying identifiers", () => {
    const html = renderToStaticMarkup(createElement(DigitalLifeRulesEditor, { context, horizonDays: 30, actions: [], strategies: [], onChange: () => undefined }));
    expect(html).toContain("行动类型");
    expect(html).toContain("触发条件");
    expect(html).toContain("我确认这是用于本次运行的模拟假设");
    expect(html).toContain("独立世界");
    expect(html).toContain('href="/app/reality-profile"');
    expect(html).not.toContain(context.graphSnapshotId);
    expect(html).not.toContain("textarea name=\"json\"");
  });
});
