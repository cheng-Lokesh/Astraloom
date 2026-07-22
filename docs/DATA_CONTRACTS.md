# Project Astraloom Data Contracts

This file defines the minimum data ledger for the Astraloom MVP. Any schema change must update this file.

## Core Evidence Chain

All important generated output must be traceable through this chain:

`user_profiles -> seed_contexts -> key_people -> agent_profiles -> relation_edges -> simulations -> simulation_ticks/event_logs -> claims -> reports -> feedback_logs`

Manual Reality Intake V1 adds a local MVP grounding draft before Grounded
Social Simulation:

`seed_contexts -> reality_intake_drafts -> grounded_social_simulations`

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

## RLS Requirements

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
