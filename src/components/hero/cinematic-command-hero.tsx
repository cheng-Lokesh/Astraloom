"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { BRAND_NAME } from "@/lib/brand";
import CommandHologramCanvas from "./command-hologram-canvas";

const statusItems = [
  "Seed context",
  "People confirmation",
  "Agent snapshots",
  "Locked graph",
  "Run and history",
];

const focusZones = [
  {
    id: "graph",
    label: "People and Agents",
    detail: "Confirm the people in your situation before their read-only snapshots are used.",
    x: "62%",
    y: "42%",
  },
  {
    id: "evidence",
    label: "Graph and Run",
    detail: "Lock the relationship graph, then begin one account-backed Run.",
    x: "38%",
    y: "58%",
  },
  {
    id: "branches",
    label: "History and Feedback",
    detail: "Revisit a completed Run and add feedback without rewriting its evidence.",
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
      router.push("/app/new/scene");
      return;
    }
    root.dataset.ignition = "true";
    window.setTimeout(() => router.push("/app/new/scene"), 560);
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
                <small>个人数字生命沙盘</small>
              </span>
            </Link>
          </header>

          <div className="command-narrative">
            <span>PERSONAL DIGITAL-LIFE SANDBOX</span>
            <h1>Start with your situation, then build a path you can revisit.</h1>
            <p>
              Astraloom guides one formal account path: Seed, People, Agents, a locked Graph,
              then a Run you can find again in History and calibrate with Feedback.
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

          <aside className="command-status-rail" aria-label="Formal account path">
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
              href="/app/new/scene"
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
              开始我的沙盘 <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/login" className="command-secondary-action">
              登录后继续
            </Link>
          </div>

          <div className="command-boot-line" aria-hidden="true">
            <span>FORMAL ACCOUNT PATH</span>
            <i />
            <span>NO SAMPLE RESULT</span>
            <i />
            <span>SERVER-BACKED HISTORY</span>
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
          <span>YOUR PATH, KEPT HONEST</span>
          <h2>Each stage has one clear job before a formal Run begins.</h2>
        </div>
        <div className="command-flow-grid">
          {[
            ["01", "Seed", "Describe one current situation with the details you choose to provide."],
            ["02", "People and Agents", "Confirm the important people before immutable Agent snapshots are prepared."],
            ["03", "Locked Graph and Run", "Review the relationship structure, lock it, and start a formal account Run."],
            ["04", "History and Feedback", "Return to a completed Run from your account History and add future-facing feedback."],
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
