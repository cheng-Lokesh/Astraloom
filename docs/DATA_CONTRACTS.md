# Project Astraloom Data Contracts

This file defines the minimum data ledger for the Astraloom MVP. Any schema change must update this file.

## Core Evidence Chain

All important generated output must be traceable through this chain:

`user_profiles -> seed_contexts -> key_people -> agent_profiles -> relation_edges -> simulations -> simulation_ticks/event_logs -> claims -> reports -> feedback_logs`

Manual Reality Intake V1 adds a local MVP grounding draft before Grounded
Social Simulation:

`seed_contexts -> reality_intake_drafts -> grounded_social_simulations`

### Account Reality Profile (current formal chain)

`reality_profiles` stores one owner-scoped, revisioned profile per current
formal Seed. It has separate typed value/classification/evidence-summary
columns for life climate, resources, and constraints, plus bounded JSON arrays
for goals, values, life themes, pressures, and external variables. Each array
item independently carries its value, classification, and safe evidence
summary; every new dimension starts with one explicit unknown item. A field is
exactly `fact`, `assumption`, or `unknown`; unknown has no value and is
explicitly shown as unknown. These are user-authored inputs, not a simulation
ledger or a place for raw scenarios, evidence references, trace keys, or
inferred personal attributes. World State
is a projection of this profile plus the current locked Graph and controlled
Run events; it never creates a Change Node without such an event.

Scalar values and evidence summaries use trim-first character limits of 240
and 160 respectively, and reject control characters, UUID-shaped identifiers,
email addresses, raw scenario/evidence text, and secret or trace-key language.
The database enforces these rules for direct Data API writes as well as API
writes. Every content-changing update advances `revision` by exactly one;
revision-only changes and stale direct updates are rejected by the database.

The profile's composite `(seed_context_id, user_id)` foreign key binds every
row to the same owner's canonical Seed. RLS permits only authenticated owner
access; browser grants exclude owner reassignment and deletion.

#### New-situation continuation candidate (2026-10-19)

The authored continuation contract carries only a complete, user-reviewed
Reality Profile into a newly submitted formal Seed. Preparation creates a
revision-`0` client draft and clears every saved resource `usePerTick`; all
Profile fields, resources, and constraints receive stable review keys, while
each remaining non-null resource rate has its own confirmation key. Unknown
items retain their unknown classification and empty value. The user must also
confirm that the reviewed input applies to the new situation and re-acknowledge
the situation's privacy/safety boundary.

The authored versioned `submit_seed_context_phase2(uuid, jsonb, jsonb)` candidate
RPC is designed to validate the complete review/confirmation sets and refuse
expired constraint deadlines. Under the shared per-owner submission lock and
key lock, it is intended to check the same owner's prior receipt before
consulting the current Seed, Profile revision, or time. A new submission is
intended to validate and lock the source Profile, then create a fresh Consent
event, a distinct submitted/frozen `seed_contexts` row, and its complete
`reality_profiles` row at revision `1` in one transaction.
The old Seed and Profile are not updated. No old people, relationships, action
rules, Run permission, Graph, or historical artifact are copied. The old
two-argument submission RPC keeps its legacy payload hash and response
contract while sharing the owner lock and taking its clock after that lock.

This is an authored source contract, not database acceptance: the forward
migration and pgTAP file have not been executed. It also does not establish the
truth or provenance of information the owner previously entered about their
own life; a user can still author inaccurate history in their own profile.
The later route-signature repair does not change this SQL or data contract.
The c0 preview exposed a UI failure-state bug, addressed by a separate text-layer
repair at `d1d53e5`. The d1 production QA script passed within its stated scope,
but Profile GET returned 500 without Supabase configuration; it does not
establish Auth or database behavior. The migration and pgTAP remain unexecuted.
Git delivery is confirmed: the exact d1 feature SHA was normally pushed
(non-force, `73ff..d1`, exit 0) to the current development ref, and live
remote/HEAD/upstream all resolved to that SHA with 0/0 divergence. This is not
main, PR, deployment, Auth/DB/RLS, or nine-stage acceptance. Later docs-only
changes do not alter d1 feature source or imply a new build.

`reality_intake_drafts.mode` must distinguish `local_assumption`,
`manual_reality`, and `external_reality`. When no manual or external sources
exist, downstream reality confidence stays capped and UI copy must not imply
external reality information was retrieved.

DeepSeek Reality Intake may attach `llmStatus` and `llmExtraction` to a local
`RealityIntakeDraft`. `llmExtraction.sourceType` must be `llm_extraction` and
is allowed only for structured intake fields: primary domain, grounded reality
nodes, grounded reality pressures, external search questions, clarification
questions, missing information, and safety notes. It must not create final
findings, reports, destiny judgments, risk-level changes, payments, Stripe
writes, production database writes, or stronger confidence than validator caps.

External Reality Search may attach `realitySearchStatus` and validated
`externalSources` to `RealityIntakeDraft`. External sources are evidence inputs
only: they include `questionId`, title, optional URL, source type, retrieval
time, summary, relevant nodes, relevant pressures, limitations, and confidence.
No-URL sources remain capped at 60 confidence; all external sources remain
capped at 80 and must not create final findings, Reports, Claims, destiny
judgments, risk-level changes, payments, Stripe writes, production database
writes, or deterministic predictions.

## Table Principles

- Every user-owned table must include `user_id`.
- Every generated artifact must include `version`.
- Every generated artifact should include `trace_id` where it participates in a generation or simulation pipeline.
- LLM-related records must include `model_version`, `prompt_version`, `cost_estimate`, and `error_code` where relevant.
- Claims must reference `evidence_event_ids`.
- Reports must reference Claims and must not invent unsupported conclusions.
- User-visible graph data must come from Agent Profiles and Relation Edges, not arbitrary visual mock nodes once the feature leaves mock mode.

## Minimum Tables

## Production Schema v1

The production Supabase schema is defined in
`supabase/migrations/0001_initial_schema.sql`.

The current Local MVP may continue using localStorage drafts while repository
migration is incomplete. The production schema is the target data contract for
authenticated, RLS-protected storage.

Required production tables:

- `user_profiles`
- `calibration_profiles`
- `seed_contexts`
- `key_people`
- `agent_profiles`
- `relation_edges`
- `simulations`
- `simulation_ticks`
- `event_logs`
- `claims`
- `reports`
- `feedback_logs`
- `entitlements`
- `payments`
- `support_tickets`
- `consent_events`
- `model_call_logs`
- `generation_jobs`
- `audit_events`

Production table rules:

- Every user-owned table includes `user_id`.
- Every generated artifact includes `version`.
- Every server-written generated artifact includes `writer_version` and
  `idempotency_key`.
- AI-generation records include `trace_id`.
- `claims.evidence_event_ids` is required and must contain at least one event id
  before a claim can be persisted as reportable.
- `reports.claim_ids` is required and must contain at least one claim id before
  a report can be persisted as reportable.
- `model_call_logs` records `prompt_version`, `model_version`, `latency_ms`,
  `input_token_estimate`, `output_token_estimate`, `cost_estimate`,
  `error_code`, and `source` inside metadata/output refs. `source` is either
  `llm` or `local_fallback`.
- `support_tickets.ticket_type` supports `generation_failure`,
  `refund_request`, `safety_appeal`, `privacy_delete_request`,
  `billing_question`, and `general_support`.
- `entitlements.entitlement_type` supports `free_preview`, `paid_report`,
  `subscription`, and `admin_grant`.
- RLS is enabled on every production table.
- Browser clients must not receive or use a service role key.
- Server clients are limited to server actions and route handlers.

### user_profiles

Purpose: Account and profile anchor for Supabase Auth users.

Minimum fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `email`
- `locale`
- `calibration_profile`

### seed_contexts

Purpose: Stores the user's simulation starting point.

Minimum fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `version`
- `simulation_track`
- `scenario_type`
- `user_question`
- `theme_domain`
- `time_horizon`
- `tick_granularity`
- `raw_context`
- `decision_options`
- `forbidden_actions`
- `desired_output`
- `safety_flags`

### calibration_profiles

Purpose: Stores derived calibration parameters generated from user feedback.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `simulation_id`
- `created_at`
- `updated_at`
- `version`
- `source_reliability`
- `agent_confidence_adjustment`
- `edge_uncertainty_adjustment`
- `strategy_preference`
- `signals`
- `calibration_snapshot`
- `history_invariant`

Calibration rules:

- Feedback must not modify historical EventLogs.
- Feedback must not modify historical Claims.
- Feedback must not directly modify relation edge weights.
- Feedback is user calibration input, not absolute fact.
- CalibrationProfile may influence the next run's agent confidence, source
  reliability, edge uncertainty, and strategy preference.
- Repeated `off` feedback for a source type lowers that source type's next-run
  confidence multiplier.
- `useful` strategy feedback raises the same strategy type's next-run priority.
- Historical reports must not be deleted or rewritten by calibration.

### key_people

Purpose: Stores extracted and user-confirmed people before Agent Profile generation.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `created_at`
- `updated_at`
- `display_name`
- `relationship_to_user`
- `role_type`
- `confidence`
- `known_evidence`
- `missing_fields`
- `status`
- `merged_into_id`
- `evidence_refs`

Allowed statuses:

- `candidate`
- `confirmed`
- `deleted`
- `merged`
- `needs_confirmation`

### agent_profiles

Purpose: Stores actionable digital agents.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `key_person_id`
- `created_at`
- `updated_at`
- `version`
- `agent_type`
- `display_name`
- `relationship_to_user`
- `source`
- `field_sources`
- `psychology`
- `motivation`
- `resources`
- `behavior_policy`
- `state`
- `memory`
- `triggers`
- `variant_axis`
- `confidence`
- `evidence_refs`
- `model_version`
- `prompt_version`
- `trace_id`
- `cost_estimate`
- `error_code`

Agent Profile source rules:

