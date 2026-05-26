# Project MiroFish Product Quality Plan

Status: Local product-quality focus.

This plan pauses launch, Stripe, production deployment, production payment,
production database migration, and service-role production writer work. The
current goal is product completeness and product quality for the local MVP
loop.

The plan does not authorize runtime code changes by itself. It defines the
quality bar for future scoped tasks.

## 1. Current Local Product Loop

The current local loop is:

`/app/dashboard -> /app/new/scene -> /app/new/intake -> /app/new/people -> /app/new/agents -> /app/new/graph -> /app/simulation/running -> /app/simulation/result`

The local product loop must remain usable through the sample flow and through a
manually entered scenario. It currently depends on local repositories and local
draft ledgers, not production writers.

Required local artifact chain:

1. Scene selection frames one sandbox run.
2. Intake creates a `SeedContextDraft` with scenario text, recent events, key
   people hints, options, forbidden actions, desired output, time window, and
   safety acknowledgement.
3. People confirmation creates confirmed `KeyPersonDraft` records through
   deterministic extraction, manual supplement, merge, delete, rename, and note
   flows.
4. Agent confirmation creates `AgentProfileDraft` records for the user core,
   optional cautious and decisive parallel selves, and one NPC per confirmed
   person.
5. Graph review creates read-only `RelationEdgeDraft` records, saves a
   `RelationGraphDraft`, and requires graph lock before simulation.
6. Simulation running freezes Agent Profiles and Relation Edges, runs
   deterministic branch ticks, writes Event Logs, and builds Claims only after
   Event Logs exist.
7. Result sandbox reads frozen Agents, Relation Edges, Event Logs, Claims, and
   Report Engine v1 output. Free preview and full report depth use the same
   evidence-backed claim set.
8. Feedback calibration appends local feedback and creates a next-run
   calibration profile without mutating historical Event Logs or Claims.

The local loop is healthy only when a user can understand what was extracted,
what became an agent, what became a relation edge, what changed during ticks,
which events support each claim, and how feedback affects only future runs.

## 2. Product Completeness Goals

Completeness means the local MVP feels like a coherent AI Life Simulator and
relationship/decision sandbox, not a collection of technical screens.

Product completeness goals:

- The main flow has no dead ends for a valid sample case.
- Every screen explains its product job through the UI itself, not through
  developer-oriented prose.
- Each step exposes the right evidence, confidence, and next action before the
  user continues.
- Local deterministic logic produces recognizable people, credible bounded
  agents, a readable read-only graph, event-backed scenario movement, and
  claims with `evidence_event_ids`.
- Failure and not-ready states give concrete fixes.
- The paid-depth boundary demonstrates value through evidence depth and
  strategy depth only; it does not promise a truer result.
- Safety downgrade remains visible and non-bypassable.
- Feedback calibration is easy to understand as next-run calibration, not as a
  rewrite of the current report.

Quality goals:

- The product should feel calm, inspectable, and evidence-led.
- The interface should reward review and comparison, not confession, chatting,
  or passive report reading.
- The sample flow should work after every scoped product-quality task.
- Copy must avoid fate, mind-reading, therapy, professional advice, and
  fear-based payment language.

## 3. Page-By-Page Improvement Plan

### `/app/new/scene`

Current role: choose Track A or Track B, one scenario domain, and start a new
sandbox or sample flow.

Improve:

- Make track selection feel like a concrete simulation setup decision.
- Persist or clearly carry selected track, scenario, and horizon into intake
  when implementation is scoped.
- Keep one-domain framing prominent so the MVP does not drift into broad life
  prediction.
- Show the next local artifacts: Seed Context, Key People, Agents, Graph,
  Events, Claims, Feedback.

Acceptance:

- A user understands that this is the first step of a scenario sandbox.
- The page does not read as a landing page, questionnaire, chatbot entry, or
  fortune report.

### `/app/new/intake`

Current role: structured situation telling with local `SeedContextDraft` save
and deterministic SafetyVerifier check.

Improve:

- Strengthen field hierarchy so users know what evidence belongs in each field.
- Preserve the natural-language feel while making required evidence anchors
  clear.
- Improve safety and privacy acknowledgement copy so it is concise but firm.
- Make blocked and downgraded states more actionable.
- Keep the sample text high quality and representative of the Golden Cases.

Acceptance:

- Valid intake can be saved and continued to people confirmation.
- High-risk intake cannot proceed to strong generation.
- The page does not feel like a chat prompt, therapy intake, or dry form.

### `/app/new/people`

Current role: confirm, rename, merge, delete, supplement, and note Key People
before agent generation.

Improve:

- Make candidate source, evidence, confidence, and missing fields faster to
  scan.
- Make merge behavior and evidence preservation clearer.
- Distinguish excluded people from confirmed people without making the page
  feel like CRM contact management.
- Clarify that "Smart identify" may use gated extraction or local fallback, but
  candidates still require review.
- Keep all relation weights completely absent from user controls.

Acceptance:

