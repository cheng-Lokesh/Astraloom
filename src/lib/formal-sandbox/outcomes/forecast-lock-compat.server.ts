import { z } from "zod";
import { buildForecastLockV2, parseValidatedForecastLockPersistenceVersionV2 } from "@/lib/v2/outcome-calibration";
import { canonicalStage7JsonV2 } from "@/lib/v2/outcome-calibration/ids";

function restoreBoundaryOptionals(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(restoreBoundaryOptionals);
  if (!value || typeof value !== "object") return value;
  const record = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreBoundaryOptionals(item)]));
  const addMissing = (item: unknown, fields: readonly string[]) => {
    const target = z.record(z.string(), z.unknown()).parse(item);
    for (const field of fields) if (!Object.hasOwn(target, field)) target[field] = undefined;
    return target;
  };
  // These are exactly the explicit optional keys emitted by the accepted Core
  // evidence/assumption builders. Restore only inside a named frozen Boundary.
  if (record.evidenceLedger && record.assumptionLedger && record.schemaVersion === "2.0") {
    const evidence = z.object({ items: z.array(z.record(z.string(), z.unknown())) }).passthrough().parse(record.evidenceLedger);
    evidence.items = evidence.items.map(item => {
      const restored = addMissing(item, ["legacyHeuristic", "occurredAt"]);
      restored.provenance = z.array(z.unknown()).parse(restored.provenance).map(entry => addMissing(entry, ["occurredAt", "locator", "url", "title", "excerpt"]));
      return restored;
    });
    const assumptions = z.object({ assumptions: z.array(z.record(z.string(), z.unknown())) }).passthrough().parse(record.assumptionLedger);
    assumptions.assumptions = assumptions.assumptions.map(item => addMissing(item, ["parameterRange", "legacyHeuristic", "legacyHeuristicHistory"]));
    record.evidenceLedger = evidence; record.assumptionLedger = assumptions;
  }
  return record;
}

/** A defensive read-only clone for existing formal v1/v2 fingerprint rebuilds. */
export function restoreCompatibleFormalBundle(raw: unknown): unknown {
  const restored = restoreBoundaryOptionals(raw);
  const normalized = (value: unknown) => canonicalStage7JsonV2(JSON.parse(JSON.stringify(value)));
  if (normalized(raw) !== normalized(restored)) throw new Error("invalid_forecast_lock");
  return restored;
}

/** Restore only Core-canonical optional undefined fields omitted by JSON storage.
 * Every stored value, id and signature must already match; Core remains the validator. */
export function parseCompatibleForecastLockPersistenceVersion(raw: unknown): ReturnType<typeof parseValidatedForecastLockPersistenceVersionV2> {
  const original = parseValidatedForecastLockPersistenceVersionV2(raw);
  if (original.ok) return original;
  try {
    const envelope = z.object({ artifact: z.object({ kind: z.literal("forecast_lock"), value: z.object({
      forecastLockSpecId: z.string(), lockedAt: z.string(),
      sourceSnapshots: z.object({ run: z.unknown(), claimSet: z.unknown(), claims: z.array(z.unknown()), report: z.unknown() }).passthrough(),
    }).passthrough() }).passthrough() }).passthrough().parse(raw);
    const frozen = envelope.artifact.value;
    const restoredSnapshots = restoreCompatibleFormalBundle(frozen.sourceSnapshots) as typeof frozen.sourceSnapshots;
    const restored = buildForecastLockV2({ forecastLockSpecId: frozen.forecastLockSpecId, lockedAt: frozen.lockedAt, ...restoredSnapshots });
    if (!restored.ok) return original;
    const normalized = (value: unknown) => canonicalStage7JsonV2(JSON.parse(JSON.stringify(value)));
    if (normalized(restored.forecastLock) !== normalized(frozen)) return original;
    return parseValidatedForecastLockPersistenceVersionV2({ ...envelope, artifact: { ...envelope.artifact, value: restored.forecastLock } });
  } catch { return original; }
}
