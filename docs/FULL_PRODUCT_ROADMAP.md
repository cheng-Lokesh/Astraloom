# Project MiroFish Full Product Roadmap

Status: Product direction lock.

Current state: Local MVP.

Target state: Full Product.

This document upgrades Project MiroFish from a local-first MVP into a complete
product roadmap. It does not authorize code changes, database connection, LLM
calls, payment writes, entitlement grants, or deletion of the existing local
flow.

## Product Lock

MiroFish is an AI Life Simulator and relationship/decision sandbox.

The full product must preserve this core loop:

`Seed Context -> Key People Extraction -> Agent Profiles -> Relation Graph -> Simulation Engine -> Event Log -> Claims -> Reports -> Feedback Calibration`

MiroFish must not become:

- A generic chatbot.
- A fortune-telling or astrology product.
- A therapy or medical/psychological advice product.
- A mind-reading product that claims access to hidden thoughts.
- A CRM or manually managed relationship database.
- An RPG or open-ended story game with continuous player choices.

The current local MVP exists to prove that users recognize their situation,
people, relationship dynamics, evidence trail, and paid evidence value before
the product connects real backend writers, LLM generation, or payment unlocks.

## 1. Auth User System

Goal: make every run user-owned, recoverable, private, and deletable.

Full-product responsibilities:

- Supabase Auth for email login and session handling.
- User-owned rows for seed contexts, people, agents, graphs, simulations,
  reports, payments, support, consent, and feedback.
- RLS policies that prevent cross-user reads and writes.
- Account settings, locale, consent history, deletion requests, refund/support
  entry points, and simulation history.
- Clear separation between browser-writable user drafts and server-owned
  generated artifacts.

Local MVP position:

- Local drafts and partial Supabase/auth surfaces may coexist.
- The local flow must remain usable until repository migration is complete.

## 2. Seed Context Input System

Goal: turn a real situation into structured simulation input.

Full-product responsibilities:

- Track A crossroads simulations and Track B long-horizon climate views.
- Main question, theme domain, time horizon, raw context, recent events, key
  people hints, decision options, forbidden actions, and desired output.
- Safety pre-scan before extraction, generation, simulation, report, and paid
  unlock.
- Versioned persistence with `trace_id` when moving into server workflows.
- Clear user framing: situation telling, not a chatbot conversation.

Local MVP position:

- Local storage drafts are valid MVP artifacts.
- Future migration must preserve existing user-authored local flows.

## 3. Key People Extraction System

Goal: identify important people before any graph or simulation exists.

Full-product responsibilities:

- Candidate extraction from Seed Context with confidence, evidence snippets,
  missing fields, relationship-to-user, role type, and source.
- User confirmation, deletion, rename, merge, and supplement.
- No direct editing of relationship edge weights.
- LLM extraction may be added only through gated structured generation,
  validation, generation-job logging, cost controls, and SafetyVerifier.

Local MVP position:

- Deterministic extraction and manual supplement remain valid.
- LLM extraction is a future phase, not enabled by this roadmap document.

## 4. Agent Profile Generation System

Goal: convert confirmed people into simulation-ready digital agents.

Full-product responsibilities:

- User core, user variants, NPCs, and group agents.
- Profile fields for source, psychology, motivation, resources, behavior
  policy, state, memory, triggers, variant axis, confidence, and evidence refs.
- Structured LLM generation that is advisory until validated and persisted by
  backend rules.
- No unsupported biography, hidden motives, or private-thought claims as fact.
- Versioned prompt/model metadata and generation cost tracking.

Local MVP position:

- Deterministic local agent drafts remain the product proof.
- Full LLM agent generation must wait for the dedicated phase.

## 5. Relation Graph Read-Only System

Goal: render the agent ecology as a credible graph without turning it into CRM.

Full-product responsibilities:

- Read-only graph built from Agent Profiles and Relation Edges.
- Edge weights include trust, hostility, dependency, attraction, competition,
  information gap, resource control, and emotional debt.
- Users may inspect evidence and confidence, but may not manually edit edge
  weights or internal scoring formulas.
- Graph snapshots must be available for simulation ticks and evidence review.

Local MVP position:

- Mock or deterministic graph logic may remain as long as the UI communicates
  local preview status.
- Production hardening must connect graph data to validated agents, relation
  edges, ticks, and events.

## 6. Simulation Engine

