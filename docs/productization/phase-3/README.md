# Astraloom Productization Phase 3 / Delivery Step 2

## Authority and status

**Status: Step E executable regression is complete, but the combined rendered
browser replay is BLOCKED by the Codex in-app browser security policy before
any page interaction. Step D and Phase 3 are not accepted; Phase 4 remains
unauthorized.** This is the normative Phase 3 implementation contract. Phase 2 is closed at
`79cc6970d61eb8695b8cdbbbac68de77059f99ea`. Phase 3 does not authorize Phase
4 or any non-goal listed below.

## Core user flow

`submitted Seed -> confirmed Key People -> Agent Profile snapshot -> read-only Relation Graph`

Only a submitted formal Track A Seed can begin this flow. A user first reviews
and manages candidate Key People, then explicitly confirms the people used for
the next snapshot. The system can create Agent snapshots from those confirmed
people and, only where permitted, create a read-only Relation Graph snapshot.
The graph is an orientation and evidence surface, never a relationship editor.

## Data, ownership, and permission contract

- `key_people` are user-owned. Candidate extraction, confirmation, rename,
  deletion, merge, and supplemental people use the current authenticated user
  session, RLS, and atomic `SECURITY INVOKER` RPCs.
- Direct Data API reads on `key_people` have column-level SELECT grants only for
  the product-safe projection. Opaque trace, writer, idempotency, fingerprint,
  source, and field-provenance columns are not browser-readable. Receipt rows
  are hidden outside the guarded RPC transaction. Authenticated roles have no
  hard DELETE/TRUNCATE/TRIGGER/REFERENCES privilege on Key People.
- All reads are scoped to the current owner and a submitted Seed belonging to
  that owner. A user cannot read or act on another user's Seed, people, Agents,
  or graph.
- Browser roles have no table-level INSERT, UPDATE, or DELETE permission for
  `agent_profiles` or `relation_edges`. Do not create a service-role client and
  do not use, read, log, or output a service-role credential.
- Exactly one minimal controlled database writer may write Agent and Relation
  Edge snapshots. It must have a fixed `search_path`, be callable only by
  `authenticated`, require a non-empty `auth.uid`, and re-read the invoking
  user's submitted Seed, confirmed Key People, and current Agent snapshot state.
- The writer must reject cross-owner and cross-Seed references, self-edges,
  missing evidence, illegal weights, and requests from `downgraded` or `blocked`
  safety states. Requests never include client-supplied weights; weights, if
  supported, are derived and validated inside the controlled boundary.
- No general finalizer, arbitrary SQL endpoint, broad stored procedure, or
  alternative Agent/Edge write path is allowed.

## Atomicity, idempotency, and versions

Every mutation is one transaction: either every intended record plus its
required provenance/version links exists, or nothing is written. Any validation,
safety, ownership, or generation failure is a zero-write result.

Idempotency is content-bound and scoped to the owner and operation. Replaying a
request with the same key and canonical content returns the original safe
result. Reusing the key with different canonical content returns HTTP 409 with
`idempotency_key_content_conflict`. Snapshots carry an immutable version,
ownership, submitted-Seed reference, safety state, and opaque trace reference.
All object references in one snapshot must share the same owner and Seed.

## API contract

Responses expose only product-safe fields. They never expose credentials,
browser authentication material, raw user input, idempotency-key content, or trace body. Each response
includes a stable `error_code` on failure and an opaque trace reference suitable
for support correlation.

| Surface | Contract |
|---|---|
| `GET /api/key-people?seed_id=…` | Current owner reads candidate and confirmed Key People for one submitted owned Seed. Anonymous requests and cross-owner references are denied. |
| `POST /api/key-people/extract` | Atomic authenticated extraction or refresh of candidate people for one submitted owned Seed. It writes no downstream Agent or Edge. |
| `POST /api/key-people/confirm` | Atomically confirms selected candidate people. The same controlled family handles rename, delete, merge, and supplemental people; each operation preserves owner/Seed provenance. |
| `GET /api/agents?seed_id=…` | Current owner reads immutable Agent snapshots for one owned submitted Seed. |
| `POST /api/agents/generate` | Uses only confirmed people from the current owner and Seed to create/replay a conservative Agent snapshot through the controlled writer. No client weights. |
| `GET /api/graph?seed_id=…` | Current owner reads the locked, immutable, read-only graph snapshot for one owned submitted Seed. |
| `POST /api/graph/generate` | Uses only valid current Agent snapshots and server-controlled evidence/weights. It is atomic and creates no editable graph. |
| `POST /api/graph/lock` | Locks the complete graph snapshot only when all owner/Seed/evidence/safety invariants pass. A locked graph is read-only. |