- Every generated Agent Profile must include `evidence_refs` and `confidence`.
- Every generated field must carry a source type in `field_sources`.
- Allowed source types are `user_confirmed`, `chat_inferred`, `default`, and
  `model_inferred`.
- User-confirmed Key People fields override model-inferred fields.
- Model-inferred fields must lower confidence and remain draft-only.
- Default fields cannot be used as support for high-confidence Claims.
- Safety downgraded mode may create only conservative Agent drafts and must not
  infer third-party private thoughts, hidden motives, deterministic outcomes,
  Claims, Reports, RelationEdges, or edge weights.

Allowed `agent_type` values:

- `user_core`
- `user_variant`
- `npc`
- `group`

### relation_edges

Purpose: Stores dynamic relationships between agents.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `from_agent_id`
- `to_agent_id`
- `created_at`
- `updated_at`
- `version`
- `relationship_type`
- `weights`
- `trend`
- `last_interaction_event_id`
- `confidence`
- `evidence_refs`

Weight keys:

- `trust`
- `hostility`
- `dependency`
- `attraction`
- `competition`
- `information_gap`
- `resource_control`
- `emotional_debt`

Users must never edit these weights directly.

Local `RelationGraphDraft` stores the generated edge ledger for the current
flow and must include:

- `seed_context_id`
- `version`
- `agents`
- `edges`
- `graph_locked`
- `locked_at`
- `updated_at`

Local `SeedContextDraft` may carry additional structured intake fields before
the production seed-context repository is enabled:

- `destinyBirthInfo`
- `currentQuestionDescription`
- `recentEventsText`
- `decisionOptionsText`
- `forbiddenActionsText`
- `desiredOutputText`
- `privacySafetyAck`

`destinyBirthInfo` and `currentQuestionDescription` support Simple Mode's
minimal entry point. They are folded into extraction, safety scanning, and local
builder context. They do not add production backend writes, deterministic fate
claims, or paid accuracy differences.

When `graph_locked` is true, the UI must treat the graph as frozen for the
current run. Users can only supplement facts upstream and regenerate a new graph;
they cannot directly edit people or edge weights from the graph surface.

### simulations

Purpose: Stores one frozen simulation attempt.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `created_at`
- `updated_at`
- `version`
- `status`
- `track`
- `time_horizon`
- `tick_count`
- `frozen_agent_profile_ids`
- `frozen_relation_edge_ids`
- `frozen_agent_profile_snapshot`
- `frozen_relation_edge_snapshot`
- `safety_snapshot`
- `branches`
- `safety_level`
- `trace_id`
- `error_code`

Simulation Engine v1 rules:

- `90_days` runs generate exactly 6 ticks per branch.
- `30_days`, `1_year`, `3_years`, and `5_years` remain supported by policy
  configuration and may use different tick counts.
- Every run freezes Agent Profile, Relation Edge, and SafetyResult snapshots
  before event generation.
- Supported branches are `baseline`, `cautious_self`, and `decisive_self`.
- LLM output may prepare upstream Agent/Profile drafts, but it must not directly
  decide simulation transitions or final conclusions.

### simulation_ticks

Purpose: Stores each simulation step and graph snapshot.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `created_at`
- `updated_at`
- `version`
- `tick_index`
- `time_label`
- `environment_state`
- `agent_state_snapshot`
- `relation_graph_snapshot`
- `branch_id`
- `event_log_ids`
- `summary`
- `trace_id`
- `error_code`

Each tick stores environment state, agent state snapshot, relation graph
snapshot, and the Event Log ids generated by deterministic rules. Non-empty
ticks must include at least one Event Log.

### event_logs

Purpose: Stores evidence events created by Simulation Ticks.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `simulation_tick_id`
- `created_at`
- `updated_at`
- `version`
- `event_type`
- `agent_ids`
- `relation_edge_ids`
- `participants`
- `causes`
- `action`
- `summary`
- `before_state`
- `after_state`
- `edge_weight_deltas`
- `evidence`
- `branch_id`
- `confidence`
- `source`
- `trace_id`

Allowed Simulation Engine v1 `event_type` values:

- `graph_freeze`
- `avoidance`
- `cooperation`
- `direct_conflict`
- `disclosure`
- `resource_competition`
- `support`
- `opportunity_signal`
- `information_gap_widening`

Every Event Log must be traceable to Agent, RelationEdge, and deterministic
Rule sources through `participants`, `relation_edge_ids`, `causes`, `action`,
`edge_weight_deltas`, and `evidence`. Claims must not be generated from ticks
that do not have Event Logs.

### claims

Purpose: Stores reportable conclusions backed by events.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `created_at`
- `updated_at`
- `version`
- `claim_type`
- `summary`
- `confidence`
- `risk_level`
- `evidence_event_ids`
- `related_agent_ids`
- `related_relation_edge_ids`
- `is_paid_locked`
- `safety_notes`

Claims without `evidence_event_ids` cannot be shown as strong claims.

### reports

Purpose: Stores the generated user-facing report shell and sections.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `created_at`
- `updated_at`
- `version`
- `status`
- `claim_ids`
- `free_preview`
- `paid_sections`
- `disclaimer`
- `model_version`
- `prompt_version`
- `trace_id`
- `cost_estimate`
- `error_code`

Paid report sections must stay downstream of existing Claims. `paid_sections`
may expand evidence and strategy depth, but it must not create stronger claims
or increase certainty beyond the stored Claim records.

Report Engine v1 local output:

- `version` = `report-engine-v1`
- `free_preview.claim_ids`
- `free_preview.summary_claim_ids`
- `free_preview.overall_risk`
- `free_preview.vague_timeline`
- `free_preview.limited_evidence_count`
- `paid_report.claim_ids`
- `paid_report.full_claims`
- `paid_report.full_event_chain`
- `paid_report.involved_agent_ids`
- `paid_report.involved_relation_edge_ids`
- `paid_report.branch_comparison`
- `paid_report.strategy_options`
- `invariant.claim_ids`
- `invariant.paid_does_not_create_claims`
- `invariant.paid_does_not_raise_confidence`
- `invariant.paid_does_not_change_risk_level`

Report Engine v1 rules:

- Reports read Claims only.
- Claims must come from EventLogs.
- Claims without `evidence_event_ids` must not be shown.
- Free preview and paid full report use the same `claim_id` set.
- Paid unlock can reveal full evidence chain, involved agents, relation edge
  deltas, branch comparison, and strategies.
- Paid unlock must not create Claims, increase confidence, or change riskLevel.
- Every strategy option must reference a `claim_id`.

Allowed strategy types:

- `observe`
- `communicate`
- `delay`
- `proceed`
- `boundary`
- `information_fill`
- `resource_exchange`
- `exit_prepare`

### feedback_logs

Purpose: Stores user calibration feedback after report delivery.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `simulation_id`
- `created_at`
- `updated_at`
- `target_type`
- `target_id`
- `rating`
- `comment`
- `agent_correction`
- `edge_correction_note`

Allowed `target_type` values:

- `claim`
- `agent`
- `relation_edge`
- `strategy`
- `overall`

MVP local draft records may store these as `FeedbackLedgerDraft` until the Supabase feedback table is implemented.

Allowed `rating` values:

- `accurate`
- `partly_right`
- `off`
- `useful`
- `not_useful`
- `unclear`
- `not_happened_yet`

Formal account feedback is versioned. M1 accepts only overall-result ratings
(`useful`, `mixed`, `off`). M2 targeted feedback is appended only by its
authenticated `SECURITY INVOKER` RPC and stores the canonical artifact
reference in `target_id`; the browser sends only a per-Run ordinal key and never
an internal ID. Claim ratings are `accurate`, `partly_right`, `off`, `unclear`,
or `not_happened_yet`; Agent and Relation ratings are `accurate`,
`partly_right`, `off`, or `unclear`; Strategy ratings, when a Strategy artifact
exists, are `useful`, `not_useful`, or `unclear`. Current formal Results do not
contain Strategy artifacts, so the current API rejects Strategy feedback.

M1 and M2 feedback rows are append-only and owner-idempotent. A later Run may
freeze only the bounded category, rating, and timestamp signal, never the
feedback comment. This is an input record for future calibration work, not a
claim that current scoring has measurably improved. Feedback cannot rewrite an
old Run's inputs, Events, Claims, Report, Result Bundle, or calibration
snapshot.

Local feedback saves may generate a `calibration_snapshot` and a local
`CalibrationProfile`, but the feedback log remains separate from EventLogs and
Claims.

## Astraloom V2 Stage 7 Local Outcome And Calibration Contracts

Stage 7 adds local deterministic artifacts after Stage 6 without changing V1
or the Stage 2-6 production contracts:

`Stage 6 canonical Forecast Lock -> Stage 2 Real Evidence Outcome -> Backtest -> Calibration -> append-only persistence version`

### ForecastLockV2

A `ForecastLockV2` freezes a complete, revalidated Stage 5/6 forecast before
the primary Outcome Evidence exists. It includes:

- Immutable snapshots of the Run, canonical Claim Set, all canonical Claims,
  and the validated Report.
- `lockedAt`, the forecast Reality Boundary revision and fingerprint, Ledger
  identities, a canonical content signature, explicit schema version, and an
  artifact integrity signature.
- One semantic forecast unit per Claim/Cluster. Its signature excludes identity
  fields such as Analysis Run Spec, Trajectory Run Spec, Trajectory, Claim,
  source analysis, Report Spec, Backtest Spec, and Outcome Spec ids.
- Semantic signature inputs comprising the normalized Run Spec, evaluation
  window, Seed, trajectory seeds, policy/engine versions, Claim metric and
  numerator/denominator, canonical Cluster outcome semantics, forecast Reality
  Boundary fingerprint/revision. Lock time, Forecast Lock ids, and persistence
  identities are not forecast-target semantics and are excluded.

