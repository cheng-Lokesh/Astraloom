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
- Use DeepSeek fast model only when `ENABLE_SYSTEM_WRITERS`,
  `ENABLE_AI_GENERATION`, service-role auth, and `DEEPSEEK_API_KEY` are ready.
- Record `generation_jobs` with `trace_id`, `model_version`,
  `prompt_version`, `cost_estimate`, and `error_code`.

Forbidden:

- Do not create final Agent Profiles unless the task explicitly includes that transition.
- Do not infer private facts as high-confidence truth.
- Do not run when high-risk seed text requires safety downgrade.

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

- Create user core, user variants, NPC, or group agent drafts.
- Include source, confidence, and evidence refs.
- Record a gated generation job. The LLM output is advisory until validated and
  persisted by backend rules.

Forbidden:

- Do not invent unsupported biography or hidden motives as fact.
- Do not directly produce final report claims.
- Do not modify Relation Edge weights.

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

- Refund request.
- Generation failure report.
- Safety appeal.
- General support.

### `/api/privacy/delete-request`

Purpose: Record account or simulation deletion requests.

Allowed operations:

- Store deletion request and consent event.

Forbidden:

- Do not silently delete generated evidence without an auditable request state unless the task explicitly implements deletion.

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
