import { expect, it } from "vitest";
import { digitalLifeInput, digitalLifeRules } from "./test-fixtures";
import { digitalLifeRulesDraftSchema } from "@/lib/formal-sandbox/correction-context";
import { buildFormalSandboxRunV2 } from "@/lib/formal-sandbox/runtime";

it("explicit confirmation of revised saved amount changes controlled Event delta 2 to 1 while the old bundle remains frozen", async () => {
  const input = digitalLifeInput(); input.agents = input.agents.slice(0, 2);
  input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
  const draft = digitalLifeRulesDraftSchema.parse({ ...digitalLifeRules(), strategies: [], actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "allocate_resource", resourceKey: "resource-1", amount: 2 }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "本人明确设定的资源假设" }] });
  const confirm = () => ({ ...draft, actions: draft.actions.map(action => ({ ...action, confirmedForSimulation: true })), strategies: [] });
  const first = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: confirm() });
  expect(first.ok).toBe(true); if (!first.ok) return;
  const frozen = JSON.stringify(first.bundle);
  draft.actions[0].operation = { actionType: "allocate_resource", resourceKey: "resource-1", amount: 1 };
  const second = await buildFormalSandboxRunV2({ ...input, digitalLifeRules: confirm() });
  expect(second.ok).toBe(true); if (!second.ok) return;
  const changes = (bundle: typeof first.bundle) => bundle.events.filter(event => event.eventType === "allocate_resource").flatMap(event => event.deltas.filter(delta => delta.valueType === "resource").map(delta => Number(delta.before) - Number(delta.after)));
  expect(changes(first.bundle)).toContain(2); expect(changes(second.bundle)).toContain(1);
  expect(JSON.stringify(first.bundle)).toBe(frozen);
  expect(draft.actions[0].confirmedForSimulation).toBe(false);
}, 60_000);
