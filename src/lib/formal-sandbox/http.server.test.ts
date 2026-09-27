import { describe, expect, it } from "vitest";

import { sandboxErrorStatus } from "./http.server";

describe("formal sandbox failure status", () => {
  it("treats a missing explicit World model as a correctable input error", () => {
    expect(sandboxErrorStatus("world_model_required")).toBe(422);
  });
});
