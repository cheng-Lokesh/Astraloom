"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

const bootStages = [
  { at: 0, stage: 0, label: "WAKE" },
  { at: 400, stage: 1, label: "USER CORE" },
  { at: 900, stage: 2, label: "INNER AGENTS" },
  { at: 1400, stage: 3, label: "OUTER AGENTS" },
  { at: 1800, stage: 4, label: "RELATIONS" },
  { at: 2300, stage: 5, label: "EVIDENCE" },
  { at: 2800, stage: 6, label: "CLIMATE" },
  { at: 3300, stage: 7, label: "PATHS" },
  { at: 3800, stage: 8, label: "ONLINE" },
] as const;

export function SystemBootSequence({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      host.dataset.bootStage = "8";
      host.dataset.bootLabel = "ONLINE";
      return;
    }
    const timers = bootStages.map(({ at, stage, label }) =>
      window.setTimeout(() => {
        host.dataset.bootStage = String(stage);
        host.dataset.bootLabel = label;
      }, at),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [hostRef]);

  return (
    <div className="system-boot-sequence" aria-hidden="true">
      <span>ASTRALOOM / OBSERVATORY</span>
      <i />
      <strong>FIELD ONLINE</strong>
    </div>
  );
}
