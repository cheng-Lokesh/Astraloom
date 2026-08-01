# Project Astraloom API Contracts

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

Purpose: Persist deterministic candidate people for one formal submitted Track A
Seed.

Allowed operations:

- Require the current Supabase user session.
- Accept only a strict Seed selector and UUID idempotency key.
- Call only the two-argument `extract_key_people_phase3(seed_id,
  idempotency_key)` boundary. That RPC re-reads an owned, frozen
  `status=submitted` crossroad Seed and derives a conservative, ordered role
  set from persisted Seed fields inside the database.
- The API and browser never send candidate names, relationships, roles,
  confidence, evidence, source, or provenance to the extraction writer.
- Low-confidence output stays `needs_confirmation` and is never silently
  confirmed. Repeated role mentions are normalized to one canonical candidate.
- Return `{ ok, error_code, trace_id }` on every result. Foreign and missing
  Seeds both return `404 seed_not_found`.

Input:

```json
{
  "selector": { "seed_id": "UUID" },
  "idempotency_key": "UUID"
}
```

Output:

```json
{
  "ok": true,
  "trace_id": "string",
  "error_code": null,
  "idempotent": false,
  "people": []
}
```

Forbidden:

- Do not accept raw Seed fields, a user id, client-selected people, evidence,
  version, or trace input.
- Do not call an LLM, create Agent Profiles or edges, or change edge weights.

### `GET /api/key-people?seed_id=...`

Purpose: Recover the current user's candidate and confirmed Key People for one
submitted owned Seed. The response exposes only person-facing fields and never
raw Seed text, trace bodies, credentials, or foreign-object metadata.

### `/api/reality-intake`

Purpose: Run DeepSeek only for Reality Intake extraction before Grounded Reality
Model construction.

Allowed operations:

- Call DeepSeek only when `LLM_ENABLED=true`, `LLM_PROVIDER=deepseek`, and
  `DEEPSEEK_API_KEY` is configured.
- Extract structured reality nodes, grounded pressures, missing information,
  external search questions, clarification questions, and safety notes.
- Validate model JSON before returning it to the product flow.
- Return `llmUsed`, provider, warnings, validation errors, and a
  `RealityIntakeDraft`.
- Fall back to local/manual Reality Intake without blocking the run when the
  model is disabled, unavailable, returns invalid JSON, or fails validation.

Input:

```json
{
  "seedContext": {},
  "destinyProfile": {},
  "destinyClimate": {},
  "manualRealitySources": [],
  "locale": "en"
}
```

Output:

```json
{
  "ok": true,
  "llmUsed": true,
  "provider": "deepseek",
  "realityIntake": {},
  "warnings": [],
  "validationErrors": []
}
```

Forbidden:

- Do not use DeepSeek outside Reality Intake for this route.
- Do not generate final findings, report text, destiny judgments, or risk level.
- Do not create Claims, Reports, RelationEdges, payments, Stripe writes, or
  production database writes.
- Do not raise confidence above validator caps.
- Do not accept model output that cannot trace back to user input, manual
  material, or explicit external search need.

### `/api/reality-search`

Purpose: Fetch external reality sources for validator-reviewed Reality Intake
search questions.

Allowed operations:

- Return `noop` fallback when `REALITY_SEARCH_ENABLED=false` or provider is not
  configured.
- Support `generic_http_search` through `REALITY_SEARCH_ENDPOINT` for future
  Tavily, SerpAPI, Bing, Perplexity, or self-hosted search adapters.
- Send only `query`, `locale`, `domain`, and `expectedSourceType` to the generic
  endpoint.
- Convert returned search results into `ExternalRealitySource`.
- Validate every source before it enters `RealityIntakeDraft.externalSources`.
- Return warnings and validation errors without blocking the main run.

Input:

```json
{
  "searchQuestions": [
    {
      "id": "string",
      "question": "string",
      "reason": "string",
      "expectedSourceType": "job_market",
      "priority": 80,
      "confidence": 60
    }
  ],
  "locale": "en",
  "primaryDomain": "career"
}
```

Output:

```json
{
  "ok": true,
  "searchUsed": false,
  "provider": "noop",
  "sources": [],
  "warnings": [],
  "validationErrors": []
}
```

Forbidden:

- Do not generate final findings, Reports, Claims, destiny judgments, or
  deterministic predictions from search results.
- Do not treat search output as absolute fact.
- Do not raise confidence above validator caps.
- Do not create payments, Stripe writes, privileged writers, or production
  database writes.

### `/api/key-people/confirm`

Purpose: Atomically manage a submitted Seed's persisted Key People.

Allowed operations:

- Require `{ selector: { seed_id }, idempotency_key, operations }`, validated
  as a strict Zod batch of `confirm`, `rename`, `delete`, `merge`, or
  `supplement` operations.
- Use only `mutate_key_people_phase3`, which re-reads owner and submitted-Seed
  scope and is content-bound idempotent.
- Merge only same-owner, same-Seed people and union/deduplicate their evidence
  references.

Forbidden:

- Do not accept `user_id`, `evidence_refs`, version, trace, or unknown input.
- Do not expose or edit relation edge weights or write Agents/Edges.

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
  SafetyVerifier downgrades the scenario, rate limits, disabled AI config, or
  the tester allowlist.

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

- Do not call an LLM from this route during controlled beta. Report copy must
  come from the deterministic Report Engine unless a later task explicitly
  approves a separate report-text gate.
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
- Return today's LLM call count, fallback count, and cost estimate.
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
