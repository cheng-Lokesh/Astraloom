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

### Reality Profile API

- `GET /api/reality-profile` requires a session and returns only the owner’s
  newest submitted/frozen Seed profile. It returns `401` without a session,
  `409` when no formal Seed exists, and never accepts an owner or Seed
  identifier from the request. “Newest” is ordered by `submitted_at DESC`,
  then `id DESC` as a stable tie-breaker shared with Dashboard and RLS.
- `PUT /api/reality-profile` accepts the three scalar Reality fields, five
  bounded item lists (goals, values, life themes, pressures, and external
  variables), and six long-horizon life-model lists (identity, career, wealth,
  relationships, environment, and life stage). Every item has its own
  fact/assumption/unknown classification and safe evidence summary. It validates with Zod, scopes storage to the current
  submitted Seed, and uses the revision as an optimistic concurrency guard. A conflicting
  update returns `409`; invalid or malformed input returns `400` without
  persistence. Both endpoints return a correlation `trace_id`; the page does
  not render it or return row identifiers.

### Track B life-climate runs (B1/B2 functional candidates)

`/app/new/life-climate` uses this owner-scoped API for one-theme Track B paths.
Both routes require the current cookie-authenticated user and
return the standard `{ ok, error_code, trace_id }` envelope. The UI never
renders trace or database identifiers.

- `POST /api/life-climate/runs` preserves the B1 request shape for old clients
  and accepts B2 `{ horizon, changes }` with a 1-, 3-, or 5-year horizon and
  one to twelve strict changes. Every change must stay in the same selected
  life-model domain; the same field may change again in a later stage. The
  server derives the owner and
  newest submitted formal Seed from the session, reads that Seed's saved
  Reality Profile, rejects a stale revision, safety-checks the submitted Seed,
  selected saved item, and proposed alternative, then calls the versioned B1
  or B2 server-only writer. A new immutable comparison returns 201; an
  identical idempotent replay returns 200.
- `GET /api/life-climate/runs?limit=...` returns up to 50 newest owner-owned
  B1 and B2 entries. `GET /api/life-climate/runs?run_id=...` opens
  one owner-owned saved comparison. Unknown, duplicate, or malformed query
  selectors return 422; another owner's or missing run returns the same 404.
- B1 history remains readable as a one-year, one-change comparison. B2 adds
  one-theme 1-, 3-, and 5-year paths with four relative sub-year stages or
  coarse annual stages; each selected change creates one Event and one
  evidence-linked Claim. Neither version infers cross-domain effects, assigns
  probabilities, emits precise event dates, invokes an LLM, or edits Track A/V2
  history.

Errors include `401 unauthenticated`, `403 safety_downgrade`, `409
current_seed_required`, `409 reality_profile_required`, `409
profile_revision_conflict`, `409 idempotency_conflict`, `422 invalid_request`,
and sanitized `500 persistence_failed`.

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

## Phase 4 formal account sandbox API

All endpoints require the caller's Supabase user session, return the existing
`{ ok, error_code, trace_id }` family, and scope every lookup by `auth.uid()`.
Another owner's valid identifier is indistinguishable from a missing object.

Before generation, `POST /api/sandbox/runs` reserves the canonical owner/key
request through `reserve_account_sandbox_run`. Its database-assigned acceptance
time, five-minute future simulation start and exact source versions remain
frozen across pending retries, even if the saved Profile or Feedback changes.
Graph lock time is provenance only. Completed retries return the original Run
without generation; changed request content returns 409. An expired pending
request returns 409 `reservation_expired`; it is not silently retimed or
automatically resubmitted. Completion checks actual database time and persists
the precise frozen window and real generation/lock/persistence metadata in the
immutable bundle. Failure responses use `Cache-Control: no-store`.

