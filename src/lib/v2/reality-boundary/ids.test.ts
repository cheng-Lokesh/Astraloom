import { describe, expect, expectTypeOf, it } from "vitest";

import {
  parseAssumptionIdV2,
  parseRealEvidenceIdV2,
} from "./ids";
import type { AssumptionIdV2, RealEvidenceIdV2 } from "./types";

describe("Reality Boundary V2 identifiers", () => {
  it("keeps Evidence and Assumption ids distinct at compile time", () => {
    expectTypeOf<RealEvidenceIdV2>().not.toEqualTypeOf<AssumptionIdV2>();
  });

  it("parses only the matching runtime namespace", () => {
    expect(parseRealEvidenceIdV2("real_evidence_v2_abc123")).toBe(
      "real_evidence_v2_abc123",
    );
    expect(parseRealEvidenceIdV2("assumption_v2_abc123")).toBeNull();
    expect(parseAssumptionIdV2("assumption_v2_abc123")).toBe(
      "assumption_v2_abc123",
    );
    expect(parseAssumptionIdV2("external-string")).toBeNull();
  });
});