Changing namespace ids alone must not change a forecast-unit signature. The
revalidated Run derives each unit's evaluation window with the Stage 4
millisecond-safe time utility. Before a Forecast Lock can be built or parsed,
`boundary.updatedAt <= lockedAt < evaluationWindow.startAt` must hold for every
unit. Before `forecast_lock` can be appended or its persistence version can be
accepted, `boundary.updatedAt <= lockedAt <= persistedAt <
evaluationWindow.startAt` must hold for every unit. A failed time gate is
atomic: it produces no version, stream-history change, or idempotency-key
reservation. For an `occurred` Outcome, `lockedAt` must also be strictly before
`occurredAt`.

### OutcomeV2

An `OutcomeV2` is an actual observed result, not a Simulation Event. It must
include:

- `outcomeSpecId`, `seedContextId`, and a content-derived immutable `id`.
- `status=actual_observation` and `evidenceClass=real_world`.
- The Stage 6 `claimId` and `clusterId` whose occurrence is being observed.
- An explicit `observationWindow` with `startAt` and `horizonEnd`, plus
  `evaluatedThrough` and `recordedAt`.
- For `observed=occurred`, a required `occurredAt` inside the inclusive
  forecast window. For `observed=did_not_occur`, `occurredAt` is forbidden and
  `evaluatedThrough` must be at or after the complete window end.
- One or more Stage 2 `realEvidenceIds` from a strictly validated Evidence
  Ledger.
- A primary source whose `sourceKind`, `sourceRef`, verification status, and
  evidence timestamps exactly match the referenced Real Evidence.
- An explicit uncertainty level, statement, and non-empty limitations.
- The complete validated Reality Boundary snapshot used at capture time.
- Outcome engine/schema versions, an integrity signature, and an
  `observationUnitSignature` derived from the observation semantics rather than
  `outcomeSpecId` or Evidence ids.

`world_event_v2_*` ids, Simulation Event sources, unknown fields, unverified or
disputed primary sources, cross-Seed references, dangling Real Evidence, and
version drift are invalid Outcome input. Capturing an Outcome must not mutate a
historical Evidence Ledger or any simulation artifact.

### BacktestV2

A `BacktestV2` must reconstruct and revalidate the Stage 6 Report and its full
canonical Claim Set. It binds immutable snapshots and integrity signatures for:

- The Stage 5 Run or comparison payload and its kind.
- Every canonical Stage 6 Claim and the Report.
- Analysis Run Spec ids, Trajectory Run Spec ids, Trajectory ids, trajectory
  seeds, horizons, policies, and engine/schema versions.
- Claim numerator, denominator, sample count, Trajectory ids, and Cluster ids.
- The Outcome and its later Reality Boundary snapshot.
- The forecast and Outcome Reality Boundary revisions plus their shared
  Evidence and Assumption Ledger identities.
- A forecast evaluation window derived by revalidating the canonical Run Spec
  and applying the Stage 4 millisecond-safe time utilities.
- The Outcome observation-unit signature and a forecast-unit signature binding
  the semantic Run, Claim metric/frequency, Cluster outcome, Reality Boundary,
  evaluation window, versions, and seeds independently of identity, lock, and
  persistence aliases. A separately stored forecast-target signature enforces
  one semantic forecast for one evaluation window.
- A strict `streamId`/`version` Forecast Lock reference resolved only through
`OutcomeCalibrationRepositoryPortV2.loadVersion`. The Backtest stores and
canonical-compares the exact record returned by the repository; callers may
not supply a receipt. A missing, late, mismatched, or tampered stored version
invalidates the Backtest atomically. The referenced stream history must have a
contiguous version sequence, correct parent ids, request fingerprints,
persistence ids, and integrity signatures; a self-consistent envelope that was
never appended to that history is invalid.

The Outcome boundary revision must be strictly greater than the forecast
revision. It may append new Real Evidence but must keep the same Seed and Ledger
identities and preserve every historical forecast Evidence, Assumption, and
conflict record byte-for-byte in canonical order. The primary Outcome Evidence
must be absent from the forecast snapshot and captured no earlier than the
forecast lock time. Same-revision changes are invalid. A scenario-frequency
Claim may receive a binary Brier score. Sensitivity and intervention differences
require counterfactual evidence and therefore remain excluded from automatic
calibration; a single observed Outcome must not become a causal conclusion.

### CalibrationV2

Stage 7 calibration is deterministic and explicitly versioned:

- Method: `binary-brier-score`, version `3`.
- Minimum eligible independent forecast-outcome sample: `5`.
- Below the minimum, status is `insufficient_data`, `brierScore` is null, and
  the metric label remains `simulation_frequency`.
- At or above the minimum, the result discloses the mean binary Brier score,
  observed rate, mean simulation frequency, eligible/excluded sample counts,
  method, versions, and limitations.
- A calibrated result remains a bounded reliability measurement. It must set
  `causalConclusion=false` and `deterministicPrediction=false` and must not
  automatically become a universal real-world probability.
- Calibration input must use unique observation-unit and forecast-unit
  signatures and unique forecast-target signatures from one Seed, one Evidence
  Ledger, one Assumption Ledger, and compatible artifact versions. Aliasing
  Outcome, Backtest, Evidence, Lock, or persistence ids cannot increase
  `sampleCount`; duplicate units are rejected atomically.

### OutcomeCalibrationRepositoryPortV2

The Stage 7 repository port exposes only append and read operations. The local
deterministic in-memory adapter stores an immutable version for each accepted
artifact and enforces:

- Strict unknown-input validation for append and load operations.
- A monotonically increasing version and explicit parent version id.
- Optimistic concurrency through `expectedVersion`.
- Content-bound idempotency: the same key and request returns the original
  version; the same key with different content is rejected.
- Dependency ordering: persisted Forecast Lock before its Outcome, Outcome
  before its Backtest, and all referenced Backtests before Calibration.
- A Forecast Lock append rechecks its write-before-window timing at millisecond
  precision before any stream or idempotency mutation; a later Backtest is not
  relied upon to reject an invalid persisted lock.
- One Seed and one Ledger identity per stream.
- No replacement of an existing Outcome, Backtest, or Calibration id.
- Defensive snapshots on every read so callers cannot rewrite stored history.
- Atomic failure with `data=null` and no partially appended version.

Stage 7 does not add Supabase migrations, production API routes, UI, background
jobs, queues, network access, or LLM calls. Those remain outside this local
adapter stage.

## Astraloom V2 Stage 8 V1 Draft Migration And Async Execution Contracts

Stage 8 adds a local, deterministic compatibility boundary and a controlled
in-memory asynchronous execution boundary. It does not migrate production data,
change V1 storage, add a production database migration, queue, privileged
writer, API route, network access, LLM, payment capability, or UI.

### V1DraftMigrationArtifactV2

Only a strict `v1_local_draft` envelope or direct strict
`normalizeSeedContextDraft()` output with
`artifactVersion=local-deterministic-v0` and a compatible local
`SeedContextDraft` with `status=draft` is accepted. The source is read-only;
V1 Run, Event, Claim, Report, feedback, entitlement, and payment data are not
accepted as migration input and are never rewritten.

Every accepted artifact stores:

- Source V1 identity and source artifact version.
- A source-content fingerprint that excludes only the V1 namespace id and
  legacy destiny/birth compatibility text.
- Migration schema and migration engine versions.
- Deterministic V2 target artifact ids, parent migration artifact id, lineage,
  and an integrity signature.

The same compatible content returns the existing V2 artifact, including when
only the V1 namespace id changes. Material source-content changes create a new
immutable migration artifact and retain the former artifact in history. Unknown
fields, unknown versions, damaged nested objects, cross-draft identities, and
attempts to include historical V1 artifacts are rejected atomically with no
stored result. `destinyBirthInfo` is readable only for compatibility: it is
excluded from the V2 draft, source-content fingerprint, Evidence, World,
Trajectory, Claim, simulation-frequency, and calibration inputs. Its presence
emits `legacy_destiny_isolated` rather than silently discarding it.

### AsyncSimulationJobV2

`AsyncSimulationJobV2` is server-controlled and contains `jobId`, request
fingerprint, Seed Context, Run Spec, schema/engine versions, `status`,
`attempt`, `createdAt`, `startedAt`, `completedAt`, `resultIds`, `errorCode`,
and a content-derived integrity signature.

The only valid transition sequence is:

`queued -> running -> succeeded | failed`

Submit input is strict and cannot contain a caller-selected status, attempt,
result, or receipt. The Seed Context id must equal the Run Spec Seed id. An
idempotency key is content-bound: an identical request returns the original
queued or terminal Job, while the same key with different content returns
`idempotency_conflict`. Reads return defensive snapshots.

### Async ports and publication gate

The repository port exposes submit, get, claim, complete, and fail; it never
exposes an unrestricted finalizer. Claim atomically records the worker id,
lease token, expected attempt, lease time, and expiry. Complete/fail require
the same job id, worker id, lease token, and attempt, so wrong workers, stale
leases, expired attempts, and terminal replays are rejected without changing
the Job. Result binding signatures cover the Job/request, attempt, lease,
canonical artifact fingerprints, result ids, and versions.

The executor port receives a deterministic adapter in tests. Before success it
must use the Stage 2–7 canonical validator adapter, which invokes the accepted
Stage 2 Reality Boundary, Stage 3 World, Stage 4 Trajectory, Stage 5 analysis,
Stage 6 Claims/Report, and Stage 7 Forecast Lock validators rather than
copying them. Result ids and the Job/result binding are integrity-signed. Any
execution error, validator failure, malformed worker/repository input,
cross-Seed input, or tampered result fails atomically: `resultIds` remains
null, no partial artifact is published, and historical artifacts remain
unchanged.

