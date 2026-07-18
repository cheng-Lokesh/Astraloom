import { describe, expect, it } from "vitest";

import { buildAgentProfiles } from "./build";
import { buildConfirmedPeople, buildV1Seed } from "@/test/v1-fixtures";

describe("Agent builder V1 baseline", () => {
  it("builds current self, two parallel selves, and confirmed NPC profiles", () => {
    const people = buildConfirmedPeople();
    const agents = buildAgentProfiles(buildV1Seed(), people, true);

    expect(agents.filter((agent) => agent.agentType === "self")).toHaveLength(1);
    expect(agents.filter((agent) => agent.agentType === "parallel_self")).toHaveLength(2);
    expect(agents.filter((agent) => agent.agentType === "npc")).toHaveLength(
      people.length,
    );
    expect(agents.every((agent) => agent.version === "local-deterministic-v0")).toBe(
      true,
    );
    expect(agents.every((agent) => agent.modelVersion === "unreleased")).toBe(true);
    expect(agents.every((agent) => agent.evidenceRefs.length > 0)).toBe(true);
  });
});
