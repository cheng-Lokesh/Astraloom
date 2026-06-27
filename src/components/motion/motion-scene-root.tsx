"use client";

import { useEffect, useRef } from "react";

import { LivingObservatoryField } from "@/components/living-observatory-field";
import { useMotionEnvironment } from "@/components/motion/reduced-motion-guard";

export function MotionSceneRoot() {
  const environment = useMotionEnvironment();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const home = rootRef.current?.closest<HTMLElement>(".fidelity-home");
    if (!home) return;

    home.dataset.motionMode = environment.prefersReducedMotion
      ? "reduced-motion"
      : "full-motion";
    home.dataset.motionVisible = String(environment.isPageVisible);
    home.dataset.motionMobile = String(environment.isMobile);
  }, [environment]);

  return (
    <div
      ref={rootRef}
      className="motion-scene-root"
      data-motion-mode={
        environment.prefersReducedMotion ? "reduced-motion" : "full-motion"
      }
      data-motion-visible={environment.isPageVisible}
      data-motion-mobile={environment.isMobile}
      aria-hidden="true"
    >
      <LivingObservatoryField environment={environment} />
    </div>
  );
}