Stage 7 bundle input is strictly only `forecastLockReference: { streamId,
version }`; it must not contain a caller-provided persistence envelope or
history. The canonical gate receives an `OutcomeCalibrationRepositoryPortV2`
and calls `loadVersion(streamId, version)` plus `loadHistory(streamId)`. It
accepts only the repository-returned record after revalidating contiguous
versions, `parentVersionId`, request fingerprint, persistence id/signature,
Forecast Lock integrity/content signature, and the exact Run, Reality Boundary,
Claim Set, Claims, and Report source snapshots. A missing append, wrong
reference, truncated/broken history, or cross-stage binding mismatch leaves the
Job in its prior state with `resultIds=null`.

`complete()` may perform asynchronous canonical and repository validation only
after an initial lease check. Before it writes `succeeded`, it reloads the Job
from the store and repeats the full authority check: `status=running`, matching
job/worker/token/attempt, and `Date.now() < leaseExpiresAt`. The result binding
is derived from this second live snapshot, and no `await` occurs between that
check and the Job write. A lease that expires or is reclaimed during validation
returns `lease_mismatch` with no result ids, receipt, or terminal transition.

The public Stage 2–7 result bundle has a strict runtime envelope. Its top-level
contains exactly Stage 2 Boundary, Stage 3 World, Stage 4 `{ runSpec,
trajectories }`, Stage 5 Analysis, Stage 6 `{ claimSet, claims, report }`, and
Stage 7 `{ forecastLockReference }`. Extra or missing wrapper fields, malformed
values, getters, and proxies are rejected atomically before downstream
validators read them.

### entitlements

Purpose: Stores free preview, paid report, and subscription unlock state.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `created_at`
- `updated_at`
- `entitlement_type`
- `status`
- `scope`
- `starts_at`
- `expires_at`
- `source_payment_id`
- `metadata`

Allowed `entitlement_type` values:

- `free_preview`
- `paid_report`
- `subscription`
- `admin_grant`

Entitlement must not change claim direction, confidence, or safety downgrade.

Local Entitlement Engine v1 rules:

- Users have `free_preview` by default.
- Mock unlock may grant `paid_report` only for the current report scope.
- `paid_report` unlocks complete evidence chain and strategy depth only.
- Entitlement must not modify `claim_id`, Claim summary, confidence, riskLevel,
  EventLog records, or SafetyVerifier decisions.
- `downgraded` or `blocked` safety states keep paid report depth locked even
  when an entitlement exists.
- Mock entitlement does not connect to Stripe, create a real payment, or grant a
  production entitlement.

### payments

Purpose: Stores payment intent and entitlement state.

Minimum fields:

- `id`
- `user_id`
- `simulation_id`
- `entitlement_id`
- `created_at`
- `updated_at`
- `status`
- `provider`
- `amount`
- `currency`
- `unlock_scope`
- `refund_status`
- `error_code`

Payment must not change claim direction, confidence, or safety downgrade.
Checkout creation records only `pending` state. Entitlement is granted only by
a verified Stripe webhook after amount, currency, session id, and idempotency
checks pass. Refund, dispute, expired, and failed states must append or update
status without deleting payment history.

### support_tickets

Purpose: Stores support, refund, deletion, and appeal requests.

Minimum fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `ticket_type`
- `status`
- `subject`
- `message`
- `related_simulation_id`
- `related_report_id`

Allowed `ticket_type` values:

- `refund_request`
- `generation_failure`
- `safety_appeal`
- `privacy_delete_request`
- `billing_question`
- `general_support`

Support ticket operations rules:

- User support pages may create tickets and deletion requests.
- Delete requests are auditable requests, not immediate hard deletion.
- Admin/Ops views may list ticket metadata and short previews only.
- Admin/Ops may mark ticket status but must not edit Claim, EventLog,
  RelationEdge, Report, confidence, or risk fields.
- Full sensitive source text should stay hidden unless a separate scoped review
  workflow explicitly requires it.

### consent_events

Purpose: Stores privacy, consent, and deletion-related records.

Minimum fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `consent_type`
- `status`
- `source`
- `metadata`

### model_call_logs

Purpose: Stores AI call metadata for cost and prompt observability. It stores
references and counts, not raw secrets.

Minimum fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `trace_id`
- `job_id`
- `job_type`
- `version`
- `user_id`
- `provider`
- `prompt_version`
- `model_version`
- `latency_ms`
- `input_token_estimate`
- `output_token_estimate`
- `cost_estimate`
- `token_counts`
- `input_refs`
- `output_refs`
- `safety_level`
- `error_code`

Model call logging rules:

- Every LLM route records `trace_id`, `user_id`, `job_id`, `prompt_version`,
  `model_version`, `latency_ms`, token estimates, `cost_estimate`, and
  `error_code`.
- Key People extraction and Agent Profile drafting may call an LLM only when
  `ENABLE_AI_GENERATION=true` and the authenticated user matches
  `ALLOWED_AI_TESTER_EMAILS` or `ALLOWED_AI_TESTER_USER_IDS`.
- Non-allowlisted users, anonymous users, safety-downgraded inputs,
  rate-limited users, disabled AI environments, and failed model responses must
  continue through deterministic `local_fallback`.
- LLM routes must not generate Claims or Reports. Claims and Reports remain
  downstream of Event Logs and the deterministic Report Engine.
- Logs store token counts, ids, route/job metadata, and bounded output refs.
- Logs must not store raw prompts, raw user source text, service keys, or
  unnecessary sensitive inputs.

### generation_jobs

Purpose: Records gated AI generation attempts and their cost/safety metadata.

Minimum fields:

- `id`
- `user_id`
- `job_id`
- `seed_context_id`
- `simulation_id`
- `model_call_log_id`
- `created_at`
- `updated_at`
- `trace_id`
- `version`
- `job_type`
- `status`
- `input_refs`
- `output_refs`
- `model_version`
- `prompt_version`
- `cost_estimate`
- `error_code`
- `safety_level`

The table stores references and counts, not raw prompts or raw model responses.

Generation observability rules:

- LLM extraction and drafting jobs mirror their model call metadata into a
  generation job or audit event.
- Simulation runs record `trace_id`, `version`, `engine_version`,
  `safety_level`, `cost_cents`, and `error_code`.
- Report generation records `trace_id`, `claim_ids`, evidence EventLog count,
  paid/free state, and `error_code`.
- Admin/Ops observability is read-only and may show recent tasks, failed tasks,
  average cost, `error_code` distribution, and `prompt_version` distribution.

### audit_events

Purpose: Append-only audit ledger for privileged or sensitive server-side
actions.

Minimum fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `version`
- `trace_id`
- `job_id`
- `actor_type`
- `action`
- `target_table`
- `target_id`
- `idempotency_key`
- `request_hash`
- `gate_decision`
- `blocked_codes`
- `model_version`
- `prompt_version`
- `cost_estimate`
- `error_code`
- `metadata`

Browser clients may read only their own audit rows. Browser clients must not
insert, update, or delete audit rows.

Audit event rules:

- Audit events record operational metadata and decisions only.
- Audit events must not expose service-role keys, payment secrets, raw prompts,
  or unnecessary sensitive user input.
- Admin observability pages are read-only and cannot modify generation jobs,
  Claims, EventLogs, Reports, payments, or entitlements.

## Phase 4 formal account sandbox persistence

Formal Run admission uses a `formal-run-reservation-v1` row in the existing
`generation_jobs` ledger. An authenticated `SECURITY INVOKER` RPC binds one
owner/key to the canonical request hash and locked Graph, then freezes the
exact Seed, Agent/edge ordering and versions, Reality Profile revision, bounded
Feedback ids/versions/signals, rules and Symbolic Lens version in one source
read. Its first database `clock_timestamp()` fixes `formal_accepted_at` and a
simulation start exactly five minutes later. Graph `locked_at` is provenance,
not the start of a newly accepted Run. No caller supplies or moves these clocks.

Pending retries reuse these inputs and times; changed request content conflicts.
An expired pending window returns `reservation_expired` and retains its original
reservation, requiring a new key. A completed key restores its original Run,
including simultaneous generators whose actual forecast-lock times differ.
Completion is atomic with the existing Run receipt and uses real Boundary,
forecast-lock and database persistence times before the frozen evaluation
window. New unreserved bundles cannot create Runs; old completed receipts stay
readable. Reservation inputs/clocks are immutable, and ordinary job reads retain
owner RLS while reservation reads/writes additionally require the local RPC gate.

`frozen_source_input` is sensitive account data, separate from job observability
references. It belongs in the eventual account export and controlled privacy
erasure scope. Daily immutable guards do not imply permanent retention or a
completed erasure feature; the current privacy flow still records requests.

Phase 4 keeps the existing canonical tables. A formal run is the canonical
`simulations` row with execution version `formal-account-sandbox-m1-v1`, an
immutable input snapshot, deterministic seed, schema/runtime versions, Graph
and Agent snapshot bindings, run phase, failure metadata, calibration snapshot,
and immutable result bundle. It does not introduce a parallel run or History
table.

The input snapshot freezes the Reality Profile selected by the authenticated
owner and the locked Graph's Seed, including its revision and each dimension's
classification. If no Profile row exists, the snapshot records revision zero
and every dimension as unknown. Profile facts enter the run as user-provided
reality evidence; Profile assumptions enter the assumption ledger as
assumptions; unknowns remain unknown and do not enter either ledger. The result
projection reads only this frozen snapshot, keeps Profile facts, assumptions,
and unknowns in distinct categories, and does not expose Profile evidence refs,
owner/Seed/Profile ids, or raw Seed narrative as display values. Earlier Runs
without this snapshot remain marked as not recorded instead of using a current
Profile.

`reality_profiles.world_model_inputs` is a versioned object with up to eight
explicit resources and eight `before_time` constraints. A resource retains its
safe label, available amount, unit, minimum/maximum bounds, optional per-tick
use, classification, and evidence summary. A constraint binds to one declared
resource and retains its deadline. My Sandbox may project these current saved
inputs, resolving internal resource keys to safe labels; it must not expose the
keys or imply a future state change from these inputs.

