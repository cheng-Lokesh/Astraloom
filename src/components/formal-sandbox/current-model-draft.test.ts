import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("ordinary scene"); }, useRouter: () => ({ push: vi.fn() }) }));
import StartPage from "@/app/app/start/page";
import { FormalRunStarter } from "./run-starter";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";
import { digitalLifeModelDraftSchema, type SaveDigitalLifeModelDraft } from "@/lib/digital-life/model-draft";
import { CurrentModelSummary } from "@/app/app/dashboard/current-model-summary";

function findStarter(element: unknown): ReactElement<{ currentDraftMode?: boolean }> | null {
  if (!element || typeof element !== "object" || !("props" in element)) return null;
  const node = element as ReactElement<{ children?: unknown; currentDraftMode?: boolean }>;
  if (node.type === FormalRunStarter) return node;
  const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
  for (const child of children) { const found = findStarter(child); if (found) return found; }
  return null;
}

describe("current saved model entry", () => {
  it("opens the current account draft without selecting a historical Run", async () => {
    const page = await StartPage({ searchParams: Promise.resolve({ model_draft: "current" }) });
    const starter = findStarter(page);
    expect(starter).not.toBeNull();
    expect(starter?.props.currentDraftMode).toBe(true);
  });
  it("keeps ordinary Start and refuses duplicate or mixed source selectors", async () => {
    await expect(StartPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("ordinary scene");
    for (const query of [ { model_draft: ["current", "current"] }, { model_draft: "other" }, { model_draft: "current", revise_run: "10000000-0000-4000-8000-000000000001" }, { model_draft: "current", graph_id: "10000000-0000-4000-8000-000000000001" } ]) {
      expect(findStarter(await StartPage({ searchParams: Promise.resolve(query) }))).toBeNull();
    }
  });
});

function savedFixture() {
  const graphSnapshotId = "30000000-0000-4000-8000-000000000001", agentSnapshotId = "40000000-0000-4000-8000-000000000001";
  const sourceContext = { signature: "a".repeat(64), modelContext: { graphSnapshotId, agentSnapshotId, profileRevision: 2, agents: [{ key: "person-1", label: "本人", role: "user_core" }], relationships: [], resources: [] } };
  return digitalLifeModelDraftSchema.parse({ version: "digital-life-model-draft-v1", status: "current", currentRevision: 2, horizonDays: 30, sourceContext, currentSourceContext: sourceContext, draftRules: { version: "digital-life-rules-v1", graphSnapshotId, agentSnapshotId, profileRevision: 2, actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "update_commitment", commitmentKey: "commitment-1", label: "保留学习时间", status: "planned" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人选择的行动假设" }], strategies: [] } });
}

describe("saved model transport and truthful summary", () => {
  it("reads the current account only and preserves exact save content/key for recovery without calling Run", async () => {
    const draft = savedFixture();
    const input: SaveDigitalLifeModelDraft = { version: "digital-life-model-draft-v1", expectedRevision: 2, idempotencyKey: "50000000-0000-4000-8000-000000000001", horizonDays: 30, sourceContext: draft.sourceContext!, draftRules: draft.draftRules! };
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, draft }))).mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error_code: "persistence_failed", trace_id: "safe" }), { status: 500 })).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, idempotent: true, draft: { ...draft, status: "stale", currentSourceContext: null } })));
    const client = createFormalSandboxClient(fetcher);
    expect((await client.modelDraft()).ok).toBe(true);
    expect(fetcher.mock.calls[0]).toEqual(["/api/sandbox/model-draft", { cache: "no-store" }]);
    expect((await client.saveModelDraft(input)).ok).toBe(false);
    expect((await client.saveModelDraft(input)).ok).toBe(true);
    expect(fetcher.mock.calls[1]).toEqual(fetcher.mock.calls[2]);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual(input);
    expect(fetcher.mock.calls.every(call => call[0] === "/api/sandbox/model-draft")).toBe(true);
  });
  it("refuses a malformed loaded draft that silently restores Run confirmation", async () => {
    const draft = savedFixture(); const malformed = { ...draft, draftRules: { ...draft.draftRules, actions: draft.draftRules!.actions.map(action => ({ ...action, confirmedForSimulation: true })) } };
    const client = createFormalSandboxClient(vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, draft: malformed }))));
    expect(await client.modelDraft()).toEqual({ ok: false, status: 500, errorCode: "invalid_response" });
  });
  it("shows actual saved version or stale/unsaved state without transport identifiers", () => {
    const draft = savedFixture();
    const html = renderToStaticMarkup(createElement(CurrentModelSummary, { draft }));
    expect(html).toContain("已保存版本 2"); expect(html).toContain('href="/app/start?model_draft=current"');
    expect(html).not.toContain(draft.sourceContext!.signature); expect(html).not.toContain(draft.sourceContext!.modelContext.graphSnapshotId);
    const stale = renderToStaticMarkup(createElement(CurrentModelSummary, { draft: { ...draft, status: "stale", currentSourceContext: null } }));
    expect(stale).toContain("须为当前模型重新配置");
    const empty = digitalLifeModelDraftSchema.parse({ ...draft, status: "not_saved", currentRevision: 0, horizonDays: null, sourceContext: null, draftRules: null });
    expect(renderToStaticMarkup(createElement(CurrentModelSummary, { draft: empty }))).toContain("尚未保存行动与策略草稿");
  });
});
