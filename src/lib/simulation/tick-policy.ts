import type { TimeWindow } from "@/types/seed-context";

import type { TickPolicy, TimeWindowSupport } from "./simulation-types";

const windowPolicies: TimeWindowSupport = {
  "30_days": {
    tickCount: 3,
    timeLabels: ["Day 1-7", "Day 8-21", "Day 22-30"],
  },
  "90_days": {
    tickCount: 6,
    timeLabels: [
      "Day 1-14",
      "Day 15-30",
      "Month 2 start",
      "Month 2 end",
      "Month 3 start",
      "Month 3 end",
    ],
  },
  "1_year": {
    tickCount: 8,
    timeLabels: [
      "Month 1",
      "Month 2-3",
      "Month 4-6",
      "Month 7-9",
      "Month 10-12",
      "Year-end review",
      "Reserve tick",
      "Calibration tick",
    ],
  },
  "3_years": {
    tickCount: 10,
    timeLabels: [
      "Quarter 1",
      "Quarter 2",
      "Quarter 3",
      "Quarter 4",
      "Year 2 early",
      "Year 2 late",
      "Year 3 early",
      "Year 3 mid",
      "Year 3 late",
      "Calibration tick",
    ],
  },
  "5_years": {
    tickCount: 12,
    timeLabels: [
      "Half year 1",
      "Half year 2",
      "Year 2 early",
      "Year 2 late",
      "Year 3 early",
      "Year 3 late",
      "Year 4 early",
      "Year 4 late",
      "Year 5 early",
      "Year 5 mid",
      "Year 5 late",
      "Calibration tick",
    ],
  },
};

export function getTickPolicy(timeWindow: TimeWindow): TickPolicy {
  return windowPolicies[timeWindow];
}
