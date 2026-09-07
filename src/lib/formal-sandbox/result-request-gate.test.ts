import { describe, expect, it, vi } from "vitest";

import { createResultRequestGate } from "./result-request-gate";

const runOne = "11111111-1111-4111-8111-111111111111";
const runTwo = "22222222-2222-4222-8222-222222222222";

describe("Result request generation gate", () => {
  it("enters loading for a changed run and rejects the old run's late response", async () => {
    const render = vi.fn();
    const first = Promise.withResolvers<string>();
    const second = Promise.withResolvers<string>();
    const gate = createResultRequestGate(render);

    const firstRequest = gate.begin(runOne);
    expect(render).toHaveBeenLastCalledWith({ phase: "loading", runId: runOne });
    const secondRequest = gate.begin(runTwo);
    expect(render).toHaveBeenLastCalledWith({ phase: "loading", runId: runTwo });

    void first.promise.then((projection) => gate.resolve(firstRequest, projection));
    void second.promise.then((projection) => gate.resolve(secondRequest, projection));
    first.resolve("old projection");
    await first.promise;
    await Promise.resolve();
    expect(render).not.toHaveBeenCalledWith({ phase: "ready", runId: runOne, projection: "old projection" });

    second.resolve("new projection");
    await second.promise;
    await Promise.resolve();
    expect(render).toHaveBeenLastCalledWith({ phase: "ready", runId: runTwo, projection: "new projection" });
  });

  it("starts retry as a new loading generation and ignores the superseded response", async () => {
    const render = vi.fn();
    const gate = createResultRequestGate(render);
    const original = gate.begin(runOne);
    const retry = gate.begin(runOne);

    expect(retry.generation).toBeGreaterThan(original.generation);
    expect(render).toHaveBeenLastCalledWith({ phase: "loading", runId: runOne });
    expect(gate.resolve(original, "superseded projection")).toBe(false);
    expect(gate.resolve(retry, "retried projection")).toBe(true);
    expect(render).toHaveBeenLastCalledWith({ phase: "ready", runId: runOne, projection: "retried projection" });
  });
});
