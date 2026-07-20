import { parseActionProposalInputV2 } from "../agent-world/validation";
import type { ActionProposalInputV2 } from "../agent-world/types";

export function parseTrajectoryPolicyCandidatesV2(value: unknown) {
  if (!Array.isArray(value)) {
    return { ok: false as const, issues: ["candidates: Expected an array."] };
  }
  const candidates: ActionProposalInputV2[] = [];
  const issues: string[] = [];
  value.forEach((candidate, index) => {
    const parsed = parseActionProposalInputV2(candidate);
    if (parsed.ok) candidates.push(parsed.value);
    else issues.push(...parsed.issues.map((issue) => `candidates.${index}.${issue}`));
  });
  return issues.length
    ? { ok: false as const, issues }
    : { ok: true as const, value: structuredClone(candidates) };
}

