import { expect, it } from "vitest";
import { outcomeCalibrationSelectionSchema, formalOutcomeProjectionSchema } from "./contracts";
it("uses immutable correction selectors instead of mutable list ordinals",()=>{
  expect(outcomeCalibrationSelectionSchema.safeParse({version:1,correction_keys:[`correction-v1-${"a".repeat(64)}`],confirmed:true}).success).toBe(true);
  expect(outcomeCalibrationSelectionSchema.safeParse({version:1,correction_keys:["correction-1"],confirmed:true}).success).toBe(false);
});
it("can represent a Core-validated calibration without inventing it",()=>{
  expect(formalOutcomeProjectionSchema.shape.calibration.shape.status.safeParse("calibrated").success).toBe(true);
});