- At least one confirmed person can move into Agent Profile generation.
- Deleted and merged people remain out of generation.
- No UI invites direct trust, hostility, dependency, attraction, competition,
  information gap, resource control, or emotional debt editing.

### `/app/new/agents`

Current role: generate and review local Agent Profile drafts for user core,
parallel selves, and confirmed NPCs.

Improve:

- Make the difference between "simulation model" and "truth claim" visually
  obvious.
- Improve source and confidence display for each agent field.
- Make missing or low-confidence fields easier to notice.
- Clarify that parallel selves are comparison branches, not RPG characters.
- Ensure save and regenerate states are explicit before continuing to graph.

Acceptance:

- Every confirmed person maps to one NPC agent.
- User core and optional cautious/decisive self variants are present.
- Agent Profiles remain bounded, evidence-linked drafts and do not make hidden
  motive or private-thought claims.

### `/app/new/graph`

Current role: generate and inspect a read-only relation graph, then lock it for
simulation.

Improve:

- Strengthen graph readability across node, edge, summary card, and drawer
  states.
- Make Graph Lock status impossible to miss.
- Make "supplement facts upstream, then regenerate" the only correction path.
- Improve explanations for relation weights using user-language labels.
- Keep the Result Sandbox graph components reusable and visually consistent.

Acceptance:

- Simulation cannot start without a locked graph.
- The page has no edge sliders, editable relation controls, or CRM-style
  relation management.
- Evidence refs and confidence are inspectable without exposing internal
  scoring as editable knobs.

### `/app/simulation/running`

Current role: show deterministic simulation stages, branch previews, tick
previews, Event Log details, and Claims preparation.

Improve:

- Make stage progress feel like an inspectable engine run, not a spinner.
- Keep concrete not-ready fixes near the blocked state.
- Make branch differences easier to compare at a glance.
- Show Event Log count and Claim readiness as first-class quality signals.
- Avoid any mid-run choice prompts or story-game framing.

Acceptance:

- The page freezes a locked graph, runs deterministic tick stages, writes Event
  Logs before Claims, and routes to the Result Sandbox.
- Failures explain the missing prerequisite.
- Branch names remain `baseline`, `cautious_self`, and `decisive_self`.

### `/app/simulation/result`

Current role: display Report Engine v1 output, claims, timeline, evidence,
graph summaries, paid-depth boundary, and feedback calibration.

Improve:

- Prioritize Graph, Timeline, Claim Cards, Evidence Drawer, and Feedback as the
  core result surfaces.
- Improve click behavior so Claim selection visibly connects Agents, Edges, and
  Event Logs.
- Make free preview versus full report depth clearer while preserving the same
  claim set.
- Make paid-depth language about complete Event Logs, NPC paths, relation
  before/after, branch comparison, key variables, and strategies.
- Make feedback calibration feel like a natural last step of the simulation
  loop.

Acceptance:

- Claims without `evidence_event_ids` are hidden.
- Paid mode does not create Claims, raise confidence, change risk level, or
  bypass safety downgrade.
- Feedback saves calibration input without mutating historical Event Logs or
  Claims.

## 4. Core Capability Improvement Plan

### Seed Context

- Preserve one scenario, one track, one time horizon, and one main question per
  run.
- Improve evidence density by making recent events, decision options,
  forbidden actions, and desired output useful to downstream builders.
- Keep local drafts as valid MVP artifacts until repository migration is
  explicitly approved.

### Key People

- Improve deterministic candidate quality from richer intake fields.
- Require user confirmation before agent generation.
- Preserve evidence refs through merge, delete, rename, and supplement flows.
- Keep third-party private thoughts out of high-confidence outputs.

### Agent Profiles

- Improve source labels, field-source coverage, confidence display, and missing
  field handling.
- Keep model fields bounded to simulation behavior, not biography or hidden
  intent.
- Make user core, parallel self variants, and NPC agents easy to compare.

### Relation Graph

- Improve relation type readability, graph layout, edge drawer explanations,
  and evidence entry points.
- Keep graph read-only and locked before simulation.
- Treat graph regeneration as a downstream result of upstream fact changes.

### Simulation Engine

- Preserve deterministic state transitions and branch policies.
- Improve tick summaries, branch comparison, graph snapshots, and before/after
  edge deltas.
- Ensure every non-empty tick has Event Log evidence.
- Keep LLM output outside final state transitions.

### Event Logs And Claims

- Improve claim grouping and summaries without weakening evidence rules.
- Claims must always reference existing Event Log ids.
- Claim confidence and risk level must come from event evidence, not paid state
  or report copy.

### Report Engine

- Make free preview useful but limited.
- Make full report depth inspectable through evidence chains, involved agents,
  relation edge deltas, branch comparison, and strategy options.
- Preserve invariants:
  - paid does not create claims
  - paid does not raise confidence
  - paid does not change risk level
  - paid does not bypass safety restrictions

### Feedback Calibration

- Expand feedback clarity for claims, agents, relation judgments, strategies,
  and overall usefulness.
