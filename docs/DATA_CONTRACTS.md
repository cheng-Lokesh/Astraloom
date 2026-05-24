# Project MiroFish Data Contracts

This file defines the minimum data ledger for the MiroFish MVP. Any schema change must update this file.

## Core Evidence Chain

All important generated output must be traceable through this chain:

`seed_contexts -> key_people -> agent_profiles -> relation_edges -> simulation_runs -> simulation_ticks/events -> claims -> reports -> feedback`

## Table Principles

- Every user-owned table must include `user_id`.
- Every generated artifact must include `version`.
- Every generated artifact should include `trace_id` where it participates in a generation or simulation pipeline.
- LLM-related records must include `model_version`, `prompt_version`, `cost_estimate`, and `error_code` where relevant.
- Claims must reference `evidence_event_ids`.
- Reports must reference Claims and must not invent unsupported conclusions.
- User-visible graph data must come from Agent Profiles and Relation Edges, not arbitrary visual mock nodes once the feature leaves mock mode.

## Minimum Tables

### users

Purpose: Account and profile anchor.

Minimum fields:

- `id`
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
- `simulation_run_id`
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

### simulation_runs

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
- `safety_level`
- `trace_id`
- `error_code`

### simulation_ticks

Purpose: Stores each simulation step and graph snapshot.

Minimum fields:

- `id`
- `user_id`
- `simulation_run_id`
- `created_at`
- `updated_at`
- `version`
- `tick_index`
- `time_label`
- `environment_state`
- `agent_state_snapshot`
- `relation_graph_snapshot`
- `summary`
- `trace_id`
- `error_code`

### events

Purpose: Stores evidence events created by Simulation Ticks.

Minimum fields:

- `id`
- `user_id`
- `simulation_run_id`
- `simulation_tick_id`
- `created_at`
- `updated_at`
- `version`
- `event_type`
- `agent_ids`
- `relation_edge_ids`
- `summary`
- `before_state`
- `after_state`
- `edge_weight_deltas`
- `confidence`
- `source`
- `trace_id`

### claims

Purpose: Stores reportable conclusions backed by events.

Minimum fields:

- `id`
- `user_id`
- `simulation_run_id`
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
- `simulation_run_id`
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

### writer_audit_events

Purpose: Append-only audit ledger for privileged server writers.

Minimum fields:

- `id`
- `created_at`
- `updated_at`
- `trace_id`
- `contract_id`
- `lifecycle`
- `actor_type`
- `user_id`
- `user_id_hash`
- `target_tables`
- `idempotency_key`
- `request_hash`
- `gate_decision`
- `blocked_codes`
- `writer_version`
- `model_version`
- `prompt_version`
- `cost_estimate`
- `error_code`
- `metadata`

Browser clients must not insert, update, or delete audit rows.

### writer_idempotency_keys

Purpose: Prevent duplicate privileged writes, especially Stripe webhook and AI
generation retries.

Minimum fields:

- `id`
- `created_at`
- `updated_at`
- `key`
- `trace_id`
- `contract_id`
- `user_id`
- `request_hash`
- `status`
- `response_ref`
- `error_code`
- `expires_at`

Duplicate webhook or generation events must return the existing result instead
of writing a second entitlement or generated artifact.

### generation_jobs

Purpose: Records gated AI generation attempts and their cost/safety metadata.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `simulation_run_id`
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

### feedback_log

Purpose: Stores user calibration feedback after report delivery.

Minimum fields:

- `id`
- `user_id`
- `seed_context_id`
- `simulation_run_id`
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

### payments

Purpose: Stores payment intent and entitlement state.

Minimum fields:

- `id`
- `user_id`
- `simulation_run_id`
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
- `related_simulation_run_id`

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

## RLS Requirements

- User-owned rows must only be readable by the owning user.
- User-owned rows must only be writable by the owning user unless the table is system-owned.
- System-owned generated artifacts must not become browser-writable unless explicitly approved.
- Service-role clients must live only in server-only modules and must be gated
  by environment flags, auth/webhook verification, idempotency, audit evidence,
  and stable `error_code` responses.
