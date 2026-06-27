export type MotionState =
  | "idle"
  | "initializing"
  | "active"
  | "source-backed"
  | "low-confidence"
  | "risk"
  | "fallback"
  | "hover"
  | "reduced-motion";

export const motionStateIntensity: Record<MotionState, number> = {
  idle: 0.28,
  initializing: 0.42,
  active: 0.72,
  "source-backed": 0.78,
  "low-confidence": 0.24,
  risk: 0.82,
  fallback: 0.5,
  hover: 0.88,
  "reduced-motion": 0.18,
};

export function seededUnit(index: number, salt = 0) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