Required stable error codes include: `unauthenticated`, `seed_not_found`,
`owner_scope_violation`, `seed_scope_violation`, `key_people_invalid`,
`agent_snapshot_invalid`, `graph_snapshot_invalid`, `graph_locked`,
`safety_downgraded`, `safety_blocked`, `evidence_required`, `illegal_weight`,
`self_edge_forbidden`, and `idempotency_key_content_conflict`. HTTP status must
be stable for a given error code; ownership failures must not disclose whether a
foreign object exists.

## Safety outcomes

- `downgraded` permits only a conservative Agent draft. It creates **zero**
  Relation Edges and cannot lock a graph.
- `blocked` creates **zero** downstream objects: no Agent snapshot and no
  Relation Edge.
- Low-confidence candidates remain visibly provisional and cannot silently
  become confirmed people, Agents, or edges.

## UI journey and recovery

1. The user opens a submitted Seed and sees an explicit empty state when no
   candidate people exist.
2. They inspect candidates and their confidence, confirm the intended people,
   and can rename, delete, merge, or add supplemental people before generation.
3. They generate and review an immutable Agent snapshot, then request a
   read-only graph. Empty, low-confidence, downgraded, blocked, and locked
   states have distinct plain-language explanations and safe next steps.
4. Refresh and sign-out/sign-in recover only the current user's saved formal
   objects. They never upload a local draft, overwrite a formal snapshot, expose
   another owner's data, or unlock a graph.
5. A merge explains which pending candidate is retained and preserves an
   auditable canonical reference without surfacing private raw input. A lock is
   clearly shown and prevents all relationship editing.

## TDD implementation sequence

1. **Step A — formal Seed and Key People:** define contracts, ownership/RLS,
   atomic Key People RPCs, and focused tests.
2. **Step B — Agent snapshot:** define the single controlled writer and
   immutable Agent snapshot contract with unit, API, and database tests.
3. **Step C — Graph snapshot:** add evidence-gated, server-weighted, atomic
   Relation Edge generation and locking tests.
4. **Step D — UI and browser:** implement the people, Agent, and read-only graph
   journey, including refresh/sign-in recovery and failure states.
5. **Step E — regression and docs:** execute the agreed regression matrix,
   document observed results, and re-check this contract against the code.

### Step A implementation record

Step A implementation on `productization/phase-3-people-graph` contains
submitted Track A Seed-owned Key People persistence, database-controlled
deterministic extraction, five-operation management, Seed-bound replay, and
RLS/RPC coverage. The original three-argument extraction RPC was independently
blocked because authenticated callers could inject candidates and duplicate
fingerprints broke replay. The hardening change removes that signature and
normalizes extraction inside the database. A subsequent effective-grant audit
also found private metadata and receipt visibility plus broad hard-table
privileges; the second RED/GREEN revokes those grants, narrows Data API columns,
guards receipts, and preserves provenance through an inaccessible guarded
trigger. Independent task `019fbdaa-ccd6-77a2-a1c7-545ba6a23b74` re-tested the
final Step A SHA and returned PASS, including a separate GitHub branch-head
check. Step B is authorized. See `STEP_A_TDD_EVIDENCE.md` for the RED/GREEN,
blocked, repair, least-privilege, Unicode, and non-destructive database
evidence.

### Step B implementation record

Step B is independently accepted. The current work adds an immutable Agent
snapshot parent, a single
authenticated `SECURITY INVOKER` writer, content-bound replay, conservative
safety routing, safe GET/POST projections, and schema-level ownership,
cardinality, provenance, and safety/error invariants. Browser roles retain no
broad Agent/receipt read or Agent/Edge write path. The applied base migration
was kept immutable when post-apply static analysis found a loop-variable
warning; a separate additive migration removed it and restored zero
`plpgsql_check` diagnostics.

