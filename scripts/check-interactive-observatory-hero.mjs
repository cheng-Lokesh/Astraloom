import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  root,
  graph,
  agents,
  flows,
  particles,
  climate,
  branches,
  boot,
  panel,
  consoleUi,
  scroll,
  styles,
  page,
] = await Promise.all([
  read("../src/components/hero/interactive-observatory-hero.tsx"),
  read("../src/components/hero/orbit-graph-canvas.tsx"),
  read("../src/components/hero/agent-node-layer.tsx"),
  read("../src/components/hero/relation-flow-layer.tsx"),
  read("../src/components/hero/evidence-particle-layer.tsx"),
  read("../src/components/hero/destiny-climate-ring.tsx"),
  read("../src/components/hero/path-branch-streams.tsx"),
  read("../src/components/hero/system-boot-sequence.tsx"),
  read("../src/components/hero/hero-command-panel.tsx"),
  read("../src/components/hero/hero-cta-console.tsx"),
  read("../src/components/hero/hero-scroll-transition.tsx"),
  read("../src/app/interactive-observatory-hero.css"),
  read("../src/app/page.tsx"),
]);

assert.match(root, /dynamic\([\s\S]*ssr:\s*false/, "The dynamic graph must not SSR.");
assert.match(root, /pointermove/, "The hero must implement pointer parallax.");
assert.match(root, /data-cta-active/, "CTA hover must affect the central system.");
assert.match(root, /ignition/, "Primary CTA must trigger an ignition state.");
assert.match(graph, /AgentNodeLayer/, "The orbit graph must render interactive agents.");
assert.match(graph, /RelationFlowLayer/, "The orbit graph must render relationship flows.");
assert.match(graph, /PathBranchStreams/, "The orbit graph must render future path streams.");
assert.match(agents, /Array\.from\(\{\s*length:\s*32\s*\}/, "Desktop must render 32 agents.");
assert.match(agents, /onPointerEnter/, "Agent nodes must support hover interaction.");
assert.match(flows, /animateMotion|strokeDasharray/, "Relation flows must visibly move.");
assert.match(particles, /desktopCount\s*=\s*104/, "Desktop evidence budget must be close to 100.");
assert.match(particles, /mobileCount\s*=\s*26/, "Mobile evidence budget must be 20-30.");
assert.match(climate, /destiny-climate/, "The climate ring must be a distinct layer.");
assert.match(branches, /current inertia|cautious observation|active push|boundary adjustment/i);
assert.match(boot, /3800/, "The boot ritual must complete at 3.8 seconds.");
assert.match(panel, /Grounding/, "The command panel must remain status-oriented.");
assert.match(consoleUi, /router\.push\("\/app\/start"\)/, "Ignition must navigate to Start.");
assert.match(scroll, /scroll-progress/, "The hero must expose scroll progress.");
assert.match(styles, /prefers-reduced-motion:\s*reduce/, "Reduced motion must be supported.");
assert.match(styles, /@media\s*\(max-width:\s*760px\)/, "Mobile degradation must be explicit.");
assert.match(page, /InteractiveObservatoryHero/, "The new hero must be mounted on the homepage.");

console.log("Interactive observatory hero contract checks passed.");
