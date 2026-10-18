/** Browser/server shared time rule. Missing version deliberately retains legacy behavior. */
export function observationNeedsTime(
  condition: { requiresTime: boolean; kind: string; measurement: string },
  value: unknown,
  version?: "formal-reality-criteria-v1" | "formal-reality-criteria-v2",
): boolean {
  if (value === null) return false;
  if (version === "formal-reality-criteria-v2" && condition.kind === "request_information" && condition.measurement === "operation" && value === false) return false;
  return condition.requiresTime;
}
