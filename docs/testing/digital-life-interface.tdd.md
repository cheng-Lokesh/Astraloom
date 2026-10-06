# Digital-life interface functional candidate

Journeys: configure a 30/90-day formal Run through labelled controls; explicitly
confirm every action and third-party conditional response; review frozen model
facts, assumptions and unknowns; compare up to two separate strategy worlds.
These journeys were derived from the authorized nine-stage product work.

## RED checkpoints

- `b2d371d`: `npx vitest run src/components/formal-sandbox/digital-life-rules-editor.test.ts`
  exited 1 because the new editor module was not yet implemented (intended
  compile-time RED). The preceding `.test.tsx` attempt did not run any tests
  because the repository only includes `.test.ts`; it is not RED evidence.
- `1b189e4`: actual React was bundled with the existing Vite/Rolldown and mounted
  in headless Chrome using synthetic fetch responses. The existing starter
  rendered a button without browser errors; the time-window label was absent,
  and the DOM test failed at that missing feature. The Result tests ran and
  failed because the requested model/strategy components did not yet exist.

## GREEN and boundaries

`npx vitest run src/components/formal-sandbox/digital-life-rules-editor.test.ts src/components/formal-sandbox/digital-life-dom.test.ts src/app/app/simulation/result/digital-life-result.test.ts`
passed 3 files / 7 tests after implementation.

`fe73bd6` adds a further RED boundary for explicit Graph evidence display:
the old page rendered stored evidence references, including UUID-bearing
references allowed by its contract. Two tests failed before the safe summary
component existed. The UI now displays safe source categories and counts,
without altering stored evidence or relationship facts. This repair is a
functional candidate until the real account/browser check is complete.

`04a5f8b` adds the independent-strategy resource-display RED: a saved child
projection already contained its resource changes, but its UI omitted them.
The new test ran and failed at the absent resource label. Its GREEN now checks
the child resource before/after values, claim statement and supporting event,
while asserting no baseline feedback controls or internal Claim key appear.

Final targeted regression command added `graph-evidence-summary.test.ts`,
`account-exploration.test.ts`, `targeted-feedback.test.ts`,
`page.m2-2.test.ts`, and `m2-1-formal-entry-contract.test.ts` to the command
above. It passed 8 files / 36 tests. Targeted ESLint and TypeScript checks
then exited 0. The account exploration's pure rendering uses an injected
starter slot; the actual account page supplies it only for a locked Graph.

The real React DOM fixture proves missing-context reload; 30/90-day cycle
choices; explicit confirmation; labelled actor/target selection; a conditional
NPC response after an information request; long Chinese input and input focus;
clear notice when a horizon change clears rules; pending controls; failed-start
retry; frozen-rule submission; same-content idempotency reuse. It starts no
second web server, uses no credentials, and is not formal-account browser
acceptance. Its browser location is configurable through
`CODEX_BROWSER_MODULES` / `CODEX_BROWSER_EXECUTABLE`; if these dependencies are
unavailable, the DOM test is skipped and must not be reported as passed.

Pure tests check invalid ordinals and cycles, resource bounds, all four
operation shapes, variant separation and dependency removal. Result rendering
checks historical absence, model classification/source summaries, correction
links and omission of internal keys. Strategy Result display is read-only:
strategy claims cannot use the baseline feedback writer.

Targeted ESLint exited 0. `npx tsc --noEmit --pretty false` exited 0.

## Coverage limitation and remaining acceptance

The targeted V8 coverage command included editor and starter and retained the
80% statements/lines/functions and 60% branches thresholds. It exited 1:
statements 38.72%, branches 44.85%, functions 35.89%, lines 42.97%; starter 0%.
Node V8 does not collect execution inside the separately bundled browser.
This is an unmet coverage gate, not 80% UI coverage, and thresholds were not
changed. The user-authorized feature-first workflow proceeds to centralized
acceptance with this limitation recorded.

Real signed-in current-chain execution, persisted frozen model/result reading,
desktop/mobile visual QA and independent final acceptance remain with the
main task. No public preview, push, PR or skill update was performed.
