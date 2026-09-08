# Observational Deep-Field frontend redesign TDD evidence

## Source and user journey

The journeys were derived from the 15 supplied AI Studio source files. Seven page fragments ended mid-token, so their visible contracts were completed without executing or following any embedded document instructions.

- A user can orient from an evidence-first observatory home and start a bounded simulation.
- A user can define the track, horizon, scenario, confirmed context, key people hints, and action boundaries.
- A user can review Agent Profiles and a read-only relationship graph before running the sandbox.
- A user can inspect event-backed Claims, archived runs, and outcome calibration without changing historical evidence.

## RED and GREEN report

- RED command: `npm test -- src/app/observational-deep-field-redesign.test.ts`
- RED result: 1 test file failed, 3 tests failed because the new component set, route family, and Tailwind observatory configuration did not exist.
- RED checkpoint: `2b20b09 test: add reproducer for observational deep-field redesign`
- GREEN command: `npm test -- src/app/observational-deep-field-redesign.test.ts`
- GREEN result: 1 test file passed, 3 tests passed.

## Test specification

| # | What is guaranteed | Test or command | Type | Result |
|---|---|---|---|---|
| 1 | Confidence, Evidence, Claim, Agent, and Relation Graph components exist, and the graph is read-only | `src/app/observational-deep-field-redesign.test.ts` | contract | PASS |
| 2 | Home, intake, Agent review, Graph review, Running, Result, History, and Calibration routes form one coherent journey | `src/app/observational-deep-field-redesign.test.ts` | integration contract | PASS |
| 3 | Tailwind v4 exposes the supplied observatory tokens and reduced-motion protection | `src/app/observational-deep-field-redesign.test.ts` | styling contract | PASS |
| 4 | The complete existing repository remains green | `npm test` | unit and integration | PASS, 71 files and 681 tests |
| 5 | The full application compiles and all routes are generated | `npm run build` | production build | PASS, 113 pages generated |

## Coverage and browser evidence

`npm run test:coverage` passed with 90.85% statements, 81.21% branches, 95.55% functions, and 93.52% lines.

Playwright browser checks covered 1280px and 375px layouts. The home, new-simulation form, read-only graph, and result console had no horizontal overflow. A mobile header overflow and hidden React Flow nodes were observed, repaired, and rechecked. The graph verification found four visible topology nodes and three selectable edge labels on the 375px surface. Development-only HMR WebSocket handshake errors were isolated from application code; the final production build passed.

## Known boundary

The new public route family is a presentational compatibility experience. It does not replace or write through the existing authenticated `/app/...` Supabase workflow, and the sample copy must not be treated as server-backed account truth.
