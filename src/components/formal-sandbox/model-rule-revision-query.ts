import { z } from "zod";
import type { SafeDigitalLifeCorrectionContext } from "@/lib/formal-sandbox/correction-context";
import type { SafeDigitalLifeContext } from "@/lib/formal-sandbox/model-context";

export function parseRevisionQuery(query: Record<string, string | string[] | undefined>): string | null {
  if (Object.keys(query).length !== 1 || typeof query.revise_run !== "string") return null;
  const result = z.string().uuid().safeParse(query.revise_run);
  return result.success ? result.data : null;
}
export function compatibleRevision(source: SafeDigitalLifeCorrectionContext, current: SafeDigitalLifeContext) {
  if (source.frozenRules.version === "digital-life-rules-v2") return JSON.stringify(source.modelContext) === JSON.stringify(current);
  const legacy = (value: SafeDigitalLifeContext) => ({ graphSnapshotId: value.graphSnapshotId, agentSnapshotId: value.agentSnapshotId, profileRevision: value.profileRevision, agents: value.agents, relationships: value.relationships, resources: value.resources });
  return JSON.stringify(legacy(source.modelContext)) === JSON.stringify(legacy(current));
}
