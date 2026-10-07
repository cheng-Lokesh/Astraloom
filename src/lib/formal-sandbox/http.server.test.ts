import { describe, expect, it } from "vitest";

import { sandboxErrorStatus, sandboxFailure } from "./http.server";

describe("formal sandbox failure status", () => {
  it("never caches an account authentication or persistence failure", () => {
    expect(sandboxFailure(401,"unauthenticated","test-only").headers.get("cache-control")).toBe("no-store");
  });
  it("reports an expired frozen reservation as a correctable conflict", () => {
    expect(sandboxErrorStatus("reservation_expired")).toBe(409);
  });
  it("treats a missing explicit World model as a correctable input error", () => {
    expect(sandboxErrorStatus("world_model_required")).toBe(422);
  });
  it("reports stale or invalid next-run corrections as recoverable conflicts",()=>{
    expect(sandboxErrorStatus("invalid_correction")).toBe(409);
    expect(sandboxErrorStatus("current_graph_required")).toBe(409);
  });
});
