import { parseActionProposalInputV2 } from "../agent-world/validation";
import type { ActionProposalInputV2 } from "../agent-world/types";
import { parseTrajectoryInstantV2 } from "./time";

export function parseTrajectoryPolicyCandidatesV2(
  value: unknown,
  occurredAt: string,
) {
  if (!Array.isArray(value)) {
    return { ok: false as const, issues: ["candidates: Expected an array."] };
  }
  const candidates: ActionProposalInputV2[] = [];
  const issues: string[] = [];
  const tickInstant = parseTrajectoryInstantV2(occurredAt);
  value.forEach((candidate, index) => {
    const parsed = parseActionProposalInputV2(candidate);
    if (parsed.ok) {
      candidates.push(parsed.value);
      const candidateInstant = parseTrajectoryInstantV2(parsed.value.createdAt);
      if (
        !candidateInstant.ok &&
        candidateInstant.errorCode === "unsupported_timestamp_precision"
      ) {
        issues.push(
          `candidates.${index}.createdAt: Unsupported timestamp precision; must be losslessly representable as milliseconds.`,
        );
      } else if (
        !candidateInstant.ok ||
        !tickInstant.ok ||
        candidateInstant.value.epochMilliseconds !== tickInstant.value.epochMilliseconds
      ) {
        issues.push(
          `candidates.${index}.createdAt: Must represent the same instant as Tick occurredAt ${occurredAt}.`,
        );
      }
    } else {
      issues.push(...parsed.issues.map((issue) => `candidates.${index}.${issue}`));
    }
  });
  return issues.length
    ? { ok: false as const, issues }
    : { ok: true as const, value: structuredClone(candidates) };
}
