# Astraloom Phase 4 / M1 Formal Account Sandbox Loop

Status: M1 implementation and local authenticated acceptance complete on
2026-08-30, starting from
`productization/phase-3-people-graph@0bbb9a76cb35c0d985e3c643535a28675d7cd192`.

The accepted Phase 4 head is recorded in `M1_ACCEPTANCE_EVIDENCE.md`. M1 stops
at the formal account Track A loop; no M2 work is included in that acceptance.

## M2.0 follow-up status

M2.0 is an authorized, narrow candidate slice after M1. It replaces only the
logged-in dashboard and primary navigation with a truthful My Sandbox overview.
It does not accept the whole second phase, change M1 acceptance, or authorize
M2.1, M3, a complete digital-life model, Reality Profile, Destiny engine,
resource model, World State schema, public landing, billing, admin, Simple Mode,
or V2 Core work. Detailed RED/GREEN and gate evidence is recorded in
`M2_0_CANDIDATE_EVIDENCE.md` and `../../testing/m2-0-sandbox-overview.tdd.md`.

## Product outcome

Phase 4 connects the submitted account Seed, confirmed People, immutable Agent
snapshot, and locked read-only Relation Graph to one formal Track A run. The
run persists its immutable input, controlled execution, Events, Claims, Report,
Feedback, and account History in Supabase. A browser refresh, sign-out/sign-in,
or a new browser context must recover the same stored result.

Career is the first Golden Case, not the identity of Astraloom. Track B, real
AI, payments, privileged browser writers, broad shell redesign, and legacy
writer/admin cleanup are not part of M1.

## Product invariants

- Reality, Hypothesis, Simulation, and Symbolic Lens remain separate ledgers.
- An Agent or future LLM may propose an action; only the validated V2 transition
  layer may change World State, and every change produces a Simulation Event.
- Every reportable Claim references Events from the same run; a Report contains
  only Claims from that run.
- Locked Graphs, run inputs, completed runs, Events, Claims, and Reports are
  immutable. Feedback is append-only and can affect only a new run.
- All formal objects are owner-scoped. An authenticated user cannot select,
  mutate, delete, relate, or infer another user's objects. Anonymous access is
  denied.
- Idempotency is scoped by owner. Same owner/key/payload returns the original
  result; same owner/key/different payload returns a stable conflict.
- Formal pages never silently fall back to localStorage.

## Canonical asset map

| Existing asset | Canonical location | Reuse decision | Proven gap / minimum Phase 4 addition |
| --- | --- | --- | --- |
| Submitted Seed and Consent | `seed_contexts`, `consent_events`; Phase 2 RPCs and APIs | Reuse unchanged | Run RPC must re-read submitted/frozen Track A ownership and consent reference. |
| Confirmed People | `key_people`; Phase 3 RPCs/APIs | Reuse unchanged | Snapshot references are frozen into the run input. |
| Immutable Agents | `agent_profile_snapshots`, `agent_profiles`; Phase 3 RPC/API | Reuse unchanged | Bind the latest eligible snapshot to the run; do not regenerate it. |
| Locked Graph | `relation_graph_snapshots`, `relation_edges`; Phase 3 RPC/API | Reuse unchanged | Require a locked, owner-matched graph and freeze its ids/content in the run input. |
| Run authority | Existing `simulations` table | Reuse and extend | Add formal graph/snapshot binding, deterministic seed, execution/schema versions, immutable input JSON, phase/failure fields, and owner-scoped idempotency receipt. No second run table. |
| Tick/world snapshots | Existing `simulation_ticks` table | Reuse and extend | Add branch identity and bind immutable controlled-transition snapshots. |
| Timeline | Existing `event_logs` table | Reuse and extend | Persist V2-derived event envelope, provenance class, causal references, and immutable run binding. |
| Claims | Existing `claims` table | Reuse and extend | Preserve `evidence_event_ids`; add source-class and uncertainty metadata needed by the formal Result. |
| Report | Existing `reports` table | Reuse and extend | Persist one immutable formal result bundle projection; no browser regeneration. |
| Feedback | Existing `feedback_logs` table | Reuse and harden | Remove update/delete browser capability, add owner-scoped content-bound idempotency, and preserve append-only semantics. |
| Calibration | Existing V2 Outcome/Calibration contracts and existing account calibration fields | Reuse through an adapter | Read bounded feedback-derived calibration when creating a new run; never rewrite the old run. No parallel History. |
| Async execution | `src/lib/v2/migration-async-execution/index.ts` | Reuse validators, job semantics, and controlled executor shape | Stage 8 is in-memory only; add a Supabase-backed formal adapter/RPC without copying V2 validators. |
| V2 Reality/World/Trajectory/Analysis/Claims/Report | `src/lib/v2/**` | Reuse unchanged | Add one Phase 4 runtime adapter outside `src/lib/v2/**`. |
| Running/Result/Archive UI | Existing formal routes and components | Reuse shell/components | Replace formal data source with authenticated APIs; retain local V1 only as explicitly labelled compatibility/demo data outside the formal chain. |

