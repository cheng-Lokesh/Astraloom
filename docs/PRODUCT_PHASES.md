# Project Astraloom Product Phases

Status: Ordered development lock.

Current state: Local MVP.

Target state: Full Product.

This file defines the required future stage order. Each phase must preserve the
existing local MVP until its replacement is implemented, tested, and accepted.
No phase is authorized merely by being listed here; each phase still requires a
separate scoped implementation task.

## Global Phase Rules

- Do not turn Astraloom into a chatbot, fortune-telling app, therapy product,
  mind-reading product, CRM, or RPG.
- Do not delete existing local flows during migration.
- Do not enable database writes, LLM calls, payment writes, entitlement grants,
  service-role clients, migrations, or unlocks without explicit phase approval.
- Every phase must preserve the evidence chain from Seed Context through Claims
  and Reports.
- Safety downgrade wins over generation, simulation, report, and payment.

## Phase 1. Route And UX Consolidation

Goal: make the product surface read as one coherent simulation sandbox.

Scope:

- Align existing routes with the target route family.
- Keep old stable routes available during migration.
- Make dashboard, scene, intake, people/agents, graph, simulation, result,
  settings, support, and billing flows coherent.
- Remove confusing product framing from UX copy.

Exit criteria:

- Users can understand the core loop without a chat-first or report-only
  impression.
- No existing local flow is deleted.

## Phase 2. Supabase Schema And Auth

Goal: prepare user-owned persistence without unsafe system writes.

Scope:

- Finalize schema for users, seed contexts, key people, agent profiles, relation
  edges, simulation runs, ticks, events, claims, reports, feedback, payments,
  support, consent, generation jobs, audit events, and idempotency keys.
- Add or verify RLS policies.
- Connect Supabase Auth for user identity.
- Keep service-role and system-owned writers gated.

Exit criteria:

- Authenticated user identity and RLS posture are verified.
- Browser writes remain limited to approved user-authored records.

## Phase 3. localStorage To Repository Migration

Goal: hide storage mechanics behind stable product repositories.

Scope:

- Introduce repository interfaces for each product domain.
- Keep localStorage adapters working.
- Add Supabase-backed adapters only after Auth/RLS acceptance.
- Migrate reads and writes one domain at a time.

Exit criteria:

- Local MVP behavior survives refresh and migration.
- Components use repositories instead of direct storage details where practical.

## Phase 4. Safety Hard Gate

Goal: make SafetyVerifier a non-bypassable product gate.

Scope:

- Define safety decision contract.
- Gate intake, extraction, agent generation, graph generation, simulation,
  claims, reports, and paid display.
- Add stable error codes and downgrade UI states.
- Preserve support/appeal paths where needed.

Exit criteria:

- High-risk content cannot proceed into strong claims or paid bypass.

## Phase 5. LLM Extract People

Goal: replace or augment deterministic extraction with structured, gated LLM
candidate extraction.

Scope:

- Strict schema for candidate people.
- Generation-job logging, model/prompt versioning, cost estimate, trace id, and
  error code.
- Safety pre-check and post-validation.
- User confirmation remains required.

Exit criteria:

- LLM candidates are explainable, bounded, and never final Agent Profiles.

## Phase 6. LLM Generate Agents

Goal: generate Agent Profile drafts from confirmed people.

Scope:

- Structured schemas for user core, user variants, NPCs, and groups.
- Evidence refs, source fields, confidence, prompt/model metadata, and cost
  controls.
- Validation against unsupported private-fact or hidden-motive claims.

Exit criteria:

- Generated agents are simulation-ready drafts, not report claims.

## Phase 7. Relation Graph Production Hardening

Goal: make the read-only graph production-grade.

Scope:

- Build relation edges from validated Agent Profiles and evidence.
- Preserve edge weights as system-owned fields.
- Add graph snapshots, confidence display, and evidence entry points.
- Remove any UX that implies manual CRM-style edge editing.

Exit criteria:

- The graph is inspectable, evidence-linked, and read-only.

## Phase 8. Simulation Engine v1

Goal: produce reproducible state evolution and event evidence.

Scope:

- Freeze run inputs.
- Build deterministic tick queue.
- Apply edge update rules and confidence scoring.
- Store tick snapshots and Event Logs.
- Keep LLM reasoning outside tick state transitions.

Exit criteria:

- Every run can explain what changed, when, why, and with which evidence.

## Phase 9. Report Engine v1

Goal: generate free preview and paid report sections from Claims and evidence.

Scope:

- Claim Builder requires `evidence_event_ids`.
- Report sections reference Claims, Events, Agents, and Relation Edges.
- Free preview stays low-cost.
- Paid sections deepen evidence and strategy without strengthening truth claims.

Exit criteria:

- No important report claim appears without evidence.

## Phase 10. Entitlement And Paid Unlock

Goal: unlock paid depth safely.

Scope:

- Checkout creation, webhook verification, payment states, entitlement grants,
  idempotency, refunds, disputes, failures, and audit.
- Unlock scope starts with single simulation report.
- Safety downgrade continues to govern paid display.

Exit criteria:

- Payment can unlock only authorized sections and cannot mutate simulation
  truth.

## Phase 11. Feedback Calibration

Goal: collect calibration signal for future quality improvement.

Scope:

- Feedback for claims, agents, relation judgments, strategies, and overall
  usefulness.
- Agent corrections and relation notes.
- Calibration profile updates without rewriting historical evidence.

Exit criteria:

- Feedback improves future runs without pretending to know objective truth.

## Phase 12. Support, Refund, Delete, And Admin

Goal: make the product operable and accountable.

Scope:

- Support tickets, refund requests, deletion requests, safety appeals, payment
  incidents, and generation failure review.
- Admin/Ops dashboard with protected access.
- Audit trails for privileged actions.

Exit criteria:

- Users have clear recourse, and operations can resolve failures safely.

## Phase 13. Observability And Beta Launch

Goal: prepare a controlled beta with cost, prompt, safety, and product health
visibility.

Scope:

- Prompt/model observability, generation-job metrics, cost budgets, retry caps,
  route health, build health, safety downgrade analytics, support workload, and
  payment incident monitoring.
- Beta readiness checklist and kill switches.

Exit criteria:

- The team can detect cost spikes, unsafe generation paths, broken routes,
  payment failures, and support pressure before expanding access.

## Sequencing Decision

The next development direction is locked to these phases. Work that does not
improve route clarity, repository migration, Auth/RLS, SafetyVerifier, structured
generation, read-only graph credibility, deterministic simulation, evidence
reports, entitlement integrity, feedback calibration, support/admin, or
observability should not be prioritized.
