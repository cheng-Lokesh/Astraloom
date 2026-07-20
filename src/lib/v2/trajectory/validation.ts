import { z } from "zod";

import { validateWorldV2 } from "../agent-world/validation";
import type { WorldStateV2 } from "../agent-world/types";
import { parseTrajectoryIdV2, parseTrajectoryRunSpecIdV2 } from "./ids";
import {
  TRAJECTORY_ENGINE_VERSION_V2,
  type TrajectoryRunSpecErrorCodeV2,
  type TrajectoryRunSpecV2,
} from "./types";

const nonEmpty = z.string().trim().min(1).max(1000);
const uint32 = z.number().finite().int().min(0).max(0xffff_ffff);
const positiveInteger = z.number().finite().int().positive();

function isIsoTimestamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[8] ?? 0);
  const offsetMinute = Number(match[9] ?? 0);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= monthDays[month - 1]! &&
    hour <= 23 && minute <= 59 && second <= 59 && offsetHour <= 23 && offsetMinute <= 59 &&
    Number.isFinite(Date.parse(value));
}

const runSpecSchema = z.object({
  runSpecId: nonEmpty.refine((value) => parseTrajectoryRunSpecIdV2(value) !== null),
  trajectoryId: nonEmpty.refine((value) => parseTrajectoryIdV2(value) !== null),
  seedContextId: nonEmpty,
  initialWorld: z.unknown(),
  expectedInitialWorldRevision: z.number().finite().int().nonnegative(),
  trajectorySeed: uint32,
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  startAt: nonEmpty.refine(isIsoTimestamp),
  tickIntervalDays: positiveInteger,
  maxTicks: positiveInteger.max(100),
  policyId: nonEmpty,
  policyVersion: nonEmpty,
  trajectoryEngineVersion: z.literal(TRAJECTORY_ENGINE_VERSION_V2),
}).strict();

function failure(errorCode: TrajectoryRunSpecErrorCodeV2, issues?: string[]) {
  return issues?.length ? { ok: false as const, errorCode, issues } : { ok: false as const, errorCode };
}

export function parseTrajectoryRunSpecV2(value: unknown) {
  const parsed = runSpecSchema.safeParse(value);
  if (!parsed.success) {
    return failure("invalid_run_spec", parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
  const spec = parsed.data as Omit<TrajectoryRunSpecV2, "initialWorld"> & { initialWorld: unknown };
  const worldValidation = validateWorldV2(spec.initialWorld);
  if (!worldValidation.ok) {
    return failure("invalid_initial_world", worldValidation.issues.map((issue) => `${issue.path}: ${issue.message}`));
  }
  const world = spec.initialWorld as WorldStateV2;
  if (
    spec.seedContextId !== world.seedContextId ||
    spec.seedContextId !== world.realityBoundarySnapshot.seedContextId ||
    spec.seedContextId !== world.realityBoundarySnapshot.evidenceLedger.seedContextId ||
    spec.seedContextId !== world.realityBoundarySnapshot.assumptionLedger.seedContextId
  ) {
    return failure("cross_seed_reference");
  }
  if (spec.expectedInitialWorldRevision !== world.revision) {
    return failure("stale_initial_world_revision");
  }
  if (Date.parse(spec.startAt) < Date.parse(world.updatedAt)) {
    return failure("start_before_initial_world");
  }
  if ((spec.maxTicks - 1) * spec.tickIntervalDays > spec.horizonDays) {
    return failure("schedule_exceeds_horizon");
  }
  return {
    ok: true as const,
    value: structuredClone({ ...spec, initialWorld: world }) as TrajectoryRunSpecV2,
  };
}