`reality_profiles.life_model_domains` is a separately versioned, owner-scoped
object containing bounded identity, career, wealth, relationship-ecosystem,
living-environment, and life-stage entries. Each entry retains its own
fact/assumption/unknown classification and safe evidence summary; empty domains
default to explicit unknowns. These long-horizon inputs are visible in the
Reality Profile and My Sandbox, but are excluded from Track A's causal evidence
ledger and result projection until a versioned Track B contract consumes them.
They do not themselves produce a long-term forecast.

The controlled transaction writes `simulation_ticks`, then `event_logs`, then
same-run evidence-linked `claims`, then the single `reports` projection, and
only then marks the simulation completed. Forced failure rolls the transaction
back. Completed inputs and generated artifacts reject update/delete; replaying
the same owner/key/content does not duplicate them.

The formal Run RPC rejects SQL NULL horizons and Bundles, absent or JSON-null
required fields, and incorrect JSON types before opening its writer gate.
Owner/Seed/Graph/Agent bindings and runtime/schema/trajectory versions must be
explicit strings; the snapshot horizon must be the requested JSON number, and
the deterministic seed must be an integer in the formal runtime's range
`1..2,000,000,000`.
Events and Claims must be objects with their consumed required fields, and
Event evidence, Claim evidence, and Report Claim references must be nonempty
arrays of nonempty strings. Optional calibration and Symbolic Lens snapshots
may be absent, but must be objects when present. Invalid shapes return
`invalid_run_input` or `invalid_run_bundle` without artifacts or receipts;
well-typed unresolved Event/Claim references retain their existing link errors.

`feedback_logs` is append-only and owner-scoped. Feedback may be summarized
into the bounded calibration snapshot of a later run, but cannot mutate an old
Graph, run input, Event, Claim, Report, or result bundle. Owner-scoped compound
foreign keys, RLS, restricted grants, and controlled `SECURITY INVOKER` RPCs
prevent cross-owner selection, mutation, deletion, or association. Anonymous
business-table and protected-RPC access is denied.

My Sandbox may expose `lifeClimate`, `resources`, and `constraints` as
`not_modeled` or `saved_profile` with `source=current_reality_profile`, the
profile revision and classified items. Unknown fields remain unknown; recorded
life climate is the person's present context, not Destiny. `nextChange` may be
`recorded_deadlines` with revision, actual server `assessedAt`, and sorted
`upcoming`/`expired` lists from at most eight saved `before_time` constraints.
A deadline at or before the server time is expired, never automatically fulfilled.
These current observations preserve the older World schema and are not forecasts.

## Track B life-climate runs (B1/B2 functional candidates)

`life_climate_runs` is a separate append-only ledger for bounded Track B
comparisons. It is deliberately isolated from Track A's canonical
`simulations`, `simulation_ticks`, `event_logs`, `claims`, and `reports`, and
does not alter the accepted V2 Core.

Each row binds the authenticated owner to that owner's canonical submitted
Seed and exact `reality_profiles.revision`, and stores a versioned, immutable
profile snapshot, two baseline/alternative paths, one assumption-transition
Event and one Claim per selected change, and a Report referencing those Claims.
A request UUID plus canonical request hash makes a same-content retry
idempotent and rejects reuse with different content.

RLS gives authenticated users read-only access to their own rows. Browser roles
cannot insert, update, or delete generated runs. The only writer is the
server-only `persist_life_climate_run_b1` `SECURITY INVOKER` RPC, executable
only by `service_role`; it rechecks current Seed/profile ownership and
revision, validates the event-to-claim-to-report evidence links, and appends
without update/delete access. Service credentials remain server-only.

The `life-climate-b1-v1` contract remains readable for the original one-year,
single-change format. `life-climate-b2-v1` supports one selected theme across
1-, 3-, or 5-year horizons: four coarse relative stages for one year and coarse
annual stages for three or five years. A path may contain up to twelve
user-authored changes within that same theme, including later changes to a
field already changed in an earlier stage. Other domains remain frozen or
explicitly unknown. It is not a causal cross-domain simulation, external
reality lookup, probability estimate, dated prediction, or LLM-generated
outcome. These bounded candidates do not alone satisfy final Track B
acceptance.

## RLS Requirements

### Phase 3 formal Key People

Formal Key People exist only beneath an owned submitted Track A Seed. Each row
has `version`, `writer_version`, opaque `trace_id`, `source`, `field_sources`,
and request `idempotency_key`; its `(seed_context_id, user_id)` composite
foreign key and the composite merge reference prevent cross-owner or cross-Seed
people links. `key_people_idempotency_receipts` binds the owner, Seed,
operation, UUID key, canonical-content SHA-256, and affected person ids. A
replay validates those real rows before returning, instead of trusting stored
client JSON.

The only Step A writers are `SECURITY INVOKER` RPCs with a fixed
`public, extensions` search path. They require a non-empty `auth.uid()`,
re-read frozen `status=submitted` Track A ownership, and use an RPC-local RLS
guard; direct REST mutations fail. The extraction RPC accepts only the Seed id
and UUID idempotency key. It derives candidate fields inside the database from
the immutable Seed payload, canonicalizes and de-duplicates the role set, and
binds the receipt hash to the Seed payload hash plus extractor version. A
browser caller can trigger extraction for its own Seed but cannot supply or
override candidate fields or their provenance. No grant or policy change
expands browser DML for `agent_profiles` or `relation_edges`.

- User-owned rows must only be readable by the owning user.
- User-owned rows must only be writable by the owning user unless the table is system-owned.
- System-owned generated artifacts must not become browser-writable unless explicitly approved.
- Production RLS policies use `auth.uid() IS NOT NULL AND auth.uid() = user_id`
  or the equivalent `user_profiles.user_id` ownership check.
- Service-role clients must live only in server-only modules and must be gated
  by environment flags, auth/webhook verification, idempotency, audit evidence,
  and stable `error_code` responses.

## Server-Only Generated Artifact Writer

Generated artifact writes for `agent_profiles`, `relation_edges`,
`simulations`, `simulation_ticks`, `event_logs`, `claims`, `reports`,
`model_call_logs`, and `generation_jobs` are owned by server-only writer code.

Writer rules:

- The service role key is read only from `SUPABASE_SERVICE_ROLE_KEY` in
  `server-only` modules.
- Browser clients must never receive the service role key and must not insert,
  update, or delete generated artifacts directly.
- Each write payload must include `user_id`, `trace_id`, `version`,
  `writer_version`, and `idempotency_key`.
- The writer checks referenced parent records belong to the same `user_id`
  before inserting.
- The writer records append-only `audit_events` for attempted, blocked,
  failed, and successful writes.
- The writer inserts only new generated artifacts; it does not allow admin or
  browser mutation of Claim, EventLog, or Report conclusions.

## Digital-life adapter v1 (formal Track A candidate)

New formal Runs freeze `digital-life-model-v1` in `inputSnapshot.digitalLifeModel`.
The model binds owner, Seed, locked Graph, Agent snapshot and exact Reality
Profile revision. All fourteen profile dimensions retain fact/assumption/unknown
classification and safe source summaries. Goals, values, life themes and long
structures remain `background_only`: their presence alone is not a causal rule.
Existing Runs are immutable; a legacy bundle without the model projects
`not_recorded` rather than reconstructing from today's Profile.

`digital-life-rules-v1` is strict, explicit, confirmed simulation input, never
extracted actions, personality, numbers or third-party intent from free text.
Ordinal selectors bind the frozen source ordering. At most two stored
`user_variant` actors may carry explicitly defined strategies; `user_core` and
`user_variant` both retain the V2 `self` Actor identity. A strategy runs in its
own resource world instead of sharing reality with another copy of the self.
Each path has at most three actions for 30 days or six for 90 days and its own
three deterministic samples, events and frequency analysis. `strategyPaths`
uses a strict `digital-life-paths-v1` envelope; cross-path evidence is rejected
on read, and different conditions are never pooled into one frequency.

Confirmed rules may request information, update a commitment, allocate a
declared bounded resource, or apply a conditional NPC relationship response
through existing V2 proposals and controlled transitions. An NPC response must
follow a named request to that NPC on the same path and remains a user-confirmed
assumption, not knowledge of the real person's intention. Pressure and external
enum variables remain current singleton values without invented evolution.
Symbolic framing never determines Action, World or Evidence.

Safe results expose background/rule summaries and actual controlled resource
or relationship changes. New-model relationships include only edges present in
that active World; source Graph edges remain frozen intact and ordinal keys do
not shift when an inactive parallel-comparison edge is omitted. Raw source
references, owner/Seed ids and canonical resource keys remain server-side.

## Optional formal symbolic lens v1

`symbolic_birth_sources` stores sensitive owner-only birth date and optional
civil time as immutable source versions. No place, gender or unused timezone is
collected. `symbolic_lens_preferences` holds revision and active consent/pointers;
`symbolic_lens_snapshots` is an immutable generated ledger with writer/version,
trace and request identity. Owner-composite foreign keys prevent cross-owner
references. Browser roles have owner-only SELECT, never direct DML or RPC EXECUTE.
Service-only SECURITY INVOKER writers recheck a live, non-anonymous Auth owner.

Existing `consent_events` records independent `symbolic_storage` and
`symbolic_calculation` grants and all three scopes' withdrawals. Browser inserts
cannot forge symbolic grants. Withdrawal immediately clears the active pointer
and blocks future calculation/attachment, but does not mutate old snapshots or
Runs and is not a deletion claim. Formal source privacy deletion is not connected
yet; an eventual audited privileged workflow must implement it explicitly.

