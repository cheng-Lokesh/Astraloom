import { z } from "zod";

import { calibrationIdV2, canonicalStage7JsonV2, stage7FingerprintV2 } from "./ids";
import { parseValidatedBacktestV2 } from "./backtesting";
import type { BacktestV2, CalibrationV2 } from "./types";
import {
  BACKTEST_SCHEMA_VERSION_V2,
  CALIBRATION_METHOD_NAME_V2,
  CALIBRATION_METHOD_VERSION_V2,
  CALIBRATION_SCHEMA_VERSION_V2,
  MIN_CALIBRATION_SAMPLE_SIZE_V2,
  OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
} from "./types";

const bounded = z.string().trim().min(1).max(2000);
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const methodSchema = z.object({
  name: bounded,
  version: bounded,
  minimumSampleSize: z.number().int().positive(),
}).strict();
const inputSchema = z.object({
  calibrationSpecId: namespaced("calibration_spec_v2_"),
  method: methodSchema,
  backtests: z.array(z.unknown()).min(1).max(1000),
}).strict();
const resultMethodSchema = z.object({
  name: z.literal(CALIBRATION_METHOD_NAME_V2),
  version: z.literal(CALIBRATION_METHOD_VERSION_V2),
  description: bounded,
}).strict();
const bindingSchema = z.object({
  evidenceLedgerId: bounded,
  assumptionLedgerId: bounded,
  minimumRevision: z.number().int().nonnegative(),
  maximumRevision: z.number().int().nonnegative(),
}).strict();
const versionsSchema = z.object({
  outcomeCalibrationEngineVersion: z.literal(OUTCOME_CALIBRATION_ENGINE_VERSION_V2),
  calibrationSchemaVersion: z.literal(CALIBRATION_SCHEMA_VERSION_V2),
  backtestSchemaVersion: z.literal(BACKTEST_SCHEMA_VERSION_V2),
  methodVersion: z.literal(CALIBRATION_METHOD_VERSION_V2),
}).strict();
const calibrationSchema = z.object({
  id: namespaced("calibration_v2_"),
  calibrationSpecId: namespaced("calibration_spec_v2_"),
  seedContextId: bounded,
  status: z.enum(["insufficient_data", "calibrated"]),
  metricLabel: z.enum(["simulation_frequency", "calibrated_simulation_frequency"]),
  sampleCount: z.number().int().nonnegative(),
  excludedSampleCount: z.number().int().nonnegative(),
  minimumSampleSize: z.literal(MIN_CALIBRATION_SAMPLE_SIZE_V2),
  method: resultMethodSchema,
  brierScore: z.number().finite().min(0).max(1).nullable(),
  meanSimulationFrequency: z.number().finite().min(0).max(1).nullable(),
  observedRate: z.number().finite().min(0).max(1).nullable(),
  causalConclusion: z.literal(false),
  deterministicPrediction: z.literal(false),
  backtestIds: z.array(namespaced("backtest_v2_")).min(1),
  outcomeIds: z.array(namespaced("outcome_v2_")).min(1),
  observationUnitSignatures: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1),
  forecastUnitSignatures: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1),
  realityBoundaryBinding: bindingSchema,
  limitations: z.array(bounded).min(1),
  sourceBacktests: z.array(z.unknown()).min(1),
  versions: versionsSchema,
  calibrationIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();

function compatibleVersions(left: BacktestV2, right: BacktestV2) {
  return canonicalStage7JsonV2(left.versions) === canonicalStage7JsonV2(right.versions);
}