Controller verification observed Step B pgTAP 174/174, Step A 74/74, Phase 2
7/7 and 10/10, Agent API 19/19, and the full 463-test, lint, type, and 105-page
build matrix. Runtime smoke checks returned 200 for the home and Agent pages and
401 for unauthenticated Agent GET/POST. Business-data counts remained
16/0/0/0/16 and `src/lib/v2/**` remained zero-diff. See
`STEP_B_TDD_EVIDENCE.md` for the RED chain, immutable migration hashes,
security/privacy evidence and formal acceptance record. The independent
GPT-5.6-terra high reviewer checked pushed SHA
`590d988a1a46062cf97e882fb06084c97bf85f6e`, repeated every stated database,
API, repository, build, runtime, remote-SHA, V2, and security gate, and returned
PASS with no Step B blocking issue. Step C is authorized.

### Step C implementation record

Step C is independently accepted. The applied Graph migrations add an
owner/Seed/Agent-bound immutable parent, evidence-gated server-derived Edges,
content-bound replay, and a single in-place irreversible lock transition.
Composite foreign keys bind every Edge to its Graph request and safety state
and to endpoint Agents in the same frozen Agent snapshot. Browser roles retain
no arbitrary Graph or Edge mutation path; the two guarded lifecycle triggers
treat an unset, NULL, empty, or non-`on` RPC guard as closed.

Controller verification against the migrated local database observed Graph
pgTAP 162/162, Agent 174/174, Step A 74/74, and Phase 2 7/7 plus 10/10. Graph
API passed 31/31, the full Vitest suite passed 50 files and 494 tests, lint and
type-check passed, and the 108-page production build completed. Business data
counts remained 16/0/0/0/16; Graph test parents and receipts rolled back to
zero; `src/lib/v2/**` remained zero-diff. The independent GPT-5.6-terra high
reviewer reproduced the applied-database Graph suite, migration history and
hashes, API regression, repository state, and frozen-V2 gate at controller
candidate `6a2fa33c3bf12c29c75da8a721a8a43f29588faa`, then returned FINAL PASS.
See `STEP_C_TDD_EVIDENCE.md` for the RED/GREEN chain, the blocked lifecycle
replay finding, the applied-migration NULL-guard repair, and final evidence.
Step D is authorized; Step C acceptance does not authorize Phase 4.

### Step D implementation record

Step D1 replaced the People local-first page with the formal submitted-Seed and
Key People API ledger. It passed controller browser verification, two
independent repair cycles, and final independent review at pushed candidate
`b43187088fef5212b9b8128285b536b98c8aae54`.

Step D2 replaced the Agents local-draft page with strict formal Seed, People,
and immutable Agent snapshot projections. Controller and related API tests,
full lint, type-check, the 108-page build, database baseline, and V2 isolation
passed. Independent reviewer task `01a043e2-2e52-7641-a6a4-3c1660684856`
returned FINAL PASS for code/API candidate
`106aaa8a2fda07a43187d9d44fab32cbf7be851a`. Its 375/1280 rendered replay is
still open because both available browser runtimes were denied before page
interaction.

Step D3 replaced the editable/local Graph surface with the formal read-only
Seed, Agent, Graph generation, and irreversible lock ledger. The controller
rejects inconsistent projections, edges without an NPC endpoint, duplicate or
self relations, stale/downgraded Agent snapshots, and offset-ordering mistakes
when selecting the newest submitted Seed. Root verification observed 22/22
controller and 72/72 related Agent/Graph tests, exact and full lint,
type-check, a 108-page production build, clean whitespace, and frozen V2. The
independent reviewer first blocked an offset-aware Seed ordering defect, then
returned PASS after RED/GREEN repair at candidate
`b20bd21e553a84d87e74e150bc4135a7b148b768` in task
`01a043f8-8378-7050-8351-b519670f2d4d`.

