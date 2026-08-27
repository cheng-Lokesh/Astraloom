# Phase 3 Step D3 — Graph UI TDD Evidence

Status: D3 implements the formal, read-only Graph UI only. It does not accept
Step D as a whole, Step E, Phase 4, any migration, any V2 change, any push, or
browser-rendered acceptance.

## Scope and guarantees

`/app/new/graph` now uses only the current account's newest submitted Seed,
`GET /api/agents?seed_id=...`, `GET /api/graph?seed_id=...`,
`POST /api/graph/generate`, and `POST /api/graph/lock`. The typed controller
rejects unknown or inconsistent API projections and has no repository,
localStorage, edit, unlock, raw-input, or trace-body fallback. It keeps a prior
safe Graph visible after failed or blocked mutations, disables controls before
the request starts, and creates one fresh UUID for each generate or lock action.

The Graph remains a server-derived evidence ledger: edge weights are displayed
only as returned by the server, and the UI offers no node, edge, weight, or lock
editing control. Locking is an explicit irreversible complete-snapshot action.

## RED

The following commands were run separately before production implementation:

| RED target | Command | Exit | Observed failure |
|---|---|---:|---|
| Formal Graph client | `npx vitest run src/lib/graph/formal-graph-client.test.ts --reporter=verbose` | 1 | Intentional missing-module failure for `formal-graph-client`. |
| Graph GET timestamp | `npx vitest run src/app/api/graph/route.phase3.test.ts --reporter=verbose` | 1 | A valid locked `locked_at` with `+00:00` produced 500 instead of 200. |
| Graph generate replay timestamp | `npx vitest run src/app/api/graph/generate/route.phase3.test.ts --reporter=verbose` | 1 | A valid locked replay with `+00:00` produced 500 instead of 200. |
| Graph lock timestamp | `npx vitest run src/app/api/graph/lock/route.phase3.test.ts --reporter=verbose` | 1 | A valid lock result with `+00:00` produced 500 instead of 201. |

The timestamp REDs are the controller-authorized D3 integration exception:
local Supabase `timestamptz` may project an offset such as `+00:00`, while the
three Graph route schemas accepted only Zulu (`Z`) strings. The minimal GREEN
change is `z.string().datetime({ offset: true })` in Graph GET, generate, and
lock schemas; it changes no writer, migration, RPC request, or V2 code.

## GREEN

| Guarantee | Test coverage |
|---|---|
| Latest submitted Seed drives authenticated Agent and Graph recovery | controller recovery test |
| Auth, no Seed, no Agent, malformed payload, empty Graph, downgraded, and blocked states fail safely | controller state tests |
| Generation requires a non-downgraded immutable Agent snapshot with an NPC; it sends only selector and fresh UUID | controller generation tests |
| Locked, 404, idempotency conflict, 500, malformed schema, and in-flight actions retain the last safe read-only Graph and never expose trace/raw fields | controller failure tests |
| Lock uses a new UUID and accepts only a complete current server Graph; no automatic 409 retry occurs | controller lock tests |
| UI synchronization observes pending state immediately and again after settlement | controller UI action test |
| Graph GET/generate/lock accept valid Supabase `+00:00` timestamps while retaining strict safe projections | focused Graph API tests |

## Required verification

Each command was run as its own command. Exit codes below are the actual results
from this D3 execution.

| Check | Command | Exit | Result |
|---|---|---:|---|
| D3 controller | `npx vitest run src/lib/graph/formal-graph-client.test.ts --reporter=verbose` | 0 | 1 file, 14/14 passed. |
| Related Graph and Agent API regression | `npx vitest run src/lib/graph/formal-graph-client.test.ts src/app/api/agents/route.phase3.test.ts src/app/api/agents/generate/route.phase3.test.ts src/app/api/graph/route.phase3.test.ts src/app/api/graph/generate/route.phase3.test.ts src/app/api/graph/lock/route.phase3.test.ts --reporter=verbose` | 0 | 6 files, 64/64 passed. |
| Exact D3 ESLint | `npx eslint src/app/app/new/graph/page.tsx src/lib/graph/formal-graph-client.ts src/lib/graph/formal-graph-client.test.ts src/app/api/graph/route.ts src/app/api/graph/generate/route.ts src/app/api/graph/lock/route.ts` | 0 | passed. |
| TypeScript | `npm run type-check` | 0 | `next typegen` and `tsc --noEmit` passed. |
| Whitespace | `git diff --check` | 0 | passed (Git emitted only CRLF conversion warnings). |
| Frozen V2 | `git diff --exit-code productization/phase-1-contract -- src/lib/v2` | 0 | zero diff. |

## Browser and data note

The available browser CLI remains restricted in this environment, so no browser
profile, authenticated account, Seed, Agent, Graph, receipt, or other business
data was created for D3. No rendered 375/1280 acceptance is claimed here; that
open acceptance debt remains with the controller's combined Step D browser gate.

No migration or V2 file was changed. This D3 execution did not perform database
fixture runs or business-data writes.

## Non-goals

No editable Graph surface, local fallback, Step E, Phase 4, simulation, event,
Claim, Report, payment, V2, migration, API expansion, deployment, cache, or
push was added.
