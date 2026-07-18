"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { BRAND_NAME } from "@/lib/brand";
import CommandHologramCanvas from "./command-hologram-canvas";

const statusItems = [
  "Reality Signals",
  "Agent Graph",
  "Event Ledger",
  "Path Branches",
  "Destiny Climate",
];

const focusZones = [
  {
    id: "graph",
    label: "Agent graph",
    detail: "People and pressure lines stay visible before any claim is made.",
    x: "62%",
    y: "42%",
  },
  {
    id: "evidence",
    label: "Evidence ledger",
    detail: "Every visible signal stays tied to a replayable source.",
    x: "38%",
    y: "58%",
  },
  {
    id: "branches",
    label: "Path branches",
    detail: "Possible futures remain plural, with confidence kept in view.",
    x: "69%",
    y: "68%",
  },
] as const;

export function CinematicCommandHero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointerFrame = 0;
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const renderPointer = () => {
      pointer.x += (target.x - pointer.x) * 0.075;
      pointer.y += (target.y - pointer.y) * 0.075;
      root.style.setProperty("--pointer-x", pointer.x.toFixed(3));
      root.style.setProperty("--pointer-y", pointer.y.toFixed(3));
      pointerFrame = requestAnimationFrame(renderPointer);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      const rect = root.getBoundingClientRect();
      const localX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const localY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      target.x = (localX - 0.5) * 2;
      target.y = (localY - 0.5) * 2;
      root.style.setProperty("--cinema-x", `${(localX * 100).toFixed(2)}%`);
      root.style.setProperty("--cinema-y", `${(localY * 100).toFixed(2)}%`);
    };
    const handlePointerLeave = () => {
      target.x = 0;
      target.y = 0;
      root.style.setProperty("--cinema-x", "50%");
      root.style.setProperty("--cinema-y", "50%");
    };
    const updateScroll = () => {
      const rect = root.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(window.innerHeight * 0.9, 1)));
      root.style.setProperty("--scroll-progress", progress.toFixed(3));
    };

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();
    pointerFrame = requestAnimationFrame(renderPointer);
    return () => {
      cancelAnimationFrame(pointerFrame);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const markReady = () => {
      if (rootRef.current) rootRef.current.dataset.videoReady = "true";
    };
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);
    return () => {
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
    };
  }, []);

  const setFocusZone = (zone: string | null) => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.focusZone = zone ?? "none";
    const video = videoRef.current;
    if (video) video.playbackRate = zone ? 0.72 : 1;
  };

  const markVideoReady = () => {
    if (rootRef.current) rootRef.current.dataset.videoReady = "true";
  };

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".command-brand, .command-actions, .command-status-rail, .command-boot-line, .command-narrative, .command-focus-zone", {
          opacity: 1,
          y: 0,
        });
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".command-blackout", { opacity: 1 }, { opacity: 0, duration: 1.4 }, 0)
        .fromTo(".command-video-stage", { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.8 }, 0.15)
        .fromTo(".command-brand", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.7 }, 1.15)
        .fromTo(".command-narrative", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.82 }, 1.7)
        .fromTo(".command-focus-zone", { opacity: 0, scale: 0.82 }, { opacity: 1, scale: 1, stagger: 0.12, duration: 0.6 }, 2.15)
        .fromTo(".command-status-rail li", { opacity: 0, x: 14 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.55 }, 2.35)
        .fromTo(".command-actions", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.65 }, 2.75)
        .fromTo(".command-boot-line", { opacity: 0 }, { opacity: 1, duration: 0.55 }, 3.05);
    },
    { scope: rootRef },
  );

  const startIgnition = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const root = rootRef.current;
    if (!root) {
      router.push("/app/start");
      return;
    }
    root.dataset.ignition = "true";
    window.setTimeout(() => router.push("/app/start"), 560);
  };

  return (
    <main className="command-home">
      <section
        ref={rootRef}
        className="cinematic-command-hero"
        data-cta-active="false"
        data-focus-zone="none"
        data-ignition="false"
        aria-label="Astraloom cinematic scenario sandbox"
      >
        <div className="command-sticky-stage">
          <div className="command-blackout" aria-hidden="true" />
          <div className="command-video-stage" aria-hidden="true">
            <video
              ref={videoRef}
              className="command-hero-video"
              src="/hero/astraloom-founder-cinematic-hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedMetadata={markVideoReady}
              onLoadedData={markVideoReady}
              onCanPlay={markVideoReady}
            />
            <div className="command-video-grade" />
          </div>
          <div className="command-procedural-atmosphere" aria-hidden="true" />
          <div className="command-world-canvas">
            <CommandHologramCanvas />
          </div>
          <div className="command-cinema-light" aria-hidden="true" />

          <header className="command-brand">
            <Link href="/" aria-label={`${BRAND_NAME} home`}>
              <span className="command-brand-mark"><i /></span>
              <span>
                <strong>{BRAND_NAME}</strong>
                <small>Scenario Intelligence Observatory</small>
              </span>
            </Link>
          </header>

          <div className="command-narrative">
            <span>REALITY-FIRST SIMULATION FIELD</span>
            <h1>Enter the scene before the answer appears.</h1>
            <p>
              Load a real relationship or decision into a living sandbox, then watch agents,
              evidence and possible paths separate from guesswork.
            </p>
          </div>

          <div className="command-focus-map" aria-label="Interactive hero focus points">
            {focusZones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={`command-focus-zone command-focus-zone-${zone.id}`}
                style={{ left: zone.x, top: zone.y }}
                onPointerEnter={() => setFocusZone(zone.id)}
                onPointerLeave={() => setFocusZone(null)}
                onFocus={() => setFocusZone(zone.id)}
                onBlur={() => setFocusZone(null)}
              >
                <i aria-hidden="true" />
                <span>
                  <strong>{zone.label}</strong>
                  <small>{zone.detail}</small>
                </span>
              </button>
            ))}
          </div>

          <aside className="command-status-rail" aria-label="Observatory status">
            <ol>
              {statusItems.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <i />
                </li>
              ))}
            </ol>
          </aside>

          <div className="command-actions">
            <Link
              href="/app/start"
              className="command-primary-action"
              onMouseEnter={() => {
                if (rootRef.current) rootRef.current.dataset.ctaActive = "true";
              }}
              onMouseLeave={() => {
                if (rootRef.current) rootRef.current.dataset.ctaActive = "false";
              }}
              onFocus={() => {
                if (rootRef.current) rootRef.current.dataset.ctaActive = "true";
              }}
              onBlur={() => {
                if (rootRef.current) rootRef.current.dataset.ctaActive = "false";
              }}
              onClick={startIgnition}
            >
              启动真实推演 <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/app/simulation/result" className="command-secondary-action">
              查看沙盘示例
            </Link>
          </div>

          <div className="command-boot-line" aria-hidden="true">
            <span>SOURCE-BACKED</span>
            <i />
            <span>AGENT GRAPH ONLINE</span>
            <i />
            <span>PATH BRANCHES LIVE</span>
          </div>
          <div className="command-ignition-flash" aria-hidden="true" />
          <span className="command-corner command-corner-a" />
          <span className="command-corner command-corner-b" />
          <span className="command-corner command-corner-c" />
          <span className="command-corner command-corner-d" />
        </div>
      </section>

      <section className="command-flow" aria-label="Astraloom product method">
        <div className="command-flow-head">
          <span>REALITY BEFORE FATE</span>
          <h2>What enters the observatory becomes traceable.</h2>
        </div>
        <div className="command-flow-grid">
          {[
            ["01", "Reality Signals", "User context is treated as evidence, not decoration."],
            ["02", "Agent Graph", "People, constraints, pressure and support become a living relation field."],
            ["03", "Event Ledger", "Every conclusion can be replayed back to a grounded event record."],
            ["04", "Path Branches", "Several possible paths stay visible without pretending certainty."],
          ].map(([index, title, body]) => (
            <article key={title}>
              <small>{index}</small>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