- `POST /api/sandbox/runs`: accepts a locked Graph snapshot UUID, a UUID
  idempotency key, and a `30` or `90` day horizon. It revalidates the complete
  owned Seed/People/Agent/Graph chain and returns 201 for a new atomic completed
  bundle or 200 for an identical replay. It also freezes the Reality Profile
  belonging to the authenticated owner and that Graph's Seed; when no Profile
  row exists, it freezes revision zero with every dimension explicitly unknown.
  A reused key with different content is 409; unsafe or incomplete input is
  rejected without completed artifacts.
- `GET /api/sandbox/runs/:runId`: returns owner-scoped persisted status and
  phase metadata. Polling is read-only and never creates completion.
- `GET /api/sandbox/runs/:runId/result`: projects the persisted immutable
  bundle only after completion; incomplete runs return 409. The result includes
  ordinal-keyed Reality Profile facts, assumptions, and unknowns from that Run's
  frozen snapshot. It keeps Seed/relationship evidence and system assumptions
  in their existing sections, while omitting raw Seed narrative, Profile
  evidence references, and database identifiers from display fields.
- `GET /api/sandbox/runs?limit=&before=&horizon=`: returns newest-first completed account History. `horizon` is optional and accepts only `30_days` or `90_days`; filtering happens in the owner-scoped server query before stable `(created_at, id)` cursor pagination.
  The opaque compound cursor binds `(created_at, id)` for stable pagination.
- `POST /api/sandbox/runs/:runId/feedback`: the existing overall form accepts
  `useful`, `mixed`, or `off`, a bounded comment, and a UUID idempotency key.
  Targeted feedback accepts `target_type` (`claim`, `agent`, or `relation_edge`),
  a safe ordinal `target_key` (`claim-N`, `person-N`, or `relation-N`), a
  category-valid rating, a bounded comment, and a UUID idempotency key. The
  database resolves the key only against that completed Run's frozen result
  bundle; browser-supplied database identifiers are rejected. RPC row IDs are
  stripped from the targeted response. Both forms are append-only,
  completed-run-only, owner-scoped, and content-bound idempotent.
  Strategy feedback is not accepted until a persisted Strategy item is actually
  present in the formal Result; the API must not invent one.

Malformed input returns 422, unauthenticated requests return 401, owner-hidden
or missing resources return 404, contract conflicts or missing target keys
return 409, and unexpected persistence failures return a sanitized 500. Formal
browser clients must not recover Result, History, completion, or Feedback from
localStorage. Targeted feedback signals are included in the bounded input
snapshot of a later Run; this records the user's signal but does not yet prove
that simulation scoring improves.

### `GET /api/sandbox-overview` (M2.0 candidate)

Purpose: read the signed-in account's smallest truthful My Sandbox projection.

Access and caching:

- Requires the caller's Supabase user session. It accepts no owner, account,
  Seed, Graph, or Run selector from the browser.
- Every read is constrained by the authenticated `auth.uid()` owner. A query
  failure returns a sanitized `persistence_failed` response.
- The route and response use `no-store`; account state is not shared or
  pre-rendered between users.
- The standard response envelope includes a fresh `trace_id` for this HTTP
  response. It is an opaque correlation identifier, not a persisted database
  row `trace_id`, and is allowed and required by the Phase 4 envelope family.

Projection:

- The current chain is exactly the latest submitted Seed and that Seed's latest
  Graph snapshot. Current running Run, latest completed Run, Feedback presence,
  and `next_action` are all constrained to the same owner, execution version,
  Seed, and Graph. Without a current Graph, none of an account's old Runs can
  supply current-chain state.
- Returns only formal Seed presence, confirmed People count, latest immutable
  Agent count, Graph presence/lock/edge count, current-chain running state,
  current-chain Feedback presence, current-chain latest completed-Run
  time/status, one next action, and a separate bounded account-History count.
  Account History can summarize Runs from older chains, but it never drives the
  current next action.
- Result and Running links contain an opaque Run identifier for navigation only;
  the dashboard never renders an object UUID. It never returns email,
  credentials, raw scenario text, persisted database trace ids, evidence
  bodies, or database ids as display fields.
- The response is Zod-validated before it is returned. Invalid server rows fail
  closed instead of becoming a browser fallback.
