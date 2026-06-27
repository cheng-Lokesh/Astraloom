"use client";

import { useEffect, useRef } from "react";

const desktopCount = 104;
const mobileCount = 26;

type Particle = {
  lane: number;
  offset: number;
  speed: number;
  size: number;
};

const quadratic = (start: number, control: number, end: number, progress: number) => {
  const inverse = 1 - progress;
  return inverse * inverse * start + 2 * inverse * progress * control + progress * progress * end;
};

export default function EvidenceParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.closest<HTMLElement>(".interactive-observatory-hero");
    if (!canvas || !host) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const count = isMobile ? mobileCount : desktopCount;
    const particles: Particle[] = Array.from({ length: count }, (_, index) => ({
      lane: index % 4,
      offset: index / count,
      speed: 0.018 + (index % 9) * 0.0014,
      size: 0.7 + (index % 4) * 0.34,
    }));
    let frame = 0;
    let width = 0;
    let height = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      context.clearRect(0, 0, width, height);
      const evidenceOnline = Number(host.dataset.bootStage ?? "0") >= 5;
      if (evidenceOnline) {
        const centerX = width * 0.5;
        const centerY = height * 0.53;
        particles.forEach((particle) => {
          if (!reducedMotion) particle.offset = (particle.offset + particle.speed * delta) % 1;
          const side = particle.lane % 2 === 0 ? -1 : 1;
          const vertical = particle.lane < 2 ? -1 : 1;
          const startX = centerX + side * width * 0.42;
          const startY = centerY + vertical * height * 0.24;
          const controlX = centerX + side * width * 0.18;
          const controlY = centerY - vertical * height * 0.08;
          const x = quadratic(startX, controlX, centerX, particle.offset);
          const y = quadratic(startY, controlY, centerY, particle.offset);
          const alpha = Math.sin(particle.offset * Math.PI) * 0.82;
          context.beginPath();
          context.fillStyle = `rgba(250, 202, 112, ${alpha})`;
          context.shadowColor = "rgba(250, 202, 112, .85)";
          context.shadowBlur = 7;
          context.arc(x, y, particle.size, 0, Math.PI * 2);
          context.fill();
        });
      }
      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="evidence-particle-canvas" aria-hidden="true" />;
}
