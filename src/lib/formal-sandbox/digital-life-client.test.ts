import { expect, it, vi } from "vitest";
import { digitalLifeRules, ids } from "@/lib/digital-life/test-fixtures";
import { createFormalSandboxClient } from "./client";

it("sends explicitly supplied digital-life rules through the formal Run client", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, idempotent: false, run: { id: ids.seed, status: "completed" } }), { status: 201 }));
  const input = { graphSnapshotId: ids.graph, idempotencyKey: ids.edge, horizonDays: 30 as const, digitalLifeRules: digitalLifeRules() };
  await createFormalSandboxClient(fetcher).start(input);
  const sent = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
  expect(sent.digital_life_rules).toEqual(input.digitalLifeRules);
});
