import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [page, hero, canvas, styles] = await Promise.all([
  read("../src/app/page.tsx"),
  read("../src/components/hero/cinematic-command-hero.tsx"),
  read("../src/components/hero/command-hologram-canvas.tsx"),
  read("../src/app/cinematic-command-hero.css"),
]);

assert.match(page, /CinematicCommandHero/, "The active cinematic hero must be mounted on the homepage.");
assert.match(canvas, /void import\("three"\)/, "The hologram must lazy-load Three.js.");
assert.match(canvas, /powerPreference:\s*"high-performance"/, "The WebGL renderer must request the high-performance GPU.");
assert.match(
  canvas,
  /setPixelRatio\(Math\.min\(window\.devicePixelRatio, mobile \? 1 : 1\.5\)\)/,
  "The hologram must cap its device-pixel ratio.",
);
assert.match(canvas, /const nodeCount = mobile \? 20 : 36/, "The hologram must keep responsive node budgets.");
assert.match(canvas, /const evidenceCount = mobile \? 36 : 96/, "The hologram must keep responsive evidence budgets.");
assert.match(canvas, /ResizeObserver/, "The hologram must resize with its container.");
assert.match(canvas, /prefers-reduced-motion: reduce/, "The hologram must skip WebGL for reduced motion.");
assert.match(hero, /preload="auto"/, "The active video background must declare its preload policy.");
assert.match(hero, /autoPlay[\s\S]*muted[\s\S]*loop[\s\S]*playsInline/, "The video background must be safe for inline autoplay.");
assert.match(styles, /@media \(max-width: 900px\)/, "The hero must define a mobile layout.");
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/, "The hero must define a reduced-motion fallback.");
assert.match(styles, /overflow: clip/, "The homepage hero must clip visual overflow.");

console.log("Cinematic hero render budget checks passed.");
