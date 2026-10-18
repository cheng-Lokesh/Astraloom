import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FrozenUsedCorrections } from "./frozen-used-corrections";
import type { SafeUsedCorrections } from "@/lib/formal-sandbox/outcomes/used-corrections-contracts";

const receipt: SafeUsedCorrections = { version: "formal-used-corrections-v1", status: "recorded", items: [{ key: "correction-1", sourceRunId: "60000000-0000-4000-8000-000000000001", ruleKey: "rule-1", label: "本人投入条件", previousValue: 2, nextValue: 3, evidenceSummary: "本人观察记录", recordedAt: "2026-10-18T00:00:00Z", samples: [{ sampleKey: "sample-1", status: "executed", stepKeys: ["step-1"] }, { sampleKey: "sample-2", status: "not_executed", stepKeys: [] }, { sampleKey: "sample-3", status: "not_executed", stepKeys: [] }] }] };
describe("frozen main-path used correction receipt", () => {
  it("distinguishes legacy absence, explicit none and unavailable source", () => {
    const render = (value?: SafeUsedCorrections) => renderToStaticMarkup(createElement(FrozenUsedCorrections, { receipt: value, steps: [] }));
    expect(render()).toContain("此历史运行未记录可核对的采用回执");
    expect(render({ version: receipt.version, status: "none_recorded", items: [] })).toContain("本次未采用观察修正");
    const unavailable = render({ version: receipt.version, status: "source_unavailable", items: [] });
    expect(unavailable).toContain("来源暂不可核对"); expect(unavailable).not.toContain("本次未采用观察修正");
  });
  it("requires actual supporting steps to display execution and keeps source identity in protected navigation only", () => {
    const missing = renderToStaticMarkup(createElement(FrozenUsedCorrections, { receipt, steps: [] }));
    expect(missing).toContain("对应执行步骤未完整记录");
    expect(missing).not.toContain("本样本实际执行了该条件行动");
    const supported = renderToStaticMarkup(createElement(FrozenUsedCorrections, { receipt, steps: [{ key: "step-1", order: 3, label: "本人投入学习时间" }] }));
    expect(supported).toContain("支持步骤 3：本人投入学习时间");
    expect(supported).toContain("/app/simulation/result?run_id=60000000-0000-4000-8000-000000000001#run-outcome-observations");
    const visible = supported.replace(/<[^>]+>/g, "");
    expect(visible).not.toContain(receipt.items[0].sourceRunId); expect(visible).not.toContain("rule-1");
  });
});
