# Project MiroFish API Contracts

This file defines API boundaries for the MVP. Any route added or changed must update this file.

## API Principles

Each non-static API must include:

- Input validation.
- Auth check where user data is involved.
- `user_id` ownership check.
- Error response with stable `error_code`.
- `trace_id` for generation, simulation, persistence, or support flows.
- No secrets in responses or logs.
- No cross-user data access.

## Target API Routes

### `/api/seed-context`

Purpose: Create, read, and update simulation seed context.

Allowed operations:

- Save track, scenario, question/theme, time horizon, raw context, decision options, and forbidden actions.

Forbidden:

- Do not generate Agent Profiles.
- Do not call LLM.
- Do not create reports.

### `/api/key-people/extract`

Purpose: Extract candidate people from intake text.

Allowed operations:

- Return candidate people with confidence, evidence snippets, and missing fields.
- Use an LLM only for candidate Key People extraction.
- Validate request and model output with Zod.
- Attach a `trace_id` to every request.
- Record a model call log entry with `prompt_version`, `model_version`,
  `latency_ms`, `cost_estimate`, and `error_code`.
- Fall back to local `extractPeopleCandidates` when the LLM is unavailable,
  times out, returns invalid JSON, fails schema validation, or is blocked by
  SafetyVerifier.

Input:

```json
{
  "seedContextId": "string",
  "seedContext": {
    "id": "string",
    "questionText": "string",
    "trackType": "crossroad",
    "timeWindow": "90_days",
    "situationSummary": "string",
    "keyPeopleText": "string",
    "privacyAck": true,
    "locale": "zh",
    "status": "submitted",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
}
```

Output:

```json
{
  "ok": true,
  "trace_id": "string",
  "source": "llm",
  "model_version": "string",
  "prompt_version": "extract-people-v1",
  "latency_ms": 0,
  "cost_estimate": 0,
  "error_code": null,
  "people": [
    {
      "display_name": "string",
      "relationship_to_user": "boss",
      "role_type": "authority",
      "confidence": 0.82,
      "known_evidence": ["string"],
      "missing_fields": ["string"],
      "source_refs": ["string"]
    }
  ],
  "uncertainty_flags": ["string"]
}
```

Fallback output keeps the same shape and uses:

- `source: "local_fallback"`
- `fallback_reason`
- `model_version: "not_called"` when no model call was made
- `candidates` as local `KeyPersonDraft[]` for the current MVP UI bridge

Forbidden:

- Do not create final Agent Profiles unless the task explicitly includes that transition.
- Do not infer private facts as high-confidence truth.
- Do not run when high-risk seed text requires safety downgrade.
- Do not generate Claims.
- Do not generate Reports.
- Do not generate RelationEdges.
- Do not modify edge weights.
- Do not judge whether a third party loves, betrays, deceives, or secretly
  intends something.

### `/api/key-people/confirm`

Purpose: Save user confirmation decisions.

Allowed operations:

- Confirm, delete, rename, merge, or supplement candidates.
- Preserve `evidence_refs` when merging.

Forbidden:

- Do not expose or edit relation edge weights.

### `/api/agents/generate`

Purpose: Generate Agent Profile drafts from confirmed people.

Allowed operations:

- Create Agent Profile drafts only.
- Always include `user_core`.
- Include at most one or two `parallel_self` drafts.
- Create one `npc` draft for each confirmed Key Person.
- Include `source_type`, `confidence`, and `evidence_refs` for generated
  fields.
- Validate request and model output with Zod.
- Fall back to local `buildAgentProfiles` when the LLM is unavailable, times
  out, returns invalid JSON, fails schema validation, violates safety language,
  or SafetyVerifier downgrades the scenario.

Forbidden:

- Do not invent unsupported biography or hidden motives as fact.
- Do not directly produce final report claims.
- Do not modify Relation Edge weights.
- Do not create Reports.
- Do not run simulation.
- Do not judge third-party private thoughts, betrayal, love, deception, or
  deterministic future outcomes.

### `/api/graph/generate`

Purpose: Generate initial read-only Relation Graph.

Allowed operations:

- Create Relation Edges from Agent Profiles and evidence.
- Store weights and confidence.

Forbidden:

- Do not accept user-edited edge weights.
- Do not expose internal scoring formulas as editable controls.

### `/api/simulation/run`

Purpose: Execute Simulation Tick flow.

Allowed operations:

- Freeze input graph.
- Run tick engine.
- Create simulation ticks and events.
- Update relation edge snapshots through rule-owned logic.

Forbidden:

- Do not let LLM directly decide final conclusions.
- Do not let the user intervene with continuous RPG choices mid-run.

### `/api/events`

Purpose: Read Event Logs for a simulation.

Allowed operations:

- Return event summaries, related agents, related edges, and before/after deltas.

Forbidden:

- Do not expose another user's events.

### `/api/reports/generate`

Purpose: Build report sections from Claims and evidence.

Allowed operations:

- Generate report copy downstream of Claims.
- Preserve `claim_ids` and `evidence_event_ids`.
- Generate `free_preview` and `paid_sections` only from existing Claims, Events,
  Agent Profiles, and Relation Edges.

