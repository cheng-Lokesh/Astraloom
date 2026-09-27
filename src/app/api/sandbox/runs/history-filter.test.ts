import { describe, expect, it } from "vitest";

import { parseHistoryFilter } from "./history-filter";

describe("account History filter", () => {
  it("accepts only a completed 30 or 90 day horizon and leaves an omitted horizon unfiltered", () => {
    expect(parseHistoryFilter(new URLSearchParams("horizon=30_days"))).toEqual({ horizon: "30_days" });
    expect(parseHistoryFilter(new URLSearchParams("horizon=90_days"))).toEqual({ horizon: "90_days" });
    expect(parseHistoryFilter(new URLSearchParams())).toEqual({});
    expect(parseHistoryFilter(new URLSearchParams("horizon=7_days"))).toBeNull();
  });
});
