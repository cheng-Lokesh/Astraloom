import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import type { ResultRequestState } from "@/lib/formal-sandbox/result-request-gate";
import {
  activateClaimFromKeyboard,
  EvidenceWorkbenchView,
  FeedbackPanel,
  feedbackReducer,
  initialFeedbackState,
  ResultSurface,
} from "./result-workbench";

const projection: FormalSandboxResultProjection = {
  participants: [
    { key: "person-1", label: "Scenario owner", role: "scenario decision maker" },
    { key: "person-2", label: "Frozen participant", role: "frozen participant" },
  ],
  relationships: [{ key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "professional" }],
  facts: [{ key: "fact-1", statement: "User supplied fact", boundary: "user_provided_fact" }],
  assumptions: [{ key: "assumption-1", statement: "System assumption", boundary: "system_assumption" }],
  steps: [{ key: "step-1", order: 1, label: "record observation", kind: "sandbox_simulation", boundary: "simulation_step", participantKeys: ["person-1", "person-2"], relationshipKeys: ["relation-1"] }],
  claims: [{ key: "claim-1", statement: "Conditional conclusion", uncertainty: "Not a guarantee", boundary: "conditional_claim", stepKeys: ["step-1"], supportingStepKeys: ["step-1"], participantKeys: ["person-1", "person-2"], relationshipKeys: ["relation-1"] }],
};

const noAction = () => undefined;
const workbench = (selectedClaimKey: string | null = null, feedbackState = initialFeedbackState) => createElement(EvidenceWorkbenchView, {
  projection,
  selectedClaimKey,
  onChooseClaim: noAction,
  feedbackState,
  onCommentChange: noAction,
  onSaveFeedback: noAction,
});

describe("M2.2 Result components and controllers", () => {
  it("renders only the safe projection across all four evidence ledgers", () => {
    const html = renderToStaticMarkup(workbench());

    expect(html).toContain("User-provided facts");
    expect(html).toContain("System assumptions");
    expect(html).toContain("Direct supporting simulation steps");
    expect(html).toContain("Conditional conclusions");
    expect(html).toContain("User supplied fact");
    expect(html).toContain("System assumption");
    expect(html).toContain("Conditional conclusion");
    expect(html).not.toMatch(/private-ref|world_event_v2_|claim_v2_|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  });

  it("activates Claim linkage from Enter or Space and renders only direct support as selected", () => {
    const choose = vi.fn();
    expect(activateClaimFromKeyboard("Enter", "claim-1", choose)).toBe(true);
    expect(activateClaimFromKeyboard(" ", "claim-1", choose)).toBe(true);
    expect(activateClaimFromKeyboard("Escape", "claim-1", choose)).toBe(false);
    expect(choose).toHaveBeenCalledTimes(2);

    const html = renderToStaticMarkup(workbench("claim-1"));
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("ring-2");
    expect(html.match(/text-\[var\(--evidence-gold\)\]/g)).toHaveLength(3);
  });

  it("renders all feedback choices and preserves the note after a failed save", () => {
    const withComment = feedbackReducer(initialFeedbackState, { type: "comment_changed", comment: "Keep this note" });
    const failed = feedbackReducer(withComment, { type: "save_failed" });
    const html = renderToStaticMarkup(createElement(FeedbackPanel, { state: failed, onCommentChange: noAction, onSave: noAction }));

    expect(html).toContain("useful");
    expect(html).toContain("mixed");
    expect(html).toContain("off");
    expect(html).toContain("Keep this note");
    expect(html).toContain("Feedback was not saved");
    expect(failed.comment).toBe("Keep this note");
  });

  it("renders observable touch, focus, reduced-motion and overflow contracts", () => {
    const html = renderToStaticMarkup(workbench());

    expect(html).toContain("min-h-10");
    expect(html).toContain("focus-visible:outline");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).toContain("overflow-x-hidden");
  });

  it("renders empty and Run-bound loading states instead of a stale ready projection", () => {
    const ready: ResultRequestState<FormalSandboxResultProjection> = { phase: "ready", runId: "run-a", projection };
    const empty = renderToStaticMarkup(createElement(ResultSurface, { runId: null, state: ready, onRetry: noAction }));
    const switched = renderToStaticMarkup(createElement(ResultSurface, { runId: "run-b", state: ready, onRetry: noAction }));
    const current = renderToStaticMarkup(createElement(ResultSurface, { runId: "run-a", state: ready, onRetry: noAction }));

    expect(empty).toContain("Choose a formal Run from History");
    expect(switched).toContain("Reading saved evidence");
    expect(switched).not.toContain("Conditional conclusion");
    expect(current).toContain("Conditional conclusion");
  });

  it("renders retry only for the current Run error", () => {
    const error: ResultRequestState<FormalSandboxResultProjection> = { phase: "error", runId: "run-a", message: "Unavailable" };
    const html = renderToStaticMarkup(createElement(ResultSurface, { runId: "run-a", state: error, onRetry: noAction }));
    expect(html).toContain("Unavailable");
    expect(html).toContain("Retry");
  });
});