- The Reality Profile ledger returns separate facts, assumptions, and
  unknowns from the current owner's persisted formal-Seed profile. Life
  climate, resources, constraints, and every item in the five new dimensions
  carry their own user-selected classification and safe evidence summary.
  New dimensions default to explicitly unknown; no repository, localStorage,
  static-case, Seed narrative, or Career-demo value may fill these fields.
- Long-horizon life-model inputs are separately classified under identity,
  career, wealth, relationships, environment, and life stage. My Sandbox shows
  their current completeness; Track A does not treat them as causal evidence,
  and their storage does not imply Track B runs or forecasts exist.
- Structured resources and constraints are projected from the same profile's
  `world_model_inputs`: resources expose their safe label, current amount, unit,
  declared bounds, optional per-tick use, classification, and evidence summary;
  constraints expose their safe resource label and deadline. Canonical keys
  remain server-side, and these saved inputs do not imply a future change.
- The safe World State returns only a current-chain stage and up to three
  allowlisted Event type labels from the current completed formal Run. Each
  Change Node has the fixed evidence summary "来自当前正式运行的受控模拟事件";
  resources and constraints are projected only from that Reality Profile. It
  keeps `nextChange` as `not_modeled` until a real modeled artifact supports a
  watchpoint, and never returns event ids, evidence refs/bodies, trace ids, raw
  summaries, scenario text, emails, or internal keys in the page.

### Account exploration routes

The overview's `lifeClimate`, `resources` and `constraints` can also return
`saved_profile` with source, revision and classified items. `nextChange` can
return `recorded_deadlines` with source, revision, actual server `assessedAt`
and sorted upcoming/expired saved deadlines. These describe current declared
inputs; they do not infer fulfillment, Destiny or future simulated changes.

Primary navigation opens `/app/new/people`, `/app/new/agents`, and
`/app/new/graph` without a selector as current-chain account exploration views.
They fetch only `GET /api/sandbox-overview`, render no database identifiers,
raw evidence references, trace values, or scenario body, and never restore from
browser storage. A `seed_id` is reserved for the explicit Start confirmation or
supplement flow and remains owner-scoped by its existing route contracts.

`next_action.kind` is exactly one of: `start_intake`, `review_people`,
`build_agents`, `review_graph`, `start_run`, `open_running`, or
`open_latest_result` for authenticated users. Anonymous callers receive 401
rather than an overview projection.

### Explicit digital-life rules and readonly model context

