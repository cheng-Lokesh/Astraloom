import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { initialTargetedFeedbackState, TargetedFeedbackPanel } from "./result-workbench";

describe("targeted feedback in the formal Result", () => {
  const noOp = () => {};

  it("offers Claim accuracy choices without rendering its internal ordinal key", () => {
    const html = renderToStaticMarkup(createElement(TargetedFeedbackPanel, {
      targetType: "claim",
      targetKey: "claim-1",
      targetLabel: "A conditional conclusion",
      state: initialTargetedFeedbackState,
      onRatingChange: noOp,
      onCommentChange: noOp,
      onSave: noOp,
      saving: false,
    }));

    expect(html).toContain("评价这条结论");
    expect(html).toContain("准确 · Accurate");
    expect(html).toContain("部分准确 · Partly right");
    expect(html).toContain("尚未发生 · Not happened yet");
    expect(html).toContain("不会更改本次结果");
    expect(html).not.toContain("claim-1");
  });

  it.each([
    ["agent", "这位人物的判断", "符合 · Accurate", "person-1"],
    ["relation_edge", "这段关系的判断", "符合 · Accurate", "relation-1"],
  ] as const)("offers category-appropriate feedback for %s without Claim-only options", (targetType, targetLabel, firstChoice, targetKey) => {
    const html = renderToStaticMarkup(createElement(TargetedFeedbackPanel, {
      targetType,
      targetKey,
      targetLabel,
      state: initialTargetedFeedbackState,
      onRatingChange: noOp,
      onCommentChange: noOp,
      onSave: noOp,
      saving: false,
    }));

    expect(html).toContain(targetLabel);
    expect(html).toContain(firstChoice);
    expect(html).toContain("不符合 · Off");
    expect(html).not.toContain("尚未发生");
    expect(html).not.toContain(targetKey);
    expect(html).toContain("不会更改本次结果");
  });
});
