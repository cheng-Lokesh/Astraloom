# Project MiroFish Data Contracts

This file defines the minimum data ledger for the MiroFish MVP. Any schema change must update this file.

## Core Evidence Chain

All important generated output must be traceable through this chain:

`user_profiles -> seed_contexts -> key_people -> agent_profiles -> relation_edges -> simulations -> simulation_ticks/event_logs -> claims -> reports -> feedback_logs`

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

- `recentEventsText`
- `decisionOptionsText`
- `forbiddenActionsText`
- `desiredOutputText`
- `privacySafetyAck`

These local fields are folded into extraction, safety scanning, and local
builder context. They do not add production backend writes.

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