- Calibration may affect future runs only.
- Historical Event Logs, Claims, Reports, and relation edge snapshots must not
  be rewritten by feedback.

## 5. Visual System Improvement Plan

The visual system should feel like a calm evidence workstation for scenario
simulation.

Principles:

- Use restrained, readable layouts built for scanning and comparison.
- Keep cards for repeated objects, drawers, and framed tools; avoid nested card
  compositions.
- Use consistent status colors for ready, planned, blocked, downgraded, locked,
  and saved states.
- Keep graph, timeline, evidence, and claim surfaces visually connected.
- Use compact typography inside cards and panels; reserve large type for page
  titles.
- Avoid one-note palettes. The current green, off-white, dark ink, amber, and
  neutral system should stay balanced.
- Keep button text short and action-specific.
- Ensure mobile layouts preserve scan order: page intent, current status,
  primary action, evidence content, secondary controls.
- Do not decorate the app into a mystical, therapeutic, fantasy, or marketing
  style.

Key reusable visual patterns:

- Status pill for readiness, lock, downgrade, and completion states.
- Evidence drawer for claim-to-event inspection.
- Relation edge drawer for graph evidence and weight explanations.
- Metric strip for artifact counts.
- Timeline feed for simulation events.
- Not-ready panel for concrete fixes.
- Feedback panel for calibration.

## 6. Product Copy Rules

Allowed framing:

- Scenario simulation.
- Relationship dynamics.
- Digital agents.
- Sandbox.
- Event Log.
- Evidence chain.
- Confidence.
- Risk window.
- Opportunity window.
- Strategy options.
- Feedback calibration.

Copy rules:

- Say "suggests", "indicates", "shows a signal", or "review window" instead of
  deterministic predictions.
- Tie claims to Event Logs, Agents, Relation Edges, confidence, and evidence.
- Describe paid depth as more complete evidence and strategy detail, not more
  truth.
- Phrase actions as options, preparation, communication, observation,
  boundaries, or information gathering.
- Use concrete user language for graph weights:
  - `trust` = trust base
  - `hostility` = conflict pressure
  - `dependency` = dependency level
  - `informationGap` = information gap
  - `resourceControl` = resource control
  - `emotionalDebt` = emotional debt

Forbidden copy:

- Fate is certain.
- Guaranteed to happen.
- Destined.
- We know what the other person really thinks.
- This person will definitely do X.
- Pay to reveal the truth.
- Pay to avoid disaster.
- Any fortune-telling, astrology, mind-reading, therapy, professional advice,
  or fear-based payment identity.

## 7. Golden Case Acceptance Criteria

Golden Case quality must be evaluated through the local deterministic product
loop and `src/lib/golden-cases/full-product-cases.ts`.

Golden Cases:

1. Relationship Crossroad.
2. Career Conflict.
3. Collaboration Risk.

Acceptance for each case:

- Seed Context is generated.
- Key People are extracted and confirmable.
- Agent Profiles are generated for user core, optional parallel selves, and
  confirmed NPCs.
- Read-only Relation Graph is generated and locked before simulation.
- Simulation Engine v1 generates ticks for supported branches.
- Every non-empty tick has Event Log evidence.
- Claims are generated only after Event Logs exist.
- Every visible Claim has non-empty `evidenceEventIds`.
- Report Engine v1 produces `freePreview` and `paidReport` from the same
  evidence-backed claim set.
- Paid report invariants pass:
  - no new Claims
  - no confidence increase
  - no risk level change
  - no Stripe source
  - no safety bypass
- Feedback appends calibration input and does not mutate historical Event Logs
  or Claims.
- `modelVersion` remains `unreleased`.
- `costCents` remains `0`.
- The graph remains read-only and has no edge editing path.

Manual product acceptance:

- The sample sandbox can be loaded and completed through Result Sandbox.
- The user can explain why each claim appears by following evidence ids back to
  Event Logs and relation edges.
- The result does not read as fate, therapy, CRM, RPG, or chatbot output.

Required check:

```powershell
npm run check
```

## 8. Explicitly Out Of Scope For Now

The following work is paused and must not be reopened by product-quality tasks
unless a later task explicitly changes scope:

- Launch.
- Stripe.
- Production payment.
- Real checkout sessions.
- Real payment writes.
- Production entitlement grants.
- Production deployment.
- Production database migration or production database writes.
- Service-role production writers.
- Browser exposure of service-role keys.
- Privileged generated-artifact writes.
- Production admin mutation tools.
- Real LLM generation unless separately scoped and gated.

Paused work must not be replaced by workaround production writes. Local sample
flow, deterministic builders, local repositories, mock entitlement behavior,
and Golden Case acceptance remain the active product-quality surface.

## Non-Goals

Product-quality work must not turn MiroFish into:

- A chatbot.
- A fortune-telling app.
- A therapy product.
- A CRM.
- An RPG or continuous story-choice game.
- A broad all-life prediction engine.
- A report generator detached from Agents, Relation Edges, Event Logs, and
  Claims.

The local product scope should be improved, not reduced.
