import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("ordinary scene"); }, useRouter: () => ({ push: vi.fn() }) }));
import StartPage from "@/app/app/start/page";
import { FormalRunStarter } from "./run-starter";
import type { ReactElement } from "react";

function findStarter(element: unknown): ReactElement<{ currentDraftMode?: boolean }> | null {
  if (!element || typeof element !== "object" || !("props" in element)) return null;
  const node = element as ReactElement<{ children?: unknown }>;
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