Goal: run scenario evolution through deterministic state transitions.

Full-product responsibilities:

- Freeze Seed Context, Agent Profiles, and Relation Edges at run start.
- Execute deterministic tick logic with explicit inputs, edge update rules,
  confidence scoring, and reproducible snapshots.
- Create Simulation Ticks and Events before Claims or Reports.
- Keep LLM output outside the deterministic core; LLMs may help with extraction
  or copy, not directly decide final conclusions.
- Block continuous RPG choices during a running simulation.

Local MVP position:

- Local deterministic v0 simulation is the correct foundation.
- Future v1 must strengthen rules, snapshots, and evidence output without
  replacing the product with a chat or story engine.

## 7. Event Log, Claim, And Report Evidence Chain

Goal: ensure every important conclusion is evidence-backed.

Full-product responsibilities:

- Event Logs capture tick source, involved agents, relation edges, before/after
  state, edge deltas, confidence, and trace id.
- Claims require `evidence_event_ids`; claims without evidence cannot be shown
  as strong claims.
- Reports are downstream of Claims, Events, Agents, and Relation Edges.
- Free preview stays coarse and low cost.
- Paid report sections may reveal deeper evidence, event chains, NPC paths,
  parallel-self differences, key variables, and strategy depth.
- Paid sections must not invent stronger claims, raise certainty, or bypass
  safety downgrade.

Local MVP position:

- Local report preview and locked sections are valid as payment-intent proof.
- Full report generation must wait for Report Engine and entitlement phases.

## 8. Paid Entitlement System

Goal: unlock deeper evidence and strategy without changing truth claims.

Full-product responsibilities:

- Checkout creation creates only pending payment intent.
- Entitlement is granted only by verified webhook after amount, currency,
  session, user ownership, idempotency, and audit checks pass.
- Unlock scope starts with a single simulation report.
- Refund, dispute, failure, and expiration states remain auditable.
- Paid unlock cannot change claim direction, confidence, safety status, or
  simulation output.

Local MVP position:

- Local payment-intent capture remains non-authoritative.
- No real checkout, Stripe write, entitlement grant, or report unlock is
  authorized by this roadmap document.

## 9. SafetyVerifier Safety Downgrade System

Goal: make safety a hard gate, not a copy disclaimer.

Full-product responsibilities:

- SafetyVerifier runs before extraction, agent generation, graph generation,
  simulation, report generation, and paid unlock.
- High-risk content blocks deterministic or high-confidence generation.
- Downgraded flows avoid strong claims and preserve conservative language.
- Safety downgrade cannot be bypassed by payment.
- Safety decisions include stable error codes, trace ids, and support/appeal
  paths when appropriate.

Local MVP position:

- Local safety review and degradation screens remain active.
- Hard gate implementation is a future phase.

## 10. Feedback Calibration System

Goal: learn from user feedback without pretending to know objective truth.

Full-product responsibilities:

- Feedback on claims, agents, relation judgments, strategy usefulness, and
  overall result quality.
- Agent corrections and relation notes feed future calibration.
- Calibration must not mutate historical evidence or silently rewrite paid
  claims.
- Feedback should influence future prompts, confidence calibration, and product
  analytics.

Local MVP position:

- Local feedback drafts are valid.
- Repository-backed calibration comes after reports and entitlement are stable.

## 11. Admin, Ops, And Observability System

Goal: operate a safe, cost-controlled, supportable product.

Full-product responsibilities:

- Admin/Ops dashboard for support, refunds, deletion requests, safety appeals,
  generation failures, payment incidents, and cost review.
- Prompt and model observability for generation jobs without leaking secrets or
  storing unnecessary raw prompts.
- Cost budgets, retry caps, model routing, prompt version tracking, and error
  code dashboards.
- Audit trails for privileged writers and entitlement changes.
- Beta launch readiness views for build health, route health, RLS posture,
  safety downgrades, and support workload.

Local MVP position:

- Existing writer workbench and read-only guardrails are governance assets.
- Admin/Ops production tools must remain protected and explicitly scoped before
  any privileged operation is enabled.

## Direction Lock

All future development must move from the current Local MVP toward the Full
Product architecture without breaking the local preview loop. Work should be
sequenced through route consolidation, authenticated repository persistence,
SafetyVerifier hard gates, structured generation, deterministic simulation,
evidence-backed reports, paid entitlement, feedback calibration, support/admin,
and observability.
