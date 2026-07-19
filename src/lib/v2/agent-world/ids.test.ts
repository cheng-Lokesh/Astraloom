import { describe, expect, expectTypeOf, it } from "vitest";

import { parseRealEvidenceIdV2 } from "../reality-boundary/ids";
import {
  parseAgentDefinitionIdV2,
  parseWorldEntityIdV2,
  parseWorldEventIdV2,
} from "./ids";
import type {
  AgentDefinitionIdV2,
  WorldEntityIdV2,
  WorldEventIdV2,
} from "./types";

describe("Agent World V2 identifiers", () => {
  it("keeps entity classes distinct at compile time", () => {
    expectTypeOf<AgentDefinitionIdV2>().not.toEqualTypeOf<WorldEntityIdV2>();
    expectTypeOf<WorldEntityIdV2>().not.toEqualTypeOf<WorldEventIdV2>();
  });

  it("parses only matching external namespaces", () => {
    expect(parseAgentDefinitionIdV2("agent_definition_v2_user")).toBe("agent_definition_v2_user");
    expect(parseWorldEntityIdV2("world_entity_v2_offer")).toBe("world_entity_v2_offer");
    expect(parseWorldEntityIdV2("agent_definition_v2_user")).toBeNull();
  });

  it("never accepts a World Event id as Real Evidence", () => {
    expect(parseWorldEventIdV2("world_event_v2_abc")).toBe("world_event_v2_abc");
    expect(parseRealEvidenceIdV2("world_event_v2_abc")).toBeNull();
  });
});