Frames are `symbolic_lens`, `causalUse:false`, with explicit product rules, five
bounded dimensions, source/rule/calculation versions, actual consumed-input
flags and limitations. The local approximate pillar calculator consumes date
and optional time only; unknown time uses three pillars. No birth timezone or
true-solar-time correction, luck hash/score, scientific probability or event
prediction is supported. The reference uses actual server Asia/Shanghai date,
calendar month and approximate year/month structure key, not a whole-month
forecast. Provenance is `sourceRefs`, never Reality/Evidence event references.

Hashes bind requests only. Same owner/key and original operation/revision/source
can recover a safe current projection without recalculating; changed inputs
conflict. Replay after withdrawal remains withdrawn. Raw birth data is excluded
from safe DTOs, audit metadata and logs. Explainable low-weight initial-inclination
fusion before controlled proposals remains a separate gap; freezing this frame
does not alter Claims, probabilities, World or Agent actions.

The four migrations in this fresh-module batch deploy together. Provenance's
NOT NULL columns require an empty snapshot ledger before that step; this batch
does not claim an upgrade/backfill for partially deployed populated symbolic
tables, and must not fabricate trace or request identity for historical rows.

### Optional Run attachment v1

An independent `symbolic_future_attachment` grant binds the current preference
revision, source version and immutable frame snapshot. It defaults false;
source replacement/period refresh/full withdrawal clear it. A stale frame cannot
be newly authorized or attached. New Run admission shares the source writer's
owner lock and fixes its accepted clock only after acquiring that lock. It
atomically freezes `formal-symbolic-run-v1`, including assessed Shanghai period,
frame/rule/calculation versions and the three exact consent references. Raw
birth values are never copied. Empty states are `not_configured`, `not_authorized`,
`stale`, `withdrawn`; only `attached` carries a frame/provenance.

Acceptance means the Run has started for consent purposes, including queued
reservations. Same-key queued/completed recovery uses the original frozen source
and never current preferences. Later withdrawal/correction/period change affects
new keys only. Legacy static bundles remain readable as `not_recorded`, never a
real personal model. Result `symbolicLens` strips internal identifiers; both
strategy paths preserve exactly the same frozen frame. It remains outside seed,
Reality/Evidence, assumptions, proposal weights, causal events, World, Claims
and probability/frequency. Explicit anonymous JWT claims cannot freeze new data;
missing anonymous flags in older owner-scoped legal tokens stay compatible.
Direct-DB banned/deleted stale-token hardening beyond existing RLS is not claimed.

### Outcome / independent reality criteria candidate (2026-10-07)

New runs retain the canonical Core forecast persistence record and atomically store
its actual database time before the observation window. An independent immutable
`formal-reality-criteria-v1` frame binds owner, Seed, path, forecast reference and
frozen source fingerprint. Resource criteria name the self/resource/unit scope,
action order, amount, before/after availability, window and total action count.
GET and POST both replay the canonical lock and deterministically validate the
criteria before any observation write. Legacy missing locks/criteria stay missing;
no retrospective pre-lock is fabricated.

Confirmed typed observations append immutably with per-item actual time and an
independent `matched/different/unknown` comparison. External changes and different
before/after times are preserved, not rewritten to fit simulation conservation.
Before window end the overall comparison is unknown; known differences remain
available. Mixed NPC observations may independently authorize an explicit rule
correction for a new run. Stable opaque keys and row version bind owner, source
run, Seed/Graph/Agent/Profile and exact rule fingerprint. Old runs are unchanged.

The entire Core cluster remains not_observable: this layer does not produce Core
occurrences, Brier scores, accuracy or reality probabilities. Calibration remains
insufficient_data with compatible sample count zero; statistical calibration is
unfinished. The forward SQL rollout and owner/RLS/atomicity acceptance await the
local database daemon; authored SQL is not execution evidence.

## Bounded default planning candidate (2026-10-07)

`formal-default-planner-v1` is a separate formal product lane. Its resource budget
is a maximum simulated allocation for one entire Run, independently per path and
sample, not spending of actual money or a budget shared between hypothetical
Worlds. A non-anonymous owner selects an ordinal resource and explicitly confirms
its budget only against a server-issued `consentContext`. The context binds the
current Seed/Graph/Agent, complete Profile revision/resource definitions and
symbolic consent/frame/period. Resource reordering or source changes invalidate a
new reservation; old-key replay retains the original immutable source.

The server freezes the canonical Profile resource key/type/range/classification
and actual self/strategy source agent. A server-only initial-World receipt derives
Core actor/entity/resource IDs from that source and the neutral policy namespace,
checks real Ledger provenance and captures the actual boundary clock. Continuation
and Result compare the same structural receipt. This is not a client signature or
Evidence. Timing remains acceptedAt <= capturedBoundaryAt <= simulationStartAt.

No permission preserves the old runtime output and metadata absence. With planner
permission, fusion off uses neutral candidates. Independently confirmed
`symbolic-initial-planning-hypothesis-v1` can reduce only first-tick candidate
quantity by at most 10% (two explicit 5% product hypotheses). Neither science nor
traditional probability weights are asserted. Identity/order/count, Core uniform
selection, seeds, declared rates, explicit actions, World initial values and
Reality Evidence remain outside this hypothesis. Any explicit allocation rule on
any path, or a declared rate, makes that resource inactive. Too-small headroom is
inactive; fractions use a downward neutral slice with strict accumulation guards.

Hypotheses have real confirmed self-Assumption Ledger references; symbolic refs
are frozen background trace only. `defaultPlanningSnapshot` and per-trajectory
`defaultPlanningTraces` remain immutable with the run. Complete runtime-bundle
JSON serialization preserves exact structural bindings:
optional object fields follow JSON omission semantics and array gaps become null.
The persistence-consumed top-level event ledger must equal the controlled sample
World events expanded in trajectory/event order, including branch, tick and time;
World-only quantities are insufficient proof of a persisted budget. Safe Result
exposes the frozen hypothesis, neutral/proposed quantity, actual selected/not-selected Event
comparison, budget and safe assumption categories, never source or Event UUIDs.
The v1 lane has no relationship-response effect; it is not full Destiny fusion.
CLI forward migration 20261007143918 is authored but not yet DB-verified.

## Bounded relationship-response planning candidate (2026-10-13)

`formal-default-planner-v2` adds independently confirmed
`formal-relationship-response-hypothesis-v1` beside the compatible v1 lane.
Authorization names one path, resource, exact self information-request rule and
exact conditional NPC response rule. It binds effective rules, complete ordinal
source mappings, owner/Seed/locked Graph/Agent/Profile and accepted source context.
Outcome corrections are applied before comparing the authorized rule pair.

Only a controlled request followed by that NPC's controlled response, including
every `after_rule` ancestor, can trigger the hypothesis. Event actor, targets,
source Evidence/Assumption, sample namespace, command membership and exact tick
times must match. A negative simulated signal reduces the first actually selected
self allocation by 5%; an independent default-off symbolic sensitivity permission
adds 5% only when frozen responsibility count exceeds peer count. The total cap is
10%. Positive/neutral signals keep neutral quantity. Pre-response candidates stay
neutral; unselected candidates do not consume the first-response allocation.

The relationship hypothesis never stacks with the first-tick hypothesis. It
changes candidate quantity only, preserving proposal IDs/order/count, uniform
selection, seeded RNG, NPC actions, explicit resource rules/rates, Graph weights,
initial World and Reality Evidence. Symbolic fields remain Hypothesis/background,
never Real Evidence or scientific probability. This bounded self response does
not complete the third product stage or full Destiny fusion.

Frozen relationship metadata and traces remain per-path/per-sample. Persistence
requires the exact top-level controlled Event ledger and whole-run budget/minimum
resource reserve. Legacy absence is explicit; an empty unauthorized strategy trace
cannot acquire the main path's relationship samples. The forward relationship SQL
is authored in 20261007153523; database execution, Auth/RLS, atomic rollback and
real signed-in frozen replay remain pending while the local daemon is unavailable.

## Current digital-life model draft candidate (2026-10-13)

digital_life_model_drafts is an owner-scoped append-only revision ledger for
unconfirmed configuration. Its revision sequence is global to the owner, not
per Seed: (user_id, revision) is the primary key, parent_revision must be the
prior revision, and (user_id, idempotency_key) is unique. Each row is bound to
its Seed through the owner-composite foreign key. The authored trigger rejects
update/delete, serializes writes for one owner, and compares the expected
revision to that owner's latest revision.

The current source snapshot is the owner's newest submitted, frozen Seed and
its newest Graph and matching Agent snapshot, plus the current Reality Profile
when present. The SQL source reader captures source identities, complete
contents, and ordered Agent/relationship/resource arrays in one stable read.
The stored source signature binds that complete snapshot. The safe model
context preserves the ordered labels and ordinal bindings needed to interpret
the saved rules; stale mappings are never rebound by ordinal to a newer source.

A saved request contains only the versioned draft, expected revision,
idempotency key, 30- or 90-day horizon, source context, and typed draft rules.
Every saved action and strategy has confirmedForSimulation=false. Saving does
not create a Run, Reality/Evidence record, budget permission, planning
permission, or other consent ledger entry. Those remain independent actions
and ledgers.

Reads project current, stale, or not_saved and keep the saved sourceContext
separate from currentSourceContext. A stale draft retains its original source
labels for inspection only. If no current source is available, the current
context can be null; the saved source and rules remain unchanged. An idempotent
save receipt alone does not establish today's source freshness.

The forward SQL adds a draft-specific text validator intended to mirror the
existing TypeScript safe-text boundary, including trim-first limits,
control-character, identifier/contact/secret/URL checks, and safety screening.
Source-level assertions cover ASCII word boundaries, JavaScript whitespace and
UTF-16 limits, UUID shape, and unsafe legacy Profile display values. This is
static parity evidence only; direct-RPC SQL execution is not accepted yet.
Existing Run validators are unchanged. The migration is authored source only:
database execution, owner RLS behavior, concurrent compare-and-swap, and
authenticated persistence have not been verified in a running database.

### Environment-condition rules v2 candidate (2026-10-15)

