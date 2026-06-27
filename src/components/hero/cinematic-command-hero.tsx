"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { BRAND_NAME } from "@/lib/brand";
import { CommandHeroBackplate } from "./command-hero-backplate";
import { HeroHudPanels } from "./hero-hud-panels";
import { HeroReducedMotionFallback } from "./hero-reduced-motion-fallback";

const CommandHologramCanvas = dynamic(
  () => import("./command-hologram-canvas"),
  { ssr: false, loading: () => null },
);

export function CinematicCommandHero() {
  const rootRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const root = rootRef.current;
      if (!root) return;
      const backplate = root.querySelector(".command-backplate");
      const core = root.querySelector(".command-core-readout");
      const modules = root.querySelectorAll(".command-hud-module");
      const metrics = root.querySelectorAll(".command-hud-metric");
      const status = root.querySelector(".command-status-strip");
      const brand = root.querySelector(".command-brand");
      const actions = root.querySelector(".command-actions");
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
      if (backplate) timeline.fromTo(backplate, { opacity: 0.15 }, { opacity: 1, duration: 1.4 }, 0);
      if (core) timeline.fromTo(core, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.8 }, 0.8);
      if (modules.length) timeline.fromTo(modules, { opacity: 0, x: -12 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.55 }, 2.8);
      if (metrics.length) timeline.fromTo(metrics, { opacity: 0, x: 12 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.55 }, 2.9);
      if (status) timeline.fromTo(status, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6 }, 3.2);
      if (brand) timeline.fromTo(brand, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.6 }, 3.25);
      if (actions) timeline.fromTo(actions, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6 }, 3.35);
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="cinematic-command-hero" aria-label="Astraloom intelligence observatory">
      <CommandHeroBackplate />
      <CommandHologramCanvas />
      <HeroReducedMotionFallback />
      <HeroHudPanels />

      <header className="command-brand">
        <Link href="/" aria-label={`${BRAND_NAME} home`}>
          <span className="command-brand-mark"><i /></span>
          <span>
            <strong>{BRAND_NAME}</strong>
            <small>Scenario Intelligence Observatory</small>
          </span>
        </Link>
      </header>

      <div className="command-actions">
        <Link href="/app/start" className="command-primary-action">
          启动真实推演 <span>↗</span>
        </Link>
        <Link href="/app/simulation/result" className="command-secondary-action">
          查看沙盘示例
        </Link>
      </div>

      <span className="command-corner command-corner-a" />
      <span className="command-corner command-corner-b" />
      <span className="command-corner command-corner-c" />
      <span className="command-corner command-corner-d" />
    </section>
  );
}