Forbidden:

- Do not create strong claims without evidence.
- Do not increase certainty for paid reports.
- Do not accept Claims that lack `evidence_event_ids`.

### `/api/payments/create-checkout-session`

Purpose: Create a Stripe Checkout Session for paid evidence unlock.

Allowed operations:

- Require authenticated user, service-role writer gate, and Stripe write gate.
- Create Stripe Checkout Session.
- Insert a `pending` payment row with `unlock_scope=single_simulation_report`.

Forbidden:

- Do not change simulation results.
- Do not bypass safety downgrade.
- Do not grant entitlement from checkout creation alone.

### `/api/payments/webhook`

Purpose: Record Stripe-owned payment and entitlement transitions.

Allowed operations:

- Verify Stripe signature before trusting the event.
- Use `writer_idempotency_keys` so duplicate webhook delivery is safe.
- Grant `single_simulation_report` entitlement only after amount, currency, and
  Checkout Session checks pass.
- Update failed, expired, refunded, or disputed states without deleting history.

Forbidden:

- Do not accept browser-authenticated payment writes.
- Do not regenerate stronger paid Claims after payment.
- Do not bypass safety downgrade.

### `/api/support/create`

Purpose: Create support tickets.

Allowed operations:

- Create `generation_failure`, `refund_request`, `safety_appeal`,
  `privacy_delete_request`, `billing_question`, or `general_support` tickets.
- Link optional `report_id` or `simulation_id` references.
- Return only ticket metadata and a short message preview.
- Attach a `trace_id`.

Input:

```json
{
  "ticketType": "generation_failure",
  "subject": "string",
  "message": "string",
  "relatedReportId": "string | null",
  "relatedSimulationId": "string | null"
}
```

Output:

```json
{
  "ok": true,
  "trace_id": "string",
  "ticket": {
    "id": "string",
    "ticketType": "generation_failure",
    "status": "open",
    "priority": "p1",
    "subject": "string",
    "messagePreview": "string",
    "relatedReportId": "string | null",
    "relatedSimulationId": "string | null",
    "sensitiveInputHidden": true
  }
}
```

Forbidden:

- Do not create a customer-service chat system.
- Do not expose unnecessary sensitive source text in admin responses.
- Do not modify Claims, EventLogs, report conclusions, payment records, or
  entitlement state.

### `/api/privacy/delete-request`

Purpose: Record account or simulation deletion requests.

Allowed operations:

- Store a `privacy_delete_request` support ticket.
- Store a deletion-related consent event.
- Link optional `report_id` or `simulation_id` references.
- Return `deletion_started: false` until a separate audited deletion workflow is
  implemented.

Forbidden:

- Do not silently delete generated evidence without an auditable request state unless the task explicitly implements deletion.
- Do not directly hard-delete all user data from this route.
- Do not rewrite historical Claims, EventLogs, or Reports.

### `/api/admin/support-tickets`

Purpose: Minimal Admin/Ops support ticket queue.

Access:

- Requires `MIROFISH_ADMIN_TOKEN` to be configured server-side.
- Requests must include `x-mirofish-admin-token`.
- If the token is missing or incorrect, the route must not return ticket data.

Allowed operations:

- `GET`: list support ticket metadata, generation failures, and safety appeals.
- `PATCH`: mark a ticket status as `open`, `triaged`, `in_review`,
  `resolved`, or `closed`.
- Return only short message previews and references.

Forbidden:

- Do not expose full raw intake or unnecessary private message text.
- Do not allow admin edits to Claims, EventLogs, Reports, RelationEdges, or
  report conclusions.
- Do not issue real refunds.
- Do not perform hard deletion.
- Do not create a support chat system.

### `/api/admin/observability`

Purpose: Read generation-chain observability summaries.

Access:

- Requires `MIROFISH_ADMIN_TOKEN` to be configured server-side.
- Requests must include `x-mirofish-admin-token`.
- If the token is missing or incorrect, the route must not return generation,
  support, or audit summaries.

Allowed operations:

- List recent generation tasks.
- List failed tasks.
- Return average cost, `error_code` distribution, and `prompt_version`
  distribution.
- Return metadata only.

Forbidden:

- Do not expose service keys.
- Do not expose raw prompts or unnecessary sensitive input.
- Do not allow admin mutation from observability views.

## Service Boundary

LLM services may handle semantic extraction and copy generation:

- `services/llm/extractPeople`
- `services/llm/generateAgents`
- `services/llm/generateCandidateActions`
- `services/llm/generateReportText`

Current Beta provider: DeepSeek OpenAI-compatible Chat Completions API
(`DEEPSEEK_BASE_URL=https://api.deepseek.com`). Default model env values are
`DEEPSEEK_MODEL_FAST=deepseek-v4-flash` and
`DEEPSEEK_MODEL_DEEP=deepseek-v4-pro`, configurable per environment.

Simulation services own state transitions and evidence:

- `services/simulation/tickEngine`
- `services/simulation/edgeUpdateRules`
- `services/simulation/confidenceScoring`
- `services/simulation/eventLogger`
- `services/simulation/claimBuilder`

LLM output is advisory until converted into validated state by the backend rules.