`POST /api/sandbox/runs` accepts an optional strict `digital_life_rules` value
(`digital-life-rules-v1`, `digital-life-rules-v2`, or `digital-life-rules-v3`)
beside its existing fields. V3 alone permits one optional strict world guard on
an action; its source and observation boundary is described in the
[World guard v3 contract](DATA_CONTRACTS.md#world-guard-rules-v3-candidate-2026-10-19).
The v2 environment-condition operation is specified in the
[environment-condition data contract](DATA_CONTRACTS.md#environment-condition-rules-v2-candidate-2026-10-15).
It must bind the requested
locked Graph, Agent snapshot and exact Profile revision. Strategies and every
action require explicit simulation confirmation; action rules are assumptions.
Unknown fields, unsupported actions, invalid selectors, unconfirmed NPC intent,
cross-path triggers, out-of-bounds resources and foreign/stale scope fail closed.
No request supplies or overrides owner identity, and legacy requests remain valid.

`GET /api/sandbox/model-context?graph_id=<opaque selector>` returns authenticated,
owner-scoped readonly safe selectors: Graph/Agent binding ids, Profile revision,
ordered `person-N` agents, `relation-N` edges and `resource-N` bounded resources.
The v2 source may additionally carry optional `variables` selectors; the
existing six-field v1 source context remains strict and unchanged.
Opaque binding ids are transport only and must not be rendered. Labels and
classification/evidence summaries are safe; no raw Profile narrative, source
refs, canonical resource keys or third-party-intent inference is returned.

With no `graph_id`, context resolves the newest submitted frozen Seed and its
newest Graph. That newest Graph must be locked: the endpoint never falls back
to an older locked Graph or uses account History to select a chain. With a
selector, it reads only that owned locked Graph's exact Seed/Profile and Agent
snapshot, never the latest unrelated Profile. Anonymous requests return 401;
missing/unlocked default context returns 409 `current_graph_required`; foreign
or malformed selectors and inconsistent object chains are rejected. Responses
are strict-schema validated and `Cache-Control: no-store`; the route writes
no database rows. Graph Start views may consume this context alongside overview.

### Optional symbolic lens routes

`GET /api/symbolic-lens` returns a strict owner-scoped readonly projection:
`lens.{revision,status,sourceVersion,snapshot,consent,futureAttachmentStatus}`.
Status is `not_configured`, `active`, `stale`, or `withdrawn`; attachment is
`connected` (clients still read legacy `not_connected`). GET never reads raw birth inputs for output or writes rows.
Current-calendar-only comparison detects changed month or approximate year/month
structure (including within the same month); a stale snapshot stays historical.

`PUT /api/symbolic-lens` requires JSON, revision and UUID idempotency key. Operation
`replace_source` accepts strict date/optional-time source and two explicit true
consents (storage/calculation); futureAttachment must be false. `refresh_period`
accepts no new source and requires currently active owned source/consents.
Verified `getUser()` determines owner, never a client field. Receipt-first
service-only recovery checks original operation/revision/source before current
source reads or recalculation; matching retry returns 200 with current consent
state, a new atomic save returns 201. Changed input or stale revision is 409.

`POST /api/symbolic-lens/withdraw` accepts only revision/key and atomically appends
withdrawals, disables future use and returns no active snapshot. All endpoints
reject unauthenticated/anonymous Auth callers with 401, malformed input with 422,
and use `Cache-Control:no-store` plus stable errors. Birth values, owner/source/
snapshot/consent identifiers and database error details never appear in DTOs.
The existing source routes never automatically authorize Run attachment.

`GET /api/symbolic-lens/future-attachment` returns only
`attachment.{revision,enabled,eligible,status}`; eligibility is true only for an
active current-period frame. Independent `PUT` accepts strictly
`{revision,enabled,idempotency_key}`; a new operation returns 201, receipt replay
200 with current safe state. A changed key payload, revision conflict, missing
storage/calculation consent or stale period returns 409. The verified-owner,
service-only SECURITY INVOKER writer binds source/snapshot/consent provenance.
Enablement defaults false and correction/refresh/withdrawal reset it.

New formal Run reservation freezes the approved current frame atomically after
the owner lock; receipt recovery does not read mutable current lens preferences.
Queued acceptance counts as started. Disabling future use affects only new keys.
Result returns safe `projection.symbolicLens` (status, frozenAt,
preferenceRevision, frame, causalUse:false), stripping all internal provenance
IDs; legacy static entries return `not_recorded`. No new personal frame enters
causal input or changes frozen historical artifacts. Run POST refuses an
explicitly anonymous verified user before admission.

### Outcome account candidate (2026-10-07)

`GET/POST /api/sandbox/runs/[runId]/outcomes` verify a non-anonymous owner.
POST accepts strict target/key, confirmed observation, uncertainty, summary and
`observations[{key,value,occurred_at?}]`; explicit next-run correction confirmation
is independent. Known timed conditions require actual time inside the frozen
window and no later than recording time; unknown items omit time. Legacy notes
are permitted without late lock construction. Safe history returns typed values,
`occurredAt` and `criteriaComparison{status,differences}`; no internal source IDs.

`GET /api/sandbox/calibration-context?graph_id=...` binds the current graph and
returns safe stable correction keys, schema version, profile revision and
eligibility. Run POST optionally accepts `outcome_calibration{version:1,
confirmed:true,correction_keys}`, default absent. New keys freeze the selected
original correction; pending/completed replay uses the old receipt, not current
state. Changed selection conflicts. Four-argument admission delegates to the same
mandatory-lock implementation; null-selection old hashes remain recoverable.

Responses use no-store, 401 for unauthenticated/anonymous, 422 malformed, 404
missing owned run, and 409 for known observation/correction/lock/window/conflict
errors. Unknown database details are never returned. New service-only writer
stores criteria comparison but refuses Core scoring/calibration artifacts.
Database/Auth/RLS execution acceptance is still outstanding.

## Bounded default planning API candidate (2026-10-07)

`GET /api/sandbox/planning-context?graph_id=...` uses only the current authenticated
non-anonymous session and an invoker/RLS RPC `read_formal_default_planning_context_v1`.
The optional unique UUID graph parameter must match the current submitted
crossroad/locked safe chain. One MVCC source yields both its safe resource labels
and 64-hex `consentContext`. The DTO is version, context, Profile revision,
resources `{resourceKey,label,unit,available,minimum,declaredRate,explicitRulePresent}`
and symbolic eligibility `{status:eligible|off|unavailable,classification:hypothesis,
relationshipEffect:not_implemented}`; it never exposes owner/Agent/source UUIDs.
Draft rules are not current DB sources; admission still checks all effective
rules, including independently selected Outcome corrections.

Run POST adds optional strict `default_planning{version:formal-default-planner-v1,
consentContext,resources:[{resourceKey,totalBudgetLimit,confirmedForSimulation:true}],
fusion:{enabled,confirmedForSimulation}}`. The separate fusion switch defaults
off and both fusion booleans must agree. Clients cannot supply owner, frame,
Core ID, cap, weight or source receipt. Default absence remains the old contract.

Six-argument `reserve_account_sandbox_run` freezes the accepted permission and
source context before execution. Old four/five-argument callers delegate with
null planning, preserving old content-hash and receipt recovery. Receipt-first
pending/completed recovery does not read or rebuild today's Profile/lens. New
planner keys compare the same frozen source context before any reservation insert;
changed request bodies conflict. Stale context / invalid authorization returns a
safe 409, not raw database details. All context/Start/Result responses are no-store.

Result adds optional safe `projection.defaultPlanning`, also per strategy. It
contains frozen hypothesis, initial/minimum/budget quantities and actual controlled
Event comparisons with safe Assumption categories. Sample trajectory identity,
seed namespace, final World and resource source binding are validated before
projection. The complete top-level event ledger consumed by persistence must match
sample World events with exact trajectory branch, tick order, time and payload;
changing only a displayed/persisted amount is rejected. Complete JSON roundtrip
retains the structural binding. Invalid persisted bundles return no safe projection.
Missing legacy planning remains absent, not reconstructed from current preferences. SQL source
review and mock transport tests do not prove actual DB/RLS execution acceptance.

### Bounded relationship-response request v2 (2026-10-13)

Run POST also accepts `default_planning.version=formal-default-planner-v2` with
strict `relationshipResponse` containing version, pathKey, authorized resourceKey,
explicit confirmation, complete requestRule/responseRule and an independent
`symbolicSensitivity{enabled,confirmedForSimulation}` pair. Both sensitivity
booleans agree and default false. Unknown fields, missing budget permission,
cross-path pairs, stale source context and rules differing from the exact effective
accepted rules fail closed. Clients cannot supply frozen source IDs, reductions,
assumption IDs or World receipts. The context DTO stays compatible with v1.

The six-argument admission binds the complete v2 request in its content hash;
same-key recovery reads the original receipt before current Profile/lens/Graph
selection. Four/five/six-argument old requests retain their hashes and behavior.
Start rejects a mismatched frozen planning body or consent context before runtime
or persistence. Only new keys use current-source authorization.

Result optionally returns safe `defaultPlanning.relationshipResponse` for the
authorized path, with frozen labels, cap, Hypothesis classification and at most
three sample comparisons. Actual amount requires a controlled selected Event;
not-selected/not-triggered/inactive amounts stay null. Strategy paths never inherit
main-path samples. Internal IDs, evidence references and symbolic source provenance
are excluded. SQL completion validates the causal request/response chain, source
binding and per-sample budgets before the existing mandatory completion gates.
Mock transport/runtime checks are functional evidence, not actual DB/RLS acceptance.

### Readonly next-run correction preparation candidate (2026-10-13)

`GET /api/sandbox/runs/[runId]/correction-context` requires a verified,
non-anonymous owner and an owned completed formal Run. It revalidates the frozen
typed model/rules and requires exact compatibility with the latest submitted Seed,
latest locked safe Graph, Agent ordering/bindings and current Profile content and
revision. Legacy absence, incomplete Runs, stale sources and invalid frozen models
fail closed. It never restores a source from a newer unrelated chain.

The strict DTO contains the original `frozenRules`, safe selectors, horizon and
`draftRules` whose action/strategy confirmations are all false. All four
`permissionsReset` flags are true: planning, symbolic, outcomeCalibration and
requestIdentity. It returns no old planning/symbolic/outcome permission or request
key and performs no write, Run admission or historical mutation.

Responses use no-store and the existing envelope: 401 unauthenticated/anonymous,
404 missing/foreign Run, 409 legacy/incomplete/stale/invalid source, 422 malformed
UUID or any query parameter, and sanitized 500 persistence failure. The typed
browser client now consumes this readonly preparation API for Result's explicit
correction-and-rerun entry. `/app/start?revise_run=<opaque selector>` accepts one
UUID selector only; duplicate, malformed and unknown query fields are rejected.
Ordinary Start still opens new scenario preparation.

Before showing the source draft, Start independently reads the current safe
model context and compares exact Graph/Agent identity, Profile revision, ordered
participant/relationship labels and complete resource definitions. A stale async
generation cannot apply its source. Each action and strategy starts unconfirmed;
changes reset the affected confirmation, and prerequisite changes reset dependent
actions. Confirmed revised rules use the existing Run POST with a new request key,
without old planning, symbolic or Outcome permissions. Independent current
permissions can be newly selected. An in-flight or unknown POST retains its full
original body and key for recovery, including across changed source props.

This connected UI and canonical Core execution are functional-candidate evidence.
Synthetic HTTP/DOM checks do not verify real database JSON-path transport, Auth/RLS,
atomic persistence, cross-account access or a real signed-in rerun.

### Current digital-life model draft API candidate (2026-10-13)

GET /api/sandbox/model-draft reads the authenticated, non-anonymous owner's
saved revision and current source projection. POST appends a draft revision.
Both routes return no-store and use the existing sandbox response envelope.
GET projects a saved v1 draft as v1 and a saved v2 draft as v2. When there is no
saved draft, the client initializes rules to the version of the read source,
including v2 when `signature_v2` is available. The explicit
`prepare_version=v2` query may additionally return a separate
`preparedSourceContext`; this read-only preparation does not save or upgrade a
stored draft. POST rejects every query parameter, including `prepare_version`.
The strict POST body has exactly version,
expectedRevision, idempotencyKey, horizonDays, sourceContext, and draftRules;
the horizon is 30 or 90 days and all action/strategy confirmation flags must be
false. Unknown request keys fail closed.

The read projection distinguishes current, stale, and not_saved.
sourceContext preserves the saved source and its ordered labels; the separate
currentSourceContext describes the source observed by that read. Stale rules
remain bound to their saved context and cannot be applied to current ordinals.

For a repeated owner/key, the original request receipt is checked before
reading mutable current sources. Canonical JSON comparison ignores object-key
order while preserving array order. An exact replay returns the original
revision; changed content with the same key conflicts. Because the replay is a
historical receipt, its response may have status=stale and a null
currentSourceContext; clients must issue GET after the receipt and verify that
the saved source is current before presenting it as today's model.

The authored SQL writer repeats replay, owner-global revision, source, and
draft-rule checks inside its transaction. These are candidate contracts, not
evidence that the migration or database RPCs have run. Auth/RLS, actual
compare-and-swap concurrency, cross-device persistence, and database replay
remain unverified.

Malformed or extra-query requests map to 422, unauthenticated/anonymous access
to 401, stale or conflicting source/revision/key requests to 409, and sanitized
persistence failures to 500. A first append returns 201; an idempotent receipt
returns 200. Error and success responses are no-store and do not persist the
response trace identifier.

#### Explicit Profile-update reconciliation read (2026-10-16 candidate)

`GET /api/sandbox/model-draft?prepare_version=v2&reconcile_revision=N` is the
explicit, read-only path for continuing a saved model after a Profile revision
changes. `N` must be a positive safe integer and must equal the authenticated
owner's latest saved draft revision. If another save has advanced that revision,
the route returns `409 revision_conflict` before the extra scope lookup.

The route prepares the current v2 source and returns the ordinary draft, a
separate `preparedSourceContext`, and a strict
`digital-life-model-reconciliation-v1` plan. A plan is available only when the
Profile revision strictly increased and the saved draft still belongs to the
same submitted Seed, locked Graph, Agent snapshot, ordered Agents, and ordered
relationships. In this branch only, the server makes an additional owner/RLS
scoped lookup of the saved revision's Seed id and requires it to match the
current source Seed. A changed Seed, Graph, Agent snapshot, ordered participant
or relationship source, non-increasing Profile revision, or inconsistent row
fails closed with `409 model_reconciliation_scope_changed`. This is a pair of
read-only checks, not an atomic snapshot; the existing Save compare-and-swap and
source validation remain authoritative. If no valid current v2 source can be
prepared, the route fails closed with the existing `409 model_source_stale`.

The plan keeps the saved source and rules unchanged and lists explicit
requirements for each old resource selector, environment-variable selector,
and Profile-linked commitment. It does not choose a current selector by ordinal,
label, or inferred identity. The existing `GET` and
`GET ...?prepare_version=v2` contracts remain unchanged. `POST` still rejects
all query parameters. The reconciliation read adds no write, migration, table,
source version, or Run permission. Invalid or duplicate query parameters return
422; authentication and persistence failures retain the existing 401/500
envelope.

### World guard v3 draft and Run diagnostics candidate (2026-10-19)

`GET /api/sandbox/model-draft?prepare_version=v3` accepts exactly that one
query parameter and requires the authenticated, non-anonymous owner. It returns
the ordinary saved-draft projection, the separate read-only
`preparedSourceContext`, and this strict `preparedProtocol`:
`{version:"digital-life-model-draft-protocol-v3",draftVersion:"digital-life-model-draft-v3",rulesVersion:"digital-life-rules-v3"}`.
Preparation writes nothing and does not upgrade a saved v1 or v2 draft. A v3
save is a separate append through the existing POST body shape, with
`version:"digital-life-model-draft-v3"` and v3 rules. Its source remains the
existing `digital-life-model-draft-source-v2` context and `signature_v2`
binding; no third source-signature protocol is introduced. POST accepts no
query parameters, requires every draft action and strategy to remain
unconfirmed, and keeps receipt-first replay, owner-global revision, strict
source checks, and same-key/different-body conflict behavior. Existing v1/v2
saved drafts and their replay contracts remain unchanged.

Run POST keeps the existing typed request envelope and accepts v3 only as
`digital_life_rules`. Guards are part of each action rule; they do not add a
new request or top-level bundle field. Run preparation and execution continue
to bind the locked Graph, Agent snapshot, and exact Reality Profile revision.
For v3, HTTP 409 with `error_code:"no_eligible_actions"` and the strict safe
`pathDiagnostics` projection applies only when an entire path has zero
selected Core Events across all three samples. A sample or path that has at
least one selected Event may legally end before later ticks; those
`not_reached` ticks do not by themselves make the Run ineligible. The 409
diagnostic has status `not_saved`: no Simulation, Run result, Claim, or Report
is created from that attempt.

The diagnostic is split by path, sample, and executed tick. A selected
candidate may carry a textual step reference only when the Core selected its
corresponding proposal and produced that actual Event; this is display text,
not a clickable link. Temporary diagnostics do not expose a formal step link.
`not_selected` means an offered
candidate lost Core selection. `not_reached` means the simulation did not
execute that tick; it carries no made-up state value, selection, or promise of
later waiting. A due but unsatisfied guard or otherwise ineligible operation
does not appear as a selected Event. The exact safe fields and enums are in the
[World guard data contract](DATA_CONTRACTS.md#world-guard-rules-v3-candidate-2026-10-19).

For an unknown Run response, the client retains the exact original body and
idempotency key, locks edits and source refresh, and only replays that request.
The v3 no-eligible RPC stores a validated terminal receipt on the existing
reservation and returns the same diagnostics for an exact-key replay before
checking mutable sources or expiry. This terminal receipt is not a saved Run.
After a known no-eligible response the UI unlocks editing, clears rule and
separate planning/relationship/outcome confirmations, and requires fresh
confirmation and a new key for a changed attempt. Reusing an old key with
changed content conflicts. The forward migration is authored source; database
execution and owner/RLS acceptance remain unverified.

Focused functional/source verification is recorded in the
[World guard v3 TDD log](testing/world-guards.tdd.md): independent review/runtime
30/30, SQL-source 22/22, and UI 7/7 pass. This is functional/source-candidate
readiness only; it does not assert PostgreSQL/pgTAP, Auth/RLS, full-suite, or
phase acceptance.

### Track A life timeline result projection candidate (2026-10-19)

The existing read-only `GET /api/sandbox/runs/[runId]/result` projection may
include an optional safe `timeline` for the main path and each strategy path.
The server derives it from the existing frozen Run bundle and recorded Core
steps/events; this adds no route, request field, write operation, persisted raw
trace, or bundle/runtime/writer version. Contract details and compatibility
rules are in the [life timeline data contract](DATA_CONTRACTS.md#track-a-life-timeline-result-projection-candidate-2026-10-19).

Legacy results without `trajectoryAnalysis` retain their existing steps and
have no timeline. A valid old analysis without a typed digital-life model also
keeps only its existing steps: it is not rerun or backfilled. If
`trajectoryAnalysis` is present but malformed or inconsistent, projection
rejects it rather than silently falling back to a partial timeline.

### Reality review loop v2 candidate (2026-10-19)

`GET /api/sandbox/runs/[runId]/outcomes` keeps the existing outcome envelope.
For a frozen `formal-reality-criteria-v2` main-path target, its safe projection
may add `criteriaVersion`, progressive `review` groups, and derived
`correctionRequirements`. Those requirements bind a correctable rule and
operation condition to the exact request and source/scope-confirmation
condition keys. They are computed for the API projection; they are not fields
of `frozenRealityCriteria` and do not enter its fingerprint.

`POST` keeps the strict existing request shape. A partial typed review sends
unknown or unfilled condition values as `null`; v2 request-false observations
omit occurrence time. These targets remain `not_observable` as whole Core
clusters, so a save records `observed:"uncertain"` plus the user's separate
condition observations; it does not score the whole scenario. An unknown
response retains the exact original request body and idempotency key for
replay. A successful save does not alter the Run and may link to
`/app/start?revise_run=<runId>` to prepare a separate run.

Outcome correction selection remains opt-in: absent `outcome_calibration` is
the default. If supplied, the existing Run POST field requires version 1, one
to six distinct correction keys, and `confirmed:true`. Saving an observation
does not select or apply a correction automatically. The optional main-path
`usedCorrections` Result receipt is validated against the current frozen input
and the same owner's completed source Run. Missing source data preserves the
Result with an empty `source_unavailable` receipt; contradictory or tampered
source/rule/event data rejects the safe projection. Per-sample `executed` and
`not_executed` entries refer to actual selected Events. Full endpoint semantics
and evidence limits are in the [reality review TDD record](testing/reality-review-loop.tdd.md).
