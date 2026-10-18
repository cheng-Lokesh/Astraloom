import { beforeAll, describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "../runtime";
import { projectFormalSandboxResult } from "../result-projection.server";
import { buildObservedOutcome, outcomeTargets } from "./core-adapter";

const sourceRunId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
type Bundle = Extract<Awaited<ReturnType<typeof buildFormalSandboxRunV2>>, { ok: true }>["bundle"];
let source: Bundle;
let next: Bundle;

describe("frozen used correction receipt", () => {
  beforeAll(async () => {
    const input = digitalLifeInput();
    const original = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: digitalLifeRules() });
    expect(original.ok).toBe(true);
    if (!original.ok) throw new Error("fixture runtime failed");
    source = original.bundle;
    const target = outcomeTargets(source, "2026-11-10T04:00:00.000Z", true).find(item => item.conditions.some(condition => condition.ruleKey === "rule-2"))!;
    const observed = await buildObservedOutcome(source, "2026-10-06T03:59:59.999Z", {
      target_key: target.key, observed: "uncertain", uncertainty: "medium", evidence_summary: "本人观察到询问后的实际回应有所不同",
      confirmed_user_observation: true, idempotency_key: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      observations: target.conditions.map(condition => ({ key: condition.key,
        value: condition.kind === "update_relation_signal" ? "negative" as const : condition.expectedValue,
        ...(condition.requiresTime ? { occurred_at: "2026-10-20T04:00:00.000Z" } : {}),
      })),
      correction: { rule_key: "rule-2", confirmed_for_next_run: true },
    }, "2026-11-10T04:00:00.000Z");
    expect(observed.correction?.nextValue).toBe("negative");
    const rerun = await buildFormalSandboxRunV2({ ...input, startedAt: "2026-11-11T04:00:00.000Z", digitalLifeRules: digitalLifeRules(),
      outcomeCalibration: { version: "formal-outcome-run-v1", corrections: [{ ...observed.correction!, key: `correction-v1-${"a".repeat(64)}`, sourceRunId }] },
    });
    expect(rerun.ok).toBe(true);
    if (!rerun.ok) throw new Error("corrected runtime failed");
    next = rerun.bundle;
  }, 120_000);

  it("shows the actual observed correction and the controlled selected Event in every sample", () => {
    const projection = projectFormalSandboxResult(next, { correctionSources: new Map([[sourceRunId, source]]) });
    expect(projection).not.toBeNull();
    expect(projection?.usedCorrections).toEqual({ version: "formal-used-corrections-v1", status: "recorded", items: [expect.objectContaining({
      key: "correction-1", sourceRunId, ruleKey: "rule-2", previousValue: "positive", nextValue: "negative",
      evidenceSummary: "本人观察到询问后的实际回应有所不同", samples: expect.arrayContaining([
        expect.objectContaining({ sampleKey: "sample-1", status: "executed", stepKeys: [expect.stringMatching(/^step-/)] }),
      ]),
    })] });
    expect(projection?.usedCorrections?.items[0]?.samples).toHaveLength(3);
    expect(projection?.strategyPaths.every(path => !Object.hasOwn(path.projection, "usedCorrections"))).toBe(true);
  });
});
