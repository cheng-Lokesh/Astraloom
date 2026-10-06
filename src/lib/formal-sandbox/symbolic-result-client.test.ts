import { describe, expect, it } from "vitest";
import { formalSandboxResultProjectionSchema } from "./client";
import { attachedSymbolicFixture } from "./symbolic-lens.test-fixtures";

const base = { participants: [], relationships: [], facts: [], assumptions: [], realityProfile: { status: "not_recorded", revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [], worldVariables: [] }, resourceChanges: [], steps: [], claims: [] };
describe("safe symbolic result client", () => {
  it("retains the safe frozen personal frame without depending on current account state", () => {
    const lens = attachedSymbolicFixture();
    const symbolicLens = { status: "attached", frozenAt: lens.frozenAt, preferenceRevision: 2, frame: lens.frame, causalUse: false };
    const parsed = formalSandboxResultProjectionSchema.safeParse({ ...base, symbolicLens });
    expect(parsed.success).toBe(true);
    expect(parsed.success && (parsed.data as unknown as { symbolicLens: unknown }).symbolicLens).toEqual(symbolicLens);
    expect(formalSandboxResultProjectionSchema.safeParse(base).success).toBe(true);
  });
  it("rejects private provenance or an empty attached model", () => {
    const lens = attachedSymbolicFixture();
    const symbolicLens = { status: "attached", frozenAt: lens.frozenAt, preferenceRevision: 2, frame: lens.frame, causalUse: false };
    expect(formalSandboxResultProjectionSchema.safeParse({ ...base, symbolicLens: { ...symbolicLens, provenance: lens.provenance } }).success).toBe(false);
    expect(formalSandboxResultProjectionSchema.safeParse({ ...base, symbolicLens: { ...symbolicLens, frame: null } }).success).toBe(false);
  });
});
