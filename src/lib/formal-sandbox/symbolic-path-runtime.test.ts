import { describe, expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { buildFormalSandboxRunV2 } from "./runtime";
import { projectFormalSandboxResult } from "./result-projection.server";
import { attachedSymbolicFixture, emptySymbolicFixture } from "./symbolic-lens.test-fixtures";

describe("real symbolic frame with two strategy paths", () => {
  it.each([30, 90] as const)("keeps every causal artifact unchanged for a %s-day run and renders all frozen paths", async horizonDays => {
    const input = digitalLifeInput();
    input.agents.push({ ...input.agents[2]!, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "第二平行自我" });
    const rules = digitalLifeRules();
    rules.strategies.push({ ...rules.strategies[0]!, participantKey: "person-4", label: "保留另一学习策略" });
    rules.actions.push({ ...rules.actions[2]!, key: "rule-4", pathKey: "person-4", actorKey: "person-4" });
    const attached = attachedSymbolicFixture(input.startedAt);
    const common = { ...input, horizonDays, digitalLifeRules: rules };
    const plain = await buildFormalSandboxRunV2({ ...common, symbolicLens: emptySymbolicFixture("not_authorized", input.startedAt) });
    const real = await buildFormalSandboxRunV2({ ...common, symbolicLens: attached });
    expect(plain.ok ? "ok" : plain.errorCode).toBe("ok");
    expect(real.ok ? "ok" : real.errorCode).toBe("ok");
    if (!plain.ok || !real.ok) return;
    const withoutSymbolic = (raw: unknown): unknown => {
      if (Array.isArray(raw)) return raw.map(withoutSymbolic);
      if (raw && typeof raw === "object") return Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "symbolicLensSnapshot").map(([key, value]) => [key, withoutSymbolic(value)]));
      return raw;
    };
    expect(withoutSymbolic(real.bundle)).toEqual(withoutSymbolic(plain.bundle));
    const projection = projectFormalSandboxResult(real.bundle);
    expect(projection?.symbolicLens.frame).toEqual(attached.frame);
    expect(projection?.strategyPaths).toHaveLength(2);
    expect(projection?.strategyPaths.every(path => JSON.stringify(path.projection.symbolicLens) === JSON.stringify(projection.symbolicLens))).toBe(true);
    const altered = structuredClone(real.bundle) as typeof real.bundle & { strategyPaths: { paths: Array<{ bundle: { symbolicLensSnapshot: unknown } }> } };
    (altered.strategyPaths.paths[1]!.bundle as unknown as Record<string, unknown>).symbolicLensSnapshot = emptySymbolicFixture("withdrawn", input.startedAt);
    expect(projectFormalSandboxResult(altered)).toBeNull();
  }, 60_000);
});
