export const motionTokens = {
  duration: {
    micro: 0.18,
    fast: 0.35,
    normal: 0.8,
    slow: 2.4,
    ambient: 8,
    orbit: 18,
    climate: 26,
  },
  easing: {
    precision: "cubic-bezier(0.16, 1, 0.3, 1)",
    signal: "cubic-bezier(0.22, 1, 0.36, 1)",
    ambient: "linear",
    pulse: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  intensity: {
    background: 0.18,
    orbit: 0.32,
    line: 0.45,
    node: 0.55,
    evidence: 0.7,
    risk: 0.82,
  },
  orbitDurations: [16, 22, 31],
  edgeFlowRange: [2.8, 5.6],
  particleFlowRange: [3.2, 7.5],
  nodeDelayStep: 0.17,
  panelDelayStep: 0.08,
} as const;

export type MotionTokens = typeof motionTokens;
