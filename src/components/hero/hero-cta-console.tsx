"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

export function HeroCtaConsole({
  onHoverChange,
  onIgnitionChange,
}: {
  onHoverChange: (active: boolean) => void;
  onIgnitionChange: (active: boolean) => void;
}) {
  const router = useRouter();
  const navigatingRef = useRef(false);

  const ignite = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    onIgnitionChange(true);
    window.setTimeout(() => router.push("/app/start"), 720);
  };

  return (
    <div className="hero-cta-console">
      <span className="hero-console-kicker">现实路径观测场</span>
      <strong>Reality-first cinematic sandbox</strong>
      <div>
        <button
          type="button"
          className="hero-ignite-button"
          onPointerEnter={() => onHoverChange(true)}
          onPointerLeave={() => onHoverChange(false)}
          onFocus={() => onHoverChange(true)}
          onBlur={() => onHoverChange(false)}
          onClick={ignite}
        >
          <span>启动真实推演</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
          <i />
        </button>
        <a href="/app/simulation/result" className="hero-demo-link">观看沙盘示例</a>
      </div>
    </div>
  );
}