## Canonical runtime call graph

```text
Authenticated browser
  -> GET latest submitted Seed / Agents / locked Graph (Phase 2/3 APIs)
  -> POST formal Start Run with graph id, 30|90 day horizon, settings, key
     -> SECURITY INVOKER transaction validates auth.uid(), owner, submitted Seed,
        immutable Agent snapshot, locked Graph, safety state, and object chain
     -> freezes the formal input and creates/reuses the canonical simulations row
     -> Phase 4 runtime adapter (outside src/lib/v2)
        -> V2 Reality Boundary validator
        -> V2 Agent World initializer and Action Proposal validation
        -> V2 deterministic World transition
        -> V2 seeded trajectories
        -> V2 trajectory analysis
        -> V2 Claims/Report builders
        -> Stage 8 canonical artifact validation / controlled job semantics
     -> one atomic persistence boundary writes ticks, Events, Claims, Report,
        then marks the canonical simulation completed
  -> GET Run Status (read-only, owner-scoped)
  -> GET immutable Result Bundle (read-only, owner-scoped)
  -> GET Account History (read-only, owner-scoped, stable pagination)
  -> POST append-only Feedback (owner-scoped, content-bound idempotency)
  -> next Start Run reads bounded calibration and creates a new immutable run
```

Event creation precedes Claim creation. Completed status is written only after
all dependent artifacts validate and persist. Any validation or persistence
failure leaves no completed bundle and no orphan output rows.

## Current-to-target UI source map

| Surface | Current canonical state | Phase 4 target |
| --- | --- | --- |
| `/app/new/graph` | Authenticated Phase 3 APIs and server snapshots | Add start/continue/result/new-run actions driven by formal run APIs. |
| `/app/simulation/running` | Local repository and generated V1 artifacts | Read only the formal server run status; bounded polling; recover by run id. |
| `/app/simulation/result` | Local repository and browser-built projections | Read one persisted immutable Result bundle; expose evidence and source classes. |
| `/app/archive` | Local draft history | Account History API with stable sorting/pagination and immutable result links. |

## Minimal schema and API additions

Phase 4 may add only forward migrations that extend the existing canonical
tables and add narrowly scoped receipt/snapshot metadata where the current
schema cannot express the contract. It must not create parallel simulations,
events, claims, reports, feedback, history, or V2 engine tables.

The formal API capability set is:

- Start Run: authenticated POST, owner validation, content-bound idempotency.
- Status: authenticated owner-scoped GET, no write-on-poll.
- Result: authenticated owner-scoped GET, stable incomplete/completed contract.
- History: authenticated owner-scoped GET, stable order and cursor pagination.
- Feedback: authenticated POST, completed-run requirement, append-only and
  content-bound idempotency.

All routes use the existing `{ ok, error_code, trace_id }` response family.

## Stage boundaries

- M1.0 changes only new Phase 4 documentation.
- M1.1 changes only security tests and a forward security migration.
- M1.2 adds the minimum formal persistence/runtime adapter with tests first.
- M1.3 exposes the formal APIs with route tests first.
- M1.4 changes only the required formal Graph/Running/Result UI surfaces.
- M1.5 changes formal History/Feedback/Calibration surfaces and contracts.
- M1.6 records acceptance evidence/status after the real local authenticated
  A/B and anonymous gates pass, and includes only acceptance-discovered test
  isolation and browser hydration hardening needed for those gates.

Each stage is one commit, is pushed immediately, and stops on a failed gate.
