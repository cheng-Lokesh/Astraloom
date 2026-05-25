# Project MiroFish Target Architecture

Status: Target architecture lock.

Current state: Local MVP with local-first drafts, deterministic preview logic,
and protected read-only writer workbench surfaces.

Target state: Full Product architecture using Next.js App Router, Supabase
Auth/Postgres/RLS, repository-backed persistence, structured generation,
deterministic simulation, safety hard gates, entitlement, calibration, and
operations observability.

This document is architectural direction only. It does not authorize database
connection changes, live LLM calls, payment writes, entitlement grants, service
role usage, migrations, or removal of local flows.

## Architecture Principles

- Product shape remains AI Life Simulator and relationship/decision sandbox.
- The system must not become chatbot-first, fortune-telling, therapy,
  mind-reading, CRM, or RPG.
- Local MVP flows stay intact until each repository-backed replacement is
  implemented, tested, and accepted.
- Browser clients may write only user-authored drafts and requests.
- Server-owned artifacts require backend validation, writer gates, idempotency,
  audit, trace ids, and stable error codes.
- Service-role generated artifact writes live only in `server-only` modules and
  are never exposed as direct browser write APIs.
- SafetyVerifier is a hard gate before generation, simulation, report, and paid
  unlock.
- Paid unlock reveals depth, not stronger truth.

## Layer Map

### 1. Next.js App Router

Responsibilities:

- Product routes for dashboard, scene, intake, agents, graph, simulation
  running, result, settings, support, and admin.
- API routes for seed context, key people, agents, graph, simulation, events,
  reports, payments, support, privacy, and system-writer readiness.
- Server-only boundaries for privileged clients, Stripe verification, and
  generation services.
- Route consolidation from legacy MVP routes into the target `/app/...` family.

Current MVP:

- Existing App Router pages and API routes remain.
- New route work should consolidate UX without deleting stable local flows.

### 2. Supabase Auth, Postgres, And RLS

Responsibilities:

- Supabase Auth owns user identity.
- Postgres stores user-owned and system-owned product records.
- RLS enforces ownership for all user-owned rows.
- System-owned tables are not browser-writable unless explicitly approved.
- Service-role access exists only in server-only modules with gates and audit.
- Generated artifact writes use a server-only writer that validates ownership,
  requires `trace_id`, `version`, `writer_version`, and `idempotency_key`, and
  appends `audit_events`.

Target data chain:

`users -> seed_contexts -> key_people -> agent_profiles -> relation_edges -> simulation_runs -> simulation_ticks/events -> claims -> reports -> feedback`

Operational tables include payments, support tickets, consent events,
generation jobs, writer audit events, and idempotency keys.

### 3. Repository Layer

Responsibilities:

- Provide one stable access boundary per product domain.
- Hide whether data comes from localStorage, browser Supabase, server API, or
  system writer.
- Preserve type contracts and version metadata.
- Support migration from local drafts to repository-backed records.
- Keep UI pages from importing concrete `storage.ts` adapters directly.
- Return a uniform result envelope from every repository operation:
  `{ ok, data, errorCode, traceId }`.
- Expose `load`, `save`, `list`, and either `clearDraft` or `markDeleted` for
  each repository family.

Repository families:

- `SeedContextRepository`
- `KeyPeopleRepository`
- `AgentProfileRepository`
- `RelationGraphRepository`
- `SimulationRunRepository`
- `EventLogRepository`
- `ClaimRepository`
- `ReportRepository`
- `EntitlementRepository`
- `FeedbackRepository`
- `SupportRepository`
- `AdminOpsRepository`

Current Local MVP implementation:

- `src/lib/repositories/*` is the page-facing persistence boundary.
- The default adapter remains `localStorage` and wraps the existing
  `src/lib/*/storage.ts` files, so the local closed loop is preserved.
- Supabase repository adapters are reserved behind the same provider contract
  and return stable disabled errors until auth/RLS migration is explicitly
  enabled.
- Pages may use `getRepositories()` or the exported provider instance, but must
  not directly import domain `storage.ts` files.