An environment-condition rule has shape
`{ actionType: update_external_variable, variableKey, value }`, where
`variableKey` is `pressure-N` or `external-variable-N` (`N` 1–8) and `value` is
safe text. It may target only an existing non-unknown Profile variable at its
current ordinal, on the `self` actor/path; the replacement must differ from the
baseline, and each path allows at most one such condition. The v2 rules,
source-context and request envelope must match. Existing saved v1 drafts stay
v1 and saved v2 drafts stay v2; a new unsaved draft initializes to the
current source version, including v2 when `signature_v2` is available. An
explicit `GET ...?prepare_version=v2` additionally returns a separate,
read-only `preparedSourceContext`; it does not save or upgrade a draft. The old
six-field v1 source context remains strict. The model-context DTO may include
optional `variables` selectors for legacy compatibility, but the v2
draft-source requires a `variables` array, which may be empty. The v1 source
hash remains independent and is not backfilled from `signature_v2`. A genuinely
stale source remains inspection-only:
reconfiguration starts from an empty draft against the current source and
never carries old ordinal mappings over.

Each path may contain at most one environment condition, occupying one of that
path's existing action slots (three for a 30-day horizon, six for 90 days).
The original value remains a Reality fact or assumption; the explicitly
selected replacement is a distinct simulation assumption. This is not a claim
about private psychology. Only a selected condition that actually produces its
controlled Event can enable its same-path `after_rule` successor chain. Results
are independently scoped to each sample/path and distinguish
`selected`/`not_selected`/`not_triggered`/`not_reached`; only a matching actual
Event may expose the changed value and downstream events. An early-ending
candidate may be `not_reached`; no exact real-world timing is promised. V2 Core,
Reality snapshots, Graph, and RNG are unchanged.

### Explicit Profile-update model reconciliation candidate (2026-10-16)

Reconciliation is an in-memory plan over the owner's existing saved draft and
the current prepared v2 source. It adds no table, migration, persisted source
version, or mutable draft row. The saved draft remains an immutable historical
revision until the user separately saves a new unconfirmed revision through the
existing append-only `digital_life_model_drafts` writer.

The plan is valid only for the same submitted Seed, locked Graph, Agent
snapshot, ordered Agents, and ordered relationships, with a strictly increased
Reality Profile revision. A source-chain change is not an ordinal migration:
the caller must start a new draft through the existing current-source flow.
The prepare read verifies that the requested revision is still the owner's
latest draft and performs a separate owner/RLS-scoped Seed binding lookup. These
two reads are not atomic. Existing Save source validation, owner-global revision
compare-and-swap, and idempotency checks remain authoritative for persistence.

The reconciliation plan carries the original `sourceRules` and identifies each
rule that needs an explicit decision:

- An `allocate_resource` rule requires an explicitly selected current resource
  and a newly validated amount within that resource's available bounds. Old
  resource ordinals and labels are shown for context only; matching by name or
  position is never inferred.
- An `update_external_variable` rule requires an explicitly selected current,
  non-unknown Profile variable and a safe replacement that differs from its
  current baseline. The old variable ordinal is not rebound automatically.
- A commitment with `profileEntryKey` requires the user to detach that old
  Profile association or remove the rule. Detaching removes only the obsolete
  key and preserves the commitment text and status; the new Profile is not used
  to invent the old background text.
- The user may explicitly remove a rule. The UI previews and confirms its
  dependent action and strategy cascade before applying that decision.

Application revalidates the plan against the stale draft and prepared current
source, including graph/Agent/order bindings and the exact requirements. Missing
decisions return `reconciliation_incomplete`; forged, unknown, mismatched,
over-budget, empty, baseline-equal, or otherwise invalid decisions fail closed
without producing a saveable result. A valid result is an unsaved
`digital-life-rules-v2` draft bound to the prepared current source; every action
and strategy has `confirmedForSimulation=false`. Existing rule text,
dependencies, and still-valid strategies are retained unless explicitly
removed. `planning`, `symbolic`, `outcomeCalibration`, and `requestIdentity` are
all reset. Applying the plan writes nothing and grants no permission; Save,
fresh source verification, fresh user confirmation, and a new Run remain
separate operations.

Reconciliation never modifies a prior draft, Run, World, Event, Claim, or
Report. This candidate follows the current user-directed persistent personal
digital-life sandbox direction; it does not make Career the product's final
domain or alter the frozen V2 Core.

### World guard rules v3 candidate (2026-10-19)

V3 extends the existing typed digital-life rule, model, draft, and formal-run
contracts: `digital-life-rules-v3`, `digital-life-model-v3`, and
`digital-life-model-draft-v3`. V1 and v2 rule/model/draft records remain
readable and retain their existing behavior. V3 actions may carry one optional
strict `guard` alongside the existing schedule trigger (`at_tick` or
`after_rule`) and typed operation. This is schedule AND one guard; it is not a
list of guards and does not replace the existing trigger.

Supported guard shapes are:

- `resource_balance` selects a declared `resource-N`, operator `lte` or
  `gte`, and a finite non-negative threshold within the frozen resource
  minimum and maximum.
- `environment_equals` selects a declared `pressure-N` or
  `external-variable-N` and a safe value equal to its frozen initial enum value
  or a value explicitly produced by a same-path rule. No new Reality fact or
  undeclared variable is accepted.

A guarded rule is limited to the self actor of its own path: `main` binds to
the frozen `user_core`; a strategy path binds to that exact `user_variant`.
An NPC/group actor, another path's self, or a variant without its own declared
strategy is not a valid guarded path. Each strategy still requires an action
on that same path. Existing horizon action limits remain in force.

The shared runtime and replay candidate producer uses this precedence:
explicit user-authored rules, then declared per-tick resource rates, then the
separately authorized default planner. The accepted V2 World/Core approval,
selection, and transition code remains the mutation authority. A guard never
changes Reality, Graph weights, RNG identity, or a third party's presumed
intent. For v3, the trajectory policy is `digital-life-adapter-v3`; the
existing Run bundle schema/runtime and reservation writer remain
`formal-run-bundle-m1-v1`, `formal-account-sandbox-m1-v1`, and
`formal-run-reservation-v1`. The migration adds no v3-only raw bundle keys.
The prepared model source remains `digital-life-model-draft-source-v2` with
`signature_v2`; only the explicit prepared protocol and saved
draft/rules/model versions advance.

The derived safe observation projection is `digital-life-guard-observations-v1`.
It is replayed from the existing frozen Run bundle and Core steps; it adds no
persisted raw trace or Run-bundle key. It has three independent samples, each
with its own executed ticks and observations.
Each observation includes its rule key, safe label/unit/description,
`schedule` (`due`, `not_due`, `already_selected`, or `not_reached`),
nullable guard result, candidate result (`selected`, `not_selected`,
`ineligible`, or null), safe before/after values, and an optional step key.
`stepKey` is present only when the matching actual Core Event is selected.
An unreachable tick has null time and state values; there is no synthetic
“waiting” state or inferred future transition.

The no-eligible response uses `formal-path-diagnostics-v1` with
`status:"not_saved"`. A path is `no_actions` only when all three sample
trajectories have zero selected Events; its diagnostics include per-sample
terminal/tick/event counts and that path's guard observations. An early
termination after one or more selected Events does not itself make that
sample/path ineligible. If any whole path is `no_actions`, the diagnostic is a
safe temporary explanation only; events observed on another path do not
become a partial Run, Simulation, Claim, or Report.

An exact v3 no-eligible submission is verified and recorded as an idempotent
terminal receipt on the existing queued reservation, with request and attempt
hashes plus the safe diagnostics. Replay of the same owner/key/body returns
that receipt before mutable source or expiry checks. The reservation is marked
terminal with no Simulation id; changed request content must use a new key.
The UI requires a new explicit confirmation after edits and clears independent
planning, relationship-response, and outcome-correction permissions after a
known no-eligible result. Unknown transport results keep the original full
request body/key locked for replay.

The shared initial-World builder and pure `correction-contracts` schema
extraction are complete; the extracted schema is literally equivalent to the
old schema. The producer reported a 19/19 GREEN review-target run, including
the prior controller-rebinding RED and ten initial-World structure/source
tamper cases, plus complete source-boundary and planner-v1 Event-envelope
implementation with sourcechecks 13/13 GREEN. Independent readonly review
found no unresolved targeted P1/P2; the independent two-file review/runtime
command passed 30/30, exit 0, in 60.11 seconds. The separate SQL-source command
passed 2 files / 22 tests, exit 0. Root's UI command passed 2 files / 7 tests,
exit 0, in 20.80 seconds (session 63034). Producer SQL-test ESLint exited 0;
Root reports final TypeScript and seven-file scoped ESLint exits 0. Test freeze
is complete. These results make the functional/source candidate READY, not a
phase PASS.

The SQL specimen is reconstructed through the actual TypeScript helper and
deep-equality checked. The pgTAP source fixture has been rebuilt from frozen
source; its eight negative classes and gate-off zero-row checks are source
checks only. No PostgreSQL/pgTAP execution is claimed. An earlier pre-fix
seven-file runtime run had 63 PASS and one JSON-compatibility failure; that
failure later passed a targeted check, but the entire seven-file runtime set
has no final all-green result. Database compile/migration/pgTAP, Auth, RLS,
owner isolation, transactional receipt behavior, full-suite/coverage,
real-account acceptance, and phase-level acceptance remain unverified.

### Track A life timeline result projection candidate (2026-10-19)

The browser-safe `timeline-contracts.ts` defines the optional
`formal-simulation-timeline-v1` projection. It can appear on the main
digital-life projection and on each strategy projection. It is a derived safe
projection from the existing frozen Run bundle's
`trajectoryAnalysis.trajectories[].steps`, actual World Events, and current
safe projection maps; it is not stored as a new raw trace or bundle field.
There are exactly three repeated simulation samples. A 30-day horizon has
three timeline ticks per sample and a 90-day horizon has six. Timeline
`tickIndex` and `occurredAt` come from the trajectory steps and actual
recorded events, not from a flattened `bundle.events` list whose tick index is
an event ordinal. No dates, waits, or future states are invented.