function calibrateUnsafeV2(input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_calibration_input" as const };
  if (
    parsed.data.method.name !== CALIBRATION_METHOD_NAME_V2 ||
    parsed.data.method.version !== CALIBRATION_METHOD_VERSION_V2 ||
    parsed.data.method.minimumSampleSize !== MIN_CALIBRATION_SAMPLE_SIZE_V2
  ) return { ok: false as const, errorCode: "version_mismatch" as const };
  const backtests: BacktestV2[] = [];
  for (const candidate of parsed.data.backtests) {
    const validated = parseValidatedBacktestV2(candidate);
    if (!validated.ok) return validated;
    backtests.push(validated.backtest);
  }
  backtests.sort((left, right) => left.id.localeCompare(right.id));
  if (new Set(backtests.map((item) => item.id)).size !== backtests.length ||
      new Set(backtests.map((item) => item.outcomeId)).size !== backtests.length) {
    return { ok: false as const, errorCode: "duplicate_id" as const };
  }
  if (new Set(backtests.map((item) => item.observationUnitSignature)).size !== backtests.length ||
      new Set(backtests.map((item) => item.forecastUnitSignature)).size !== backtests.length ||
      new Set(backtests.map((item) => item.forecastTargetSignature)).size !== backtests.length) {
    return { ok: false as const, errorCode: "duplicate_calibration_unit" as const };
  }
  const first = backtests[0]!;
  if (backtests.some((item) => item.seedContextId !== first.seedContextId)) {
    return { ok: false as const, errorCode: "cross_seed_reference" as const };
  }
  if (backtests.some((item) =>
    item.realityBoundaryBinding.evidenceLedgerId !== first.realityBoundaryBinding.evidenceLedgerId ||
    item.realityBoundaryBinding.assumptionLedgerId !== first.realityBoundaryBinding.assumptionLedgerId)) {
    return { ok: false as const, errorCode: "cross_ledger_reference" as const };
  }
  if (backtests.some((item) => !compatibleVersions(first, item))) {
    return { ok: false as const, errorCode: "version_mismatch" as const };
  }
  const eligible = backtests.filter((item) => item.evaluation.calibrationEligible);
  const sufficient = eligible.length >= MIN_CALIBRATION_SAMPLE_SIZE_V2;
  const frequencies = eligible.map((item) => item.evaluation.predictedValue!);
  const observations = eligible.map((item) => item.evaluation.observedValue);
  const mean = sufficient ? frequencies.reduce((sum, value) => sum + value, 0) / eligible.length : null;
  const observedRate = sufficient ? observations.reduce<number>((sum, value) => sum + value, 0) / eligible.length : null;
  const brierScore = sufficient
    ? eligible.reduce((sum, item) => sum + item.evaluation.brierScore!, 0) / eligible.length
    : null;
  const revisions = backtests.flatMap((item) => [
    item.realityBoundaryBinding.forecastRevision,
    item.realityBoundaryBinding.outcomeRevision,
  ]);
  const unsigned: Omit<CalibrationV2, "id" | "calibrationIntegritySignature"> = {
    calibrationSpecId: parsed.data.calibrationSpecId as CalibrationV2["calibrationSpecId"],
    seedContextId: first.seedContextId,
    status: sufficient ? "calibrated" : "insufficient_data",
    metricLabel: sufficient ? "calibrated_simulation_frequency" : "simulation_frequency",
    sampleCount: eligible.length,
    excludedSampleCount: backtests.length - eligible.length,
    minimumSampleSize: MIN_CALIBRATION_SAMPLE_SIZE_V2,
    method: {
      name: CALIBRATION_METHOD_NAME_V2,
      version: CALIBRATION_METHOD_VERSION_V2,
      description: "Mean binary Brier score over independent observation-unit and pre-locked forecast-unit signatures.",
    },
    brierScore,
    meanSimulationFrequency: mean,
    observedRate,
    causalConclusion: false,
    deterministicPrediction: false,
    backtestIds: backtests.map((item) => item.id),
    outcomeIds: backtests.map((item) => item.outcomeId),
    observationUnitSignatures: backtests.map((item) => item.observationUnitSignature),
    forecastUnitSignatures: backtests.map((item) => item.forecastUnitSignature),
    realityBoundaryBinding: {
      evidenceLedgerId: first.realityBoundaryBinding.evidenceLedgerId,
      assumptionLedgerId: first.realityBoundaryBinding.assumptionLedgerId,
      minimumRevision: Math.min(...revisions),
      maximumRevision: Math.max(...revisions),
    },
    limitations: sufficient
      ? [
          "Calibration measures observed binary reliability for this bounded sample; it is not a causal effect estimate or deterministic prediction.",
          "Selection, classification, and evidence uncertainty remain and the result is not automatically a universal real-world probability.",
        ]
      : [
          `Insufficient eligible Outcomes: ${eligible.length}/${MIN_CALIBRATION_SAMPLE_SIZE_V2}; the metric remains simulation frequency.`,
          "No causal conclusion, deterministic prediction, or calibrated real-world probability is available.",
        ],
    sourceBacktests: structuredClone(backtests),
    versions: {
      outcomeCalibrationEngineVersion: OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
      calibrationSchemaVersion: CALIBRATION_SCHEMA_VERSION_V2,
      backtestSchemaVersion: BACKTEST_SCHEMA_VERSION_V2,
      methodVersion: CALIBRATION_METHOD_VERSION_V2,
    },
  };
  const calibration: CalibrationV2 = {
    id: calibrationIdV2(unsigned),
    ...unsigned,
    calibrationIntegritySignature: stage7FingerprintV2(unsigned),
  };
  return { ok: true as const, calibration };
}

export function calibrateBacktestsV2(input: unknown) {
  try {
    return calibrateUnsafeV2(input);
  } catch {
    return { ok: false as const, errorCode: "invalid_calibration_input" as const };
  }
}

export function parseValidatedCalibrationV2(input: unknown) {
  try {
    const candidate = input as { versions?: { outcomeCalibrationEngineVersion?: unknown; calibrationSchemaVersion?: unknown; methodVersion?: unknown } };
    if (
      candidate?.versions?.outcomeCalibrationEngineVersion !== OUTCOME_CALIBRATION_ENGINE_VERSION_V2 ||
      candidate?.versions?.calibrationSchemaVersion !== CALIBRATION_SCHEMA_VERSION_V2 ||
      candidate?.versions?.methodVersion !== CALIBRATION_METHOD_VERSION_V2
    ) return { ok: false as const, errorCode: "version_mismatch" as const };
    const parsed = calibrationSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, errorCode: "calibration_tampering" as const };
    const rebuilt = calibrateUnsafeV2({
      calibrationSpecId: parsed.data.calibrationSpecId,
      method: {
        name: parsed.data.method.name,
        version: parsed.data.method.version,
        minimumSampleSize: parsed.data.minimumSampleSize,
      },
      backtests: parsed.data.sourceBacktests,
    });
    if (!rebuilt.ok || canonicalStage7JsonV2(rebuilt.calibration) !== canonicalStage7JsonV2(input)) {
      return { ok: false as const, errorCode: "calibration_tampering" as const };
    }
    return { ok: true as const, calibration: structuredClone(rebuilt.calibration) };
  } catch {
    return { ok: false as const, errorCode: "calibration_tampering" as const };
  }
}