### 4. LLM Structured Generation Layer

Responsibilities:

- Use strict schemas for people extraction, agent generation, relation graph
  suggestions, report copy, and strategy summaries.
- Record `generation_jobs` with job type, status, input refs, output refs,
  model version, prompt version, prompt budget, cost estimate, trace id, safety
  level, and error code.
- Treat model output as advisory until validated.
- Prevent hidden-thought, deterministic fate, professional advice, or unsupported
  biography claims.
- Support prompt and cost observability.

Boundary:

- LLMs do not directly own simulation state transitions or final claims.

### 5. Simulation Deterministic Core

Responsibilities:

- Freeze the run input.
- Create tick queue.
- Apply deterministic edge update rules and confidence scoring.
- Produce tick snapshots and events.
- Feed Claim Builder only through Event Logs.

Boundary:

- The deterministic core may consume validated Agent Profiles and Relation
  Edges, but it must not depend on live chat-style model reasoning during each
  tick.

### 6. SafetyVerifier Hard Gate

Responsibilities:

- Classify safety level before each sensitive phase.
- Block or downgrade high-risk content.
- Prevent strong claims where evidence, safety, or confidence is insufficient.
- Prevent paid unlock from bypassing downgrade.
- Emit stable decisions for UI, API, reports, support, and audit.

Gate points:

- Seed Context intake.
- Key People extraction.
- Agent Profile generation.
- Relation Graph generation.
- Simulation run.
- Claim building.
- Report generation.
- Entitlement unlock display.

### 7. Report Engine

Responsibilities:

- Build report sections only from Claims with `evidence_event_ids`.
- Link report copy to agents, relation edges, events, and confidence.
- Produce free preview and paid sections from the same evidence base.
- Preserve non-deterministic language and safety disclaimers.
- Render evidence chain interactions for graph, timeline, cards, and report
  sections.

Boundary:

- Report copy does not create new simulation facts.
- Paid copy does not raise certainty.

### 8. Entitlement Engine

Responsibilities:

- Manage payment state, webhook verification, unlock scope, refunds, disputes,
  failures, and expiration.
- Grant unlock only through verified server-side events.
- Preserve idempotency and writer audit evidence.
- Gate paid report sections by entitlement state and safety state.

Boundary:

- Entitlement never changes simulation output, Claims, confidence, or safety
  downgrade.

### 9. Feedback Calibration Engine

Responsibilities:

- Store feedback on claims, agents, relation edges, strategies, and overall run.
- Separate user corrections from historical evidence.
- Feed future prompt tuning, confidence calibration, and product analytics.
- Support calibration profiles without claiming objective mind-reading.

Boundary:

- Feedback does not silently rewrite historical reports.

### 10. Admin/Ops Dashboard

Responsibilities:

- Support tickets, refund requests, deletion requests, safety appeals,
  generation failures, payment incidents, and beta health review.
- Protected access only.
- Audit-friendly views over writer events, idempotency keys, generation jobs,
  payment status, and support state.

Boundary:

- Admin tools do not become a CRM for user relationships.
- Admin actions must be scoped, logged, and reversible where possible.

### 11. Cost And Prompt Observability

Responsibilities:

- Track model, prompt, route, job type, token budget, cost estimate, retries,
  latency, cache hits, and error codes.
- Provide dashboards and alerts for cost spikes and generation failure clusters.
- Avoid logging secrets and unnecessary raw user content.
- Support beta launch budget limits and kill switches.

## Migration Shape

The migration from Local MVP to Full Product must proceed in stages:

1. Keep local MVP functional.
2. Consolidate routes and UX around the target product loop.
3. Add repository interfaces while still backed by local drafts.
4. Add Supabase Auth and schema with RLS.
5. Migrate local draft reads/writes behind repositories.
6. Add SafetyVerifier hard gates.
7. Add structured LLM generation phase by phase.
8. Harden graph, simulation, event, claim, and report pipelines.
9. Add entitlement and feedback only after evidence and safety are stable.
10. Add support, admin, and observability before beta launch.
