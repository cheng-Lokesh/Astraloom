import { describe, expect, it } from "vitest";

import { getCanonicalAuthCallbackUrl, getSafeNextPath } from "./callback-url";

describe("authentication callback URL policy", () => {
  it("builds the one canonical local callback URL without changing the configured host", () => {
    expect(
      getCanonicalAuthCallbackUrl("http://localhost:3000", "/app/new/intake"),
    ).toBe("http://localhost:3000/auth/callback?next=%2Fapp%2Fnew%2Fintake");
  });

  it("accepts only same-origin application paths as post-authentication destinations", () => {
    expect(getSafeNextPath("/app/new/intake")).toBe("/app/new/intake");
    expect(getSafeNextPath("https://example.invalid")).toBe("/app/new/intake");
    expect(getSafeNextPath("//example.invalid")).toBe("/app/new/intake");
  });
});
