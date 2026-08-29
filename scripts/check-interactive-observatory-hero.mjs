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
assert.match(hero, /pointermove/, "The hero must implement pointer parallax.");
assert.match(hero, /data-cta-active/, "CTA hover must affect the visual system.");
assert.match(hero, /data-focus-zone/, "Focus zones must update the visual system.");
assert.match(hero, /data-ignition/, "The primary CTA must trigger an ignition state.");
assert.match(hero, /router\.push\("\/app\/start"\)/, "Ignition must navigate to Start.");
assert.match(hero, /onFocus=\{\(\) => setFocusZone/, "Focus-zone interaction must be keyboard-accessible.");
assert.match(hero, /aria-label="Interactive hero focus points"/, "Focus zones must have an accessible label.");
assert.match(hero, /loadedmetadata[\s\S]*loadeddata[\s\S]*canplay/, "The video stage must react to readiness events.");
assert.match(canvas, /pointermove/, "The hologram must support pointer interaction.");
assert.match(canvas, /command-webgl-unavailable/, "WebGL initialization failure must retain the visual fallback.");
assert.match(styles, /@media \(max-width: 640px\)/, "Mobile degradation must be explicit.");
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/, "Reduced motion must be supported.");

console.log("Cinematic hero interaction checks passed.");