No D3 browser profile or business data was created. The 375/1280 rendered
replay for Agents and Graph remains open in the combined Step D gate. Step E
may execute the aggregate regression and attempt that combined browser gate,
but neither Step D nor Phase 3 is accepted and Phase 4 remains unauthorized.

### Step E implementation record

Step E added an additive, post-apply migration that removes the only
`plpgsql_check` diagnostic from the Graph lock writer without modifying an
already-applied migration. The persistent Graph pgTAP check was first RED
(one diagnostic for an unread `v_seed` declaration) and then GREEN. The new
writer retains its `SECURITY INVOKER`, fixed search path, authenticated-user,
ownership, locking, idempotency, guard-reset, permissions, and zero-write
failure properties; its Seed ownership check now uses `PERFORM` and `FOUND`.

The non-destructive database suite passed Graph 163/163, Agent 174/174, People
74/74, and Phase 2 7/7 plus 10/10; all five Phase 3 writers reported zero
`plpgsql_check` diagnostics and business-data counts were unchanged. Aggregate
People/Agent/Graph API and controller tests passed 125/125. Full Vitest passed
551 tests, coverage remained 90.82% statements / 81.21% branches / 95.44%
functions / 93.52% lines, and lint, type-check, production build (108 static
pages), both current Cinematic Hero checks, whitespace, and frozen V2 checks
passed.

The required rendered browser replay was attempted once using only the Codex
in-app browser and one temporary page. Its first request to
`http://localhost:3000/` was rejected with the browser-security-policy reason
that the user had declined permission. No page content, viewport, login,
network, console, business-data, or UI state was therefore inspected; no
alternative browser or workaround was used. Consequently Step E, Step D, and
Phase 3 are **BLOCKED**, and Phase 4 remains unauthorized. See
`STEP_E_TDD_EVIDENCE.md` for the exact command outcomes, migration hash,
database counts, and browser fact.

## Acceptance matrix

| Area | Required evidence |
|---|---|
| Unit | Canonical content, idempotency, allowed transitions, version immutability, safety routing, no client weights. |
| API | Auth, stable status/error codes, same-key replay, different-content 409, zero-write failure, safe response redaction. |
| pgTAP | `SECURITY INVOKER`, fixed search path, authenticated-only writer, `auth.uid` check, RLS, transaction rollback, ownership and Seed constraints. |
| Two users | Reciprocal read/write isolation across Seeds, people, Agents, and graphs; no existence disclosure. |
| Anonymous | All protected GET/RPC/API paths denied; no object creation. |
| Browser | Confirm/rename/delete/merge/supplement, low-confidence, empty, downgraded, blocked, lock, refresh, and re-login journeys. |
| Recovery | Replays are stable; conflicts are 409; interrupted/failed generation leaves no downstream object. |
| Read-only | Browser and REST table-level DML are denied for Agents/Edges; locked graph has no editing control. |
| Safety | Downgraded produces only a conservative Agent draft and zero edges; blocked produces zero downstream objects. |
| Privacy | No credentials, cookies, raw input, key body, trace body, or cross-user metadata in UI, API, tests, logs, or docs. |
| V2 and regression | `src/lib/v2/**` stays zero-diff to `productization/phase-1-contract`; focused, aggregate, coverage, and required non-destructive checks pass. |

## Allowed file scope

Phase 3 implementation may change only the narrowly necessary files in:
`src/app/api/{key-people,agents,graph}/**`,
`src/app/app/new/{people,agents,graph}/**`, the dedicated non-V2 repository and
contract modules under `src/lib/**`, `supabase/migrations/**`, `tests/**`, and
`docs/productization/phase-3/**` plus directly linked decision/contract docs.
Every changed file must serve formal Seed/Key People, immutable Agent snapshot,
or read-only Graph snapshot behavior. It must not change `src/lib/v2/**`. It
must not introduce code or configuration for runs, workers, events, Claims,
Reports, payments, Track B, or real LLM expansion. Any expansion outside this
scope requires a new explicit authorization.

## Non-goals

This phase does not implement simulation runs, queues or workers, Event Logs,
Claims, Reports, payments, entitlements, Track B, real LLM expansion, editable
edge weights, arbitrary graph editing, service-role access, general-purpose
database writing, production deployment, or Phase 4 work.
