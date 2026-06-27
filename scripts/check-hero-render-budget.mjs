import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/living-observatory-field.tsx", import.meta.url),
  "utf8",
);
const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const heroStyles = await readFile(
  new URL("../src/app/reality-hero.css", import.meta.url),
  "utf8",
);
const motionGuard = await readFile(
  new URL("../src/components/motion/reduced-motion-guard.ts", import.meta.url),
  "utf8",
);
const motionTokens = await readFile(
  new URL("../src/lib/motion/motion-tokens.ts", import.meta.url),
  "utf8",
);

assert.match(source, /void import\("three"\)/, "The observatory must lazy-load Three.js.");
assert.match(
  source,
  /powerPreference: "high-performance"/,
  "The WebGL renderer must request the high-performance GPU.",
);
assert.match(
  source,
  /setPixelRatio\(Math\.min\(window\.devicePixelRatio, 1\.25\)\)/,
  "The WebGL scene must cap device-pixel ratio.",
);
assert.match(source, /TubeGeometry/, "The simulation field must include physical future paths.");
assert.match(
  source,
  /new THREE\.ShaderMaterial/,
  "The complete environment must be animated by the shared WebGL renderer.",
);
assert.match(
  source,
  /roadFlow[\s\S]*orbitalFlow[\s\S]*corePulse/,
  "The animated environment must include infrastructure flow and core energy motion.",
);
assert.match(
  source,
  /backgroundUniforms\.uMotion\.value = 0/,
  "The animated environment must provide a reduced-motion state.",
);
assert.match(source, /CatmullRomCurve3/, "The future paths must use continuous spatial curves.");
assert.match(
  source,
  /routeCount = environmentRef\.current\.isMobile \? 7 : 12/,
  "The foundation must keep a bounded responsive road network.",
);
assert.match(
  source,
  /groundRouteSystems\.forEach/,
  "The foundation roads must participate in the shared render loop.",
);
assert.match(source, /MeshPhysicalMaterial/, "The palace must include physical glass.");
assert.match(source, /ResizeObserver/, "The WebGL scene must resize with its container.");
assert.match(
  `${motionGuard}\n${heroStyles}`,
  /prefers-reduced-motion: reduce/,
  "The WebGL scene must respect reduced motion.",
);
assert.match(
  motionGuard,
  /visibilitychange/,
  "The motion system must react to page visibility.",
);
assert.match(
  source,
  /motionTokens\.orbitDurations/,
  "Orbit motion must use shared motion tokens.",
);
assert.match(
  motionTokens,
  /climate: 26/,
  "The motion system must define a climate duration token.",
);
assert.match(
  source,
  /dustCount = environmentRef\.current\.isMobile \? 10 : 32/,
  "Particles must stay within desktop and mobile budgets.",
);
assert.match(
  source,
  /classList\.add\("is-visual-ready", "is-webgl-ready"\)/,
  "The scene must reveal only after WebGL initialization.",
);
assert.match(
  layout,
  /rel="preload"[\s\S]*astraloom-reality-field-v1\.webp/,
  "The reality-field environment must be preloaded.",
);
assert.match(page, /className="fidelity-visual-stage"/, "The hero needs one visual stage.");
assert.match(
  heroStyles,
  /astraloom-reality-field-v1\.webp/,
  "The hero must use the high-detail reality-field environment.",
);
assert.match(
  heroStyles,
  /\.observatory-webgl-canvas \{[\s\S]*width: 100%;[\s\S]*height: 100%;/,
  "The WebGL scene must remain full-bleed.",
);

console.log("Hero render budget checks passed.");