Each sample is `completed` or `no_actions`; each tick is `event`, `no_actions`,
or `not_reached`, with a consistent nullable Event reference. `not_reached`
has no time or state value and does not mean “waiting.” The typed action kinds
are `commitment`, `resource`, `relationship_response`, `environment`, and
`information_request`; change kinds are `resource`, `relationship`,
`environment`, `commitment`, and `information_request`. Safe labels and
before/after values describe only recorded changes. A sample is not an
independent policy or a real-world probability.

`priorStepKeys` may reference only actual earlier Events from the same World,
sample, path, and trajectory; cross-path/sample and future references are
invalid. `ruleKeys` are projected from recorded `causalAssumptionIds` through
the assumption ledger to the current path's active rules. The UI labels these
as hypotheses and may show only safe `evidenceSummary` and guard descriptions.
Unresolved causal links remain unrecorded; the projection does not invent
claims, probabilities, or rule associations and does not alter the global
assumption filter.

Compatibility is intentional: absent `trajectoryAnalysis` preserves legacy
steps with no timeline. A valid old analysis without a typed digital-life
model preserves the old steps only; the system does not rerun or backfill
history. A present but malformed/inconsistent analysis rejects the result
projection instead of falling back. This feature changes no SQL, raw bundle
keys, or V2 Core behavior.

### Outcome / independent reality criteria v2 candidate (2026-10-19)

New runs may freeze `formal-reality-criteria-v2` inside the existing
`frozenRealityCriteria` Run field. It is derived by deterministic replay of the
actual frozen bundle; it does not run a new simulation. V2 admits only the
owner's main path and a representative trajectory actually bound to the
corresponding Claim. The bounded standard covers either a self-resource-only
trajectory or a same-trajectory request/response chain: the user asks an NPC
and the NPC produces a visible relationship response. That chain may extend
to a later explicit `after_rule` action that changes the user's own resource;
this resource action is optional, not a requirement for every valid chain.
Timestamps alone do not establish causality; the recorded Event predecessor
references and exact rule bindings must agree for each included step.

Each frozen target binds its representative trajectory id and seed, selected
Event ids, and rule keys. Its safe review contract contains ordered ordinal
step references, named review groups, and typed conditions for the actual
operation, observed response, resource before/after values, and the relevant
actor/relationship/resource/source confirmations. The safe Outcome API adds
`criteriaVersion`, `review`, and `correctionRequirements`; the last are derived
from frozen rules and exact condition references and are not copied into
`frozenRealityCriteria` or its fingerprint.

The existing `formal-reality-criteria-v1` builder, order, and hashes remain
unchanged. A run without a pre-run standard stays `not_recorded`; neither v1
nor v2 is retrofitted into old Runs. This independent comparison does not
score a Core Cluster, create a Brier score, or turn simulation frequency into
a real-world probability. Individual known differences can be preserved while
unknown and unfilled items remain unknown; an open observation window keeps
the aggregate comparison unknown.

`usedCorrections` is an optional typed Result receipt, only for the main path.
It is derived from the new Run's frozen correction input and a same-owner,
completed formal source Run with a matching frozen Forecast Lock. Projection
revalidates the source lock, immutable owner/Seed/Graph/Agent/Profile scope,
source rule and changed operation, and actual selected Event per sample. The
receipt distinguishes `executed` from `not_executed`; it is not evidence that
reality improved and does not imply automatic learning. If source data is
unavailable, the existing Result remains available with an empty
`source_unavailable` receipt; contradictions fail closed. Strategy-path
projections do not receive this receipt. History comparison displays each
side's own frozen receipt rather than borrowing the other side's.

The compatibility reader restores only explicitly optional `undefined` fields
omitted by JSON serialization inside the named frozen Reality Boundary
ledgers. It first checks canonical JSON equality to the stored values, rebuilds
the Forecast Lock and requires structural JSON equality, then returns only
through the existing Core persistence parser. It does not change any original
Core ids, signatures, hash construction, writer, or historical artifact.

Forward migration
`20261018173334_formal_reality_criteria_review_v2.sql` replaces only the
completion-trigger function to accept and bind v1/v2 criteria; it does not
alter tables, RLS, grants, or the append RPC. Source-structure checks are not
PostgreSQL compilation or migration execution; this migration has not been
executed against the local database.

## Track B B3 multi-domain life-climate candidate (2026-10-20)

`life-climate-b3-v1` is a separate Stage 6 functional candidate for a
conditional, coarse-grained comparison across several life domains. It does
not replace or rewrite the B1/B2 `life_climate_runs` ledger, its request
hashes, historical records, or writers, and it does not alter Track A's
canonical simulation/Event/Claim/Report chain or V2 Core. It is one candidate
inside the fixed nine-stage product route; it neither narrows the total goal
nor establishes complete Track B acceptance.

### Frozen source, paths, and stage model

Each new intent freezes the authenticated owner's newest submitted/frozen
Seed and the matching Reality Profile revision in a source snapshot with a
canonical SHA-256 context. The complete Profile input contains three scalar
Reality fields, five bounded lists, and all six life-model domains
(`identity`, `career`, `wealth`, `relationships`, `environment`, and
`lifeStage`), plus declared `worldInputs` resources and constraints. Every
Profile entry preserves its `fact` / `assumption` / `unknown` classification
and safe evidence summary. Unknown values stay null/empty and explicitly
unknown; they are never substituted with numeric zero or inferred from other
domains. The source snapshot also binds its Profile revision and server
assessment time. A changed source or revision cannot silently rebind an
existing intent.

A comparison contains one `baseline` plus at least two confirmed alternatives
(up to three). One year uses four quarters; three and five years use three and
five coarse annual stages. Quantities are explicit decimal strings with their
own unit and `once` / `quarter` / `year` period. A quarterly amount is not
converted into an annual rate, and absence or unknown remains unknown rather
than zero. The model carries separately confirmed assumptions, source
references, stage rules, up to eight resource declarations and the source
constraint bindings. Each stage retains the six domains, the broader context,
deadline status, resource balances, investments, transitions, and required
obligations.

Typed rules cover scenario changes, one-time resource changes, recurring
flows, investment cycles, relocation, guarded structural transitions, and
transition readiness. An investment records only explicitly declared time
and cost inputs; it does not imply ability growth, hiring, income, or success.
Existing deadlines remain bound to their declared resource and date. A
deadline inside a coarse stage is unknown for that stage; a deadline already
passed is constrained and never extended. Stage evaluation validates all
guards, explicit amounts, and resource bounds before applying a rule's planned
resource and structure effects together. A constrained or unknown operation
does not partially apply its planned deltas. Execution order is fixed by rule
phase, then the user's order within that phase: scenario changes, relocation
and one-time changes, recurring flows, investment, then guarded/transition
rules. Required recurring flows are obligations assessed for each applicable
stage; optional flows do not become obligations. An unfunded required outflow
is recorded as unfunded/constrained rather than silently paid.

### Event, Claim, and independent Symbolic boundaries

Generated B3 Events preserve their path, stage, sequence, rule, source
references, confirmed assumption references, before/after values, and causal
predecessor Event digests. Causal references must point to earlier Events in
the same path. Every B3 Claim has one or more `evidenceEventIds` that resolve
to Events from the same path and matching source/assumption references; the
Report references the exact resulting Claim set. These are B3's own
conditional simulation artifacts, not Track A `event_logs`, real-world
evidence, or proof that an event occurred. No exact event dates, probability,
or deterministic forecast is provided.

An optional future Symbolic series is a separate, default-off attachment that
requires the existing current eligible source and explicit consent for this
comparison. It is derived per coarse stage and remains non-causal: it cannot
change resources, rules, guards, Events, Claims, or their evidence. Raw birth
input and Seed safety material stay in private intent columns and are omitted
from owner-readable columns and public result projections. The public Run
projection strips the source binding (Seed/Profile identifiers); it still
revalidates the persisted source snapshot, exact original request, deterministic
result, Event-to-Claim links, and Report references before returning history.

### Intent/receipt storage and current evidence boundary

The forward candidate migration adds only `life_climate_b3_intents` and
`life_climate_b3_receipts`. Both are owner-bound; authenticated browser roles
have RLS-scoped read-only access to an allowlist of safe columns. They cannot
insert, update, or delete. Server-only `SECURITY INVOKER` RPCs have the narrow
`service_role` execution grant and append intents/receipts after validating
owner, source, request digest, confirmation sets, and result evidence. Same
owner/key/same-body recovery checks the saved intent and receipt before mutable
Seed/Profile/source/consent/time checks; same key with changed content is a
conflict. A receipt is either a completed bundle, an explicit terminal
rejection, or absent while the registered intent is still pending after a
transient failure. Exact replay must return the original frozen source and
body, not rebuild them from today's profile.

Both tables have immutable update/delete triggers. Although the proposed
foreign keys name `ON DELETE CASCADE`, the row-level immutability triggers
reject deletion of B3 history, so physical account deletion cannot complete
through this candidate schema alone. The account deletion workflow and an
audited B3 erasure path are not implemented; this restriction must be resolved
before claiming complete account deletion. The B3 feature source is committed
and pushed to the development branch at
`611460724ed075f44139258e2b3a977d50bb4eca`, and an exact-SHA clean build
passed. The migration and pgTAP file remain authored candidates only: neither
has been executed against PostgreSQL, so table grants, RLS, invoker gates,
trigger behavior, and transactional replay are not database acceptance
evidence. Docker Engine was unavailable for the local database gate. See the
[B3 TDD record](testing/life-climate-b3.tdd.md) for bounded test/preview
evidence and remaining gates.
