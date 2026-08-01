# Astraloom Productization Phase 3 / Delivery Step 2

## Authority and status

**Status: authorized and in implementation; not complete.** This is the
normative Phase 3 implementation contract. Phase 2 is closed at
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

### Step A delivery record

Step A is complete on `productization/phase-3-people-graph`: submitted Track A
Seed-owned Key People persistence, deterministic extraction, five-operation
management, content-bound replay, and RLS/RPC coverage are implemented. It does
not authorize Step B Agent snapshots, graph generation, UI work, or any other
later step. See `STEP_A_TDD_EVIDENCE.md` for the RED/GREEN checkpoints and
non-destructive database evidence.

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
