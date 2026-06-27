"use client";

import { useEffect, useState } from "react";

type MotionEnvironment = {
  isMobile: boolean;
  isPageVisible: boolean;
  prefersReducedMotion: boolean;
};

const initialEnvironment: MotionEnvironment = {
  isMobile: false,
  isPageVisible: true,
  prefersReducedMotion: false,
};

export function useMotionEnvironment() {
  const [environment, setEnvironment] = useState(initialEnvironment);

  useEffect(() => {
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 760px)");

    const update = () => {
      setEnvironment({
        isMobile: mobileQuery.matches,
        isPageVisible: document.visibilityState === "visible",
        prefersReducedMotion: reducedQuery.matches,
      });
    };

    update();
    reducedQuery.addEventListener("change", update);
    mobileQuery.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);

    return () => {
      reducedQuery.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return environment;
}
